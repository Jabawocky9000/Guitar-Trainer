import { MAJ_SCALE, MIN_SCALE } from './data.js';

// ── CHORDS IN A KEY ────────────────────────────────────────────────────────
// Dynamic key-aware diatonic chord system.
// Open voicing templates for common chord roots (all in terms of absolute frets).
// String order: [E2=6th, A2=5th, D3=4th, G3=3rd, B3=2nd, E4=1st] indices 0-5.

// Colour palette for the 7 diatonic degrees
const CIK_COLORS = [
  {fill:'#C8822A', stroke:'#8F5510', text:'#f5d7a0'},
  {fill:'#1D9E75', stroke:'#0F6E56', text:'#a0e8ce'},
  {fill:'#D85A30', stroke:'#993C1D', text:'#f5b8a0'},
  {fill:'#7F77DD', stroke:'#534AB7', text:'#cbc8f5'},
  {fill:'#D4537E', stroke:'#993556', text:'#f5b8cf'},
  {fill:'#2A7E9E', stroke:'#185870', text:'#a0d8ee'},
  {fill:'#A03080', stroke:'#701858', text:'#e0a0d4'},
];

// Roman numerals for major key (I ii iii IV V vi vii°)
const CIK_NUMERALS_MAJ = ['I','ii','iii','IV','V','vi','vii°'];
// Roman numerals for natural minor key (i ii° III iv v VI VII)
const CIK_NUMERALS_MIN = ['i','ii°','III','iv','v','VI','VII'];

// Chord qualities for major scale degrees
const CIK_QUALITY_MAJ = ['maj','min','min','maj','maj','min','dim'];
// Chord qualities for natural minor scale degrees
const CIK_QUALITY_MIN = ['min','dim','maj','min','min','maj','maj'];


