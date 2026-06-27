import { MODES, MAJ_SCALE, MIN_SCALE } from './data.js';
import { CIK_VOICING_LIB, CIK_PC_TO_KEY, CIK_NAMES_SHARP, CIK_NAMES_FLAT, CIK_SHARP_ROOTS_MAJ } from './chords-in-key.js';

// ── FRETBOARD MAP ──────────────────────────────────────────────────────────

const FB_STRINGS = [
  { name:'E₂', midi:40 },
  { name:'A₂', midi:45 },
  { name:'D₃', midi:50 },
  { name:'G₃', midi:55 },
  { name:'B₃', midi:59 },
  { name:'E₄', midi:64 },
];
const FB_N = 6, FB_FRETS = 15;

// ── Key transposition system ───────────────────────────────────────────────
let fbKeyRoot = 0;        // pitch class 0-11 (root of the major key)
let fbRelMode = 'major';  // 'major' | 'minor'
let fbSelected = null;
let fbNumMode = 'mode';   // 'mode' | 'C' | 'A' (C=major, A=minor of current key)
let fbView = 'modes';
let fbBlues = false;
let fbPentaShape = null;
let fbShowSevenths = false;
let fbShowNoteNames = false;
let fbDimType = 'half-whole';
let fbHarmonicShape = null;
let fbHungarianShape = null;
let fbActiveChords = new Set();

const FB_NAMES_SHARP = {0:'C',1:'C♯',2:'D',3:'D♯',4:'E',5:'F',6:'F♯',7:'G',8:'G♯',9:'A',10:'A♯',11:'B'};
const FB_NAMES_FLAT  = {0:'C',1:'D♭',2:'D',3:'E♭',4:'E',5:'F',6:'G♭',7:'G',8:'A♭',9:'A',10:'B♭',11:'B'};
const FB_SHARP_ROOTS = new Set([0,7,2,9,4,11,6,1]);

function fbGetNameMap(rootPc) {
  if (rootPc === undefined) rootPc = fbKeyRoot;
  return FB_SHARP_ROOTS.has(rootPc) ? FB_NAMES_SHARP : FB_NAMES_FLAT;
}

function fbMajRoot() { return fbKeyRoot; }
function fbMinRoot() { return (fbKeyRoot + 9) % 12; }
function fbCurrentRoot() { return fbRelMode === 'major' ? fbMajRoot() : fbMinRoot(); }

function fbMajRootName() { return fbGetNameMap()[fbMajRoot()]; }
function fbMinRootName() { return fbGetNameMap()[fbMinRoot()]; }

// pc → display label
function fbPcName(pc) { return fbGetNameMap()[pc]; }

// Transposed pitch class
function fbTr(basePc) { return (basePc + fbKeyRoot) % 12; }

// Transpose a set of fret positions by offset semitones, keeping 0-15 range
function fbTransposeFrets(frets, offset) {
  const result = [];
  for (const f of frets) {
    const nf = f + offset;
    if (nf >= 0 && nf <= FB_FRETS) result.push(nf);
    if (nf - 12 >= 0 && nf - 12 <= FB_FRETS) result.push(nf - 12);
    if (nf + 12 >= 0 && nf + 12 <= FB_FRETS) result.push(nf + 12);
  }
  return [...new Set(result)];
}

// Transpose a pattern object {stringIdx: [frets]} by offset
function fbTransposePattern(pattern, offset) {
  const result = {};
  for (const [si, frets] of Object.entries(pattern)) {
    result[si] = fbTransposeFrets(frets, offset);
  }
  return result;
}

// Build degree map: rootPc + scale intervals → {pc: label}
function fbBuildDegMap(rootPc, scaleType) {
  const scale = scaleType === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
  const labels = scaleType === 'major'
    ? ['1','2','3','4','5','6','7']
    : ['1','2','♭3','4','5','♭6','♭7'];
  const map = {};
  scale.forEach((s, i) => { map[(rootPc + s) % 12] = labels[i]; });
  return map;
}

// Build scale PC set
function fbBuildScalePcs(rootPc, scaleType) {
  const scale = scaleType === 'major' ? [0,2,4,5,7,9,11] : [0,2,3,5,7,8,10];
  return new Set(scale.map(s => (rootPc + s) % 12));
}

// ── Mode definitions (base offsets from key root) ──────────────────────────

const FB_MODE_OFFSETS = [0, 2, 4, 5, 7, 9, 11]; // semitones from key root for each mode

const FB_MODE_DEG_LABELS = {
  'Ionian':     ['1','2','3','4','5','6','7'],
  'Dorian':     ['1','2','♭3','4','5','6','♭7'],
  'Phrygian':   ['1','♭2','♭3','4','5','♭6','♭7'],
  'Lydian':     ['1','2','3','♯4','5','6','7'],
  'Mixolydian': ['1','2','3','4','5','6','♭7'],
  'Aeolian':    ['1','2','♭3','4','5','♭6','♭7'],
  'Locrian':    ['1','♭2','♭3','4','♭5','♭6','♭7'],
};
const FB_MODE_SEMIS = {
  'Ionian':     [0,2,4,5,7,9,11],
  'Dorian':     [0,2,3,5,7,9,10],
  'Phrygian':   [0,1,3,5,7,8,10],
  'Lydian':     [0,2,4,6,7,9,11],
  'Mixolydian': [0,2,4,5,7,9,10],
  'Aeolian':    [0,2,3,5,7,8,10],
  'Locrian':    [0,1,3,5,6,8,10],
};
// Base root PC offsets relative to key root (C=0 when key=C)
const FB_MODE_ROOT_OFFSET = {
  'Ionian':0, 'Dorian':2, 'Phrygian':4, 'Lydian':5,
  'Mixolydian':7, 'Aeolian':9, 'Locrian':11
};

function fbModeRootPc(modeName) {
  return (fbKeyRoot + FB_MODE_ROOT_OFFSET[modeName]) % 12;
}

const FB_MODES_BASE = [
  { name:'Ionian',     fill:'#C8822A', stroke:'#8F5510', text:'#fff',
    pattern:{ 0:[8,10], 1:[7,8,10], 2:[7,9,10], 3:[7,9,10], 4:[8,10], 5:[7,8] } },
  { name:'Dorian',     fill:'#1D9E75', stroke:'#0F6E56', text:'#fff',
    pattern:{ 0:[10,12], 1:[8,10,12], 2:[9,10,12], 3:[9,10,12], 4:[10,12,13], 5:[10,12,13] } },
  { name:'Phrygian',   fill:'#D85A30', stroke:'#993C1D', text:'#fff',
    pattern:{ 0:[12,13,15], 1:[12,14,15], 2:[12,14,15], 3:[12,14], 4:[12,13,15], 5:[12,13,15] } },
  { name:'Lydian',     fill:'#7F77DD', stroke:'#534AB7', text:'#fff',
    pattern:{ 0:[1,3,5], 1:[2,3,5], 2:[2,3,5], 3:[2,4,5], 4:[1,3,5], 5:[1,3,5] } },
  { name:'Mixolydian', fill:'#D4537E', stroke:'#993556', text:'#fff',
    pattern:{ 0:[3,5], 1:[2,3,5], 2:[2,3,5], 3:[2,4,5], 4:[3,5,6], 5:[3,5] } },
  { name:'Aeolian',    fill:'#2A7E9E', stroke:'#185870', text:'#fff',
    pattern:{ 0:[5,7,8], 1:[5,7,8], 2:[5,7], 3:[4,5,7], 4:[5,6,8], 5:[5,7,8] } },
  { name:'Locrian',    fill:'#A03080', stroke:'#701858', text:'#fff',
    pattern:{ 0:[7,8,10], 1:[7,8,10], 2:[7,9,10], 3:[7,9,10], 4:[8,10], 5:[7] } },
];

// Returns mode data with transposed pattern for current key
function fbGetMode(idx) {
  const base = FB_MODES_BASE[idx];
  return {
    ...base,
    root: fbPcName(fbModeRootPc(base.name)),
    pattern: fbTransposePattern(base.pattern, fbKeyRoot),
  };
}

const FB_LEFT=62, FB_TOP=30, FB_FW=48, FB_SH=48, FB_NUT=6, FB_R=14;
const FB_SVG_W = FB_LEFT + FB_NUT + FB_FRETS*FB_FW + 30;
const FB_SVG_H = FB_TOP + (FB_N-1)*FB_SH + 56;

// Pentatonic shapes (defined for key of C, transposed at render time)
const FB_PENTA_SHAPES = [
  { name: 'Shape One',   fill: '#C46EB0', stroke: '#8A3A7A', text: '#fff',
    dotsC: { 0:[8,10], 1:[7,10], 2:[7,10], 3:[7,9], 4:[8,10], 5:[8,10] },
    dotsA: { 0:[5,8], 1:[5,7], 2:[5,7], 3:[5,7], 4:[5,8], 5:[5,8] } },
  { name: 'Shape Two',   fill: '#4A9E6B', stroke: '#2A6A42', text: '#fff',
    dotsC: { 0:[10,12], 1:[10,12], 2:[10,12], 3:[9,12], 4:[10,13], 5:[10,12] },
    dotsA: { 0:[8,10], 1:[7,10], 2:[7,10], 3:[7,9], 4:[8,10], 5:[8,10] } },
  { name: 'Shape Three', fill: '#D4700A', stroke: '#963F00', text: '#fff',
    dotsC: { 0:[12,15], 1:[12,15], 2:[12,14], 3:[12,14], 4:[13,15], 5:[12,15] },
    dotsA: { 0:[10,12], 1:[10,12], 2:[10,12], 3:[9,12], 4:[10,13], 5:[10,12] } },
  { name: 'Shape Four',  fill: '#5577CC', stroke: '#2E4A99', text: '#fff',
    dotsC: { 0:[3,5], 1:[3,5], 2:[2,5], 3:[2,5], 4:[3,5], 5:[3,5] },
    dotsA: { 0:[0,3,12,15], 1:[0,3,12,15], 2:[0,2,12,14], 3:[0,2,12,14], 4:[1,3,13,15], 5:[0,3,12,15] } },
  { name: 'Shape Five',  fill: '#C4502A', stroke: '#8A2A0A', text: '#fff',
    dotsC: { 0:[5,8], 1:[5,7], 2:[5,7], 3:[5,7], 4:[5,8], 5:[5,8] },
    dotsA: { 0:[3,5], 1:[3,5], 2:[2,5], 3:[2,5], 4:[3,5], 5:[3,5] } },
];

