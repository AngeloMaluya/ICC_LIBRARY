
import express from "express";
import { createClient } from "@supabase/supabase-js";
import { verifyAdminToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// All reports require an administrator token.
router.use(verifyAdminToken);

/* =========================================================
   PAGINATED SUPABASE FETCH

   Fetches all matching records rather than relying
   on Supabase's default 1,000-row response limit.
========================================================= */

const PAGE_SIZE = 500;

async function fetchAllRows(createQuery) {
  const rows = [];

  for (let start = 0; ; start += PAGE_SIZE) {
    const { data, error } = await createQuery().range(
      start,
      start + PAGE_SIZE - 1
    );

    if (error) {
      throw error;
    }

    const batch = data || [];
    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return rows;
}

/* =========================================================
   RESEARCH COLLECTION REPORT
   GET /api/reports/collection
========================================================= */

router.get("/collection", async (req, res) => {
  try {
    const researches = await fetchAllRows(() =>
      supabase
        .from("summarized")
        .select(
          "id, title, author, year, program, education_level, created_at"
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
    );

    return res.json({
      researches,
    });
  } catch (error) {
    console.error("COLLECTION REPORT ERROR:", error);

    return res.status(500).json({
      message: "Unable to load research collection report.",
    });
  }
});

/* =========================================================
   RESEARCH VIEWING REPORT
   GET /api/reports/viewing
========================================================= */

router.get("/viewing", async (req, res) => {
  try {
    const researches = await fetchAllRows(() =>
      supabase
        .from("summarized")
        .select("id, title, program")
        .order("id", { ascending: true })
    );

    const history = await fetchAllRows(() =>
      supabase
        .from("viewing_history")
        .select("research_id, viewed_at")
        .order("viewed_at", { ascending: false })
        .order("research_id", { ascending: true })
    );

    // Count views for each research paper.
    const counts = new Map();

    for (const view of history) {
      const key = String(view.research_id);

      const current = counts.get(key) || {
        views: 0,
        lastViewedAt: null,
      };

      current.views += 1;

      if (
        view.viewed_at &&
        (!current.lastViewedAt ||
          view.viewed_at > current.lastViewedAt)
      ) {
        current.lastViewedAt = view.viewed_at;
      }

      counts.set(key, current);
    }

    const records = researches.map((research) => {
      const stats = counts.get(String(research.id));

      return {
        id: research.id,
        title: research.title,
        program: research.program,
        views: stats?.views || 0,
        lastViewedAt: stats?.lastViewedAt || null,
      };
    });

    records.sort(
      (a, b) =>
        b.views - a.views ||
        String(a.title || "").localeCompare(
          String(b.title || "")
        )
    );

    return res.json({
      records,
    });
  } catch (error) {
    console.error("RESEARCH VIEWING REPORT ERROR:", error);

    return res.status(500).json({
      message: "Unable to load research viewing report.",
    });
  }
});

/* =========================================================
   USER ACTIVITY REPORT
   GET /api/reports/activity
========================================================= */

router.get("/activity", async (req, res) => {
  try {
    const data = await fetchAllRows(() =>
      supabase
        .from("activity_logs")
        .select(
          "id, user_email, user_type, activity, created_at"
        )
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
    );

    const records = data.map((row) => ({
      id: row.id,
      user: row.user_email,
      userType: row.user_type,
      activity: row.activity,
      createdAt: row.created_at,
    }));

    return res.json({
      records,
    });
  } catch (error) {
    console.error("USER ACTIVITY REPORT ERROR:", error);

    return res.status(500).json({
      message: "Unable to load user activity report.",
    });
  }
});

  // resarch themes
router.get("/themes", async (req, res) => {
  try {
    const search = String(req.query.search || "")
      .trim()
      .toLowerCase();

    const program = String(req.query.program || "")
      .trim();

    const startDate = String(
      req.query.startDate || ""
    ).trim();

    const endDate = String(
      req.query.endDate || ""
    ).trim();

    // Fetch research classifications.
    const researches = await fetchAllRows(() =>
      supabase
        .from("summarized")
        .select(
          `
          id,
          title,
          program,
          year,
          created_at,
          ai_theme,
          ai_theme_description,
          ai_keywords
          `
        )
        .order("id", { ascending: true })
    );

    // Apply the selected report filters.
    const filteredResearch = researches.filter(
      (research) => {
        if (
          program &&
          program.toLowerCase() !== "all" &&
          String(research.program || "")
            .toLowerCase() !== program.toLowerCase()
        ) {
          return false;
        }

        if (startDate) {
          const createdDate = String(
            research.created_at || ""
          ).slice(0, 10);

          if (createdDate < startDate) {
            return false;
          }
        }

        if (endDate) {
          const createdDate = String(
            research.created_at || ""
          ).slice(0, 10);

          if (createdDate > endDate) {
            return false;
          }
        }

        if (search) {
          const searchableText = [
            research.title,
            research.program,
            research.ai_theme,
            research.ai_theme_description,
            ...(Array.isArray(research.ai_keywords)
              ? research.ai_keywords
              : []),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

          if (!searchableText.includes(search)) {
            return false;
          }
        }

        return true;
      }
    );

    // Group AI-discovered themes.
    const themes = new Map();

    let totalClassifiedResearch = 0;
    let totalUnclassifiedResearch = 0;

    for (const research of filteredResearch) {
      const themeName = String(
        research.ai_theme || ""
      )
        .replace(/\s+/g, " ")
        .trim();

      // Treat empty and legacy "Other" themes
      // as not meaningfully classified.
      if (
        !themeName ||
        themeName.toLowerCase() === "other"
      ) {
        totalUnclassifiedResearch += 1;
        continue;
      }

      totalClassifiedResearch += 1;

      // Merge capitalization and whitespace variants.
      const themeKey = themeName.toLowerCase();

      if (!themes.has(themeKey)) {
        themes.set(themeKey, {
          theme: themeName,
          description: String(
            research.ai_theme_description || ""
          ).trim(),
          keywords: new Set(),
          researchCount: 0,
        });
      }

      const item = themes.get(themeKey);

      item.researchCount += 1;

      // Use a nonempty description when available.
      if (
        !item.description &&
        research.ai_theme_description
      ) {
        item.description = String(
          research.ai_theme_description
        ).trim();
      }

      const keywords = Array.isArray(
        research.ai_keywords
      )
        ? research.ai_keywords
        : [];

      for (const keyword of keywords) {
        const cleanedKeyword = String(
          keyword || ""
        ).trim();

        if (cleanedKeyword) {
          item.keywords.add(cleanedKeyword);
        }
      }
    }

    // Convert grouped themes to report records.
      const MIN_THEME_PERCENTAGE = 25;

      const highestThemeCount = Math.max(
        0,
        ...[...themes.values()].map(
          (item) => item.researchCount
        )
      );

      const minimumResearchCount = Math.max(
        1,
        Math.ceil(
          highestThemeCount * (MIN_THEME_PERCENTAGE / 100)
        )
      );
      const records = [...themes.values()]
        .map((item) => ({
          theme: item.theme,
          description: item.description,
          keywords: [...item.keywords].slice(0, 5),
          researchCount: item.researchCount,
        }))
        .filter(
          (item) => item.researchCount >= minimumResearchCount
        )
        .sort(
          (a, b) =>
            b.researchCount - a.researchCount ||
            a.theme.localeCompare(b.theme)
        );

          // Identify themes with relatively few papers.
          // This is repository coverage analysis,
          // not proof of an academic research gap.
          const totalThemes = records.length;

          const averageResearchPerTheme =
            totalThemes > 0
              ? totalClassifiedResearch / totalThemes
              : 0;

          const underrepresentedThemes = records
            .filter(
              (item) =>
                item.researchCount <
                averageResearchPerTheme
            )
            .sort(
              (a, b) =>
                a.researchCount - b.researchCount ||
                a.theme.localeCompare(b.theme)
            )
            .map((item) => ({
              ...item,
              status: "Underrepresented in repository",
            }));

          return res.json({
            success: true,

            records,

            totalThemes,
            totalResearch: filteredResearch.length,
            totalClassifiedResearch,
            totalUnclassifiedResearch,

            averageResearchPerTheme: Number(
              averageResearchPerTheme.toFixed(2)
            ),

            underrepresentedThemes,

            filters: {
              search,
              program,
              startDate,
              endDate,
            },
          });
        } catch (error) {
          console.error("THEME REPORT ERROR:", error);

          return res.status(500).json({
            success: false,
            message: "Unable to load research themes.",
          });
        }
      });

/* =========================================================
   RESEARCH PAPERS BY AI THEME
   GET /api/reports/themes/researches
========================================================= */

router.get("/themes/researches", async (req, res) => {
  try {
    const theme = String(req.query.theme || "").trim();

    if (!theme) {
      return res.status(400).json({
        success: false,
        message: "Theme is required.",
      });
    }

    const records = await fetchAllRows(() =>
      supabase
        .from("summarized")
        .select(`
          id,
          title,
          author,
          year,
          program,
          accession_number,
          ai_theme
        `)
        .ilike("ai_theme", theme)
        .order("year", { ascending: false })
        .order("id", { ascending: true })
    );

    return res.status(200).json({
      success: true,
      records,
    });

  } catch (error) {
    console.error("THEME RESEARCH ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load research papers by theme.",
    });
  }
});

router.get("/citations", async (req, res) => {
  try {
    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();

    // Validate date filters.
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;

    if (
      (startDate && !datePattern.test(startDate)) ||
      (endDate && !datePattern.test(endDate)) ||
      (startDate && endDate && startDate > endDate)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid date range.",
      });
    }

    // Fetch all research documents using existing pagination.
    const researches = await fetchAllRows(() =>
      supabase
        .from("summarized")
        .select("id, title, program")
        .order("id", { ascending: true })
    );

    // Fetch citation actions, applying date filters in Supabase.
    const citations = await fetchAllRows(() => {
      let query = supabase
        .from("citation_actions")
        .select("id, research_id, created_at");

      if (startDate) {
        query = query.gte(
          "created_at",
          `${startDate}T00:00:00+08:00`
        );
      }

      if (endDate) {
        const nextDay = new Date(`${endDate}T00:00:00Z`);
        nextDay.setUTCDate(nextDay.getUTCDate() + 1);

        const nextDate = nextDay.toISOString().slice(0, 10);

        query = query.lt(
          "created_at",
          `${nextDate}T00:00:00+08:00`
        );
      }

      return query
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
    });

    // Count each recorded Cite action.
    const citationCounts = new Map();

    for (const citation of citations) {
      const researchId = String(citation.research_id);

      citationCounts.set(
        researchId,
        (citationCounts.get(researchId) || 0) + 1
      );
    }

    // Match citation counts to research titles and programs.
    const records = researches
      .map((research) => ({
        id: research.id,
        title: research.title,
        program: research.program,
        citations:
          citationCounts.get(String(research.id)) || 0,
      }))
      .filter((research) => research.citations > 0)
      .sort(
        (a, b) =>
          b.citations - a.citations ||
          String(a.title || "").localeCompare(
            String(b.title || "")
          )
      );

    return res.json({
      success: true,
      records,
      totalResearch: researches.length,
      totalCitationActions: citations.length,
      filters: {
        startDate,
        endDate,
      },
    });
  } catch (error) {
    console.error("CITATION REPORT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load citation counts.",
    });
  }
});

export default router;
