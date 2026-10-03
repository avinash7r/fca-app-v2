import "dotenv/config";
import { app } from "./src/app.js";
import { config } from "./src/lib/config.js";
import { connectDB, disconnectDB } from "./src/lib/connectDB.js";
import { io, server } from "./src/lib/socket.js";

let isShuttingDown = false;

const listen = () => new Promise((resolve, reject) => {
  const onError = (error) => reject(error);
  server.once("error", onError);
  server.listen(config.port, "0.0.0.0", () => {
    server.off("error", onError);
    resolve();
  });
});

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  const forceExit = setTimeout(() => {
    console.error("Shutdown timed out. Forcing exit.");
    process.exit(1);
  }, 15000);
  forceExit.unref();

  try {
    await new Promise((resolve) => io.close(resolve));
    await disconnectDB();
    console.log("Shutdown complete");
    clearTimeout(forceExit);
  } catch (error) {
    console.error("Shutdown failed:", error);
    process.exitCode = 1;
  }
};

process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.once("SIGINT", () => gracefulShutdown("SIGINT"));

try {
  await connectDB();
  await listen();
  console.log(`Server listening on port ${config.port}`);
} catch (error) {
  console.error("Server startup failed:", error);
  try {
    await disconnectDB();
  } catch (disconnectError) {
    console.error("Failed to close MongoDB after startup failure:", disconnectError);
  }
  process.exitCode = 1;
}
