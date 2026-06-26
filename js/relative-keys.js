import { ALL_KEYS } from './data.js';
import { shuffle, keySigLabel } from './helpers.js';

let relMode='major', rScore=0, rStreak=0, rTotal=0, rCurrent=null, rAnswered=false;

function updateRelStats(){
  document.getElementById('r-score').textContent=rScore;
  document.getElementById('r-streak').textContent=rStreak;
  document.getElementById('r-total').textContent=rTotal;
}

function answerRel(chosen,btn,correct){
  if(rAnswered) return;
  rAnswered=true; rTotal++;
  document.querySelectorAll('#r-answers .ans-btn').forEach(b=>b.style.pointerEvents='none');
  if(chosen===correct){
    btn.classList.add('correct');
    document.getElementById('r-fb').textContent='✓ Correct!'; document.getElementById('r-fb').className='feedback good';
    rScore++; rStreak++;
  } else {
    btn.classList.add('wrong');
    document.querySelectorAll('#r-answers .ans-btn').forEach(b=>{if(b.textContent===correct)b.classList.add('correct');});
    const hint=rCurrent._askMaj?'The relative minor is the 6th degree of the major scale.':'The relative major starts a minor 3rd above the minor tonic.';
    document.getElementById('r-fb').textContent=`✗ ${correct}. ${hint}`; document.getElementById('r-fb').className='feedback bad';
    rStreak=0;
  }
  updateRelStats();
  document.getElementById('r-prog').style.width='100%';
  document.getElementById('r-next').style.display='block';
  if(chosen===correct) setTimeout(nextRelKey, 1000);
}

export function nextRelKey(){
  rAnswered=false;
  document.getElementById('r-next').style.display='none';
  document.getElementById('r-fb').textContent=''; document.getElementById('r-fb').className='feedback';
  document.getElementById('r-prog').style.width='0%';
  rCurrent=ALL_KEYS[Math.floor(Math.random()*ALL_KEYS.length)];
  const askMaj=relMode==='major'||(relMode==='both'&&Math.random()<0.5);
  rCurrent._askMaj=askMaj;
  document.getElementById('r-key').textContent=askMaj?rCurrent.major+' major':rCurrent.minor+' minor';
  document.getElementById('r-meta').textContent=keySigLabel(rCurrent);
  document.getElementById('r-q').textContent=askMaj?`What is the relative minor of ${rCurrent.major} major?`:`What is the relative major of ${rCurrent.minor} minor?`;
  const correctAns=askMaj?rCurrent.minor:rCurrent.major;
  const pool=(askMaj?ALL_KEYS.map(x=>x.minor):ALL_KEYS.map(x=>x.major)).filter(x=>x!==correctAns);
  const opts=shuffle([correctAns,...shuffle(pool).slice(0,5)]);
  const grid=document.getElementById('r-answers'); grid.innerHTML='';
  opts.forEach(o=>{
    const b=document.createElement('button'); b.className='ans-btn'; b.textContent=o;
    b.onclick=()=>answerRel(o,b,correctAns); grid.appendChild(b);
  });
}

export function setRelMode(m){
  relMode=m; rScore=0; rStreak=0; rTotal=0; updateRelStats();
  ['major','minor','both'].forEach(x=>document.getElementById('rm-'+(x==='major'?'maj':x==='minor'?'min':'both')).classList.toggle('active',x===m));
  nextRelKey();
}

export function initRelativeKeys() {
  nextRelKey();
}
