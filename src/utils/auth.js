const GOOGLE_TEMP_KEYS = ["googleEmail", "googleName", "googlePicture"];

// Called after a successful Google sign-in, whether or not the account already exists in the database.

export const saveGoogleTempUser = (user) => {
  localStorage.setItem("googleEmail", user.email);
  localStorage.setItem("googleName", user.name);
  localStorage.setItem("googlePicture", user.picture);
};

// Called once the temporary Google info has been consumed

export const clearGoogleTempUser = () => {
  GOOGLE_TEMP_KEYS.forEach((key) => localStorage.removeItem(key));
};

export const logout = (navigate, redirectTo = "/") => {
  localStorage.removeItem("libraryUser");
  clearGoogleTempUser();
  navigate(redirectTo);
};
