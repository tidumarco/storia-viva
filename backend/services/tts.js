/**
 * TTS Service
 * ------------
 * In this skeleton we support two modes:
 *
 * 1. MOCK (default)  → returns the pre-generated demo audio
 * 2. REAL            → placeholder for a real multi-speaker TTS provider
 *
 * Real providers you can plug later:
 * - xAI Voice (if you get API access)
 * - ElevenLabs (multi-voice)
 * - OpenAI TTS (single voice, need multiple calls + stitch)
 * - Google Cloud TTS / Azure
 * - Coqui / local models
 *
 * The interface stays the same so the rest of the app doesn't change.
 */

const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const DEMO_AUDIO = path.join(__dirname, "..", "piergiorgio_nonna.mp3");

// Ensure public folder exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

/**
 * Generate multi-speaker speech
 * @param {Object} params
 * @param {Array}  params.speakers  [{id, voice_id}]
 * @param {Array}  params.turns     [{speaker_id, text, gap?}]
 * @param {string} params.language  BCP-47, default "it"
 * @param {string} params.direction optional style hint
 * @returns {Promise<{audioUrl: string, durationEstimate: number}>}
 */
async function generateMultiSpeech({
  speakers,
  turns,
  language = "it",
  direction = "dramatic italian storytelling, emotional, cinematic pacing"
}) {
  const mode = process.env.TTS_MODE || "mock";

  if (mode === "mock") {
    return mockGenerate(speakers, turns);
  }

  // ---------- REAL IMPLEMENTATION PLACEHOLDER ----------
  // Example with a hypothetical provider:
  /*
  const response = await fetch("https://api.your-tts-provider.com/v1/multi-speech", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.TTS_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      speakers,
      turns,
      language,
      enrich: true,
      direction
    })
  });

  if (!response.ok) {
    throw new Error(`TTS provider error: ${response.status}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const filename = `${uuidv4()}.mp3`;
  const filepath = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(filepath, buffer);

  return {
    audioUrl: `/audio/${filename}`,
    durationEstimate: null // or from provider metadata
  };
  */

  throw new Error(
    `TTS_MODE=real is not configured yet. Set TTS_MODE=mock or implement a provider in services/tts.js`
  );
}

/**
 * Mock: copy the demo file and return a public URL
 */
function mockGenerate(speakers, turns) {
  const filename = `story-${uuidv4().slice(0, 8)}.mp3`;
  const dest = path.join(PUBLIC_DIR, filename);

  // Prefer the real demo audio if it exists
  if (fs.existsSync(DEMO_AUDIO)) {
    fs.copyFileSync(DEMO_AUDIO, dest);
  } else {
    // Fallback: empty file (should not happen)
    fs.writeFileSync(dest, Buffer.alloc(0));
  }

  // Rough duration estimate from text length
  const totalChars = turns.reduce((sum, t) => sum + t.text.length, 0);
  const durationEstimate = Math.max(8, totalChars / 14);

  return {
    audioUrl: `/audio/${filename}`,
    durationEstimate,
    mode: "mock"
  };
}

module.exports = {
  generateMultiSpeech
};
