import { User } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary, { isCloudinaryConfigured } from "../lib/cloudinary.js";
import { clearAuthCookie, createToken } from "../lib/util.js";
import {
  isValidEmail,
  isValidImageDataUri,
  normalizeEmail,
} from "../lib/validation.js";

const publicUser = (user) => ({
  _id: user._id,
  id: user._id,
  username: user.username,
  email: user.email,
  profilePic: user.profilePic,
});

export const registerUser = async (req, res) => {
  try {
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";
    const emailInput = req.body?.email;
    const password = req.body?.password;

    if (!username || typeof emailInput !== "string" || !emailInput.trim() || !password) {
      return res.status(400).json({ message: "Please fill all fields" });
    }
    if (username.length > 50 || !isValidEmail(emailInput)) {
      return res.status(400).json({ message: "Please provide valid account details" });
    }
    if (typeof password !== "string" || password.length < 6 || Buffer.byteLength(password, "utf8") > 72) {
      return res.status(400).json({ message: "Password must be 6-72 bytes long" });
    }

    const email = normalizeEmail(emailInput);
    if (await User.findOne({ email }).collation({ locale: "en", strength: 2 }).select("_id")) {
      return res.status(409).json({ message: "User already exists" });
    }

    const user = await User.create({
      username,
      email,
      password: await bcrypt.hash(password, 12),
    });
    createToken(user._id, res);
    return res.status(201).json({
      message: "User created successfully",
      user: publicUser(user),
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "User already exists" });
    }
    console.error("Registration failed:", error);
    return res.status(500).json({ message: "Unable to create user" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const emailInput = req.body?.email;
    const password = req.body?.password;
    if (!isValidEmail(emailInput) || typeof password !== "string" || !password) {
      return res.status(400).json({ message: "Please provide a valid email and password" });
    }

    const user = await User.findOne({ email: normalizeEmail(emailInput) })
      .collation({ locale: "en", strength: 2 })
      .select("+password");
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    createToken(user._id, res);
    return res.status(200).json({
      message: "Logged in successfully",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Unable to log in" });
  }
};

export const logoutUser = (req, res) => {
  clearAuthCookie(res);
  return res.status(200).json({ message: "Logged out successfully" });
};

export const updateUser = async (req, res) => {
  try {
    const profileImage = req.body?.profileImage;
    if (!isValidImageDataUri(profileImage)) {
      return res.status(400).json({ message: "Please provide a supported image under 5 MB" });
    }
    if (!isCloudinaryConfigured) {
      return res.status(503).json({ message: "Profile image uploads are unavailable" });
    }

    const upload = await cloudinary.uploader.upload(profileImage, {
      folder: "chat-profiles",
      resource_type: "image",
    });
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePic: upload.secure_url },
      { new: true, runValidators: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    return res.status(200).json(publicUser(user));
  } catch (error) {
    console.error("Profile update failed:", error);
    return res.status(500).json({ message: "Unable to update profile" });
  }
};

export const checkAuth = (req, res) => {
  return res.status(200).json({ user: publicUser(req.user) });
};
