const axios = require("axios");

const ttsCache = new Map(); // key: text string, value: Buffer (audio)

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { text, voice = "alloy", model = "tts-1" } = req.body;
  const cacheKey = `${model}|${voice}|${text.trim().toLowerCase()}`;

  // Check cache
  if (ttsCache.has(cacheKey)) {
    res.setHeader("Content-Type", "audio/mpeg");
    return res.send(ttsCache.get(cacheKey));
  }

  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/audio/speech",
      { model, input: text, voice },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
        validateStatus: () => true, // Always resolve, so we can check status
      }
    );
    if (response.status !== 200) {
      const errorText = Buffer.from(response.data).toString("utf8");
      console.error("[TTS] OpenAI API error:", response.status, errorText);
      return res
        .status(500)
        .json({ error: `OpenAI API error: ${response.status} ${errorText}` });
    }
    res.setHeader("Content-Type", "audio/mpeg");
    ttsCache.set(cacheKey, response.data);
    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
