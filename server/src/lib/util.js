import jwt from "jsonwebtoken";
import { config } from "./config.js";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const authCookieOptions = {
  maxAge: ONE_DAY_MS,
  httpOnly: true,
  secure: config.nodeEnv === "production",
  sameSite: config.nodeEnv === "production" ? "none" : "lax",
  path: "/",
};

export const createToken = (userID, res) => {
  const token = jwt.sign({ userID: userID.toString() }, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: "1d",
  });
  res.cookie("token", token, authCookieOptions);
  return token;
};

export const clearAuthCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: authCookieOptions.secure,
    sameSite: authCookieOptions.sameSite,
    path: authCookieOptions.path,
  });
};
