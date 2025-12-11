const { GoogleGenerativeAI } = require("@google/generative-ai");

// Default to latest 2.5 flash unless overridden via env
const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function resolveModel() {
  // If user explicitly set a model, use it
  if (process.env.GEMINI_MODEL) return process.env.GEMINI_MODEL.trim();
  return DEFAULT_MODEL;
}

/**
 * Build a deterministic, structure-enforced prompt for real-estate blogs.
 */
function buildPrompt(topic) {
  return `
You are the official content generator for 100acress.com, an Indian real-estate brand.
Produce a complete blog as structured JSON only, no commentary.
Keep language simple (Grade 6-8), SEO-friendly, NCR-aware (Gurgaon/Noida/Delhi NCR) when relevant.
Do NOT fabricate data; give practical guidance only.

JSON fields to return:
- title (H1)
- metaTitle
- metaDescription (155-160 chars)
- slug (URL friendly)
- focusKeywords (array 5-10)
- introduction (150-200 words)
- sections: array of { heading, bodyHtml } using H2/H3 headings in the HTML string
- conclusion
- faqs: array of { question, answer }
- imagePrompt (for midjourney/dalle)

Formatting rules:
- All rich text fields must be HTML with proper H2/H3 tags inside bodyHtml where needed.
- Keep paragraphs short; include bullet lists or tables where useful.
- Focus on Indian real-estate: investments, RERA, stamp duty, loan/EMI, locality insights.
- Tailor to NCR if applicable to topic.

Topic: "${topic}"

Return ONLY minified JSON.`;
}

function tryParse(str) {
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function normalizeCandidate(c) {
  return (c || "")
    .replace(/^```(?:json)?/i, "")
    .replace(/```+$/g, "")
    .replace(/^json\s*/i, "")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    // smart quotes to straight
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    // remove zero-width
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    // trim
    .trim()
    // loosen trailing commas in objects/arrays
    .replace(/,\s*}/g, "}")
    .replace(/,\s*]/g, "]");
}

/**
 * Extract JSON from model text (handles code fences and loose braces).
 */
function extractJson(text) {
  if (!text) return null;

  // Preferred: fenced block ```json ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidates = [];
  if (fenceMatch && fenceMatch[1]) {
    candidates.push(fenceMatch[1].trim());
  }

  // Whole text as candidate
  candidates.push(text.trim());

  // First { ... } substring
  const braceMatch = text.match(/\{[\s\S]*\}/);
  if (braceMatch) candidates.push(braceMatch[0]);

  // Fallback: slice from first { to last }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidates.push(text.slice(firstBrace, lastBrace + 1));
  }

  for (const c of candidates) {
    const cleaned = normalizeCandidate(c);
    const parsed = tryParse(cleaned);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Generate a blog draft from a topic using Gemini.
 * @param {string} topic
 * @returns {Promise<object>} structured blog payload
 */
async function generateBlog(topic) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY missing");
  }
  const prompt = buildPrompt(topic);
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const modelName = resolveModel();
  const model = genAI.getGenerativeModel({ model: modelName });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.4,
      maxOutputTokens: 1800,
    },
  });

  const text = result?.response?.text?.() || "";
  const parsed = extractJson(text);
  return { parsed, rawText: text };
}

module.exports = {
  generateBlog,
};

