import { useEffect, useRef } from "react";
import { ArrowLeft, Circle, MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useMsgStore } from "../store/useMsgStore.js";
import Msginput from "./Msginput.jsx";

const formatTime = (date) => new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(date));
const formatDay = (date) => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date(date));

export default function Chatbox() {
  const messages = useMsgStore((state) => state.messages);
  const selectedUser = useMsgStore((state) => state.selectedUser);
  const getMessages = useMsgStore((state) => state.getMessages);
  const selectUser = useMsgStore((state) => state.selectUser);
  const listenToMessages = useMsgStore((state) => state.listenToMessages);
  const stopListeningToMessages = useMsgStore((state) => state.stopListeningToMessages);
  const isFetchingMessages = useMsgStore((state) => state.isFetchingMessages);
  const authUser = useAuthStore((state) => state.authUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const bottomRef = useRef(null);
  const isOnline = selectedUser ? onlineUsers.includes(selectedUser._id) : false;

  useEffect(() => {
    if (!selectedUser?._id) return undefined;
    getMessages(selectedUser._id);
    listenToMessages();
    return stopListeningToMessages;
  }, [selectedUser?._id, getMessages, listenToMessages, stopListeningToMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  let lastDay = "";

  return (
    <section className="chat-panel" aria-label={`Conversation with ${selectedUser?.username}`}>
      <header className="chat-header">
        <button className="icon-button back-to-contacts" onClick={() => selectUser(null)} aria-label="Back to contacts"><ArrowLeft size={19} /></button>
        <img className="chat-header-avatar" src={selectedUser?.profilePic || "/avatar.png"} alt="" />
        <div className="chat-header-copy"><strong>{selectedUser?.username}</strong><span><i className={isOnline ? "online" : ""} />{isOnline ? "Online now" : "Offline"}</span></div>
      </header>

      <div className="message-list" aria-live="polite" aria-relevant="additions text">
        {isFetchingMessages ? (
          <div className="chat-state"><span className="button-spinner" /><span>Loading conversation…</span></div>
        ) : messages.length === 0 ? (
          <div className="chat-empty"><span className="chat-empty-icon"><MessageCircle size={22} /></span><strong>This is the start of your conversation</strong><span>Send a message to {selectedUser?.username} and say hello.</span></div>
        ) : messages.map((message) => {
          const day = new Date(message.createdAt).toDateString();
          const showDay = day !== lastDay;
          lastDay = day;
          const isMine = message.senderId === authUser?._id;
          return (
            <div key={message._id}>
              {showDay ? <div className="date-divider"><span>{formatDay(message.createdAt)}</span></div> : null}
              <article className={`message-row ${isMine ? "mine" : "theirs"}`}>
                {!isMine ? <img className="message-avatar" src={selectedUser?.profilePic || "/avatar.png"} alt="" /> : null}
                <div className="message-content">
                  <div className={`message-bubble ${isMine ? "sent" : "received"}`}>{message.text}</div>
                  <time className="message-time" dateTime={message.createdAt}>{formatTime(message.createdAt)}</time>
                </div>
                {isMine ? <img className="message-avatar" src={authUser?.profilePic || "/avatar.png"} alt="" /> : null}
              </article>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="chat-connection-note"><Circle size={7} fill="currentColor" /> Messages update live while you’re connected</div>
      <Msginput />
    </section>
  );
}
