# Fai prendere vita alla tua storia — Prototype v0.1

Prototipo tecnico leggero e immediatamente testabile.

## Cosa include

- **UI completa** (Home → Editor → Player)
- **Due macro-categorie**: Racconti inediti / Fanfiction
- **Audio multi-voce reale** generato con `voice_generate_multi_speech`
  - Narratore → `orion`
  - Piergiorgio → `leo`
  - Nonna → `ursa`
- **Animazioni CSS** (personaggi che si attivano, speech bubble, cambio scena, bounce)
- **Timeline sincronizzata** tra audio e UI
- **Rilevamento grezzo dei personaggi** dal testo (virgolette + nomi)

## Come testarlo

1. Apri `index.html` in un browser moderno (Chrome/Firefox/Edge)
2. Clicca **▶ Avvia demo** → ascolti l’audio multi-voce + vedi le animazioni
3. Oppure vai su una categoria → scrivi un testo → (la generazione reale è ancora mock)

## Struttura file

```
artifacts/
├── index.html
├── styles.css
├── app.js
├── piergiorgio_nonna.mp3   ← audio multi-speaker generato
└── README.md
```

## Come estenderlo (roadmap tecnica)

### Backend minimo (Node / Python / whatever)

```ts
// POST /api/generate
{
  title: string
  text: string
  speakers: { id: string, name: string, voice_id: string }[]
  turns: { speaker_id: string, text: string, gap?: string }[]
}

// Internamente chiama voice_generate_multi_speech
// Ritorna { audioUrl, timeline: { t: number, speaker: string, text: string }[] }
```

### Parsing intelligente del testo

Sostituire il regex naive con:
- LLM che estrae personaggi + spezza il testo in turni
- Oppure parser basato su regole + NLP leggero

### Animazioni next-level

- Canvas / PixiJS / Three.js per personaggi più vivi
- Lip-sync reale usando i timestamps del TTS (`with_timestamps: true`)
- Scene generate con AI (background + character sprites)
- Transizioni cinematografiche

### Voci disponibili (attuali)

```
altair, ara, atlas, aurora, carina, castor, celeste, cosmo,
eve, helios, helix, iris, kepler, leo, liora, lumen, luna,
lux, naksh, orion, perseus, rex, rigel, sal, sirius, ursa,
zagan, zenith
```

Tutte multilingual → perfette per l’italiano.

## Note di implementazione

- Il file `piergiorgio_nonna.mp3` è già pronto e referenziato in `index.html`
- La timeline in `app.js` è hardcodata e allineata all’audio generato
- In produzione la timeline dovrebbe arrivare dal backend (o essere calcolata dai character-level timestamps)

Buon hacking.
