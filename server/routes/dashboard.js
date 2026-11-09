import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

const PROGRAMS = [
  "BSCS", "BSBA", "BSED", "BEED", "BSTM", "BSCrim"
];

// Get administrator dashboard statistics
router.get("/stats", verifyAdminToken, async (req, res) => {
  try {
    const [researchResult, studentsResult, uploadsResult, ...programResults] =
      await Promise.all([
        // Count all research records
        supabase
          .from("summarized")
          .select("*", { count: "exact", head: true }),

        // Count student accounts
        supabase
          .from("users")
          .select("*", { count: "exact", head: true })
          .eq("role", "student"),

        // Count research records with PDF files
        supabase
          .from("summarized")
          .select("*", { count: "exact", head: true })
          .not("pdf_url", "is", null),

        // Count research papers in each program
        ...PROGRAMS.map((program) =>
          supabase
            .from("summarized")
            .select("*", { count: "exact", head: true })
            .eq("program", program)
        ),
      ]);

    const results = [
      researchResult,
      studentsResult,
      uploadsResult,
      ...programResults,
    ];

    const failed = results.find((result) => result.error);

    if (failed) {
      console.error("DASHBOARD DATABASE ERROR:", failed.error);

      return res.status(500).json({
        success: false,
        message: "Failed to retrieve dashboard statistics.",
      });
    }

    const programCounts = Object.fromEntries(
      PROGRAMS.map((program, index) => [
        program,
        programResults[index].count ?? 0,
      ])
    );

    return res.status(200).json({
      success: true,
      stats: {
        totalResearch: researchResult.count ?? 0,
        totalStudents: studentsResult.count ?? 0,
        totalPrograms: PROGRAMS.length,
        totalUploads: uploadsResult.count ?? 0,
      },
      programCounts,
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

export default router;