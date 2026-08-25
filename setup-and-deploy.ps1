[CmdletBinding()]
param(
  [switch]$SkipInstall,
  [switch]$SkipBuild,
  [switch]$ApplyDatabaseSchema,
  [switch]$ConfirmSchemaChange,
  [switch]$ConfirmDatabaseBackup,
  [switch]$ValidateProductionEnvironment,
  [switch]$MigrateData,
  [switch]$ConfirmDataMigration,
  [switch]$DeployMediaWorker,
  [switch]$DeployFirebase,
  [string]$ProductionUrl = ""
)

$ErrorActionPreference = "Stop"
$ProjectRoot = $PSScriptRoot
Set-Location -LiteralPath $ProjectRoot
$env:JITI_CACHE = "false"

# Load local environment files into this process without printing values.
foreach ($EnvironmentFile in @(".env", ".env.local")) {
  $EnvironmentPath = Join-Path $ProjectRoot $EnvironmentFile
  if (-not (Test-Path -LiteralPath $EnvironmentPath)) { continue }
  foreach ($Line in Get-Content -LiteralPath $EnvironmentPath) {
    $Trimmed = $Line.Trim()
    if (-not $Trimmed -or $Trimmed.StartsWith("#") -or -not $Trimmed.Contains("=")) { continue }
    $Parts = $Trimmed.Split("=", 2)
    $Name = $Parts[0].Trim()
    $Value = $Parts[1].Trim()
    if (($Value.StartsWith('"') -and $Value.EndsWith('"')) -or ($Value.StartsWith("'") -and $Value.EndsWith("'"))) {
      $Value = $Value.Substring(1, $Value.Length - 2)
    }
    if ($Name -match '^[A-Za-z_][A-Za-z0-9_]*$') {
      [Environment]::SetEnvironmentVariable($Name, $Value)
    }
  }
}

function Step([string]$Message) { Write-Host "`n==> $Message" -ForegroundColor Cyan }
function Run([string]$File, [string[]]$Arguments) {
  & $File @Arguments
  if ($LASTEXITCODE -ne 0) { throw "$File failed with exit code $LASTEXITCODE." }
}
function Required([string]$Name) {
  $value = [Environment]::GetEnvironmentVariable($Name)
  if ([string]::IsNullOrWhiteSpace($value)) { throw "Required environment variable $Name is missing." }
}

Write-Host "Kidzee CentreOS - safe setup, validation and deployment" -ForegroundColor Magenta
if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot "package.json"))) { throw "Run this script from the project root." }

Step "Checking required local tools"
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw "Node.js is not installed." }
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) { throw "npm is not installed." }

if (-not $SkipInstall) {
  Step "Checking locked project dependencies"
  & npm.cmd ls --depth=0 --silent *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Existing project dependencies are complete; no native files need replacement." -ForegroundColor Green
  } else {
    Step "Installing locked project dependencies"
    Run "npm.cmd" @("ci", "--no-audit", "--no-fund")
  }
}

Step "Formatting and validating the Prisma schema"
Run "npx.cmd" @("prisma", "format")
Run "npx.cmd" @("prisma", "validate")
Run "npm.cmd" @("run", "validate:migrations")
Run "npm.cmd" @("run", "test:migrations:fresh")
Run "npm.cmd" @("run", "test:migrations:deploy")

Step "Generating the Prisma client"
Run "npx.cmd" @("prisma", "generate")

Step "Running TypeScript, lint, tests and Firebase safety checks"
Run "npm.cmd" @("run", "typecheck")
Run "npm.cmd" @("run", "lint")
Run "npm.cmd" @("test")
Run "npm.cmd" @("run", "validate:firebase")

if ($ValidateProductionEnvironment -or $DeployFirebase -or -not [string]::IsNullOrWhiteSpace($ProductionUrl)) {
  Step "Validating the complete production environment"
  Run "npm.cmd" @("run", "validate:env")
}

if (-not $SkipBuild) {
  Step "Creating the production Next.js build"
  Run "npm.cmd" @("run", "build")
}

Step "Building the background Functions package"
if (-not $SkipInstall) {
  & npm.cmd ls --prefix functions --depth=0 --silent *> $null
  if ($LASTEXITCODE -eq 0) {
    Write-Host "Existing Functions dependencies are complete." -ForegroundColor Green
  } else {
    Run "npm.cmd" @("ci", "--prefix", "functions", "--no-audit", "--no-fund")
  }
}
Run "npm.cmd" @("run", "build", "--prefix", "functions")

Step "Checking the optional Cloud Run media worker"
Run "node.exe" @("--check", "media-worker/server.js")

# Apply the external database change only after every local verification has
# passed. The correction installer can then restore files safely without
# leaving an unverified code version paired with the updated database.
if ($ApplyDatabaseSchema) {
  if (-not $ConfirmSchemaChange) { throw "Database schema changes require both -ApplyDatabaseSchema and -ConfirmSchemaChange." }
  if (-not $ConfirmDatabaseBackup) { throw "Confirm the provider database backup before applying migrations with -ConfirmDatabaseBackup." }
  Required "DIRECT_URL"
  Step "Reconciling any schema previously created by Prisma db push"
  Run "npm.cmd" @("run", "prepare:migrations")
  Step "Applying the complete versioned Prisma migration history"
  Run "npx.cmd" @("prisma", "migrate", "deploy")
  Run "npx.cmd" @("prisma", "migrate", "status")
} else {
  Write-Host "Database schema was not changed. When ready, rerun with -ApplyDatabaseSchema -ConfirmSchemaChange." -ForegroundColor Yellow
}

