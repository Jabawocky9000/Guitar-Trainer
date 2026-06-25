import { SHARP_KEYS, FLAT_KEYS } from './data.js';
import { shuffle } from './helpers.js';

let ksMode='sharps', ksScore=0, ksStreak=0, ksTotal=0;
let ksCurrent=null, ksCountDone=false, ksSelected=[];

function getKsPool() {
  return ksMode==='sharps' ? SHARP_KEYS : ksMode==='flats' ? FLAT_KEYS : [...SHARP_KEYS,...FLAT_KEYS];
}

function updateKsStats(){
  document.getElementById('ks-score').textContent=ksScore;
  document.getElementById('ks-streak').textContent=ksStreak;
  document.getElementById('ks-total').textContent=ksTotal;
}

function ksShowAccidentals() {
  document.getElementById('ks-prog').style.width='50%';
  const isSharp=ksCurrent.accidentals[0]?.includes('♯');
  document.getElementById('ks-acc-section').style.display='block';
  document.getElementById('ks-acc-q').textContent=`Name the ${ksCurrent.count} ${isSharp?'sharp':'flat'}${ksCurrent.count>1?'s':''} in order:`;
  document.getElementById('ks-acc-fb').textContent=''; ksSelected=[];
  const all=isSharp?['F♯','C♯','G♯','D♯','A♯','E♯','B♯']:['B♭','E♭','A♭','D♭','G♭','C♭','F♭'];
  const grid=document.getElementById('ks-acc-answers'); grid.innerHTML='';
  all.forEach(acc=>{
    const b=document.createElement('button'); b.className='ans-btn'; b.textContent=acc; b.dataset.acc=acc;
    b.onclick=()=>{
      if(b.classList.contains('correct')||b.classList.contains('wrong')) return;
      const idx=ksSelected.indexOf(acc);
      if(idx>-1){ksSelected.splice(idx,1);b.classList.remove('selected');}
      else{ksSelected.push(acc);b.classList.add('selected');}
    };
    grid.appendChild(b);
  });
  const sub=document.createElement('button'); sub.className='ans-btn'; sub.textContent='Submit ✓';
  sub.style.gridColumn='1/-1'; sub.onclick=ksCheckAccidentals; grid.appendChild(sub);
}

function ksCheckAccidentals() {
  const correct=ksCurrent.accidentals;
  document.querySelectorAll('#ks-acc-answers .ans-btn').forEach(b=>b.style.pointerEvents='none');
  const ok=ksSelected.length===correct.length&&correct.every((a,i)=>ksSelected[i]===a);
  document.querySelectorAll('#ks-acc-answers .ans-btn').forEach(b=>{
    if(!b.textContent.includes('Submit')){
      if(correct.includes(b.dataset.acc)) b.classList.add('correct');
      else if(ksSelected.includes(b.dataset.acc)) b.classList.add('wrong');
    }
  });
  if(ok){document.getElementById('ks-acc-fb').textContent=`✓ Perfect! ${correct.join(' → ')}`;document.getElementById('ks-acc-fb').className='feedback good';}
  else{document.getElementById('ks-acc-fb').textContent=`Order: ${correct.join(' → ')}`;document.getElementById('ks-acc-fb').className='feedback bad';}
  document.getElementById('ks-prog').style.width='100%';
  document.getElementById('ks-next').style.display='block';
}

function ksAnswerCount(n, btn) {
  if(ksCountDone) return;
  ksCountDone=true; ksTotal++;
  document.querySelectorAll('#ks-answers .ans-btn').forEach(b=>b.style.pointerEvents='none');
  if(n===ksCurrent.count){
    btn.classList.add('correct');
    document.getElementById('ks-fb').textContent='✓ Correct!';
    document.getElementById('ks-fb').className='feedback good';
    ksScore++; ksStreak++;
    document.getElementById('ks-prog').style.width='50%';
    if(ksCurrent.count===0){document.getElementById('ks-next').style.display='block';document.getElementById('ks-prog').style.width='100%';}
    else setTimeout(ksShowAccidentals,600);
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('#ks-answers .ans-btn').forEach(b=>{ if((b.textContent==='0 (C)'&&ksCurrent.count===0)||(parseInt(b.textContent)===ksCurrent.count)) b.classList.add('correct'); });
    document.getElementById('ks-fb').textContent=`✗ It's ${ksCurrent.count}.${ksCurrent.count>0?" Let's still name them.":''}`;
    document.getElementById('ks-fb').className='feedback bad';
    ksStreak=0;
    if(ksCurrent.count>0) setTimeout(ksShowAccidentals,900);
    else document.getElementById('ks-next').style.display='block';
  }
  updateKsStats();
}

export function nextKsKey() {
  ksCountDone=false; ksSelected=[];
  document.getElementById('ks-next').style.display='none';
  document.getElementById('ks-fb').textContent='';
  document.getElementById('ks-fb').className='feedback';
  document.getElementById('ks-acc-section').style.display='none';
  document.getElementById('ks-prog').style.width='0%';
  ksCurrent = getKsPool()[Math.floor(Math.random()*getKsPool().length)];
  document.getElementById('ks-key').textContent=ksCurrent.key;
  const isFlat = ksCurrent.accidentals[0]?.includes('♭');
  document.getElementById('ks-meta').textContent=ksCurrent.count===0?'MAJOR · NO ACCIDENTALS':(isFlat?'MAJOR · FLATS':'MAJOR · SHARPS');
  document.getElementById('ks-q').textContent=`How many accidentals does ${ksCurrent.key} major have?`;
  const grid=document.getElementById('ks-answers'); grid.innerHTML='';
  for(let i=0;i<=7;i++){
    const b=document.createElement('button'); b.className='ans-btn';
    b.textContent=i===0?'0 (C)':i; b.onclick=()=>ksAnswerCount(i,b); grid.appendChild(b);
  }
}

export function setKsMode(m) {
  ksMode=m; ksScore=0; ksStreak=0; ksTotal=0; updateKsStats();
  ['sharps','flats','both'].forEach(x=>document.getElementById('ksm-'+x).classList.toggle('active',x===m));
  nextKsKey();
}

export function initKeySignatures() {
  nextKsKey();
}
