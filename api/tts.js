const axios = require("axios");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { text, voice = "alloy", model = "tts-1" } = req.body;
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
    res.send(response.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
