import "./profile.css";

const profile = {
  firstName: "Juan",
  lastName: "Dela Cruz",
  studentId: "2022-1859",
  course: "Computer Science",
  yearLevel: "4th Year",
  section: "A",
  email: "juandelacruz@immaculada.edu.ph",
};

function SidebarIcon({ name }) {
  const paths = {
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    saved: <path d="M6 3h12v18l-6-4-6 4z" />,
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
        <path d="M3 3v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    logout: (
      <>
        <path d="M10 17l5-5-5-5" />
        <path d="M15 12H3" />
        <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
      </>
    ),
  };

  return (
    <svg
      className="profile-menu-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function ProfileField({ label, value }) {
  return (
    <div className="profile-field">
      <span className="profile-field-label">{label}</span>
      <span className="profile-field-value">{value || "—"}</span>
    </div>
  );
}

export default function Profile() {
  const handleLogout = () => {
    // Connect this to your existing logout function.
    console.log("Logout clicked");
  };

  const handleMenuClick = (page) => {
    // Connect these actions to your existing routes.
    console.log(`Navigate to ${page}`);
  };

  return (
    <div className="profile-page">
      <aside className="profile-sidebar">
        <div className="profile-brand">
          <img src={logo} alt="ICC School Seal" />
          <span>
            ICC
            <br />
            LIBRARY
          </span>
        </div>

        <nav className="profile-navigation" aria-label="Profile navigation">
          <button
            className="profile-nav-item active"
            onClick={() => handleMenuClick("profile")}
          >
            <SidebarIcon name="profile" />
            <span>Profile</span>
          </button>

          <button
            className="profile-nav-item"
            onClick={() => handleMenuClick("saved")}
          >
            <SidebarIcon name="saved" />
            <span>Saved</span>
          </button>

          <button
            className="profile-nav-item"
            onClick={() => handleMenuClick("history")}
          >
            <SidebarIcon name="history" />
            <span>Viewing History</span>
          </button>

          <button className="profile-nav-item" onClick={handleLogout}>
            <SidebarIcon name="logout" />
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      <main className="profile-main">
        <h1 className="profile-page-title">My Profile</h1>

        <section className="profile-card">
          <div className="profile-card-heading">
            <div className="profile-avatar" aria-hidden="true">
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
              label="Student ID"
              value={profile.studentId}
            />
            <ProfileField label="Course" value={profile.course} />
            <ProfileField
              label="Year Level"
              value={profile.yearLevel}
            />
            <ProfileField label="Section" value={profile.section} />
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
