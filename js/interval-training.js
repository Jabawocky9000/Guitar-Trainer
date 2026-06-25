import { NN_STRING_MIDI, NN_STRING_NAMES } from './data.js';
import { isCorrect, getEnharmonics } from './helpers.js';

// ── INTERVAL TRAINING ─────────────────────────────────────────────────────

const IT_INTERVALS = [
  { name:'m2',  label:'Minor 2nd',       semis:1  },
  { name:'M2',  label:'Major 2nd',       semis:2  },
  { name:'m3',  label:'Minor 3rd',       semis:3  },
  { name:'M3',  label:'Major 3rd',       semis:4  },
  { name:'P4',  label:'Perfect 4th',     semis:5  },
  { name:'TT',  label:'Tritone (♭5)',    semis:6  },
  { name:'P5',  label:'Perfect 5th',     semis:7  },
  { name:'m6',  label:'Minor 6th',       semis:8  },
  { name:'M6',  label:'Major 6th',       semis:9  },
  { name:'m7',  label:'Minor 7th',       semis:10 },
  { name:'M7',  label:'Major 7th',       semis:11 },
  { name:'Oct', label:'Octave',          semis:12 },
];

// Chromatic note names for display and lookup
const IT_NOTES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
// Enharmonic spellings accepted as correct answers (pc → accepted names)
const IT_ENHARMONICS = [
  ['C'],['C♯','Db','D♭'],['D'],['D♯','Eb','E♭'],['E','Fb'],
  ['F','E♯'],['F♯','Gb','G♭'],['G'],['G♯','Ab','A♭'],['A'],
  ['A♯','Bb','B♭'],['B','Cb']
];

let itActiveIntervals = new Set(IT_INTERVALS.map(i=>i.name)); // all on by default
let itDirection = 'asc'; // 'asc' | 'desc' | 'both'
let itCurrentInterval = null;
let itCurrentRoot = null;
let itCurrentDir = 'asc'; // actual direction for current question
let itAnswered = false;
let itScore = 0, itStreak = 0, itTotal = 0;

function itBuildIntervalBtns(){
  const wrap = document.getElementById('it-interval-btns');
  if(!wrap) return;
  wrap.innerHTML = '';
  IT_INTERVALS.forEach(iv => {
    const btn = document.createElement('button');
    btn.id = `it-iv-btn-${iv.name}`;
    btn.title = iv.label;
    btn.textContent = iv.name;
    btn.style.cssText = `padding:6px 11px;border-radius:var(--radius);font-size:12px;font-family:var(--mono);
      font-weight:600;cursor:pointer;transition:all 0.1s;border:1px solid var(--accent-dim);
      background:var(--accent-bg);color:var(--accent);`;
    btn.onclick = () => itToggleInterval(iv.name);
    wrap.appendChild(btn);
  });
}

function itRefreshIntervalBtns(){
  IT_INTERVALS.forEach(iv => {
    const btn = document.getElementById(`it-iv-btn-${iv.name}`);
    if(!btn) return;
    if(itActiveIntervals.has(iv.name)){
      btn.style.background  = 'var(--accent-bg)';
      btn.style.borderColor = 'var(--accent-dim)';
      btn.style.color       = 'var(--accent)';
    } else {
      btn.style.background  = 'transparent';
      btn.style.borderColor = 'var(--border-mid)';
      btn.style.color       = 'var(--text-dim)';
    }
  });
}

function itToggleInterval(name){
  if(itActiveIntervals.has(name) && itActiveIntervals.size === 1) return; // keep at least one
  if(itActiveIntervals.has(name)) itActiveIntervals.delete(name);
  else itActiveIntervals.add(name);
  itRefreshIntervalBtns();
}

function itSetDir(d){
  itDirection = d;
  const btns = {
    asc:  document.getElementById('it-dir-asc'),
    both: document.getElementById('it-dir-both'),
    desc: document.getElementById('it-dir-desc'),
  };
  Object.entries(btns).forEach(([key, btn]) => {
    if(!btn) return;
    if(key === d){
      btn.style.background  = 'var(--accent-bg)';
      btn.style.borderColor = 'var(--accent-dim)';
      btn.style.color       = 'var(--accent)';
      btn.style.border      = '1px solid var(--accent-dim)';
    } else {
      btn.style.background  = 'transparent';
      btn.style.borderColor = 'var(--border-mid)';
      btn.style.color       = 'var(--text-muted)';
      btn.style.border      = '1px solid var(--border-mid)';
    }
  });
  // Fix border joins
  if(btns.asc)  btns.asc.style.borderRadius  = 'var(--radius) 0 0 var(--radius)';
  if(btns.both) { btns.both.style.borderLeft = 'none'; btns.both.style.borderRight = 'none'; btns.both.style.borderRadius = '0'; }
  if(btns.desc) { btns.desc.style.borderLeft = 'none'; btns.desc.style.borderRadius = '0 var(--radius) var(--radius) 0'; }
}

