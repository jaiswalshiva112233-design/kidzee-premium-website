import "server-only";

import { sanityServerClient } from "@/lib/sanity/serverClient";

export type WebsiteMedia = {
  slotKey: string;
  altText: string;
  imageUrl: string | null;
};

export async function getWebsiteMedia(
  slotKey: string,
): Promise<WebsiteMedia | null> {
  try {
    const media = await sanityServerClient.fetch<WebsiteMedia | null>(
      `*[
        _type == "websiteMediaSlot" &&
        slotKey == $slotKey
      ][0] {
        slotKey,
        altText,
        "imageUrl": image.asset->url
      }`,
      {
        slotKey,
      },
      {
        next: {
          revalidate: 60,
        },
      },
    );

    return media;
  } catch {
    console.error(`Unable to load website media for ${slotKey}.`);

    return null;
  }
}

export async function getWebsiteMediaBySlotKeys(
  slotKeys: string[],
): Promise<Record<string, WebsiteMedia>> {
  if (slotKeys.length === 0) {
    return {};
  }

  try {
    const media = await sanityServerClient.fetch<WebsiteMedia[]>(
      `*[
        _type == "websiteMediaSlot" &&
        slotKey in $slotKeys
      ] {
        slotKey,
        altText,
        "imageUrl": image.asset->url
      }`,
      {
        slotKeys,
      },
      {
        next: {
          revalidate: 60,
        },
      },
    );

    return Object.fromEntries(
      media.map((item) => [item.slotKey, item]),
    );
  } catch {
    console.error("Unable to load website media positions.");

    return {};
  }
}
