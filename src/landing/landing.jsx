import { useEffect } from "react";
import "./landing.css";
import Header from "../components/heading/heading.jsx";
import landingImage from "../assets/img_repo/landing.jpg";

export const Landing = () => {
  useEffect(() => {
    document.title = "ICC LIBRARY";
  }, []);

  return (
    <div className="home">
      <Header />

      <main className="landing-content">
        <section className="hero">
          <h1>
           <span>ICC DIGITAL LIBRARY</span>
          </h1>

          <p>
            Explore research and thesis works from our academic community.
          </p>
        </section>

        <section className="welcome-card">
          <h2>WELCOME!</h2>

          <img
          src={landingImage}
        />
        </section>
      </main>
    </div>
  );
};

export default Landing;