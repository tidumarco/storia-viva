/**
 * POST /api/generate
 *
 * Body (JSON):
 * {
 *   "title": "La pensione della nonna",
 *   "text": "Piergiorgio andò dalla nonna...",
 *   "speakers": [                    // optional overrides
 *     { "id": "piergiorgio", "name": "Piergiorgio", "voice_id": "leo" },
 *     { "id": "nonna", "name": "Nonna", "voice_id": "ursa" }
 *   ],
 *   "language": "it"                 // default "it"
 * }
 *
 * Response:
 * {
 *   "id": "uuid",
 *   "title": "...",
 *   "audioUrl": "/audio/xxx.mp3",
 *   "timeline": [
 *     { "t": 0.0, "speaker": "narratore", "text": "..." },
 *     ...
 *   ],
 *   "speakers": [...],
 *   "durationEstimate": 42.5
 * }
 */

const express = require("express");
const { v4: uuidv4 } = require("uuid");
const {
  parseStoryToTurns,
  buildSpeakers,
  buildApproximateTimeline
} = require("../services/parser");
const { generateMultiSpeech } = require("../services/tts");

const router = express.Router();

router.post("/generate", async (req, res, next) => {
  try {
    const {
      title = "Senza titolo",
      text,
      speakers: userSpeakers = [],
      language = "it"
    } = req.body;

    if (!text || typeof text !== "string" || text.trim().length < 10) {
      return res.status(400).json({
        error: "Il campo 'text' è obbligatorio e deve contenere almeno 10 caratteri."
      });
    }

    // 1. Parse free text → structured turns
    const turns = parseStoryToTurns(text);

    if (turns.length === 0) {
      return res.status(400).json({
        error: "Impossibile estrarre turni di dialogo dal testo fornito."
      });
    }

    // 2. Resolve speakers (user overrides + defaults)
    const speakers = buildSpeakers(turns, userSpeakers);

    // 3. Generate audio (mock or real)
    const { audioUrl, durationEstimate, mode } = await generateMultiSpeech({
      speakers: speakers.map((s) => ({ id: s.id, voice_id: s.voice_id })),
      turns,
      language,
      direction: "dramatic italian storytelling, emotional, cinematic pacing"
    });

    // 4. Build timeline for the player
    const timeline = buildApproximateTimeline(turns);

    // 5. Response
    res.json({
      id: uuidv4(),
      title,
      audioUrl,
      timeline,
      speakers,
      turns, // useful for debugging / future editor
      durationEstimate,
      language,
      mode: mode || "real"
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/voices
 * Returns the list of available voices (static for now)
 */
router.get("/voices", (_req, res) => {
  res.json({
    voices: [
      { voice_id: "orion", name: "Orion", gender: "male", language: "multilingual" },
      { voice_id: "leo", name: "Leo", gender: "male", language: "multilingual" },
      { voice_id: "ursa", name: "Ursa", gender: "female", language: "multilingual" },
      { voice_id: "ara", name: "Ara", gender: "female", language: "multilingual" },
      { voice_id: "atlas", name: "Atlas", gender: "male", language: "multilingual" },
      { voice_id: "aurora", name: "Aurora", gender: "female", language: "multilingual" },
      { voice_id: "castor", name: "Castor", gender: "male", language: "multilingual" },
      { voice_id: "celeste", name: "Celeste", gender: "female", language: "multilingual" },
      { voice_id: "eve", name: "Eve", gender: "female", language: "multilingual" },
      { voice_id: "luna", name: "Luna", gender: "female", language: "multilingual" }
    ],
    defaultLanguage: "it"
  });
});

module.exports = router;
