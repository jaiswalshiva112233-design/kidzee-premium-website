import "server-only";

import { prisma } from "@/lib/prisma";

export const MEDIA_SAFETY_SETTING_ID = "centre-media-safety";

export const trialMediaDefaults = {
  aiMediaFeaturesEnabled: false,
  directVideoUploadEnabled: false,
  externalEmbedsEnabled: true,
  originalArchiveEnabled: false,
  compressionEnabled: true,
  privateProtectionLocked: true,
  backupWarningsEnabled: true,
  growthWarningsEnabled: true,
} as const;

export async function getMediaSafetySetting() {
  return prisma.mediaSafetySetting.upsert({
    where: { id: MEDIA_SAFETY_SETTING_ID },
    create: { id: MEDIA_SAFETY_SETTING_ID, ...trialMediaDefaults },
    update: {},
  });
}
