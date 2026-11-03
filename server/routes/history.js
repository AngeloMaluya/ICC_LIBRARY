import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyStudentToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

/* =========================================================
   ADD / UPDATE VIEWING HISTORY
========================================================= */

router.post("/:researchId", verifyStudentToken, async (req, res) => {
  try {
    const { researchId } = req.params;
    const userId = req.user.id;

    if (!researchId) {
      return res.status(400).json({
        success: false,
        message: "Research ID is required.",
      });
    }

    // Check if the research exists
    const { data: research, error: researchError } = await supabase
      .from("summarized")
      .select("id")
      .eq("id", researchId)
      .maybeSingle();

    if (researchError) {
      console.error(
        "RESEARCH CHECK ERROR:",
        researchError
      );

      return res.status(500).json({
        success: false,
        message: "Failed to check research.",
      });
    }

    if (!research) {
      return res.status(404).json({
        success: false,
        message: "Research not found.",
      });
    }

    // Always create a NEW history entry
    const { data, error } = await supabase
      .from("viewing_history")
      .insert([
        {
          user_id: userId,
          research_id: researchId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(
        "HISTORY INSERT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to save viewing history.",
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Viewing history saved.",
      history: data,
    });
  } catch (error) {
    console.error(
      "ADD HISTORY ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});
/* =========================================================
   GET VIEWING HISTORY
========================================================= */

router.get("/", verifyStudentToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from("viewing_history")
      .select(`
        id,
        viewed_at,
        research_id,
        summarized (
          id,
          title,
          author,
          year,
          program,
          summary,
          pdf_url
        )
      `)
      .eq("user_id", userId)
      .order("viewed_at", {
        ascending: false,
      });

    if (error) {
      console.error("GET HISTORY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve viewing history.",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      history: data,
    });
  } catch (error) {
    console.error("GET HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

/* =========================================================
   CLEAR VIEWING HISTORY
========================================================= */

router.delete("/", verifyStudentToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const { error } = await supabase
      .from("viewing_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("CLEAR HISTORY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to clear viewing history.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Viewing history cleared.",
    });
  } catch (error) {
    console.error("CLEAR HISTORY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

export default router;