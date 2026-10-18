# Storia Viva — Angular Frontend (v0.1)

Modern Angular (standalone components) frontend for **Fai prendere vita alla tua storia**.

Primary language: **Italian**.

---

## Requirements

- Node.js 18+
- Backend running on `http://localhost:3001` (see the backend skeleton)

---

## Quick start

```bash
cd angular-frontend
npm install
npm start
```

Open `http://localhost:4200`

---

## Features

- **Home** with two macro-categories (Racconti inediti / Fanfiction)
- **Editor** → sends story to backend `POST /api/generate`
- **Player** with:
  - Multi-character stage
  - Speech bubbles + subtitles
  - Timeline synced to audio
  - Scene change
  - Demo mode (works even without backend)

---

## Project structure

```
src/
├── app/
│   ├── models/story.model.ts
│   ├── services/story.service.ts
│   ├── pages/
│   │   ├── home/home.component.ts
│   │   ├── editor/editor.component.ts
│   │   └── player/player.component.ts
│   ├── app.component.ts
│   ├── app.config.ts
│   └── app.routes.ts
├── index.html
├── main.ts
└── styles.css
public/
└── piergiorgio_nonna.mp3   ← demo audio
```

---

## Connecting to the backend

The service points to:

```ts
private readonly baseUrl = 'http://localhost:3001';
```

Change it in `src/app/services/story.service.ts` if needed.

For production you will want a proxy or environment files.

---

## Demo mode

Clicking **▶ Avvia demo** on the home page loads the pre-generated multi-voice Italian audio and the hard-coded timeline. No backend required for the demo.

---

## Next improvements (Player)

- Real character-level timestamps from TTS
- Better lip-sync
- Multiple scene backgrounds
- Loading / error states polish
- Voice selection UI in the editor
