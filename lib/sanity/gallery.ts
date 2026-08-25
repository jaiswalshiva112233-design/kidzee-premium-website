import "server-only";

import { sanityServerClient } from "@/lib/sanity/serverClient";

export type PublicGalleryMedia = {
  _id: string;
  albumId: string;
  mediaType: "PHOTO" | "VIDEO";
  caption: string;
  altText: string;
  imageUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  createdAt: string;
};

export type PublicGalleryAlbum = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  programmes: string[];
  eventDate: string | null;
  featured: boolean;
  coverMediaId: string | null;
  sortOrder: number;
  createdAt: string;
  media: PublicGalleryMedia[];
  cover: PublicGalleryMedia | null;
  photoCount: number;
  videoCount: number;
};

type GalleryQueryAlbum = Omit<
  PublicGalleryAlbum,
  "cover" | "photoCount" | "videoCount"
>;

const categoryLabels: Record<string, string> = {
  CELEBRATION: "Celebration",
  FESTIVAL: "Festival & Special Day",
  CLASSROOM: "Classroom Moments",
  CREATIVE_LEARNING: "Creative Learning",
  SPORTS_AND_MOVEMENT: "Sports & Movement",
  TRIP_AND_EVENT: "Trip & Event",
  CENTRE_FACILITIES: "Centre Facilities",
  PARENT_STORIES: "Parent Stories",
  OTHER: "Centre Moments",
};

const programmeLabels: Record<string, string> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

export function getGalleryCategoryLabel(category: string) {
  return categoryLabels[category] ?? "Centre Moments";
}

export function getGalleryProgrammeLabel(programme: string) {
  return programmeLabels[programme] ?? programme;
}

export function formatGalleryDate(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function prepareAlbum(album: GalleryQueryAlbum): PublicGalleryAlbum {
  const media = Array.isArray(album.media) ? album.media : [];
  const preferredCover = album.coverMediaId
    ? media.find(
        (item) =>
          item._id === album.coverMediaId &&
          Boolean(item.imageUrl),
      )
    : null;

  const firstPhoto = media.find(
    (item) => item.mediaType === "PHOTO" && Boolean(item.imageUrl),
  );
  const firstVideoThumbnail = media.find(
    (item) => item.mediaType === "VIDEO" && Boolean(item.imageUrl),
  );

  return {
    ...album,
    programmes: Array.isArray(album.programmes)
      ? album.programmes
      : [],
    media,
    cover: preferredCover ?? firstPhoto ?? firstVideoThumbnail ?? null,
    photoCount: media.filter((item) => item.mediaType === "PHOTO")
      .length,
    videoCount: media.filter((item) => item.mediaType === "VIDEO")
      .length,
  };
}

export async function getPublishedGalleryAlbums(): Promise<
  PublicGalleryAlbum[]
> {
  try {
    const albums = await sanityServerClient.fetch<GalleryQueryAlbum[]>(
      `*[
        _type == "websiteGalleryAlbum" &&
        published == true
      ] | order(featured desc, sortOrder asc, eventDate desc, createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        description,
        category,
        programmes,
        eventDate,
        featured,
        coverMediaId,
        sortOrder,
        createdAt,
        "media": *[
          _type == "websiteGalleryMedia" &&
          albumId == ^._id &&
          published == true
        ] | order(sortOrder asc, createdAt asc) {
          _id,
          albumId,
          mediaType,
          caption,
          altText,
          "imageUrl": image.asset->url,
          "videoUrl": video.asset->url,
          sortOrder,
          createdAt
        }
      }`,
      {},
      { next: { revalidate: 60 } },
    );

    return (albums ?? [])
      .map(prepareAlbum)
      .filter((album) => album.media.length > 0);
  } catch {
    console.error("Unable to load the public website gallery.");
    return [];
  }
}

export async function getFeaturedGalleryAlbums(
  limit = 4,
): Promise<PublicGalleryAlbum[]> {
  const albums = await getPublishedGalleryAlbums();
  const featuredAlbums = albums.filter((album) => album.featured);
  const source = featuredAlbums.length > 0 ? featuredAlbums : albums;

  return source.slice(0, Math.max(1, Math.min(limit, 8)));
}

export async function getPublishedGalleryAlbumBySlug(
  slug: string,
): Promise<PublicGalleryAlbum | null> {
  const cleanSlug = slug.trim().toLowerCase();

  if (!/^[a-z0-9-]{1,100}$/.test(cleanSlug)) {
    return null;
  }

  try {
    const album = await sanityServerClient.fetch<GalleryQueryAlbum | null>(
      `*[
        _type == "websiteGalleryAlbum" &&
        published == true &&
        slug.current == $slug
      ][0] {
        _id,
        title,
        "slug": slug.current,
        description,
        category,
        programmes,
        eventDate,
        featured,
        coverMediaId,
        sortOrder,
        createdAt,
        "media": *[
          _type == "websiteGalleryMedia" &&
          albumId == ^._id &&
          published == true
        ] | order(sortOrder asc, createdAt asc) {
          _id,
          albumId,
          mediaType,
          caption,
          altText,
          "imageUrl": image.asset->url,
          "videoUrl": video.asset->url,
          sortOrder,
          createdAt
        }
      }`,
      {
        slug: cleanSlug,
      },
      { next: { revalidate: 60 } },
    );

    if (!album) {
      return null;
    }

    const preparedAlbum = prepareAlbum(album);

    return preparedAlbum.media.length > 0 ? preparedAlbum : null;
  } catch {
    console.error(`Unable to load gallery album ${cleanSlug}.`);
    return null;
  }
}
