
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyStudentToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

router.use(verifyStudentToken);

// Get all bookmarks for the logged-in student
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("saved_research")
      .select(`
        id,
        research_id,
        created_at,
        summarized (
          id,
          title,
          author,
          year,
          program,
          pdf_url
        )
      `)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({
      success: true,
      saved: data || [],
    });
  } catch (error) {
    console.error("GET SAVED ERROR:", error);
    return res.status(500).json({
      message: "Unable to retrieve saved research.",
    });
  }
});

// Check whether a research paper is bookmarked
router.get("/:researchId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("saved_research")
      .select("id")
      .eq("user_id", req.user.id)
      .eq("research_id", req.params.researchId)
      .maybeSingle();

    if (error) throw error;

    return res.json({ bookmarked: Boolean(data) });
  } catch (error) {
    console.error("CHECK BOOKMARK ERROR:", error);
    return res.status(500).json({
      message: "Unable to check bookmark.",
    });
  }
});

// Bookmark a research paper
router.post("/:researchId", async (req, res) => {
  try {
    const { researchId } = req.params;

    const { data: research, error: researchError } = await supabase
      .from("summarized")
      .select("id")
      .eq("id", researchId)
      .maybeSingle();

    if (researchError) throw researchError;

    if (!research) {
      return res.status(404).json({
        message: "Research not found.",
      });
    }

    const { error } = await supabase
      .from("saved_research")
      .upsert(
        {
          user_id: req.user.id,
          research_id: researchId,
        },
        {
          onConflict: "user_id,research_id",
          ignoreDuplicates: true,
        }
      );

    if (error) throw error;

    return res.json({
      success: true,
      bookmarked: true,
    });
  } catch (error) {
    console.error("SAVE BOOKMARK ERROR:", error);
    return res.status(500).json({
      message: "Unable to save research.",
    });
  }
});

// Remove a bookmark
router.delete("/:researchId", async (req, res) => {
  try {
    const { error } = await supabase
      .from("saved_research")
      .delete()
      .eq("user_id", req.user.id)
      .eq("research_id", req.params.researchId);

    if (error) throw error;

    return res.json({
      success: true,
      bookmarked: false,
    });
  } catch (error) {
    console.error("REMOVE BOOKMARK ERROR:", error);
    return res.status(500).json({
      message: "Unable to remove bookmark.",
    });
  }
});

export default router;
