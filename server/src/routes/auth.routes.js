import express from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  updateUser,
  checkAuth,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.put("/update", authMiddleware, updateUser);
router.get("/check", authMiddleware, checkAuth);

export { router };
