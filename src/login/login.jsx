import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Image from "../assets/icon.png";
import logImage from "../assets/img_repo/login.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { saveGoogleTempUser } from "../utils/auth.js";
import TermsModal from "../components/terms/TermsModal.jsx";

export const Login = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "Login";
  }, []);

  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  const handleLogIn = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setShowTerms(true);
      return;
    }

    const email = e.target.email.value;
    const password = e.target.password.value;

    // Test Admin
    if (email === "admin" && password === "admin") {
      const adminUser = {
        id: "admin",
        email: "admin",
        firstName: "Admin",
        lastName: "Admin",
        role: "admin",
      };

      sessionStorage.setItem("libraryUser", JSON.stringify(adminUser));
      navigate("/admin");
      return;
    }

    // Test Account
     if (email === "user" && password === "user") {
      const normalUser = {
        id: "user",
        email: "user",
        firstName: "User",
        lastName: "User",
        role: "user",
      };

      localStorage.setItem("libraryUser", JSON.stringify(normalUser));
      navigate("/library");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      sessionStorage.setItem("libraryUser", JSON.stringify(data.user));
      navigate("/library");
    } catch (error) {
      console.error("Normal Login Error:", error);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const user = jwtDecode(credentialResponse.credential);

      const allowedDomain = "immaculada.edu.ph";

      if (!user.email.endsWith(`@${allowedDomain}`)) {
        alert("Only school email accounts are allowed.");
        return;
      }

      if (!termsAccepted) {
        setPendingGoogleUser(user);
        setShowTerms(true);
        return;
      }

      await processGoogleUser(user);

    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed");
    }
  };

  const processGoogleUser = async (user) => {
    try {
      const response = await fetch(
        `${API_URL}/api/user/${encodeURIComponent(user.email)}`
      );

      const data = await response.json();

      console.log("User response:", data);

      if (response.ok && data.exists) {
        sessionStorage.setItem(
          "libraryUser",
          JSON.stringify(data.user)
        );

        saveGoogleTempUser(user);

        navigate("/library");
        return;
      }

      if (response.status === 404 && !data.exists) {
        saveGoogleTempUser(user);

        navigate("/create");
        return;
      }

      alert("Unable to check your account. Please try again.");

    } catch (error) {
      console.error("Google Login Error:", error);

      alert(
        "Unable to connect to the server. Make sure your backend is running."
      );
    }
  };

  // Checkbox clicked
  const handleTermsCheckbox = () => {
    if (!termsAccepted) {
      setShowTerms(true);
    } else {
      setTermsAccepted(false);
    }
  };

  // User clicks I Agree inside modal
  const handleAgree = async () => {
    setTermsAccepted(true);
    setShowTerms(false);

    if (pendingGoogleUser) {
      const user = pendingGoogleUser;

      setPendingGoogleUser(null);

      await processGoogleUser(user);
    }
  };

  // User closes/cancels modal
  const handleCloseTerms = () => {
    setShowTerms(false);
    setPendingGoogleUser(null);
  };

  return (
    <div className="page">
      <div className="login-container">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="illustration">
            <img src={logImage} alt="Illustration" />
          </div>

          <h2>DISCOVER KNOWLEDGE</h2>

          <p>
            Sign in to manage your library activities
            <br />
            and stay connected with your campus library.
          </p>
        </div>

        {/* RIGHT PANEL */}
        <div className="right-panel">
          <div className="login-logo">
            <img src={Image} alt="Logo" />
          </div>

          <h1>Welcome!</h1>

          <form onSubmit={handleLogIn} className="login-form">

            <label>Email</label>

            <input
              type="text"
              name="email"
              placeholder="Email"
              required
            />

            <label>Password</label>

            <input
              type="password"
              name="password"
              placeholder="Password"
              required
            />

            <p>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={() => {
                  if (!termsAccepted) {
                    setShowTerms(true);
                  } else {
                    setTermsAccepted(false);
                  }
                }}
              />
              By checking “I agree,” you confirm that you have read,
              understood, and agree to follow these Terms and Conditions.
              You also acknowledge that you have read and understood the
              privacy policy.
            </p>

            <button
              type="submit"
              className="signin"
            >
              Sign In
            </button>
          </form>

          <div className="divider">
            <span></span>
            <p>Or</p>
            <span></span>
          </div>

          <div className="google-login">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                alert("Google Login Failed");
              }}
              theme="outline"
              size="large"
              width="300"
            />
          </div>
        </div>

      </div>

      {showTerms && (
        <TermsModal
          onClose={handleCloseTerms}
          onAgree={handleAgree}
        />
      )}
    </div>
  );
};

export default Login;