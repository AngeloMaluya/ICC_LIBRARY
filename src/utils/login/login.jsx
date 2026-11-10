
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Image from "../../assets/icon.png";
import logImage from "../../assets/img_repo/login.png";
import { GoogleLogin } from "@react-oauth/google";
import TermsModal from "../../components/terms/TermsModal.jsx";

// Convert bytes into Base64URL format.
const base64Url = (bytes) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export const Login = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL;

  const isDesktopApp =
    typeof window.chrome?.webview?.postMessage === "function";

  const [showTerms, setShowTerms] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [pendingDesktopLogin, setPendingDesktopLogin] = useState(false);
  const [desktopLoginBusy, setDesktopLoginBusy] = useState(false);

  // Keep the verifier outside React rendering state.
  const desktopVerifierRef = useRef(null);
  const desktopBusyRef = useRef(false);

  useEffect(() => {
    document.title = "Login";
  }, []);

  // =====================================================
  // SAVE AUTHENTICATED ACCOUNT
  // =====================================================

  const saveAuthenticatedUser = (data) => {
    sessionStorage.setItem("authToken", data.token);

    sessionStorage.setItem(
      "libraryUser",
      JSON.stringify(data.user)
    );

    sessionStorage.removeItem("googleSignupToken");
    sessionStorage.removeItem("googleEmail");
    sessionStorage.removeItem("googlePicture");
    sessionStorage.removeItem("googleName");

    const destination =
      data.user.role === "admin"
        ? "/dashboard"
        : "/library";

    navigate(destination, { replace: true });
  };

  // =====================================================
  // SAVE NEW GOOGLE STUDENT REGISTRATION
  // =====================================================

  const saveGoogleSignup = (data) => {
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

    navigate("/create", { replace: true });
  };

  // =====================================================
  // NORMAL EMAIL / PASSWORD LOGIN
  // =====================================================

  const handleLogIn = async (e) => {
    e.preventDefault();

    if (!termsAccepted) {
      setShowTerms(true);
      return;
    }

    const email =
      e.currentTarget.elements.email.value.trim();

    const password =
      e.currentTarget.elements.password.value;

    try {
      const response = await fetch(
        `${API_URL}/api/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        }
      );

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
      alert(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  // =====================================================
  // EXISTING WEBSITE GOOGLE LOGIN
  // =====================================================

  const processGoogleUser = async (credential) => {
    try {
      const response = await fetch(
        `${API_URL}/api/google-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ credential }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Google Login Failed.");
        return;
      }

      if (data.exists) {
        if (!data.token || !data.user) {
          alert("Invalid Google login response.");
          return;
        }

        saveAuthenticatedUser(data);
        return;
      }

      if (!data.signupToken || !data.googleUser) {
        alert("Invalid Google registration response.");
        return;
      }

      saveGoogleSignup(data);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      const credential = credentialResponse.credential;

      if (!credential) {
        alert("Google authentication failed.");
        return;
      }

      if (!termsAccepted) {
        setPendingGoogleUser(credential);
        setShowTerms(true);
        return;
      }

      await processGoogleUser(credential);
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login Failed.");
    }
  };

  // =====================================================
  // DESKTOP GOOGLE LOGIN
  // =====================================================

  const startDesktopGoogleLogin = async () => {
    if (!isDesktopApp || desktopBusyRef.current) {
      return;
    }

    desktopBusyRef.current = true;
    setDesktopLoginBusy(true);
    setTimeout(() => {
      if (desktopBusyRef.current) {
        cancelDesktopGoogleLogin();
        alert("Google Login timed out. Please try again.");
      }
    }, 3 * 60 * 1000);

    try {
      // Generate a random verifier for this login attempt.
      const randomBytes = new Uint8Array(64);
      window.crypto.getRandomValues(randomBytes);

      const verifier = base64Url(randomBytes);

      // Hash the verifier to create the challenge.
      const hash = await window.crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier)
      );

      const challenge = base64Url(
        new Uint8Array(hash)
      );

      desktopVerifierRef.current = verifier;

      // Send the login request to WPF.
      window.chrome.webview.postMessage({
        type: "GOOGLE_LOGIN",
        challenge,
      });
    } catch (error) {
      console.error(
        "Desktop Google Login Error:",
        error
      );

      desktopVerifierRef.current = null;
      desktopBusyRef.current = false;
      setDesktopLoginBusy(false);

      alert("Unable to start desktop Google Login.");
    }
  };

  const handleDesktopGoogleLogin = () => {
    const cancelDesktopGoogleLogin = () => {
      if (isDesktopApp) {
        window.chrome.webview.postMessage({
          type: "CANCEL_GOOGLE_LOGIN",
        });
      }

      desktopVerifierRef.current = null;
      desktopBusyRef.current = false;
      setDesktopLoginBusy(false);
    };
    if (desktopBusyRef.current) {
      return;
    }

    if (!termsAccepted) {
      setPendingDesktopLogin(true);
      setShowTerms(true);
      return;
    }

    startDesktopGoogleLogin();
  };
  
  // =====================================================
  // RECEIVE LOGIN RESULT FROM WPF WEBVIEW2
  // =====================================================

  useEffect(() => {
    if (!isDesktopApp) {
      return;
    }

    let mounted = true;

    const handleDesktopMessage = async (event) => {
      const message = event.data;

      if (
        !message ||
        typeof message !== "object" ||
        !desktopBusyRef.current
      ) {
        return;
      }

      // Handle an error from the Windows application.
      if (message.type === "DESKTOP_LOGIN_ERROR") {
        desktopVerifierRef.current = null;
        desktopBusyRef.current = false;

        if (mounted) {
          setDesktopLoginBusy(false);
          alert(
            message.message || "Desktop Google Login failed."
          );
        }

        return;
      }

      if (
        message.type !== "DESKTOP_LOGIN_SUCCESS" ||
        typeof message.code !== "string"
      ) {
        return;
      }

      const verifier = desktopVerifierRef.current;

      if (!verifier) {
        return;
      }

      // Prevent duplicate redemption.
      desktopVerifierRef.current = null;

      try {
        const response = await fetch(
          `${API_URL}/api/auth/desktop/exchange`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              code: message.code,
              verifier,
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Desktop login failed."
          );
        }

        if (!mounted) {
          return;
        }

        // Existing student or administrator.
        if (data.exists === true) {
          if (!data.token || !data.user) {
            throw new Error(
              "Invalid desktop login response."
            );
          }

          saveAuthenticatedUser(data);
          return;
        }

        // New student registration.
        if (data.exists === false) {
          if (!data.signupToken || !data.googleUser) {
            throw new Error(
              "Invalid desktop registration response."
            );
          }

          saveGoogleSignup(data);
          return;
        }

        throw new Error(
          "Unknown desktop authentication response."
        );
      } catch (error) {
        console.error(
          "Desktop Login Exchange Error:",
          error
        );

        if (mounted) {
          alert(
            error.message ||
              "Unable to complete desktop login."
          );
        }
      } finally {
        desktopBusyRef.current = false;

        if (mounted) {
          setDesktopLoginBusy(false);
        }
      }
    };

    window.chrome.webview.addEventListener(
      "message",
      handleDesktopMessage
    );

    return () => {
      mounted = false;

      window.chrome.webview.removeEventListener(
        "message",
        handleDesktopMessage
      );
    };
  }, [isDesktopApp, API_URL, navigate]);

  // =====================================================
  // TERMS AND CONDITIONS
  // =====================================================

  const handleTermsCheckbox = () => {
    if (!termsAccepted) {
      setShowTerms(true);
    } else {
      setTermsAccepted(false);
    }
  };

  const handleAgree = async () => {
    setTermsAccepted(true);
    setShowTerms(false);

    if (pendingDesktopLogin) {
      setPendingDesktopLogin(false);

      await startDesktopGoogleLogin();
      return;
    }

    if (pendingGoogleUser) {
      const credential = pendingGoogleUser;
      setPendingGoogleUser(null);

      await processGoogleUser(credential);
    }
  };

  const handleCloseTerms = () => {
    setShowTerms(false);
    setPendingGoogleUser(null);
    setPendingDesktopLogin(false);
  };

  // =====================================================
  // RENDER LOGIN PAGE
  // =====================================================

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

          <form
            onSubmit={handleLogIn}
            className="login-form"
          >
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

          {/* GOOGLE LOGIN */}
          <div className="google-login">
            {isDesktopApp ? (
            <div className="desktop-google-actions">
              <button
                type="button"
                className="desktop-google-login"
                onClick={handleDesktopGoogleLogin}
                disabled={desktopLoginBusy}
              >
                {desktopLoginBusy
                  ? "Signing in..."
                  : "Sign in with Google"}
              </button>

              {desktopLoginBusy && (
                <button
                  type="button"
                  className="desktop-cancel-login"
                  onClick={cancelDesktopGoogleLogin}
                >
                  Cancel Login
                </button>
              )}
            </div>
          ) : (
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => alert("Google Login Failed")}
              theme="outline"
              size="large"
              width="300"
            />
          )}
          </div>
        </div>
      </div>

      {/* TERMS AND CONDITIONS */}
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
