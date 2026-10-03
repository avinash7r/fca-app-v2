import { useMemo } from "react";
import { ArrowUpRight, MessagesSquare, Search, UsersRound } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useMsgStore } from "../store/useMsgStore.js";
import Sidebar from "../components/Sidebar.jsx";
import Chatbox from "../components/Chatbox.jsx";

export default function HomePage() {
  const authUser = useAuthStore((state) => state.authUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const users = useMsgStore((state) => state.users);
  const selectedUser = useMsgStore((state) => state.selectedUser);
  const isFetchingUsers = useMsgStore((state) => state.isFetchingUsers);
  const onlineCount = useMemo(() => users.filter((user) => onlineUsers.includes(user._id)).length, [users, onlineUsers]);

  return (
    <main className={`workspace ${selectedUser ? "show-conversation" : ""}`}>
      <Sidebar />
      <section className="conversation-stage">
        {selectedUser ? (
          <Chatbox />
        ) : (
          <div className="welcome-panel">
            <div className="welcome-orbit orbit-one" />
            <div className="welcome-orbit orbit-two" />
            <div className="welcome-content">
              <div className="welcome-icon"><MessagesSquare size={27} strokeWidth={1.7} /></div>
              <p className="eyebrow">YOUR CHAT SPACE</p>
              <h1>Good conversations<br />start <span>here.</span></h1>
              <p className="welcome-description">Choose someone from your contacts and say hello. Your next great conversation is one message away.</p>
              <div className="welcome-stats">
                <div><UsersRound size={16} /><span><strong>{users.length}</strong> contacts</span></div>
                <span className="stats-divider" />
                <div><span className={`status-dot ${onlineCount ? "is-live" : ""}`} /><span><strong>{onlineCount}</strong> online now</span></div>
              </div>
              {users.length === 0 && !isFetchingUsers ? (
                <p className="empty-hint"><Search size={15} /> No other accounts yet. Create another account to start a chat.</p>
              ) : null}
              <div className="welcome-tip"><ArrowUpRight size={15} /> Conversations stay in sync in real time.</div>
              <p className="welcome-greeting">SIGNED IN AS <strong>{authUser?.username}</strong></p>
            </div>
            <div className="welcome-decoration" aria-hidden="true"><span /><span /><span /></div>
          </div>
        )}
      </section>
    </main>
  );
}
