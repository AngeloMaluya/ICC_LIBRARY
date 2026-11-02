const GOOGLE_TEMP_KEYS = [
  "googleEmail",
  "googleName",
  "googlePicture",
];

export const saveGoogleTempUser = (user) => {
  sessionStorage.setItem("googleEmail", user.email);
  sessionStorage.setItem("googleName", user.name);
  sessionStorage.setItem("googlePicture", user.picture || "");
};

export const clearGoogleTempUser = () => {
  GOOGLE_TEMP_KEYS.forEach((key) => {
    sessionStorage.removeItem(key);
  });
};

export const logout = (navigate, redirectTo = "/") => {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("libraryUser");
  sessionStorage.removeItem("googleSignupToken");

  clearGoogleTempUser();

  navigate(redirectTo);
};