
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
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem("authToken");

        const storedUser = JSON.parse(
          sessionStorage.getItem("libraryUser") || "null"
        );

        // Get email from stored user first, then from JWT payload.
        let email = storedUser?.email;

        if (!email && token) {
          try {
            const payload = JSON.parse(
              atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
            );

            email = payload.email;
          } catch (error) {
            console.error("Unable to read JWT payload:", error);
          }
        }

        if (!token) {
          console.error("No authentication token found.");
          return;
        }

        if (!email) {
          console.error("No user email found.");
          return;
        }

        const response = await fetch(
          `${API_URL}/api/user/${encodeURIComponent(email)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error("Profile fetch failed:", response.status, data);
          return;
        }

        setProfile(data.user || null);
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
              {(profile.profilePicture || profile.profile_picture) &&
              !imageError ? (
                <img
                  src={profile.profilePicture || profile.profile_picture}
                  alt="Profile"
                  className="profile-picture"
                  referrerPolicy="no-referrer"
                  onError={() => setImageError(true)}
                />
              ) : (
                (profile.firstName?.[0] || "") +
                (profile.lastName?.[0] || "")
              )}
            </div>

            <h2>
              {profile.firstName} {profile.lastName}
            </h2>
          </div>

          <div className="profile-divider" />

          <div className="profile-details">
            <ProfileField label="First Name" value={profile.firstName} />
            <ProfileField label="Last Name" value={profile.lastName} />
            <ProfileField label="User ID" value={profile.id} />
            <ProfileField label="Course" value={profile.course} />
            <ProfileField label="Year Level" value={profile.year} />
            <ProfileField label="Email Address" value={profile.email} />
          </div>
        </section>
      </main>
    </div>
  );
}
