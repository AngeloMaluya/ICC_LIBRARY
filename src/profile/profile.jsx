import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import Image from "../assets/icon.png";
import { clearGoogleTempUser } from "../utils/auth.js";

export const Profile = () => {

  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "Create Account";
  }, []);

  const googleEmail = localStorage.getItem("googleEmail") || "";

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    course: "",
    year: "",
    email: googleEmail,
    password: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Account Created!");

      // Save the newly created user
      localStorage.setItem("libraryUser", JSON.stringify(data.user));

      // Remove temporary Google information
      clearGoogleTempUser();

      // Go to library
      navigate("/library");

    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">

      <div className="register-card">

        {/* LEFT */}
        <div className="left-side">

          <h1>Create Account</h1>

          <img
            src={Image}
            alt="Illustration"
          />

          <h2>DISCOVER KNOWLEDGE</h2>

          <p>
            Sign in to manage your library activities
            <br />
            and stay connected with your campus library.
          </p>

        </div>

        {/* RIGHT */}
        <form
          className="right-side"
          onSubmit={handleSubmit}
        >

          <label>First Name</label>

          <input
            type="text"
            name="firstName"
            placeholder="Enter first name"
            value={form.firstName}
            onChange={handleChange}
            required
          />

          <label>Last Name</label>

          <input
            type="text"
            name="lastName"
            placeholder="Enter last name"
            value={form.lastName}
            onChange={handleChange}
            required
          />

          <label>Course</label>

          <input
            type="text"
            name="course"
            placeholder="Enter course"
            value={form.course}
            onChange={handleChange}
            required
          />

          <label>Year</label>

          <input
            type="number"
            name="year"
            min="1"
            max="4"
            step="1"
            placeholder="Enter year"
            value={form.year}
            onChange={handleChange}
            required
          />

          <label>Email</label>

          <input
            type="email"
            name="email"
            value={form.email}
            readOnly
            required
          />

          <small className="email-note">
            This email is linked to your Google account and cannot be changed.
          </small>

          <label>Password</label>

          <input
            type="password"
            name="password"
            placeholder="Enter password"
            value={form.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

        </form>

      </div>

    </div>
  );
};

export default Profile;
