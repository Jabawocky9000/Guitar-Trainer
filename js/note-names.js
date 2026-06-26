import { STRINGS, DISPLAY_ORDER, NN_STRING_MIDI, NN_STRING_NAMES } from './data.js';
import { isCorrect, getEnharmonics } from './helpers.js';

let currentFret = 3;
let nnUseDots = false; // when true, restrict random frets to position dots: 0,3,5,7,9,12

function nextRandomFret(){
  if(nnUseDots){
    const dotFrets = [0,3,5,7,9,12];
    currentFret = dotFrets[Math.floor(Math.random() * dotFrets.length)];
  } else {
    currentFret = Math.floor(Math.random() * 13); // 0–12 inclusive
  }
  const fretEl = document.getElementById('fret-display');
  fretEl.textContent = currentFret === 0 ? '0' : currentFret;
  clearNotes();
  renderVqRows();
  // focus first input (6th string)
  const first = document.getElementById('ni-0');
  if(first) first.focus();
}

function renderVqRows(){
  const c=document.getElementById('vq-rows'); c.innerHTML='';
  // Use a 3-column grid: strings ordered low→high, left→right then wrapping
  // DISPLAY_ORDER is [5,4,3,2,1,0] = 6th(low E), 5th, 4th, 3rd, 2nd, 1st(high e)
  const grid = document.createElement('div'); grid.className = 'vq-grid';
  DISPLAY_ORDER.forEach((si, displayIdx)=>{
    const s = STRINGS[si];
    const cell = document.createElement('div'); cell.className = 'vq-cell';
    const lbl = document.createElement('div'); lbl.className = 'string-lbl'; lbl.textContent = s.name;
    const inp = document.createElement('input'); inp.type='text'; inp.className='note-inp';
    inp.id=`ni-${displayIdx}`; inp.placeholder='?'; inp.autocomplete='off'; inp.spellcheck=false;
    inp.onkeydown=e=>{
      if(e.key==='Enter'){
        const next=document.getElementById(`ni-${displayIdx+1}`);
        if(next) next.focus(); else checkNotes();
      }
    };
    cell.appendChild(lbl);
    cell.appendChild(inp);
    grid.appendChild(cell);
  });
  c.appendChild(grid);
  document.getElementById('note-fb').textContent='';
}

function checkNotes(){
  let ok=0, filled=0;
  DISPLAY_ORDER.forEach((si, displayIdx)=>{
    const s=STRINGS[si];
    const inp=document.getElementById(`ni-${displayIdx}`);
    if(!inp.value.trim()) return;
    filled++;
    const correct=isCorrect(inp.value, s.midi, currentFret);
    inp.className='note-inp '+(correct?'correct':'wrong');
    if(correct) ok++;
  });
  const fb=document.getElementById('note-fb');
  if(!filled){fb.textContent='Enter some notes first.';fb.className='feedback';return;}
  if(ok===STRINGS.length){fb.textContent=`✓ All ${STRINGS.length} correct!`;fb.className='feedback good';setTimeout(nextRandomFret,1000);}
  else{fb.textContent=`${ok}/${filled} correct`;fb.className='feedback bad';}
}

function revealNotes(){
  DISPLAY_ORDER.forEach((si, displayIdx)=>{
    const s=STRINGS[si];
    const inp=document.getElementById(`ni-${displayIdx}`);
    inp.value=getEnharmonics(s.midi,currentFret)[0];
    inp.className='note-inp correct';
  });
  document.getElementById('note-fb').textContent='';
}

function clearNotes(){
  DISPLAY_ORDER.forEach((_,displayIdx)=>{
    const inp=document.getElementById(`ni-${displayIdx}`);
    if(inp){ inp.value=''; inp.className='note-inp'; }
  });
  document.getElementById('note-fb').textContent='';
}