// Pentatonic scale base PCs (relative to key root)
const FB_PENTA_MAJ_INTERVALS = [0, 2, 4, 7, 9];
const FB_PENTA_MIN_INTERVALS = [0, 3, 5, 7, 10];
const FB_PENTA_MAJ_LABELS = { 0:'1', 2:'2', 4:'3', 7:'5', 9:'6' };
const FB_PENTA_MIN_LABELS = { 0:'1', 3:'♭3', 5:'4', 7:'5', 10:'♭7' };

function fbGetPentaPcs() {
  const intervals = fbRelMode === 'major' ? FB_PENTA_MAJ_INTERVALS : FB_PENTA_MIN_INTERVALS;
  const root = fbCurrentRoot();
  return new Set(intervals.map(i => (root + i) % 12));
}

function fbGetPentaLabels() {
  const baseLbls = fbRelMode === 'major' ? FB_PENTA_MAJ_LABELS : FB_PENTA_MIN_LABELS;
  const root = fbCurrentRoot();
  const map = {};
  for (const [offset, label] of Object.entries(baseLbls)) {
    map[(root + parseInt(offset)) % 12] = label;
  }
  return map;
}

function fbGetPentaRoot() { return fbCurrentRoot(); }

// Diminished scale definitions (relative intervals from root)
const FB_DIM_SCALES = {
  'half-whole': {
    name: 'Half-Whole',
    intervals: [0, 1, 3, 4, 6, 7, 9, 10],
    labels: { 0:'1', 1:'♭2', 3:'♭3', 4:'3', 6:'♯4', 7:'5', 9:'6', 10:'♭7' },
  },
  'whole-half': {
    name: 'Whole-Half',
    intervals: [0, 2, 3, 5, 6, 8, 9, 11],
    labels: { 0:'1', 2:'2', 3:'♭3', 5:'4', 6:'♭5', 8:'♭6', 9:'6', 11:'7' },
  },
};

function fbGetDimScale() {
  const base = FB_DIM_SCALES[fbDimType || 'half-whole'];
  const root = fbMajRoot();
  const pcs = new Set(base.intervals.map(i => (root + i) % 12));
  const labels = {};
  for (const [offset, label] of Object.entries(base.labels)) {
    labels[(root + parseInt(offset)) % 12] = label;
  }
  const nameMap = fbGetNameMap();
  const notes = base.intervals.map(i => nameMap[(root + i) % 12]).join(' · ');
  return { name: base.name, pcs, labels, rootPc: root, notes };
}

// Harmonic minor (relative intervals from minor root)
const FB_HARM_INTERVALS = [0, 2, 3, 5, 7, 8, 11];
const FB_HARM_BASE_LABELS = { 0:'1', 2:'2', 3:'♭3', 5:'4', 7:'5', 8:'♭6', 11:'7' };
const FB_HARM_SHAPES_BASE = [
  { name: 'Pos 1 (1)',  fill: '#C8822A', stroke: '#8F5510', text: '#fff',
    dots: { 0:[5,7,8], 1:[5,7,8], 2:[6,7,9], 3:[5,7,9], 4:[6,9,10], 5:[7,8,10] } },
  { name: 'Pos 2 (2)',  fill: '#1D9E75', stroke: '#0F6E56', text: '#fff',
    dots: { 0:[7,8,10], 1:[7,8,11], 2:[7,9,10], 3:[7,9,10], 4:[9,10,12], 5:[8,10,12] } },
  { name: 'Pos 3 (♭3)', fill: '#D85A30', stroke: '#993C1D', text: '#fff',
    dots: { 0:[8,10,12], 1:[8,11,12], 2:[9,10,12], 3:[9,10,13], 4:[10,12,13], 5:[10,12,13] } },
  { name: 'Pos 4 (4)',  fill: '#7F77DD', stroke: '#534AB7', text: '#fff',
    dots: { 0:[10,12,13], 1:[11,12,14], 2:[10,12,14], 3:[10,13,14], 4:[12,13,15], 5:[12,13] } },
  { name: 'Pos 5 (5)',  fill: '#D4537E', stroke: '#993556', text: '#fff',
    dots: { 0:[0,1,4], 1:[0,2,3], 2:[0,2,3], 3:[1,2,4], 4:[1,3,5], 5:[1,4,5] } },
  { name: 'Pos 6 (♭6)', fill: '#2A7E9E', stroke: '#185870', text: '#fff',
    dots: { 0:[1,4,5], 1:[2,3,5], 2:[2,3,6], 3:[2,4,5], 4:[3,5,6], 5:[4,5,7] } },
  { name: 'Pos 7 (7)',  fill: '#A03080', stroke: '#701858', text: '#fff',
    dots: { 0:[4,5,7], 1:[3,5,7], 2:[3,6,7], 3:[4,5,7], 4:[5,6,9], 5:[5,7,8] } },
];

function fbGetHarmData() {
  const root = fbMinRoot();
  const offset = (root - 9 + 12) % 12; // offset from A
  const pcs = new Set(FB_HARM_INTERVALS.map(i => (root + i) % 12));
  const labels = {};
  for (const [off, lbl] of Object.entries(FB_HARM_BASE_LABELS)) {
    labels[(root + parseInt(off)) % 12] = lbl;
  }
  const shapes = FB_HARM_SHAPES_BASE.map(s => ({
    ...s,
    dots: fbTransposePattern(s.dots, offset),
  }));
  return { pcs, labels, rootPc: root, shapes };
}

// Hungarian minor (relative intervals from minor root)
const FB_HUNG_INTERVALS = [0, 2, 3, 6, 7, 8, 11];
const FB_HUNG_BASE_LABELS = { 0:'1', 2:'2', 3:'♭3', 6:'♯4', 7:'5', 8:'♭6', 11:'7' };
const FB_HUNG_SHAPES_BASE = [
  { name: 'Position 1', fill: '#C8822A', stroke: '#8F5510', text: '#fff',
    dots: { 0:[5,7,8], 1:[6,7,8], 2:[6,7,9], 3:[5,8,9], 4:[6,9,10], 5:[7,8,11] } },
  { name: 'Position 2', fill: '#1D9E75', stroke: '#0F6E56', text: '#fff',
    dots: { 0:[7,8,11], 1:[7,8,11], 2:[7,9,10], 3:[8,9,10], 4:[9,10,12], 5:[8,11,12] } },
  { name: 'Position 3', fill: '#D85A30', stroke: '#993C1D', text: '#fff',
    dots: { 0:[8,11,12], 1:[8,11,12], 2:[9,10,13], 3:[9,10,13], 4:[10,12,13], 5:[11,12,13] } },
  { name: 'Position 4', fill: '#7F77DD', stroke: '#534AB7', text: '#fff',
    dots: { 0:[11,12,13], 1:[11,12,14], 2:[10,13,14], 3:[10,13,14], 4:[12,13], 5:[11,12,13] } },
  { name: 'Position 5', fill: '#D4537E', stroke: '#993556', text: '#fff',
    dots: { 0:[0,1,4], 1:[0,2,3], 2:[1,2,3], 3:[1,2,4], 4:[1,4,5], 5:[1,4,5] } },
  { name: 'Position 6', fill: '#2A7E9E', stroke: '#185870', text: '#fff',
    dots: { 0:[1,4,5], 1:[2,3,6], 2:[2,3,6], 3:[2,4,5], 4:[4,5,6], 5:[4,5,7] } },
  { name: 'Position 7', fill: '#A03080', stroke: '#701858', text: '#fff',
    dots: { 0:[4,5,7], 1:[3,6,7], 2:[3,6,7], 3:[4,5,8], 4:[5,6,9], 5:[5,7,8] } },
];

function fbGetHungData() {
  const root = fbMinRoot();
  const offset = (root - 9 + 12) % 12;
  const pcs = new Set(FB_HUNG_INTERVALS.map(i => (root + i) % 12));
  const labels = {};
  for (const [off, lbl] of Object.entries(FB_HUNG_BASE_LABELS)) {
    labels[(root + parseInt(off)) % 12] = lbl;
  }
  const shapes = FB_HUNG_SHAPES_BASE.map(s => ({
    ...s,
    dots: fbTransposePattern(s.dots, offset),
  }));
  return { pcs, labels, rootPc: root, shapes };
}

// ── Diatonic chords (computed dynamically for any key) ─────────────────────

const FB_CHORD_COLORS = [
  {fill:'#C8822A', stroke:'#8F5510', text:'#fff'},
  {fill:'#1D9E75', stroke:'#0F6E56', text:'#fff'},
  {fill:'#D85A30', stroke:'#993C1D', text:'#fff'},
  {fill:'#7F77DD', stroke:'#534AB7', text:'#fff'},
  {fill:'#D4537E', stroke:'#993556', text:'#fff'},
  {fill:'#2A7E9E', stroke:'#185870', text:'#fff'},
  {fill:'#A03080', stroke:'#701858', text:'#fff'},
];

const FB_INTERVAL_NAMES = { 0:'1', 1:'♭2', 2:'2', 3:'♭3', 4:'3', 5:'4', 6:'♭5', 7:'5', 8:'♯5', 9:'6', 10:'♭7', 11:'7' };
const FB_ROMAN = ['I','II','III','IV','V','VI','VII'];

function fbTriadQuality(thirdSemi, fifthSemi) {
  if (thirdSemi===4 && fifthSemi===7) return { name:'Major', sym:'', upper:true };
  if (thirdSemi===3 && fifthSemi===7) return { name:'Minor', sym:'m', upper:false };
  if (thirdSemi===3 && fifthSemi===6) return { name:'Dim', sym:'°', upper:false };
  if (thirdSemi===4 && fifthSemi===8) return { name:'Aug', sym:'+', upper:true };
  if (thirdSemi===4 && fifthSemi===6) return { name:'Maj♭5', sym:'(♭5)', upper:true };
  if (thirdSemi===2 && fifthSemi===6) return { name:'Dim', sym:'°', upper:false };
  if (thirdSemi===5 && fifthSemi===10) return { name:'sus4', sym:'sus4', upper:true };
  if (thirdSemi===5 && fifthSemi===9) return { name:'sus4', sym:'sus4', upper:true };
  if (thirdSemi===2 && fifthSemi===7) return { name:'sus2', sym:'sus2', upper:true };
  if (thirdSemi===3 && fifthSemi===9) return { name:'m6', sym:'m(♭6)', upper:false };
  if (thirdSemi===4 && fifthSemi===9) return { name:'6', sym:'(6)', upper:true };
  if (thirdSemi===3 && fifthSemi===8) return { name:'m♯5', sym:'m(♯5)', upper:false };
  if (thirdSemi===5 && fifthSemi===7) return { name:'sus4', sym:'sus4', upper:true };
  // Generic fallback with semitone description
  return { name:`(${thirdSemi},${fifthSemi})`, sym:`(${thirdSemi},${fifthSemi})`, upper:false };
}

