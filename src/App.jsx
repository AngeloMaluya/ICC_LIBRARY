
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import "./index.css";

// Public pages
import Landing from "./landing/landing";
import Login from "./utils/login/login.jsx";
import Create from "./utils/create/create.jsx";

// Student pages
import Library from "./user/library/library.jsx";
import Program from "./user/library/program.jsx";
import ViewingHistory from "./user/ViewingHistory/ViewingHistory";
import Saved from "./user/saved/saved";
import Profile from "./components/profile/profile";

// Shared PDF viewer
import FullView from "./components/fullView/FullView";

// Route protection
import StudentProtectedRoute from "./StudentProtectedRoute.jsx";
import AdminProtectedRoute from "./AdminProtectedRoute.jsx";
import GoogleProtectedRoute from "./googleprotectedroute.jsx";

// Layouts
import UserLayout from "./user/userlayout/userlayout.jsx";
import AdminLayout from "./admin/layout/AdminLayout.jsx";

// Admin pages
import Dashboard from "./admin/component/dashboard/dashboard";
import Upload from "./admin/component/upload/upload";
import AdminProgram from "./admin/component/program/program";
import Reports from "./admin/component/reports/reports";

import { Analytics } from "@vercel/analytics/react";

function App() {
  // Disable Ctrl+P and Cmd+P
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        alert("Printing is disabled on this website.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        {/* GOOGLE PROFILE REGISTRATION */}
        <Route element={<GoogleProtectedRoute />}>
          <Route path="/create" element={<Create />} />
        </Route>
        {/* ADMIN ROUTES */}
        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/program" element={<AdminProgram />} />
            <Route path="/reports" element={<Reports />} />

            {/* Admin PDF viewer with admin sidebar */}
            <Route
              path="/admin/fullview/:id"
              element={<FullView />}
            />
          </Route>
        </Route>

        {/* STUDENT ROUTES */}
        <Route element={<StudentProtectedRoute />}>
          <Route element={<UserLayout />}>
            <Route path="/library" element={<Library />} />
            <Route path="/library/:program" element={<Program />} />
            <Route path="/history" element={<ViewingHistory />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/saved" element={<Saved />} />

            {/* Student PDF viewer with student sidebar */}
            <Route
              path="/fullview/:id"
              element={<FullView />}
            />
          </Route>
        </Route>
      </Routes>

      {/* Vercel Analytics */}
      <Analytics />
    </>
  );
}

export default App;
