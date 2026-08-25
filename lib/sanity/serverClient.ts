import "server-only";

import { createClient } from "next-sanity";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION ?? "2026-08-01";
const token = process.env.SANITY_API_WRITE_TOKEN;

if (!projectId) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_PROJECT_ID in .env.local",
  );
}

if (!dataset) {
  throw new Error(
    "Missing NEXT_PUBLIC_SANITY_DATASET in .env.local",
  );
}

export const sanityServerClient = createClient({
  projectId,
  dataset,
  apiVersion,
  token: token || undefined,
  useCdn: !token,
  perspective: "published",
  timeout: 4_000,
  maxRetries: 0,
});
