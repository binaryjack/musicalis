        const beatX = barX + (beatIndex * beatWidth) + (beatWidth / 2);
        
        for (const note of beat.notes) {
          const isRest = (note as any).type === 'rest';
            
            const timeSigValue = staff?.timeSignature ? parseInt(staff.timeSignature.split('/')[1]) : 4;
            const noteDurBeats = getDurationValue((note as any).duration || 'quarter');
            const noteWidth = beatWidth * (noteDurBeats / (4 / timeSigValue));
            const startX = barX + (beatIndex * beatWidth) + ((note.subdivisionOffset || 0) * beatWidth);
            const isWhole = (note as any).duration === 'whole';
            const adjustedX = startX + (isWhole ? beatWidth * 0.5 : noteWidth / 2) + (note.visualOffsetX || 0);
          if (isRest) {
            const staffTop = (height / 2) - (RenderConfig.staffLineSpacing * 2);
            adjustedY = staffTop + 20; // Center of staff
