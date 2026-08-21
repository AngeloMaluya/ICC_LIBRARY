
import { useEffect } from "react";
import "./landing.css";
import Header from"../components/heading/heading.jsx"  

export const Landing = () => {

   useEffect(() => {
    document.title = "ICC LIBRARY";
  }, []);

  return (
  
    <div className="home">

      <Header/>
    
      <section className="hero">

        <h1>
          ICC <span>DIGITAL LIBRARY</span>
        </h1>

        <p>
          Explore research and thesis works from our academic community.
        </p>

      </section>

      <section className="welcome-card">

        <h2>WELCOME!</h2>

      </section>
   
      <section
        className="services"
        id="services"
      >

        <h2>Our Services</h2>

        <div className="service-container">

          <div className="service-card">
            <h3>Research Repository</h3>

            <p>
              Browse approved research papers and
              undergraduate theses.
            </p>
          </div>

          <div className="service-card">
            <h3>Digital Archive</h3>

            <p>
              Store and access academic documents
              anytime.
            </p>
          </div>

          <div className="service-card">
            <h3>Easy Search</h3>

            <p>
              Search by title, author,
              adviser or year.
            </p>
          </div>

        </div>

      </section>

      <section
        className="about"
        id="about"
      >

        <h2>About</h2>

        <p>
          The ICC Digital Library is designed to
          provide students and faculty with quick
          access to research papers, theses, and
          other academic publications.
        </p>

      </section>
    
      <section
        className="contact"
        id="contact"
      >

        <h2>Contact Us</h2>

        <p>Email : library@immaculada.edu.ph</p>

        <p>Phone : (000) 123-4567</p>

        <p>Immaculada Concepcion College</p>

      </section>

      <footer>
        © 2026 ICC Digital Library |
        All Rights Reserved.
      </footer>

    </div>
  );
}
export default Landing;