// Open voicing library: keyed by root pitch class + quality
// frets: [E2, A2, D3, G3, B3, E4], -1=mute, 0=open
// Consistent moveable shapes throughout:
//   MAJOR  — A-string root barre (Am shape moved up): [-1,R,R+2,R+2,R+2,R], barre str1–str5
//            except E/F/F#/G/Ab/A which use E-string root barre: [R,R+2,R+2,R+1,R,R], barre str0–str5
//   MINOR  — A-string root barre (Am shape): [-1,R,R+2,R+2,R+1,R], barre str1–str5
//            except E/F/F#/G which use E-string root barre: [R,R+2,R+2,R,R,R], barre str0–str5
//   DIM    — A-string root, no barre: [-1,R,R+1,R,R+1,-1]
//            (diminished symmetry: G/Ab/Eb use lower equiv. positions, fret shown = root on A str)
const CIK_VOICING_LIB = {
  // ── MAJOR — A-string root barre ──────────────────────────────────────────
  'Bb_maj': { startFret:1,  frets:[-1,1,3,3,3,1],   fingers:[-1,1,3,4,2,1], barre:{fret:1, fromString:1,toString:5} },
  'B_maj':  { startFret:2,  frets:[-1,2,4,4,4,2],   fingers:[-1,1,3,4,2,1], barre:{fret:2, fromString:1,toString:5} },
  'C_maj':  { startFret:3,  frets:[-1,3,5,5,5,3],   fingers:[-1,1,3,4,2,1], barre:{fret:3, fromString:1,toString:5} },
  'Cs_maj': { startFret:4,  frets:[-1,4,6,6,6,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  'D_maj':  { startFret:5,  frets:[-1,5,7,7,7,5],   fingers:[-1,1,3,4,2,1], barre:{fret:5, fromString:1,toString:5} },
  'Eb_maj': { startFret:6,  frets:[-1,6,8,8,8,6],   fingers:[-1,1,3,4,2,1], barre:{fret:6, fromString:1,toString:5} },
  // ── MAJOR — E-string root barre ──────────────────────────────────────────
  'E_maj':  { startFret:1,  frets:[0,2,2,1,0,0],    fingers:[0,2,3,1,0,0] },
  'F_maj':  { startFret:1,  frets:[1,3,3,2,1,1],    fingers:[1,3,4,2,1,1], barre:{fret:1, fromString:0,toString:5} },
  'Fs_maj': { startFret:2,  frets:[2,4,4,3,2,2],    fingers:[1,3,4,2,1,1], barre:{fret:2, fromString:0,toString:5} },
  'Gb_maj': { startFret:2,  frets:[2,4,4,3,2,2],    fingers:[1,3,4,2,1,1], barre:{fret:2, fromString:0,toString:5} },
  'G_maj':  { startFret:3,  frets:[3,5,5,4,3,3],    fingers:[1,3,4,2,1,1], barre:{fret:3, fromString:0,toString:5} },
  'Ab_maj': { startFret:4,  frets:[4,6,6,5,4,4],    fingers:[1,3,4,2,1,1], barre:{fret:4, fromString:0,toString:5} },
  'A_maj':  { startFret:5,  frets:[5,7,7,6,5,5],    fingers:[1,3,4,2,1,1], barre:{fret:5, fromString:0,toString:5} },
  'Db_maj': { startFret:4,  frets:[-1,4,6,6,6,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  // ── MINOR — A-string root barre ──────────────────────────────────────────
  'A_min':  { startFret:1,  frets:[-1,0,2,2,1,0],   fingers:[-1,0,2,3,1,0] },
  'Bb_min': { startFret:1,  frets:[-1,1,3,3,2,1],   fingers:[-1,1,3,4,2,1], barre:{fret:1, fromString:1,toString:5} },
  'B_min':  { startFret:2,  frets:[-1,2,4,4,3,2],   fingers:[-1,1,3,4,2,1], barre:{fret:2, fromString:1,toString:5} },
  'C_min':  { startFret:3,  frets:[-1,3,5,5,4,3],   fingers:[-1,1,3,4,2,1], barre:{fret:3, fromString:1,toString:5} },
  'Cs_min': { startFret:4,  frets:[-1,4,6,6,5,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  'D_min':  { startFret:5,  frets:[-1,5,7,7,6,5],   fingers:[-1,1,3,4,2,1], barre:{fret:5, fromString:1,toString:5} },
  'Eb_min': { startFret:6,  frets:[-1,6,8,8,7,6],   fingers:[-1,1,3,4,2,1], barre:{fret:6, fromString:1,toString:5} },
  'Db_min': { startFret:4,  frets:[-1,4,6,6,5,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  'Ab_min': { startFret:4,  frets:[-1,4,6,6,5,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  // ── MINOR — E-string root barre ──────────────────────────────────────────
  'E_min':  { startFret:1,  frets:[0,2,2,0,0,0],    fingers:[0,2,3,0,0,0] },
  'F_min':  { startFret:1,  frets:[1,3,3,1,1,1],    fingers:[1,3,4,1,1,1], barre:{fret:1, fromString:0,toString:5} },
  'Fs_min': { startFret:2,  frets:[2,4,4,2,2,2],    fingers:[1,3,4,1,1,1], barre:{fret:2, fromString:0,toString:5} },
  'Gb_min': { startFret:2,  frets:[2,4,4,2,2,2],    fingers:[1,3,4,1,1,1], barre:{fret:2, fromString:0,toString:5} },
  'G_min':  { startFret:3,  frets:[3,5,5,3,3,3],    fingers:[1,3,4,1,1,1], barre:{fret:3, fromString:0,toString:5} },
  // ── DIMINISHED — A-string root, no barre: [-1,R,R+1,R,R+1,-1] ───────────
  // (dim chords repeat every 3 frets; high positions use lower enharmonic equiv.)
  'A_dim':  { startFret:1,  frets:[-1,0,1,0,1,-1],  fingers:[-1,0,1,0,2,-1] },
  'Bb_dim': { startFret:1,  frets:[-1,1,2,1,2,-1],  fingers:[-1,1,2,1,3,-1] },
  'B_dim':  { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] },
  'C_dim':  { startFret:3,  frets:[-1,3,4,3,4,-1],  fingers:[-1,1,2,1,3,-1] },
  'Cs_dim': { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] },
  'Db_dim': { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] },
  'D_dim':  { startFret:5,  frets:[-1,5,6,5,6,-1],  fingers:[-1,1,2,1,3,-1] },
  'Eb_dim': { startFret:3,  frets:[-1,3,4,3,4,-1],  fingers:[-1,1,2,1,3,-1] }, // enharmonic equiv (C dim shape)
  'E_dim':  { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] }, // enharmonic equiv (B dim shape)
  'F_dim':  { startFret:1,  frets:[-1,1,2,1,2,-1],  fingers:[-1,1,2,1,3,-1] }, // enharmonic equiv (Bb dim shape)
  'Fs_dim': { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] }, // same as B dim / E dim
  'Gb_dim': { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] },
  'G_dim':  { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] }, // enharmonic equiv (C# dim shape)
  'Ab_dim': { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] }, // enharmonic equiv (same)
};

// ── C MAJOR open voicings (used only when key = C major) ─────────────────────
// All open position; Bdim kept identical to the moveable library entry.
const CIK_C_MAJ_OPEN = [
  // I  – Cmaj open
  { startFret:1, frets:[-1,3,2,0,1,0], fingers:[-1,3,2,0,1,0] },
  // ii – Dmin open
  { startFret:1, frets:[-1,-1,0,2,3,1], fingers:[-1,-1,0,2,3,1] },
  // iii – Emin open
  { startFret:1, frets:[0,2,2,0,0,0], fingers:[0,2,3,0,0,0] },
  // IV – Fmaj open (partial barre, common open F)
  { startFret:1, frets:[-1,-1,3,2,1,1], fingers:[-1,-1,3,2,1,1] },
  // V  – Gmaj open
  { startFret:1, frets:[3,2,0,0,0,3], fingers:[2,1,0,0,0,3] },
  // vi – Amin open
  { startFret:1, frets:[-1,0,2,2,1,0], fingers:[-1,0,2,3,1,0] },
  // vii° – Bdim (A-string root, kept same as moveable library)
  { startFret:2, frets:[-1,2,3,2,3,-1], fingers:[-1,1,2,1,3,-1] },
];

// ── C MAJOR open seventh voicings ────────────────────────────────────────────
const CIK_C_MAJ_OPEN_7 = [
  // Imaj7  – Cmaj7 open
  { startFret:1, frets:[-1,3,2,0,0,0], fingers:[-1,3,2,0,0,0] },
  // ii7    – Dm7 open
  { startFret:1, frets:[-1,-1,0,2,1,1], fingers:[-1,-1,0,2,1,1] },
  // iii7   – Em7 open
  { startFret:1, frets:[0,2,2,0,3,0], fingers:[0,2,3,0,4,0] },
  // IVmaj7 – Fmaj7 open
  { startFret:1, frets:[-1,-1,3,2,1,0], fingers:[-1,-1,3,2,1,0] },
  // V7     – G7 open
  { startFret:1, frets:[3,2,0,0,0,1], fingers:[3,2,0,0,0,1] },
  // vi7    – Am7 open
  { startFret:1, frets:[-1,0,2,0,1,0], fingers:[-1,0,2,0,1,0] },
  // vii°7  – Bm7b5 (half-dim) — moveable A-string shape
  { startFret:2, frets:[-1,2,3,2,3,-1], fingers:[-1,1,2,1,3,-1] },
];

// ── Seventh chord voicing library (moveable shapes) ──────────────────────────
// Maj7: A-string root [-1,R,R+2,R+1,R,R-1? no…] — standard maj7 barre shapes
// Dom7: A-string root barre
// Min7: A-string root barre
// Notation: seventh chords use the same root positions as triads but add the 7th
const CIK_VOICING_LIB_7 = {
  // ── MAJ7 — A-string root ──────────────────────────────────────────────────
  // Shape: [-1, R, R+2, R+1, R, -1]  (no high e, maj7 on G string)
  'Bb_maj7': { startFret:1,  frets:[-1,1,3,2,3,1],   fingers:[-1,1,3,2,4,1], barre:{fret:1, fromString:1,toString:5} },
  'B_maj7':  { startFret:2,  frets:[-1,2,4,3,4,2],   fingers:[-1,1,3,2,4,1], barre:{fret:2, fromString:1,toString:5} },
  'C_maj7':  { startFret:3,  frets:[-1,3,5,4,5,3],   fingers:[-1,1,3,2,4,1], barre:{fret:3, fromString:1,toString:5} },
  'Cs_maj7': { startFret:4,  frets:[-1,4,6,5,6,4],   fingers:[-1,1,3,2,4,1], barre:{fret:4, fromString:1,toString:5} },
  'Db_maj7': { startFret:4,  frets:[-1,4,6,5,6,4],   fingers:[-1,1,3,2,4,1], barre:{fret:4, fromString:1,toString:5} },
  'D_maj7':  { startFret:5,  frets:[-1,5,7,6,7,5],   fingers:[-1,1,3,2,4,1], barre:{fret:5, fromString:1,toString:5} },
  'Eb_maj7': { startFret:6,  frets:[-1,6,8,7,8,6],   fingers:[-1,1,3,2,4,1], barre:{fret:6, fromString:1,toString:5} },
  // ── MAJ7 — E-string root ──────────────────────────────────────────────────
  // Shape: [R,R+2,R+1,R+1,R,R] — barre str0–str5, 5th +2, 4th +1, 3rd +1
  'E_maj7':  { startFret:1,  frets:[0,2,1,1,0,0],    fingers:[0,3,2,1,0,0], barre:{fret:0, fromString:0,toString:5} },
  'F_maj7':  { startFret:1,  frets:[1,3,2,2,1,1],    fingers:[1,4,3,2,1,1], barre:{fret:1, fromString:0,toString:5} },
  'Fs_maj7': { startFret:2,  frets:[2,4,3,3,2,2],    fingers:[1,4,3,2,1,1], barre:{fret:2, fromString:0,toString:5} },
  'Gb_maj7': { startFret:2,  frets:[2,4,3,3,2,2],    fingers:[1,4,3,2,1,1], barre:{fret:2, fromString:0,toString:5} },
  'G_maj7':  { startFret:3,  frets:[3,5,4,4,3,3],    fingers:[1,4,3,2,1,1], barre:{fret:3, fromString:0,toString:5} },
  'Ab_maj7': { startFret:4,  frets:[4,6,5,5,4,4],    fingers:[1,4,3,2,1,1], barre:{fret:4, fromString:0,toString:5} },
  'A_maj7':  { startFret:5,  frets:[5,7,6,6,5,5],    fingers:[1,4,3,2,1,1], barre:{fret:5, fromString:0,toString:5} },
  // ── DOM7 — A-string root ──────────────────────────────────────────────────
  // Shape: [-1,R,R+2,R,R+2,R] — barre str1–str5, 4th string +2, 2nd string +2
  'Bb_7':  { startFret:1,  frets:[-1,1,3,1,3,1],   fingers:[-1,1,3,1,4,1], barre:{fret:1, fromString:1,toString:5} },
  'B_7':   { startFret:2,  frets:[-1,2,4,2,4,2],   fingers:[-1,1,3,1,4,1], barre:{fret:2, fromString:1,toString:5} },
  'C_7':   { startFret:3,  frets:[-1,3,5,3,5,3],   fingers:[-1,1,3,1,4,1], barre:{fret:3, fromString:1,toString:5} },
  'Cs_7':  { startFret:4,  frets:[-1,4,6,4,6,4],   fingers:[-1,1,3,1,4,1], barre:{fret:4, fromString:1,toString:5} },
  'Db_7':  { startFret:4,  frets:[-1,4,6,4,6,4],   fingers:[-1,1,3,1,4,1], barre:{fret:4, fromString:1,toString:5} },
  'D_7':   { startFret:5,  frets:[-1,5,7,5,7,5],   fingers:[-1,1,3,1,4,1], barre:{fret:5, fromString:1,toString:5} },
  'Eb_7':  { startFret:6,  frets:[-1,6,8,6,8,6],   fingers:[-1,1,3,1,4,1], barre:{fret:6, fromString:1,toString:5} },
  // ── DOM7 — E-string root ──────────────────────────────────────────────────
  // Shape: [R, R+2, R, R+1, R, R] — barre all 6 strings, 5th str +2, 3rd str +1
  'E_7':   { startFret:1,  frets:[0,2,0,1,0,0],    fingers:[0,3,0,2,0,0], barre:{fret:0, fromString:0,toString:5} },
  'F_7':   { startFret:1,  frets:[1,3,1,2,1,1],    fingers:[1,3,1,2,1,1], barre:{fret:1, fromString:0,toString:5} },
  'Fs_7':  { startFret:2,  frets:[2,4,2,3,2,2],    fingers:[1,3,1,2,1,1], barre:{fret:2, fromString:0,toString:5} },
  'Gb_7':  { startFret:2,  frets:[2,4,2,3,2,2],    fingers:[1,3,1,2,1,1], barre:{fret:2, fromString:0,toString:5} },
  'G_7':   { startFret:3,  frets:[3,5,3,4,3,3],    fingers:[1,3,1,2,1,1], barre:{fret:3, fromString:0,toString:5} },
  'Ab_7':  { startFret:4,  frets:[4,6,4,5,4,4],    fingers:[1,3,1,2,1,1], barre:{fret:4, fromString:0,toString:5} },
  'A_7':   { startFret:5,  frets:[5,7,5,6,5,5],    fingers:[1,3,1,2,1,1], barre:{fret:5, fromString:0,toString:5} },
  // ── MIN7 — A-string root ──────────────────────────────────────────────────
  // Shape: [-1,R,R+2,R+2,R+1,R] — same as dom7 but b3 instead of 3 (visual same, diff interval)
  'A_min7':  { startFret:1,  frets:[-1,0,2,0,1,0],   fingers:[-1,0,2,0,1,0] },  // open Am7
  'Bb_min7': { startFret:1,  frets:[-1,1,3,3,2,1],   fingers:[-1,1,3,4,2,1], barre:{fret:1, fromString:1,toString:5} },
  'B_min7':  { startFret:2,  frets:[-1,2,4,4,3,2],   fingers:[-1,1,3,4,2,1], barre:{fret:2, fromString:1,toString:5} },
  'C_min7':  { startFret:3,  frets:[-1,3,5,5,4,3],   fingers:[-1,1,3,4,2,1], barre:{fret:3, fromString:1,toString:5} },
  'Cs_min7': { startFret:4,  frets:[-1,4,6,6,5,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  'Db_min7': { startFret:4,  frets:[-1,4,6,6,5,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  'D_min7':  { startFret:5,  frets:[-1,5,7,7,6,5],   fingers:[-1,1,3,4,2,1], barre:{fret:5, fromString:1,toString:5} },
  'Eb_min7': { startFret:6,  frets:[-1,6,8,8,7,6],   fingers:[-1,1,3,4,2,1], barre:{fret:6, fromString:1,toString:5} },
  'Ab_min7': { startFret:4,  frets:[-1,4,6,6,5,4],   fingers:[-1,1,3,4,2,1], barre:{fret:4, fromString:1,toString:5} },
  // ── MIN7 — E-string root ──────────────────────────────────────────────────
  // Shape: [R,R+2,R,R,R,R] — full barre, 5th string +2 only
  'E_min7':  { startFret:1,  frets:[0,2,0,0,0,0],    fingers:[0,2,0,0,0,0], barre:{fret:0, fromString:0,toString:5} },
  'F_min7':  { startFret:1,  frets:[1,3,1,1,1,1],    fingers:[1,3,1,1,1,1], barre:{fret:1, fromString:0,toString:5} },
  'Fs_min7': { startFret:2,  frets:[2,4,2,2,2,2],    fingers:[1,3,1,1,1,1], barre:{fret:2, fromString:0,toString:5} },
  'Gb_min7': { startFret:2,  frets:[2,4,2,2,2,2],    fingers:[1,3,1,1,1,1], barre:{fret:2, fromString:0,toString:5} },
  'G_min7':  { startFret:3,  frets:[3,5,3,3,3,3],    fingers:[1,3,1,1,1,1], barre:{fret:3, fromString:0,toString:5} },
  // ── HALF-DIM (min7b5) — A-string root ────────────────────────────────────
  // Shape: [-1,R,R+1,R,R+1,-1] same as dim triad but that's actually min7b5 voicing too
  'A_hdim':  { startFret:1,  frets:[-1,0,1,0,1,-1],  fingers:[-1,0,1,0,2,-1] },
  'Bb_hdim': { startFret:1,  frets:[-1,1,2,1,2,-1],  fingers:[-1,1,2,1,3,-1] },
  'B_hdim':  { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] },
  'C_hdim':  { startFret:3,  frets:[-1,3,4,3,4,-1],  fingers:[-1,1,2,1,3,-1] },
  'Cs_hdim': { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] },
  'Db_hdim': { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] },
  'D_hdim':  { startFret:5,  frets:[-1,5,6,5,6,-1],  fingers:[-1,1,2,1,3,-1] },
  'Eb_hdim': { startFret:3,  frets:[-1,3,4,3,4,-1],  fingers:[-1,1,2,1,3,-1] },
  'E_hdim':  { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] },
  'F_hdim':  { startFret:1,  frets:[-1,1,2,1,2,-1],  fingers:[-1,1,2,1,3,-1] },
  'Fs_hdim': { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] },
  'Gb_hdim': { startFret:2,  frets:[-1,2,3,2,3,-1],  fingers:[-1,1,2,1,3,-1] },
  'G_hdim':  { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] },
  'Ab_hdim': { startFret:4,  frets:[-1,4,5,4,5,-1],  fingers:[-1,1,2,1,3,-1] },
};

