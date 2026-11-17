import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// GET REGISTERED ACCOUNTS — ADMIN ONLY
router.get("/", verifyAdminToken, async (req, res) => {
  try {
    const pageSize = 500;
    const accounts = [];

    for (let start = 0; ; start += pageSize) {
        const { data, error } = await supabase
        .from("users")
        .select("id, f_name, l_name, course, year, section, email")
        .eq("role", "student")
        .order("id", { ascending: true })
        .range(start, start + pageSize - 1);

      if (error) throw error;

      accounts.push(...(data || []));

      if (!data || data.length < pageSize) break;
    }

    return res.status(200).json({
      success: true,
      records: accounts,
    });
  } catch (error) {
    console.error("REGISTERED ACCOUNTS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve registered accounts.",
    });
  }
});

export default router;