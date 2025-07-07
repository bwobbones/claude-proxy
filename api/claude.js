const rateLimit = require("express-rate-limit");
const axios = require("axios");

// Set up rate limiter (works in Vercel serverless and local dev)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 requests per windowMs
  keyGenerator: (req) => {
    // Use IP if available, otherwise fallback to a header or static value for local dev
    return (
      req.ip ||
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      "localdev"
    );
  },
});

const summaryCache = new Map(); // key: prompt string, value: summary

module.exports = async (req, res) => {
  // Simple API key auth
  const clientKey = req.headers["x-client-key"];
  if (clientKey !== process.env.CLIENT_API_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Rate limiting (Vercel serverless workaround)
  await new Promise((resolve) => limiter(req, res, () => resolve()));

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Missing prompt" });
  }

  const cacheKey = prompt.trim().toLowerCase();

  // Check cache
  if (summaryCache.has(cacheKey)) {
    return res.json({ content: [{ text: summaryCache.get(cacheKey) }] });
  }

  try {
    // Logging
    console.log(`[CLAUDE PROXY] Prompt: ${prompt.substring(0, 100)}`);

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-sonnet-4-20250514",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1024,
      },
      {
        headers: {
          "x-api-key": process.env.CLAUDE_API_KEY,
          "anthropic-version": "2023-06-01",
        },
      }
    );
    const summary = response.data.content?.[0]?.text || "";
    summaryCache.set(cacheKey, summary);
    res.status(200).json(response.data);
  } catch (err) {
    const msg = err.response?.data?.error || err.message || "Unknown error";
    console.error("[CLAUDE PROXY] Error:", msg);
    res.status(500).json({ error: msg });
  }
};