// Note name list (for display), pitch-class to canonical name
const CIK_NOTE_NAMES = ['C','C♯/D♭','D','D♯/E♭','E','F','F♯/G♭','G','G♯/A♭','A','A♯/B♭','B'];
// Preferred name per pc for sharp keys
const CIK_NAMES_SHARP = {
  0:'C', 1:'C♯', 2:'D', 3:'D♯', 4:'E', 5:'F', 6:'F♯', 7:'G', 8:'G♯', 9:'A', 10:'A♯', 11:'B'
};
// Preferred name per pc for flat keys
const CIK_NAMES_FLAT = {
  0:'C', 1:'D♭', 2:'D', 3:'E♭', 4:'E', 5:'F', 6:'G♭', 7:'G', 8:'A♭', 9:'A', 10:'B♭', 11:'B'
};
// Lookup key for voicing library from pitch class + quality
const CIK_PC_TO_KEY = {
  0:'C', 1:'Cs', 2:'D', 3:'Eb', 4:'E', 5:'F', 6:'Fs', 7:'G', 8:'Ab', 9:'A', 10:'Bb', 11:'B'
};

// Which keys use sharps (by root pc): C, G, D, A, E, B, F#, C# for major; equivalent minors
const CIK_SHARP_ROOTS_MAJ = new Set([0,7,2,9,4,11,6,1]);   // C G D A E B F# C#
const CIK_SHARP_ROOTS_MIN = new Set([9,4,11,6,1,8,3,10]);  // Am Em Bm F#m C#m G#m D#m A#m

