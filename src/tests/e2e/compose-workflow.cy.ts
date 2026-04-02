/// <reference types="cypress" />

describe('compose-workflow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  context('project-creation', () => {
    it('creates-new-project-successfully', () => {
      // Test data
      const projectName = 'Test Composition';
      
      // Navigate to create project
      cy.get('[data-testid="home-page"]').should('be.visible');
      cy.get('[data-testid="new-project-button"]', { timeout: 10000 }).click();
      
      // Enter project details
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Verify editor loaded with multi-staff interface
      cy.get('[data-testid="editor-page"]').should('be.visible');
      cy.get('[data-testid="project-title"]').should('contain', projectName);
      cy.get('[data-testid="multi-staff-canvas"]').should('be.visible');
      cy.get('[data-testid="memory-monitor"]').should('be.visible');
      cy.get('[data-testid="responsive-layout"]').should('be.visible');
    });

    it('validates-empty-project-name', () => {
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Should show validation error
      cy.get('[data-testid="validation-error"]').should('contain', 'Project name is required');
      cy.get('[data-testid="editor-page"]').should('not.exist');
    });
  });

  context('note-composition', () => {
    beforeEach(() => {
      // Create project for composition tests
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Composition Test');
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="editor-page"]').should('be.visible');
    });

    it('adds-single-note-with-preview', () => {
      // Select note properties
      cy.get('[data-testid="note-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      
      // Verify staff manager shows multiple staves
      cy.get('[data-testid="staff-manager"]').should('be.visible');
      cy.get('[data-testid="staff-list"] .staff-item').should('have.length.at.least', 1);
      
      // Add note to multi-staff canvas
      cy.get('[data-testid="multi-staff-canvas"]').click(200, 250);
      
      // Verify note added
      cy.get('[data-testid="note-list"]').should('contain', 'C4');
      cy.get('[data-testid="note-count"]').should('contain', '1');
      
      // Test audio preview
      cy.get('[data-testid="preview-note-button"]').click();
      cy.get('[data-testid="audio-status"]').should('contain', 'Playing');
    });

    it('adds-multiple-notes-sequence', () => {
      const notes = [
        { pitch: 'C4', duration: 'quarter', position: 1 },
        { pitch: 'D4', duration: 'quarter', position: 2 },
        { pitch: 'E4', duration: 'half', position: 3 },
        { pitch: 'F4', duration: 'quarter', position: 4 }
      ];
      
      notes.forEach((note) => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click(note.position * 100 + 100, 250);
        
        // Verify note added
        cy.get('[data-testid="note-list"]').should('contain', note.pitch);
      });
      
      // Verify total count
      cy.get('[data-testid="note-count"]').should('contain', notes.length.toString());
    });

    it('handles-note-deletion', () => {
      // Add notes
      cy.get('[data-testid="pitch-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(200, 250);
      
      cy.get('[data-testid="pitch-selector"]').select('D4');
      cy.get('[data-testid="staff-canvas"]').click(300, 250);
      
      // Verify both notes added
      cy.get('[data-testid="note-count"]').should('contain', '2');
      
      // Delete first note
      cy.get('[data-testid="note-list"] [data-testid="note-item"]:first').within(() => {
        cy.get('[data-testid="delete-note-button"]').click();
      });
      
      // Verify deletion
      cy.get('[data-testid="note-count"]').should('contain', '1');
      cy.get('[data-testid="note-list"]').should('not.contain', 'C4');
      cy.get('[data-testid="note-list"]').should('contain', 'D4');
    });
  });

  context('project-persistence', () => {
    beforeEach(() => {
      // Create project with composition
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Persistence Test');
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add test notes
      cy.get('[data-testid="pitch-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(200, 250);
      
      cy.get('[data-testid="pitch-selector"]').select('G4');
      cy.get('[data-testid="duration-selector"]').select('half');
      cy.get('[data-testid="staff-canvas"]').click(400, 250);
    });

    it('saves-project-with-composition', () => {
      // Save project
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="save-status"]').should('contain', 'Saved successfully');
      
      // Verify project saved in localStorage
      cy.window().then((win) => {
        const savedProjects = JSON.parse(win.localStorage.getItem('projects') || '[]');
        cy.wrap(savedProjects).should('have.length.greaterThan', 0);
        
        interface SavedProject {
          name: string;
          notes: unknown[];
        }
        
        const project = savedProjects.find((p: SavedProject) => p.name === 'Persistence Test');
        cy.wrap(project).should('not.be.undefined');
        cy.wrap(project?.notes).should('have.length', 2);
      });
    });

    it('autosaves-during-composition', () => {
      // Enable autosave
      cy.get('[data-testid="settings-button"]').click();
      cy.get('[data-testid="autosave-toggle"]').check();
      cy.get('[data-testid="settings-close"]').click();
      
      // Add note (should trigger autosave)
      cy.get('[data-testid="pitch-selector"]').select('E4');
      cy.get('[data-testid="duration-selector"]').select('eighth');
      cy.get('[data-testid="staff-canvas"]').click(600, 250);
      
      // Verify autosave indicator
      cy.get('[data-testid="autosave-status"]').should('contain', 'Auto-saved');
      cy.get('[data-testid="note-count"]').should('contain', '3');
    });

    it('recovers-unsaved-changes', () => {
      // Add additional note without saving
      cy.get('[data-testid="pitch-selector"]').select('A4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(500, 250);
      
      // Navigate away without saving
      cy.get('[data-testid="home-button"]').click();
      cy.get('[data-testid="discard-changes"]').click(); // Confirm discard
      
      // Navigate back to editor
      cy.get('[data-testid="continue-editing-button"]').click();
      
      // Should prompt for recovery
      cy.get('[data-testid="recovery-dialog"]').should('be.visible');
      cy.get('[data-testid="recover-changes"]').click();
      
      // Verify changes recovered
      cy.get('[data-testid="note-count"]').should('contain', '3');
      cy.get('[data-testid="note-list"]').should('contain', 'A4');
    });
  });

  context('composition-playback', () => {
    beforeEach(() => {
      // Create project with melody
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Playback Test');
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add melody notes
      const melody = [
        { pitch: 'C4', duration: 'quarter', x: 200 },
        { pitch: 'D4', duration: 'quarter', x: 300 },
        { pitch: 'E4', duration: 'quarter', x: 400 },
        { pitch: 'F4', duration: 'half', x: 500 }
      ];
      
      melody.forEach(note => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click(note.x, 250);
      });
    });

    it('plays-composition-from-start', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      // Verify playhead movement
      cy.get('[data-testid="playhead"]').should('be.visible');
      cy.get('[data-testid="current-time"]').should('not.contain', '0:00');
      
      // Wait for playback to complete
      cy.get('[data-testid="playback-status"]', { timeout: 10000 }).should('contain', 'Stopped');
    });

    it('pauses-and-resumes-playback', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      // Pause
      cy.get('[data-testid="pause-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Paused');
      
      // Store current time
      cy.get('[data-testid="current-time"]').then(() => {
        // Wait briefly then resume
        cy.wait(500);
        cy.get('[data-testid="resume-button"]').click();
        cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
        
        // Verify time continues from pause point
        cy.get('[data-testid="current-time"]').should('not.contain', '0:00');
      });
    });

    it('stops-and-resets-playback', () => {
      // Start playback
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      
      // Let it play briefly
      cy.wait(1000);
      
      // Stop playback
      cy.get('[data-testid="stop-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Stopped');
      cy.get('[data-testid="current-time"]').should('contain', '0:00');
      cy.get('[data-testid="playhead"]').should('not.be.visible');
    });
  });

  context('workflow-integration', () => {
    it('completes-full-compose-workflow', () => {
      const projectName = 'Complete Workflow Test';
      
      // Step 1: Create project
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Step 2: Compose melody
      const composition = [
        { pitch: 'C4', duration: 'quarter' },
        { pitch: 'E4', duration: 'quarter' },
        { pitch: 'G4', duration: 'half' },
        { pitch: 'C5', duration: 'quarter' }
      ];
      
      composition.forEach((note, index) => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click((index + 1) * 150 + 100, 250);
      });
      
      // Step 3: Preview composition
      cy.get('[data-testid="play-button"]').click();
      cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
      cy.wait(2000); // Let it play
      cy.get('[data-testid="stop-button"]').click();
      
      // Step 4: Save project
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="save-status"]').should('contain', 'Saved successfully');
      
      // Step 5: Verify project persistence
      cy.get('[data-testid="home-button"]').click();
      cy.get('[data-testid="recent-projects"]').should('contain', projectName);
      
      // Step 6: Reload and verify
      cy.get('[data-testid="recent-projects"]').contains(projectName).click();
      cy.get('[data-testid="project-title"]').should('contain', projectName);
      cy.get('[data-testid="note-count"]').should('contain', '4');
      
      // Verify all notes preserved
      composition.forEach(note => {
        cy.get('[data-testid="note-list"]').should('contain', note.pitch);
      });
    });
  });

  context('video-export-workflow', () => {
    beforeEach(() => {
      // Create project with composition for export tests
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Video Export Test');
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add test composition
      cy.get('[data-testid="note-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="multi-staff-canvas"]').click(200, 250);
    });

    it('opens-video-export-modal', () => {
      // Open video export
      cy.get('[data-testid="video-export-button"]').click();
      cy.get('[data-testid="video-export-modal"]').should('be.visible');
      
      // Verify export controls
      cy.get('[data-testid="video-export-controls"]').should('be.visible');
      cy.get('[data-testid="quality-selector"]').should('be.visible');
      cy.get('[data-testid="format-selector"]').should('be.visible');
    });

    it('configures-export-settings', () => {
      cy.get('[data-testid="video-export-button"]').click();
      
      // Test quality settings
      cy.get('[data-testid="quality-selector"]').select('hi-res');
      cy.get('[data-testid="format-selector"]').select('mp4');
      cy.get('[data-testid="resolution-selector"]').select('1080p');
      
      // Verify estimated file size updates
      cy.get('[data-testid="estimated-size"]').should('contain', 'MB');
      
      // Start export (mock)
      cy.get('[data-testid="start-export-button"]').click();
      cy.get('[data-testid="export-progress"]').should('be.visible');
    });

    it('handles-export-progress', () => {
      cy.get('[data-testid="video-export-button"]').click();
      cy.get('[data-testid="start-export-button"]').click();
      
      // Verify progress tracking
      cy.get('[data-testid="export-progress-bar"]').should('be.visible');
      cy.get('[data-testid="progress-percentage"]').should('contain', '%');
      cy.get('[data-testid="estimated-time"]').should('be.visible');
      
      // Test cancel functionality
      cy.get('[data-testid="cancel-export-button"]').click();
      cy.get('[data-testid="export-progress"]').should('not.exist');
    });
  });

  context('memory-monitoring', () => {
    beforeEach(() => {
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Memory Test');
      cy.get('[data-testid="create-project-confirm"]').click();
    });

    it('displays-memory-usage', () => {
      // Verify memory monitor
      cy.get('[data-testid="memory-monitor"]').should('be.visible');
      cy.get('[data-testid="memory-usage-bar"]').should('be.visible');
      cy.get('[data-testid="memory-percentage"]').should('contain', '%');
    });

    it('shows-memory-warnings', () => {
      // Simulate high memory usage (mock)
      cy.window().then((win) => {
        // Trigger memory warning through window property
        win.dispatchEvent(new CustomEvent('memory-warning', { 
          detail: { level: 'warning', usage: 85 } 
        }));
      });
      
      cy.get('[data-testid="memory-warning"]').should('be.visible');
      cy.get('[data-testid="memory-warning"]').should('contain', 'High memory usage');
    });
  });

  context('responsive-layout', () => {
    it('adapts-to-mobile-viewport', () => {
      // Test mobile layout
      cy.viewport(375, 667); // iPhone SE
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Mobile Test');
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Verify mobile constraints are applied
      cy.get('[data-testid="mobile-warning-display"]').should('be.visible');
      cy.get('[data-testid="responsive-layout"]').should('have.class', 'mobile-layout');
      
      // Verify sidebar is collapsible on mobile
      cy.get('[data-testid="sidebar-toggle"]').should('be.visible');
    });

    it('adapts-to-desktop-viewport', () => {
      // Test desktop layout
      cy.viewport(1920, 1080); // Full HD
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Desktop Test');
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Verify desktop layout features
      cy.get('[data-testid="responsive-layout"]').should('have.class', 'desktop-layout');
      cy.get('[data-testid="left-sidebar"]').should('be.visible');
      cy.get('[data-testid="right-sidebar"]').should('be.visible');
    });
  });
});