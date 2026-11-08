import Library from "../../../user/library/library.jsx";

// Reuse the research library for the admin Programs page
const AdminProgram = () => {
  return <Library isAdmin={true} />;
};

export default AdminProgram;