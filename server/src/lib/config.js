import "dotenv/config";

const NODE_ENV = process.env.NODE_ENV || "development";
const PORT = Number(process.env.PORT || 7777);
const CORS_ORIGINS = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535");
}
if (!process.env.MONGO_URI) {
  throw new Error("MONGO_URI is required");
}
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured and at least 32 characters long");
}
if (CORS_ORIGINS.includes("*")) {
  throw new Error("CORS_ORIGIN cannot use '*' when credentials are enabled");
}
if (NODE_ENV === "production" && CORS_ORIGINS.length === 0) {
  throw new Error("CORS_ORIGIN is required in production");
}

export const config = {
  nodeEnv: NODE_ENV,
  port: PORT,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  corsOrigins: CORS_ORIGINS,
  cloudinary: {
    cloudName: process.env.CLOUDINARY_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};