let cikKeyMode = 'major';   // 'major' or 'minor'
let cikKeyRoot = 0;         // pitch class 0-11
let cikShowSevenths = false; // toggle between triads and seventh chords

const CIK_ROOT_NOTES = [
  {label:'C', pc:0}, {label:'C♯', pc:1}, {label:'D', pc:2}, {label:'E♭', pc:3},
  {label:'E', pc:4}, {label:'F', pc:5}, {label:'F♯', pc:6}, {label:'G', pc:7},
  {label:'A♭', pc:8}, {label:'A', pc:9}, {label:'B♭', pc:10}, {label:'B', pc:11},
];

function cikBuildRootBtns(){
  const wrap = document.getElementById('cik-root-btns');
  if(!wrap) return;
  wrap.innerHTML = '';
  CIK_ROOT_NOTES.forEach(n => {
    const b = document.createElement('button');
    b.className = 'filter-btn' + (n.pc === cikKeyRoot ? ' active' : '');
    b.textContent = n.label;
    b.dataset.pc = n.pc;
    b.onclick = () => { cikKeyRoot = n.pc; cikBuildRootBtns(); cikBuild(); };
    wrap.appendChild(b);
  });
}

function cikSetMode(m){
  cikKeyMode = m;
  document.getElementById('cik-mode-major').classList.toggle('active', m==='major');
  document.getElementById('cik-mode-minor').classList.toggle('active', m==='minor');
  cikBuild();
}

