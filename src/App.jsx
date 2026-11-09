
import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import "./index.css";

import Landing from "./landing/landing";
import Login from "./utils/login/login.jsx";
import Create from "./utils/create/create.jsx";

import Library from "./user/library/library.jsx";
import Program from "./user/library/program.jsx";
import ViewingHistory from "./user/ViewingHistory/ViewingHistory";
import Saved from "./user/saved/saved";

import FullView from "./components/fullView/FullView";
import Profile from "./components/profile/profile";

import AdminProtectedRoute from "./AdminProtectedRoute.jsx";
import GoogleProtectedRoute from "./googleprotectedroute.jsx";
import UserLayout from "./user/userlayout/userlayout.jsx";

import Dashboard from "./admin/component/dashboard/dashboard";
import Upload from "./admin/component/upload/upload";
import AdminProgram from "./admin/component/program/program";
import Reports from "./admin/component/reports/reports";
import AdminLayout from "./admin/layout/AdminLayout.jsx";

import { Analytics } from "@vercel/analytics/react";

function App() {
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
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route element={<AdminProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/program" element={<AdminProgram />} />
            <Route path="/reports" element={<Reports />} />
          </Route>
        </Route>

        <Route
          path="/create"
          element={
            <GoogleProtectedRoute>
              <Create />
            </GoogleProtectedRoute>
          }
        />

        <Route
          element={
            <GoogleProtectedRoute>
              <UserLayout />
            </GoogleProtectedRoute>
          }
        >
          <Route path="/library" element={<Library />} />
          <Route path="/library/:program" element={<Program />} />
          <Route path="/history" element={<ViewingHistory />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/fullview/:id" element={<FullView />} />
          <Route path="/saved" element={<Saved />} />
        </Route>
      </Routes>

      <Analytics />
    </>
  );
}

export default App;
