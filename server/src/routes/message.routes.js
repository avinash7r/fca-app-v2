import express from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  getUserForSidebar,
  getMessage,
  sendMessage,
} from "../controllers/message.controller.js";

const router = express.Router();

router.use(authMiddleware);
router.get("/users", getUserForSidebar);
router.get("/:id", getMessage);
router.post("/send/:id", sendMessage);

export { router };
