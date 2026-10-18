/**
 * Prototype — Fai prendere vita alla tua storia
 * Vanilla JS, multi-voice ready, CSS animations
 */

// ---------- State ----------
const state = {
  currentScreen: "home",
  category: null,
  story: {
    title: "",
    text: "",
    speakers: []
  },
  isPlaying: false,
  // Demo timeline (seconds) — synced roughly with the generated audio
  demoTimeline: [
    { t: 0.0,  speaker: "narratore",   text: "Piergiorgio aveva deciso che quella sera sarebbe stata la volta buona. Aveva bisogno di soldi, e sapeva dove trovarli." },
    { t: 8.5,  speaker: "piergiorgio", text: "Dai nonna, è solo per un po'... te li restituisco, giuro!" },
    { t: 13.2, speaker: "narratore",   text: "La nonna lo guardò con gli occhi stretti, la mano ancora chiusa sulla borsa della pensione." },
    { t: 19.0, speaker: "nonna",       text: "Piergiorgio... tu pensi che io sia scema? Quella pensione è tutto quello che ho." },
    { t: 26.5, speaker: "piergiorgio", text: "Ma nonna, è una cosa seria, ti prego..." },
    { t: 30.8, speaker: "nonna",       text: "Vai via. E non tornare finché non hai imparato il rispetto." },
    { t: 36.5, speaker: "narratore",   text: "Piergiorgio abbassò lo sguardo. Per la prima volta, aveva perso." }
  ]
};

// ---------- DOM ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const screens = {
  home: $("#home"),
  editor: $("#editor"),
  player: $("#player")
};

const audio = $("#audio");
const progressEl = $("#progress");
const currentTimeEl = $("#current-time");
const totalTimeEl = $("#total-time");
const subtitleEl = $("#subtitle");
const sceneBg = $("#scene-bg");

// ---------- Navigation ----------
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
  state.currentScreen = name;
}

// Home → Editor
$$(".cat-card").forEach(btn => {
  btn.addEventListener("click", () => {
    state.category = btn.dataset.cat;
    $("#editor-title").textContent =
      state.category === "inediti" ? "Nuovo racconto inedito" : "Nuova fanfiction";
    showScreen("editor");
    parseSpeakers();
  });
});

$("#btn-back-home").addEventListener("click", () => showScreen("home"));
$("#btn-back-editor").addEventListener("click", () => {
  stopPlayback();
  showScreen("editor");
});

// Demo button
$("#btn-demo").addEventListener("click", () => {
  state.story.title = "Piergiorgio e la pensione della nonna";
  $("#player-title").textContent = state.story.title;
  showScreen("player");
  // Auto-start after short delay so UI settles
  setTimeout(() => play(), 400);
});

// ---------- Editor logic ----------
const titleInput = $("#story-title");
const textArea = $("#story-text");
const speakersList = $("#speakers-list");
const generateBtn = $("#btn-generate");