function cikToggleSevenths(){
  cikShowSevenths = !cikShowSevenths;
  const tog   = document.getElementById('cik-7th-toggle');
  const thumb = document.getElementById('cik-7th-thumb');
  const txt   = document.getElementById('cik-7th-text');
  if(cikShowSevenths){
    tog.style.background   = '#1a1025';
    tog.style.borderColor  = '#7a5ab0';
    thumb.style.left       = '18px';
    thumb.style.background = '#a07ad4';
    if(txt) txt.style.color = '#b8a0e0';
  } else {
    tog.style.background   = '#222';
    tog.style.borderColor  = '#3a3a3a';
    thumb.style.left       = '2px';
    thumb.style.background = '#888';
    if(txt) txt.style.color = 'var(--text-muted)';
  }
  cikBuild();
}

// 7th chord quality labels per scale degree
const CIK_QUALITY_MAJ_7 = ['maj7','min7','min7','maj7','dom7','min7','hdim'];
const CIK_QUALITY_MIN_7 = ['min7','hdim','maj7','min7','min7','maj7','dom7'];
// Suffix labels for chord names in 7th mode
const CIK_7_SUFFIX = { maj7:'maj7', min7:'m7', dom7:'7', hdim:'m7b5' };
// Numerals for 7th chords
const CIK_NUMERALS_MAJ_7 = ['Imaj7','ii7','iii7','IVmaj7','V7','vi7','vii°7'];
const CIK_NUMERALS_MIN_7 = ['im7','ii°7','IIImaj7','iv7','v7','VImaj7','VII7'];

