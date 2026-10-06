/**
 * Client-safe helper — resolves a stored blob path to a public URL.
 * New uploads store an absolute Vercel Blob URL; legacy keys fall back to
 * NEXT_PUBLIC_BLOB_BASE_URL.
 */
export function getPublicObjectUrl(storedPath: string): string {
  if (!storedPath) return "";
  if (/^https?:\/\//i.test(storedPath)) return storedPath;
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? "";
  if (!base) return storedPath;
  return `${base.replace(/\/$/, "")}/${storedPath.replace(/^\//, "")}`;
}
