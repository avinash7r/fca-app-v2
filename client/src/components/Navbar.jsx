import { LogOut, MessageCircle, Settings2, UserRound } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore.js";

export default function Navbar() {
  const authUser = useAuthStore((state) => state.authUser);
  const logout = useAuthStore((state) => state.logout);
  const isSocketConnected = useAuthStore((state) => state.isSocketConnected);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (await logout()) navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <NavLink className="brand" to="/" aria-label="ChatUp home">
        <span className="brand-mark"><MessageCircle size={19} strokeWidth={2.4} /></span>
        <span>chat<span className="brand-accent">up</span></span>
        <span className="brand-tag">MESSENGER</span>
      </NavLink>

      <div className="topbar-right">
        <div className="connection-pill" title="Realtime connection status">
          <span className={`status-dot ${isSocketConnected ? "is-live" : ""}`} />
          <span>{isSocketConnected ? "Live connection" : "Connecting…"}</span>
        </div>
        <NavLink className="icon-button topbar-settings" to="/settings" aria-label="Settings">
          <Settings2 size={18} />
        </NavLink>
        <div className="topbar-divider" />
        <NavLink className="profile-chip" to="/profile">
          <img src={authUser?.profilePic || "/avatar.png"} alt="" />
          <span className="profile-chip-name">{authUser?.username}</span>
          <UserRound className="profile-chip-icon" size={15} />
        </NavLink>
        <button className="icon-button logout-button" onClick={handleLogout} aria-label="Log out" title="Log out">
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