function cikGetChords(){
  const scale   = cikKeyMode === 'major' ? MAJ_SCALE : MIN_SCALE;
  const quals   = cikKeyMode === 'major'
    ? (cikShowSevenths ? CIK_QUALITY_MAJ_7 : CIK_QUALITY_MAJ)
    : (cikShowSevenths ? CIK_QUALITY_MIN_7 : CIK_QUALITY_MIN);
  const nums    = cikKeyMode === 'major'
    ? (cikShowSevenths ? CIK_NUMERALS_MAJ_7 : CIK_NUMERALS_MAJ)
    : (cikShowSevenths ? CIK_NUMERALS_MIN_7 : CIK_NUMERALS_MIN);

  // Determine whether this key uses sharps or flats
  const useSharp = cikKeyMode === 'major'
    ? CIK_SHARP_ROOTS_MAJ.has(cikKeyRoot)
    : CIK_SHARP_ROOTS_MIN.has(cikKeyRoot);
  const nameMap = useSharp ? CIK_NAMES_SHARP : CIK_NAMES_FLAT;

  // C Major: use open voicings (Bdim kept same)
  const isCMajor = cikKeyRoot === 0 && cikKeyMode === 'major';

  return scale.map((interval, i) => {
    const chordPc = (cikKeyRoot + interval) % 12;
    const pcKey   = CIK_PC_TO_KEY[chordPc];
    const qual    = quals[i];
    const chordNoteName = nameMap[chordPc] ?? CIK_NOTE_NAMES[chordPc];

    let voicing;
    if(isCMajor){
      voicing = cikShowSevenths ? CIK_C_MAJ_OPEN_7[i] : CIK_C_MAJ_OPEN[i];
    } else if(cikShowSevenths){
      const libKey7 = pcKey + '_' + qual;
      voicing = CIK_VOICING_LIB_7[libKey7] ?? CIK_VOICING_LIB_7[pcKey + '_min7'];
    } else {
      const libKey = pcKey + '_' + qual;
      voicing = CIK_VOICING_LIB[libKey] ?? CIK_VOICING_LIB[pcKey + '_maj'];
    }

    let qualLabel;
    if(cikShowSevenths){
      qualLabel = CIK_7_SUFFIX[qual] ?? qual;
    } else {
      qualLabel = qual==='dim' ? 'Dim' : qual==='min' ? 'Minor' : 'Major';
    }

    return {
      numeral: nums[i],
      name: chordNoteName + ' ' + qualLabel,
      quality: qual,
      ...CIK_COLORS[i],
      ...(voicing || { startFret:1, frets:[-1,-1,-1,-1,-1,-1], fingers:[-1,-1,-1,-1,-1,-1] }),
    };
  });
}

