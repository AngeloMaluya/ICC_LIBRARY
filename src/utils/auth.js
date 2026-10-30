const GOOGLE_TEMP_KEYS = ["googleEmail", "googleName", "googlePicture"];

// Called after a successful Google sign-in, whether or not the account already exists in the database.

export const saveGoogleTempUser = (user) => {
  sessionStorage.setItem("googleEmail", user.email);
  sessionStorage.setItem("googleName", user.name);
  sessionStorage.setItem("googlePicture", user.picture);
};

// Called once the temporary Google info has been consumed

export const clearGoogleTempUser = () => {
  GOOGLE_TEMP_KEYS.forEach((key) => sessionStorage.removeItem(key));
};

export const logout = (navigate, redirectTo = "/") => {
  localStorage.removeItem("libraryUser");
  clearGoogleTempUser();
  navigate(redirectTo);
};
