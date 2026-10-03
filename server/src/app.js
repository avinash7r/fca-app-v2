import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import mongoose from "mongoose";
import { config } from "./lib/config.js";
import { router as authRoutes } from "./routes/auth.routes.js";
import { router as messageRoutes } from "./routes/message.routes.js";
import { app } from "./lib/socket.js";

app.disable("x-powered-by");
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, false);
    return callback(null, config.corsOrigins.includes(origin) ? origin : false);
  },
  credentials: true,
}));
app.use(cookieParser());
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");

  if (["POST", "PUT", "PATCH", "DELETE"].includes(req.method) && req.cookies?.token) {
    const origin = req.get("origin");
    if (!origin || !config.corsOrigins.includes(origin)) {
      return res.status(403).json({ message: "Origin not allowed" });
    }
  }
  return next();
});
app.use(express.json({ limit: "8mb" }));

app.get("/health", (req, res) => {
  const ready = mongoose.connection.readyState === 1;
  return res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable" });
});

app.use("/api/auth", authRoutes);
app.use("/api/message", messageRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  if (error.type === "entity.too.large") {
    return res.status(413).json({ message: "Request body is too large" });
  }
  console.error("Unhandled request error:", error);
  return res.status(500).json({ message: "Internal server error" });
});

export { app };
