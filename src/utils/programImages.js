const PROGRAM_IMAGES = {
  BSCS: "/programs_placeholders/BSCS.png",
  BSBA: "/programs_placeholders/BSBA.png",
  BSED: "/programs_placeholders/BSED.png",
  BEED: "/programs_placeholders/BEED.png",
  BSTM: "/programs_placeholders/BSTM.png",
  BSCRIM: "/programs_placeholders/CRIM.png",

  STEM: "/programs_placeholders/STEM.png",
  ABM: "/programs_placeholders/ABM.png",
  HUMSS: "/programs_placeholders/HUMSS.png",
  GAS: "/programs_placeholders/GAS.png",
  HE: "/programs_placeholders/HE.png",
  ICT: "/programs_placeholders/ICT.png",

};

const DEFAULT_IMAGE = PROGRAM_IMAGES.BSCS;

export const getProgramImage = (programName) => {
  const normalizedProgram = programName?.toString().trim().toUpperCase();
  return PROGRAM_IMAGES[normalizedProgram] || DEFAULT_IMAGE;
};