function cikBuildDiagram(chord, compact=true){
  const W = compact ? 200 : 260, H = compact ? 290 : 360;
  const LEFT = compact ? 46 : 64, RIGHT = W - (compact ? 14 : 20);
  const STRINGS = 6, FRETS_SHOWN = 5;
  const strGap  = (RIGHT - LEFT) / (STRINGS - 1);
  const fretGap = (compact ? 136 : 188) / FRETS_SHOWN;
  const DOT_R   = compact ? 10 : 14;

  // Compute TOP so fretboard is vertically centred below the header area
  const HEADER    = compact ? 46 : 64;
  const MUTE_ZONE = compact ? 22 : 30;
  const fretboardH = fretGap * FRETS_SHOWN;
  const remaining  = H - HEADER - MUTE_ZONE - fretboardH;
  const TOP        = HEADER + MUTE_ZONE + Math.max(0, remaining / 2);
  const BOTTOM     = TOP + fretboardH;

  const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('width','100%');
  svg.setAttribute('height','auto');
  svg.style.display = 'block';

  function el(tag, attrs, text){
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if(text !== undefined) e.textContent = text;
    return e;
  }

  // ── Header ──
  const nameFontSize  = compact ? 28 : 36;
  const numFontSize   = compact ? 16 : 20;
  const gap           = compact ? 4 : 6;
  const totalTextH    = nameFontSize + numFontSize + gap;
  const blockTop      = Math.max(4, (HEADER - totalTextH) / 2);
  const nameY         = blockTop + nameFontSize;
  const numeralY      = nameY + gap + numFontSize;

  svg.appendChild(el('text',{x:W/2, y:nameY,'text-anchor':'middle','font-size':String(nameFontSize),'font-weight':'600',
    fill:'#f0f0f0','font-family':'Inter,sans-serif'}, chord.name));
  svg.appendChild(el('text',{x:W/2, y:numeralY,'text-anchor':'middle','font-size':String(numFontSize),'font-weight':'500',
    fill:chord.fill,'font-family':'Inter,sans-serif'}, chord.numeral));

  // ── Nut or fret label ──
  if(chord.startFret === 1){
    svg.appendChild(el('rect',{x:LEFT-2, y:TOP-7, width:RIGHT-LEFT+4, height:compact?6:9, fill:'#ccc', rx:2}));
  } else {
    svg.appendChild(el('text',{x:LEFT/2, y:TOP + fretGap*0.55, 'text-anchor':'middle',
      'font-size':compact?'10':'13', fill:'#888','font-family':'Inter,sans-serif'}, chord.startFret+'fr'));
  }

  // ── Grid ──
  svg.appendChild(el('line',{x1:LEFT,y1:TOP,x2:RIGHT,y2:TOP,stroke:'#3a3a3a','stroke-width':'1'}));
  for(let f=1; f<=FRETS_SHOWN; f++){
    const y = TOP + f * fretGap;
    svg.appendChild(el('line',{x1:LEFT,y1:y,x2:RIGHT,y2:y,stroke:'#3a3a3a','stroke-width':'1'}));
  }
  for(let s=0; s<STRINGS; s++){
    const x = LEFT + s * strGap;
    svg.appendChild(el('line',{x1:x,y1:TOP,x2:x,y2:BOTTOM,stroke:'#555','stroke-width':'1.4'}));
  }

  // ── Barre: border spanning full range + dots ONLY at outermost strings ──
  if(chord.barre){
    const by  = TOP + (chord.barre.fret - chord.startFret) * fretGap + fretGap * 0.5;
    const bx1 = LEFT + chord.barre.fromString * strGap;
    const bx2 = LEFT + chord.barre.toString   * strGap;
    const pad = DOT_R + 3;

    // Collective border (full span)
    svg.appendChild(el('rect',{
      x: bx1 - pad, y: by - pad,
      width: (bx2 - bx1) + pad * 2, height: pad * 2,
      fill:'none', stroke:chord.stroke, 'stroke-width':'2', rx:pad, opacity:'0.9'
    }));

    // Endpoint dots only — first and last string of barre
    const barreEndpoints = new Set([chord.barre.fromString, chord.barre.toString]);
    barreEndpoints.forEach(s => {
      const x = LEFT + s * strGap;
      svg.appendChild(el('circle',{cx:x, cy:by, r:DOT_R, fill:chord.fill, stroke:'none'}));
    });
  }

  // ── Individual dots, mutes, opens ──
  chord.frets.forEach((fret, s) => {
    const x = LEFT + s * strGap;
    if(fret === -1){
      const sz = compact ? 5 : 7;
      const muteY = compact ? TOP-18 : TOP-26;
      svg.appendChild(el('line',{x1:x-sz,y1:muteY+sz,x2:x+sz,y2:muteY-sz,stroke:'#555','stroke-width':'1.5'}));
      svg.appendChild(el('line',{x1:x-sz,y1:muteY-sz,x2:x+sz,y2:muteY+sz,stroke:'#555','stroke-width':'1.5'}));
    } else if(fret === 0){
      svg.appendChild(el('circle',{cx:x,cy:compact?TOP-17:TOP-25,r:compact?6:8,fill:'none',stroke:'#aaa','stroke-width':'1.5'}));
    } else {
      const coveredByBarre = chord.barre &&
        fret === chord.barre.fret &&
        s >= chord.barre.fromString &&
        s <= chord.barre.toString;
      if(!coveredByBarre){
        const y = TOP + (fret - chord.startFret) * fretGap + fretGap * 0.5;
        svg.appendChild(el('circle',{cx:x,cy:y,r:DOT_R,fill:chord.fill,stroke:chord.stroke,'stroke-width':'1.5'}));
        const finger = chord.fingers ? chord.fingers[s] : 0;
        if(finger > 0){
          svg.appendChild(el('text',{x,y,'text-anchor':'middle','dominant-baseline':'central',
            'font-size':compact?'10':'13','font-weight':'600',fill:'#fff','font-family':'Inter,sans-serif'}, String(finger)));
        }
      }
    }
  });

  return svg;
}

function cikMakeChordCell(chord, resolveLabel){
  const wrap = document.createElement('div');
  wrap.className = 'chord-wrap';
  wrap.style.cssText = `background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius-lg);padding:0.5rem 0.25rem 0.6rem;display:flex;flex-direction:column;align-items:center;gap:3px;`;
  const diagWrap = document.createElement('div');
  diagWrap.style.cssText = 'width:100%;display:flex;justify-content:center;';
  const svgEl = cikBuildDiagram(chord);
  svgEl.style.maxWidth = '180px';
  diagWrap.appendChild(svgEl);
  wrap.appendChild(diagWrap);
  if(resolveLabel){
    const lbl = document.createElement('div');
    lbl.style.cssText = `font-size:11px;color:var(--text-muted);text-align:center;line-height:1.3;padding:0 4px;margin-top:2px;`;
    lbl.textContent = resolveLabel;
    wrap.appendChild(lbl);
  }
  return wrap;
}

function cikBuild(){
  const grid = document.getElementById('cik-grid');
  if(!grid) return;

  // Update key label
  const rootName = CIK_ROOT_NOTES.find(n=>n.pc===cikKeyRoot)?.label ?? 'C';
  const modeName = cikKeyMode === 'major' ? 'Major' : 'Minor';
  const lbl = document.getElementById('cik-key-label');
  if(lbl) lbl.innerHTML = `Showing: <strong style="color:var(--accent);">${rootName} ${modeName}</strong>`;

  // Update mode buttons
  document.getElementById('cik-mode-major')?.classList.toggle('active', cikKeyMode==='major');
  document.getElementById('cik-mode-minor')?.classList.toggle('active', cikKeyMode==='minor');

  // Build chords — all 7 in a single row
  const chords = cikGetChords();
  grid.innerHTML = '';
  chords.forEach(chord => grid.appendChild(cikMakeChordCell(chord)));

  cikBuildSecDom();
  cikBuildTritone();
}

