export const SHARP_KEYS = [
  {key:'C', count:0, accidentals:[]},
  {key:'G', count:1, accidentals:['F♯']},
  {key:'D', count:2, accidentals:['F♯','C♯']},
  {key:'A', count:3, accidentals:['F♯','C♯','G♯']},
  {key:'E', count:4, accidentals:['F♯','C♯','G♯','D♯']},
  {key:'B', count:5, accidentals:['F♯','C♯','G♯','D♯','A♯']},
  {key:'F♯', count:6, accidentals:['F♯','C♯','G♯','D♯','A♯','E♯']},
  {key:'C♯', count:7, accidentals:['F♯','C♯','G♯','D♯','A♯','E♯','B♯']},
];

export const FLAT_KEYS = [
  {key:'F', count:1, accidentals:['B♭']},
  {key:'B♭', count:2, accidentals:['B♭','E♭']},
  {key:'E♭', count:3, accidentals:['B♭','E♭','A♭']},
  {key:'A♭', count:4, accidentals:['B♭','E♭','A♭','D♭']},
  {key:'D♭', count:5, accidentals:['B♭','E♭','A♭','D♭','G♭']},
  {key:'G♭', count:6, accidentals:['B♭','E♭','A♭','D♭','G♭','C♭']},
  {key:'C♭', count:7, accidentals:['B♭','E♭','A♭','D♭','G♭','C♭','F♭']},
];

export const ALL_KEYS = [
  {major:'C', minor:'A', sharps:0, acc:''},
  {major:'G', minor:'E', sharps:1, acc:'F♯'},
  {major:'D', minor:'B', sharps:2, acc:'F♯ C♯'},
  {major:'A', minor:'F♯', sharps:3, acc:'F♯ C♯ G♯'},
  {major:'E', minor:'C♯', sharps:4, acc:'F♯ C♯ G♯ D♯'},
  {major:'B', minor:'G♯', sharps:5, acc:'F♯ C♯ G♯ D♯ A♯'},
  {major:'F♯', minor:'D♯', sharps:6, acc:'F♯ C♯ G♯ D♯ A♯ E♯'},
  {major:'F', minor:'D', flats:1, acc:'B♭'},
  {major:'B♭', minor:'G', flats:2, acc:'B♭ E♭'},
  {major:'E♭', minor:'C', flats:3, acc:'B♭ E♭ A♭'},
  {major:'A♭', minor:'F', flats:4, acc:'B♭ E♭ A♭ D♭'},
  {major:'D♭', minor:'B♭', flats:5, acc:'B♭ E♭ A♭ D♭ G♭'},
  {major:'G♭', minor:'E♭', flats:6, acc:'B♭ E♭ A♭ D♭ G♭ C♭'},
];

export const STRINGS = [
  {name:'E₄  1st', midi:64},
  {name:'B₃  2nd', midi:59},
  {name:'G₃  3rd', midi:55},
  {name:'D₃  4th', midi:50},
  {name:'A₂  5th', midi:45},
  {name:'E₂  6th', midi:40},
];

export const CHROMATIC = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];

export const ENHARMONICS = [
  ['C','B♯','D♭♭'],['C♯','D♭','B♯♯'],['D','C♯♯','E♭♭'],['D♯','E♭','F♭♭'],
  ['E','F♭','D♯♯'],['F','E♯','G♭♭'],['F♯','G♭','E♯♯'],['G','F♯♯','A♭♭'],
  ['G♯','A♭'],['A','G♯♯','B♭♭'],['A♯','B♭','C♭♭'],['B','C♭','A♯♯'],
];

export const NOTE_PC = {};
['C','D','E','F','G','A','B'].forEach((n,i)=>{
  const base=[0,2,4,5,7,9,11][i];
  NOTE_PC[n]=base; NOTE_PC[n+'#']=base+1; NOTE_PC[n+'♯']=base+1;
  NOTE_PC[n+'b']=base-1; NOTE_PC[n+'♭']=base-1;
  NOTE_PC[n+'##']=base+2; NOTE_PC[n+'♯♯']=base+2;
  NOTE_PC[n+'bb']=base-2; NOTE_PC[n+'♭♭']=base-2;
});
NOTE_PC['B#']=0; NOTE_PC['B♯']=0; NOTE_PC['E#']=5; NOTE_PC['E♯']=5;
NOTE_PC['Cb']=11; NOTE_PC['C♭']=11; NOTE_PC['Fb']=4; NOTE_PC['F♭']=4;

export const MODES = [
  {name:'Ionian',     num:1, formula:['1','2','3','4','5','6','7'],                   semitones:[0,2,4,5,7,9,11],  desc:'Major scale'},
  {name:'Dorian',     num:2, formula:['1','2','♭3','4','5','6','♭7'],                 semitones:[0,2,3,5,7,9,10],  desc:'Natural minor + ♮6'},
  {name:'Phrygian',   num:3, formula:['1','♭2','♭3','4','5','♭6','♭7'],              semitones:[0,1,3,5,7,8,10],  desc:'Natural minor + ♭2'},
  {name:'Lydian',     num:4, formula:['1','2','3','♯4','5','6','7'],                  semitones:[0,2,4,6,7,9,11],  desc:'Major scale + ♯4'},
  {name:'Mixolydian', num:5, formula:['1','2','3','4','5','6','♭7'],                  semitones:[0,2,4,5,7,9,10],  desc:'Major scale + ♭7'},
  {name:'Aeolian',    num:6, formula:['1','2','♭3','4','5','♭6','♭7'],               semitones:[0,2,3,5,7,8,10],  desc:'Natural minor'},
  {name:'Locrian',    num:7, formula:['1','♭2','♭3','4','♭5','♭6','♭7'],             semitones:[0,1,3,5,6,8,10],  desc:'Natural minor + ♭2 ♭5'},
];

export const ROOTS = ['C','D','E','F','G','A','B','F♯','B♭','E♭','A♭','D♭','G♭','C♯'];

export const DISPLAY_ORDER = [5, 4, 3, 2, 1, 0];

export const NN_STRING_MIDI = [40, 45, 50, 55, 59, 64];
export const NN_STRING_NAMES = ['E₂','A₂','D₃','G₃','B₃','E₄'];
export const NN_NOTE_NAMES = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];

export const MAJ_SCALE = [0,2,4,5,7,9,11];
export const MIN_SCALE = [0,2,3,5,7,8,10];
