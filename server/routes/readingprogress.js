
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyStudentToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// GET STUDENT'S LAST READ PAGE
router.get("/:researchId", verifyStudentToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const researchId = Number(req.params.researchId);

    if (!Number.isSafeInteger(researchId) || researchId < 1) {
      return res.status(400).json({
        success: false,
        message: "Invalid research ID.",
      });
    }

    const { data, error } = await supabase
      .from("reading_progress")
      .select("last_page")
      .eq("user_id", userId)
      .eq("research_id", researchId)
      .maybeSingle();

    if (error) throw error;

    return res.json({
      success: true,
      lastPage: data?.last_page ?? 1,
    });

  } catch (error) {
    console.error("GET READING PROGRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to retrieve reading progress.",
    });
  }
});

// SAVE STUDENT'S CURRENT PAGE
router.put("/:researchId", verifyStudentToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const researchId = Number(req.params.researchId);
    const page = req.body?.page;

    if (
      !Number.isSafeInteger(researchId) ||
      researchId < 1 ||
      !Number.isSafeInteger(page) ||
      page < 1
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid research ID or page number.",
      });
    }

    const { error } = await supabase
      .from("reading_progress")
      .upsert(
        {
          user_id: userId,
          research_id: researchId,
          last_page: page,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,research_id",
        }
      );

    if (error) throw error;

    return res.json({
      success: true,
      lastPage: page,
    });

  } catch (error) {
    console.error("SAVE READING PROGRESS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to save reading progress.",
    });
  }
});

export default router;
