import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getProgramImage } from "../../utils/programImages.js";
import "./profile.css";

const API_URL = import.meta.env.VITE_API_URL;

const programFullNames = {
  BSCS: "Bachelor of Science in Computer Science",
  BSBA: "Bachelor of Science in Business Administration",
  BSED: "Bachelor of Secondary Education",
  BEED: "Bachelor of Elementary Education",
  BSTM: "Bachelor of Science in Tourism Management",
  BSCrim: "Bachelor of Science in Criminology",
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
      <span className="profile-field-value">{value ?? "—"}</span>
    </div>
  );
}

function formatDate(date) {
  if (!date) return "";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? ""
    : parsed.toLocaleString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function ResearchCard({ item, type, onOpen }) {
  // Research details are nested in the API response.
  const research =
    item.summarized ||
    item.research ||
    item.researches ||
    item;

  const researchId = research.id ?? item.research_id;

  const date =
    type === "viewed"
      ? item.viewed_at
      : item.saved_at || item.created_at;

  return (
    <article className="profile-research-card">
      <div className="profile-research-cover">
          <img
            src={
              research.poster_url ||
              getProgramImage(research.program)
            }
            alt={research.title || "Research cover"}
            loading="lazy"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = getProgramImage(research.program);
            }}
          />
        </div>

      <div className="profile-research-info">
        <strong>
          {research.title || "Untitled Research"}
        </strong>

        <small>
          {research.program || "Unknown Program"}
          {" | "}
          {research.author || "Unknown Author"}
        </small>
      </div>

      <div className="profile-research-actions">
        <small>{formatDate(date)}</small>

        <button
          type="button"
          disabled={!researchId}
          onClick={() => onOpen(researchId)}
        >
          {type === "viewed" ? "Read Again" : "View Saved"}
        </button>
      </div>
    </article>
  );
}

function ResearchSection({
  title,
  description,
  items,
  loading,
  type,
  onViewAll,
  onOpen,
}) {
  return (
    <section className="profile-research-section">
      <div className="profile-section-header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>

        <button
          type="button"
          className="profile-view-all"
          onClick={onViewAll}
        >
          View All
          <span aria-hidden="true">›</span>
        </button>
      </div>

      <div className="profile-research-list">
        {loading ? (
          <p className="profile-empty">
            Loading research...
          </p>
        ) : items.length === 0 ? (
          <p className="profile-empty">
            {type === "viewed"
              ? "No recently viewed research yet."
              : "No recently saved research yet."}
          </p>
        ) : (
          items.map((item, index) => (
            <ResearchCard
              key={`${type}-${item.id ?? index}`}
              item={item}
              type={type}
              onOpen={onOpen}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default function Profile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [recentResearch, setRecentResearch] = useState([]);
  const [recentSaved, setRecentSaved] = useState([]);

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [savedLoading, setSavedLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    document.title = "My Profile";

    const controller = new AbortController();
    const token = sessionStorage.getItem("authToken");

    let storedUser = null;

    try {
      storedUser = JSON.parse(
        sessionStorage.getItem("libraryUser") || "null"
      );
    } catch {
      storedUser = null;
    }

    let email = storedUser?.email;

    if (!email && token) {
      try {
        const payload = token.split(".")[1];
        const base64 = payload
          .replace(/-/g, "+")
          .replace(/_/g, "/");

        email = JSON.parse(atob(base64)).email;
      } catch (error) {
        console.error("JWT DECODE ERROR:", error);
      }
    }

    if (!token || !email) {
      navigate("/login");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    const fetchJSON = async (url) => {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
      });

      if (response.status === 401) {
        throw new Error("SESSION_EXPIRED");
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Request failed.");
      }

      return data;
    };

    const handleError = (error) => {
      if (error.name === "AbortError") return;

      if (error.message === "SESSION_EXPIRED") {
        sessionStorage.removeItem("authToken");
        sessionStorage.removeItem("libraryUser");
        navigate("/login");
        return;
      }

      console.error("PROFILE REQUEST ERROR:", error);
    };

    // Load profile information.
    fetchJSON(
      `${API_URL}/api/user/${encodeURIComponent(email)}`
    )
      .then((data) => {
        if (!controller.signal.aborted) {
          setProfile(data.user || null);
        }
      })
      .catch(handleError)
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    // Load three latest viewing-history entries.
    fetchJSON(`${API_URL}/api/history`)
      .then((data) => {
        const latest = (data.history || [])
          .filter((item) => item.summarized)
          .sort(
            (a, b) =>
              new Date(b.viewed_at) - new Date(a.viewed_at)
          )
          .slice(0, 3);

        if (!controller.signal.aborted) {
          setRecentResearch(latest);
        }
      })
      .catch(handleError)
      .finally(() => {
        if (!controller.signal.aborted) {
          setHistoryLoading(false);
        }
      });

    // Load three latest saved research entries.
    fetchJSON(`${API_URL}/api/saved`)
      .then((data) => {
        const records =
          data.saved ||
          data.savedResearch ||
          data.researches ||
          data.bookmarks ||
          [];

        const latest = (Array.isArray(records) ? records : [])
          .sort(
            (a, b) =>
              new Date(b.saved_at || b.created_at || 0) -
              new Date(a.saved_at || a.created_at || 0)
          )
          .slice(0, 3);

        if (!controller.signal.aborted) {
          setRecentSaved(latest);
        }
      })
      .catch(handleError)
      .finally(() => {
        if (!controller.signal.aborted) {
          setSavedLoading(false);
        }
      });

    return () => controller.abort();
  }, [navigate]);

  if (loading) {
    return (
      <main className="profile-main">
        <p>Loading profile...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="profile-main">
        <p>Unable to load profile.</p>
      </main>
    );
  }

  const profilePicture =
    profile.profilePicture || profile.profile_picture;

  const initials = [
    profile.firstName?.[0],
    profile.lastName?.[0],
  ]
    .filter(Boolean)
    .join("")
    .toUpperCase();

  const isSHS = profile.educationLevel === "shs";

  const openResearch = (researchId) => {
    navigate(`/fullview/${researchId}`);
  };

  return (
    <div className="profile-page">
      <main className="profile-main">
        <h1 className="profile-page-title">
          My Profile
        </h1>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-avatar">
              {profilePicture && !imageError ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="profile-picture"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                initials || "U"
              )}
            </div>

            <div className="profile-name-container">
              <h2>
                {profile.firstName} {profile.lastName}
              </h2>
              <p className="profile-student-id">
                {profile.id}
              </p>
            </div>
          </div>

          <div className="profile-divider" />

          <div className="profile-details">
            <ProfileField
              label="Education Level"
              value={
                isSHS ? "Senior High School" : "College"
              }
            />

            <ProfileField
              label={isSHS ? "Strand" : "Course"}
              value={
                programFullNames[profile.course] ||
                profile.course
              }
            />

            <ProfileField
              label={isSHS ? "Grade Level" : "Year Level"}
              value={
                isSHS
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

          <div className="profile-research-grid">
            <ResearchSection
              title="Recently Viewed Research"
              description="Your most recently viewed research papers and theses."
              items={recentResearch}
              loading={historyLoading}
              type="viewed"
              onViewAll={() => navigate("/history")}
              onOpen={openResearch}
            />

            <ResearchSection
              title="Recently Saved Research"
              description="Your most recently saved research papers and theses."
              items={recentSaved}
              loading={savedLoading}
              type="saved"
              onViewAll={() => navigate("/saved")}
              onOpen={openResearch}
            />
          </div>
        </section>
      </main>
    </div>
  );
}
