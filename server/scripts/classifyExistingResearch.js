import "dotenv/config";

import { createClient } from "@supabase/supabase-js";
import { classifyResearchTheme } from "../utils/themeclassifier.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// =====================================================
// CONFIGURATION
// =====================================================

const PAGE_SIZE = 50;
const DELAY_MS = 1500;

// null = process all matching research papers
// 5 = test with five research papers
const MAX_RESEARCH = 5;

// false = only classify papers without an AI theme
// true = reclassify papers, including old classifications
const RECLASSIFY_ALL = true;

// =====================================================
// HELPERS
// =====================================================

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function normalizeTheme(theme) {
  return String(theme || "")
    .trim()
    .replace(/\s+/g, " ");
}

// =====================================================
// FETCH EXISTING RESEARCH
// =====================================================

async function getResearch() {
  const allResearch = [];
  let start = 0;

  while (true) {
    let query = supabase
      .from("summarized")
      .select(
        "id, title, summary, content, ai_theme"
      )
      .order("id", { ascending: true })
      .range(start, start + PAGE_SIZE - 1);

    if (!RECLASSIFY_ALL) {
      query = query.is("ai_theme", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    const batch = data || [];

    allResearch.push(...batch);

    if (batch.length < PAGE_SIZE) break;

    start += PAGE_SIZE;
  }

  return allResearch;
}

// =====================================================
// AI-DISCOVERED THEME REGISTRY
// =====================================================

function createThemeRegistry(researchList) {
  const themes = new Map();

  if (RECLASSIFY_ALL) {
    // Rebuild theme discovery from scratch instead
    // of trusting the old predefined categories.
    return themes;
  }

  for (const research of researchList) {
    const theme = normalizeTheme(research.ai_theme);

    if (!theme) continue;

    themes.set(theme.toLowerCase(), theme);
  }

  return themes;
}

// =====================================================
// CLASSIFICATION
// =====================================================

async function classifyExistingResearch() {
  console.log(
    "\nStarting AI Research Theme Discovery...\n"
  );

  console.log(
    `Mode: ${
      RECLASSIFY_ALL
        ? "Reclassify existing research"
        : "Classify unclassified research"
    }`
  );

  const researchList = await getResearch();

  const selectedResearch =
    MAX_RESEARCH === null
      ? researchList
      : researchList.slice(0, MAX_RESEARCH);

  console.log(
    `Found ${researchList.length} matching research papers.`
  );

  console.log(
    `Processing ${selectedResearch.length} papers.\n`
  );

  const themeRegistry = createThemeRegistry(
    researchList
  );

  let successful = 0;
  let failed = 0;
  let skipped = 0;

  for (const research of selectedResearch) {
    try {
      if (!String(research.title || "").trim()) {
        skipped++;

        console.log(
          `Skipped ${research.id}: Missing research title.`
        );

        continue;
      }

      console.log(
        `\nAnalyzing ${research.id}: ${research.title}`
      );

      const existingThemes = [
        ...themeRegistry.values(),
      ];

      const classification =
        await classifyResearchTheme({
          title: research.title,
          summary: research.summary || "",
          content: research.content || "",
          existingThemes,
        });

      const {
        ai_theme,
        ai_theme_description,
        ai_keywords,
      } = classification;

      const theme = normalizeTheme(ai_theme);

      if (!theme) {
        throw new Error(
          "Gemini returned an empty theme."
        );
      }

      // Reuse exact canonical spelling.
      const existingTheme =
        themeRegistry.get(theme.toLowerCase());

      const canonicalTheme = existingTheme || theme;

      let query = supabase
        .from("summarized")
        .update({
          ai_theme: canonicalTheme,
          ai_theme_description:
            ai_theme_description || "",
          ai_keywords: Array.isArray(ai_keywords)
            ? ai_keywords
            : [],
        })
        .eq("id", research.id);

      // Prevent overwriting existing classifications
      // when running in unclassified-only mode.
      if (!RECLASSIFY_ALL) {
        query = query.is("ai_theme", null);
      }

      const { data, error } = await query.select(
        "id"
      );

      if (error) throw error;

      if (!data?.length) {
        skipped++;

        console.log(
          `Skipped ${research.id}: Record was not updated.`
        );

        continue;
      }

      // Add the theme only after saving successfully.
      themeRegistry.set(
        canonicalTheme.toLowerCase(),
        canonicalTheme
      );

      successful++;

      console.log(
        `Saved: ${research.title}`
      );

      console.log(
        `Primary theme: ${canonicalTheme}`
      );

      console.log(
        `Discovered themes so far: ${themeRegistry.size}`
      );

    } catch (error) {
      failed++;

      console.error(
        `Failed ${research.id}: ${error.message}`
      );
    }

    await delay(DELAY_MS);
  }

  // =====================================================
  // FINAL RESULTS
  // =====================================================

  console.log(
    "\n======================================"
  );

  console.log(
    "AI THEME DISCOVERY COMPLETE"
  );

  console.log(
    "======================================"
  );

  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);

  console.log(
    `Unique themes discovered in this run: ${themeRegistry.size}`
  );

  console.log(
    "\nDiscovered themes:"
  );

  for (const theme of themeRegistry.values()) {
    console.log(`- ${theme}`);
  }

  console.log(
    "\n======================================\n"
  );
}

// =====================================================
// RUN SCRIPT
// =====================================================

classifyExistingResearch().catch((error) => {
  console.error(
    "Classification script failed:",
    error
  );

  process.exitCode = 1;
});
