import { Bell, LockKeyhole, Radio, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";

export default function Setting() {
  const socket = useAuthStore((state) => state.socket);
  const connected = useAuthStore((state) => state.isSocketConnected) && Boolean(socket?.connected);

  return (
    <main className="settings-page">
      <div className="page-heading">
        <p className="eyebrow">PREFERENCES</p>
        <h1>Your settings</h1>
        <p>Manage your ChatUp experience and see how your connection is doing.</p>
      </div>
      <section className="settings-section">
        <div className="settings-section-heading"><span className="settings-icon"><Radio size={18} /></span><div><h2>Connection</h2><p>Live status for your current session</p></div></div>
        <div className="settings-row"><div className="settings-row-icon"><Radio size={17} /></div><div className="settings-row-copy"><strong>Realtime messaging</strong><span>Socket connection for online presence and new messages</span></div><span className={`connection-state ${connected ? "connected" : "disconnected"}`}><i />{connected ? "Connected" : "Reconnecting"}</span></div>
        <div className="settings-row"><div className="settings-row-icon"><ShieldCheck size={17} /></div><div className="settings-row-copy"><strong>Session security</strong><span>Your sign-in is protected by an HTTP-only session cookie</span></div><span className="settings-badge">ENABLED</span></div>
      </section>
      <section className="settings-section">
        <div className="settings-section-heading"><span className="settings-icon"><Sparkles size={18} /></span><div><h2>About ChatUp</h2><p>A small space built for meaningful conversations</p></div></div>
        <div className="settings-feature-grid">
          <article><span><Bell size={17} /></span><strong>Instant updates</strong><p>Messages arrive in real time while you’re connected.</p></article>
          <article><span><LockKeyhole size={17} /></span><strong>Private by design</strong><p>Your account session stays in a secure, HTTP-only cookie.</p></article>
        </div>
      </section>
      <p className="settings-note">More account controls live in your <Link to="/profile">profile</Link>.</p>
    </main>
  );
}
