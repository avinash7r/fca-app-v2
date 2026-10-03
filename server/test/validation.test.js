import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  isValidImageDataUri,
  isValidObjectId,
  normalizeEmail,
} from "../src/lib/validation.js";

test("normalizes email addresses and validates ordinary addresses", () => {
  assert.equal(normalizeEmail("  Person@Example.COM "), "person@example.com");
  assert.equal(isValidEmail("person@example.com"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail({}), false);
});

test("validates Mongo object IDs without throwing", () => {
  assert.equal(isValidObjectId("507f1f77bcf86cd799439011"), true);
  assert.equal(isValidObjectId("not-an-id"), false);
  assert.equal(isValidObjectId(null), false);
});

test("accepts supported image data URIs and rejects malformed or oversized data", () => {
  assert.equal(isValidImageDataUri("data:image/png;base64,aGVsbG8="), true);
  assert.equal(isValidImageDataUri("https://example.com/image.png"), false);
  assert.equal(isValidImageDataUri("data:text/html;base64,aGVsbG8="), false);
  assert.equal(isValidImageDataUri("data:image/png;base64,abcde"), false);
  const oversized = `data:image/png;base64,${"A".repeat(7 * 1024 * 1024)}`;
  assert.equal(isValidImageDataUri(oversized), false);
});