function parseSpeakers() {
  const text = textArea.value;
  // Very naive detection: lines starting with « or " or name:
  const found = new Set(["Narratore"]);

  // Look for quoted speech
  const quoteMatches = text.match(/[«"]([^«»"]+)[»"]/g) || [];
  if (quoteMatches.length) {
    found.add("Personaggio 1");
    if (quoteMatches.length > 2) found.add("Personaggio 2");
  }

  // Look for explicit names before colon or dash
  const nameMatches = text.match(/^([A-ZÀ-Ú][a-zà-ú]+)\s*[:—–-]/gm) || [];
  nameMatches.forEach(m => {
    const name = m.replace(/[:—–-]/g, "").trim();
    if (name) found.add(name);
  });

  state.story.speakers = Array.from(found).map((name, i) => ({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    voice: i === 0 ? "orion" : (i === 1 ? "leo" : "ursa")
  }));

  renderSpeakers();
  updateGenerateButton();
}

function renderSpeakers() {
  speakersList.innerHTML = "";
  state.story.speakers.forEach(sp => {
    const el = document.createElement("div");
    el.className = "speaker-item";
    el.innerHTML = `
      <div class="avatar">${sp.name === "Narratore" ? "🎙️" : "👤"}</div>
      <div class="info">
        <strong>${sp.name}</strong>
        <span>voce: ${sp.voice}</span>
      </div>
    `;
    speakersList.appendChild(el);
  });
}

function updateGenerateButton() {
  const hasText = textArea.value.trim().length > 20;
  generateBtn.disabled = !hasText;
}

titleInput.addEventListener("input", () => {
  state.story.title = titleInput.value;
});

textArea.addEventListener("input", () => {
  state.story.text = textArea.value;
  parseSpeakers();
});

$("#btn-add-speaker").addEventListener("click", () => {
  const name = prompt("Nome del personaggio:");
  if (!name) return;
  state.story.speakers.push({
    id: name.toLowerCase().replace(/\s+/g, "-"),
    name,
    voice: "ara"
  });
  renderSpeakers();
});

// Generate → for now just jumps to player with demo audio
// In a real app this would call /api/generate → voice_generate_multi_speech
generateBtn.addEventListener("click", () => {
  $("#player-title").textContent = state.story.title || "Storia senza titolo";
  showScreen("player");
  // In production: POST story + speakers → backend → multi-speech → return audio URL + timeline
  alert("Nel prototipo la generazione reale è simulata.\nUsa il pulsante Demo in home per ascoltare l'audio multi-voce già generato.");
});

// ---------- Player ----------
let currentCueIndex = -1;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function updateProgress() {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressEl.style.width = `${pct}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
  totalTimeEl.textContent = formatTime(audio.duration);

  // Sync cues
  const t = audio.currentTime;
  let activeCue = null;
  for (let i = state.demoTimeline.length - 1; i >= 0; i--) {
    if (t >= state.demoTimeline[i].t) {
      activeCue = state.demoTimeline[i];
      if (i !== currentCueIndex) {
        currentCueIndex = i;
        activateSpeaker(activeCue.speaker, activeCue.text);
      }
      break;
    }
  }
}

function activateSpeaker(speakerId, text) {
  // Reset all
  $$(".character").forEach(c => {
    c.classList.remove("active");
    c.querySelector(".speech-bubble").classList.remove("visible");
    c.querySelector(".speech-bubble").textContent = "";
  });

  const char = $(`#char-${speakerId}`);
  if (char) {
    char.classList.add("active");
    const bubble = char.querySelector(".speech-bubble");
    bubble.textContent = text.length > 80 ? text.slice(0, 77) + "…" : text;
    bubble.classList.add("visible");
  }

  subtitleEl.textContent = text;

  // Scene change example
  if (speakerId === "nonna" || speakerId === "piergiorgio") {
    sceneBg.classList.add("kitchen");
  } else {
    sceneBg.classList.remove("kitchen");
  }
}

function play() {
  audio.play();
  state.isPlaying = true;
  $("#btn-play-pause").textContent = "⏸ Pausa";
}

function pause() {
  audio.pause();
  state.isPlaying = false;
  $("#btn-play-pause").textContent = "▶ Play";
}

function stopPlayback() {
  audio.pause();
  audio.currentTime = 0;
  state.isPlaying = false;
  currentCueIndex = -1;
  $("#btn-play-pause").textContent = "▶ Play";
  progressEl.style.width = "0%";
  subtitleEl.textContent = "";
  $$(".character").forEach(c => {
    c.classList.remove("active");
    c.querySelector(".speech-bubble").classList.remove("visible");
  });
  sceneBg.classList.remove("kitchen");
}

$("#btn-play-pause").addEventListener("click", () => {
  if (state.isPlaying) pause();
  else play();
});

audio.addEventListener("timeupdate", updateProgress);
audio.addEventListener("ended", () => {
  state.isPlaying = false;
  $("#btn-play-pause").textContent = "▶ Play";
  currentCueIndex = -1;
});

audio.addEventListener("loadedmetadata", () => {
  totalTimeEl.textContent = formatTime(audio.duration);
});

// Click on progress bar to seek
$(".progress-bar").addEventListener("click", (e) => {
  if (!audio.duration) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  audio.currentTime = pct * audio.duration;
});

// ---------- Init ----------
console.log("%cPrototype pronto", "color:#7c5cff;font-weight:bold");
console.log("Voci usate nel demo: orion (narratore), leo (Piergiorgio), ursa (nonna)");
console.log("Per generare nuove storie multi-voce usa voice_generate_multi_speech lato backend");