function itPickQuestion(){
  const pool = [...itActiveIntervals];
  const name = pool[Math.floor(Math.random() * pool.length)];
  itCurrentInterval = IT_INTERVALS.find(i => i.name === name);
  itCurrentRoot = Math.floor(Math.random() * 12); // 0–11
  if(itDirection === 'both'){
    itCurrentDir = Math.random() < 0.5 ? 'asc' : 'desc';
  } else {
    itCurrentDir = itDirection;
  }
}

function itGetAnswer(){
  const semi = itCurrentInterval.semis;
  let pc;
  if(itCurrentDir === 'asc'){
    pc = (itCurrentRoot + semi) % 12;
  } else {
    pc = ((itCurrentRoot - semi) % 12 + 12) % 12;
  }
  return pc;
}

function itRenderQuestion(){
  const ivEl   = document.getElementById('it-interval-display');
  const rootEl = document.getElementById('it-root-display');
  const dirEl  = document.getElementById('it-dir-display');
  if(ivEl)   ivEl.textContent   = itCurrentInterval ? itCurrentInterval.name : '—';
  if(rootEl) rootEl.textContent = itCurrentRoot !== null ? IT_NOTES[itCurrentRoot] : '—';
  if(dirEl)  dirEl.textContent  = itCurrentDir === 'asc' ? '↑ Ascending' : '↓ Descending';
}

function itCheckInput(val){
  const answerPc = itGetAnswer();
  const accepted = IT_ENHARMONICS[answerPc];
  const norm = val.trim().replace('b','♭').replace('#','♯');
  return accepted.some(a => a.toLowerCase() === norm.toLowerCase());
}

function itNext(){
  itAnswered = false;
  itPickQuestion();
  itRenderQuestion();
  const inp = document.getElementById('it-input');
  const fb  = document.getElementById('it-fb');
  if(inp){
    inp.value = '';
    inp.className = '';
    inp.style.borderColor = 'var(--border-mid)';
    inp.style.background  = 'var(--bg-raised)';
    inp.style.color       = 'var(--text)';
    setTimeout(()=>inp.focus(), 50);
  }
  if(fb){ fb.textContent = ''; fb.className = 'feedback'; }
}

function itCheck(){
  if(itAnswered) return;
  const inp = document.getElementById('it-input');
  const fb  = document.getElementById('it-fb');
  if(!inp || !fb) return;
  const val = inp.value.trim();
  if(!val){ fb.textContent = 'Type a note name first.'; fb.className = 'feedback'; return; }

  const correct = itCheckInput(val);
  itAnswered = true;
  itTotal++;

  if(correct){
    itScore++;
    itStreak++;
    inp.style.borderColor = 'var(--green-border)';
    inp.style.background  = 'var(--green-bg)';
    inp.style.color       = 'var(--green-text)';
    fb.textContent = '✓ Correct!';
    fb.className   = 'feedback good';
  } else {
    itStreak = 0;
    inp.style.borderColor = 'var(--red-border)';
    inp.style.background  = 'var(--red-bg)';
    inp.style.color       = 'var(--red-text)';
    const answerPc = itGetAnswer();
    const names = IT_ENHARMONICS[answerPc].join(' / ');
    fb.textContent = `✗  ${names}`;
    fb.className   = 'feedback bad';
  }
  itUpdateStats();
}

function itReveal(){
  if(itAnswered) return;
  itAnswered = true;
  itTotal++;
  itStreak = 0;
  const inp = document.getElementById('it-input');
  const fb  = document.getElementById('it-fb');
  const answerPc = itGetAnswer();
  const names = IT_ENHARMONICS[answerPc];
  if(inp){
    inp.value = names[0];
    inp.style.borderColor = 'var(--green-border)';
    inp.style.background  = 'var(--green-bg)';
    inp.style.color       = 'var(--green-text)';
  }
  if(fb){ fb.textContent = `Answer: ${names.join(' / ')}`; fb.className = 'feedback'; }
  itUpdateStats();
}

