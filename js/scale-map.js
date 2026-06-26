import { MODES } from './data.js';

// ── FRETBOARD MAP ──────────────────────────────────────────────────────────
// Ported directly from fretboard-modes_1.html

const FB_STRINGS = [
  { name:'E₂', midi:40 },
  { name:'A₂', midi:45 },
  { name:'D₃', midi:50 },
  { name:'G₃', midi:55 },
  { name:'B₃', midi:59 },
  { name:'E₄', midi:64 },
];
const FB_N = 6, FB_FRETS = 15;

const FB_C_DEGS = { 0:'1', 2:'2', 4:'3', 5:'4', 7:'5', 9:'6', 11:'7' };
const FB_A_DEGS = { 9:'1', 11:'2', 0:'♭3', 2:'4', 4:'5', 5:'♭6', 7:'♭7' };

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
const FB_MODE_ROOT_PC = {
  'Ionian':0, 'Dorian':2, 'Phrygian':4, 'Lydian':5,
  'Mixolydian':7, 'Aeolian':9, 'Locrian':11
};

const FB_MODES = [
  { name:'Ionian',     root:'C', baseKey:'C', fill:'#C8822A', stroke:'#8F5510', text:'#fff',
    pattern:{ 0:[8,10], 1:[7,8,10], 2:[7,9,10], 3:[7,9,10], 4:[8,10], 5:[7,8] } },
  { name:'Dorian',     root:'D', baseKey:'C', fill:'#1D9E75', stroke:'#0F6E56', text:'#fff',
    pattern:{ 0:[10,12], 1:[8,10,12], 2:[9,10,12], 3:[9,10,12], 4:[10,12,13], 5:[10,12,13] } },
  { name:'Phrygian',   root:'E', baseKey:'C', fill:'#D85A30', stroke:'#993C1D', text:'#fff',
    pattern:{ 0:[12,13,15], 1:[12,14,15], 2:[12,14,15], 3:[12,14], 4:[12,13,15], 5:[12,13,15] } },
  { name:'Lydian',     root:'F', baseKey:'C', fill:'#7F77DD', stroke:'#534AB7', text:'#fff',
    pattern:{ 0:[1,3,5], 1:[2,3,5], 2:[2,3,5], 3:[2,4,5], 4:[1,3,5], 5:[1,3,5] } },
  { name:'Mixolydian', root:'G', baseKey:'C', fill:'#D4537E', stroke:'#993556', text:'#fff',
    pattern:{ 0:[3,5], 1:[2,3,5], 2:[2,3,5], 3:[2,4,5], 4:[3,5,6], 5:[3,5] } },
  { name:'Aeolian',    root:'A', baseKey:'A', fill:'#2A7E9E', stroke:'#185870', text:'#fff',
    pattern:{ 0:[5,7,8], 1:[5,7,8], 2:[5,7], 3:[4,5,7], 4:[5,6,8], 5:[5,7,8] } },
  { name:'Locrian',    root:'B', baseKey:'C', fill:'#A03080', stroke:'#701858', text:'#fff',
    pattern:{ 0:[7,8,10], 1:[7,8,10], 2:[7,9,10], 3:[7,9,10], 4:[8,10], 5:[7] } },
];

const FB_LEFT=62, FB_TOP=30, FB_FW=48, FB_SH=48, FB_NUT=6, FB_R=14;
const FB_SVG_W = FB_LEFT + FB_NUT + FB_FRETS*FB_FW + 30;
const FB_SVG_H = FB_TOP + (FB_N-1)*FB_SH + 56;

let fbCurrentKey = 'C'; // shared global key: 'C' | 'A' — applies across modes, pentatonic, and chords views
let fbSelected = null;
let fbNumMode = 'mode'; // 'mode' | 'C' | 'A'
let fbView = 'modes';   // 'modes' | 'pentatonic' | 'chords'
let fbBlues = false;    // blues scale toggle (adds D#/Eb, pc=3)
let fbPentaShape = null; // currently selected pentatonic shape name, or null
let fbShowSevenths = false;   // whether to add diatonic 7ths to active chords
let fbShowNoteNames = false;  // global toggle: show note names instead of interval numbers on all dots
let fbDimType = 'half-whole'; // 'half-whole' | 'whole-half'
let fbHarmonicShape = null;   // currently selected harmonic minor shape, or null
let fbHungarianShape = null;  // currently selected Hungarian minor shape, or null

// pc → display label when note-name mode is on
// Enharmonic notes show both names separated by /
const FB_PC_NAMES = {
  0:'C', 1:'C♯/D♭', 2:'D', 3:'D♯/E♭', 4:'E',
  5:'F', 6:'F♯/G♭', 7:'G', 8:'G♯/A♭', 9:'A',
  10:'A♯/B♭', 11:'B'
};

// Diminished scale definitions (rooted on C)
const FB_DIM_SCALES = {
  'half-whole': {
    name: 'Half-Whole',
    pcs: new Set([0, 1, 3, 4, 6, 7, 9, 10]),
    labels: { 0:'1', 1:'♭2', 3:'♭3', 4:'3', 6:'♯4', 7:'5', 9:'6', 10:'♭7' },
    rootPc: 0,
    notes: 'C · D♭ · E♭ · E · F♯ · G · A · B♭',
  },
  'whole-half': {
    name: 'Whole-Half',
    pcs: new Set([0, 2, 3, 5, 6, 8, 9, 11]),
    labels: { 0:'1', 2:'2', 3:'♭3', 5:'4', 6:'♭5', 8:'♭6', 9:'6', 11:'7' },
    rootPc: 0,
    notes: 'C · D · E♭ · F · G♭ · A♭ · A · B',
  },
};

