import "server-only";

import sharp from "sharp";

export type ProcessedImage = {
  web: Buffer;
  thumbnail: Buffer;
  width: number | null;
  height: number | null;
};

async function boundedWebImage(source: sharp.Sharp) {
  let output = await source
    .clone()
    .resize({ width: 1_600, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();
  if (output.byteLength > 600 * 1024) {
    output = await source
      .clone()
      .resize({ width: 1_400, withoutEnlargement: true })
      .webp({ quality: 70, effort: 5 })
      .toBuffer();
  }
  return output;
}

async function boundedThumbnail(source: sharp.Sharp) {
  let output = await source
    .clone()
    .resize({ width: 480, height: 480, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();
  if (output.byteLength > 120 * 1024) {
    output = await source
      .clone()
      .resize({ width: 420, height: 420, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 65, effort: 5 })
      .toBuffer();
  }
  return output;
}

export async function processPublicImage(bytes: Uint8Array): Promise<ProcessedImage> {
  const source = sharp(Buffer.from(bytes), { failOn: "warning" }).rotate();
  const metadata = await source.metadata();
  const [web, thumbnail] = await Promise.all([
    boundedWebImage(source),
    boundedThumbnail(source),
  ]);
  return {
    web,
    thumbnail,
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}

export async function processPrivateImage(bytes: Uint8Array) {
  const source = sharp(Buffer.from(bytes), { failOn: "warning" }).rotate();
  const metadata = await source.metadata();
  let output = await source
    .resize({ width: 1_600, withoutEnlargement: true })
    .webp({ quality: 82, effort: 5 })
    .toBuffer();
  if (output.byteLength > 300 * 1024) {
    output = await source
      .clone()
      .resize({ width: 1_200, withoutEnlargement: true })
      .webp({ quality: 76, effort: 5 })
      .toBuffer();
  }
  if (output.byteLength > 300 * 1024) {
    output = await source
      .clone()
      .resize({ width: 900, withoutEnlargement: true })
      .webp({ quality: 68, effort: 5 })
      .toBuffer();
  }
  return {
    bytes: output,
    mimeType: "image/webp",
    width: metadata.width ?? null,
    height: metadata.height ?? null,
  };
}
