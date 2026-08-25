import imageUrlBuilder from "@sanity/image-url";

import { sanityClient } from "@/lib/sanity/client";

const builder = imageUrlBuilder(sanityClient);

type SanityImageSource = Parameters<typeof builder.image>[0];

export function urlForImage(source: SanityImageSource) {
  return builder.image(source);
}