function fbComputeDiatonicChords(pcs, noteNames, degreeLabels) {
  const chords = [];
  for (let i = 0; i < pcs.length; i++) {
    const rootPc = pcs[i];
    const thirdPc = pcs[(i + 2) % pcs.length];
    const fifthPc = pcs[(i + 4) % pcs.length];
    const thirdSemi = ((thirdPc - rootPc) + 12) % 12;
    const fifthSemi = ((fifthPc - rootPc) + 12) % 12;
    const q = fbTriadQuality(thirdSemi, fifthSemi);
    let roman;
    if (i < FB_ROMAN.length) {
      roman = q.upper ? FB_ROMAN[i] : FB_ROMAN[i].toLowerCase();
    } else {
      roman = q.upper ? String(i + 1) : String(i + 1);
    }
    // Suffix: ° for dim, + for aug, nothing else (lowercase numeral = minor)
    const suffix = q.name === 'Dim' ? '°' : q.name === 'Aug' ? '+' : '';
    const romanDisplay = roman + suffix;
    // Compute 7th (next third stacked)
    let pc7 = null, int7 = null, quality7 = '';
    if (pcs.length >= 7) {
      pc7 = pcs[(i + 6) % pcs.length];
      const seventhSemi = ((pc7 - rootPc) + 12) % 12;
      int7 = FB_INTERVAL_NAMES[seventhSemi];
      if (q.name === 'Major' && seventhSemi === 11) quality7 = 'maj7';
      else if (q.name === 'Major' && seventhSemi === 10) quality7 = '7';
      else if (q.name === 'Minor' && seventhSemi === 10) quality7 = 'm7';
      else if (q.name === 'Dim' && seventhSemi === 10) quality7 = 'm7♭5';
      else if (q.name === 'Dim' && seventhSemi === 9) quality7 = '°7';
      else quality7 = '';
    }
    chords.push({
      id: romanDisplay,
      degree: i + 1,
      degreeLabel: degreeLabels ? degreeLabels[i] : String(i + 1),
      rootPc, thirdPc, fifthPc, pc7, int7,
      rootName: noteNames[i],
      thirdName: noteNames[(i + 2) % noteNames.length],
      fifthName: noteNames[(i + 4) % noteNames.length],
      quality: q.name,
      roman: romanDisplay,
      chordName: noteNames[i] + suffix,
      intervals: ['1', FB_INTERVAL_NAMES[thirdSemi], FB_INTERVAL_NAMES[fifthSemi]],
      quality7,
      ...FB_CHORD_COLORS[i % 7],
    });
  }
  return chords;
}

function fbGetDiatonicChords() {
  const nameMap = fbGetNameMap();
  const majPcs = MAJ_SCALE.map(s => (fbKeyRoot + s) % 12);
  const majNames = majPcs.map(pc => nameMap[pc]);
  const majDegs = ['1','2','3','4','5','6','7'];
  return fbComputeDiatonicChords(majPcs, majNames, majDegs);
}

// ── SVG helpers ────────────────────────────────────────────────────────────

function fbPc(m) { return ((m % 12) + 12) % 12; }
function fbStrY(s) { return FB_TOP + (FB_N - 1 - s) * FB_SH; }
function fbEl(tag, attrs) {
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

// Note label: show note name or interval depending on toggle
function fbNoteLabel(p, intervalLabel) {
  if (!fbShowNoteNames) return { text: intervalLabel, small: intervalLabel.length > 1 };
  const name = fbPcName(p);
  return { text: name, small: name.length > 2 };
}

// ── Blues scale ─────────────────────────────────────────────────────────────

function fbBluesPc() {
  // Blues note is ♭5 of minor / ♭3 of major pentatonic
  // In any key, it's root + 6 semitones (for minor penta) or majRoot + 3
  if (fbView === 'pentatonic') {
    return (fbCurrentRoot() + (fbRelMode === 'major' ? 3 : 6)) % 12;
  }
  // For modes view: relative to the major key root, the blues note is at +3
  return (fbMajRoot() + 3) % 12;
}

function fbBluesDegLabel() {
  if (fbView === 'pentatonic') {
    return fbRelMode === 'major' ? '♭3' : '♭5';
  }
  if (fbSelected && fbNumMode === 'mode') {
    const rootPc = fbModeRootPc(fbSelected.name);
    const blPc = fbBluesPc();
    const rel = ((blPc - rootPc) % 12 + 12) % 12;
    const semis = FB_MODE_SEMIS[fbSelected.name];
    const labels = FB_MODE_DEG_LABELS[fbSelected.name];
    const idx = semis.indexOf(rel);
    if (idx !== -1) return labels[idx];
    const bluesSemiLabels = {0:'1',1:'♭2',2:'2',3:'♭3',4:'3',5:'4',6:'♯4/♭5',7:'5',8:'♭6',9:'6',10:'♭7',11:'7'};
    return bluesSemiLabels[rel] ?? '♭3';
  }
  if (fbRelMode === 'minor') return '♭5';
  return '♭3';
}

function fbToggleBlues() {
  fbBlues = !fbBlues;
  const tog = document.getElementById('fb-blues-toggle');
  const thumb = document.getElementById('fb-blues-thumb');
  const lbl = document.getElementById('fb-blues-label');
  const txt = document.getElementById('fb-blues-text');
  if (fbBlues) {
    tog.style.background = '#0d1a2e';
    tog.style.borderColor = '#2255aa';
    thumb.style.left = '18px';
    thumb.style.background = '#4d8fdc';
    const blPcName = fbPcName(fbBluesPc());
    const deg = fbBluesDegLabel();
    lbl.textContent = `(${blPcName} = ${deg})`;
    lbl.style.color = '#4d8fdc';
    if (txt) txt.style.color = '#4d8fdc';
  } else {
    tog.style.background = '#222';
    tog.style.borderColor = '#3a3a3a';
    thumb.style.left = '2px';
    thumb.style.background = '#888';
    lbl.textContent = '';
    if (txt) txt.style.color = 'var(--text-muted)';
  }
  fbRender();
}

function fbUpdateBluesLabel() {
  if (!fbBlues) return;
  const lbl = document.getElementById('fb-blues-label');
  const blPcName = fbPcName(fbBluesPc());
  const deg = fbBluesDegLabel();
  lbl.textContent = `(${blPcName} = ${deg})`;
}

function fbToggleNoteNames() {
  fbShowNoteNames = !fbShowNoteNames;
  const tog = document.getElementById('fb-notenames-toggle');
  const thumb = document.getElementById('fb-notenames-thumb');
  const txt = document.getElementById('fb-notenames-text');
  if (fbShowNoteNames) {
    tog.style.background = '#0d1f10';
    tog.style.borderColor = '#2a6a40';
    thumb.style.left = '18px';
    thumb.style.background = '#4db36d';
    if (txt) txt.style.color = '#7fd49f';
  } else {
    tog.style.background = '#222';
    tog.style.borderColor = '#3a3a3a';
    thumb.style.left = '2px';
    thumb.style.background = '#888';
    if (txt) txt.style.color = 'var(--text-muted)';
  }
  fbRender();
}

function fbToggleSevenths() {
  fbShowSevenths = !fbShowSevenths;
  const tog = document.getElementById('fb-7th-toggle');
  const thumb = document.getElementById('fb-7th-thumb');
  const txt = document.getElementById('fb-7th-text');
  if (fbShowSevenths) {
    tog.style.background = '#1a1025';
    tog.style.borderColor = '#7a5ab0';
    thumb.style.left = '18px';
    thumb.style.background = '#a07ad4';
    if (txt) txt.style.color = '#b8a0e0';
  } else {
    tog.style.background = '#222';
    tog.style.borderColor = '#3a3a3a';
    thumb.style.left = '2px';
    thumb.style.background = '#888';
    if (txt) txt.style.color = 'var(--text-muted)';
  }
  fbRender();
}

// ── Generic scale view renderer ────────────────────────────────────────────

function fbRenderScaleView(pcsSet, labels, rootPc, selectedShape) {
  const svg = document.getElementById('fb-svg');
  FB_STRINGS.forEach((s, i) => {
    for (let f = 0; f <= FB_FRETS; f++) {
      const p = fbPc(s.midi + f);
      if (!pcsSet.has(p)) continue;
      const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
      const cy = fbStrY(i);
      const isRoot = p === rootPc;
      const label = labels[p] || '';
      const sw = isRoot ? 2.5 : 1.5;
      svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#111111', stroke:'#cccccc', 'stroke-width':sw}));
      if (isRoot) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
          stroke:'#888', 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.3}));
      }
      if (label) {
        const nl = fbNoteLabel(p, label);
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#e0e0e0', 'font-size': nl.small ? '7' : '11',
          'font-weight': isRoot ? '700' : '500', 'font-family':'Inter,sans-serif'});
        lt.textContent = nl.text;
        svg.appendChild(lt);
      }
    }
  });
  if (selectedShape) {
    Object.entries(selectedShape.dots).forEach(([siStr, frets]) => {
      const si = parseInt(siStr);
      const s = FB_STRINGS[si];
      frets.forEach(f => {
        if (f < 0 || f > FB_FRETS) return;
        const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
        const cy = fbStrY(si);
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:selectedShape.fill, stroke:selectedShape.stroke, 'stroke-width':'2'}));
        const p = fbPc(s.midi + f);
        const isRoot = p === rootPc;
        if (isRoot) {
          svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
            stroke:selectedShape.stroke, 'stroke-width':'1.5', 'stroke-dasharray':'3 2', opacity:.6}));
        }
        const label = labels[p] || '';
        if (label) {
          const nl = fbNoteLabel(p, label);
          const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:selectedShape.text, 'font-size': nl.small ? '7' : '11',
            'font-weight': isRoot ? '700' : '600', 'font-family':'Inter,sans-serif'});
          lt.textContent = nl.text;
          svg.appendChild(lt);
        }
      });
    });
  }
}

// ── Build highlight set from transposed pattern ────────────────────────────

function fbBuildHlSet(pattern) {
  const s = new Set();
  for (const [si, frets] of Object.entries(pattern))
    for (const f of frets) if (f >= 0 && f <= FB_FRETS) s.add(`${si}-${f}`);
  return s;
}

