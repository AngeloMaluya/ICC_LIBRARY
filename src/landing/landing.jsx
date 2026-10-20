import { useEffect } from "react";
import "./landing.css";
import Header from "../components/heading/heading.jsx";
import landingImage from "../assets/img_repo/landing.jpg";
import Icon from "../assets/icon.png";

export const Landing = () => {
  useEffect(() => {
    document.title = "ICC LIBRARY";
  }, []);

  return (
    <div className="home">
      <Header />

      <main className="landing-content">
        <section className="header">
          <h1>
           <span>ICC DIGITAL LIBRARY</span>
          </h1>

          <p>
            Explore research and thesis works from our academic community.
          </p>
        </section>

        <section className="welcome-card">
          <img src={landingImage}
        />
        </section>

        <section className="footer">
         <img src={Icon} />
          <h1>
            <span>The School Digital Library provides a centralized platform for accessing and viewing <br/> 
            research and thesis works produced by our academic community. <br/>
            © 2026 Immaculada Concepcion College</span>
          </h1>


        </section>
      </main>
    </div>
  );
};

export default Landing;