if ($DeployMediaWorker) {
  if (-not (Get-Command gcloud -ErrorAction SilentlyContinue)) { throw "Google Cloud CLI is not installed. Install it before using -DeployMediaWorker." }
  Required "FIREBASE_PROJECT_ID"
  if (-not $SkipInstall) { Run "npm.cmd" @("ci", "--prefix", "media-worker", "--no-audit", "--no-fund") }
  Step "Deploying the authenticated, scale-to-zero video processor"
  Run "gcloud.cmd" @(
    "run", "deploy", "kidzee-gallery-media-worker",
    "--source", "media-worker",
    "--project", $env:FIREBASE_PROJECT_ID,
    "--region", "asia-south1",
    "--platform", "managed",
    "--no-allow-unauthenticated",
    "--min-instances", "0",
    "--max-instances", "2",
    "--memory", "2Gi",
    "--cpu", "1",
    "--timeout", "900"
  )
  $MediaWorkerUrl = (& gcloud.cmd run services describe kidzee-gallery-media-worker --project $env:FIREBASE_PROJECT_ID --region asia-south1 --format "value(status.url)").Trim()
  if (-not $MediaWorkerUrl) { throw "The media worker deployed, but its service URL could not be read." }
  Write-Host "Media worker URL: $MediaWorkerUrl" -ForegroundColor Green
  Write-Host "Set MEDIA_WORKER_URL=$MediaWorkerUrl for the Firebase Functions runtime, then deploy Functions." -ForegroundColor Yellow
  Write-Host "Grant the Firebase Functions runtime service account Cloud Run Invoker access to this service." -ForegroundColor Yellow
}

if ($MigrateData) {
  if (-not $ConfirmDataMigration) { throw "Data migration requires both -MigrateData and -ConfirmDataMigration." }
  Required "FIREBASE_PROJECT_ID"
  Required "FIREBASE_SERVICE_ACCOUNT_JSON"
  $PreviousConfirmation = [Environment]::GetEnvironmentVariable("MIGRATION_CONFIRM")
  try {
    [Environment]::SetEnvironmentVariable("MIGRATION_CONFIRM", "copy-prisma-to-firestore")
    Step "Copying existing operational records to Firestore (idempotent; no source deletion)"
    Run "node.exe" @("scripts/migrate-prisma-to-firestore.mjs", "--execute")
  } finally {
    [Environment]::SetEnvironmentVariable("MIGRATION_CONFIRM", $PreviousConfirmation)
  }
} else {
  Write-Host "Data migration was not run. A dry run is available with: node scripts/migrate-prisma-to-firestore.mjs" -ForegroundColor Yellow
}

if ($DeployFirebase) {
  if (-not (Get-Command firebase -ErrorAction SilentlyContinue)) { throw "Firebase CLI is not installed. Run: npm install -g firebase-tools" }
  Required "FIREBASE_PROJECT_ID"
  Step "Checking Firebase login and selected project"
  Run "firebase.cmd" @("login:list")
  Run "firebase.cmd" @("use", $env:FIREBASE_PROJECT_ID)
  Step "Deploying deny-by-default rules, indexes and background Functions"
  Run "firebase.cmd" @("deploy", "--only", "firestore:rules,firestore:indexes,storage,functions")
  Write-Host "App Hosting rollout still requires the Firebase Console backend/GitHub connection the first time. Firebase will then deploy the apphosting.yaml configuration from the selected branch." -ForegroundColor Yellow
}

if (-not [string]::IsNullOrWhiteSpace($ProductionUrl)) {
  if (-not $ProductionUrl.StartsWith("https://")) { throw "ProductionUrl must use HTTPS." }
  Step "Checking the production website"
  $BaseUrl = $ProductionUrl.TrimEnd("/")
  foreach ($Path in @("/", "/programmes", "/admissions", "/careers", "/api/website/internal-status")) {
    $Response = Invoke-WebRequest -Uri "$BaseUrl$Path" -Method Get -UseBasicParsing -TimeoutSec 30
    if ($Response.StatusCode -lt 200 -or $Response.StatusCode -ge 400) { throw "Post-deployment check failed for $Path." }
    Write-Host "OK $Path ($($Response.StatusCode))" -ForegroundColor Green
  }
}

Write-Host "`n# GO LIVE TODAY" -ForegroundColor Green
Write-Host "1. Confirm the provider backup, then run this script with -ApplyDatabaseSchema -ConfirmSchemaChange -ConfirmDatabaseBackup."
Write-Host "2. Create/select the Firebase project and set FIREBASE_PROJECT_ID."
Write-Host "3. Add the apphosting.yaml secrets in Firebase App Hosting / Secret Manager."
Write-Host "4. Rerun with -MigrateData -ConfirmDataMigration after the dry-run totals are reviewed."
Write-Host "5. Rerun with -DeployFirebase after Firebase CLI login."
Write-Host "6. For large reels, rerun with -DeployMediaWorker and connect MEDIA_WORKER_URL before publishing video."
Write-Host "7. Connect the GitHub branch to Firebase App Hosting and point kidzeedwarka.com DNS when the preview is approved."
Write-Host "8. Rerun with -ProductionUrl https://kidzeedwarka.com for final public checks."
Write-Host "`nAll requested automated checks completed safely." -ForegroundColor Green
