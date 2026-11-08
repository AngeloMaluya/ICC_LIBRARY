import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import "./index.css";

import Landing from "./landing/landing";
import Login from "./login/login";
import Library from "./library/library";
import Program from "./library/program";
import FullView from "./components/fullView/FullView";
import ViewingHistory from "./ViewingHistory/ViewingHistory.jsx";

import Create from "./create/create";
import Profile from "./components/profile/profile";

import GoogleProtectedRoute from "./googleprotectedroute.jsx";


//admin
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

        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/program" element={<AdminProgram />} />
          <Route path="/reports" element={<Reports />} />
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
          path="/library"
          element={
            <GoogleProtectedRoute>
              <Library />
            </GoogleProtectedRoute>
          }
        />

        <Route
          path="/library/:program"
          element={
            <GoogleProtectedRoute>
              <Program />
            </GoogleProtectedRoute>
          }
        />

         <Route
          path="/history"
          element={
            <GoogleProtectedRoute>
              <ViewingHistory />
            </GoogleProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <GoogleProtectedRoute>
              <Profile />
            </GoogleProtectedRoute>
          }
        />

         <Route
          path="/fullview/:id"
          element={
            <GoogleProtectedRoute>
              <FullView />
            </GoogleProtectedRoute>
          }
        />

      </Routes>
      <Analytics />

    </>

  );

}

export default App;
