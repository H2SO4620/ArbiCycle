import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import CreateCircle from "./pages/CreateCircle";
import JoinCircle from "./pages/JoinCircle";
import CircleDashboard from "./pages/CircleDashboard";
import Profile from "./pages/Profile";
import Explore from "./pages/Explore";

export default function App() {
  return (
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
  );
}
