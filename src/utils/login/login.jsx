
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Image from "../../assets/icon.png";
import logImage from "../../assets/img_repo/login.png";
import { GoogleLogin } from "@react-oauth/google";
import TermsModal from "../../components/terms/TermsModal.jsx";

export const Login = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "Login";
  }, []);

  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  //desktop log in
      const isDesktopApp =
      typeof window.chrome?.webview?.postMessage === "function";

    const [pendingDesktopLogin, setPendingDesktopLogin] =
      useState(false);

    const startDesktopGoogleLogin = () => {
      window.chrome.webview.postMessage("GOOGLE_LOGIN");
    };

    const handleDesktopGoogleLogin = () => {
      if (!termsAccepted) {
        setPendingDesktopLogin(true);
        setShowTerms(true);
        return;
      }

      startDesktopGoogleLogin();
    };

  // Save authenticated account
  const saveAuthenticatedUser = (data) => {
    sessionStorage.setItem("authToken", data.token);
    sessionStorage.setItem(
      "libraryUser",
      JSON.stringify(data.user)
    );

    // Clear temporary Google signup information
    sessionStorage.removeItem("googleSignupToken");
    sessionStorage.removeItem("googleEmail");
    sessionStorage.removeItem("googlePicture");
    sessionStorage.removeItem("googleName");

    // Redirect based on the role returned by the backend
    const destination =
      data.user.role === "admin" ? "/dashboard" : "/library";

    navigate(destination, { replace: true });
  };

  // NORMAL EMAIL/PASSWORD LOGIN
  const handleLogIn = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setShowTerms(true);
      return;
    }

    const email = e.currentTarget.elements.email.value.trim();
    const password = e.currentTarget.elements.password.value;

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
        alert(data.message || "Login failed.");
        return;
      }

      if (!data.token || !data.user) {
        alert("Invalid login response from the server.");
        return;
      }

      saveAuthenticatedUser(data);
    } catch (error) {
      console.error("Normal Login Error:", error);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async (credentialResponse) => {
    try {
      if (!credentialResponse.credential) {
        alert("Google authentication failed.");
        return;
      }

      if (!termsAccepted) {
        setPendingGoogleUser(credentialResponse.credential);
        setShowTerms(true);
        return;
      }

      await processGoogleUser(credentialResponse.credential);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed.");
    }
  };

  // PROCESS GOOGLE ACCOUNT
  const processGoogleUser = async (credential) => {
    try {
      const response = await fetch(`${API_URL}/api/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Google Login Failed.");
        return;
      }

      // EXISTING REGISTERED ACCOUNT
      if (data.exists) {
        if (!data.token || !data.user) {
          alert("Invalid Google login response.");
          return;
        }

        saveAuthenticatedUser(data);
        return;
      }

      // NEW STUDENT ACCOUNT
      if (!data.signupToken || !data.googleUser) {
        alert("Invalid Google registration response.");
        return;
      }

      sessionStorage.removeItem("authToken");
      sessionStorage.removeItem("libraryUser");

      sessionStorage.setItem(
        "googleSignupToken",
        data.signupToken
      );

      sessionStorage.setItem(
        "googleEmail",
        data.googleUser.email
      );

      sessionStorage.setItem(
        "googlePicture",
        data.googleUser.picture || ""
      );

      sessionStorage.setItem(
        "googleName",
        data.googleUser.name || ""
      );

      navigate("/create");
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Unable to connect to the server. Please try again.");
    }
  };

  // TERMS CHECKBOX
  const handleTermsCheckbox = () => {
    if (!termsAccepted) {
      setShowTerms(true);
    } else {
      setTermsAccepted(false);
    }
  };

  // USER AGREES TO TERMS
const handleAgree = async () => {
  setTermsAccepted(true);
  setShowTerms(false);

  if (pendingDesktopLogin) {
    setPendingDesktopLogin(false);
    startDesktopGoogleLogin();
    return;
  }

  if (pendingGoogleUser) {
    const credential = pendingGoogleUser;
    setPendingGoogleUser(null);

    await processGoogleUser(credential);
  }
};

  // USER CLOSES TERMS MODAL
const handleCloseTerms = () => {
  setShowTerms(false);
  setPendingGoogleUser(null);
  setPendingDesktopLogin(false);
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
            <label htmlFor="email">Email</label>

            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              required
            />

            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              name="password"
              placeholder="Password"
              required
            />

            <p>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={handleTermsCheckbox}
              />

              By checking “I agree,” you confirm that you have
              read, understood, and agree to follow these Terms
              and Conditions. You also acknowledge that you have
              read and understood the privacy policy.
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
        {isDesktopApp ? (
          <button
            type="button"
            className="desktop-google-login"
            onClick={handleDesktopGoogleLogin}
          >
            <span>Sign in with Google</span>
          </button>
        ) : (
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() => {
              alert("Google Login Failed");
            }}
            theme="outline"
            size="large"
            width="300"
          />
        )}
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
