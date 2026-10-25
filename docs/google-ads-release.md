# Google Ads conversion and reporting release

Status: prepared and tested locally; not deployed or activated by this change.
Account: 3462690519. Website: https://kidzeedwarka.com.

## Behavior

- Google Ads advanced consent mode is enabled by the App Hosting manifest for the direct Google tag. With no marketing consent, defaults remain denied, advertising data redaction is enabled and URL passthrough is disabled. Future successful admission-form events can emit a cookieless conversion ping. Its payload contains no name, phone, email, enquiry ID, transaction ID, or URL query/fragment identifiers. GA4, Meta, phone conversions and offline matching retain their consent gates. Admin/staff/test traffic remains excluded. Unreviewed GTM containers do not use the advanced path.
- This does not retroactively upload a declined lead or guarantee that Google will report a modeled conversion. Modeling has eligibility thresholds and reporting delays. CRM remains the count of saved enquiries.
- Internal navigation preserves the paid acquisition, while a genuinely new acquisition replaces last touch without borrowing another source's click ID.
- Google jobs require an eligible genuine consented admission submission. Re-enqueueing no longer rewrites the original event payload. Missing provider configuration waits for configuration instead of consuming all delivery attempts.
- An explicitly configured Sheet transport stays on that transport if a response is ambiguous. An API fallback after a Sheet timeout could count the same lead against another action, so it is no longer attempted. The configured webhook must be HTTPS on script.google.com and use its dedicated shared secret.
- Direct API uploads hash E.164 phone numbers including the country-code plus sign, format timestamps to whole seconds and require a populated successful per-row result with no partial failure.
- A succeeded job means handoff to its integration; a Sheet row still requires a successful Google Ads import. The panel now says this explicitly.
- The delivery worker writes a heartbeat. Old unresolved jobs remain visible beyond the 30-day performance window.
- The new Google Ads reporting script sends campaign totals only, without parent or student information. It queries identities separately so zero-activity supported campaigns are retained. Live verification found Google Ads Scripts omits this account's two legacy Smart campaigns through both search and report, even with an explicit Smart filter. The panel discloses this coverage limit; never substitute invented Smart campaign metrics. The receiver authenticates a dedicated token, verifies account/currency/timezone, validates the exact last 30 complete account days, converts micros once, deduplicates campaign IDs and shared budgets, and updates the daily snapshot idempotently.
- Snapshots older than 36 hours are marked stale. Sample metric defaults are removed. Cost comparisons require a fresh automatic snapshot, and CentreOS lead/payment queries use its reporting dates.

## Deployment prerequisites and order

1. Preserve the existing deployed version for rollback. Do not merge this change into an automatic production release before the credentials below are configured.
2. Set CENTREOS_CONVERSION_SPREADSHEET_ID in the existing Apps Script properties to the ID of its existing Google Ads Conversions spreadsheet. The webhook opens this file explicitly because web-app requests do not have an active spreadsheet. Keep the existing Sheet1 headers and mappings; the authenticated, read-only health check validates all six columns without appending rows.
3. Add GOOGLE_ADS_SHEET_WEBHOOK_SECRET (at least 32 random characters) to App Hosting runtime configuration. Set the identical value as the CENTREOS_WEBHOOK_SECRET property in the existing CentreOS Auto Lead Sync Apps Script. Keep the current deployment URL, Sheet1 columns and Data Manager mappings. Do not expose the secret in source, URLs, screenshots or logs.
4. Deploy the application with that secret, then deploy scripts/google-ads-sheet-webhook.gs as a new version of the existing web app. Old application versions without the secret will be rejected after the authenticated script is deployed; coordinate the rollout. Test a synthetic row only in a separate test Sheet. Do not send fabricated GCLIDs to production Ads.
5. For daily campaign snapshots, add GOOGLE_ADS_SNAPSHOT_SECRET (a different random value of at least 32 bytes) and GOOGLE_ADS_CUSTOMER_ID=3462690519 to App Hosting runtime configuration. Keep the reporting credential separate from the marketing cron and staff-device credentials.
6. Install scripts/google-ads-centreos-sync.gs in this Google Ads account, put the reporting secret in its configuration, authorize the requested scope, run Preview (sends nothing), then run once and schedule daily. It cannot change budgets, ads or bidding. The receiver uses the same timezone as the account, and periodEnd is exclusive.
7. Keep the existing Firebase retryMarketingConversions function scheduled every 15 minutes, with the same MARKETING_CRON_SECRET as App Hosting. Its new heartbeat should appear within 45 minutes of a successful run. A heartbeat confirms the worker ran; it does not confirm all providers accepted their rows.
8. Review old DEAD jobs individually after fixing configuration. Confirm genuine admission scope, consent, click eligibility and Google import history before requeueing any. Never replay the whole backlog, especially historic test records.
9. Review the changed visitor disclosure and privacy-policy copy before publishing the consent-mode behavior.

## Live acceptance required before scaling

- Tag Assistant shows default denied before tag configuration, then the actual choice on update. Decline keeps ad_storage, ad_user_data and ad_personalization denied. The Google conversion payload and URLs have no contact/enquiry/click identifiers. Grant allows normal measurement. Check withdrawal as well.
- Successful genuine admission form: saved once, emits one event. Failed or repeated submissions, career forms, staff and test traffic must not create production ad leads. With denial, no Sheet/API phone upload occurs.
- Real eligible ad-originated consented lead: original click IDs persist into CRM after navigation, the Sheet receives one normalized row and Google Ads Data Manager accepts it under the intended action. Validate qualification and confirmed admission separately. A direct URL visit or fabricated click ID cannot certify attribution.
- Reconcile CRM enquiries, Sheet rows, import errors, Google Conversions versus All conversions and the exact date range. They are different measures; do not force them to match.
- Verify reporting snapshot account and date range, campaign status and spend, zero values, stale warning and delivery heartbeat. No campaign needs to be enabled for these read checks.

## Verification

Focused tracking, consent, reporting, auth and adjacent regression tests: 66 passed.
TypeScript checking and changed-file ESLint checking pass. The Windows production build hit a filesystem EPERM during output-directory creation; full build success is not claimed. The new read-only GitHub Actions workflow runs the same tracking tests and an isolated migrated-database production build on Linux for every pull request. Do not deploy until that build passes.
A broader 61-test regression run had one existing receipt-copy expectation failure in untouched code: tests/phase2-workflows.test.mjs, receipt output states GST inclusive without printing a GST percentage. Do not misreport that broader run as fully passing.
No production database migration is required.

## Rollback

Revert the application commit and restore the prior Apps Script deployment together. Keep the previous deployment and settings until the new application and Script version have been verified. Disable the daily snapshot script if needed. Existing campaign settings, budgets and statuses are unchanged by this release. To stop cookieless Google measurement, set GOOGLE_ADS_ADVANCED_CONSENT_MODE=false and deploy; normal consent-gated behavior remains.

## Primary references

- https://developers.google.com/tag-platform/security/concepts/consent-mode
- https://developers.google.com/tag-platform/security/guides/consent
- https://support.google.com/google-ads/answer/10548233
- https://developers.google.com/google-ads/api/docs/conversions/upload-offline
- https://developers.google.com/google-ads/scripts/docs/concepts/reports
