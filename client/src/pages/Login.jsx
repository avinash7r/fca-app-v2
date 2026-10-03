import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, MessageCircle } from "lucide-react";
import { useAuthStore } from "../store/useAuthStore.js";

export default function Login() {
  const login = useAuthStore((state) => state.login);
  const isLoggingIn = useAuthStore((state) => state.isLoggingIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await login({ email: email.trim(), password });
  };

  return (
    <main className="auth-page">
      <div className="auth-decoration auth-decoration-one" />
      <div className="auth-decoration auth-decoration-two" />
      <Link to="/login" className="auth-brand" aria-label="ChatUp">
        <span className="brand-mark"><MessageCircle size={20} /></span>
        <span>chat<span className="brand-accent">up</span></span>
      </Link>
      <section className="auth-card">
        <div className="auth-eyebrow"><span className="eyebrow-line" /> YOUR SPACE, YOUR PEOPLE</div>
        <h1>Good to see<br />you again.</h1>
        <p className="auth-subtitle">Pick up right where your conversations left off.</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="email">Email address</label>
          <div className="input-wrap">
            <Mail size={17} aria-hidden="true" />
            <input id="email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </div>
          <label className="field-label" htmlFor="password">Password</label>
          <div className="input-wrap">
            <LockKeyhole size={17} aria-hidden="true" />
            <input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button className="input-action" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          <button className="primary-button auth-submit" type="submit" disabled={isLoggingIn}>
            {isLoggingIn ? <span className="button-spinner" /> : null}
            {isLoggingIn ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="auth-switch">New to ChatUp? <Link to="/signup">Create an account <span aria-hidden="true">→</span></Link></p>
      </section>
      <p className="auth-footnote">PRIVATE CONVERSATIONS · REAL-TIME CONNECTIONS</p>
    </main>
  );
}
