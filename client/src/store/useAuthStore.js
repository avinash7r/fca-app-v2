import { create } from "zustand";
import { io } from "socket.io-client";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axiosInstance.js";

let authCheckPromise;

const getErrorMessage = (error, fallback) =>
  error.response?.data?.message || fallback;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isLoggingIn: false,
  isSigningUp: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  isConnecting: false,
  isSocketConnected: false,
  onlineUsers: [],
  socket: null,

  authCheck: () => {
    if (authCheckPromise) return authCheckPromise;

    set({ isCheckingAuth: true });
    authCheckPromise = (async () => {
      try {
        const { data } = await axiosInstance.get("/auth/check");
        set({ authUser: data.user });
        get().connectSocket();
        return data.user;
      } catch {
        get().disconnectSocket();
        set({ authUser: null, onlineUsers: [] });
        return null;
      } finally {
        set({ isCheckingAuth: false });
        authCheckPromise = null;
      }
    })();

    return authCheckPromise;
  },

  login: async (credentials) => {
    set({ isLoggingIn: true });
    try {
      const { data } = await axiosInstance.post("/auth/login", credentials);
      set({ authUser: data.user });
      get().connectSocket();
      return data.user;
    } catch (error) {
      const message = getErrorMessage(error, "Login failed");
      toast.error(message);
      return null;
    } finally {
      set({ isLoggingIn: false });
    }
  },

  signUp: async (details) => {
    set({ isSigningUp: true });
    try {
      const { data } = await axiosInstance.post("/auth/register", details);
      set({ authUser: data.user });
      get().connectSocket();
      return data.user;
    } catch (error) {
      toast.error(getErrorMessage(error, "Sign up failed"));
      return null;
    } finally {
      set({ isSigningUp: false });
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      get().disconnectSocket();
      set({ authUser: null, onlineUsers: [] });
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not log out. Please try again."));
      return false;
    }
  },

  updateProfile: async (profile) => {
    set({ isUpdatingProfile: true });
    try {
      const { data } = await axiosInstance.put("/auth/update", profile);
      set({ authUser: data });
      toast.success("Profile photo updated");
      return true;
    } catch (error) {
      toast.error(getErrorMessage(error, "Profile update failed"));
      return false;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser, socket } = get();
    if (!authUser) return;
    if (socket?.connected || get().isConnecting) return;
    if (socket) socket.disconnect();

    const nextSocket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
    });

    nextSocket.on("connect", () => set({ isConnecting: false, isSocketConnected: true }));
    nextSocket.on("connect_error", () => {
      set({ isConnecting: false, isSocketConnected: false, onlineUsers: [] });
    });
    nextSocket.on("disconnect", () => {
      set({ isConnecting: false, isSocketConnected: false, onlineUsers: [] });
    });
    nextSocket.on("getOnlineUsers", (onlineUsers) => set({ onlineUsers }));

    set({ socket: nextSocket, isConnecting: true, onlineUsers: [] });
    nextSocket.connect();
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) socket.disconnect();
    set({ socket: null, isConnecting: false, isSocketConnected: false, onlineUsers: [] });
  },
}));
