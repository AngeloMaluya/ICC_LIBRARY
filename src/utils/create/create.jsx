
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./create.css";
import Image from "../../assets/icon.png";

export const Create = () => {
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    document.title = "Create Account";
  }, []);

  const googleEmail = sessionStorage.getItem("googleEmail") || "";
  const googlePicture = sessionStorage.getItem("googlePicture") || "";

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

    if (loading) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          course: form.course,
          year: form.year,
          password: form.password,
          signupToken: sessionStorage.getItem("googleSignupToken"),
        }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Account creation failed.");
        return;
      }

      const registeredUser = {
        ...data.user,
        profilePicture:
          data.user?.profilePicture || googlePicture || null,
      };

    sessionStorage.setItem("authToken", data.token);

    sessionStorage.setItem(
      "libraryUser",
      JSON.stringify(data.user)
    );

    sessionStorage.removeItem("googleSignupToken");
    sessionStorage.removeItem("googleEmail");
    sessionStorage.removeItem("googlePicture");
    sessionStorage.removeItem("googleName");

    alert("Account Created!");

    navigate(data.user.role === "admin" ? "/dashboard" : "/library");

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

          <select
            id="course"
            name="course"
            value={form.course}
            onChange={handleChange}
            required
          >
            <option value="">Select Course</option>
            <option value="BSCS">
              Bachelor of Science in Computer Science
            </option>
            <option value="BSBA">
              Bachelor of Science in Business Administration
            </option>
            <option value="BSED">
              Bachelor of Secondary Education
            </option>
            <option value="BEED">
              Bachelor of Elementary Education
            </option>
            <option value="BSTM">
              Bachelor of Science in Tourism Management
            </option>
            <option value="BSCrim">
              Bachelor of Science in Criminology
            </option>
          </select>

          <label>Year</label>

          <select
            id="year"
            name="year"
            value={form.year}
            onChange={handleChange}
            required
          >
            <option value="">Select Year</option>
            <option value="1">
              First Year
            </option>
            <option value="2">
              Second Year
            </option>
            <option value="3">
              Third Year
            </option>
            <option value="4">
              Fourth Year
            </option>
          </select>

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

export default Create;
