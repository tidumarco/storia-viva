# Storia Viva — Backend Skeleton (v0.1)

Minimal Express backend for **Fai prendere vita alla tua storia**.

Primary language: **Italian** (`language: "it"` by default).

---

## Quick start

```bash
cd backend
npm install
npm run dev          # or npm start
```

Server runs on `http://localhost:3001`

---

## Endpoints

### `GET /health`
```json
{ "status": "ok", "service": "storia-viva-backend", "version": "0.1.0", "defaultLanguage": "it" }
```

### `GET /api/voices`
Returns available voice IDs (static list for now).

### `POST /api/generate`
**Request**
```json
{
  "title": "Piergiorgio e la nonna",
  "text": "Piergiorgio aveva deciso che quella sera sarebbe stata la volta buona...\n\n«Dai nonna, è solo per un po'...»\n\nLa nonna lo guardò con gli occhi stretti.",
  "speakers": [
    { "id": "piergiorgio", "name": "Piergiorgio", "voice_id": "leo" },
    { "id": "nonna", "name": "Nonna", "voice_id": "ursa" }
  ],
  "language": "it"
}
```

**Response**
```json
{
  "id": "uuid",
  "title": "Piergiorgio e la nonna",
  "audioUrl": "/audio/story-xxxxxxxx.mp3",
  "timeline": [
    { "t": 0.0, "speaker": "narratore", "text": "..." },
    { "t": 8.5, "speaker": "piergiorgio", "text": "..." }
  ],
  "speakers": [...],
  "turns": [...],
  "durationEstimate": 42.5,
  "language": "it",
  "mode": "mock"
}
```

Audio files are served from `/audio/*`.

---

## Architecture

```
backend/
├── server.js              # Express entry
├── routes/
│   └── generate.js        # POST /api/generate + GET /api/voices
├── services/
│   ├── parser.js          # text → turns + speakers + timeline
│   └── tts.js             # multi-speaker TTS (mock + real placeholder)
└── public/                # generated mp3 files
```

### Parser (`services/parser.js`)
Rule-based Italian-friendly splitter:
- Explicit `Name: text` or `Name — text`
- Quoted dialogue `«...»` / `"..."`
- Everything else → Narratore

Later: replace with LLM for much better turn detection.

### TTS (`services/tts.js`)
- `TTS_MODE=mock` (default) → copies the pre-generated demo audio
- `TTS_MODE=real` → placeholder ready for a real provider

---

## Environment variables

| Variable     | Default | Description                          |
|--------------|---------|--------------------------------------|
| `PORT`       | 3001    | Server port                          |
| `TTS_MODE`   | mock    | `mock` or `real`                     |
| `TTS_API_KEY`| —       | For real provider (not used yet)     |

---

## Next steps (after this skeleton)

1. Plug a real multi-speaker TTS provider
2. Improve parser (LLM or better heuristics)
3. Add job queue + progress for long stories
4. Auth + user library
5. Connect React frontend

---

## Test with curl

```bash
curl -X POST http://localhost:3001/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "text": "Il narratore inizia.\n\nPiergiorgio: Ciao nonna!\n\nNonna: Chi va là?"
  }'
```
