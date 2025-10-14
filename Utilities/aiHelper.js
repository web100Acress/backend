const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");

let genAI;
try {
  if (process.env.GOOGLE_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  } else {
    console.warn("GOOGLE_API_KEY not found. AI scoring will be disabled.");
  }
} catch (e) {
  console.error("Failed to initialize Google AI client", e);
  genAI = null;
}

// Simple in-memory cache for embeddings to reduce API calls for the same text.
const embeddingCache = new Map();

/**
 * Generates an embedding vector for a given text using Google's Gemini.
 * @param {string} text The text to embed.
 * @returns {Promise<number[]|null>} The embedding vector or null if failed.
 */
const getEmbedding = async (text) => {
  if (!genAI) return null;
  if (!text || text.trim().length < 50) return null; // Avoid embedding empty or tiny strings

  const cleanedText = text.replace(/\n/g, " ").substring(0, 8000); // Clean and truncate

  // Return from cache if possible
  if (embeddingCache.has(cleanedText)) {
    return embeddingCache.get(cleanedText);
  }

  try {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(cleanedText);
    const vector = result.embedding.values;
    embeddingCache.set(cleanedText, vector); // Cache the result
    return vector;
  } catch (error) {
    console.error("Error getting embedding from Google AI:", error);
    return null;
  }
};

/**
 * Calculates cosine similarity between two vectors.
 * @param {number[]} vecA - The first vector.
 * @param {number[]} vecB - The second vector.
 * @returns {number} The similarity score (0 to 1).
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB) return 0;
  const dot = vecA.reduce((acc, v, i) => acc + v * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((acc, v) => acc + v * v, 0));
  const magB = Math.sqrt(vecB.reduce((acc, v) => acc + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
};

/**
 * Fetches a resume from a URL and extracts its text content.
 * @param {string} url The URL of the resume file (PDF or DOCX).
 * @returns {Promise<string|null>} The extracted text or null if failed.
 */
const getTextFromUrl = async (url) => {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    const contentType = response.headers["content-type"];
    const buffer = Buffer.from(response.data);

    if (contentType.includes("application/pdf")) {
      const data = await pdf(buffer);
      return data.text;
    } else if (
      contentType.includes("application/vnd.openxmlformats-officedocument.wordprocessingml.document") || // .docx
      contentType.includes("application/msword") // .doc
    ) {
      const { value } = await mammoth.extractRawText({ buffer });
      return value;
    } else {
      console.warn(`Unsupported resume content type: ${contentType}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching or parsing resume from ${url}:`, error);
    return null;
  }
};

module.exports = {
  getEmbedding,
  cosineSimilarity,
  getTextFromUrl,
};