function nnToggleDots(){
  nnUseDots = !nnUseDots;
  const tog   = document.getElementById('nn-dots-toggle');
  const thumb = document.getElementById('nn-dots-thumb');
  const txt   = document.getElementById('nn-dots-text');
  if(nnUseDots){
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
  nextRandomFret(); // immediately pick a new fret under the new mode
}

// ── NOTE NAMES MODE TOGGLE ─────────────────────────────────────────────────

let nnMode = 'across'; // 'across' | 'single'

function nnSetMode(m){
  nnMode = m;
  const btnAcross = document.getElementById('nn-mode-across');
  const btnSingle = document.getElementById('nn-mode-single');
  const panelAcross = document.getElementById('nn-panel-across');
  const panelSingle = document.getElementById('nn-panel-single');

  const activeStyle  = 'padding:8px 22px;border:1px solid var(--accent-dim);border-radius:';
  const acrossRadius = 'var(--radius) 0 0 var(--radius)';
  const singleRadius = '0 var(--radius) var(--radius) 0';

  if(m === 'across'){
    btnAcross.style.cssText = `padding:8px 22px;border:1px solid var(--accent-dim);border-radius:${acrossRadius};background:var(--accent-bg);color:var(--accent);cursor:pointer;font-size:13px;font-weight:500;font-family:var(--font);transition:all 0.1s;`;
    btnSingle.style.cssText = `padding:8px 22px;border:1px solid var(--border-mid);border-left:none;border-radius:${singleRadius};background:transparent;color:var(--text-muted);cursor:pointer;font-size:13px;font-weight:500;font-family:var(--font);transition:all 0.1s;`;
    panelAcross.style.display = '';
    panelSingle.style.display = 'none';
  } else {
    btnAcross.style.cssText = `padding:8px 22px;border:1px solid var(--border-mid);border-radius:${acrossRadius};background:transparent;color:var(--text-muted);cursor:pointer;font-size:13px;font-weight:500;font-family:var(--font);transition:all 0.1s;`;
    btnSingle.style.cssText = `padding:8px 22px;border:1px solid var(--accent-dim);border-left:none;border-radius:${singleRadius};background:var(--accent-bg);color:var(--accent);cursor:pointer;font-size:13px;font-weight:500;font-family:var(--font);transition:all 0.1s;`;
    panelAcross.style.display = 'none';
    panelSingle.style.display = '';
    // Initialise single-string game on first open if needed
    if(!ssInitialised) ssInit();
  }
}

// ── SINGLE STRING GAME ─────────────────────────────────────────────────────

// String data: index 0 = low E (6th string), 5 = high e (1st string)
const SS_STRINGS = [
  { label:'6th  E₂', name:'E₂', midi:40 },
  { label:'5th  A₂', name:'A₂', midi:45 },
  { label:'4th  D₃', name:'D₃', midi:50 },
  { label:'3rd  G₃', name:'G₃', midi:55 },
  { label:'2nd  B₃', name:'B₃', midi:59 },
  { label:'1st  E₄', name:'E₄', midi:64 },
];

// Position-dot frets (includes 0 = open, 8, 10, 12)
const SS_DOT_FRETS   = [0, 3, 5, 7, 8, 10, 12];
const SS_ALL_FRETS   = Array.from({length:13}, (_,i) => i); // 0–12

let ssInitialised    = false;
let ssActiveStrings  = new Set([0,1,2,3,4,5]); // all on by default
let ssDotsOnly       = false;
let ssCurrentString  = 0;   // index into SS_STRINGS
let ssCurrentFret    = 0;
let ssAnswered       = false;

function ssInit(){
  ssInitialised = true;
  ssBuildStringBtns();
  ssRenderRefFretboard();
  ssNext();
}

function ssBuildStringBtns(){
  const wrap = document.getElementById('ss-string-btns');
  if(!wrap) return;
  wrap.innerHTML = '';
  SS_STRINGS.forEach((s, i) => {
    const btn = document.createElement('button');
    btn.id = `ss-str-btn-${i}`;
    btn.textContent = s.label;
    btn.style.cssText = `padding:6px 12px;border-radius:var(--radius);font-size:12px;font-family:var(--mono);
      font-weight:500;cursor:pointer;transition:all 0.1s;border:1px solid var(--border-mid);
      background:var(--accent-bg);border-color:var(--accent-dim);color:var(--accent);`;
    btn.onclick = () => ssToggleString(i);
    wrap.appendChild(btn);
  });
  ssRefreshStringBtns();
}

function ssRefreshStringBtns(){
  SS_STRINGS.forEach((_, i) => {
    const btn = document.getElementById(`ss-str-btn-${i}`);
    if(!btn) return;
    if(ssActiveStrings.has(i)){
      btn.style.background   = 'var(--accent-bg)';
      btn.style.borderColor  = 'var(--accent-dim)';
      btn.style.color        = 'var(--accent)';
    } else {
      btn.style.background   = 'transparent';
      btn.style.borderColor  = 'var(--border-mid)';
      btn.style.color        = 'var(--text-dim)';
    }
  });
}

function ssToggleString(i){
  // Must keep at least one string active
  if(ssActiveStrings.has(i) && ssActiveStrings.size === 1) return;
  if(ssActiveStrings.has(i)) ssActiveStrings.delete(i);
  else ssActiveStrings.add(i);
  ssRefreshStringBtns();
  ssNext();
}

function ssToggleDots(){
  ssDotsOnly = !ssDotsOnly;
  const tog   = document.getElementById('ss-dots-toggle');
  const thumb = document.getElementById('ss-dots-thumb');
  const txt   = document.getElementById('ss-dots-text');
  if(ssDotsOnly){
    tog.style.background  = '#1a1025';
    tog.style.borderColor = '#7a5ab0';
    thumb.style.left      = '18px';
    thumb.style.background= '#a07ad4';
    if(txt) txt.style.color = '#b8a0e0';
  } else {
    tog.style.background  = '#222';
    tog.style.borderColor = '#3a3a3a';
    thumb.style.left      = '2px';
    thumb.style.background= '#888';
    if(txt) txt.style.color = 'var(--text-muted)';
  }
  ssNext();
}

function ssPickQuestion(){
  // Pick a random active string
  const active = [...ssActiveStrings];
  ssCurrentString = active[Math.floor(Math.random() * active.length)];
  // Pick a random fret from the allowed set
  const pool = ssDotsOnly ? SS_DOT_FRETS : SS_ALL_FRETS;
  ssCurrentFret = pool[Math.floor(Math.random() * pool.length)];
}

function ssNext(){
  ssAnswered = false;
  ssPickQuestion();
  // Reset input
  const inp = document.getElementById('ss-input');
  if(inp){
    inp.value = '';
    inp.className = '';
    inp.style.borderColor = 'var(--border-mid)';
    inp.style.background  = 'var(--bg-raised)';
    inp.style.color       = 'var(--text)';
  }
  const fb = document.getElementById('ss-fb');
  if(fb){ fb.textContent = ''; fb.className = 'feedback'; }
  ssRenderFretboard();
  if(inp) setTimeout(()=>inp.focus(), 50);
}

function ssCheck(){
  if(ssAnswered) return;
  const inp = document.getElementById('ss-input');
  const fb  = document.getElementById('ss-fb');
  if(!inp || !fb) return;
  const val = inp.value.trim();
  if(!val){ fb.textContent = 'Type a note name first.'; fb.className = 'feedback'; return; }

  const s = SS_STRINGS[ssCurrentString];
  const correct = isCorrect(val, s.midi, ssCurrentFret);
  ssAnswered = true;

  if(correct){
    inp.style.borderColor = 'var(--green-border)';
    inp.style.background  = 'var(--green-bg)';
    inp.style.color       = 'var(--green-text)';
    fb.textContent = '✓ Correct!';
    fb.className   = 'feedback good';
    setTimeout(ssNext, 1000);
  } else {
    inp.style.borderColor = 'var(--red-border)';
    inp.style.background  = 'var(--red-bg)';
    inp.style.color       = 'var(--red-text)';
    const enhs = getEnharmonics(s.midi, ssCurrentFret);
    fb.textContent = `✗  ${enhs.join(' / ')}`;
    fb.className   = 'feedback bad';
    ssRenderFretboard(true);
  }
}

function ssReveal(){
  ssAnswered = true;
  const inp = document.getElementById('ss-input');
  const fb  = document.getElementById('ss-fb');
  const s   = SS_STRINGS[ssCurrentString];
  const enhs = getEnharmonics(s.midi, ssCurrentFret);
  if(inp){
    inp.value = enhs[0];
    inp.style.borderColor = 'var(--green-border)';
    inp.style.background  = 'var(--green-bg)';
    inp.style.color       = 'var(--green-text)';
  }
  if(fb){ fb.textContent = ''; fb.className = 'feedback'; }
  ssRenderFretboard(true);
}

// ── Single String fretboard renderer ──────────────────────────────────────

function ssRenderFretboard(revealed){
  const svg = document.getElementById('ss-fb-svg');
  if(!svg) return;

  // Geometry — one string per row but we show all 6 strings dimmed, active one highlighted
  const LEFT=64, TOP=28, FW=48, SH=34, NUT=6, R=11;
  const NSTRINGS=6, NFRETS=12;
  const W = LEFT + NUT + NFRETS*FW + 30;
  const H = TOP + (NSTRINGS-1)*SH + 44;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.innerHTML = '';

  function el(tag, attrs, text){
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if(text !== undefined) e.textContent = text;
    return e;
  }

  // strY: index 0=low E at bottom, 5=high e at top (match guitar orientation)
  function strY(s){ return TOP + (NSTRINGS-1-s)*SH; }

  // Fretboard background
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT+NFRETS*FW,
    height:(NSTRINGS-1)*SH+SH*.9, fill:'#1a1a1a', rx:8}));

  // Nut
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT,
    height:(NSTRINGS-1)*SH+SH*.9, fill:'#aaa', rx:2, opacity:.4}));

  // Fret bars + numbers
  for(let f=1; f<=NFRETS; f++){
    const x = LEFT+NUT+f*FW;
    svg.appendChild(el('line',{x1:x, y1:TOP-SH*.42, x2:x, y2:TOP+(NSTRINGS-1)*SH+SH*.42,
      stroke:'#3a3a3a', 'stroke-width': f===12?2.5:1.2, opacity: f===12?.8:.5}));
    svg.appendChild(el('text',{x:LEFT+NUT+(f-.5)*FW, y:TOP+(NSTRINGS-1)*SH+SH*.78,
      'text-anchor':'middle','dominant-baseline':'central',
      fill:'#555','font-size':'11','font-family':'Inter,sans-serif'}, f));
  }

  // Open string "fret 0" column label
  svg.appendChild(el('text',{x:LEFT+NUT*.5, y:TOP+(NSTRINGS-1)*SH+SH*.78,
    'text-anchor':'middle','dominant-baseline':'central',
    fill:'#444','font-size':'10','font-family':'Inter,sans-serif'}, '0'));

  // Position markers (frets 3 5 7 9 12)
  [3,5,7,9,12].forEach(f => {
    const cx = LEFT+NUT+(f-.5)*FW;
    if(f===12){
      [1.5,3.5].forEach(sy =>
        svg.appendChild(el('circle',{cx, cy:TOP+sy*SH, r:4, fill:'#2a2a2a', opacity:.9})));
    } else {
      svg.appendChild(el('circle',{cx, cy:TOP+2.5*SH, r:4, fill:'#2a2a2a', opacity:.9}));
    }
  });

  // Strings — all 6, active one brighter
  for(let s=0; s<NSTRINGS; s++){
    const y       = strY(s);
    const isActive = s === ssCurrentString;
    const thick   = (2.2 - s*.28).toFixed(2);
    const opacity = isActive ? 0.9 : 0.25;
    const stroke  = isActive ? '#aaa' : '#666';
    svg.appendChild(el('line',{x1:LEFT+NUT, y1:y, x2:LEFT+NUT+NFRETS*FW, y2:y,
      stroke, 'stroke-width':thick, opacity}));
    // Open-string extension (nut area)
    svg.appendChild(el('line',{x1:LEFT, y1:y, x2:LEFT+NUT, y2:y,
      stroke:'#777','stroke-width':thick, opacity:isActive?.6:.15}));
    // String label on the left
    svg.appendChild(el('text',{x:LEFT-6, y,
      'text-anchor':'end','dominant-baseline':'central',
      fill: isActive?'#aaa':'#3a3a3a','font-size':'11','font-family':'Inter,sans-serif'},
      SS_STRINGS[s].name));
  }

  // Active string highlight band (subtle)
  {
    const y = strY(ssCurrentString);
    svg.appendChild(el('rect',{
      x:LEFT+NUT, y:y-SH*.45, width:NFRETS*FW, height:SH*.9,
      fill:'#c8a96e', opacity:'.04', rx:3}));
  }

  // Question dot — on the active string, at the chosen fret
  {
    const s  = ssCurrentString;
    const f  = ssCurrentFret;
    const cy = strY(s);
    // cx: fret 0 = open string shown just left of nut, frets 1-12 = between bars
    const cx = f === 0
      ? LEFT - R - 4
      : LEFT + NUT + (f - .5)*FW;

    const dotFill   = revealed ? '#2e5a3a' : '#c8a96e';
    const dotStroke = revealed ? '#4db36d' : '#8a6a2a';
    svg.appendChild(el('circle',{cx, cy, r:R, fill:dotFill, stroke:dotStroke, 'stroke-width':'1.5'}));

    if(revealed){
      // Show answer name(s) inside the dot
      const enhs = getEnharmonics(SS_STRINGS[s].midi, f);
      const primary = enhs[0];
      const enharmonic = enhs[1] ?? null;
      const textFill = '#9fd49f';
      if(enharmonic){
        svg.appendChild(el('text',{cx, cy, x:cx, y:cy-3, 'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'7.5','font-weight':'600',fill:textFill,'font-family':'Inter,sans-serif'}, primary));
        svg.appendChild(el('text',{x:cx, y:cy+4.5,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'7','font-weight':'400',fill:textFill,'font-family':'Inter,sans-serif',opacity:'0.8'}, enharmonic));
      } else {
        svg.appendChild(el('text',{x:cx, y:cy,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'9','font-weight':'500',fill:textFill,'font-family':'Inter,sans-serif'}, primary));
      }
    } else {
      // Show question mark
      svg.appendChild(el('text',{x:cx, y:cy,'text-anchor':'middle','dominant-baseline':'central',
        'font-size':'13','font-weight':'700',fill:'#0f0f0f','font-family':'Inter,sans-serif'}, '?'));
    }
  }
}

function buildFourths(){
  const c=document.getElementById('fourths-wrap');
  const cycle=['C','F','B♭','E♭','A♭','D♭','G♭','B','E','A','D','G'];
  cycle.forEach((n,i)=>{
    const el=document.createElement('div'); el.className='fourth-note'+(i===0?' active':'');
    el.textContent=n; c.appendChild(el);
  });
  let idx=0;
  setInterval(()=>{
    document.querySelectorAll('.fourth-note').forEach((el,i)=>el.classList.toggle('active',i===idx));
    idx=(idx+1)%cycle.length;
  },1200);
}


let nnFretboardVisible = true;

function nnRenderFretboard(){
  const svg = document.getElementById('nn-fb-svg');
  if(!svg) return;

  // Geometry — mirrors the scale map fretboard style (SH/R halved for compact height)
  const LEFT=62, TOP=20, FW=48, SH=24, NUT=6, R=9;
  const NSTRINGS=6, NFRETS=12;  // show frets 1-12 (one octave)
  const W = LEFT + NUT + NFRETS*FW + 30;
  const H = TOP + (NSTRINGS-1)*SH + 36;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  function el(tag, attrs, text){
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if(text !== undefined) e.textContent = text;
    return e;
  }
  // strY: string index 0=low E at bottom, 5=high e at top
  function strY(s){ return TOP + (NSTRINGS-1-s)*SH; }

  svg.innerHTML = '';

  // Fretboard bg
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT+NFRETS*FW, height:(NSTRINGS-1)*SH+SH*.9, fill:'#1a1a1a', rx:8}));
  // Nut
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT, height:(NSTRINGS-1)*SH+SH*.9, fill:'#aaa', rx:2, opacity:.45}));

  // Fret bars + numbers
  for(let f=1; f<=NFRETS; f++){
    const x = LEFT+NUT+f*FW;
    svg.appendChild(el('line',{x1:x, y1:TOP-SH*.42, x2:x, y2:TOP+(NSTRINGS-1)*SH+SH*.42,
      stroke:'#3a3a3a', 'stroke-width':f===12?2.5:1.2, opacity:f===12?.8:.5}));
    const t = el('text',{x:LEFT+NUT+(f-.5)*FW, y:TOP+(NSTRINGS-1)*SH+SH*.76,
      'text-anchor':'middle','dominant-baseline':'central',fill:'#555','font-size':'11','font-family':'Inter,sans-serif'}, f);
    svg.appendChild(t);
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
  for(let s=0; s<NSTRINGS; s++){
    const y = strY(s);
    svg.appendChild(el('line',{x1:LEFT+NUT, y1:y, x2:LEFT+NUT+NFRETS*FW, y2:y,
      stroke:'#777','stroke-width':(2.2-s*.28).toFixed(2),opacity:.6}));
    svg.appendChild(el('text',{x:LEFT-6, y, 'text-anchor':'end','dominant-baseline':'central',
      fill:'#777','font-size':'11','font-family':'Inter,sans-serif'}, NN_STRING_NAMES[s]));
  }

  // Enharmonic pairs for display: pc → [primary, enharmonic]
  const NN_ENHARMONIC_PAIRS = {
    0: ['C',null], 1: ['C♯','D♭'], 2: ['D',null], 3: ['D♯','E♭'], 4: ['E',null],
    5: ['F',null], 6: ['F♯','G♭'], 7: ['G',null], 8: ['G♯','A♭'], 9: ['A',null],
    10: ['A♯','B♭'], 11: ['B',null]
  };

  // Dots: one per string per fret (frets 1–12)
  for(let s=0; s<NSTRINGS; s++){
    const midi = NN_STRING_MIDI[s];
    for(let f=1; f<=NFRETS; f++){
      const notepc = ((midi + f) % 12 + 12) % 12;
      const pair = NN_ENHARMONIC_PAIRS[notepc];
      const primary = pair[0];
      const enharmonic = pair[1];
      const isNatural = !enharmonic; // natural notes have no enharmonic pair
      const cx = LEFT + NUT + (f-.5)*FW;
      const cy = strY(s);

      // Colour: natural notes slightly lighter, accidentals slightly muted
      const fill   = isNatural ? '#2e5a3a' : '#1e3a2a';
      const stroke = isNatural ? '#4db36d' : '#2a7a45';
      const textFill = isNatural ? '#9fd49f' : '#6db38d';

      svg.appendChild(el('circle',{cx, cy, r:R, fill, stroke,'stroke-width':'1.2'}));

      if(enharmonic){
        // Two-line enharmonic display: primary above centre, enharmonic below
        svg.appendChild(el('text',{x:cx, y:cy-3,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'7.5','font-weight':'600',fill:textFill,'font-family':'Inter,sans-serif'}, primary));
        svg.appendChild(el('text',{x:cx, y:cy+4.5,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'7','font-weight':'400',fill:textFill,'font-family':'Inter,sans-serif',opacity:'0.75'}, enharmonic));
      } else {
        // Single natural note — centred
        svg.appendChild(el('text',{x:cx, y:cy,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'9','font-weight':'500',fill:textFill,'font-family':'Inter,sans-serif'}, primary));
      }
    }
  }
}

