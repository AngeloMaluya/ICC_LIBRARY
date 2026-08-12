import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./index.css";

import Landing from "./landing/landing";
import Login from "./login/login";
import Library from "./library/library";
import Profile from "./profile/profile";
import Program from "./library/program";
import ProtectedRoute from "./components/protectedroute.jsx";

function App() {

  useEffect(() => {

    const handleKeyDown = (e) => {

      if (
        (e.ctrlKey || e.metaKey) &&
        e.key.toLowerCase() === "p"
      ) {

        e.preventDefault();

        alert(
          "Printing is disabled on this website."
        );

      }

    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };

  }, []);

  return (

    <Routes>

      {/* LANDING */}
      <Route
        path="/"
        element={<Landing />}
      />

      {/* LOGIN */}
      <Route
        path="/login"
        element={<Login />}
      />

      {/* CREATE ACCOUNT */}
      <Route
        path="/profile"
        element={<Profile />}
      />

      {/* PROTECTED LIBRARY */}
      <Route
        path="/library"
        element={
          <ProtectedRoute>
            <Library />
          </ProtectedRoute>
        }
      />

      {/* PROGRAM */}
      <Route
        path="/library/:program"
        element={<Program />}
      />

    </Routes>

  );
}

export default App;