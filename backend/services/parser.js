/**
 * Italian-aware story → multi-voice turns parser
 * ------------------------------------------------
 * Converts free-form Italian text into ordered speaker turns
 * ready for multi-speaker TTS + animated playback.
 *
 * Supported patterns:
 * - Explicit:   Piergiorgio: Ciao nonna!
 * - Explicit:   Nonna — Chi va là?
 * - Quotes:     «Dai, è solo per un po'...»
 * - Quotes:     "Non tornare più."
 * - Mixed:      Disse con rabbia: «Vattene!»
 * - Narration:  everything else → Narratore
 */

const DEFAULT_NARRATOR_ID = "narratore";

/**
 * Main entry point
 */
function parseStoryToTurns(text, speakerMap = {}) {
  if (!text || typeof text !== "string") return [];

  const voiceMap = {};

  // Extract optional voice declarations at the top
  // Format:
  // [Voci]
  // Narratore: orion
  // Piergiorgio: leo
  // Nonna: ursa
  // [/Voci]
  const voiceBlock = text.match(/\[Voci\]([\s\S]*?)\[\/Voci\]/i);
  if (voiceBlock) {
    const lines = voiceBlock[1].split(/\n/).map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const m = line.match(/^([^:]+):\s*([a-zA-Z0-9_-]+)/);
      if (m) {
        const name = m[1].trim();
        const voice = m[2].trim().toLowerCase();
        const id = name.toLowerCase().replace(/\s+/g, "-");
        voiceMap[id] = voice;
        voiceMap[name.toLowerCase()] = voice;
      }
    }
    // Remove the block from the text that will be parsed
    text = text.replace(/\[Voci\][\s\S]*?\[\/Voci\]/i, "").trim();
  }

  // Attach voiceMap so the route can pass it to buildSpeakers
  parseStoryToTurns.lastVoiceMap = voiceMap;

  // Normalize
  let normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'");

  const lines = normalized
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);

  const turns = [];
  let lastSpeaker = DEFAULT_NARRATOR_ID;

  for (const line of lines) {
    const parsed = parseLine(line, lastSpeaker, speakerMap);
    for (const turn of parsed) {
      turns.push(turn);
      lastSpeaker = turn.speaker_id;
    }
  }

  // Merge consecutive turns of the same speaker (cleaner audio)
  return mergeConsecutive(turns);
}

/**
 * Parse a single line into one or more turns
 */
function parseLine(line, lastSpeaker, speakerMap) {
  // 1. Explicit speaker label
  //    "Piergiorgio: testo"  |  "Nonna — testo"  |  "Nonna – testo"
  const explicit = line.match(
    /^([A-ZÀ-Ú][A-Za-zà-úÀ-Ú''\s]{0,40}?)\s*[:—–-]\s*(.+)$/
  );
  if (explicit) {
    const name = explicit[1].trim();
    const content = explicit[2].trim();
    const speakerId = resolveSpeakerId(name, speakerMap);

    // If the content has no quotes, treat the whole thing as this speaker
    if (!content.includes("«") && !content.includes('"')) {
      return [
        {
          speaker_id: speakerId,
          text: content,
          gap: "short"
        }
      ];
    }

    // Otherwise split mixed content
    return splitMixedContent(content, speakerId, speakerMap);
  }

  // 2. Pure quoted line
  const pureQuote = line.match(/^[«"](.+)[»"]$/);
  if (pureQuote) {
    const speakerId =
      lastSpeaker === DEFAULT_NARRATOR_ID ? "personaggio" : lastSpeaker;
    return [
      {
        speaker_id: speakerId,
        text: pureQuote[1].trim(),
        gap: "short"
      }
    ];
  }

  // 3. Mixed narration + dialogue in the same line
  if (line.includes("«") || line.includes('"')) {
    return splitMixedContent(line, lastSpeaker, speakerMap);
  }

  // 4. Pure narration
  return [
    {
      speaker_id: DEFAULT_NARRATOR_ID,
      text: line,
      gap: "mid"
    }
  ];
}

/**
 * Split a line that contains both narration and quoted speech
 */
