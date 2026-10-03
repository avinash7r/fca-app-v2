import { useEffect, useMemo, useState } from "react";
import { Search, UsersRound, X } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";
import { useMsgStore } from "../store/useMsgStore.js";

export default function Sidebar() {
  const users = useMsgStore((state) => state.users);
  const selectedUser = useMsgStore((state) => state.selectedUser);
  const isFetchingUsers = useMsgStore((state) => state.isFetchingUsers);
  const getUsers = useMsgStore((state) => state.getUsers);
  const selectUser = useMsgStore((state) => state.selectUser);
  const onlineUsers = useAuthStore((state) => state.onlineUsers);
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !normalizedSearch || `${user.username} ${user.email}`.toLowerCase().includes(normalizedSearch);
      const matchesOnline = !onlineOnly || onlineUsers.includes(user._id);
      return matchesSearch && matchesOnline;
    });
  }, [users, search, onlineOnly, onlineUsers]);

  return (
    <aside className="contacts-panel" aria-label="Contacts">
      <div className="contacts-heading">
        <div>
          <p className="eyebrow">YOUR PEOPLE</p>
          <h1>Messages <span className="contact-count">{users.length}</span></h1>
        </div>
        <button className="icon-button refresh-button" onClick={getUsers} aria-label="Refresh contacts" title="Refresh contacts" disabled={isFetchingUsers}>
          <UsersRound size={18} className={isFetchingUsers ? "subtle-spin" : ""} />
        </button>
      </div>

      <label className="contact-search">
        <Search size={16} aria-hidden="true" />
        <input type="search" placeholder="Find someone…" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search contacts" />
        {search ? <button type="button" className="search-clear" onClick={() => setSearch("")} aria-label="Clear search"><X size={14} /></button> : null}
      </label>

      <div className="contacts-toolbar">
        <span>CONTACTS <strong>{filteredUsers.length}</strong></span>
        <label className="online-filter"><input type="checkbox" checked={onlineOnly} onChange={(event) => setOnlineOnly(event.target.checked)} /><span>Online</span></label>
      </div>

      <div className="contacts-list">
        {isFetchingUsers && users.length === 0 ? (
          <div className="contacts-loading"><span className="button-spinner" /> Loading contacts…</div>
        ) : filteredUsers.length ? filteredUsers.map((user) => {
          const isOnline = onlineUsers.includes(user._id);
          const isSelected = selectedUser?._id === user._id;
          return (
            <button key={user._id} className={`contact-item ${isSelected ? "selected" : ""}`} onClick={() => selectUser(user)} aria-pressed={isSelected}>
              <span className="contact-avatar-wrap">
                <img src={user.profilePic || "/avatar.png"} alt="" className="contact-avatar" loading="lazy" />
                <span className={`contact-presence ${isOnline ? "online" : ""}`} />
              </span>
              <span className="contact-copy"><strong>{user.username}</strong><span>{user.email}</span></span>
              <span className={`contact-status ${isOnline ? "online-text" : ""}`}>{isOnline ? "Online" : "Offline"}</span>
            </button>
          );
        }) : (
          <div className="contacts-empty">
            <span className="contacts-empty-icon"><UsersRound size={20} /></span>
            <strong>{search || onlineOnly ? "No matches" : "No contacts yet"}</strong>
            <span>{search || onlineOnly ? "Try a different search or filter." : "New people will show up here when they join."}</span>
          </div>
        )}
      </div>

      <div className="contacts-footer"><span className="footer-pulse" /> PRIVATE MESSAGES · LIVE PRESENCE</div>
    </aside>
  );
}
