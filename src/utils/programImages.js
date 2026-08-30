// Placeholder cover image per academic program.
// This exact object + function was duplicated word-for-word
// in library.jsx and program.jsx.

const PROGRAM_IMAGES = {
  BSCS: "/programs_placeholders/BSCS.png",
  BSBA: "/programs_placeholders/BSBA.png",
  BSED: "/programs_placeholders/BSED.png",
  BEED: "/programs_placeholders/BEED.png",
  BSTM: "/programs_placeholders/BSTM.png",
  BSCRIM: "/programs_placeholders/CRIM.png",
};

const DEFAULT_IMAGE = PROGRAM_IMAGES.BSCS;

export const getProgramImage = (programName) => {
  const normalizedProgram = programName?.toString().trim().toUpperCase();
  return PROGRAM_IMAGES[normalizedProgram] || DEFAULT_IMAGE;
};
