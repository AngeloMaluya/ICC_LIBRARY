import { useEffect } from "react";
import "./login.css";
import Image from "../assets/icon.png";
import { GoogleLogin } from "@react-oauth/google";

export const LoginSignup = () => {
  useEffect(() => {
    document.title = "Login";
  }, []);

  return (
    <div className="login-container">
      <img src={Image} alt="Library Logo" className="logo" />

      <h1>Library Management System</h1>
      <p>Please sign in to continue.</p>

      <button className="login-btn">
        Log In
      </button>

    </div>
  );
};

export default LoginSignup;