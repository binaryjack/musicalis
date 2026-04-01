const fs = require('fs');
let c = fs.readFileSync('d:/Sources/musicalist/src/components/organisms/music-staff-canvas.tsx', 'utf8');

const target = '// Draw dragged note on top';
const newCode = \
    // Draw snap detection visual feedback
    if (draggedNote && mode === 'design') {
      const snapX = draggedNote.currentX;
      const barStartX = 130;
      const finalBarX = barStartX + (bars.length * RenderConfig.barWidth);
      
      if (snapX >= barStartX && snapX <= finalBarX) {
        const beatsPerBar = bars[0]?.beats.length || 4;
        const relativeX = snapX - barStartX;
        const barIndex = Math.floor(relativeX / RenderConfig.barWidth);
        const xInBar = relativeX % RenderConfig.barWidth;
        const beatWidth = RenderConfig.barWidth / beatsPerBar;
        const beatIndex = Math.floor(xInBar / beatWidth);
        const beatInnerX = xInBar % beatWidth;
        const subdivisionOffset = beatInnerX > (beatWidth / 2) ? 0.5 : 0;
        
        const targetX = barStartX + (barIndex * RenderConfig.barWidth) + (beatIndex * beatWidth) + (subdivisionOffset * beatWidth);
        
        ctx.save();
        ctx.fillStyle = 'rgba(74, 158, 255, 0.2)';
        ctx.fillRect(targetX - 5, staffTop - 20, (beatWidth / 2) + 10, (RenderConfig.staffLineSpacing * 4) + 40);
        
        ctx.beginPath();
        ctx.strokeStyle = '#4a9eff';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(targetX, staffTop - 20);
        ctx.lineTo(targetX, staffTop + (RenderConfig.staffLineSpacing * 4) + 20);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Draw dragged note on top\;

c = c.replace(target, newCode);
fs.writeFileSync('d:/Sources/musicalist/src/components/organisms/music-staff-canvas.tsx', c);
