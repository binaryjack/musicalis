const fs = require('fs');
const file = 'src/widgets/use-staff-bt-events.ts';
let str = fs.readFileSync(file, 'utf8');

str = str.replace(
  'const beatInnerX = xInBar % beatWidth;\r\n    const subdivisionOffset = beatInnerX > (beatWidth / 2) ? 0.5 : 0;',
  \const beatInnerX = xInBar % beatWidth;
    
    const durRaw = (selectedTool?.duration || selectedDuration || 'quarter') as string;
    const durMap: Record<string, number> = { 'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25 };
    const durBeats = durMap[durRaw] || 1;
    
    let subdivisionOffset = 0;
    if (durBeats < 1) {
      const numSlices = Math.round(1 / durBeats);
      const sliceWidth = beatWidth / numSlices;
      const sliceIndex = Math.floor(beatInnerX / sliceWidth);
      subdivisionOffset = sliceIndex * durBeats;
    }\
);

str = str.replace(
  'const beatInnerX = xInBar % beatWidth;\n    const subdivisionOffset = beatInnerX > (beatWidth / 2) ? 0.5 : 0;',
  \const beatInnerX = xInBar % beatWidth;
    
    const durRaw = (selectedTool?.duration || selectedDuration || 'quarter') as string;
    const durMap: Record<string, number> = { 'whole': 4, 'half': 2, 'quarter': 1, 'eighth': 0.5, 'sixteenth': 0.25 };
    const durBeats = durMap[durRaw] || 1;
    
    let subdivisionOffset = 0;
    if (durBeats < 1) {
      const numSlices = Math.round(1 / durBeats);
      const sliceWidth = beatWidth / numSlices;
      const sliceIndex = Math.floor(beatInnerX / sliceWidth);
      subdivisionOffset = sliceIndex * durBeats;
    }\
);

str = str.replace(
  'subdivIndex: subdivisionOffset === 0.5 ? 1 : 0,\r\n            isAllowed: true,',
  'subdivIndex: subdivisionOffset > 0 ? Math.round(subdivisionOffset * 100) : 0,\r\n            subdivOffset: subdivisionOffset,\r\n            isAllowed: true,'
);
str = str.replace(
  'subdivIndex: subdivisionOffset === 0.5 ? 1 : 0,\n            isAllowed: true,',
  'subdivIndex: subdivisionOffset > 0 ? Math.round(subdivisionOffset * 100) : 0,\n            subdivOffset: subdivisionOffset,\n            isAllowed: true,'
);

fs.writeFileSync(file, str, 'utf-8');