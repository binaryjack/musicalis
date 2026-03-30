/**
 * SMuFL (Standard Music Font Layout) Glyph Mappings
 * Reference: https://w3c.github.io/smufl/latest/
 * Font: Bravura
 */

export const SMuFLGlyphs = {
  // ============ CLEFS ============
  trebleClef: '\uE050',
  bassClef: '\uE062',
  altoClef: '\uE05C',
  tenorClef: '\uE05C', // Same as alto, positioned differently
  
  // ============ NOTE HEADS ============
  noteheadBlack: '\uE0A4',
  noteheadHalf: '\uE0A3',
  noteheadWhole: '\uE0A2',
  noteheadDoubleWhole: '\uE0A0',
  
  // ============ ACCIDENTALS ============
  accidentalSharp: '\uE262',
  accidentalFlat: '\uE260',
  accidentalNatural: '\uE261',
  accidentalDoubleSharp: '\uE263',
  accidentalDoubleFlat: '\uE264',
  
  // ============ TIME SIGNATURES ============
  timeSig0: '\uE080',
  timeSig1: '\uE081',
  timeSig2: '\uE082',
  timeSig3: '\uE083',
  timeSig4: '\uE084',
  timeSig5: '\uE085',
  timeSig6: '\uE086',
  timeSig7: '\uE087',
  timeSig8: '\uE088',
  timeSig9: '\uE089',
  timeSigCommon: '\uE08A',        // 4/4
  timeSigCutCommon: '\uE08B',     // 2/2
  
  // ============ STEMS ============
  stem: '\uE210',
  stemSprechgesang: '\uE211',
  
  // ============ FLAGS ============
  flag8thUp: '\uE240',
  flag8thDown: '\uE241',
  flag16thUp: '\uE242',
  flag16thDown: '\uE243',
  flag32ndUp: '\uE244',
  flag32ndDown: '\uE245',
  flag64thUp: '\uE246',
  flag64thDown: '\uE247',
  
  // ============ BAR LINES ============
  barlineSingle: '\uE030',
  barlineDouble: '\uE031',
  barlineFinal: '\uE032',
  barlineReverseFinal: '\uE033',
  barlineHeavy: '\uE034',
  barlineDashed: '\uE036',
  
  // ============ RESTS ============
  restWhole: '\uE4E3',
  restHalf: '\uE4E4',
  restQuarter: '\uE4E5',
  rest8th: '\uE4E6',
  rest16th: '\uE4E7',
  rest32nd: '\uE4E8',
  rest64th: '\uE4E9',
  
  // ============ DYNAMICS ============
  dynamicPiano: '\uE520',
  dynamicMezzo: '\uE521',
  dynamicForte: '\uE522',
  dynamicRinforzando: '\uE523',
  dynamicSforzando: '\uE524',
  dynamicZ: '\uE525',
  
  // ============ ARTICULATIONS ============
  articAccentAbove: '\uE4A0',
  articAccentBelow: '\uE4A1',
  articStaccatoAbove: '\uE4A2',
  articStaccatoBelow: '\uE4A3',
  articTenutoAbove: '\uE4A4',
  articTenutoBelow: '\uE4A5',
  articStaccatissimoAbove: '\uE4A6',
  articStaccatissimoBelow: '\uE4A7',
  articMarcatoAbove: '\uE4AC',
  articMarcatoBelow: '\uE4AD',
} as const;

/**
 * Get time signature digits as SMuFL glyphs
 */
export const getTimeSignatureGlyphs = function(timeSignature: string): { top: string; bottom: string } {
  const [numerator, denominator] = timeSignature.split('/');
  
  // Always use numeric notation instead of C/Cut-C symbols
  // if (timeSignature === '4/4') {
  //   return { top: SMuFLGlyphs.timeSigCommon, bottom: '' };
  // }
  // 
  // if (timeSignature === '2/2') {
  //   return { top: SMuFLGlyphs.timeSigCutCommon, bottom: '' };
  // }
  
  const digitMap: Record<string, string> = {
    '0': SMuFLGlyphs.timeSig0,
    '1': SMuFLGlyphs.timeSig1,
    '2': SMuFLGlyphs.timeSig2,
    '3': SMuFLGlyphs.timeSig3,
    '4': SMuFLGlyphs.timeSig4,
    '5': SMuFLGlyphs.timeSig5,
    '6': SMuFLGlyphs.timeSig6,
    '7': SMuFLGlyphs.timeSig7,
    '8': SMuFLGlyphs.timeSig8,
    '9': SMuFLGlyphs.timeSig9,
  };
  
  const topGlyphs = numerator.split('').map(d => digitMap[d] || '').join('');
  const bottomGlyphs = denominator.split('').map(d => digitMap[d] || '').join('');
  
  return { top: topGlyphs, bottom: bottomGlyphs };
};

/**
 * Get note head glyph based on duration
 */
export const getNoteHeadGlyph = function(duration: string): string {
  switch (duration) {
    case 'whole':
      return SMuFLGlyphs.noteheadWhole;
    case 'half':
      return SMuFLGlyphs.noteheadHalf;
    case 'quarter':
    case 'eighth':
    case 'sixteenth':
      return SMuFLGlyphs.noteheadBlack;
    default:
      return SMuFLGlyphs.noteheadBlack;
  }
};

/**
 * Get flag glyph based on duration and stem direction
 */
export const getFlagGlyph = function(duration: string, stemUp: boolean): string | null {
  switch (duration) {
    case 'eighth':
      return stemUp ? SMuFLGlyphs.flag8thUp : SMuFLGlyphs.flag8thDown;
    case 'sixteenth':
      return stemUp ? SMuFLGlyphs.flag16thUp : SMuFLGlyphs.flag16thDown;
    default:
      return null;
  }
};

/**
 * Get rest glyph based on duration
 */
export const getRestGlyph = function(duration: string): string {
  switch (duration) {
    case 'whole':
      return SMuFLGlyphs.restWhole;
    case 'half':
      return SMuFLGlyphs.restHalf;
    case 'quarter':
      return SMuFLGlyphs.restQuarter;
    case 'eighth':
      return SMuFLGlyphs.rest8th;
    case 'sixteenth':
      return SMuFLGlyphs.rest16th;
    default:
      return SMuFLGlyphs.restQuarter;
  }
};

/**
 * Get accidental glyph
 */
export const getAccidentalGlyph = function(accidental: '#' | 'b' | '♮'): string {
  switch (accidental) {
    case '#':
      return SMuFLGlyphs.accidentalSharp;
    case 'b':
      return SMuFLGlyphs.accidentalFlat;
    case '♮':
      return SMuFLGlyphs.accidentalNatural;
    default:
      return '';
  }
};

/**
 * Get clef glyph
 */
export const getClefGlyph = function(clef: 'treble' | 'bass' | 'alto' | 'tenor'): string {
  switch (clef) {
    case 'treble':
      return SMuFLGlyphs.trebleClef;
    case 'bass':
      return SMuFLGlyphs.bassClef;
    case 'alto':
      return SMuFLGlyphs.altoClef;
    case 'tenor':
      return SMuFLGlyphs.tenorClef;
    default:
      return SMuFLGlyphs.trebleClef;
  }
};