// A Harmonic Minor: A B C D E F G# — pcs: 9,11,0,2,4,5,8
const FB_HARM_PCS = new Set([9, 11, 0, 2, 4, 5, 8]);
const FB_HARM_ROOT = 9;
const FB_HARM_LABELS = { 9:'1', 11:'2', 0:'♭3', 2:'4', 4:'5', 5:'♭6', 8:'7' };
const FB_HARM_SHAPES = [
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

// A Hungarian Minor: A B C D# E F G# — pcs: 9,11,0,3,4,5,8
const FB_HUNG_PCS = new Set([9, 11, 0, 3, 4, 5, 8]);
const FB_HUNG_ROOT = 9;
const FB_HUNG_LABELS = { 9:'1', 11:'2', 0:'♭3', 3:'♯4', 4:'5', 5:'♭6', 8:'7' };
const FB_HUNG_SHAPES = [
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

// Diatonic chords of C major — pitch-classes and interval labels per note
// pcs/intervals = triad tones; pc7/int7 = the diatonic 7th added on top
const FB_DIATONIC_CHORDS = [
  { id:'I',   numeral:'I',    name:'C Major',      quality:'maj7',  pcs:[0, 4, 7],  intervals:['1','3','5'],    pc7:11, int7:'7',   fill:'#C8822A', stroke:'#8F5510', text:'#fff' },
  { id:'ii',  numeral:'ii',   name:'D Minor',       quality:'m7',    pcs:[2, 5, 9],  intervals:['1','♭3','5'],   pc7:0,  int7:'♭7',  fill:'#1D9E75', stroke:'#0F6E56', text:'#fff' },
  { id:'iii', numeral:'iii',  name:'E Minor',       quality:'m7',    pcs:[4, 7, 11], intervals:['1','♭3','5'],   pc7:2,  int7:'♭7',  fill:'#D85A30', stroke:'#993C1D', text:'#fff' },
  { id:'IV',  numeral:'IV',   name:'F Major',       quality:'maj7',  pcs:[5, 9, 0],  intervals:['1','3','5'],    pc7:4,  int7:'7',   fill:'#7F77DD', stroke:'#534AB7', text:'#fff' },
  { id:'V',   numeral:'V',    name:'G Major',       quality:'7',     pcs:[7, 11, 2], intervals:['1','3','5'],    pc7:5,  int7:'♭7',  fill:'#D4537E', stroke:'#993556', text:'#fff' },
  { id:'vi',  numeral:'vi',   name:'A Minor',       quality:'m7',    pcs:[9, 0, 4],  intervals:['1','♭3','5'],   pc7:7,  int7:'♭7',  fill:'#2A7E9E', stroke:'#185870', text:'#fff' },
  { id:'vii', numeral:'vii°', name:'B Diminished',  quality:'m7♭5', pcs:[11, 2, 5], intervals:['1','♭3','♭5'],  pc7:9,  int7:'♭7',  fill:'#A03080', stroke:'#701858', text:'#fff' },
];

let fbActiveChords = new Set(); // set of chord ids currently highlighted


// Pentatonic shapes: each entry maps FB_STRINGS index to fret array
// FB_STRINGS index 0 = low E (6th string), index 5 = high e (1st string)
// fbStrY renders index 0 at the bottom of the SVG, matching real guitar orientation
const FB_PENTA_SHAPES = [
  {
    name: 'Shape One',
    fill: '#C46EB0', stroke: '#8A3A7A', text: '#fff',
    // key: FB_STRINGS index (0=low E/6th string, 5=high e/1st string)
    dotsC: {
      0: [8, 10],
      1: [7, 10],
      2: [7, 10],
      3: [7, 9],
      4: [8, 10],
      5: [8, 10],
    },
    dotsA: {
      0: [5, 8],
      1: [5, 7],
      2: [5, 7],
      3: [5, 7],
      4: [5, 8],
      5: [5, 8],
    }
  },
  {
    name: 'Shape Two',
    fill: '#4A9E6B', stroke: '#2A6A42', text: '#fff',
    dotsC: {
      0: [10, 12],
      1: [10, 12],
      2: [10, 12],
      3: [9, 12],
      4: [10, 13],
      5: [10, 12],
    },
    dotsA: {
      0: [8, 10],
      1: [7, 10],
      2: [7, 10],
      3: [7, 9],
      4: [8, 10],
      5: [8, 10],
    }
  },
  {
    name: 'Shape Three',
    fill: '#D4700A', stroke: '#963F00', text: '#fff',
    dotsC: {
      0: [12, 15],
      1: [12, 15],
      2: [12, 14],
      3: [12, 14],
      4: [13, 15],
      5: [12, 15],
    },
    dotsA: {
      0: [10, 12],
      1: [10, 12],
      2: [10, 12],
      3: [9, 12],
      4: [10, 13],
      5: [10, 12],
    }
  },
  {
    name: 'Shape Four',
    fill: '#5577CC', stroke: '#2E4A99', text: '#fff',
    dotsC: {
      0: [3, 5],
      1: [3, 5],
      2: [2, 5],
      3: [2, 5],
      4: [3, 5],
      5: [3, 5],
    },
    dotsA: {
      0: [0, 3, 12, 15],
      1: [0, 3, 12, 15],
      2: [0, 2, 12, 14],
      3: [0, 2, 12, 14],
      4: [1, 3, 13, 15],
      5: [0, 3, 12, 15],
    }
  },
  {
    name: 'Shape Five',
    fill: '#C4502A', stroke: '#8A2A0A', text: '#fff',
    dotsC: {
      0: [5, 8],
      1: [5, 7],
      2: [5, 7],
      3: [5, 7],
      4: [5, 8],
      5: [5, 8],
    },
    dotsA: {
      0: [3, 5],
      1: [3, 5],
      2: [2, 5],
      3: [2, 5],
      4: [3, 5],
      5: [3, 5],
    }
  },
];

// Pentatonic scale pitch-classes: C D E G A
const FB_PENTA_PCS = new Set([0, 2, 4, 7, 9]);
// Labels when C is root (C major pentatonic): 1 2 3 5 6
const FB_PENTA_C_LABELS = {0:'1', 2:'2', 4:'3', 7:'5', 9:'6'};
// Labels when A is root (A minor pentatonic): 1 ♭3 4 5 ♭7
const FB_PENTA_A_LABELS = {9:'1', 0:'♭3', 2:'4', 4:'5', 7:'♭7'};
// Root pc per key
const FB_PENTA_ROOT = {C: 0, A: 9};
// Uniform dot style matching the modes aesthetic (a neutral teal)
const FB_PENTA_FILL   = '#5a8f8f';
const FB_PENTA_STROKE = '#2e6060';
const FB_PENTA_TEXT   = '#fff';

// Blues scale: D#/Eb (pc=3) interval label relative to current base
function fbBluesDegLabel(){
  if(fbView === 'pentatonic'){
    return fbCurrentKey === 'C' ? '♭3' : '♭5';
  }
  if(fbSelected && fbNumMode === 'mode'){
    // relative to mode root
    const rootPc = FB_MODE_ROOT_PC[fbSelected.name];
    const rel = ((3 - rootPc) % 12 + 12) % 12;
    const semis = FB_MODE_SEMIS[fbSelected.name];
    const labels = FB_MODE_DEG_LABELS[fbSelected.name];
    const idx = semis.indexOf(rel);
    if(idx !== -1) return labels[idx];
    // Not in mode — compute nearest
    const bluesSemiLabels = {0:'1',1:'♭2',2:'2',3:'♭3',4:'3',5:'4',6:'♯4/♭5',7:'5',8:'♭6',9:'6',10:'♭7',11:'7'};
    return bluesSemiLabels[rel] ?? '♭3';
  }
  // C major base: pc 3 = ♭3; A minor base: pc 3 = ♭3 relative to A? pc3 rel A(9): (3-9+12)=6 = ♭5
  if(fbCurrentKey === 'A' || (fbSelected && fbNumMode === 'A')) return '♭5';
  return '♭3';
}

function fbToggleBlues(){
  fbBlues = !fbBlues;
  const tog = document.getElementById('fb-blues-toggle');
  const thumb = document.getElementById('fb-blues-thumb');
  const lbl = document.getElementById('fb-blues-label');
  const txt = document.getElementById('fb-blues-text');
  if(fbBlues){
    tog.style.background = '#0d1a2e';
    tog.style.borderColor = '#2255aa';
    thumb.style.left = '18px';
    thumb.style.background = '#4d8fdc';
    const deg = fbBluesDegLabel();
    lbl.textContent = `(D♯/E♭ = ${deg})`;
    lbl.style.color = '#4d8fdc';
    if(txt) txt.style.color = '#4d8fdc';
  } else {
    tog.style.background = '#222';
    tog.style.borderColor = '#3a3a3a';
    thumb.style.left = '2px';
    thumb.style.background = '#888';
    lbl.textContent = '';
    if(txt) txt.style.color = 'var(--text-muted)';
  }
  fbRender();
}

function fbUpdateBluesLabel(){
  if(!fbBlues) return;
  const lbl = document.getElementById('fb-blues-label');
  const deg = fbBluesDegLabel();
  lbl.textContent = `(D♯/E♭ = ${deg})`;
}

function fbToggleNoteNames(){
  fbShowNoteNames = !fbShowNoteNames;
  const tog   = document.getElementById('fb-notenames-toggle');
  const thumb = document.getElementById('fb-notenames-thumb');
  const txt   = document.getElementById('fb-notenames-text');
  if(fbShowNoteNames){
    tog.style.background   = '#0d1f10';
    tog.style.borderColor  = '#2a6a40';
    thumb.style.left       = '18px';
    thumb.style.background = '#4db36d';
    if(txt) txt.style.color = '#7fd49f';
  } else {
    tog.style.background   = '#222';
    tog.style.borderColor  = '#3a3a3a';
    thumb.style.left       = '2px';
    thumb.style.background = '#888';
    if(txt) txt.style.color = 'var(--text-muted)';
  }
  fbRender();
}

// Returns the label to display on a dot given its pitch class and the "interval" label.
// When fbShowNoteNames is true, returns the note name (with enharmonics for black keys).
// font-size hint returned so caller can shrink text for longer labels.
function fbNoteLabel(p, intervalLabel){
  if(!fbShowNoteNames) return { text: intervalLabel, small: intervalLabel.length > 1 };
  const name = FB_PC_NAMES[p] ?? intervalLabel;
  return { text: name, small: name.length > 2 };
}

// Generic renderer for scale views with optional shape highlights (harmonic, Hungarian)
function fbRenderScaleView(pcsSet, labels, rootPc, shapes, selectedShape){
  const svg = document.getElementById('fb-svg');
  FB_STRINGS.forEach((s, i) => {
    for(let f=0; f<=FB_FRETS; f++){
      const p = fbPc(s.midi + f);
      if(!pcsSet.has(p)) continue;
      const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
      const cy = fbStrY(i);
      const isRoot = p === rootPc;
      const label = labels[p] || '';
      const sw = isRoot ? 2.5 : 1.5;
      svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'#111111', stroke:'#cccccc', 'stroke-width':sw}));
      if(isRoot){
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
          stroke:'#888', 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.3}));
      }
      if(label){
        const nl = fbNoteLabel(p, label);
        const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#e0e0e0', 'font-size': nl.small ? '7' : '11',
          'font-weight': isRoot ? '700' : '500',
          'font-family':'Inter,sans-serif'});
        lt.textContent = nl.text;
        svg.appendChild(lt);
      }
    }
  });
  if(selectedShape){
    Object.entries(selectedShape.dots).forEach(([siStr, frets]) => {
      const si = parseInt(siStr);
      const s = FB_STRINGS[si];
      frets.forEach(f => {
        const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
        const cy = fbStrY(si);
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:selectedShape.fill, stroke:selectedShape.stroke, 'stroke-width':'2'}));
        const p = fbPc(s.midi + f);
        const isRoot = p === rootPc;
        if(isRoot){
          svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
            stroke:selectedShape.stroke, 'stroke-width':'1.5', 'stroke-dasharray':'3 2', opacity:.6}));
        }
        const label = labels[p] || '';
        if(label){
          const nl = fbNoteLabel(p, label);
          const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:selectedShape.text, 'font-size': nl.small ? '7' : '11',
            'font-weight': isRoot ? '700' : '600',
            'font-family':'Inter,sans-serif'});
          lt.textContent = nl.text;
          svg.appendChild(lt);
        }
      });
    });
  }
}