// ── SECONDARY DOMINANTS ────────────────────────────────────────────────────

// Roman numeral labels for major and minor keys (target chord numerals)
const SECDOM_NUMERALS_MAJ = ['I','ii','iii','IV','V','vi','vii°'];
const SECDOM_NUMERALS_MIN = ['i','ii°','III','iv','v','VI','VII'];

// Returns array of 7 secondary dominant chord descriptors
function cikGetSecDomChords(){
  const scale   = cikKeyMode === 'major' ? MAJ_SCALE : MIN_SCALE;
  const numerals = cikKeyMode === 'major' ? SECDOM_NUMERALS_MAJ : SECDOM_NUMERALS_MIN;
  const useSharp = cikKeyMode === 'major'
    ? CIK_SHARP_ROOTS_MAJ.has(cikKeyRoot)
    : CIK_SHARP_ROOTS_MIN.has(cikKeyRoot);
  const nameMap = useSharp ? CIK_NAMES_SHARP : CIK_NAMES_FLAT;

  return scale.map((interval, i) => {
    const targetPc   = (cikKeyRoot + interval) % 12;
    const targetName = nameMap[targetPc] ?? CIK_NOTE_NAMES[targetPc];
    const targetNum  = numerals[i];
    const secDomPc   = (targetPc + 7) % 12;
    const secDomKey  = CIK_PC_TO_KEY[secDomPc];
    const secDomName = nameMap[secDomPc] ?? CIK_NAMES_SHARP[secDomPc];
    const relLabel   = `V/${targetNum}`;
    const chordName  = `${secDomName}7`;
    const libKey     = secDomKey + '_7';
    const voicing    = CIK_VOICING_LIB_7[libKey] ?? null;
    const col        = CIK_COLORS[i];
    return {
      name: chordName,
      numeral: relLabel,
      quality: 'dom7',
      fill: col.fill, stroke: col.stroke, text: col.text,
      targetName, targetNum, secDomPc,
      ...(voicing || { startFret:1, frets:[-1,-1,-1,-1,-1,-1], fingers:[-1,-1,-1,-1,-1,-1] }),
    };
  });
}

function cikBuildSecDom(){
  const grid = document.getElementById('cik-secdom-grid');
  if(!grid) return;
  grid.innerHTML = '';
  cikGetSecDomChords().forEach(chord => {
    const resolveLabel = `→ ${chord.targetName} (${chord.targetNum})`;
    grid.appendChild(cikMakeChordCell(chord, resolveLabel));
  });
}

// ── TRITONE SUBSTITUTIONS ──────────────────────────────────────────────────
// Each secondary dominant (dom7) can be replaced by a dom7 chord a tritone (6 semitones) away.
// The tritone sub shares the same guide tones (3rd & 7th) — just swapped.

function cikBuildTritone(){
  const grid = document.getElementById('cik-tritone-grid');
  if(!grid) return;
  grid.innerHTML = '';

  const useSharp = cikKeyMode === 'major'
    ? CIK_SHARP_ROOTS_MAJ.has(cikKeyRoot)
    : CIK_SHARP_ROOTS_MIN.has(cikKeyRoot);
  const nameMap = useSharp ? CIK_NAMES_SHARP : CIK_NAMES_FLAT;

  // For each secondary dominant, compute the tritone sub
  cikGetSecDomChords().forEach((secDom, i) => {
    // Tritone away = +6 semitones from the secondary dominant root
    const tritonePc  = (secDom.secDomPc + 6) % 12;
    const tritoneKey = CIK_PC_TO_KEY[tritonePc];
    // Display name: tritone subs typically sit on the flat side
    const tritoneName = CIK_NAMES_FLAT[tritonePc] ?? CIK_NAMES_SHARP[tritonePc];
    const chordName  = `${tritoneName}7`;

    // Relationship label e.g. ♭II7/I
    const relLabel = `♭II7/${secDom.targetNum}`;

    // Look up voicing from dom7 library
    const libKey  = tritoneKey + '_7';
    const voicing = CIK_VOICING_LIB_7[libKey] ?? null;

    const col = CIK_COLORS[i];
    const chord = {
      name: chordName,
      numeral: relLabel,
      quality: 'dom7',
      fill: col.fill, stroke: col.stroke, text: col.text,
      ...(voicing || { startFret:1, frets:[-1,-1,-1,-1,-1,-1], fingers:[-1,-1,-1,-1,-1,-1] }),
    };

    // Resolve label: tritone sub resolves to the same target as its secondary dominant
    const resolveLabel = `→ ${secDom.targetName} (${secDom.targetNum})`;
    grid.appendChild(cikMakeChordCell(chord, resolveLabel));
  });
}

export { cikSetMode, cikToggleSevenths, cikBuildRootBtns, cikBuild };
export { CIK_VOICING_LIB, CIK_VOICING_LIB_7, CIK_C_MAJ_OPEN, CIK_C_MAJ_OPEN_7 };
export { CIK_PC_TO_KEY, CIK_NAMES_SHARP, CIK_NAMES_FLAT, CIK_SHARP_ROOTS_MAJ };
