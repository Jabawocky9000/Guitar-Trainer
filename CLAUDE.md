# Guitar Theory Trainer

A single-page web app for practising guitar music theory — key signatures,
relative keys, fretboard note names, scale/mode visualisation, diatonic
chords, and interval training.

## Project structure

```
index.html          — HTML structure (585 lines)
styles.css          — All CSS (design tokens in :root, component styles, responsive)
app.js              — Entry point: imports modules, wires up globals, runs init (54 lines)
js/data.js          — Music theory constants (keys, scales, modes, tuning)
js/helpers.js       — Shared utilities (shuffle, pitch class, enharmonic matching)
js/key-signatures.js — Key Signatures quiz
js/relative-keys.js  — Relative Keys quiz
js/note-names.js     — Note Names (Across Strings + Single String modes)
js/scale-map.js      — Scale Map visualiser (Modes, Pentatonic, Chords views)
js/chords-in-key.js  — Chords in a Key (diatonic, secondary dominants, tritone subs)
js/interval-training.js — Interval Training quiz + fretboard reference
FEATURES.md          — Gherkin feature specs capturing every behaviour (refactor checklist)
```

Uses native ES modules (`import`/`export`) — no build step needed, but requires
a server (not `file://`). Each section is self-contained: to work on the Key
Signatures quiz, only `js/key-signatures.js` (106 lines) needs to be read.

## How to run

From Terminal, in the project directory:

```
npm start
```

Then open http://localhost:8000 in your browser. Press Ctrl+C to stop the server.

No build step or compilation needed — the app uses native ES modules served
directly to the browser. The server (`.claude/server.js`) is a tiny static
file server with no dependencies.

For Claude preview: configured in `.claude/launch.json` using the same server.

## Key conventions

- Dark theme with CSS custom properties (--bg, --accent, --green, --red, etc.)
- All fretboard diagrams are rendered as inline SVG via JavaScript
- Standard guitar tuning: E₂ A₂ D₃ G₃ B₃ E₄ (MIDI 40 45 50 55 59 64)
- Enharmonic input accepted everywhere (# → ♯, b → ♭, case-insensitive)
- No external dependencies beyond Google Fonts (Inter, Inter Mono)

## Sections (sidebar navigation order)

1. **Key Signatures** — quiz: count accidentals then name them in order
2. **Relative Keys** — quiz: identify relative major/minor pairs
3. **Note Names** — two modes: "Across Strings" (all 6 at a fret) and "Single String"
4. **Scale Map** — fretboard visualiser with three views: Modes, Pentatonic, Chords
5. **Chords in a Key** — diatonic chords + secondary dominants + tritone subs with diagrams
6. **Interval Training** — quiz: name the note a given interval from a starting note