function fbGetModeRelDeg(p, mode) {
  const rootPc = fbModeRootPc(mode.name);
  const semis = FB_MODE_SEMIS[mode.name];
  const labels = FB_MODE_DEG_LABELS[mode.name];
  const rel = ((p - rootPc) % 12 + 12) % 12;
  const idx = semis.indexOf(rel);
  return idx !== -1 ? labels[idx] : null;
}

// ── Main render ────────────────────────────────────────────────────────────

function fbRender() {
  const svg = document.getElementById('fb-svg');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('viewBox', `0 0 ${FB_SVG_W} ${FB_SVG_H}`);
  svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
  svg.innerHTML = '';

  // Fretboard bg
  svg.appendChild(fbEl('rect', {x:FB_LEFT, y:FB_TOP-FB_SH*.45, width:FB_NUT+FB_FRETS*FB_FW, height:(FB_N-1)*FB_SH+FB_SH*.9, fill:'#1a1a1a', rx:8}));
  svg.appendChild(fbEl('rect', {x:FB_LEFT, y:FB_TOP-FB_SH*.45, width:FB_NUT, height:(FB_N-1)*FB_SH+FB_SH*.9, fill:'#aaa', rx:2, opacity:.45}));

  for (let f = 1; f <= FB_FRETS; f++) {
    const x = FB_LEFT + FB_NUT + f * FB_FW;
    svg.appendChild(fbEl('line', {x1:x, y1:FB_TOP-FB_SH*.42, x2:x, y2:FB_TOP+(FB_N-1)*FB_SH+FB_SH*.42,
      stroke:'#3a3a3a', 'stroke-width':f===12?2.5:1.2, opacity:f===12?.8:.5}));
  }

  for (let f = 1; f <= FB_FRETS; f++) {
    const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
    const t = fbEl('text', {x:cx, y:FB_TOP+(FB_N-1)*FB_SH+FB_SH*.76,
      'text-anchor':'middle', 'dominant-baseline':'central',
      fill:'#555', 'font-size':'11', 'font-family':'Inter,sans-serif'});
    t.textContent = f;
    svg.appendChild(t);
  }

  [3,5,7,9,12].forEach(f => {
    const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
    if (f === 12) {
      [1.5, 3.5].forEach(sy => svg.appendChild(fbEl('circle', {cx, cy:FB_TOP+sy*FB_SH, r:4, fill:'#333', opacity:.7})));
    } else {
      svg.appendChild(fbEl('circle', {cx, cy:FB_TOP+2.5*FB_SH, r:4, fill:'#333', opacity:.7}));
    }
  });

  FB_STRINGS.forEach((s, i) => {
    const y = fbStrY(i);
    svg.appendChild(fbEl('line', {x1:FB_LEFT+FB_NUT, y1:y, x2:FB_LEFT+FB_NUT+FB_FRETS*FB_FW, y2:y,
      stroke:'#777', 'stroke-width':2.2-i*.28, opacity:.6}));
    const lbl = fbEl('text', {x:FB_LEFT-6, y, 'text-anchor':'end', 'dominant-baseline':'central',
      fill:'#777', 'font-size':'11', 'font-family':'Inter,sans-serif'});
    lbl.textContent = s.name;
    svg.appendChild(lbl);
  });

  // Delegate to view-specific renderer
  if (fbView === 'chords') fbRenderChords(svg);
  else if (fbView === 'pentatonic') fbRenderPentatonic(svg);
  else if (fbView === 'diminished') fbRenderDiminished(svg);
  else if (fbView === 'harmonic') fbRenderHarmonic(svg);
  else if (fbView === 'hungarian') fbRenderHungarian(svg);
  else fbRenderModes(svg);
}

// ── Chord Tones view ───────────────────────────────────────────────────────

function fbRenderChords(svg) {
  const diatonicChords = fbGetDiatonicChords();
  const activePcMap = {};

  diatonicChords.forEach(ch => {
    if (!fbActiveChords.has(ch.id)) return;
    ch.pcs = [ch.rootPc, ch.thirdPc, ch.fifthPc];
    ch.pcs.forEach((p, idx) => {
      if (!activePcMap[p]) activePcMap[p] = [];
      if (!activePcMap[p].find(e => e.chordDef === ch && !e.isSeventh))
        activePcMap[p].push({ chordDef: ch, label: ch.intervals[idx], isSeventh: false });
    });
    if (fbShowSevenths && ch.pc7 !== null) {
      if (!activePcMap[ch.pc7]) activePcMap[ch.pc7] = [];
      if (!activePcMap[ch.pc7].find(e => e.chordDef === ch))
        activePcMap[ch.pc7].push({ chordDef: ch, label: ch.int7, isSeventh: true });
    }
  });

  if (Object.keys(activePcMap).length === 0) {
    const scalePcs = fbBuildScalePcs(fbMajRoot(), 'major');
    FB_STRINGS.forEach((s, i) => {
      for (let f = 0; f <= FB_FRETS; f++) {
        const p = fbPc(s.midi + f);
        if (!scalePcs.has(p)) continue;
        const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
        const cy = fbStrY(i);
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#111111', stroke:'#444', 'stroke-width':'1.2'}));
      }
    });
  } else {
    FB_STRINGS.forEach((s, i) => {
      for (let f = 0; f <= FB_FRETS; f++) {
        const p = fbPc(s.midi + f);
        const entries = activePcMap[p];
        if (!entries || entries.length === 0) continue;
        const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
        const cy = fbStrY(i);
        const triadEntries = entries.filter(e => !e.isSeventh);
        const seventhEntries = entries.filter(e => e.isSeventh);
        const isSeventh7Only = triadEntries.length === 0 && seventhEntries.length > 0;
        const hasAlso7th = triadEntries.length > 0 && seventhEntries.length > 0;

        if (isSeventh7Only) {
          const ch = seventhEntries[0].chordDef;
          const label = seventhEntries[0].label;
          const half = FB_R;
          const pts = `${cx},${cy-half} ${cx+half},${cy} ${cx},${cy+half} ${cx-half},${cy}`;
          svg.appendChild(fbEl('polygon', {points:pts, fill:ch.fill, stroke:ch.stroke, 'stroke-width':'1.8', opacity:'0.95'}));
          const nl7 = fbNoteLabel(p, label);
          const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:'#fff', 'font-size': nl7.small ? '7' : '9', 'font-weight':'600', 'font-family':'Inter,sans-serif'});
          lt.textContent = nl7.text;
          svg.appendChild(lt);
          continue;
        }

        if (triadEntries.length === 1) {
          const { chordDef: ch, label } = triadEntries[0];
          const isRoot = label === '1';
          const sw = isRoot ? 2.5 : 1.5;
          svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:ch.fill, stroke:ch.stroke, 'stroke-width':sw}));
          if (isRoot) {
            svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
              stroke:ch.stroke, 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.75}));
          }
          if (hasAlso7th) {
            svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+3.5, fill:'none',
              stroke:seventhEntries[0].chordDef.stroke, 'stroke-width':'1.5', opacity:.55}));
          }
          const nlT = fbNoteLabel(p, label);
          const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:ch.text, 'font-size': nlT.small ? '8' : '11',
            'font-weight': isRoot ? '700' : '500', 'font-family':'Inter,sans-serif'});
          lt.textContent = nlT.text;
          svg.appendChild(lt);
        } else {
          const n = triadEntries.length;
          const angleStep = (2 * Math.PI) / n;
          triadEntries.forEach(({ chordDef: ch }, idx) => {
            const startAngle = idx * angleStep - Math.PI / 2;
            const endAngle = startAngle + angleStep;
            const x1 = cx + FB_R * Math.cos(startAngle);
            const y1 = cy + FB_R * Math.sin(startAngle);
            const x2 = cx + FB_R * Math.cos(endAngle);
            const y2 = cy + FB_R * Math.sin(endAngle);
            const largeArc = angleStep > Math.PI ? 1 : 0;
            const pathD = `M${cx},${cy} L${x1},${y1} A${FB_R},${FB_R} 0 ${largeArc} 1 ${x2},${y2} Z`;
            svg.appendChild(fbEl('path', {d:pathD, fill:ch.fill, stroke:ch.stroke, 'stroke-width':'0.8'}));
          });
          svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'none', stroke:'#fff', 'stroke-width':'0.6', opacity:'0.25'}));
          const allLabels = [...new Set(triadEntries.map(e => e.label))];
          const displayLabel = allLabels.join('/');
          const nlW = fbNoteLabel(p, displayLabel);
          const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:'#fff', 'font-size': nlW.small ? '7' : '9', 'font-weight':'600', 'font-family':'Inter,sans-serif'});
          lt.textContent = nlW.text;
          svg.appendChild(lt);
        }
      }
    });
  }
}

// ── Pentatonic view ────────────────────────────────────────────────────────

function fbRenderPentatonic(svg) {
  const pentaPcs = fbGetPentaPcs();
  const pentaLabels = fbGetPentaLabels();
  const pentaRootPc = fbGetPentaRoot();
  const bluesPc = fbBluesPc();
  const bluesDeg = fbBluesDegLabel();

  FB_STRINGS.forEach((s, i) => {
    for (let f = 0; f <= FB_FRETS; f++) {
      const p = fbPc(s.midi + f);
      const isBlues = fbBlues && p === bluesPc;
      if (!pentaPcs.has(p) && !isBlues) continue;
      const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
      const cy = fbStrY(i);
      const isRoot = p === pentaRootPc;
      if (isBlues && !pentaPcs.has(p)) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#0d1525', stroke:'#4d8fdc', 'stroke-width':'1.5'}));
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#8bbff0', 'font-size':bluesDeg.length>1?'9':'11', 'font-weight':'500', 'font-family':'Inter,sans-serif'});
        lt.textContent = bluesDeg;
        svg.appendChild(lt);
        continue;
      }
      const sw = isRoot ? 2.5 : 1.5;
      svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#111111', stroke:'#cccccc', 'stroke-width':sw}));
      if (isRoot) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
          stroke:'#888', 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.3}));
      }
      const label = pentaLabels[p] ?? '';
      if (label) {
        const nlP = fbNoteLabel(p, label);
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#e0e0e0', 'font-size': nlP.small ? '7' : '11',
          'font-weight': isRoot ? '700' : '500', 'font-family':'Inter,sans-serif'});
        lt.textContent = nlP.text;
        svg.appendChild(lt);
      }
    }
  });

  // Shape highlight overlay
  if (fbPentaShape) {
    const sh = fbPentaShape;
    const baseDots = fbRelMode === 'minor' ? sh.dotsA : sh.dotsC;
    const shDots = fbTransposePattern(baseDots, fbKeyRoot);
    Object.entries(shDots).forEach(([siStr, frets]) => {
      const si = parseInt(siStr);
      const s = FB_STRINGS[si];
      frets.forEach(f => {
        if (f < 0 || f > FB_FRETS) return;
        const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
        const cy = fbStrY(si);
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:sh.fill, stroke:sh.stroke, 'stroke-width':'2'}));
        const p = fbPc(s.midi + f);
        const isRoot = p === pentaRootPc;
        if (isRoot) {
          svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
            stroke:sh.stroke, 'stroke-width':'1.5', 'stroke-dasharray':'3 2', opacity:.6}));
        }
        const label = pentaLabels[p] ?? '';
        if (label) {
          const nlS = fbNoteLabel(p, label);
          const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:sh.text, 'font-size': nlS.small ? '7' : '11',
            'font-weight': isRoot ? '700' : '600', 'font-family':'Inter,sans-serif'});
          lt.textContent = nlS.text;
          svg.appendChild(lt);
        }
      });
    });
  }
}