function nnToggleFretboard(){
  nnFretboardVisible = !nnFretboardVisible;
  const wrap  = document.getElementById('nn-fretboard-wrap');
  const tog   = document.getElementById('nn-fb-toggle');
  const thumb = document.getElementById('nn-fb-thumb');
  const txt   = document.getElementById('nn-fb-text');
  if(nnFretboardVisible){
    wrap.style.display   = '';
    tog.style.background   = '#0d1f10';
    tog.style.borderColor  = '#2a6a40';
    thumb.style.left       = '18px';
    thumb.style.background = '#4db36d';
    if(txt) txt.textContent = 'Hide diagram';
    if(txt) txt.style.color = '#7fd49f';
  } else {
    wrap.style.display   = 'none';
    tog.style.background   = '#222';
    tog.style.borderColor  = '#3a3a3a';
    thumb.style.left       = '2px';
    thumb.style.background = '#888';
    if(txt) txt.textContent = 'Show diagram';
    if(txt) txt.style.color = 'var(--text-muted)';
  }
}

// ── SINGLE STRING reference fretboard ─────────────────────────────────────

let ssRefFbVisible = true;

function ssRenderRefFretboard(){
  const svg = document.getElementById('ss-ref-fb-svg');
  if(!svg) return;

  const LEFT=62, TOP=20, FW=48, SH=24, NUT=6, R=9;
  const NSTRINGS=6, NFRETS=12;
  const W = LEFT + NUT + NFRETS*FW + 30;
  const H = TOP + (NSTRINGS-1)*SH + 36;

  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

  function el(tag, attrs, text){
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for(const [k,v] of Object.entries(attrs)) e.setAttribute(k, String(v));
    if(text !== undefined) e.textContent = text;
    return e;
  }
  function strY(s){ return TOP + (NSTRINGS-1-s)*SH; }

  svg.innerHTML = '';

  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT+NFRETS*FW, height:(NSTRINGS-1)*SH+SH*.9, fill:'#1a1a1a', rx:8}));
  svg.appendChild(el('rect',{x:LEFT, y:TOP-SH*.45, width:NUT, height:(NSTRINGS-1)*SH+SH*.9, fill:'#aaa', rx:2, opacity:.45}));

  for(let f=1; f<=NFRETS; f++){
    const x = LEFT+NUT+f*FW;
    svg.appendChild(el('line',{x1:x, y1:TOP-SH*.42, x2:x, y2:TOP+(NSTRINGS-1)*SH+SH*.42,
      stroke:'#3a3a3a', 'stroke-width':f===12?2.5:1.2, opacity:f===12?.8:.5}));
    svg.appendChild(el('text',{x:LEFT+NUT+(f-.5)*FW, y:TOP+(NSTRINGS-1)*SH+SH*.76,
      'text-anchor':'middle','dominant-baseline':'central',fill:'#555','font-size':'11','font-family':'Inter,sans-serif'}, f));
  }

  [3,5,7,9,12].forEach(f => {
    const cx = LEFT+NUT+(f-.5)*FW;
    if(f===12){
      [1.5,3.5].forEach(sy => svg.appendChild(el('circle',{cx, cy:TOP+sy*SH, r:4, fill:'#333', opacity:.7})));
    } else {
      svg.appendChild(el('circle',{cx, cy:TOP+2.5*SH, r:4, fill:'#333', opacity:.7}));
    }
  });

  for(let s=0; s<NSTRINGS; s++){
    const y = strY(s);
    svg.appendChild(el('line',{x1:LEFT+NUT, y1:y, x2:LEFT+NUT+NFRETS*FW, y2:y,
      stroke:'#777','stroke-width':(2.2-s*.28).toFixed(2),opacity:.6}));
    svg.appendChild(el('text',{x:LEFT-6, y, 'text-anchor':'end','dominant-baseline':'central',
      fill:'#777','font-size':'11','font-family':'Inter,sans-serif'}, NN_STRING_NAMES[s]));
  }

  const NN_ENHARMONIC_PAIRS = {
    0: ['C',null], 1: ['C♯','D♭'], 2: ['D',null], 3: ['D♯','E♭'], 4: ['E',null],
    5: ['F',null], 6: ['F♯','G♭'], 7: ['G',null], 8: ['G♯','A♭'], 9: ['A',null],
    10: ['A♯','B♭'], 11: ['B',null]
  };

  for(let s=0; s<NSTRINGS; s++){
    const midi = NN_STRING_MIDI[s];
    for(let f=1; f<=NFRETS; f++){
      const notepc = ((midi + f) % 12 + 12) % 12;
      const pair = NN_ENHARMONIC_PAIRS[notepc];
      const primary = pair[0];
      const enharmonic = pair[1];
      const isNatural = !enharmonic;
      const cx = LEFT + NUT + (f-.5)*FW;
      const cy = strY(s);
      const fill   = isNatural ? '#2e5a3a' : '#1e3a2a';
      const stroke = isNatural ? '#4db36d' : '#2a7a45';
      const textFill = isNatural ? '#9fd49f' : '#6db38d';
      svg.appendChild(el('circle',{cx, cy, r:R, fill, stroke,'stroke-width':'1.2'}));
      if(enharmonic){
        svg.appendChild(el('text',{x:cx, y:cy-3,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'7.5','font-weight':'600',fill:textFill,'font-family':'Inter,sans-serif'}, primary));
        svg.appendChild(el('text',{x:cx, y:cy+4.5,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'7','font-weight':'400',fill:textFill,'font-family':'Inter,sans-serif',opacity:'0.75'}, enharmonic));
      } else {
        svg.appendChild(el('text',{x:cx, y:cy,'text-anchor':'middle','dominant-baseline':'central',
          'font-size':'9','font-weight':'500',fill:textFill,'font-family':'Inter,sans-serif'}, primary));
      }
    }
  }
}

function ssToggleRefFretboard(){
  ssRefFbVisible = !ssRefFbVisible;
  const wrap  = document.getElementById('ss-ref-fb-wrap');
  const tog   = document.getElementById('ss-ref-fb-toggle');
  const thumb = document.getElementById('ss-ref-fb-thumb');
  const txt   = document.getElementById('ss-ref-fb-text');
  if(ssRefFbVisible){
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

export { nextRandomFret, checkNotes, revealNotes, clearNotes, nnToggleDots, nnSetMode };
export { ssCheck, ssReveal, ssNext, ssToggleDots, ssToggleRefFretboard };
export { nnToggleFretboard, nnRenderFretboard, ssRenderRefFretboard, buildFourths };
