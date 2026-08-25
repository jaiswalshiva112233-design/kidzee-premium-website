import "server-only";

import { sanityServerClient } from "@/lib/sanity/serverClient";

export type ProgrammeRatioSettings = {
  youngGroupChildrenPerTeacher: number;
  kindergartenChildrenPerTeacher: number;
};

type StoredProgrammeRatioSettings = Partial<ProgrammeRatioSettings>;

export const defaultProgrammeRatioSettings: ProgrammeRatioSettings = {
  youngGroupChildrenPerTeacher: 8,
  kindergartenChildrenPerTeacher: 10,
};

function validRatio(value: unknown, fallback: number) {
  if (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 2 &&
    value <= 30
  ) {
    return value;
  }

  return fallback;
}

export async function getProgrammeRatioSettings(): Promise<ProgrammeRatioSettings> {
  try {
    const stored =
      await sanityServerClient.fetch<StoredProgrammeRatioSettings | null>(
        `*[
          _id == "website-programme-ratio-settings" &&
          _type == "websiteProgrammeRatioSettings"
        ][0] {
          youngGroupChildrenPerTeacher,
          kindergartenChildrenPerTeacher
        }`,
      );

    return {
      youngGroupChildrenPerTeacher: validRatio(
        stored?.youngGroupChildrenPerTeacher,
        defaultProgrammeRatioSettings.youngGroupChildrenPerTeacher,
      ),
      kindergartenChildrenPerTeacher: validRatio(
        stored?.kindergartenChildrenPerTeacher,
        defaultProgrammeRatioSettings.kindergartenChildrenPerTeacher,
      ),
    };
  } catch {
    console.error("Unable to load programme ratio settings.");
    return { ...defaultProgrammeRatioSettings };
  }
}
