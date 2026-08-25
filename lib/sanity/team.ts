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

export const MAX_WEBSITE_TEAM_PROFILES = 9;

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
        "imageUrl": photo.asset->url,
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