// ── Diminished view ────────────────────────────────────────────────────────

function fbRenderDiminished(svg) {
  const scale = fbGetDimScale();
  FB_STRINGS.forEach((s, i) => {
    for (let f = 0; f <= FB_FRETS; f++) {
      const p = fbPc(s.midi + f);
      if (!scale.pcs.has(p)) continue;
      const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
      const cy = fbStrY(i);
      const isRoot = p === scale.rootPc;
      const label = scale.labels[p] || '';
      const sw = isRoot ? 2.5 : 1.5;
      svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#111111', stroke:'#cccccc', 'stroke-width':sw}));
      if (isRoot) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
          stroke:'#888', 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.3}));
      }
      if (label) {
        const nl = fbNoteLabel(p, label);
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#e0e0e0', 'font-size': nl.small ? '7' : '11',
          'font-weight': isRoot ? '700' : '500', 'font-family':'Inter,sans-serif'});
        lt.textContent = nl.text;
        svg.appendChild(lt);
      }
    }
  });
}

// ── Harmonic minor view ────────────────────────────────────────────────────

function fbRenderHarmonic(svg) {
  const data = fbGetHarmData();
  const selectedShape = fbHarmonicShape ? {
    ...fbHarmonicShape,
    dots: data.shapes[FB_HARM_SHAPES_BASE.indexOf(fbHarmonicShape)]?.dots || fbHarmonicShape.dots,
  } : null;
  // Find the transposed shape if one is selected
  let transShape = null;
  if (fbHarmonicShape) {
    const idx = FB_HARM_SHAPES_BASE.indexOf(fbHarmonicShape);
    if (idx >= 0) transShape = data.shapes[idx];
  }
  fbRenderScaleView(data.pcs, data.labels, data.rootPc, transShape);
}

// ── Hungarian minor view ───────────────────────────────────────────────────

function fbRenderHungarian(svg) {
  const data = fbGetHungData();
  let transShape = null;
  if (fbHungarianShape) {
    const idx = FB_HUNG_SHAPES_BASE.indexOf(fbHungarianShape);
    if (idx >= 0) transShape = data.shapes[idx];
  }
  fbRenderScaleView(data.pcs, data.labels, data.rootPc, transShape);
}

// ── Modes view ─────────────────────────────────────────────────────────────

function fbRenderModes(svg) {
  const rootPc = fbCurrentRoot();
  const degMap = fbBuildDegMap(rootPc, fbRelMode);
  const scalePcs = fbBuildScalePcs(fbMajRoot(), 'major');
  const tonicPc = rootPc;

  const mode = fbSelected ? fbGetMode(FB_MODES_BASE.indexOf(fbSelected)) : null;
  const hlSet = mode ? fbBuildHlSet(mode.pattern) : null;
  const modeRootPc = fbSelected ? fbModeRootPc(fbSelected.name) : null;
  const bluesPcM = fbBluesPc();
  const bluesDegM = fbBluesDegLabel();

  FB_STRINGS.forEach((s, i) => {
    for (let f = 0; f <= FB_FRETS; f++) {
      const p = fbPc(s.midi + f);
      const key = `${i}-${f}`;
      const inHL = hlSet && hlSet.has(key);
      const isBlues = fbBlues && p === bluesPcM;

      const baseDeg = degMap[p];
      if (!hlSet && !baseDeg && !isBlues) continue;
      if (hlSet && !baseDeg && !inHL && !isBlues) continue;

      const cx = FB_LEFT + FB_NUT + (f - .5) * FB_FW;
      const cy = fbStrY(i);

      if (isBlues && !baseDeg && !inHL) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#0d1525', stroke:'#4d8fdc', 'stroke-width':'1.5'}));
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#8bbff0', 'font-size':bluesDegM.length>1?'9':'11', 'font-weight':'500', 'font-family':'Inter,sans-serif'});
        lt.textContent = bluesDegM;
        svg.appendChild(lt);
        continue;
      }

      let label;
      if (inHL) {
        if (fbNumMode === 'mode') {
          label = fbGetModeRelDeg(p, fbSelected) ?? baseDeg ?? '';
        } else {
          const mapType = fbNumMode === 'C' ? 'major' : 'minor';
          const mapRoot = fbNumMode === 'C' ? fbMajRoot() : fbMinRoot();
          const map2 = fbBuildDegMap(mapRoot, mapType);
          label = map2[p] ?? '';
        }
      } else {
        label = baseDeg ?? '';
      }

      const isBaseTonic = !fbSelected && p === tonicPc;
      const isModeTonic = fbSelected && inHL && (
        fbNumMode === 'mode' ? p === modeRootPc :
        fbNumMode === 'C' ? p === fbMajRoot() :
                            p === fbMinRoot()
      );

      const fill = inHL && mode ? mode.fill : '#111111';
      const stroke = inHL && mode ? mode.stroke : '#cccccc';
      const txtCol = inHL && mode ? mode.text : '#e0e0e0';
      const sw = (isBaseTonic || isModeTonic) ? 2.5 : 1.5;

      svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill, stroke, 'stroke-width':sw}));

      if (isBaseTonic || isModeTonic) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R+4, fill:'none',
          stroke: inHL && mode ? mode.stroke : '#888',
          'stroke-width':'1.2', 'stroke-dasharray':'3 2',
          opacity: inHL ? .75 : .3}));
      }

      if (label) {
        const nlM = fbNoteLabel(p, label);
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:txtCol, 'font-size': nlM.small ? '7' : '11',
          'font-weight':(isBaseTonic||isModeTonic)?'700':'500', 'font-family':'Inter,sans-serif'});
        lt.textContent = nlM.text;
        svg.appendChild(lt);
      }

      if (isBlues) {
        svg.appendChild(fbEl('circle', {cx, cy, r:FB_R, fill:'#0d1525', stroke:'#4d8fdc', 'stroke-width':'1.5'}));
        const lt = fbEl('text', {x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#8bbff0', 'font-size':bluesDegM.length>1?'9':'11', 'font-weight':'500', 'font-family':'Inter,sans-serif'});
        lt.textContent = bluesDegM;
        svg.appendChild(lt);
      }
    }
  });
}

// ── View switching ─────────────────────────────────────────────────────────

function fbSetView(v) {
  fbView = v;
  const sel = document.getElementById('fb-view-select');
  if (sel) sel.value = v;

  document.getElementById('fb-pill-row').style.display         = v==='modes'      ? '' : 'none';
  document.getElementById('fb-shape-pill-row').style.display   = v==='pentatonic' ? '' : 'none';
  document.getElementById('fb-dim-pill-row').style.display     = v==='diminished' ? '' : 'none';
  document.getElementById('fb-harm-pill-row').style.display    = v==='harmonic'   ? '' : 'none';
  document.getElementById('fb-hung-pill-row').style.display    = v==='hungarian'  ? '' : 'none';
  document.getElementById('fb-chord-pill-row').style.display   = v==='chords'     ? '' : 'none';
  if (v !== 'modes') document.getElementById('fb-num-ctrl').style.display = 'none';

  // Show relative toggle for modes, pentatonic; hide for others
  const relCtrl = document.getElementById('fb-rel-ctrl');
  if (relCtrl) relCtrl.style.display = (v === 'modes' || v === 'pentatonic') ? '' : 'none';

  // Blues toggle only for modes + pentatonic
  const showBlues = (v === 'modes' || v === 'pentatonic');
  document.getElementById('fb-blues-row').style.display = showBlues ? '' : 'none';

  fbUpdateKeyLabel();
  fbUpdateBluesLabel();
  fbRender();
  fbRenderDiatonicPanel();
}

// ── Key root selection ─────────────────────────────────────────────────────

function fbSetKeyRoot(pc) {
  fbKeyRoot = pc;
  // Update relative toggle labels
  fbUpdateRelToggleLabels();
  // Reset selections that depend on key
  fbActiveChords.clear();
  // Rebuild pills with new note names
  fbBuildPills();
  fbBuildChordPills();
  fbBuildShapePills();
  fbBuildHarmPills();
  fbBuildHungPills();
  fbUpdateKeyLabel();
  fbUpdateBluesLabel();
  fbRender();
  fbRenderDiatonicPanel();
}

function fbSetRelMode(mode) {
  fbRelMode = mode;
  document.getElementById('fb-btn-major').classList.toggle('active', mode === 'major');
  document.getElementById('fb-btn-minor').classList.toggle('active', mode === 'minor');
  // Always sync number mode to match relative selection
  fbSetNumMode(mode === 'major' ? 'C' : 'A');
  fbUpdateKeyLabel();
  fbUpdateBluesLabel();
  fbRender();
  fbRenderDiatonicPanel();
}

function fbUpdateRelToggleLabels() {
  const majName = fbMajRootName();
  const minName = fbMinRootName();
  const btnMaj = document.getElementById('fb-btn-major');
  const btnMin = document.getElementById('fb-btn-minor');
  if (btnMaj) btnMaj.textContent = `${majName} major`;
  if (btnMin) btnMin.textContent = `${minName} minor`;
}

// Legacy compatibility wrappers
function fbSetKey(k) {
  fbSetRelMode(k === 'A' ? 'minor' : 'major');
}
function fbSetPentaKey(k) {
  fbSetRelMode(k === 'A' ? 'minor' : 'major');
}

// ── Number mode ────────────────────────────────────────────────────────────

