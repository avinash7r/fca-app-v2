const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_DATA_URI_PATTERN = /^data:image\/(?:jpeg|png|webp|gif);base64,([A-Za-z0-9+/]+={0,2})$/i;

export const normalizeEmail = (email) => email.trim().toLowerCase();

export const isValidEmail = (email) =>
  typeof email === "string" &&
  email.trim().length <= 254 &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const isValidObjectId = (id) =>
  typeof id === "string" && /^[a-f\d]{24}$/i.test(id);

export const isValidImageDataUri = (value) => {
  if (typeof value !== "string") return false;
  const match = IMAGE_DATA_URI_PATTERN.exec(value);
  if (!match || match[1].length % 4 === 1) return false;

  return Buffer.from(match[1], "base64").byteLength <= MAX_IMAGE_BYTES;
};

export const MAX_MESSAGE_TEXT_LENGTH = 5000;
