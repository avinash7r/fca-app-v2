import mongoose from "mongoose";
import { config } from "./config.js";
import { User } from "../models/user.model.js";
import { Message } from "../models/message.model.js";

export const connectDB = async () => {
  const connection = await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });

  await Promise.all([User.createIndexes(), Message.createIndexes()]);
  console.log(`MongoDB connected: ${connection.connection.host}`);
  return connection;
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
};
