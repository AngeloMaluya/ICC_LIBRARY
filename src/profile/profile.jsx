import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";
import Image from "../assets/icon.png";

export const Profile = () => {

  useEffect(() => {
    document.title = "Create Account";
  }, []);

  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    course: "",
    year: "",
    username: "",
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

      const response = await fetch(
        "http://localhost:5000/api/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );


      const data = await response.json();


      if (!response.ok) {

        alert(data.message);

        return;
      }


      alert("Account Created!");

      // Save returned user information
      localStorage.setItem(
        "libraryUser",
        JSON.stringify(data.user)
      );


      navigate("/library");


    } catch (error) {

      console.error(error);

      alert(
        "Cannot connect to the server. Make sure your backend is running."
      );

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
            placeholder="Enter year"
            value={form.year}
            onChange={handleChange}
            required
          />


          <label>Username / Email</label>

          <input
            type="text"
            name="username"
            placeholder="Enter username"
            value={form.username}
            onChange={handleChange}
            required
          />


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

            {loading
              ? "Creating Account..."
              : "Create Account"}

          </button>

        </form>

      </div>

    </div>
  );
};

export default Profile;