/**
 * Simple Italian-aware story → dialogue turns parser
 * Goal: turn free-form text into ordered speaker turns
 * ready for multi-speaker TTS.
 *
 * This is a rule-based starter. Later replace/enhance with LLM.
 */

const DEFAULT_NARRATOR_ID = "narratore";

/**
 * Very lightweight heuristic parser.
 * Rules (in order):
 * 1. Lines starting with « or " → dialogue
 * 2. Explicit "Name: text" or "Name — text"
 * 3. Everything else → Narratore
 */
function parseStoryToTurns(text, speakerMap = {}) {
  if (!text || typeof text !== "string") {
    return [];
  }

  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const turns = [];
  let lastSpeaker = DEFAULT_NARRATOR_ID;

  for (const line of lines) {
    // Explicit speaker: "Piergiorgio: Ciao" or "Nonna — ..."
    const explicit = line.match(
      /^([A-ZÀ-Úa-zà-ú][A-Za-zà-úÀ-Ú\s]{0,30}?)\s*[:—–-]\s*(.+)$/
    );
    if (explicit) {
      const name = explicit[1].trim();
      const content = explicit[2].trim();
      const speakerId = resolveSpeakerId(name, speakerMap);
      turns.push({
        speaker_id: speakerId,
        text: content,
        gap: "short"
      });
      lastSpeaker = speakerId;
      continue;
    }

    // Quoted dialogue «...» or "..."
    const quoted = line.match(/^[«"](.+)[»"]$/);
    if (quoted) {
      // If we don't know who is speaking, keep last speaker or invent
      const speakerId = lastSpeaker === DEFAULT_NARRATOR_ID
        ? "personaggio"
        : lastSpeaker;
      turns.push({
        speaker_id: speakerId,
        text: quoted[1].trim(),
        gap: "short"
      });
      continue;
    }

    // Mixed line: narration + quote
    const mixed = line.match(/^(.*?)[«"](.+)[»"](.*)$/);
    if (mixed) {
      const before = mixed[1].trim();
      const quote = mixed[2].trim();
      const after = mixed[3].trim();

      if (before) {
        turns.push({
          speaker_id: DEFAULT_NARRATOR_ID,
          text: before,
          gap: "mid"
        });
      }
      turns.push({
        speaker_id: lastSpeaker === DEFAULT_NARRATOR_ID ? "personaggio" : lastSpeaker,
        text: quote,
        gap: "short"
      });
      if (after) {
        turns.push({
          speaker_id: DEFAULT_NARRATOR_ID,
          text: after,
          gap: "mid"
        });
      }
      continue;
    }

    // Pure narration
    turns.push({
      speaker_id: DEFAULT_NARRATOR_ID,
      text: line,
      gap: "mid"
    });
    lastSpeaker = DEFAULT_NARRATOR_ID;
  }

  return turns;
}

/**
 * Build a speaker list from detected names + user-provided overrides
 */
function buildSpeakers(turns, userSpeakers = []) {
  const ids = new Set(turns.map((t) => t.speaker_id));
  const speakers = [];

  // Always include narrator
  speakers.push({
    id: DEFAULT_NARRATOR_ID,
    name: "Narratore",
    voice_id: "orion" // good neutral male multilingual
  });

  // Map known characters (demo defaults)
  const defaults = {
    piergiorgio: { name: "Piergiorgio", voice_id: "leo" },
    nonna: { name: "Nonna", voice_id: "ursa" },
    personaggio: { name: "Personaggio", voice_id: "ara" }
  };

  for (const id of ids) {
    if (id === DEFAULT_NARRATOR_ID) continue;

    // User override first
    const user = userSpeakers.find(
      (s) => s.id === id || s.name?.toLowerCase() === id
    );
    if (user) {
      speakers.push({
        id,
        name: user.name || id,
        voice_id: user.voice_id || "ara"
      });
      continue;
    }

    // Defaults
    if (defaults[id]) {
      speakers.push({ id, ...defaults[id] });
    } else {
      speakers.push({
        id,
        name: id.charAt(0).toUpperCase() + id.slice(1),
        voice_id: "ara"
      });
    }
  }

  return speakers;
}

function resolveSpeakerId(name, speakerMap) {
  const key = name.toLowerCase().replace(/\s+/g, "-");
  if (speakerMap[key]) return speakerMap[key];
  return key;
}

/**
 * Create a simple timeline (seconds) for the frontend player.
 * In production this should come from real TTS character timestamps.
 */
function buildApproximateTimeline(turns, avgCharsPerSecond = 14) {
  let t = 0;
  return turns.map((turn) => {
    const entry = {
      t: Math.round(t * 10) / 10,
      speaker: turn.speaker_id,
      text: turn.text
    };
    // Rough duration estimate
    const duration = Math.max(1.2, turn.text.length / avgCharsPerSecond);
    t += duration + (turn.gap === "long" ? 1.2 : turn.gap === "short" ? 0.3 : 0.6);
    return entry;
  });
}

module.exports = {
  parseStoryToTurns,
  buildSpeakers,
  buildApproximateTimeline,
  DEFAULT_NARRATOR_ID
};
