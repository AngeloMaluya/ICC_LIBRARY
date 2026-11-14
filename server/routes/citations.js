
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyStudentToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const VALID_STYLES = [
  "MLA",
  "APA",
  "Chicago",
  "Harvard",
  "Vancouver",
];

// Record a citation copy
router.post("/", verifyStudentToken, async (req, res) => {
  try {
    const { researchId, citationStyle } = req.body;

    const userId = req.user.id;
    const parsedResearchId = Number(researchId);

    if (
      !Number.isSafeInteger(parsedResearchId) ||
      parsedResearchId <= 0 ||
      !VALID_STYLES.includes(citationStyle)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid citation information.",
      });
    }

    // Verify that the research exists
    const { data: research, error: researchError } =
      await supabase
        .from("summarized")
        .select("id")
        .eq("id", parsedResearchId)
        .maybeSingle();

    if (researchError) {
      throw researchError;
    }

    if (!research) {
      return res.status(404).json({
        success: false,
        message: "Research not found.",
      });
    }

    // Record citation action
    const { error } = await supabase
      .from("citation_actions")
      .insert({
        user_id: userId,
        research_id: parsedResearchId,
        citation_style: citationStyle,
      });

    if (error) {
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Citation action recorded.",
    });
  } catch (error) {
    console.error("CITATION TRACKING ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to record citation.",
    });
  }
});

export default router;
