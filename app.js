import { initKeySignatures, nextKsKey, setKsMode } from './js/key-signatures.js';
import { initRelativeKeys, nextRelKey, setRelMode } from './js/relative-keys.js';
import {
  nextRandomFret, checkNotes, revealNotes, clearNotes,
  nnToggleDots, nnSetMode, ssCheck, ssReveal, ssNext,
  ssToggleDots, ssToggleRefFretboard, nnToggleFretboard,
  nnRenderFretboard, buildFourths
} from './js/note-names.js';
import {
  fbSetView, fbSetKey, fbSetPentaKey, fbSetNumMode,
  fbRender, fbToggleBlues, fbToggleNoteNames, fbToggleSevenths,
  fbBuildPills, fbBuildShapePills, fbBuildChordPills, fbBuildDimPills,
  fbBuildHarmPills, fbBuildHungPills
} from './js/scale-map.js';
import { cikSetMode, cikToggleSevenths, cikBuildRootBtns, cikBuild } from './js/chords-in-key.js';
import {
  itSetDir, itNext, itCheck, itReveal, itToggleFretboard,
  itSetFbRoot, initIntervalTraining
} from './js/interval-training.js';

// Navigation — show/hide sections, lazy-init interval training
function gotoSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => {
    if (b.getAttribute('onclick').includes(id)) b.classList.add('active');
  });
  if (id === 'interval-training') initIntervalTraining();
}

// Expose functions to HTML onclick handlers
Object.assign(window, {
  gotoSection, setKsMode, nextKsKey, setRelMode, nextRelKey,
  nextRandomFret, checkNotes, revealNotes, clearNotes,
  nnToggleDots, nnSetMode, ssCheck, ssReveal, ssNext,
  ssToggleDots, ssToggleRefFretboard, nnToggleFretboard,
  fbSetView, fbSetKey, fbSetPentaKey, fbSetNumMode,
  fbToggleBlues, fbToggleNoteNames, fbToggleSevenths,
  cikSetMode, cikToggleSevenths,
  itSetDir, itNext, itCheck, itReveal, itToggleFretboard,
});

// Initialise
initKeySignatures();
initRelativeKeys();
nextRandomFret();
buildFourths();
nnRenderFretboard();
fbBuildPills();
fbBuildShapePills();
fbBuildChordPills();
fbBuildDimPills();
fbBuildHarmPills();
fbBuildHungPills();
fbRender();
cikBuildRootBtns();
cikBuild();
