import "server-only";

import { del, put } from "@vercel/blob";

/**
 * Vercel Blob storage.
 *
 * Env:
 *   BLOB_READ_WRITE_TOKEN — injected by the Vercel Blob integration.
 *
 * Blobs are served from a public URL, so `storage_path` in the database holds
 * the absolute blob URL returned by `put`. Document downloads are proxied
 * through an authenticated route (`/api/documents/[id]`) so the raw URL is
 * never handed to a client that doesn't own the record.
 */

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export type UploadedBlob = {
  url: string;
  pathname: string;
};

/** Upload a file to Vercel Blob and return its public URL. */
export async function uploadObject(
  pathname: string,
  body: Uint8Array,
  contentType?: string,
): Promise<UploadedBlob> {
  if (!isBlobConfigured()) {
    throw new Error(
      "Vercel Blob is not configured. Set BLOB_READ_WRITE_TOKEN.",
    );
  }

  const blob = await put(pathname, Buffer.from(body), {
    access: "public",
    contentType: contentType || "application/octet-stream",
    addRandomSuffix: true,
  });

  return { url: blob.url, pathname: blob.pathname };
}

/** Delete a blob by its URL (or pathname). */
export async function deleteObject(urlOrPathname: string): Promise<void> {
  if (!urlOrPathname) return;
  await del(urlOrPathname);
}

export function isAbsoluteUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

/**
 * Resolve a stored path to a public URL.
 * New uploads store an absolute blob URL; legacy keys are joined to the
 * optional NEXT_PUBLIC_BLOB_BASE_URL prefix.
 */
export function getPublicUrl(storedPath: string): string {
  if (isAbsoluteUrl(storedPath)) return storedPath;
  const base = process.env.NEXT_PUBLIC_BLOB_BASE_URL ?? "";
  if (!base) return storedPath;
  return `${base.replace(/\/$/, "")}/${storedPath.replace(/^\//, "")}`;
}

/** Download URL for a stored blob (adds `?download=1` for public blobs). */
export function getSignedDownloadUrl(storedPath: string): string {
  const url = getPublicUrl(storedPath);
  if (!isAbsoluteUrl(url)) return url;
  return url.includes("?") ? url : `${url}?download=1`;
}
