import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, MessageCircle, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useAuthStore.js";

export default function SignUp() {
  const signUp = useAuthStore((state) => state.signUp);
  const isSigningUp = useAuthStore((state) => state.isSigningUp);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (new TextEncoder().encode(password).length > 72) {
      toast.error("Password must be no more than 72 bytes.");
      return;
    }
    await signUp({ username: username.trim(), email: email.trim(), password });
  };

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <Link to="/signup" className="auth-brand" aria-label="ChatUp">
        <span className="brand-mark"><MessageCircle size={20} /></span>
        <span>chat<span className="brand-accent">up</span></span>
      </Link>
      <section className="auth-card">
        <div className="auth-eyebrow"><span className="eyebrow-line" /> A LITTLE CLOSER</div>
        <h1>Make room<br />for good chats.</h1>
        <p className="auth-subtitle">Create your account and find your people.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="username">Your name</label>
          <div className="input-wrap">
            <UserRound size={17} aria-hidden="true" />
            <input id="username" type="text" autoComplete="name" placeholder="How should we call you?" value={username} onChange={(event) => setUsername(event.target.value)} required maxLength={50} />
          </div>
          <label className="field-label" htmlFor="email">Email address</label>
          <div className="input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </div>
          <label className="field-label" htmlFor="password">Password</label>
          <div className="input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={6} />
            <button className="input-action" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button className="primary-button auth-submit" type="submit" disabled={isSigningUp}>
            {isSigningUp ? <span className="button-spinner" /> : null}
            {isSigningUp ? "Creating account…" : "Create account"}
          </button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in <span aria-hidden="true">→</span></Link></p>
      </section>
      <p className="auth-footnote">PRIVATE CONVERSATIONS · REAL-TIME CONNECTIONS</p>
    </main>
  );
}
