import { NOTE_PC, ENHARMONICS } from './data.js';

export function shuffle(a) {
  const b = [...a];
  for (let i=b.length-1; i>0; i--) { const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]; }
  return b;
}

export function pc(midi) { return ((midi%12)+12)%12; }

export function isCorrect(input, stringMidi, fret) {
  const target = pc(stringMidi + fret);
  const trimmed = input.trim();
  const capitalised = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  const canon = capitalised
    .replace(/bb/g,'♭♭').replace(/##/g,'♯♯')
    .replace(/#/g,'♯')
    .replace(/(?<![♭])b(?=[^♭]|$)/g,'♭')
    .replace(/b$/g,'♭');
  const v = NOTE_PC[canon];
  return v !== undefined && ((v%12+12)%12) === target;
}

export function getEnharmonics(stringMidi, fret) {
  return ENHARMONICS[pc(stringMidi + fret)];
}

export function keySigLabel(k) {
  if (k.sharps) return `${k.sharps} SHARP${k.sharps>1?'S':''} · ${k.acc}`;
  if (k.flats) return `${k.flats} FLAT${k.flats>1?'S':''} · ${k.acc}`;
  return 'NO ACCIDENTALS';
}