function splitMixedContent(text, fallbackSpeaker, speakerMap) {
  const turns = [];
  // Match sequences of narration and quotes
  const regex = /([^«"]+)|[«"]([^«"]+)[»"]/g;
  let match;
  let lastWasQuote = false;

  while ((match = regex.exec(text)) !== null) {
    const narration = match[1]?.trim();
    const quote = match[2]?.trim();

    if (narration) {
      // Avoid tiny fragments
      if (narration.length > 1) {
        turns.push({
          speaker_id: DEFAULT_NARRATOR_ID,
          text: narration,
          gap: lastWasQuote ? "short" : "mid"
        });
        lastWasQuote = false;
      }
    }

    if (quote) {
      const speakerId =
        fallbackSpeaker === DEFAULT_NARRATOR_ID ? "personaggio" : fallbackSpeaker;
      turns.push({
        speaker_id: speakerId,
        text: quote,
        gap: "short"
      });
      lastWasQuote = true;
    }
  }

  // Fallback if nothing was extracted
  if (turns.length === 0) {
    turns.push({
      speaker_id: fallbackSpeaker || DEFAULT_NARRATOR_ID,
      text: text,
      gap: "mid"
    });
  }

  return turns;
}

/**
 * Merge consecutive turns of the same speaker
 */
function mergeConsecutive(turns) {
  if (turns.length === 0) return [];

  const merged = [turns[0]];

  for (let i = 1; i < turns.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = turns[i];

    if (prev.speaker_id === curr.speaker_id) {
      prev.text = prev.text + " " + curr.text;
      // keep the more expressive gap
      if (curr.gap === "long" || prev.gap === "long") prev.gap = "long";
      else if (curr.gap === "mid" || prev.gap === "mid") prev.gap = "mid";
    } else {
      merged.push({ ...curr });
    }
  }

  return merged;
}

/**
 * Build speaker list from detected turns + optional user overrides
 */
function buildSpeakers(turns, userSpeakers = [], voiceMap = {}) {
  const ids = new Set(turns.map((t) => t.speaker_id));
  const speakers = [];

  // Narrator always first
  const narratorVoice = voiceMap["narratore"] || voiceMap["narratore"] || "orion";
  speakers.push({
    id: DEFAULT_NARRATOR_ID,
    name: "Narratore",
    voice_id: narratorVoice
  });

  const defaults = {
    piergiorgio: { name: "Piergiorgio", voice_id: "leo" },
    nonna: { name: "Nonna", voice_id: "ursa" },
    personaggio: { name: "Personaggio", voice_id: "ara" },
    ragazzo: { name: "Ragazzo", voice_id: "leo" },
    ragazza: { name: "Ragazza", voice_id: "ara" },
    uomo: { name: "Uomo", voice_id: "atlas" },
    donna: { name: "Donna", voice_id: "luna" }
  };

  for (const id of ids) {
    if (id === DEFAULT_NARRATOR_ID) continue;

    const user = userSpeakers.find(
      (s) => s.id === id || s.name?.toLowerCase() === id
    );

    // Priority: explicit [Voci] block → user override → defaults → ara
    const declaredVoice = voiceMap[id] || voiceMap[id.replace(/-/g, " ")];

    if (declaredVoice) {
      speakers.push({
        id,
        name: capitalize(id),
        voice_id: declaredVoice
      });
    } else if (user) {
      speakers.push({
        id,
        name: user.name || capitalize(id),
        voice_id: user.voice_id || "ara"
      });
    } else if (defaults[id]) {
      speakers.push({ id, ...defaults[id] });
    } else {
      speakers.push({
        id,
        name: capitalize(id),
        voice_id: "ara"
      });
    }
  }

  return speakers;
}

/**
 * Approximate timeline (seconds) for the frontend.
 * Later replace with real character-level timestamps from TTS.
 */
function buildApproximateTimeline(turns, charsPerSecond = 13.5) {
  let t = 0;
  const timeline = [];

  for (const turn of turns) {
    timeline.push({
      t: Math.round(t * 10) / 10,
      speaker: turn.speaker_id,
      text: turn.text
    });

    const readingTime = Math.max(1.1, turn.text.length / charsPerSecond);
    const gapTime =
      turn.gap === "long" ? 1.1 :
      turn.gap === "short" ? 0.25 :
      turn.gap === "very_long" ? 1.8 : 0.55;

    t += readingTime + gapTime;
  }

  return timeline;
}

function resolveSpeakerId(name, speakerMap) {
  const key = name.toLowerCase().trim().replace(/\s+/g, "-");
  return speakerMap[key] || key;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

module.exports = {
  parseStoryToTurns,
  buildSpeakers,
  buildApproximateTimeline,
  DEFAULT_NARRATOR_ID
};
