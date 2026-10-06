import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Clerk webhook signature (Svix scheme) without the svix dependency.
 * Clerk signs `${svix-id}.${svix-timestamp}.${rawBody}` with the base64 key
 * encoded in the `whsec_…` signing secret.
 */
export function verifySvixSignature(
  payload: string,
  headers: Headers,
  secret: string,
  toleranceSeconds = 300,
): boolean {
  const id = headers.get("svix-id");
  const timestamp = headers.get("svix-timestamp");
  const signature = headers.get("svix-signature");
  if (!id || !timestamp || !signature) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", key)
    .update(`${id}.${timestamp}.${payload}`)
    .digest("base64");
  const expectedBuffer = Buffer.from(expected);

  return signature
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean)
    .some((part) => {
      const value = part.includes(",") ? part.slice(part.indexOf(",") + 1) : part;
      const buffer = Buffer.from(value);
      return buffer.length === expectedBuffer.length && timingSafeEqual(buffer, expectedBuffer);
    });
}
