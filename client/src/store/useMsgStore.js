import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axiosInstance.js";
import { useAuthStore } from "./useAuthStore.js";

const mergeMessages = (...groups) => {
  const unique = new Map();
  for (const message of groups.flat()) unique.set(message._id, message);
  return [...unique.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
};

let activeMessageRequest = 0;

export const useMsgStore = create((set, get) => ({
  users: [],
  messages: [],
  selectedUser: null,
  isFetchingMessages: false,
  isFetchingUsers: false,
  isSendingMessage: false,

  getUsers: async () => {
    set({ isFetchingUsers: true });
    try {
      const { data } = await axiosInstance.get("/message/users");
      set({ users: data });
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load contacts");
      return [];
    } finally {
      set({ isFetchingUsers: false });
    }
  },

  getMessages: async (userId) => {
    if (!userId) return [];
    const requestId = ++activeMessageRequest;
    set({ isFetchingMessages: true, messages: [] });
    try {
      const { data } = await axiosInstance.get(`/message/${userId}`);
      if (requestId === activeMessageRequest && get().selectedUser?._id === userId) {
        set((state) => ({ messages: mergeMessages(data, state.messages) }));
      }
      return data;
    } catch (error) {
      if (requestId === activeMessageRequest) {
        toast.error(error.response?.data?.message || "Could not load messages");
      }
      return [];
    } finally {
      if (requestId === activeMessageRequest) set({ isFetchingMessages: false });
    }
  },

  selectUser: (user) => {
    activeMessageRequest += 1;
    set({ selectedUser: user, messages: [], isFetchingMessages: false });
  },

  reset: () => {
    activeMessageRequest += 1;
    useAuthStore.getState().socket?.off("newMessage");
    set({
      users: [],
      messages: [],
      selectedUser: null,
      isFetchingMessages: false,
      isFetchingUsers: false,
      isSendingMessage: false,
    });
  },

  sendMessage: async (text) => {
    const { selectedUser } = get();
    const trimmedText = typeof text === "string" ? text.trim() : "";
    if (!selectedUser?._id || !trimmedText || get().isSendingMessage) return false;

    set({ isSendingMessage: true });
    try {
      const { data } = await axiosInstance.post(`/message/send/${selectedUser._id}`, {
        text: trimmedText,
      });
      if (get().selectedUser?._id === selectedUser._id) {
        set((state) => ({ messages: mergeMessages(state.messages, [data]) }));
      }
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || "Message could not be sent");
      return false;
    } finally {
      set({ isSendingMessage: false });
    }
  },

  listenToMessages: () => {
    const { selectedUser } = get();
    const socket = useAuthStore.getState().socket;
    if (!selectedUser?._id || !socket) return;

    socket.off("newMessage");
    socket.on("newMessage", (message) => {
      const currentUserId = useAuthStore.getState().authUser?._id;
      const activeUserId = get().selectedUser?._id;
      const belongsToConversation =
        (message.senderId === activeUserId && message.receiverId === currentUserId) ||
        (message.senderId === currentUserId && message.receiverId === activeUserId);
      if (!belongsToConversation) return;

      set((state) => ({ messages: mergeMessages(state.messages, [message]) }));
    });
  },

  stopListeningToMessages: () => {
    useAuthStore.getState().socket?.off("newMessage");
  },
}));