function fbSetNumMode(m) {
  fbNumMode = m;
  document.getElementById('fb-nb-mode').classList.toggle('active', m === 'mode');
  document.getElementById('fb-nb-c').classList.toggle('active', m === 'C');
  document.getElementById('fb-nb-a').classList.toggle('active', m === 'A');
  fbUpdateKeyLabel();
  fbUpdateBluesLabel();
  fbRender();
}

// ── Key label ──────────────────────────────────────────────────────────────

function fbUpdateKeyLabel() {
  const el = document.getElementById('fb-key-label');
  const nameMap = fbGetNameMap();
  const majName = fbMajRootName();
  const minName = fbMinRootName();

  if (fbView === 'diminished') {
    const scale = fbGetDimScale();
    el.innerHTML = `<strong>${majName} ${scale.name} Diminished</strong> — ${scale.notes}`;
    return;
  }
  if (fbView === 'harmonic') {
    const root = fbMinRoot();
    const notes = FB_HARM_INTERVALS.map(i => nameMap[(root + i) % 12]).join(' · ');
    const degs = Object.values(FB_HARM_BASE_LABELS).join(' · ');
    el.innerHTML = `<strong>${minName} Harmonic Minor</strong> — ${notes} — degrees relative to ${minName} (${degs})`;
    return;
  }
  if (fbView === 'hungarian') {
    const root = fbMinRoot();
    const notes = FB_HUNG_INTERVALS.map(i => nameMap[(root + i) % 12]).join(' · ');
    const degs = Object.values(FB_HUNG_BASE_LABELS).join(' · ');
    el.innerHTML = `<strong>${minName} Hungarian Minor</strong> — ${notes} — degrees relative to ${minName} (${degs})`;
    return;
  }
  if (fbView === 'chords') {
    if (fbActiveChords.size === 0) {
      el.innerHTML = `<strong>${majName} major diatonic chords</strong> — select a chord below to highlight its tones`;
    } else {
      const dchords = fbGetDiatonicChords();
      const parts = dchords
        .filter(ch => fbActiveChords.has(ch.id))
        .map(ch => `<strong style="color:${ch.fill}">${ch.roman} ${ch.chordName}</strong>`);
      el.innerHTML = parts.join(' &nbsp;+&nbsp; ');
    }
    return;
  }
  if (fbView === 'pentatonic') {
    const rootName = fbRelMode === 'major' ? majName : minName;
    const type = fbRelMode === 'major' ? 'major' : 'minor';
    const pcsArr = (fbRelMode === 'major' ? FB_PENTA_MAJ_INTERVALS : FB_PENTA_MIN_INTERVALS)
      .map(i => nameMap[(fbCurrentRoot() + i) % 12]);
    const degs = fbRelMode === 'major' ? '1 · 2 · 3 · 5 · 6' : '1 · ♭3 · 4 · 5 · ♭7';
    el.innerHTML = `<strong>${rootName} ${type} pentatonic</strong> — ${pcsArr.join(' · ')} — degrees relative to ${rootName} (${degs})`;
    return;
  }

  // Modes view
  if (!fbSelected) {
    const rootName = fbRelMode === 'major' ? majName : minName;
    const type = fbRelMode === 'major' ? 'major' : 'natural minor';
    el.innerHTML = `<strong>${rootName} ${type}</strong> — intervals relative to ${rootName}`;
  } else {
    const modeRoot = fbPcName(fbModeRootPc(fbSelected.name));
    const modeNotes = FB_MODE_SEMIS[fbSelected.name].map((s) =>
      nameMap[(fbModeRootPc(fbSelected.name) + s) % 12] // Actually this is wrong — semis are offsets from mode root, not intervals to add
    );
    // Correct: mode semitones are relative to mode root
    const correctNotes = FB_MODE_SEMIS[fbSelected.name].map(s =>
      nameMap[(fbModeRootPc(fbSelected.name) + s) % 12]
    );
    const degs = FB_MODE_DEG_LABELS[fbSelected.name];
    const noteStr = correctNotes.join(' · ');
    const degStr = degs.join(' · ');
    if (fbNumMode === 'mode') {
      el.innerHTML = `<strong>${modeRoot} ${fbSelected.name}</strong> — ${noteStr} — degrees relative to ${modeRoot}: ${degStr}`;
    } else if (fbNumMode === 'C') {
      el.innerHTML = `<strong>${modeRoot} ${fbSelected.name}</strong> — ${noteStr} — degrees relative to ${majName} major`;
    } else {
      el.innerHTML = `<strong>${modeRoot} ${fbSelected.name}</strong> — ${noteStr} — degrees relative to ${minName} minor`;
    }
  }
}

// ── Mode pills ─────────────────────────────────────────────────────────────

function fbBuildPills() {
  const c = document.getElementById('fb-mode-pills');
  c.innerHTML = '';

  const none = document.createElement('div');
  none.className = 'fb-mode-pill';
  none.id = 'fb-pill-none';
  none.style.cssText = 'border-color:#555;color:#ccc;background:#222;';
  none.innerHTML = '<span>None</span>';
  none.onclick = () => {
    fbSelected = null;
    document.getElementById('fb-num-ctrl').style.display = 'none';
    fbRefreshPills();
    fbUpdateKeyLabel();
    fbRender();
    fbRenderDiatonicPanel();
  };
  c.appendChild(none);

  FB_MODES_BASE.forEach((m, i) => {
    const rootName = fbPcName(fbModeRootPc(m.name));
    const p = document.createElement('div');
    p.className = 'fb-mode-pill';
    p.id = `fb-pill-${i}`;
    p.style.cssText = `border-color:${m.stroke};color:${m.stroke};background:${m.fill}22;`;
    const dot = document.createElement('div');
    dot.className = 'fb-pip';
    dot.style.cssText = `background:${m.fill};border:1.5px solid ${m.stroke}`;
    p.appendChild(dot);
    const sp = document.createElement('span');
    sp.textContent = `${m.name} (${rootName})`;
    p.appendChild(sp);
    p.onclick = () => {
      if (fbSelected === m) {
        fbSelected = null;
        document.getElementById('fb-num-ctrl').style.display = 'none';
        fbRefreshPills();
        fbUpdateKeyLabel();
        fbRender();
        fbRenderDiatonicPanel();
      } else {
        fbSelected = m;
        // Initially match the relative major/minor selection
        const initNum = fbRelMode === 'major' ? 'C' : 'A';
        fbNumMode = initNum;
        fbSetNumMode(initNum);
        document.getElementById('fb-num-ctrl').style.display = 'flex';
        fbRefreshPills();
        fbUpdateKeyLabel();
        fbRender();
        fbRenderDiatonicPanel();
      }
    };
    c.appendChild(p);
  });
}

function fbRefreshPills() {
  const none = document.getElementById('fb-pill-none');
  if (none) none.style.cssText = fbSelected === null
    ? 'border-color:#777;color:#f0f0f0;background:#2a2a2a;'
    : 'border-color:#333;color:#555;background:transparent;';
  FB_MODES_BASE.forEach((m, i) => {
    const p = document.getElementById(`fb-pill-${i}`);
    if (!p) return;
    p.style.cssText = fbSelected === m
      ? `border-color:${m.stroke};color:${m.stroke};background:${m.fill}44;`
      : `border-color:${m.stroke};color:${m.stroke};background:${m.fill}22;`;
  });
}

// ── Shape pills (pentatonic) ───────────────────────────────────────────────

function fbBuildShapePills() {
  const c = document.getElementById('fb-shape-pills');
  c.innerHTML = '';

  const none = document.createElement('div');
  none.className = 'fb-mode-pill';
  none.id = 'fb-shape-pill-none';
  none.style.cssText = 'border-color:#555;color:#ccc;background:#222;';
  none.innerHTML = '<span>None</span>';
  none.onclick = () => {
    fbPentaShape = null;
    document.querySelectorAll('#fb-shape-pills .fb-mode-pill').forEach(p => p.classList.remove('selected'));
    none.classList.add('selected');
    fbRender();
  };
  none.classList.add('selected');
  c.appendChild(none);

  FB_PENTA_SHAPES.forEach(shape => {
    const pill = document.createElement('div');
    pill.className = 'fb-mode-pill';
    pill.style.cssText = `border-color:${shape.stroke};color:${shape.text};background:${shape.fill};`;
    pill.innerHTML = `<span>${shape.name}</span>`;
    pill.onclick = () => {
      fbPentaShape = fbPentaShape === shape ? null : shape;
      document.querySelectorAll('#fb-shape-pills .fb-mode-pill').forEach(p => p.classList.remove('selected'));
      if (fbPentaShape) pill.classList.add('selected');
      else none.classList.add('selected');
      fbRender();
    };
    c.appendChild(pill);
  });
}

// ── Chord pills ────────────────────────────────────────────────────────────

function fbBuildChordPills() {
  const c = document.getElementById('fb-chord-pills');
  c.innerHTML = '';
  const dchords = fbGetDiatonicChords();

  dchords.forEach(ch => {
    const pill = document.createElement('div');
    pill.className = 'fb-mode-pill';
    pill.style.cssText = `border-color:${ch.stroke};color:${ch.stroke};background:${ch.fill}22;`;

    const badge = document.createElement('span');
    badge.style.cssText = `font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:${ch.fill}33;border:1px solid ${ch.stroke};color:${ch.stroke};margin-right:2px;font-family:var(--mono);`;
    badge.textContent = ch.roman;
    pill.appendChild(badge);

    const sp = document.createElement('span');
    sp.textContent = ch.chordName;
    pill.appendChild(sp);

    pill.onclick = () => {
      if (fbActiveChords.has(ch.id)) {
        fbActiveChords.delete(ch.id);
        pill.style.cssText = `border-color:${ch.stroke};color:${ch.stroke};background:${ch.fill}22;`;
        badge.style.cssText = `font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:${ch.fill}33;border:1px solid ${ch.stroke};color:${ch.stroke};margin-right:2px;font-family:var(--mono);`;
      } else {
        fbActiveChords.add(ch.id);
        pill.style.cssText = `border-color:${ch.stroke};color:${ch.text};background:${ch.fill};`;
        badge.style.cssText = `font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.3);color:#fff;margin-right:2px;font-family:var(--mono);`;
      }
      fbUpdateKeyLabel();
      fbRender();
    };

    c.appendChild(pill);
  });
}

// ── Diminished pills ───────────────────────────────────────────────────────

