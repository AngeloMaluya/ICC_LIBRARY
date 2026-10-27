import { useEffect, useState } from "react";
import "./profile.css";
import Sidebar from "../sidebar/sidebar.jsx";

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || "—"}</span>
    </div>
  );
}

export default function Profile() {
  const API_URL = import.meta.env.VITE_API_URL;

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUser = JSON.parse(
          localStorage.getItem("libraryUser")
        );

        if (!storedUser?.email) {
          setLoading(false);
          return;
        }

        const response = await fetch(
          `${API_URL}/api/user/${encodeURIComponent(storedUser.email)}`
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Profile fetch failed:", data);
          setLoading(false);
          return;
        }

        setProfile(data.user);
      } catch (error) {
        console.error("Profile Error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [API_URL]);

  if (loading) {
    return (
      <div className="profile-page">
        <Sidebar />

        <main className="profile-main">
          <p>Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <Sidebar />

        <main className="profile-main">
          <p>Unable to load profile.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <Sidebar />

      <main className="profile-main">
        <h1 className="profile-page-title">My Profile</h1>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-avatar">
              {(profile.firstName?.[0] || "") +
                (profile.lastName?.[0] || "")}
            </div>

            <h2>
              {profile.firstName} {profile.lastName}
            </h2>
          </div>

          <div className="profile-divider" />

          <div className="profile-details">
            <ProfileField
              label="First Name"
              value={profile.firstName}
            />

            <ProfileField
              label="Last Name"
              value={profile.lastName}
            />

            <ProfileField
              label="User ID"
              value={profile.id}
            />

            <ProfileField
              label="Course"
              value={profile.course}
            />

            <ProfileField
              label="Year Level"
              value={profile.year}
            />

            <ProfileField
              label="Email Address"
              value={profile.email}
            />
          </div>
        </section>
      </main>
    </div>
  );
}