function fbPc(m){ return ((m%12)+12)%12; }
function fbStrY(s){ return FB_TOP + (FB_N-1-s)*FB_SH; }
function fbEl(tag, attrs){
  const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
}

function fbToggleSevenths(){
  fbShowSevenths = !fbShowSevenths;
  const tog   = document.getElementById('fb-7th-toggle');
  const thumb = document.getElementById('fb-7th-thumb');
  const txt   = document.getElementById('fb-7th-text');
  if(fbShowSevenths){
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
  fbRender();
}

function fbBuildHlSet(mode){
  const s = new Set();
  for(const [si, frets] of Object.entries(mode.pattern))
    for(const f of frets) s.add(`${si}-${f}`);
  return s;
}

function fbGetModeRelDeg(p, mode){
  const rootPc = FB_MODE_ROOT_PC[mode.name];
  const semis  = FB_MODE_SEMIS[mode.name];
  const labels = FB_MODE_DEG_LABELS[mode.name];
  const rel    = ((p - rootPc) % 12 + 12) % 12;
  const idx    = semis.indexOf(rel);
  return idx !== -1 ? labels[idx] : null;
}

function fbRender(){
  const svg = document.getElementById('fb-svg');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.setAttribute('viewBox', `0 0 ${FB_SVG_W} ${FB_SVG_H}`);
  svg.setAttribute('preserveAspectRatio', 'xMinYMid meet');
  svg.innerHTML = '';

  // Fretboard bg
  svg.appendChild(fbEl('rect',{x:FB_LEFT, y:FB_TOP-FB_SH*.45, width:FB_NUT+FB_FRETS*FB_FW, height:(FB_N-1)*FB_SH+FB_SH*.9, fill:'#1a1a1a', rx:8}));
  // Nut
  svg.appendChild(fbEl('rect',{x:FB_LEFT, y:FB_TOP-FB_SH*.45, width:FB_NUT, height:(FB_N-1)*FB_SH+FB_SH*.9, fill:'#aaa', rx:2, opacity:.45}));

  // Fret bars
  for(let f=1; f<=FB_FRETS; f++){
    const x = FB_LEFT+FB_NUT+f*FB_FW;
    svg.appendChild(fbEl('line',{x1:x, y1:FB_TOP-FB_SH*.42, x2:x, y2:FB_TOP+(FB_N-1)*FB_SH+FB_SH*.42,
      stroke:'#3a3a3a', 'stroke-width':f===12?2.5:1.2, opacity:f===12?.8:.5}));
  }

  // Fret numbers
  for(let f=1; f<=FB_FRETS; f++){
    const cx = FB_LEFT+FB_NUT+(f-.5)*FB_FW;
    const t = fbEl('text',{x:cx, y:FB_TOP+(FB_N-1)*FB_SH+FB_SH*.76,
      'text-anchor':'middle', 'dominant-baseline':'central',
      fill:'#555', 'font-size':'11', 'font-family':'Inter,sans-serif'});
    t.textContent = f;
    svg.appendChild(t);
  }

  // Position markers
  [3,5,7,9,12].forEach(f => {
    const cx = FB_LEFT+FB_NUT+(f-.5)*FB_FW;
    if(f===12){
      [1.5,3.5].forEach(sy => svg.appendChild(fbEl('circle',{cx, cy:FB_TOP+sy*FB_SH, r:4, fill:'#333', opacity:.7})));
    } else {
      svg.appendChild(fbEl('circle',{cx, cy:FB_TOP+2.5*FB_SH, r:4, fill:'#333', opacity:.7}));
    }
  });

  // Strings
  FB_STRINGS.forEach((s, i) => {
    const y = fbStrY(i);
    svg.appendChild(fbEl('line',{x1:FB_LEFT+FB_NUT, y1:y, x2:FB_LEFT+FB_NUT+FB_FRETS*FB_FW, y2:y,
      stroke:'#777', 'stroke-width':2.2-i*.28, opacity:.6}));
    const lbl = fbEl('text',{x:FB_LEFT-6, y, 'text-anchor':'end', 'dominant-baseline':'central',
      fill:'#777', 'font-size':'11', 'font-family':'Inter,sans-serif'});
    lbl.textContent = s.name;
    svg.appendChild(lbl);
  });

  if(fbView === 'chords'){
    // ── Diatonic chord dots ─────────────────────────────────────────────────
    // Build a map: pc -> array of { chordDef, label, isSeventh }
    const activePcMap = {}; // pc -> [ {chordDef, label, isSeventh}, ... ]

    FB_DIATONIC_CHORDS.forEach(ch => {
      if(!fbActiveChords.has(ch.id)) return;
      // triad tones
      ch.pcs.forEach((p, idx) => {
        if(!activePcMap[p]) activePcMap[p] = [];
        // Only add if this chord isn't already represented at this pc (avoid 7th-as-triad double entry)
        if(!activePcMap[p].find(e => e.chordDef === ch && !e.isSeventh))
          activePcMap[p].push({ chordDef: ch, label: ch.intervals[idx], isSeventh: false });
      });
      // diatonic 7th
      if(fbShowSevenths){
        const p7 = ch.pc7;
        if(!activePcMap[p7]) activePcMap[p7] = [];
        // Only push if this chord's 7th isn't already a triad tone entry for same chord
        if(!activePcMap[p7].find(e => e.chordDef === ch))
          activePcMap[p7].push({ chordDef: ch, label: ch.int7, isSeventh: true });
      }
    });

    if(Object.keys(activePcMap).length === 0){
      // Nothing selected — show all C major notes as neutral grey dots
      const CMAJ_PCS = new Set([0,2,4,5,7,9,11]);
      FB_STRINGS.forEach((s, i) => {
        for(let f=0; f<=FB_FRETS; f++){
          const p = fbPc(s.midi + f);
          if(!CMAJ_PCS.has(p)) continue;
          const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
          const cy = fbStrY(i);
          svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'#111111', stroke:'#444', 'stroke-width':'1.2'}));
        }
      });
    } else {
      FB_STRINGS.forEach((s, i) => {
        for(let f=0; f<=FB_FRETS; f++){
          const p = fbPc(s.midi + f);
          const entries = activePcMap[p];
          if(!entries || entries.length === 0) continue;

          const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
          const cy = fbStrY(i);

          // Separate triad entries from seventh-only entries
          const triadEntries = entries.filter(e => !e.isSeventh);
          const seventhEntries = entries.filter(e => e.isSeventh);

          // Determine what to actually draw:
          // - triad tones take priority; if >1 chord shares this pc as a triad tone → split dot
          // - if a pc is ONLY a 7th (no triad chord claims it) → diamond
          // - if a pc is both a triad tone for one chord AND a 7th for another → show triad, mark with small 7th ring
          const isSeventh7Only = triadEntries.length === 0 && seventhEntries.length > 0;
          const hasAlso7th = triadEntries.length > 0 && seventhEntries.length > 0;

          if(isSeventh7Only){
            // Diamond / ring marker — use the seventh chord's colour, dimmer style
            const ch = seventhEntries[0].chordDef;
            const label = seventhEntries[0].label;
            // Diamond shape via rotated rect SVG — same footprint as circles (FB_R)
            const half = FB_R;
            const pts = `${cx},${cy-half} ${cx+half},${cy} ${cx},${cy+half} ${cx-half},${cy}`;
            svg.appendChild(fbEl('polygon',{points:pts, fill:ch.fill, stroke:ch.stroke,
              'stroke-width':'1.8', opacity:'0.95'}));
            const nl7 = fbNoteLabel(p, label);
            const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
              fill:'#fff', 'font-size': nl7.small ? '7' : '9', 'font-weight':'600',
              'font-family':'Inter,sans-serif'});
            lt.textContent = nl7.text;
            svg.appendChild(lt);
            continue;
          }

          if(triadEntries.length === 1){
            // Single chord owns this dot
            const { chordDef: ch, label } = triadEntries[0];
            const isRoot = label === '1';
            const sw = isRoot ? 2.5 : 1.5;
            svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:ch.fill, stroke:ch.stroke, 'stroke-width':sw}));
            if(isRoot){
              svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
                stroke:ch.stroke, 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.75}));
            }
            // If this note is also a 7th for another chord, add a small outer accent ring
            if(hasAlso7th){
              svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+3.5, fill:'none',
                stroke:seventhEntries[0].chordDef.stroke, 'stroke-width':'1.5', opacity:.55}));
            }
            const nlT = fbNoteLabel(p, label);
            const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
              fill:ch.text, 'font-size': nlT.small ? '8' : '11',
              'font-weight': isRoot ? '700' : '500', 'font-family':'Inter,sans-serif'});
            lt.textContent = nlT.text;
            svg.appendChild(lt);
          } else {
            // Common tone — shared by 2+ chords: split pie wedges
            const n = triadEntries.length;
            const angleStep = (2 * Math.PI) / n;
            triadEntries.forEach(({ chordDef: ch }, idx) => {
              const startAngle = idx * angleStep - Math.PI / 2;
              const endAngle   = startAngle + angleStep;
              const x1 = cx + FB_R * Math.cos(startAngle);
              const y1 = cy + FB_R * Math.sin(startAngle);
              const x2 = cx + FB_R * Math.cos(endAngle);
              const y2 = cy + FB_R * Math.sin(endAngle);
              const largeArc = angleStep > Math.PI ? 1 : 0;
              const pathD = `M${cx},${cy} L${x1},${y1} A${FB_R},${FB_R} 0 ${largeArc} 1 ${x2},${y2} Z`;
              svg.appendChild(fbEl('path',{d:pathD, fill:ch.fill, stroke:ch.stroke, 'stroke-width':'0.8'}));
            });
            // Shared border ring
            svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'none', stroke:'#fff', 'stroke-width':'0.6', opacity:'0.25'}));
            // Stacked interval labels — tiny, centred
            const allLabels = [...new Set(triadEntries.map(e => e.label))];
            const displayLabel = allLabels.join('/');
            const nlW = fbNoteLabel(p, displayLabel);
            const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
              fill:'#fff', 'font-size': nlW.small ? '7' : '9', 'font-weight':'600',
              'font-family':'Inter,sans-serif', 'text-shadow':'0 0 3px #000'});
            lt.textContent = nlW.text;
            svg.appendChild(lt);
          }
        }
      });
    }
    return;
  }

  if(fbView === 'pentatonic'){
    // ── Pentatonic dots ── neutral aesthetic matching "none" mode ──
    const pentaLabels = fbCurrentKey === 'C' ? FB_PENTA_C_LABELS : FB_PENTA_A_LABELS;
    const pentaRootPc = FB_PENTA_ROOT[fbCurrentKey];
    const bluesPc = 3; // D#/Eb
    const bluesDeg = fbBluesDegLabel();
    FB_STRINGS.forEach((s, i) => {
      for(let f=0; f<=FB_FRETS; f++){
        const p = fbPc(s.midi + f);
        const isBlues = fbBlues && p === bluesPc;
        if(!FB_PENTA_PCS.has(p) && !isBlues) continue;
        const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
        const cy = fbStrY(i);
        const isRoot = p === pentaRootPc;
        if(isBlues){
          // Blues note — blue accent
          svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'#0d1525', stroke:'#4d8fdc', 'stroke-width':'1.5'}));
          const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:'#8bbff0', 'font-size':bluesDeg.length>1?'9':'11', 'font-weight':'500',
            'font-family':'Inter,sans-serif'});
          lt.textContent = bluesDeg;
          svg.appendChild(lt);
          continue;
        }
        const sw = isRoot ? 2.5 : 1.5;
        const fill   = '#111111';
        const stroke = '#cccccc';
        const txtCol = '#e0e0e0';
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill, stroke, 'stroke-width':sw}));
        if(isRoot){
          svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
            stroke:'#888', 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.3}));
        }
        const label = pentaLabels[p] ?? '';
        if(label){
          const nlP = fbNoteLabel(p, label);
          const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:txtCol, 'font-size': nlP.small ? '7' : '11',
            'font-weight': isRoot ? '700' : '500',
            'font-family':'Inter,sans-serif'});
          lt.textContent = nlP.text;
          svg.appendChild(lt);
        }
      }
    });

    // ── Shape highlight overlay ───────────────────────────────────────────
    if(fbPentaShape){
      const sh = fbPentaShape;
      // sh.dots keys are FB_STRINGS indices (0=low E/6th string, 5=high e/1st string)
      const shDots = fbCurrentKey === 'A' ? sh.dotsA : sh.dotsC;
      Object.entries(shDots).forEach(([siStr, frets]) => {
        const si = parseInt(siStr);
        const s = FB_STRINGS[si];
        frets.forEach(f => {
          const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
          const cy = fbStrY(si);
          svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:sh.fill, stroke:sh.stroke, 'stroke-width':'2'}));
          // Reuse the pentatonic interval label if available, else show fret number
          const p = fbPc(s.midi + f);
          const pentaLabels2 = fbCurrentKey === 'C' ? FB_PENTA_C_LABELS : FB_PENTA_A_LABELS;
          const pentaRootPc2 = FB_PENTA_ROOT[fbCurrentKey];
          const label = pentaLabels2[p] ?? '';
          const isRoot2 = p === pentaRootPc2;
          if(isRoot2){
            svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
              stroke:sh.stroke, 'stroke-width':'1.5', 'stroke-dasharray':'3 2', opacity:.6}));
          }
          if(label){
            const nlS = fbNoteLabel(p, label);
            const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
              fill:sh.text, 'font-size': nlS.small ? '7' : '11',
              'font-weight': isRoot2 ? '700' : '600',
              'font-family':'Inter,sans-serif'});
            lt.textContent = nlS.text;
            svg.appendChild(lt);
          }
        });
      });
    }

    return;
  }

  if(fbView === 'diminished'){
    const scale = FB_DIM_SCALES[fbDimType || 'half-whole'];
    FB_STRINGS.forEach((s, i) => {
      for(let f=0; f<=FB_FRETS; f++){
        const p = fbPc(s.midi + f);
        if(!scale.pcs.has(p)) continue;
        const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
        const cy = fbStrY(i);
        const isRoot = p === scale.rootPc;
        const label = scale.labels[p] || '';
        const sw = isRoot ? 2.5 : 1.5;
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'#111111', stroke:'#cccccc', 'stroke-width':sw}));
        if(isRoot){
          svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
            stroke:'#888', 'stroke-width':'1.2', 'stroke-dasharray':'3 2', opacity:.3}));
        }
        if(label){
          const nl = fbNoteLabel(p, label);
          const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
            fill:'#e0e0e0', 'font-size': nl.small ? '7' : '11',
            'font-weight': isRoot ? '700' : '500',
            'font-family':'Inter,sans-serif'});
          lt.textContent = nl.text;
          svg.appendChild(lt);
        }
      }
    });
    return;
  }

  if(fbView === 'harmonic'){
    fbRenderScaleView(FB_HARM_PCS, FB_HARM_LABELS, FB_HARM_ROOT, FB_HARM_SHAPES, fbHarmonicShape);
    return;
  }

  if(fbView === 'hungarian'){
    fbRenderScaleView(FB_HUNG_PCS, FB_HUNG_LABELS, FB_HUNG_ROOT, FB_HUNG_SHAPES, fbHungarianShape);
    return;
  }

  // ── Modes dots ────────────────────────────────────────────────────────────
  const degMap  = fbCurrentKey==='C' ? FB_C_DEGS : FB_A_DEGS;
  const tonicPc = fbCurrentKey==='C' ? 0 : 9;
  const hlSet   = fbSelected ? fbBuildHlSet(fbSelected) : null;
  const modeRootPc = fbSelected ? FB_MODE_ROOT_PC[fbSelected.name] : null;
  const bluesPcM = 3; // D#/Eb
  const bluesDegM = fbBluesDegLabel();

  FB_STRINGS.forEach((s, i) => {
    for(let f=0; f<=FB_FRETS; f++){
      const p   = fbPc(s.midi + f);
      const key = `${i}-${f}`;
      const inHL = hlSet && hlSet.has(key);
      const isBlues = fbBlues && p === bluesPcM;

      const baseDeg = degMap[p];
      // Skip dots that have no label and aren't in hl set and aren't blues
      if(!hlSet && !baseDeg && !isBlues) continue;
      if(hlSet && !baseDeg && !inHL && !isBlues) continue;

      const cx = FB_LEFT + FB_NUT + (f-.5)*FB_FW;
      const cy = fbStrY(i);

      // Blues overlay — draw on top later; skip here and render after regular dots
      if(isBlues && !baseDeg && !inHL){
        // pure blues note (not in scale), draw blue and continue
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'#0d1525', stroke:'#4d8fdc', 'stroke-width':'1.5'}));
        const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#8bbff0', 'font-size':bluesDegM.length>1?'9':'11', 'font-weight':'500',
          'font-family':'Inter,sans-serif'});
        lt.textContent = bluesDegM;
        svg.appendChild(lt);
        continue;
      }

      let label;
      if(inHL){
        if(fbNumMode === 'mode'){
          label = fbGetModeRelDeg(p, fbSelected) ?? baseDeg ?? '';
        } else {
          const map = fbNumMode === 'C' ? FB_C_DEGS : FB_A_DEGS;
          label = map[p] ?? '';
        }
      } else {
        label = baseDeg ?? '';
      }

      const isBaseTonic = !fbSelected && p === tonicPc;
      const isModeTonic = fbSelected && inHL && (
        fbNumMode === 'mode' ? p === modeRootPc :
        fbNumMode === 'C'    ? p === 0 :
                               p === 9
      );

      // All dots use the same neutral base style; highlighted ones additionally get mode colour
      const fill   = inHL ? fbSelected.fill   : '#111111';
      const stroke = inHL ? fbSelected.stroke : '#cccccc';
      const txtCol = inHL ? fbSelected.text   : '#e0e0e0';
      const sw     = (isBaseTonic || isModeTonic) ? 2.5 : 1.5;

      svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill, stroke, 'stroke-width':sw}));

      if(isBaseTonic || isModeTonic){
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R+4, fill:'none',
          stroke: inHL ? fbSelected.stroke : '#888',
          'stroke-width':'1.2', 'stroke-dasharray':'3 2',
          opacity: inHL ? .75 : .3}));
      }

      if(label){
        const nlM = fbNoteLabel(p, label);
        const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:txtCol, 'font-size': nlM.small ? '7' : '11',
          'font-weight':(isBaseTonic||isModeTonic)?'700':'500',
          'font-family':'Inter,sans-serif'});
        lt.textContent = nlM.text;
        svg.appendChild(lt);
      }

      // Blues overlay on top of existing dot when note is also in scale
      if(isBlues){
        svg.appendChild(fbEl('circle',{cx, cy, r:FB_R, fill:'#0d1525', stroke:'#4d8fdc', 'stroke-width':'1.5'}));
        const lt = fbEl('text',{x:cx, y:cy, 'text-anchor':'middle', 'dominant-baseline':'central',
          fill:'#8bbff0', 'font-size':bluesDegM.length>1?'9':'11', 'font-weight':'500',
          'font-family':'Inter,sans-serif'});
        lt.textContent = bluesDegM;
        svg.appendChild(lt);
      }
    }
  });
}