function itUpdateStats(){
  const s = document.getElementById('it-score');
  const st = document.getElementById('it-streak');
  const t = document.getElementById('it-total');
  if(s)  s.textContent  = itScore;
  if(st) st.textContent = itStreak;
  if(t)  t.textContent  = itTotal;
}

let itInitialised = false;

export function initIntervalTraining() {
  if (itInitialised) return;
  itInitialised = true;
  itBuildIntervalBtns();
  itBuildRootBtns();
  itSetDir('asc');
  itNext();
  itRenderIntervalFretboard();
}

// ── INTERVAL FRETBOARD (selectable root = 1) ────────────────────────────────
// All dots uniform green; root highlighted in gold. User can pick any of the 12 notes as root.

let itFbVisible = true;
let itFbRoot = 9; // default: A (pc 9)

// The 12 chromatic note labels for the root selector
const IT_ROOT_NOTES = [
  {label:'C', pc:0},{label:'C♯', pc:1},{label:'D', pc:2},{label:'E♭', pc:3},
  {label:'E', pc:4},{label:'F', pc:5},{label:'F♯', pc:6},{label:'G', pc:7},
  {label:'A♭', pc:8},{label:'A', pc:9},{label:'B♭', pc:10},{label:'B', pc:11},
];

// Interval names from root. Semitones 0–11:
// 0=1(root/unison), 1=m2, 2=M2, 3=m3, 4=M3, 5=P4, 6=TT, 7=P5, 8=m6, 9=M6, 10=m7, 11=M7
const IT_INTERVAL_LABELS = ['1','m2','M2','m3','M3','P4','TT','P5','m6','M6','m7','M7'];

function itBuildRootBtns(){
  const wrap = document.getElementById('it-root-btns');
  if(!wrap) return;
  wrap.innerHTML = '';
  IT_ROOT_NOTES.forEach(n => {
    const b = document.createElement('button');
    b.id = `it-root-btn-${n.pc}`;
    b.textContent = n.label;
    b.style.cssText = `padding:4px 9px;border-radius:var(--radius);font-size:12px;font-family:var(--mono);
      font-weight:500;cursor:pointer;transition:all 0.1s;border:1px solid var(--border-mid);
      background:transparent;color:var(--text-muted);white-space:nowrap;`;
    b.onclick = () => itSetFbRoot(n.pc);
    wrap.appendChild(b);
  });
  itRefreshRootBtns();
}

function itRefreshRootBtns(){
  IT_ROOT_NOTES.forEach(n => {
    const b = document.getElementById(`it-root-btn-${n.pc}`);
    if(!b) return;
    if(n.pc === itFbRoot){
      b.style.background  = 'var(--accent-bg)';
      b.style.borderColor = 'var(--accent-dim)';
      b.style.color       = 'var(--accent)';
    } else {
      b.style.background  = 'transparent';
      b.style.borderColor = 'var(--border-mid)';
      b.style.color       = 'var(--text-muted)';
    }
  });
}

function itSetFbRoot(pc){
  itFbRoot = pc;
  itRefreshRootBtns();
  // Update label
  const lbl = IT_ROOT_NOTES.find(n => n.pc === pc)?.label ?? 'A';
  const span = document.querySelector('#interval-training .card:last-child span');
  itRenderIntervalFretboard();
}