function fbBuildDimPills() {
  const c = document.getElementById('fb-dim-pills');
  c.innerHTML = '';
  ['half-whole', 'whole-half'].forEach(key => {
    const scale = FB_DIM_SCALES[key];
    const pill = document.createElement('div');
    pill.className = 'fb-mode-pill';
    pill.id = 'fb-dim-pill-' + key;
    pill.style.cssText = key === fbDimType
      ? 'border-color:#777;color:#f0f0f0;background:#2a2a2a;'
      : 'border-color:#555;color:#ccc;background:#222;';
    pill.innerHTML = `<span>${scale.name}</span>`;
    pill.onclick = () => {
      fbDimType = key;
      document.querySelectorAll('#fb-dim-pills .fb-mode-pill').forEach(p => {
        p.style.cssText = 'border-color:#555;color:#ccc;background:#222;';
      });
      pill.style.cssText = 'border-color:#777;color:#f0f0f0;background:#2a2a2a;';
      fbUpdateKeyLabel();
      fbRender();
      fbRenderDiatonicPanel();
    };
    c.appendChild(pill);
  });
}

// ── Scale shape pills (harmonic/hungarian) ─────────────────────────────────

function fbBuildScaleShapePills(containerId, shapes, stateGetter, stateSetter) {
  const c = document.getElementById(containerId);
  c.innerHTML = '';
  const none = document.createElement('div');
  none.className = 'fb-mode-pill';
  none.style.cssText = 'border-color:#777;color:#f0f0f0;background:#2a2a2a;';
  none.innerHTML = '<span>None</span>';
  none.onclick = () => {
    stateSetter(null);
    c.querySelectorAll('.fb-mode-pill').forEach(p => p.classList.remove('selected'));
    none.classList.add('selected');
    fbRender();
  };
  none.classList.add('selected');
  c.appendChild(none);
  shapes.forEach(shape => {
    const pill = document.createElement('div');
    pill.className = 'fb-mode-pill';
    pill.style.cssText = `border-color:${shape.stroke};color:${shape.text};background:${shape.fill};`;
    pill.innerHTML = `<span>${shape.name}</span>`;
    pill.onclick = () => {
      const cur = stateGetter();
      stateSetter(cur === shape ? null : shape);
      c.querySelectorAll('.fb-mode-pill').forEach(p => p.classList.remove('selected'));
      if (stateGetter()) pill.classList.add('selected');
      else none.classList.add('selected');
      fbRender();
    };
    c.appendChild(pill);
  });
}

function fbBuildHarmPills() {
  fbBuildScaleShapePills('fb-harm-pills', FB_HARM_SHAPES_BASE,
    () => fbHarmonicShape, v => { fbHarmonicShape = v; });
}

function fbBuildHungPills() {
  fbBuildScaleShapePills('fb-hung-pills', FB_HUNG_SHAPES_BASE,
    () => fbHungarianShape, v => { fbHungarianShape = v; });
}

// ── DIATONIC CHORDS PANEL ──────────────────────────────────────────────────
// Uses the same chord diagram style as Chords in a Key section

function fbFindVoicing(chordPcs) {
  const pcsSet = new Set(chordPcs);
  let best = null;
  for (let sf = 0; sf <= 12; sf++) {
    const frets = [];
    for (let si = 0; si < 6; si++) {
      let found = -1;
      for (let f = sf; f <= sf + 4 && f <= 15; f++) {
        if (pcsSet.has(((FB_STRINGS[si].midi + f) % 12 + 12) % 12)) { found = f; break; }
      }
      frets.push(found);
    }
    let bassFound = false;
    for (let si = 0; si < 6; si++) {
      if (frets[si] < 0) continue;
      const pc = ((FB_STRINGS[si].midi + frets[si]) % 12 + 12) % 12;
      if (!bassFound) {
        if (pc === chordPcs[0]) bassFound = true;
        else frets[si] = -1;
      }
    }
    const played = frets.filter(f => f >= 0).length;
    if (played < 3) continue;
    const bassIdx = frets.findIndex(f => f >= 0);
    const bassPc = bassIdx >= 0 ? ((FB_STRINGS[bassIdx].midi + frets[bassIdx]) % 12 + 12) % 12 : -1;
    const score = played + (bassPc === chordPcs[0] ? 3 : 0);
    if (!best || score > best.score) best = { frets: [...frets], startFret: sf, score };
    if (score >= 9) break;
  }
  return best || { frets: [-1,-1,-1,-1,-1,-1], startFret: 0, score: 0 };
}

// Look up a curated voicing from the CIK library, fall back to auto-generated
function fbLookupVoicing(rootPc, quality) {
  const pcKey = CIK_PC_TO_KEY[rootPc];
  const qualMap = { 'Major':'maj', 'Minor':'min', 'Dim':'dim', 'Aug':'maj' };
  const libQual = qualMap[quality] || 'maj';
  const libKey = pcKey + '_' + libQual;
  const voicing = CIK_VOICING_LIB[libKey];
  if (voicing) return voicing;
  // Fallback to auto-generated
  return null;
}

// Chord diagram matching the Chords in a Key style
// chord name on top (large), numeral underneath (smaller, coloured)
function fbDrawChordDiagram(chord) {
  const W = 200, H = 290;
  const LEFT = 46, RIGHT = W - 14;
  const STRINGS = 6, FRETS_SHOWN = 5;
  const strGap = (RIGHT - LEFT) / (STRINGS - 1);
  const fretGap = 136 / FRETS_SHOWN;
  const DOT_R = 10;
  const HEADER = 46;
  const MUTE_ZONE = 22;
  const fretboardH = fretGap * FRETS_SHOWN;
  const remaining = H - HEADER - MUTE_ZONE - fretboardH;
  const TOP = HEADER + MUTE_ZONE + Math.max(0, remaining / 2);
  const BOTTOM = TOP + fretboardH;

  // Look up curated voicing
  const v = chord._voicing;

  let s = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:auto;">`;

  // Header: chord name on top (large, white), numeral below (smaller, coloured)
  const nameFontSize = 28;
  const numFontSize = 16;
  const gap = 4;
  const totalTextH = nameFontSize + numFontSize + gap;
  const blockTop = Math.max(4, (HEADER - totalTextH) / 2);
  const nameY = blockTop + nameFontSize;
  const numeralY = nameY + gap + numFontSize;

  s += `<text x="${W/2}" y="${nameY}" text-anchor="middle" font-size="${nameFontSize}" font-weight="600" fill="#f0f0f0" font-family="Inter,sans-serif">${chord.chordName}</text>`;
  s += `<text x="${W/2}" y="${numeralY}" text-anchor="middle" font-size="${numFontSize}" font-weight="500" fill="${chord.fill}" font-family="Inter,sans-serif">${chord.roman}</text>`;

  // Nut or fret label
  const isNut = v.startFret <= 1;
  if (isNut) {
    s += `<rect x="${LEFT-2}" y="${TOP-7}" width="${RIGHT-LEFT+4}" height="6" fill="#ccc" rx="2"/>`;
  } else {
    s += `<text x="${LEFT/2}" y="${TOP + fretGap*0.55}" text-anchor="middle" font-size="10" fill="#888" font-family="Inter,sans-serif" dominant-baseline="central">${v.startFret}fr</text>`;
  }

  // Grid
  s += `<line x1="${LEFT}" y1="${TOP}" x2="${RIGHT}" y2="${TOP}" stroke="#3a3a3a" stroke-width="1"/>`;
  for (let f = 1; f <= FRETS_SHOWN; f++) {
    const y = TOP + f * fretGap;
    s += `<line x1="${LEFT}" y1="${y}" x2="${RIGHT}" y2="${y}" stroke="#3a3a3a" stroke-width="1"/>`;
  }
  for (let si = 0; si < STRINGS; si++) {
    const x = LEFT + si * strGap;
    s += `<line x1="${x}" y1="${TOP}" x2="${x}" y2="${BOTTOM}" stroke="#555" stroke-width="1.4"/>`;
  }

  // Barre
  if (v.barre) {
    const by = TOP + (v.barre.fret - v.startFret) * fretGap + fretGap * 0.5;
    const bx1 = LEFT + v.barre.fromString * strGap;
    const bx2 = LEFT + v.barre.toString * strGap;
    const pad = DOT_R + 3;
    s += `<rect x="${bx1 - pad}" y="${by - pad}" width="${(bx2 - bx1) + pad * 2}" height="${pad * 2}" fill="none" stroke="${chord.stroke}" stroke-width="2" rx="${pad}" opacity="0.9"/>`;
    [v.barre.fromString, v.barre.toString].forEach(si => {
      const x = LEFT + si * strGap;
      s += `<circle cx="${x}" cy="${by}" r="${DOT_R}" fill="${chord.fill}" stroke="none"/>`;
    });
  }

  // Dots, mutes, opens
  for (let si = 0; si < 6; si++) {
    const x = LEFT + si * strGap;
    const fret = v.frets[si];
    if (fret < 0) {
      const sz = 5;
      const muteY = TOP - 18;
      s += `<line x1="${x-sz}" y1="${muteY+sz}" x2="${x+sz}" y2="${muteY-sz}" stroke="#555" stroke-width="1.5"/>`;
      s += `<line x1="${x-sz}" y1="${muteY-sz}" x2="${x+sz}" y2="${muteY+sz}" stroke="#555" stroke-width="1.5"/>`;
    } else if (fret === 0) {
      s += `<circle cx="${x}" cy="${TOP-17}" r="6" fill="none" stroke="#aaa" stroke-width="1.5"/>`;
    } else {
      const coveredByBarre = v.barre && fret === v.barre.fret && si >= v.barre.fromString && si <= v.barre.toString;
      if (!coveredByBarre) {
        const rel = fret - v.startFret;
        if (rel >= 0 && rel < FRETS_SHOWN) {
          const cy = TOP + (rel + 0.5) * fretGap;
          const pc = ((FB_STRINGS[si].midi + fret) % 12 + 12) % 12;
          const isRoot = pc === chord.rootPc;
          s += `<circle cx="${x}" cy="${cy}" r="${DOT_R}" fill="${chord.fill}" stroke="${chord.stroke}" stroke-width="1.5"/>`;
          if (v.fingers && v.fingers[si] > 0) {
            s += `<text x="${x}" y="${cy}" text-anchor="middle" dominant-baseline="central" font-size="10" font-weight="600" fill="#fff" font-family="Inter,sans-serif">${v.fingers[si]}</text>`;
          }
        }
      }
    }
  }

  s += '</svg>';
  return s;
}