function fbSetView(v){
  fbView = v;
  ['modes','pentatonic','diminished','harmonic','hungarian','chords'].forEach(id => {
    document.getElementById('fb-view-'+id).classList.toggle('active', v===id);
  });
  document.getElementById('fb-modes-base').style.display       = v==='modes'      ? '' : 'none';
  document.getElementById('fb-penta-base').style.display       = v==='pentatonic' ? '' : 'none';
  document.getElementById('fb-pill-row').style.display         = v==='modes'      ? '' : 'none';
  document.getElementById('fb-shape-pill-row').style.display   = v==='pentatonic' ? '' : 'none';
  document.getElementById('fb-dim-pill-row').style.display     = v==='diminished' ? '' : 'none';
  document.getElementById('fb-harm-pill-row').style.display    = v==='harmonic'   ? '' : 'none';
  document.getElementById('fb-hung-pill-row').style.display    = v==='hungarian'  ? '' : 'none';
  document.getElementById('fb-chord-pill-row').style.display   = v==='chords'     ? '' : 'none';
  if(v!=='modes') document.getElementById('fb-num-ctrl').style.display = 'none';
  const showBlues = (v==='modes' || v==='pentatonic');
  document.getElementById('fb-blues-row').style.display = showBlues ? '' : 'none';
  fbUpdateKeyLabel(); fbUpdateBluesLabel();
  fbRender();
  fbRenderDiatonicPanel();
}

