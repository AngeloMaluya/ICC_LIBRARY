import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";
import Image from "../assets/icon.png";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Login";
  }, []);

  const handleLogIn = (e) => {
    e.preventDefault();
    navigate("/library");
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

          <h1>Welcome Back</h1>

          <label>Username</label>
          <input
            type="email"
            placeholder="Username"
          />

          <label>Password</label>
          <input
            type="password"
            placeholder="Password"
          />

          <button
            className="signin"
            onClick={handleLogIn}
          >
            Sign In
          </button>

          <div className="divider">
            <span></span>
            <p>Or</p>
            <span></span>
          </div>

        
            <div>
   <GoogleLogin
    onSuccess={(credentialResponse) => {
      const user = jwtDecode(credentialResponse.credential);

      // Change this to your school's domain
      const allowedDomain = "immaculada.edu.ph";

      if (user.email.endsWith(`@${allowedDomain}`)) {
        alert(`Welcome ${user.name}!`);
        navigate("/profile");
      } else {
        alert("Only school email accounts are allowed.");
      }
    }}
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
    </div>
  );
};

export default Login;