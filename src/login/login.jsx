import { useState, useEffect } from "react";
import "./LoginSignup.css";
import Image from "../assets/icon.png";
import { GoogleLogin } from "@react-oauth/google";

export const LoginSignup = () => {
  const [mode, setMode] = useState("login");

  const [form, setForm] = useState({
    username: "",
    password: "",
    firstname: "",
    middlename: "",
    lastname: "",
    email: "",
    contact: "",
  });

  const pageTitle = {
    login: "Log In",
    signup: "Sign Up",
    forgot: "Forgot Password",
  }[mode];

  useEffect(() => {
    document.title = pageTitle;
  }, [pageTitle]);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setForm({
      username: "",
      password: "",
      firstname: "",
      middlename: "",
      lastname: "",
      email: "",
      contact: "",
    });
  };

  return (
    <>
      <div className="bg_logo">
        <img src={Image} alt="Logo" />
      </div>

      <div className="container">
        <div className="header">
          <div className="text">
            <h2>{pageTitle.toUpperCase()}</h2>
          </div>
        </div>

        <div className="inputs">

          {/* LOGIN */}

          {mode === "login" && (
            <>
              <div className="input">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

              <div className="input">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="submit-container">
                <button
                  className="submit signup"
                  onClick={() => {
                    resetForm();
                    setMode("signup");
                  }}
                >
                  Sign Up
                </button>

                <button className="submit login">
                  Log In
                </button>
              </div>

              <div className="forgotPw">
                <button
                  className="forgotPw-btn"
                  onClick={() => {
                    resetForm();
                    setMode("forgot");
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {/* SIGN UP */}

          {mode === "signup" && (
            <>
              <div className="input">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

              <div className="input">
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={handleChange}
                />
              </div>

              <div className="input">
                <input
                  type="text"
                  name="firstname"
                  placeholder="First Name"
                  value={form.firstname}
                  onChange={handleChange}
                />
              </div>

              <div className="input">
                <input
                  type="text"
                  name="middlename"
                  placeholder="Middle Name"
                  value={form.middlename}
                  onChange={handleChange}
                />
              </div>

              <div className="input">
                <input
                  type="text"
                  name="lastname"
                  placeholder="Last Name"
                  value={form.lastname}
                  onChange={handleChange}
                />
              </div>
                  <div className="input">
                <input
                  type="email"
                  name="email"
                  placeholder="Email Address"
                  value={form.email}
                  onChange={handleChange}
                />
              </div>

              <div className="input">
                <input
                  type="text"
                  name="contact"
                  placeholder="Contact Number"
                  maxLength={11}
                  value={form.contact}
                  onChange={handleChange}
                />
              </div>

              <div className="submitcontainer_sgn">
                <button className="submit_sgn">
                  Sign Up
                </button>

                <button
                  className="forgotPw-btn"
                  onClick={() => {
                    resetForm();
                    setMode("login");
                  }}
                >
                  Already have an account?
                </button>
              </div>
            </>
          )}

          {/* FORGOT PASSWORD */}

          {mode === "forgot" && (
            <>
              <div className="input">
                <input
                  type="text"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
              </div>

              <div className="submitcontainer_sgn">
                <button className="submit_sgn">
                  Send Reset Link
                </button>

                <button
                  className="forgotPw-btn"
                  onClick={() => {
                    resetForm();
                    setMode("login");
                  }}
                >
                  Back to Login
                </button>
              </div>
            </>
          )}        
          </div>
      </div>
    </>
  );
};

export default LoginSignup;