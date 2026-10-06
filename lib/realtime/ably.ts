import "server-only";

import Ably from "ably";

const serverKey = process.env.ABLY_SERVER_KEY;

export function isAblyConfigured(): boolean {
  return Boolean(serverKey);
}

export function getAblyRest(): Ably.Rest {
  if (!serverKey) {
    throw new Error("ABLY_SERVER_KEY is not configured.");
  }
  return new Ably.Rest({ key: serverKey });
}

export function channelName(scope: string, id: string): string {
  return `${scope}:${id}`;
}

/** Publish a realtime event (no-op if Ably isn't configured). */
export async function publishEvent(
  channel: string,
  event: string,
  data: unknown,
): Promise<void> {
  if (!isAblyConfigured()) return;
  try {
    await getAblyRest().channels.get(channel).publish(event, data);
  } catch (err) {
    console.error(`[ably] publish failed on ${channel}:`, err);
  }
}