function fbBuildShapePills(){
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
    pill.style.cssText = 'border-color:' + shape.stroke + ';color:' + shape.text + ';background:' + shape.fill + ';';
    pill.innerHTML = '<span>' + shape.name + '</span>';
    pill.onclick = () => {
      fbPentaShape = fbPentaShape === shape ? null : shape;
      document.querySelectorAll('#fb-shape-pills .fb-mode-pill').forEach(p => p.classList.remove('selected'));
      if(fbPentaShape) pill.classList.add('selected');
      else none.classList.add('selected');
      fbRender();
    };
    c.appendChild(pill);
  });
}

function fbSetPentaKey(k){
  fbCurrentKey = k;
  // Sync both toggle pairs
  document.getElementById('fb-penta-btn-c').classList.toggle('active', k==='C');
  document.getElementById('fb-penta-btn-a').classList.toggle('active', k==='A');
  document.getElementById('fb-btn-c').classList.toggle('active', k==='C');
  document.getElementById('fb-btn-a').classList.toggle('active', k==='A');
  fbUpdateKeyLabel(); fbUpdateBluesLabel();
  fbRender();
}

function fbBuildChordPills(){
  const c = document.getElementById('fb-chord-pills');
  c.innerHTML = '';

  FB_DIATONIC_CHORDS.forEach(ch => {
    const pill = document.createElement('div');
    pill.className = 'fb-mode-pill';
    pill.id = 'fb-chord-pill-' + ch.id;
    // Unselected: tinted background, coloured border and text
    pill.style.cssText = `border-color:${ch.stroke};color:${ch.stroke};background:${ch.fill}22;`;

    // Numeral badge
    const badge = document.createElement('span');
    badge.style.cssText = `font-size:10px;font-weight:700;padding:1px 5px;border-radius:4px;background:${ch.fill}33;border:1px solid ${ch.stroke};color:${ch.stroke};margin-right:2px;font-family:var(--mono);`;
    badge.textContent = ch.numeral;
    pill.appendChild(badge);

    // Name
    const sp = document.createElement('span');
    sp.textContent = ch.name;
    pill.appendChild(sp);

    pill.onclick = () => {
      if(fbActiveChords.has(ch.id)){
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


function fbBuildDimPills(){
  const c = document.getElementById('fb-dim-pills');
  c.innerHTML = '';
  ['half-whole','whole-half'].forEach(key => {
    const scale = FB_DIM_SCALES[key];
    const pill = document.createElement('div');
    pill.className = 'fb-mode-pill';
    pill.id = 'fb-dim-pill-' + key;
    pill.style.cssText = key === fbDimType
      ? 'border-color:#777;color:#f0f0f0;background:#2a2a2a;'
      : 'border-color:#555;color:#ccc;background:#222;';
    pill.innerHTML = '<span>' + scale.name + '</span>';
    pill.onclick = () => {
      fbDimType = key;
      document.querySelectorAll('#fb-dim-pills .fb-mode-pill').forEach(p => {
        p.style.cssText = 'border-color:#555;color:#ccc;background:#222;';
      });
      pill.style.cssText = 'border-color:#777;color:#f0f0f0;background:#2a2a2a;';
      fbUpdateKeyLabel();
      fbRender();
    };
    c.appendChild(pill);
  });
}

function fbBuildScaleShapePills(containerId, shapes, stateGetter, stateSetter){
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
      if(stateGetter()) pill.classList.add('selected');
      else none.classList.add('selected');
      fbRender();
    };
    c.appendChild(pill);
  });
}

function fbBuildHarmPills(){
  fbBuildScaleShapePills('fb-harm-pills', FB_HARM_SHAPES,
    () => fbHarmonicShape, v => { fbHarmonicShape = v; });
}

function fbBuildHungPills(){
  fbBuildScaleShapePills('fb-hung-pills', FB_HUNG_SHAPES,
    () => fbHungarianShape, v => { fbHungarianShape = v; });
}

function fbBuildPills(){
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
    fbRefreshPills(); fbUpdateKeyLabel(); fbRender(); fbRenderDiatonicPanel();
  };
  c.appendChild(none);

  FB_MODES.forEach((m, i) => {
    const p = document.createElement('div');
    p.className = 'fb-mode-pill';
    p.id = `fb-pill-${i}`;
    p.style.cssText = `border-color:${m.stroke};color:${m.stroke};background:${m.fill}22;`;
    const dot = document.createElement('div');
    dot.className = 'fb-pip';
    dot.style.cssText = `background:${m.fill};border:1.5px solid ${m.stroke}`;
    p.appendChild(dot);
    const sp = document.createElement('span');
    sp.textContent = `${m.name} (${m.root})`;
    p.appendChild(sp);
    p.onclick = () => {
      if(fbSelected === m){
        fbSelected = null;
        document.getElementById('fb-num-ctrl').style.display = 'none';
        fbRefreshPills(); fbUpdateKeyLabel(); fbRender(); fbRenderDiatonicPanel();
      } else {
        fbSelected = m;
        fbNumMode = 'mode';
        fbSetNumMode('mode');
        document.getElementById('fb-num-ctrl').style.display = 'flex';
        fbSetKey(m.baseKey, false);
        fbRefreshPills(); fbRender(); fbRenderDiatonicPanel();
      }
    };
    c.appendChild(p);
  });
}

function fbRefreshPills(){
  const none = document.getElementById('fb-pill-none');
  if(none) none.style.cssText = fbSelected===null
    ? 'border-color:#777;color:#f0f0f0;background:#2a2a2a;'
    : 'border-color:#333;color:#555;background:transparent;';
  FB_MODES.forEach((m, i) => {
    const p = document.getElementById(`fb-pill-${i}`);
    if(!p) return;
    p.style.cssText = fbSelected===m
      ? `border-color:${m.stroke};color:${m.stroke};background:${m.fill}44;`
      : `border-color:${m.stroke};color:${m.stroke};background:${m.fill}22;`;
  });
}

function fbSetNumMode(m){
  fbNumMode = m;
  document.getElementById('fb-nb-mode').classList.toggle('active', m==='mode');
  document.getElementById('fb-nb-c').classList.toggle('active', m==='C');
  document.getElementById('fb-nb-a').classList.toggle('active', m==='A');
  fbUpdateKeyLabel(); fbUpdateBluesLabel(); fbRender();
}

const FB_MODE_NOTES = {
  'Ionian':     ['C','D','E','F','G','A','B'],
  'Dorian':     ['D','E','F','G','A','B','C'],
  'Phrygian':   ['E','F','G','A','B','C','D'],
  'Lydian':     ['F','G','A','B','C','D','E'],
  'Mixolydian': ['G','A','B','C','D','E','F'],
  'Aeolian':    ['A','B','C','D','E','F','G'],
  'Locrian':    ['B','C','D','E','F','G','A'],
};

function fbUpdateKeyLabel(){
  const el = document.getElementById('fb-key-label');
  if(fbView === 'diminished'){
    const scale = FB_DIM_SCALES[fbDimType || 'half-whole'];
    el.innerHTML = `<strong>C ${scale.name} Diminished</strong> — ${scale.notes}`;
    return;
  }
  if(fbView === 'harmonic'){
    el.innerHTML = '<strong>A Harmonic Minor</strong> — A · B · C · D · E · F · G♯ — degrees relative to A (1 · 2 · ♭3 · 4 · 5 · ♭6 · 7)';
    return;
  }
  if(fbView === 'hungarian'){
    el.innerHTML = '<strong>A Hungarian Minor</strong> — A · B · C · D♯ · E · F · G♯ — degrees relative to A (1 · 2 · ♭3 · ♯4 · 5 · ♭6 · 7)';
    return;
  }
  if(fbView === 'chords'){
    if(fbActiveChords.size === 0){
      el.innerHTML = '<strong>C major diatonic chords</strong> — select a chord below to highlight its tones';
    } else {
      const parts = FB_DIATONIC_CHORDS
        .filter(ch => fbActiveChords.has(ch.id))
        .map(ch => `<strong style="color:${ch.fill}">${ch.numeral} ${ch.name}</strong>`);
      el.innerHTML = parts.join(' &nbsp;+&nbsp; ');
    }
    return;
  }
  if(fbView === 'pentatonic'){
    if(fbCurrentKey === 'C'){
      el.innerHTML = '<strong>C major pentatonic</strong> — C · D · E · G · A  — degrees relative to C (1 · 2 · 3 · 5 · 6)';
    } else {
      el.innerHTML = '<strong>A minor pentatonic</strong> — A · C · D · E · G  — degrees relative to A (1 · ♭3 · 4 · 5 · ♭7)';
    }
    return;
  }
  if(!fbSelected){
    el.innerHTML = fbCurrentKey==='C'
      ? '<strong>C major</strong> — intervals relative to C'
      : '<strong>A natural minor</strong> — intervals relative to A';
  } else {
    const notes  = FB_MODE_NOTES[fbSelected.name] || [];
    const degs   = FB_MODE_DEG_LABELS[fbSelected.name] || [];
    const noteStr = notes.join(' · ');
    const degStr  = degs.join(' · ');
    if(fbNumMode === 'mode'){
      el.innerHTML = `<strong>${fbSelected.root} ${fbSelected.name}</strong> — ${noteStr}  — degrees relative to ${fbSelected.root}: ${degStr}`;
    } else if(fbNumMode === 'C'){
      el.innerHTML = `<strong>${fbSelected.root} ${fbSelected.name}</strong> — ${noteStr}  — degrees relative to C major: ${degStr}`;
    } else {
      el.innerHTML = `<strong>${fbSelected.root} ${fbSelected.name}</strong> — ${noteStr}  — degrees relative to A minor: ${degStr}`;
    }
  }
}

function fbSetKey(k, doRender=true){
  fbCurrentKey = k;
  // Sync both toggle pairs
  document.getElementById('fb-btn-c').classList.toggle('active', k==='C');
  document.getElementById('fb-btn-a').classList.toggle('active', k==='A');
  document.getElementById('fb-penta-btn-c').classList.toggle('active', k==='C');
  document.getElementById('fb-penta-btn-a').classList.toggle('active', k==='A');
  fbUpdateKeyLabel(); fbUpdateBluesLabel();
  if(doRender) fbRender();
}

// ── DIATONIC CHORDS PANEL ────────────────────────────────────────────────────

const FB_INTERVAL_NAMES = { 0:'1', 1:'♭2', 2:'2', 3:'♭3', 4:'3', 5:'4', 6:'♭5', 7:'5', 8:'♯5', 9:'6', 10:'♭7', 11:'7' };

function fbTriadQuality(thirdSemi, fifthSemi){
  if(thirdSemi===4 && fifthSemi===7) return { name:'Major', sym:'', upper:true };
  if(thirdSemi===3 && fifthSemi===7) return { name:'Minor', sym:'m', upper:false };
  if(thirdSemi===3 && fifthSemi===6) return { name:'Dim', sym:'°', upper:false };
  if(thirdSemi===4 && fifthSemi===8) return { name:'Aug', sym:'+', upper:true };
  if(thirdSemi===4 && fifthSemi===6) return { name:'Maj♭5', sym:'(♭5)', upper:true };
  if(thirdSemi===2 && fifthSemi===6) return { name:'Dim', sym:'°', upper:false };
  return { name:'?', sym:'?', upper:false };
}

const FB_ROMAN = ['I','II','III','IV','V','VI','VII'];

function fbComputeDiatonicChords(pcs, noteNames, degreeLabels){
  const chords = [];
  for(let i=0; i<7; i++){
    const rootPc = pcs[i];
    const thirdPc = pcs[(i+2)%7];
    const fifthPc = pcs[(i+4)%7];
    const thirdSemi = ((thirdPc - rootPc) + 12) % 12;
    const fifthSemi = ((fifthPc - rootPc) + 12) % 12;
    const q = fbTriadQuality(thirdSemi, fifthSemi);
    const roman = q.upper ? FB_ROMAN[i] : FB_ROMAN[i].toLowerCase();
    chords.push({
      degree: i+1,
      degreeLabel: degreeLabels[i],
      rootPc, thirdPc, fifthPc,
      rootName: noteNames[i],
      thirdName: noteNames[(i+2)%7],
      fifthName: noteNames[(i+4)%7],
      quality: q.name,
      roman: roman + q.sym,
      chordName: noteNames[i] + q.sym,
      intervals: ['1', FB_INTERVAL_NAMES[thirdSemi], FB_INTERVAL_NAMES[fifthSemi]],
    });
  }
  return chords;
}

function fbFindVoicing(chordPcs){
  const pcsSet = new Set(chordPcs);
  let best = null;
  for(let sf=0; sf<=12; sf++){
    const frets = [];
    for(let si=0; si<6; si++){
      let found = -1;
      for(let f=sf; f<=sf+4 && f<=15; f++){
        if(pcsSet.has(((FB_STRINGS[si].midi+f)%12+12)%12)){ found=f; break; }
      }
      frets.push(found);
    }
    // Mute bass strings that aren't the root
    let bassFound = false;
    for(let si=0; si<6; si++){
      if(frets[si]<0) continue;
      const pc = ((FB_STRINGS[si].midi+frets[si])%12+12)%12;
      if(!bassFound){
        if(pc===chordPcs[0]) bassFound=true;
        else frets[si]=-1;
      }
    }
    const played = frets.filter(f=>f>=0).length;
    if(played<3) continue;
    const bassIdx = frets.findIndex(f=>f>=0);
    const bassPc = bassIdx>=0 ? ((FB_STRINGS[bassIdx].midi+frets[bassIdx])%12+12)%12 : -1;
    const score = played + (bassPc===chordPcs[0]?3:0);
    if(!best || score>best.score) best={frets:[...frets], startFret:sf, score};
    if(score>=9) break;
  }
  return best || {frets:[-1,-1,-1,-1,-1,-1], startFret:0, score:0};
}

function fbDrawMiniDiagram(chordPcs){
  const v = fbFindVoicing(chordPcs);
  const sl=8, st=12, sg=8, fg=12, nf=4;
  const w=sl+5*sg+8, h=st+nf*fg+8;
  let s = `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">`;
  // Nut or top fret
  const isNut = v.startFret===0;
  s+=`<line x1="${sl}" y1="${st}" x2="${sl+5*sg}" y2="${st}" stroke="${isNut?'#aaa':'#444'}" stroke-width="${isNut?3:1}"/>`;
  for(let f=1;f<=nf;f++){
    const y=st+f*fg;
    s+=`<line x1="${sl}" y1="${y}" x2="${sl+5*sg}" y2="${y}" stroke="#444" stroke-width="1"/>`;
  }
  for(let si=0;si<6;si++){
    const x=sl+si*sg;
    s+=`<line x1="${x}" y1="${st}" x2="${x}" y2="${st+nf*fg}" stroke="#555" stroke-width="1"/>`;
  }
  if(v.startFret>0){
    s+=`<text x="2" y="${st+fg*0.5}" fill="#888" font-size="7" font-family="Inter,sans-serif" dominant-baseline="central">${v.startFret}</text>`;
  }
  for(let si=0;si<6;si++){
    const x=sl+si*sg;
    const f=v.frets[si];
    if(f<0){
      s+=`<text x="${x}" y="${st-3}" text-anchor="middle" fill="#555" font-size="7" font-family="Inter,sans-serif">×</text>`;
      continue;
    }
    if(f===0 && isNut){
      s+=`<circle cx="${x}" cy="${st-4}" r="2.5" fill="none" stroke="#999" stroke-width="1"/>`;
      continue;
    }
    const rel = f-v.startFret;
    if(rel>=1 && rel<=nf){
      const cy=st+(rel-0.5)*fg;
      const pc=((FB_STRINGS[si].midi+f)%12+12)%12;
      const isRoot = pc===chordPcs[0];
      s+=`<circle cx="${x}" cy="${cy}" r="3.5" fill="${isRoot?'var(--accent)':'#e0e0e0'}"/>`;
    }
  }
  s+='</svg>';
  return s;
}

function fbRenderDiatonicPanel(){
  const panel = document.getElementById('fb-diatonic-panel');
  if(!panel) return;
  if(!['modes','harmonic','hungarian'].includes(fbView)){
    panel.style.display='none'; return;
  }
  panel.style.display='';

  let chords, compChords=null, scaleLabel;

  if(fbView==='modes'){
    const pcs=[0,2,4,5,7,9,11];
    const names=['C','D','E','F','G','A','B'];
    const allDegLabels = [
      ['1','2','3','4','5','6','7'],
      ['1','2','♭3','4','5','6','♭7'],
      ['1','♭2','♭3','4','5','♭6','♭7'],
      ['1','2','3','♯4','5','6','7'],
      ['1','2','3','4','5','6','♭7'],
      ['1','2','♭3','4','5','♭6','♭7'],
      ['1','♭2','♭3','4','♭5','♭6','♭7'],
    ];
    const modeIdx = fbSelected ? FB_MODES.findIndex(m=>m===fbSelected) : 0;
    const rPcs=[], rNames=[], rDegs=[];
    for(let i=0;i<7;i++){
      rPcs.push(pcs[(modeIdx+i)%7]);
      rNames.push(names[(modeIdx+i)%7]);
      rDegs.push(allDegLabels[modeIdx][i]);
    }
    chords = fbComputeDiatonicChords(rPcs, rNames, rDegs);
    scaleLabel = fbSelected ? `${fbSelected.root} ${fbSelected.name}` : 'C Major';
  } else if(fbView==='harmonic'){
    chords = fbComputeDiatonicChords(
      [9,11,0,2,4,5,8], ['A','B','C','D','E','F','G♯'], ['1','2','♭3','4','5','♭6','7']);
    scaleLabel = 'A Harmonic Minor';
    compChords = fbComputeDiatonicChords(
      [9,11,0,2,4,5,7], ['A','B','C','D','E','F','G'], ['1','2','♭3','4','5','♭6','♭7']);
  } else {
    chords = fbComputeDiatonicChords(
      [9,11,0,3,4,5,8], ['A','B','C','D♯','E','F','G♯'], ['1','2','♭3','♯4','5','♭6','7']);
    scaleLabel = 'A Hungarian Minor';
    compChords = fbComputeDiatonicChords(
      [9,11,0,2,4,5,7], ['A','B','C','D','E','F','G'], ['1','2','♭3','4','5','♭6','♭7']);
  }

  let h = `<div style="font-size:11px;font-weight:600;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.5rem;">Diatonic triads — ${scaleLabel}</div>`;
  h += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;margin-bottom:0.5rem;">';
  chords.forEach((ch,i)=>{
    const isDiff = compChords && ch.quality!==compChords[i].quality;
    const border = isDiff ? 'var(--accent-dim)' : 'var(--border)';
    h+=`<div style="background:var(--bg-raised);border:1px solid ${border};border-radius:var(--radius);padding:8px 4px;text-align:center;">`;
    h+=`<div style="font-size:10px;color:var(--text-dim);font-family:var(--mono);margin-bottom:2px;">${ch.degreeLabel}</div>`;
    h+=`<div style="font-size:15px;font-weight:600;color:var(--text);font-family:var(--mono);">${ch.roman}</div>`;
    h+=`<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${ch.chordName}</div>`;
    h+=`<div style="font-size:10px;color:var(--text-dim);font-family:var(--mono);margin-top:2px;">${ch.intervals.join(' ')}</div>`;
    h+=`<div style="display:flex;justify-content:center;margin-top:4px;">${fbDrawMiniDiagram([ch.rootPc,ch.thirdPc,ch.fifthPc])}</div>`;
    h+='</div>';
  });
  h+='</div>';

  if(compChords){
    const hasDiffs = chords.some((ch,i)=>ch.quality!==compChords[i].quality);
    if(hasDiffs){
      h+=`<div style="font-size:11px;font-weight:600;color:var(--text-dim);letter-spacing:0.08em;text-transform:uppercase;margin-bottom:0.4rem;margin-top:0.75rem;">Differences from A Natural Minor</div>`;
      h+='<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;">';
      compChords.forEach((nat,i)=>{
        const ch=chords[i];
        if(ch.quality===nat.quality){ h+='<div></div>'; return; }
        h+=`<div style="background:var(--bg-surface);border:1px solid var(--border);border-radius:var(--radius);padding:6px 4px;text-align:center;">`;
        h+=`<div style="font-size:9px;color:var(--text-dim);text-transform:uppercase;">Natural</div>`;
        h+=`<div style="font-size:12px;color:var(--red-text);font-family:var(--mono);text-decoration:line-through;">${nat.roman}</div>`;
        h+=`<div style="font-size:9px;color:var(--text-dim);text-transform:uppercase;margin-top:3px;">${scaleLabel.split(' ')[1]}</div>`;
        h+=`<div style="font-size:12px;color:var(--green-text);font-family:var(--mono);">${ch.roman}</div>`;
        h+='</div>';
      });
      h+='</div>';
    }
  }

  panel.innerHTML = h;
}

export { fbSetView, fbSetKey, fbSetPentaKey, fbSetNumMode, fbRender };
export { fbToggleBlues, fbToggleNoteNames, fbToggleSevenths };
export { fbBuildPills, fbBuildShapePills, fbBuildChordPills, fbBuildDimPills };
export { fbBuildHarmPills, fbBuildHungPills };
export { fbRenderDiatonicPanel };
