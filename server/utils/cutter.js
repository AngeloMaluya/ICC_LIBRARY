export const generateTitleMark = (title) => {
  const words = String(title || "").trim().split(/\s+/);
  while (words.length && ["the", "a", "an"].includes(words[0].replace(/[^a-zA-Z]/g, "").toLowerCase())) words.shift();
  return (words[0] || "").replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase();
};
