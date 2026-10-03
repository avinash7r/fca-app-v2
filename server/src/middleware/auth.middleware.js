import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { config } from "../lib/config.js";
import { isValidObjectId } from "../lib/validation.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    if (typeof decoded.userID !== "string" || !isValidObjectId(decoded.userID)) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(decoded.userID);
    if (!user) return res.status(401).json({ message: "Unauthorized" });

    req.user = user;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized" });
    }
    console.error("Authentication failed:", error);
    return res.status(500).json({ message: "Unable to authenticate request" });
  }
};
