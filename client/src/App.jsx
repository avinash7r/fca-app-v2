import { useEffect } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";
import HomePage from "./pages/HomePage.jsx";
import Login from "./pages/Login.jsx";
import SignUp from "./pages/SignUp.jsx";
import Profile from "./pages/Profile.jsx";
import Setting from "./pages/Setting.jsx";
import { useAuthStore } from "./store/useAuthStore.js";
import { useMsgStore } from "./store/useMsgStore.js";

function LoadingScreen() {
  return (
    <main className="loading-screen" role="status" aria-label="Loading your account">
      <LoaderCircle className="loading-spinner" aria-hidden="true" />
      <span>Connecting to ChatUp</span>
    </main>
  );
}

function ProtectedLayout() {
  const authUser = useAuthStore((state) => state.authUser);
  if (!authUser) return <Navigate to="/login" replace />;

  return (
    <div className="app-shell">
      <Navbar />
      <Outlet />
    </div>
  );
}

function GuestLayout() {
  const authUser = useAuthStore((state) => state.authUser);
  return authUser ? <Navigate to="/" replace /> : <Outlet />;
}

export default function App() {
  const authCheck = useAuthStore((state) => state.authCheck);
  const isCheckingAuth = useAuthStore((state) => state.isCheckingAuth);
  const authUserId = useAuthStore((state) => state.authUser?._id);
  const resetMessages = useMsgStore((state) => state.reset);

  useEffect(() => {
    authCheck();
  }, [authCheck]);

  useEffect(() => {
    resetMessages();
  }, [authUserId, resetMessages]);

  if (isCheckingAuth) return <LoadingScreen />;

  return (
    <>
      <Routes>
        <Route element={<GuestLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
        </Route>
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Setting />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { background: "#17201f", color: "#f2f5f3", border: "1px solid #2b3a36" },
        }}
      />
    </>
  );
}
