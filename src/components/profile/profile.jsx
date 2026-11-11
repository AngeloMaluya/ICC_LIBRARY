import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./profile.css";

const programFullNames = {
  // College
  BSCS: "Bachelor of Science in Computer Science",
  BSBA: "Bachelor of Science in Business Administration",
  BSED: "Bachelor of Secondary Education",
  BEED: "Bachelor of Elementary Education",
  BSTM: "Bachelor of Science in Tourism Management",
  BSCrim: "Bachelor of Science in Criminology",

  // Senior High School
  STEM: "Science, Technology, Engineering, and Mathematics",
  ABM: "Accountancy, Business, and Management",
  HUMSS: "Humanities and Social Sciences",
  GAS: "General Academic Strand",
  HE: "Home Economics",
  ICT: "Information and Communications Technology",
};

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || "—"}</span>
    </div>
  );
}

export default function Profile() {
  
  const [recentResearch, setRecentResearch] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        // Get authentication token
        const token = sessionStorage.getItem("authToken");

        // Get stored user information
        const storedUser = JSON.parse(
          sessionStorage.getItem("libraryUser") || "null"
        );

        // Get email from stored user
        let email = storedUser?.email;

        // If email is missing, try reading it from the JWT
        if (!email && token) {
          try {
            const payload = JSON.parse(
              atob(
                token
                  .split(".")[1]
                  .replace(/-/g, "+")
                  .replace(/_/g, "/")
              )
            );

            email = payload.email;
          } catch (error) {
            console.error("Unable to read JWT payload:", error);
          }
        }

        // Check authentication
        if (!token || !email) {
          console.error("Missing authentication token or email.");

          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("libraryUser");

          navigate("/login");
          return;
        }

        // Request profile from backend
        const response = await fetch(
          `${API_URL}/api/user/${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();

        // Handle expired or invalid token
        if (response.status === 401) {
          sessionStorage.removeItem("authToken");
          sessionStorage.removeItem("libraryUser");

          alert("Your session has expired. Please log in again.");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile."
          );
        }

        setProfile(data.user || null);
      } catch (error) {
        console.error("Profile Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [API_URL, navigate]);

useEffect(() => {
  const fetchRecentResearch = async () => {
    try {
      setHistoryLoading(true);

      const token = sessionStorage.getItem("authToken");

      if (!token) return;

      const response = await fetch(`${API_URL}/api/history`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load viewing history.");
      }

      const data = await response.json();

      console.log("Recent Research History:", data);

      const latestThree = (data.history || [])
        .filter((item) => item.summarized)
        .sort(
          (a, b) =>
            new Date(b.viewed_at) - new Date(a.viewed_at)
        )
        .slice(0, 3);

      setRecentResearch(latestThree);

    } catch (error) {
      console.error("Recent Research Error:", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  fetchRecentResearch();
}, [API_URL]);

  if (loading) {
    return (
      <div className="profile-page">
        <main className="profile-main">
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <main className="profile-main">
          <p>Unable to load profile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <main className="profile-main">
        <h1 className="profile-page-title">My Profile</h1>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-avatar">
              {(profile.profilePicture || profile.profile_picture) &&
              !imageError ? (
                <img
                  src={
                    profile.profilePicture ||
                    profile.profile_picture
                  }
                  alt="Profile"
                  className="profile-picture"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                (profile.firstName?.[0] || "") +
                (profile.lastName?.[0] || "") +
                (profile.id?.[0] || "") 
              )}
            </div>

            <div className="profile-name-container">
              <h2>{profile.firstName} {profile.lastName}</h2>
              <p className="profile-student-id">{profile.id}</p>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-details">
    
            <ProfileField
              label="Education Level"
              value={
                profile.educationLevel === "shs"
                  ? "Senior High School"
                  : profile.educationLevel === "college"
                  ? "College"
                  : "—"
              }
            />

            <ProfileField
              label={profile.educationLevel === "shs" ? "Strand" : "Course"}
              value={programFullNames[profile.course] || profile.course}
            />

            <ProfileField
              label={profile.educationLevel === "shs" ? "Grade Level" : "Year Level"}
              value={
                profile.educationLevel === "shs"
                  ? `Grade ${profile.year}`
                  : profile.year
              }
            />
            <ProfileField
              label="Section"
              value={profile.section}
            />
          

            <ProfileField
              label="Email Address"
              value={profile.email}
            />
          </div>

          <div className="profile-divider" />

          <div className="most-viewed">
            <h2>Recently Viewed Research</h2>
            <small>
              Your most recently viewed research papers and theses.
            </small>

            <div className="recent-research-list">
              {historyLoading ? (
                <p>Loading recently viewed research...</p>
              ) : recentResearch.length === 0 ? (
                <p>No recently viewed research yet.</p>
              ) : (
                recentResearch.map((item) => (
                  <div className="recent-research-card" key={item.id}>
                    <div className="recent-research-cover">
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt="" />
                      ) : (
                        <span>PDF</span>
                      )}
                    </div>

                    <div className="recent-research-info">
                      <strong>{item.title}</strong>
                      <small>{item.author || "Unknown Author"}</small>
                    </div>

                    <div className="recent-research-actions">
                      <small>
                        {item.viewed_at
                          ? new Date(item.viewed_at).toLocaleString()
                          : ""}
                      </small>

                      <button
                        type="button"
                        onClick={() => navigate(`/viewing/${item.research_id}`)}
                      >
                        Read Again
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </section>
      </main>
    </div>
  );
}