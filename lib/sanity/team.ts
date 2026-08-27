import "server-only";

import { sanityServerClient } from "@/lib/sanity/serverClient";

export type WebsiteTeamMember = {
  _id: string;
  name: string;
  role: string;
  programme: string;
  qualification: string;
  experience: string;
  introduction: string;
  photoAlt: string;
  imageUrl: string | null;
  featured: boolean;
  sortOrder: number;
};

export type WebsiteTeamMovementSpeed = "SLOW" | "NORMAL" | "FAST";

export type WebsiteTeamSettings = {
  movementSpeed: WebsiteTeamMovementSpeed;
};

export const MAX_WEBSITE_TEAM_PROFILES = 9;

export async function getWebsiteTeamSettings(): Promise<WebsiteTeamSettings> {
  try {
    const settings = await sanityServerClient.fetch<{
      movementSpeed?: string;
    } | null>(
      `*[_type == "websiteTeamSettings" && _id == "websiteTeamSettings"][0] {
        movementSpeed
      }`,
      {},
      { next: { revalidate: 60 } },
    );

    return {
      movementSpeed:
        settings?.movementSpeed === "SLOW" ||
        settings?.movementSpeed === "FAST"
          ? settings.movementSpeed
          : "NORMAL",
    };
  } catch {
    console.error("Unable to load website team movement settings.");
    return { movementSpeed: "NORMAL" };
  }
}

export async function getPublishedWebsiteTeamMembers(): Promise<
  WebsiteTeamMember[]
> {
  try {
    const members = await sanityServerClient.fetch<WebsiteTeamMember[]>(
      `*[
        _type == "websiteTeamMember" &&
        published == true
      ] | order(sortOrder asc, createdAt asc) {
        _id,
        name,
        role,
        programme,
        qualification,
        experience,
        introduction,
        photoAlt,
        "imageUrl": coalesce(externalImageUrl, photo.asset->url),
        featured,
        sortOrder
      }`,
      {},
      {
        next: {
          revalidate: 60,
        },
      },
    );

    return (members ?? []).slice(0, MAX_WEBSITE_TEAM_PROFILES);
  } catch {
    console.error("Unable to load website team profiles.");
    return [];
  }
}

export async function getFeaturedWebsiteTeamMembers(
  limit = MAX_WEBSITE_TEAM_PROFILES,
): Promise<WebsiteTeamMember[]> {
  const members = await getPublishedWebsiteTeamMembers();
  const featuredMembers = members.filter((member) => member.featured);

  return featuredMembers.slice(
    0,
    Math.max(1, Math.min(limit, MAX_WEBSITE_TEAM_PROFILES)),
  );
}
