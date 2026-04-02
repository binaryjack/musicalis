/// <reference types="cypress" />

describe('audio-visual-sync', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    
    // Create test project with synchronized content
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('[data-testid="project-name-input"]').type('Audio-Visual Sync Test');
    cy.get('[data-testid="create-project-confirm"]').click();
  });

  context('playback-visual-feedback', () => {
    beforeEach(() => {
      // Add test melody for synchronization tests
      const melody = [
        { pitch: 'C4', duration: 'quarter', x: 200 },
        { pitch: 'D4', duration: 'quarter', x: 350 },
        { pitch: 'E4', duration: 'half', x: 500 },
        { pitch: 'F4', duration: 'quarter', x: 650 },
        { pitch: 'G4', duration: 'quarter', x: 800 }
      ];
      
      melody.forEach(note => {
        cy.get('[data-testid="note-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="multi-staff-canvas"]').click(note.x, 250);
      });
    });

    it('synchronizes-playhead-with-audio', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      // Verify playhead appears and moves on multi-staff canvas
      cy.get('[data-testid="multi-staff-canvas"] [data-testid="playhead"]').should('be.visible');
      cy.get('[data-testid="multi-staff-canvas"] [data-testid="playhead"]').should('have.css', 'left', '0px');
      
      // Wait for playhead movement
      cy.wait(1000);
      cy.get('[data-testid="playhead"]').then(($playhead) => {
        const leftPosition = parseInt($playhead.css('left'), 10);
        cy.wrap(leftPosition).should('be.greaterThan', 0);
      });
      
      // Stop and verify playhead reset
      cy.get('[data-testid="stop-button"]').click();
      cy.get('[data-testid="playhead"]').should('have.css', 'left', '0px');
    });

    it('highlights-current-note-during-playback', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify first note is highlighted
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]')
        .should('have.class', 'note-playing');
      
      // Wait for progression to second note
      cy.wait(600); // Quarter note at 120 BPM = ~500ms
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]')
        .should('not.have.class', 'note-playing');
      cy.get('[data-testid="staff-canvas"] [data-note="D4"]')
        .should('have.class', 'note-playing');
      
      // Stop playback and verify highlighting removed
      cy.get('[data-testid="stop-button"]').click();
      cy.get('[data-testid="staff-canvas"] [data-note]')
        .should('not.have.class', 'note-playing');
    });

    it('updates-time-display-accurately', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify time starts at 0:00
      cy.get('[data-testid="current-time"]').should('contain', '0:00');
      cy.get('[data-testid="total-time"]').should('not.contain', '0:00');
      
      // Wait and verify time progression
      cy.wait(1000);
      cy.get('[data-testid="current-time"]').should('not.contain', '0:00');
      
      // Pause and verify time is preserved
      cy.get('[data-testid="pause-button"]').click();
      cy.get('[data-testid="current-time"]').then(($time) => {
        const pausedTime = $time.text();
        
        cy.wait(500);
        cy.get('[data-testid="current-time"]').should('contain', pausedTime);
      });
    });

    it('shows-waveform-visualization', () => {
      // Enable waveform visualization
      cy.get('[data-testid="visualization-toggle"]').click();
      cy.get('[data-testid="waveform-display"]').should('be.visible');
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify waveform animation
      cy.get('[data-testid="waveform-bars"]').should('have.class', 'animating');
      cy.get('[data-testid="frequency-spectrum"]').should('be.visible');
      
      // Verify different frequencies show during notes
      cy.wait(500);
      cy.get('[data-testid="frequency-spectrum"] .frequency-bar').then(($bars) => {
        const activeBars = $bars.filter('.active').length;
        cy.wrap(activeBars).should('be.greaterThan', 0);
      });
    });
  });

  context('tempo-synchronization', () => {
    beforeEach(() => {
      // Add notes for tempo testing
      cy.get('[data-testid="pitch-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(200, 250);
      cy.get('[data-testid="staff-canvas"]').click(350, 250);
      cy.get('[data-testid="staff-canvas"]').click(500, 250);
      cy.get('[data-testid="staff-canvas"]').click(650, 250);
    });

    it('adjusts-playback-speed-with-tempo-changes', () => {
      const originalTempo = 120;
      const newTempo = 180;
      
      // Set initial tempo
      cy.get('[data-testid="tempo-input"]').clear().type(originalTempo.toString());
      
      // Start playback and measure timing
      cy.get('[data-testid="play-button"]').click();
      cy.wait(1000);
      
      cy.get('[data-testid="current-time"]').then(($time1) => {
        const time1 = $time1.text();
        
        // Change tempo during playback
        cy.get('[data-testid="tempo-input"]').clear().type(newTempo.toString());
        cy.get('[data-testid="apply-tempo"]').click();
        
        // Verify tempo change affects playback speed
        cy.wait(1000);
        cy.get('[data-testid="current-time"]').then(($time2) => {
          const time2 = $time2.text();
          // At higher tempo, more time should have passed
          cy.wrap(time2).should('not.equal', time1);
        });
      });
    });

    it('maintains-visual-sync-during-tempo-changes', () => {
      // Start playback at normal tempo
      cy.get('[data-testid="play-button"]').click();
      
      // Wait for first note to highlight
      cy.wait(300);
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]')
        .should('have.class', 'note-playing');
      
      // Change tempo to faster
      cy.get('[data-testid="tempo-input"]').clear().type('160');
      cy.get('[data-testid="apply-tempo"]').click();
      
      // Verify playhead speed increases
      cy.get('[data-testid="playhead"]').then(($playhead1) => {
        const pos1 = parseInt($playhead1.css('left'), 10);
        
        cy.wait(500);
        cy.get('[data-testid="playhead"]').then(($playhead2) => {
          const pos2 = parseInt($playhead2.css('left'), 10);
          const speed = pos2 - pos1;
          
          // Change to even faster tempo
          cy.get('[data-testid="tempo-input"]').clear().type('200');
          cy.get('[data-testid="apply-tempo"]').click();
          
          cy.wait(500);
          cy.get('[data-testid="playhead"]').then(($playhead3) => {
            const pos3 = parseInt($playhead3.css('left'), 10);
            const newSpeed = pos3 - pos2;
            
            // New speed should be faster
            cy.wrap(newSpeed).should('be.greaterThan', speed);
          });
        });
      });
    });

    it('handles-extreme-tempo-values', () => {
      const tempos = [60, 200, 300]; // Slow, fast, very fast
      
      tempos.forEach((tempo) => {
        cy.get('[data-testid="tempo-input"]').clear().type(tempo.toString());
        cy.get('[data-testid="apply-tempo"]').click();
        
        // Start playback
        cy.get('[data-testid="play-button"]').click();
        
        // Verify playback works at extreme tempos
        cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
        cy.get('[data-testid="playhead"]').should('be.visible');
        
        // Let it play briefly
        cy.wait(500);
        
        // Stop for next tempo test
        cy.get('[data-testid="stop-button"]').click();
      });
    });
  });

  context('visual-effects-synchronization', () => {
    beforeEach(() => {
      // Add notes with different pitches for visual variety
      const notes = [
        { pitch: 'C4', duration: 'quarter', x: 200 },
        { pitch: 'G4', duration: 'quarter', x: 350 },
        { pitch: 'C5', duration: 'half', x: 500 },
        { pitch: 'E4', duration: 'quarter', x: 650 }
      ];
      
      notes.forEach(note => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click(note.x, 250);
      });
    });

    it('animates-notes-with-audio-timing', () => {
      // Enable note animations
      cy.get('[data-testid="settings-button"]').click();
      cy.get('[data-testid="note-animations-toggle"]').check();
      cy.get('[data-testid="settings-close"]').click();
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify first note animates
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]')
        .should('have.class', 'note-pulse');
      
      // Wait for progression and verify animation moves
      cy.wait(600);
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]')
        .should('not.have.class', 'note-pulse');
      cy.get('[data-testid="staff-canvas"] [data-note="G4"]')
        .should('have.class', 'note-pulse');
    });

    it('shows-pitch-based-visual-effects', () => {
      // Enable pitch visualization
      cy.get('[data-testid="visualization-settings"]').click();
      cy.get('[data-testid="pitch-colors-toggle"]').check();
      cy.get('[data-testid="visualization-close"]').click();
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify different pitches have different colors
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]').then(($note) => {
        const c4Color = $note.css('color');
        
        cy.wait(600);
        cy.get('[data-testid="staff-canvas"] [data-note="G4"]').then(($note2) => {
          const g4Color = $note2.css('color');
          cy.wrap(g4Color).should('not.equal', c4Color);
        });
      });
      
      // Verify higher pitches have "brighter" colors
      cy.get('[data-testid="pitch-visualization"]').within(() => {
        cy.get('[data-pitch="C5"]').should('have.class', 'high-pitch');
        cy.get('[data-pitch="C4"]').should('have.class', 'low-pitch');
      });
    });

    it('displays-volume-based-animations', () => {
      // Set different velocities for notes
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]').rightclick();
      cy.get('[data-testid="note-properties"]').click();
      cy.get('[data-testid="velocity-slider"]').invoke('val', 100).trigger('change');
      cy.get('[data-testid="properties-close"]').click();
      
      cy.get('[data-testid="staff-canvas"] [data-note="G4"]').rightclick();
      cy.get('[data-testid="note-properties"]').click();
      cy.get('[data-testid="velocity-slider"]').invoke('val', 50).trigger('change');
      cy.get('[data-testid="properties-close"]').click();
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify volume affects visual size/intensity
      cy.get('[data-testid="staff-canvas"] [data-note="C4"]').then(($loudNote) => {
        const loudSize = $loudNote.css('transform');
        
        cy.wait(600);
        cy.get('[data-testid="staff-canvas"] [data-note="G4"]').then(($quietNote) => {
          const quietSize = $quietNote.css('transform');
          // Loud note should be larger/more intense
          cy.wrap(loudSize).should('not.equal', quietSize);
        });
      });
    });
  });

  context('interactive-playback-controls', () => {
    beforeEach(() => {
      // Create longer composition for scrubbing tests
      const longMelody = Array.from({ length: 8 }, (_, i) => ({
        pitch: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'][i],
        duration: 'quarter',
        x: (i + 1) * 100 + 100
      }));
      
      longMelody.forEach(note => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click(note.x, 250);
      });
    });

    it('supports-timeline-scrubbing', () => {
      // Start playback to enable timeline
      cy.get('[data-testid="play-button"]').click();
      cy.wait(1000);
      cy.get('[data-testid="pause-button"]').click();
      
      // Scrub to middle of timeline
      cy.get('[data-testid="timeline-bar"]').click('center');
      
      // Verify playhead moved
      cy.get('[data-testid="playhead"]').then(($playhead) => {
        const position = parseInt($playhead.css('left'), 10);
        cy.wrap(position).should('be.greaterThan', 200);
        cy.wrap(position).should('be.lessThan', 600);
      });
      
      // Resume playback from scrubbed position
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      // Verify plays from correct position
      cy.get('[data-testid="staff-canvas"] [data-note]').then(($notes) => {
        const playingNote = $notes.filter('.note-playing');
        cy.wrap(playingNote).should('not.contain', '[data-note="C4"]');
      });
    });

    it('responds-to-keyboard-shortcuts', () => {
      // Test spacebar play/pause
      cy.get('body').type(' ');
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      cy.get('body').type(' ');
      cy.get('[data-testid="playback-status"]').should('contain', 'Paused');
      
      // Test arrow keys for fine scrubbing
      cy.get('body').type('{rightarrow}{rightarrow}{rightarrow}');
      cy.get('[data-testid="current-time"]').should('not.contain', '0:00');
      
      cy.get('body').type('{leftarrow}');
      cy.get('[data-testid="current-time"]').then(($time1) => {
        const time1 = $time1.text();
        
        cy.get('body').type('{leftarrow}');
        cy.get('[data-testid="current-time"]').then(($time2) => {
          const time2 = $time2.text();
          cy.wrap(time2).should('not.equal', time1);
        });
      });
      
      // Test home/end keys
      cy.get('body').type('{home}');
      cy.get('[data-testid="current-time"]').should('contain', '0:00');
      
      cy.get('body').type('{end}');
      cy.get('[data-testid="current-time"]').should('contain', cy.get('[data-testid="total-time"]').invoke('text'));
    });

    it('handles-loop-playback', () => {
      // Enable loop mode
      cy.get('[data-testid="loop-toggle"]').click();
      cy.get('[data-testid="loop-indicator"]').should('be.visible');
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Wait for composition to complete
      cy.get('[data-testid="playback-status"]', { timeout: 10000 }).should('contain', 'Playing');
      
      // Verify it loops back to beginning
      cy.wait(8000); // Wait for full composition
      cy.get('[data-testid="current-time"]').should('not.contain', cy.get('[data-testid="total-time"]').invoke('text'));
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      // Disable loop and verify it stops at end
      cy.get('[data-testid="loop-toggle"]').click();
      cy.get('[data-testid="stop-button"]').click();
      
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]', { timeout: 10000 }).should('contain', 'Stopped');
    });

    it('synchronizes-multiple-visual-elements', () => {
      // Enable all visual elements
      cy.get('[data-testid="settings-button"]').click();
      cy.get('[data-testid="note-animations-toggle"]').check();
      cy.get('[data-testid="waveform-toggle"]').check();
      cy.get('[data-testid="pitch-colors-toggle"]').check();
      cy.get('[data-testid="settings-close"]').click();
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify all elements are synchronized
      cy.get('[data-testid="playhead"]').should('be.visible');
      cy.get('[data-testid="waveform-display"]').should('have.class', 'animating');
      cy.get('[data-testid="staff-canvas"] [data-note]').first().should('have.class', 'note-pulse');
      cy.get('[data-testid="pitch-visualization"]').should('be.visible');
      
      // Pause and verify all elements pause
      cy.get('[data-testid="pause-button"]').click();
      cy.get('[data-testid="waveform-display"]').should('not.have.class', 'animating');
      cy.get('[data-testid="multi-staff-canvas"] [data-note]').should('not.have.class', 'note-pulse');
    });
  });

  context('advanced-playhead-modes', () => {
    beforeEach(() => {
      // Add test composition
      const melody = [
        { pitch: 'C4', duration: 'quarter', x: 200 },
        { pitch: 'D4', duration: 'quarter', x: 350 },
        { pitch: 'E4', duration: 'half', x: 500 }
      ];
      
      melody.forEach(note => {
        cy.get('[data-testid="note-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="multi-staff-canvas"]').click(note.x, 250);
      });
    });

    it('tests-free-movement-mode', () => {
      // Set playhead to free movement mode
      cy.get('[data-testid="playhead-mode-selector"]').select('free-movement');
      
      // Click to move playhead freely
      cy.get('[data-testid="multi-staff-canvas"]').click(400, 250);
      
      // Verify playhead moved to clicked position
      cy.get('[data-testid="playhead"]').then(($playhead) => {
        const leftPosition = parseInt($playhead.css('left'), 10);
        cy.wrap(leftPosition).should('be.closeTo', 400, 50);
      });
    });

    it('tests-center-lock-mode', () => {
      // Set playhead to center-lock mode
      cy.get('[data-testid="playhead-mode-selector"]').select('center-lock');
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify playhead stays in center while content scrolls
      cy.get('[data-testid="playhead"]').should('have.class', 'center-locked');
      
      // Verify canvas content scrolls instead
      cy.wait(1000);
      cy.get('[data-testid="multi-staff-canvas"]').should('have.attr', 'data-scroll-offset');
    });

    it('tests-end-boundary-mode', () => {
      // Set playhead to end boundary mode
      cy.get('[data-testid="playhead-mode-selector"]').select('end-boundary');
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Let it play to the end
      cy.wait(3000);
      
      // Verify playhead stops at composition end
      cy.get('[data-testid="playhead"]').should('have.class', 'at-boundary');
      cy.get('[data-testid="playback-status"]').should('contain', 'Stopped');
    });
  });

  context('multi-staff-visual-sync', () => {
    beforeEach(() => {
      // Create multi-staff composition
      const staffConfigs = [
        { notes: [{ pitch: 'C4', duration: 'quarter', x: 200 }] },
        { notes: [{ pitch: 'E4', duration: 'quarter', x: 200 }] },
        { notes: [{ pitch: 'G4', duration: 'quarter', x: 200 }] }
      ];
      
      staffConfigs.forEach((staff, staffIndex) => {
        // Select staff
        cy.get('[data-testid="staff-manager"] .staff-item').eq(staffIndex).click();
        
        staff.notes.forEach(note => {
          cy.get('[data-testid="note-selector"]').select(note.pitch);
          cy.get('[data-testid="duration-selector"]').select(note.duration);
          cy.get('[data-testid="multi-staff-canvas"]').click(note.x, 150 + (staffIndex * 120));
        });
      });
    });

    it('synchronizes-playback-across-all-staves', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify all staves show synchronized playhead
      cy.get('[data-testid="staff-manager"] .staff-item').each((_$staff, index) => {
        cy.get(`[data-testid="staff-${index}-playhead"]`).should('be.visible');
      });
      
      // Verify notes light up in sequence across staves
      cy.wait(500);
      cy.get('[data-testid="active-note"]').should('exist');
    });

    it('handles-staff-solo-and-mute', () => {
      // Solo first staff
      cy.get('[data-testid="staff-manager"] .staff-item').first().within(() => {
        cy.get('[data-testid="solo-button"]').click();
      });
      
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      
      // Verify only soloed staff is audible
      cy.get('[data-testid="staff-manager"] .staff-item').first().should('have.class', 'soloed');
      cy.get('[data-testid="staff-manager"] .staff-item').not(':first').should('have.class', 'muted');
      
      // Test mute functionality
      cy.get('[data-testid="staff-manager"] .staff-item').first().within(() => {
        cy.get('[data-testid="mute-button"]').click();
      });
      
      cy.get('[data-testid="staff-manager"] .staff-item').first().should('have.class', 'muted');
    });
  });
});