function itRenderIntervalFretboard(){
  const svg = document.getElementById('it-fb-svg');
  if(!svg) return;

  const ROOT_PC = itFbRoot;
  const LEFT=62, TOP=20, FW=48, SH=24, NUT=6, R=9;
  const NSTRINGS=6, NFRETS=12;
  const W = LEFT + NUT + NFRETS*FW + 30;
  const H = TOP + (NSTRINGS-1)*SH + 36;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = '';

  function el(tag, attrs, text){
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if(text !== undefined) e.textContent = text;
    return e;
  }
  function strY(s){ return TOP + (NSTRINGS-1-s)*SH; }

  // Bg + nut
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT+NFRETS*FW, height:(NSTRINGS-1)*SH+SH*.9, fill:'#1a1a1a', rx:8}));
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT, height:(NSTRINGS-1)*SH+SH*.9, fill:'#aaa', rx:2, opacity:.45}));

  // Fret bars + numbers
  for(let f=1; f<=NFRETS; f++){
    const x = LEFT+NUT+f*FW;
    svg.appendChild(el('line',{x1:x, y1:TOP-SH*.42, x2:x, y2:TOP+(NSTRINGS-1)*SH+SH*.42,
      stroke:'#3a3a3a', 'stroke-width':f===12?2.5:1.2, opacity:f===12?.8:.5}));
    svg.appendChild(el('text',{x:LEFT+NUT+(f-.5)*FW, y:TOP+(NSTRINGS-1)*SH+SH*.76,
      'text-anchor':'middle','dominant-baseline':'central',fill:'#555','font-size':'11','font-family':'Inter,sans-serif'}, f));
  }

  // Position markers
  [3,5,7,9,12].forEach(f => {
    const cx = LEFT+NUT+(f-.5)*FW;
    if(f===12){
      [1.5,3.5].forEach(sy => svg.appendChild(el('circle',{cx, cy:TOP+sy*SH, r:4, fill:'#333', opacity:.7})));
    } else {
      svg.appendChild(el('circle',{cx, cy:TOP+2.5*SH, r:4, fill:'#333', opacity:.7}));
    }
  });

  // Strings + labels
  const STRING_MIDI  = [40,45,50,55,59,64];
  const STRING_NAMES = ['E₂','A₂','D₃','G₃','B₃','E₄'];
  for(let s=0; s<NSTRINGS; s++){
    const y = strY(s);
    svg.appendChild(el('line',{x1:LEFT+NUT, y1:y, x2:LEFT+NUT+NFRETS*FW, y2:y,
      stroke:'#777','stroke-width':(2.2-s*.28).toFixed(2),opacity:.6}));
    svg.appendChild(el('text',{x:LEFT-6, y, 'text-anchor':'end','dominant-baseline':'central',
      fill:'#777','font-size':'11','font-family':'Inter,sans-serif'}, STRING_NAMES[s]));
  }

  // Dots: uniform green, root highlighted in gold
  const GREEN_FILL   = '#0d1f18';
  const GREEN_STROKE = '#2a7a55';
  const GREEN_TEXT   = '#6dba99';
  const ROOT_FILL    = '#3a2a08';
  const ROOT_STROKE  = '#c8a96e';
  const ROOT_TEXT    = '#c8a96e';

  for(let s=0; s<NSTRINGS; s++){
    const midi = STRING_MIDI[s];
    for(let f=1; f<=NFRETS; f++){
      const notepc = ((midi + f) % 12 + 12) % 12;
      const semi   = ((notepc - ROOT_PC) % 12 + 12) % 12;
      const label  = IT_INTERVAL_LABELS[semi];
      const isRoot = semi === 0;
      const fill   = isRoot ? ROOT_FILL   : GREEN_FILL;
      const stroke = isRoot ? ROOT_STROKE : GREEN_STROKE;
      const text   = isRoot ? ROOT_TEXT   : GREEN_TEXT;
      const cx = LEFT + NUT + (f-.5)*FW;
      const cy = strY(s);

      svg.appendChild(el('circle',{cx, cy, r:R, fill, stroke, 'stroke-width': isRoot ? '1.8' : '1.4'}));
      // Font size: 3-char label (m2 etc) → 7.5, 1-char (1) → 10
      const fs = label.length >= 3 ? '7' : label.length === 2 ? '7.5' : '10';
      svg.appendChild(el('text',{x:cx, y:cy, 'text-anchor':'middle','dominant-baseline':'central',
        'font-size':fs,'font-weight':'600',fill:text,'font-family':'Inter Mono,monospace'}, label));
    }
  }
}

function itToggleFretboard(){
  itFbVisible = !itFbVisible;
  const wrap  = document.getElementById('it-fb-wrap');
  const tog   = document.getElementById('it-fb-toggle');
  const thumb = document.getElementById('it-fb-thumb');
  const txt   = document.getElementById('it-fb-text');
  if(itFbVisible){
    wrap.style.display   = '';
    tog.style.background   = '#0d1f10';
    tog.style.borderColor  = '#2a6a40';
    thumb.style.left       = '18px';
    thumb.style.background = '#4db36d';
    if(txt){ txt.textContent = 'Hide diagram'; txt.style.color = '#7fd49f'; }
  } else {
    wrap.style.display   = 'none';
    tog.style.background   = '#222';
    tog.style.borderColor  = '#3a3a3a';
    thumb.style.left       = '2px';
    thumb.style.background = '#888';
    if(txt){ txt.textContent = 'Show diagram'; txt.style.color = 'var(--text-muted)'; }
  }
}


export { itSetDir, itNext, itCheck, itReveal, itToggleFretboard };
export { itBuildIntervalBtns, itBuildRootBtns, itRenderIntervalFretboard, itSetFbRoot };
