import { test } from "node:test";
import { strict as assert } from "node:assert";

import { AVATAR_PHOTOS, PROPERTY_PHOTOS, avatarPhoto, propertyPhoto, unsplash } from "../lib/images.js";

test("image helpers target the Unsplash CDN", () => {
  const url = unsplash("1234567890-abcdef", { w: 400, q: 70 });
  assert.ok(url.startsWith("https://images.unsplash.com/photo-1234567890-abcdef?"));
  assert.ok(url.includes("w=400"));
  assert.ok(url.includes("q=70"));
});

test("avatar + property photos are real, allow-listed URLs", () => {
  for (let i = 0; i < AVATAR_PHOTOS.length + 2; i++) {
    const url = new URL(avatarPhoto(i));
    assert.equal(url.hostname, "images.unsplash.com");
    assert.ok(url.searchParams.get("crop") === "faces");
  }
  for (let i = 0; i < PROPERTY_PHOTOS.length + 2; i++) {
    assert.ok(propertyPhoto(i).startsWith("https://images.unsplash.com/photo-"));
  }
});

test("index helpers wrap around and never return undefined", () => {
  assert.ok(avatarPhoto(-1).includes("images.unsplash.com"));
  assert.ok(avatarPhoto(999).includes("images.unsplash.com"));
});
