import { useEffect } from "react";
import "./library.css";
import Image from "../assets/icon.png";
import { GoogleLogin } from "@react-oauth/google";

export const LibraryArr = () => {
  useEffect(() => {
    document.title = "Library Management System";
  }, []);

  return (
    <div>
      {/* Your page content */}
    </div>
  );
};

export default LibraryArr;