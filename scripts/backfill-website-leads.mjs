import "dotenv/config";
import pg from "pg";

const connectionString =
  process.env.DIRECT_URL || process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DIRECT_URL or DATABASE_URL is required for the website lead backfill.",
  );
}

const client = new pg.Client({ connectionString });

await client.connect();

try {
  await client.query("BEGIN");

  await client.query(`
    INSERT INTO "WebsiteLeadSubmission" (
      "id",
      "submissionId",
      "enquiryId",
      "source",
      "enquiryType",
      "pageUrl",
      "landingPage",
      "referrer",
      "utmSource",
      "utmMedium",
      "utmCampaign",
      "utmContent",
      "utmTerm",
      "gclid",
      "fbclid",
      "receivedAt"
    )
    SELECT
      'lead_backfill_' || md5(e."id" || e."formSubmissionId"),
      e."formSubmissionId",
      e."id",
      CASE
        WHEN e."source" IN ('WEBSITE', 'FORMSPREE', 'GOOGLE_ADS', 'META_ADS')
          THEN e."source"
        ELSE 'WEBSITE'::"EnquirySource"
      END,
      'WEBSITE_ENQUIRY',
      e."latestPageUrl",
      e."latestLandingPage",
      e."latestReferrer",
      e."latestUtmSource",
      e."latestUtmMedium",
      e."latestUtmCampaign",
      e."latestUtmContent",
      e."latestUtmTerm",
      e."latestGclid",
      e."latestFbclid",
      e."updatedAt"
    FROM "Enquiry" e
    WHERE e."formSubmissionId" IS NOT NULL
    ON CONFLICT ("submissionId") DO NOTHING
  `);

  await client.query(`
    UPDATE "Enquiry"
    SET
      "source" = CASE
        WHEN "source" IN ('WEBSITE', 'FORMSPREE', 'GOOGLE_ADS', 'META_ADS')
          THEN "source"
        ELSE 'WEBSITE'::"EnquirySource"
      END,
      "lastWebsiteSubmissionAt" = COALESCE(
        "lastWebsiteSubmissionAt",
        "updatedAt"
      ),
      "websiteSubmissionCount" = GREATEST(
        "websiteSubmissionCount",
        1
      )
    WHERE "formSubmissionId" IS NOT NULL
  `);

  const verification = await client.query(`
    SELECT
      (
        SELECT COUNT(*)::int
        FROM "WebsiteLeadSubmission"
      ) AS "submissionCount",
      (
        SELECT COUNT(*)::int
        FROM "Enquiry"
        WHERE
          "formSubmissionId" IS NOT NULL
          AND "lastWebsiteSubmissionAt" IS NULL
      ) AS "unlinkedCount"
  `);

  if (verification.rows[0]?.unlinkedCount !== 0) {
    throw new Error(
      "One or more existing website enquiries could not be linked.",
    );
  }

  await client.query("COMMIT");
  console.log(
    `Website lead history verified (${verification.rows[0]?.submissionCount ?? 0} submission records).`,
  );
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
