// Shared auth / localStorage helpers.
//
// The exact same "remove libraryUser + 3 google keys" logic was copy-pasted
// in heading.jsx, sidebar.jsx, program.jsx and admin.jsx. Centralizing it
// here means a future change (e.g. adding a new stored key) only has to
// happen once.

const GOOGLE_TEMP_KEYS = ["googleEmail", "googleName", "googlePicture"];

// Called after a successful Google sign-in, whether or not the account
// already exists in the database.
export const saveGoogleTempUser = (user) => {
  localStorage.setItem("googleEmail", user.email);
  localStorage.setItem("googleName", user.name);
  localStorage.setItem("googlePicture", user.picture);
};

// Called once the temporary Google info has been consumed
// (e.g. after account creation in Profile).
export const clearGoogleTempUser = () => {
  GOOGLE_TEMP_KEYS.forEach((key) => localStorage.removeItem(key));
};

// Full logout used by the sidebar, header, and admin page.
// `redirectTo` defaults to "/" but Program.jsx's old copy sent
// the user to "/login" instead - pass that in explicitly if needed.
export const logout = (navigate, redirectTo = "/") => {
  localStorage.removeItem("libraryUser");
  clearGoogleTempUser();
  navigate(redirectTo);
};
