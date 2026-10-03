import { useState } from "react";
import { Send } from "lucide-react";
import { useMsgStore } from "../store/useMsgStore.js";

export default function Msginput() {
  const [message, setMessage] = useState("");
  const sendMessage = useMsgStore((state) => state.sendMessage);
  const isSendingMessage = useMsgStore((state) => state.isSendingMessage);
  const selectedUser = useMsgStore((state) => state.selectedUser);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!message.trim() || isSendingMessage) return;
    const sent = await sendMessage(message);
    if (sent) setMessage("");
  };

  return (
    <form className="composer" onSubmit={handleSubmit}>
      <div className="composer-field">
        <input
          type="text"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder={`Message ${selectedUser?.username || "contact"}…`}
          aria-label={`Message ${selectedUser?.username || "contact"}`}
          maxLength={5000}
          autoComplete="off"
        />
        <span className="composer-hint">ENTER TO SEND</span>
      </div>
      <button className="send-button" type="submit" disabled={!message.trim() || isSendingMessage} aria-label="Send message">
        {isSendingMessage ? <span className="button-spinner" /> : <Send size={17} />}
      </button>
    </form>
  );
}
