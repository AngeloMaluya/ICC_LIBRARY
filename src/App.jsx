import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";

import "./index.css";

import Landing from "./landing/landing";
import Login from "./login/login";
import Library from "./library/library";
import Program from "./library/program";

import Profile from "./profile/profile";

import ProtectedRoute from "./protectedroute.jsx";
import GoogleProtectedRoute from "./googleprotectedroute.jsx";

import Admin from "./admin/admin.jsx";

import { Analytics } from "@vercel/analytics/react";

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

        <Route
          path="/admin"
          element={<Admin />}
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
          path="/library"
          element={
            <Library />
          }
        />

        <Route
          path="/library/:program"
          element={
            <Program />
          }
        />

      </Routes>
      <Analytics />

    </>

  );

}

export default App;