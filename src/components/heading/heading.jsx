import "./heading.css";
import { useNavigate } from "react-router-dom";
import Logo from "../../assets/icon.png";

export default function Heading() {
  const navigate = useNavigate();

  const user = localStorage.getItem("libraryUser");
  const isLoggedIn = !!user;

  const handleLogout = () => {
    localStorage.removeItem("libraryUser");
    localStorage.removeItem("googleEmail");
    localStorage.removeItem("googleName");
    localStorage.removeItem("googlePicture");

    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="nav-left">
          <img
          src={Logo}
          alt="ICC Logo"
          className="logo"
        />

        <h2>ICC Research Management</h2>

      </div>

      <nav className="nav-links">

        {isLoggedIn ? (
          <button
            type="button"
            className="login-btn"
            onClick={handleLogout}
          >
            Log Out
          </button>
        ) : (
          <button
            type="button"
            className="login-btn"
            onClick={() => navigate("/login")}
          >
            Log In
          </button>
        )}

      </nav>

    </header>
  );
}