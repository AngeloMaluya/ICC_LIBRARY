import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import Image from "../assets/icon.png";

export const Profile = () =>  {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    course: "",
    year: "",
    username: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    localStorage.setItem("libraryUser", JSON.stringify(form));

    alert("Account Created!");
    navigate("/");
  };

  return (
    <div className="register-page">
      <div className="register-card">

        {/* LEFT */}

        <div className="left-side">

          <h1>Create Account</h1>

          <img src={Image} alt="Illustration" />

          <h2>DISCOVER KNOWLEDGE</h2>

          <p>
            Sign in to manage your library activities
            <br />
            and stay connected with your campus library.
          </p>

        </div>

        {/* RIGHT */}

        <form className="right-side" onSubmit={handleSubmit}>

          <label>First Name</label>
          <input
            type="text"
            name="firstName"
            placeholder="Enter first name"
            onChange={handleChange}
          />

          <label>Last Name</label>
          <input
            type="text"
            name="lastName"
            placeholder="Enter last name"
            onChange={handleChange}
          />

          <label>Course</label>
          <input
            type="text"
            name="course"
            placeholder="BSIT"
            onChange={handleChange}
          />

          <label>Year</label>
          <input
            type="text"
            name="year"
            placeholder="4th Year"
            onChange={handleChange}
          />

          <label>Username</label>
          <input
            type="text"
            name="username"
            placeholder="Username"
            onChange={handleChange}
          />

          <label>Password</label>
          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
          />

          <button type="submit">
            Create Account
          </button>

        </form>

      </div>
    </div>
  );
}
export default Profile;