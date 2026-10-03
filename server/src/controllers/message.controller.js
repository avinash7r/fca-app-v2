import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import { getReceiverSocketIds, io } from "../lib/socket.js";
import {
  isValidImageDataUri,
  isValidObjectId,
  MAX_MESSAGE_TEXT_LENGTH,
} from "../lib/validation.js";

export const getUserForSidebar = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("username email profilePic")
      .sort({ username: 1 })
      .lean();
    return res.status(200).json(users);
  } catch (error) {
    console.error("Sidebar users lookup failed:", error);
    return res.status(500).json({ message: "Unable to get users" });
  }
};

export const getMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId },
        { senderId: receiverId, receiverId: req.user._id },
      ],
    }).sort({ createdAt: 1, _id: 1 }).lean();

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Message lookup failed:", error);
    return res.status(500).json({ message: "Unable to get messages" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { id: receiverId } = req.params;
    const text = req.body?.text;
    const media = req.body?.media;
    const hasMedia = typeof media === "string" && media.length > 0;

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }
    if (typeof text !== "undefined" && typeof text !== "string") {
      return res.status(400).json({ message: "Message text must be a string" });
    }
    const normalizedText = typeof text === "string" ? text.trim() : "";
    if (normalizedText.length > MAX_MESSAGE_TEXT_LENGTH) {
      return res.status(400).json({ message: "Message text is too long" });
    }
    if (media !== undefined && media !== null && media !== "" && !isValidImageDataUri(media)) {
      return res.status(400).json({ message: "Please provide a supported image under 5 MB" });
    }
    if (!normalizedText && !hasMedia) {
      return res.status(400).json({ message: "Message cannot be empty" });
    }
    if (hasMedia && !isCloudinaryConfigured) {
      return res.status(503).json({ message: "Media uploads are unavailable" });
    }

    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) return res.status(404).json({ message: "Recipient not found" });

    let mediaUrl;
    if (media) {
      const upload = await cloudinary.uploader.upload(media, {
        folder: "chat-messages",
        resource_type: "image",
      });
      mediaUrl = upload.secure_url;
    }

    const message = await Message.create({
      senderId: req.user._id,
      receiverId,
      ...(normalizedText ? { text: normalizedText } : {}),
      ...(mediaUrl ? { media: mediaUrl } : {}),
    });

    for (const socketId of getReceiverSocketIds(receiverId)) {
      io.to(socketId).emit("newMessage", message);
    }
    return res.status(201).json(message);
  } catch (error) {
    console.error("Message send failed:", error);
    return res.status(500).json({ message: "Unable to send message" });
  }
};
