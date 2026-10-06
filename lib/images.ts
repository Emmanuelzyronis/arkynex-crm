/**
 * Curated real photography (Unsplash CDN) used wherever the product needs a
 * person or place image. `next.config.ts` already allow-lists
 * `images.unsplash.com`. All IDs are checked-in constants — no runtime API call
 * and no API key, so this ships cleanly through the Vercel build.
 */

function unsplash(
  id: string,
  opts: { w?: number; h?: number; q?: number; crop?: string } = {},
): string {
  const params = new URLSearchParams({
    auto: "format",
    fit: "crop",
    w: String(opts.w ?? 1200),
    q: String(opts.q ?? 80),
  });
  if (opts.h) params.set("h", String(opts.h));
  if (opts.crop) params.set("crop", opts.crop);
  return `https://images.unsplash.com/photo-${id}?${params.toString()}`;
}

/** Real people portraits (square, face-focused). */
export const AVATAR_PHOTOS = [
  "1494790108377-be9c29b29330",
  "1500648767791-00dcc994a43e",
  "1507003211169-0a1dd7228f2d",
  "1438761681033-6461ffad8d80",
  "1472099645785-5658abf4ff4e",
  "1544005313-94ddf0286df2",
  "1506794778202-cad84cf45f1d",
  "1534528741775-53994a69daeb",
  "1502685104226-ee32379fefbe",
] as const;

/** Real property / interior photography. */
export const PROPERTY_PHOTOS = [
  "1568605114967-8130f3a36994",
  "1600596542815-ffad4c1539a9",
  "1600585154340-be6161a56a0c",
  "1512917774080-9991f1c4c750",
  "1600607687939-ce8a6c25118c",
  "1580587771525-78b9dba3b914",
  "1570129477492-45c003edd2be",
  "1613490493576-7fde63acd811",
] as const;

/** Deterministic real portrait for a person at `index`. */
export function avatarPhoto(index: number, size = 160): string {
  const id = AVATAR_PHOTOS[((index % AVATAR_PHOTOS.length) + AVATAR_PHOTOS.length) % AVATAR_PHOTOS.length];
  return unsplash(id, { w: size, h: size, q: 80, crop: "faces" });
}

/** Deterministic real property photo at `index`. */
export function propertyPhoto(index: number, w = 1200): string {
  const id = PROPERTY_PHOTOS[((index % PROPERTY_PHOTOS.length) + PROPERTY_PHOTOS.length) % PROPERTY_PHOTOS.length];
  return unsplash(id, { w, q: 80 });
}

export { unsplash };
