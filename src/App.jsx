import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./index.css";
import Landing from "./landing/landing";
import Login from "./login/login";
import Library from "./library/library";
import Profile from "./profile/profile";


function App() {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        alert("Printing is disabled on this website.");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/library" element={<Library />} />
    </Routes>
  );
}

export default App;