import { Routes, Route } from "react-router-dom";
import { useEffect } from "react";
import "./index.css";
import { LoginSignup } from "./login/login.jsx";
import { Library } from "./library/library.jsx";

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
      <Route path="/" element={<LoginSignup />} />
      <Route path="/library" element={<Library />} />
    </Routes>
  );
}

export default App;