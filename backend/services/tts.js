/**
 * TTS Service
 * ------------
 * Modes:
 *   mock     → always returns the demo MP3 (default)
 *   eleven   → real multi-speaker generation via ElevenLabs
 *
 * Set TTS_MODE=eleven and ELEVENLABS_API_KEY to use real generation.
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

// Default ElevenLabs voice IDs (you can override these)
// Find more at: https://api.elevenlabs.io/v1/voices
const ELEVEN_VOICES = {
  orion: "onwK4e9ZLuTAKqWW03F9",   // Daniel (male, clear)
  leo: "pNInz6obpgDQGcFmaJgB",     // Adam (male, young)
  ursa: "EXAVITQu4vr4xnSDxMaL",    // Bella (female)
  ara: "21m00Tcm4TlvDq8ikWAM",     // Rachel (female)
  atlas: "ErXwobaYiN019PkySvjV",   // Antoni (male)
  aurora: "MF3mGyEYCl7XYWbV9V6O",  // Elli (female)
  // fallback
  default: "21m00Tcm4TlvDq8ikWAM"
};

/**
 * Generate multi-speaker speech
 */
async function generateMultiSpeech({
  speakers,
  turns,
  language = "it",
  direction = "dramatic italian storytelling, emotional, cinematic pacing"
}) {
  const mode = process.env.TTS_MODE || "mock";

  if (mode === "eleven") {
    return await elevenLabsGenerate({ speakers, turns, language, direction });
  }

  // Default: mock
  return mockGenerate(speakers, turns);
}

/**
 * ElevenLabs multi-speaker generation
 * Uses the text-to-speech endpoint per turn and concatenates the audio.
 * (ElevenLabs doesn't have a single multi-speaker endpoint yet, so we stitch.)
 */
async function elevenLabsGenerate({ speakers, turns, language, direction }) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is not set. Add it to your environment or .env file.");
  }

  const voiceMap = {};
  for (const s of speakers) {
    const mapped = ELEVEN_VOICES[s.voice_id] || ELEVEN_VOICES.default;
    voiceMap[s.id] = mapped;
    console.log(`[TTS] Speaker "${s.id}" (voice_id: ${s.voice_id}) → ElevenLabs voice: ${mapped}`);
  }

  console.log(`[TTS] Generating ${turns.length} turns with ElevenLabs...`);

  const audioBuffers = [];

  for (let i = 0; i < turns.length; i++) {
    const turn = turns[i];
    const voiceId = voiceMap[turn.speaker_id] || ELEVEN_VOICES.default;

    console.log(`[TTS] Turn ${i + 1}/${turns.length} → ${turn.speaker_id} (${voiceId})`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: turn.text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.35,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs error on turn ${i + 1}: ${response.status} ${errText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    audioBuffers.push(buffer);

    // Small pause between speakers (except last)
    if (i < turns.length - 1) {
      const pauseMs = turn.gap === "long" ? 800 : turn.gap === "short" ? 200 : 450;
      audioBuffers.push(createSilence(pauseMs));
    }
  }

  // Concatenate all buffers
  const finalBuffer = Buffer.concat(audioBuffers);

  const filename = `story-${uuidv4().slice(0, 8)}.mp3`;
  const dest = path.join(PUBLIC_DIR, filename);
  fs.writeFileSync(dest, finalBuffer);

  console.log(`[TTS] Saved real audio → ${filename} (${(finalBuffer.length / 1024).toFixed(0)} KB)`);

  const totalChars = turns.reduce((sum, t) => sum + t.text.length, 0);
  const durationEstimate = Math.max(8, totalChars / 13);

  return {
    audioUrl: `/audio/${filename}`,
    durationEstimate,
    mode: "eleven"
  };
}

/**
 * Create a short silent MP3 buffer (approximate)
 */
function createSilence(ms) {
  // Minimal valid silent MP3 frame repeated
  const frame = Buffer.from(
    "/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
    "base64"
  );
  const framesNeeded = Math.max(1, Math.round(ms / 26)); // ~26ms per frame
  const frames = [];
  for (let i = 0; i < framesNeeded; i++) frames.push(frame);
  return Buffer.concat(frames);
}

/**
 * Mock: copy the demo file and return a public URL
 */
function mockGenerate(speakers, turns) {
  const filename = `story-${uuidv4().slice(0, 8)}.mp3`;
  const dest = path.join(PUBLIC_DIR, filename);

  console.log(`[TTS] Mock mode → writing to ${dest}`);

  if (fs.existsSync(DEMO_AUDIO)) {
    fs.copyFileSync(DEMO_AUDIO, dest);
    console.log(`[TTS] Copied demo audio → ${filename}`);
  } else {
    console.warn(`[TTS] Demo audio not found. Writing silent fallback.`);
    const silent = Buffer.from(
      "/+MYxAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV",
      "base64"
    );
    fs.writeFileSync(dest, silent);
  }

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
