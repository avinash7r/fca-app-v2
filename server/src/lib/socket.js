import http from "http";
import { Server } from "socket.io";
import express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { config } from "./config.js";

export const app = express();
export const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
});

const userSocketMap = new Map();

const getCookieToken = (header = "") => {
  const tokenCookie = header.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="));
  if (!tokenCookie) return null;
  try {
    return decodeURIComponent(tokenCookie.slice("token=".length));
  } catch {
    return null;
  }
};

io.use(async (socket, next) => {
  try {
    const token = getCookieToken(socket.handshake.headers.cookie);
    if (!token) return next(new Error("Unauthorized"));

    const decoded = jwt.verify(token, config.jwtSecret, { algorithms: ["HS256"] });
    if (typeof decoded.userID !== "string" || !/^[a-f\d]{24}$/i.test(decoded.userID) || !(await User.exists({ _id: decoded.userID }))) {
      return next(new Error("Unauthorized"));
    }

    socket.data.userID = decoded.userID;
    return next();
  } catch {
    return next(new Error("Unauthorized"));
  }
});

export const getReceiverSocketIds = (receiverID) =>
  [...(userSocketMap.get(receiverID.toString()) ?? [])];

io.on("connection", (socket) => {
  const userID = socket.data.userID;
  const socketIds = userSocketMap.get(userID) ?? new Set();
  socketIds.add(socket.id);
  userSocketMap.set(userID, socketIds);
  io.emit("getOnlineUsers", [...userSocketMap.keys()]);

  socket.on("disconnect", () => {
    const currentSockets = userSocketMap.get(userID);
    currentSockets?.delete(socket.id);
    if (currentSockets?.size === 0) userSocketMap.delete(userID);
    io.emit("getOnlineUsers", [...userSocketMap.keys()]);
  });
});
