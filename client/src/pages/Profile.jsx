import { useRef, useState } from "react";
import { Camera, Check, Mail, ShieldCheck, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function Profile() {
  const authUser = useAuthStore((state) => state.authUser);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isUpdatingProfile = useAuthStore((state) => state.isUpdatingProfile);
  const inputRef = useRef(null);
  const [preview, setPreview] = useState("");

  const handleImageChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Choose a JPEG, PNG, WebP, or GIF image.");
      return;
    }
    if (file.size > MAX_IMAGE_SIZE) {
      toast.error("Your profile image must be 5 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => toast.error("Could not read that image.");
    reader.onload = async () => {
      if (typeof reader.result !== "string") return;
      setPreview(reader.result);
      const updated = await updateProfile({ profileImage: reader.result });
      if (!updated) setPreview("");
    };
    reader.readAsDataURL(file);
  };

  return (
    <main className="profile-page">
      <div className="page-heading">
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>Profile</h1>
        <p>A little about the person behind the messages.</p>
      </div>
      <section className="profile-card">
        <div className="profile-cover"><span className="cover-orbit cover-orbit-one" /><span className="cover-orbit cover-orbit-two" /><span className="profile-cover-label"><ShieldCheck size={14} /> PRIVATE ACCOUNT</span></div>
        <div className="profile-card-body">
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrap">
              <img className="profile-avatar" src={preview || authUser?.profilePic || "/avatar.png"} alt={`${authUser?.username || "Your"} profile`} />
              <button className="profile-camera" type="button" onClick={() => inputRef.current?.click()} disabled={isUpdatingProfile} aria-label="Change profile photo"><Camera size={17} /></button>
              <input ref={inputRef} className="visually-hidden" type="file" accept={ACCEPTED_IMAGE_TYPES.join(",")} onChange={handleImageChange} />
            </div>
            <div className="profile-name"><h2>{authUser?.username}</h2><span><i /> ChatUp member</span></div>
            {isUpdatingProfile ? <span className="profile-saving"><span className="button-spinner" /> Saving</span> : null}
          </div>
          <div className="profile-details">
            <div className="profile-detail"><span className="detail-icon"><UserRound size={17} /></span><div><span>DISPLAY NAME</span><strong>{authUser?.username}</strong></div><Check size={16} className="detail-check" /></div>
            <div className="profile-detail"><span className="detail-icon"><Mail size={17} /></span><div><span>EMAIL ADDRESS</span><strong>{authUser?.email}</strong></div><Check size={16} className="detail-check" /></div>
          </div>
          <p className="profile-help">Update your photo anytime. Use a JPEG, PNG, WebP, or GIF file up to 5 MB.</p>
        </div>
      </section>
    </main>
  );
}
