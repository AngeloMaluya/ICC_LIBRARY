// Remove initial English articles from the title
export const getTitleMark = (title) => {
  const cleaned = String(title || "")
    .trim()
    .replace(/^(the|an|a)\s+/i, "")
    .replace(/[^a-zA-Z]/g, "")
    .toLowerCase();

  return cleaned.slice(0, 3);
};

// Extract the author's surname
// Assumes the author is written as "First Last"
export const getAuthorSurname = (author) => {
  const name = String(author || "").trim();

  if (!name) {
    throw new Error("Author name is required.");
  }

  const parts = name.split(/\s+/);

  return parts[parts.length - 1];
};

// Generate a preliminary catalog number
export const generateCatalogNumber = ({
  title,
  author,
  year,
  cutterNumber,
  copyNumber = 1,
}) => {
  if (!title || !author || !year) {
    throw new Error("Missing catalog metadata.");
  }

  if (!/^[A-Z]\d+$/.test(String(cutterNumber || ""))) {
    throw new Error("A valid Cutter number is required.");
  }

  const titleMark = getTitleMark(title);

  if (titleMark.length !== 3) {
    throw new Error("Title must contain at least 3 letters.");
  }

  const publicationYear = Number(year);

  if (
    !Number.isInteger(publicationYear) ||
    publicationYear < 1800 ||
    publicationYear > 2100
  ) {
    throw new Error("Invalid publication year.");
  }

  if (!Number.isInteger(copyNumber) || copyNumber < 1) {
    throw new Error("Invalid copy number.");
  }

  return `THS ${cutterNumber}${titleMark} ${publicationYear} c.${copyNumber}`;
};
