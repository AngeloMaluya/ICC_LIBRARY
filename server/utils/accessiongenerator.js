import { generateTitleMark } from "./cutter.js";

const groups = {
  vowel: [
  ["b","c",2],
  ["d","k",3],
  ["l","m",4],
  ["n","o",5],
  ["p","q",6],
  ["r","r",7],
  ["s","t",8],
  ["u","y",9]
],
  s: [
    ["a","c",2],
    ["d","d",3],
    ["e","g",4],
    ["h","l",5],
    ["m","s",6],
    ["t","t",7],
    ["u","v",8],
    ["w","z",9]],
  qu: [
    ["a","d",3],
    ["e","h",4],
    ["i","n",5],
    ["o","q",6],
    ["r","s",7],
    ["t","x",8],
    ["y","y",9]
  ],
  consonant: [
    ["a","d",3],
    ["e","h",4],
    ["i","n",5],
    ["o","q",6],
    ["r","t",7],
    ["u","x",8],
    ["y","y",9]
  ],
  expansion: [
    ["a","d",3],
    ["e","h",4],
    ["i","l",5],
    ["m","o",6],
    ["p","s",7],
    ["t","v",8],
    ["w","z",9]],
};

function digitFor(letter, group) {
  const range = groups[group].find(([first, last]) => letter >= first && letter <= last);
  
  if (!range) throw new Error(`No ${group} Cutter mapping for letter '${letter}'`);
    return String(range[2]);
  }

export const getTitleMark = (title) => generateTitleMark(title).toLowerCase();

// Treat the first comma-delimited name as the first listed author.
// Supports "First Middle Last" and "Last, First" only when explicitly configured.
export const getAuthorSurname = (author, { surnameFirst = false } = {}) => {
  const first = String(author || "").split(/;|\band\b|&/i)[0].trim();
  if (!first) throw new Error("Author name is required");
  const surname = surnameFirst && first.includes(",")
    ? first.split(",")[0].trim()
    : first.split(",")[0].trim().split(/\s+/).at(-1);
  const normalized = surname.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z]/g, "").toLowerCase();
  if (normalized.length < 2) throw new Error(`Surname '${surname}' needs at least two letters`);
    return normalized;
  };

// Table-based Cutter: initial + digit for second letter (or third after Qu).
// Optional expansion digits distinguish names with the same initial Cutter.
export const generateCutterNumber = (author, { expansionDigits = 0, surnameFirst = false } = {}) => {
  
  const surname = getAuthorSurname(author, { surnameFirst });
  const initial = surname[0].toUpperCase();
  const qu = surname.startsWith("qu");
  const letterIndex = qu ? 2 : 1;
  
  if (!surname[letterIndex]) throw new Error(`Surname '${surname}' is too short`);
  
  const group = qu ? "qu" : "aeiou".includes(surname[0]) ? "vowel" : surname[0] === "s" ? "s" : "consonant";
  
  let digits = digitFor(surname[letterIndex], group);
  
  for (let i = 0; i < expansionDigits; i++) {
      const letter = surname[letterIndex + 1 + i];
        if (!letter) throw new Error(`Surname '${surname}' has no letter for expansion ${i + 1}`);
          digits += digitFor(letter, "expansion");
  }
  return `${initial}${digits}`;
};

export const generateAccessionNumber = ({ title, author, year, cutterNumber, expansionDigits = 0 }) => {
  
  if (!title || !author || !year) throw new Error("Missing catalog metadata");
  
  const cutter = cutterNumber ?? generateCutterNumber(author, { expansionDigits });
  
  if (!/^[A-Z]\d+$/.test(String(cutter))) throw new Error("A valid Cutter number is required");
  
  const titleMark = getTitleMark(title);
  
  if (titleMark.length !== 3) throw new Error("Title must contain at least 3 letters");
  
  const publicationYear = Number(year);
  
  if (!Number.isInteger(publicationYear) || publicationYear < 1800 || publicationYear > 2100) throw new Error("Invalid publication year");
  
  return `THS ${cutter}${titleMark} ${publicationYear}`;
};
