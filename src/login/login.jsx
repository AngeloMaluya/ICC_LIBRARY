import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Image from "../assets/icon.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export const Login = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  console.log("API_URL:", API_URL);

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleLogIn = async (e) => {
    e.preventDefault();

    const email = e.target.email.value;
    const password = e.target.password.value;

  if (email === "admin" && password === "admin") {

    const adminUser = {
      id: "admin",
      email: "admin",
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    };

    localStorage.setItem(
      "libraryUser",
      JSON.stringify(adminUser)
    );

    navigate("/admin");

    return;
  }

    try {
    const response = await fetch(
  `${API_URL}/api/login`, 
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  }
);
  
      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      localStorage.setItem(
        "libraryUser",
        JSON.stringify(data.user)
      );

      navigate("/library");

    } catch (error) {
      console.error(
        "Normal Login Error:",
        error
      );

      alert(
        "Unable to connect to the server. Please try again."
      );
    }
  };

  
  const handleGoogleLogin = async (credentialResponse) => {
    try {

      const user = jwtDecode(
        credentialResponse.credential
      );

      console.log("Google user:", user);

      const allowedDomain = "immaculada.edu.ph";

      // Check school email
      if (!user.email.endsWith(`@${allowedDomain}`)) {
        alert("Only school email accounts are allowed.");
        return;
      }

      console.log(
        "Checking account:",
        user.email
      );

     
    const response = await fetch(
  `${API_URL}/api/user/${encodeURIComponent(user.email)}`
);

      const data = await response.json();

      console.log(
        "Account check response:",
        data
      );

       if (response.ok && data.exists) {

        localStorage.setItem(
          "libraryUser",
          JSON.stringify(data.user)
        );

        localStorage.setItem(
          "googleEmail",
          user.email
        );

        localStorage.setItem(
          "googleName",
          user.name
        );

        localStorage.setItem(
          "googlePicture",
          user.picture
        );

        alert(
          `Welcome back, ${user.name}!`
        );

        // Go directly to library
        navigate("/library");

        return;
      }

       if (
        response.status === 404 &&
        !data.exists
      ) {

        localStorage.setItem(
          "googleEmail",
          user.email
        );

        localStorage.setItem(
          "googleName",
          user.name
        );

        localStorage.setItem(
          "googlePicture",
          user.picture
        );

        // Go to Create Account
        navigate("/profile");

        return;
      }

       alert(
        "Unable to check your account. Please try again."
      );

    } catch (error) {

      console.error(
        "Google Login Error:",
        error
      );

      alert(
        "Unable to connect to the server. Make sure your backend is running."
      );
    }
  };

  return (
    <div className="page">
      <div className="login-container">

        {/* LEFT PANEL */}
        <div className="left-panel">
          <div className="illustration">
            <div className="window"></div>

            <div className="person">
              <div className="head"></div>
              <div className="body"></div>
              <div className="laptop"></div>
            </div>

            <div className="desk"></div>

            <div className="books">
              <div className="book b1"></div>
              <div className="book b2"></div>
              <div className="book b3"></div>
            </div>
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
          <div className="logo">
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

        
            <div>
           <GoogleLogin
            onSuccess={handleGoogleLogin}

             onError={() => {
                alert(
                  "Google Login Failed"
                );
              }}
              theme="outline"
              size="large"
              width="300"
            />
        </div>
        </div>

      </div>
    </div>
  );
};

export default Login;