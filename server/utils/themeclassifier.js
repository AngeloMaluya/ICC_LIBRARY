
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.1-flash-lite";

function cleanJson(raw) {
  return String(raw || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeTheme(value) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizeKeywords(keywords) {
  if (!Array.isArray(keywords)) return [];

  return [
    ...new Set(
      keywords
        .filter((item) => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ].slice(0, 8);
}

export async function classifyResearchTheme({
  title,
  summary,
  content,
  existingThemes = [],
}) {
  if (!String(title || "").trim()) {
    throw new Error("Research title is required.");
  }

  const availableThemes = existingThemes
    .map((item) =>
      typeof item === "string" ? item : item?.theme
    )
    .map(normalizeTheme)
    .filter(Boolean);

  const uniqueThemes = [
    ...new Map(
      availableThemes.map((theme) => [
        theme.toLowerCase(),
        theme,
      ])
    ).values(),
  ];

  const prompt = `
You are an academic research theme discovery assistant
for a school digital research repository.

Your task is to discover the PRIMARY research theme
of the research paper.

IMPORTANT:
There is NO predefined list of allowed research topics.
You must identify the theme from the actual research.

Analyze:
1. The research title.
2. The research summary.
3. The research objectives and main problem.
4. The methodology and proposed solution.
5. The main contribution of the study.

THEME DISCOVERY RULES:

- Identify exactly ONE primary research theme.
- Focus on what the research primarily investigates.
- Do not classify based only on a technology mentioned.
- Prefer a meaningful academic subject or research area.
- Use concise and consistent theme names.
- Avoid overly broad themes such as "Technology",
  "Research", "Science", or "Other".
- Avoid themes that are too specific to a single title.
- Do not invent information missing from the paper.
- Research from any academic discipline is allowed.

EXISTING AI-DISCOVERED THEMES:

${JSON.stringify(uniqueThemes)}

THEME REUSE RULES:

- The existing themes above were discovered from
  previously analyzed research papers.
- They are NOT a fixed classification list.
- Reuse an existing theme when it accurately describes
  the primary subject of this research.
- Consider equivalent terminology and synonyms.
- Do not create a new theme just because the wording
  differs from an existing theme.
- Create a new theme when the paper has a genuinely
  different primary research subject.
- Never force a paper into an unrelated existing theme.

EXAMPLE:

If the existing theme is:
"Internet of Things (IoT)"

And the research is about:
"IoT-Based Smart Irrigation Using ESP32"

Prefer:
"Internet of Things (IoT)"

Instead of creating:
"Smart IoT Systems"

However, if the main research subject is genuinely
different, create a more appropriate theme.

RETURN VALID JSON ONLY:

{
  "theme": "Primary research theme",
  "description": "A concise description of the theme",
  "keywords": [
    "keyword1",
    "keyword2",
    "keyword3"
  ]
}

RESEARCH TITLE:
${String(title || "").slice(0, 1000)}

RESEARCH SUMMARY:
${String(summary || "").slice(0, 6000)}

RESEARCH CONTENT:
${String(content || "").slice(0, 12000)}
`;

  const interaction = await ai.interactions.create({
    model: MODEL,
    input: prompt,
  });

  const raw = cleanJson(interaction.output_text);

  if (!raw) {
    throw new Error(
      "Gemini returned an empty classification response."
    );
  }

  let result;

  try {
    result = JSON.parse(raw);
  } catch {
    throw new Error(
      "Gemini returned invalid JSON: " + raw.slice(0, 300)
    );
  }

  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result)
  ) {
    throw new Error("Invalid classification response.");
  }

  let theme = normalizeTheme(result.theme);

  if (!theme || theme.length > 120) {
    throw new Error(
      "Gemini returned an invalid research theme."
    );
  }

  // Reuse the canonical spelling when there is
  // an exact case-insensitive match.
  const existingMatch = uniqueThemes.find(
    (item) => item.toLowerCase() === theme.toLowerCase()
  );

  if (existingMatch) {
    theme = existingMatch;
  }

  const description = String(
    result.description || ""
  )
    .trim()
    .slice(0, 500);

  const keywords = normalizeKeywords(result.keywords);

  return {
    ai_theme: theme,
    ai_theme_description: description,
    ai_keywords: keywords,
  };
}
