import { Component, type ReactNode } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CreateCircle from "./pages/CreateCircle";
import JoinCircle from "./pages/JoinCircle";
import CircleDashboard from "./pages/CircleDashboard";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("Unhandled error in app tree:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: "100vh", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: 12,
          background: "#111111", color: "#F5F2EA", textAlign: "center", padding: 24,
        }}>
          <p style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 18, fontWeight: 700 }}>
            Something went wrong.
          </p>
          <p style={{ fontSize: 14, color: "#A8A49C" }}>
            Please refresh the page. If the problem persists, try again later.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      {/* Public marketing site */}
      <Route path="/" element={<Landing />} />

      {/* App shell */}
      <Route path="/app" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="explore" element={<Explore />} />
        <Route path="create" element={<CreateCircle />} />
        <Route path="join/:address" element={<JoinCircle />} />
        <Route path="circle/:address" element={<CircleDashboard />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </ErrorBoundary>
  );
}