function fbRenderDiatonicPanel() {
  const panel = document.getElementById('fb-diatonic-panel');
  if (!panel) return;

  const showPanel = ['modes', 'harmonic', 'hungarian', 'pentatonic', 'diminished'].includes(fbView);
  if (!showPanel) {
    panel.style.display = 'none';
    return;
  }
  panel.style.display = '';

  let chords, compChords = null, scaleLabel;
  const nameMap = fbGetNameMap();

  if (fbView === 'modes') {
    // Diatonic chord ordering always follows the relative major/minor toggle
    const modeIdx = fbRelMode === 'minor' ? 5 : 0; // Aeolian=5 for minor, Ionian=0 for major
    const basePcs = MAJ_SCALE.map(s => (fbKeyRoot + s) % 12);
    const baseNames = basePcs.map(pc => nameMap[pc]);
    const allDegLabels = [
      ['1','2','3','4','5','6','7'],
      ['1','2','♭3','4','5','6','♭7'],
      ['1','♭2','♭3','4','5','♭6','♭7'],
      ['1','2','3','♯4','5','6','7'],
      ['1','2','3','4','5','6','♭7'],
      ['1','2','♭3','4','5','♭6','♭7'],
      ['1','♭2','♭3','4','♭5','♭6','♭7'],
    ];
    const rPcs = [], rNames = [], rDegs = [];
    for (let i = 0; i < 7; i++) {
      rPcs.push(basePcs[(modeIdx + i) % 7]);
      rNames.push(baseNames[(modeIdx + i) % 7]);
      rDegs.push(allDegLabels[modeIdx][i]);
    }
    chords = fbComputeDiatonicChords(rPcs, rNames, rDegs);
    scaleLabel = fbRelMode === 'minor' ? `${fbMinRootName()} Minor` : `${fbMajRootName()} Major`;
  } else if (fbView === 'harmonic') {
    const root = fbMinRoot();
    const pcs = FB_HARM_INTERVALS.map(i => (root + i) % 12);
    const names = pcs.map(pc => nameMap[pc]);
    const degs = Object.values(FB_HARM_BASE_LABELS);
    chords = fbComputeDiatonicChords(pcs, names, degs);
    scaleLabel = `${fbMinRootName()} Harmonic Minor`;
    // Comparison with natural minor
    const natPcs = MIN_SCALE.map(s => (root + s) % 12);
    const natNames = natPcs.map(pc => nameMap[pc]);
    const natDegs = ['1','2','♭3','4','5','♭6','♭7'];
    compChords = fbComputeDiatonicChords(natPcs, natNames, natDegs);
  } else if (fbView === 'hungarian') {
    const root = fbMinRoot();
    const pcs = FB_HUNG_INTERVALS.map(i => (root + i) % 12);
    const names = pcs.map(pc => nameMap[pc]);
    const degs = Object.values(FB_HUNG_BASE_LABELS);
    chords = fbComputeDiatonicChords(pcs, names, degs);
    scaleLabel = `${fbMinRootName()} Hungarian Minor`;
    const natPcs = MIN_SCALE.map(s => (root + s) % 12);
    const natNames = natPcs.map(pc => nameMap[pc]);
    const natDegs = ['1','2','♭3','4','5','♭6','♭7'];
    compChords = fbComputeDiatonicChords(natPcs, natNames, natDegs);
  } else if (fbView === 'pentatonic') {
    const root = fbCurrentRoot();
    const intervals = fbRelMode === 'major' ? FB_PENTA_MAJ_INTERVALS : FB_PENTA_MIN_INTERVALS;
    const pcs = intervals.map(i => (root + i) % 12);
    const names = pcs.map(pc => nameMap[pc]);
    const degLabels = fbRelMode === 'major'
      ? ['1','2','3','5','6']
      : ['1','♭3','4','5','♭7'];
    chords = fbComputePentaDiatonicChords(pcs, names, degLabels);
    const rootName = fbRelMode === 'major' ? fbMajRootName() : fbMinRootName();
    scaleLabel = `${rootName} ${fbRelMode === 'major' ? 'Major' : 'Minor'} Pentatonic`;
  } else if (fbView === 'diminished') {
    const scale = fbGetDimScale();
    const intervals = FB_DIM_SCALES[fbDimType || 'half-whole'].intervals;
    const root = fbMajRoot();
    const pcs = intervals.map(i => (root + i) % 12);
    const names = pcs.map(pc => nameMap[pc]);
    const degLabels = intervals.map(i => FB_DIM_SCALES[fbDimType || 'half-whole'].labels[i]);
    chords = fbComputeDimDiatonicChords(pcs, names, degLabels);
    scaleLabel = `${fbMajRootName()} ${FB_DIM_SCALES[fbDimType || 'half-whole'].name} Diminished`;
  }

  let h = `<div style="font-size:11px;font-weight:600;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.5rem;">Diatonic triads — ${scaleLabel}</div>`;
  h += `<div style="display:grid;grid-template-columns:repeat(${chords.length},1fr);gap:8px;margin-bottom:0.5rem;">`;
  chords.forEach((ch, i) => {
    const isDiff = compChords && ch.quality !== compChords[i]?.quality;
    const border = isDiff ? 'var(--accent-dim)' : 'var(--border)';
    const cikVoicing = fbLookupVoicing(ch.rootPc, ch.quality);
    const voicing = cikVoicing || fbFindVoicing([ch.rootPc, ch.thirdPc, ch.fifthPc]);
    ch._voicing = voicing;
    h += `<div style="background:var(--bg-raised);border:1px solid ${border};border-radius:var(--radius);padding:8px 4px;text-align:center;">`;
    h += fbDrawChordDiagram(ch);
    h += `<div style="font-size:10px;color:var(--text-dim);font-family:var(--mono);margin-top:4px;">${ch.intervals.join(' ')}</div>`;
    h += '</div>';
  });
  h += '</div>';

  if (compChords) {
    const hasDiffs = chords.some((ch, i) => ch.quality !== compChords[i]?.quality);
    if (hasDiffs) {
      const compLabel = fbView === 'harmonic' || fbView === 'hungarian'
        ? `${fbMinRootName()} Natural Minor` : 'Natural Minor';
      h += `<div style="font-size:11px;font-weight:600;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.4rem;margin-top:0.75rem;">Differences from ${compLabel}</div>`;
      h += `<div style="display:grid;grid-template-columns:repeat(${chords.length},1fr);gap:8px;">`;
      compChords.forEach((nat, i) => {
        const ch = chords[i];
        if (!ch || ch.quality === nat.quality) { h += '<div></div>'; return; }
        h += `<div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:6px 4px;text-align:center;">`;
        h += `<div style="font-size:9px;color:var(--text-dim);text-transform:uppercase;">Natural</div>`;
        h += `<div style="font-size:12px;color:var(--red-text);font-family:var(--mono);text-decoration:line-through;">${nat.roman}</div>`;
        h += `<div style="font-size:9px;color:var(--text-dim);text-transform:uppercase;margin-top:3px;">${scaleLabel.split(' ').slice(1).join(' ')}</div>`;
        h += `<div style="font-size:12px;color:var(--green-text);font-family:var(--mono);">${ch.roman}</div>`;
        h += '</div>';
      });
      h += '</div>';
    }
  }

  panel.innerHTML = h;
}

// ── Pentatonic diatonic chords (stacked thirds from 5-note scale) ──────────

function fbComputePentaDiatonicChords(pcs, noteNames, degreeLabels) {
  const chords = [];
  for (let i = 0; i < pcs.length; i++) {
    const rootPc = pcs[i];
    const thirdPc = pcs[(i + 2) % pcs.length];
    const fifthPc = pcs[(i + 4) % pcs.length];
    const thirdSemi = ((thirdPc - rootPc) + 12) % 12;
    const fifthSemi = ((fifthPc - rootPc) + 12) % 12;
    const q = fbTriadQuality(thirdSemi, fifthSemi);
    let roman;
    if (i < FB_ROMAN.length) {
      roman = q.upper ? FB_ROMAN[i] : FB_ROMAN[i].toLowerCase();
    } else {
      roman = String(i + 1);
    }
    const suffix = q.name === 'Dim' ? '°' : q.name === 'Aug' ? '+' : (q.sym && !q.sym.includes('m') ? q.sym : '');
    chords.push({
      degree: i + 1,
      degreeLabel: degreeLabels[i],
      rootPc, thirdPc, fifthPc,
      rootName: noteNames[i],
      quality: q.name,
      roman: roman + suffix,
      chordName: noteNames[i] + suffix,
      intervals: ['1', FB_INTERVAL_NAMES[thirdSemi], FB_INTERVAL_NAMES[fifthSemi]],
      ...FB_CHORD_COLORS[i % 7],
    });
  }
  return chords;
}

// ── Diminished diatonic chords (stacked thirds from 8-note scale) ──────────

function fbComputeDimDiatonicChords(pcs, noteNames, degreeLabels) {
  const chords = [];
  for (let i = 0; i < pcs.length; i++) {
    const rootPc = pcs[i];
    const thirdPc = pcs[(i + 2) % pcs.length];
    const fifthPc = pcs[(i + 4) % pcs.length];
    const thirdSemi = ((thirdPc - rootPc) + 12) % 12;
    const fifthSemi = ((fifthPc - rootPc) + 12) % 12;
    const q = fbTriadQuality(thirdSemi, fifthSemi);
    let roman;
    if (i < FB_ROMAN.length) {
      roman = q.upper ? FB_ROMAN[i] : FB_ROMAN[i].toLowerCase();
    } else {
      roman = q.upper ? (i + 1).toString() : (i + 1).toString().toLowerCase();
    }
    const suffix = q.name === 'Dim' ? '°' : q.name === 'Aug' ? '+' : '';
    chords.push({
      degree: i + 1,
      degreeLabel: degreeLabels[i],
      rootPc, thirdPc, fifthPc,
      rootName: noteNames[i],
      quality: q.name,
      roman: roman + suffix,
      chordName: noteNames[i] + suffix,
      intervals: ['1', FB_INTERVAL_NAMES[thirdSemi], FB_INTERVAL_NAMES[fifthSemi]],
      ...FB_CHORD_COLORS[i % 7],
    });
  }
  return chords;
}

export { fbSetView, fbSetKey, fbSetPentaKey, fbSetNumMode, fbRender, fbSetKeyRoot, fbSetRelMode };
export { fbToggleBlues, fbToggleNoteNames, fbToggleSevenths };
export { fbBuildPills, fbBuildShapePills, fbBuildChordPills, fbBuildDimPills };
export { fbBuildHarmPills, fbBuildHungPills };
export { fbRenderDiatonicPanel };
