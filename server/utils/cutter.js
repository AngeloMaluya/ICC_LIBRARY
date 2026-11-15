export const generateTitleMark = (title) => {
  if (!title || typeof title !== "string") {
    return "";
  }

  const words = title.trim().split(/\s+/);
  const articles = ["the", "a", "an"];

  while (
    words.length > 0 &&
    articles.includes(
      words[0].replace(/[^a-zA-Z]/g, "").toLowerCase()
    )
  ) {
    words.shift();
  }

  const firstWord = words[0] || "";

  return firstWord
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 3)
    .toUpperCase();
};
