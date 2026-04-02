/// <reference types="cypress" />

describe('project-management', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
  });

  context('project-crud-operations', () => {
    it('creates-multiple-projects', () => {
      const projects = ['Symphony No. 1', 'Jazz Improvisation', 'Classical Etude'];
      
      projects.forEach((projectName) => {
        // Create project
        cy.get('[data-testid="new-project-button"]').click();
        cy.get('[data-testid="project-name-input"]').type(projectName);
        cy.get('[data-testid="create-project-confirm"]').click();
        
        // Verify project created
        cy.get('[data-testid="project-title"]').should('contain', projectName);
        
        // Add a test note to make it unique
        cy.get('[data-testid="note-selector"]').select('C4');
        cy.get('[data-testid="duration-selector"]').select('quarter');
        cy.get('[data-testid="multi-staff-canvas"]').click(200, 250);
        
        // Save project
        cy.get('[data-testid="save-button"]').click();
        cy.get('[data-testid="save-status"]').should('contain', 'Saved successfully');
        
        // Return to home
        cy.get('[data-testid="home-button"]').click();
      });
      
      // Verify all projects listed
      projects.forEach(projectName => {
        cy.get('[data-testid="project-list"]').should('contain', projectName);
      });
    });

    it('loads-existing-project', () => {
      const projectName = 'Load Test Project';
      const testNotes = [
        { pitch: 'C4', duration: 'quarter', x: 200 },
        { pitch: 'E4', duration: 'half', x: 400 },
        { pitch: 'G4', duration: 'quarter', x: 600 }
      ];
      
      // Create and save project
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add test composition
      testNotes.forEach(note => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click(note.x, 250);
      });
      
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="home-button"]').click();
      
      // Load project
      cy.get('[data-testid="project-list"]').contains(projectName).click();
      cy.get('[data-testid="load-confirm"]').click();
      
      // Verify project loaded correctly
      cy.get('[data-testid="project-title"]').should('contain', projectName);
      cy.get('[data-testid="note-count"]').should('contain', '3');
      
      // Verify notes restored
      testNotes.forEach(note => {
        cy.get('[data-testid="note-list"]').should('contain', note.pitch);
      });
    });

    it('updates-existing-project', () => {
      const originalName = 'Original Project';
      const updatedName = 'Updated Project';
      
      // Create project
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(originalName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add initial note
      cy.get('[data-testid="pitch-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(200, 250);
      cy.get('[data-testid="save-button"]').click();
      
      // Update project name
      cy.get('[data-testid="project-settings"]').click();
      cy.get('[data-testid="project-name-edit"]').clear().type(updatedName);
      cy.get('[data-testid="project-settings-save"]').click();
      
      // Add more notes
      cy.get('[data-testid="pitch-selector"]').select('E4');
      cy.get('[data-testid="staff-canvas"]').click(400, 250);
      
      cy.get('[data-testid="pitch-selector"]').select('G4');
      cy.get('[data-testid="staff-canvas"]').click(600, 250);
      
      // Save updates
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="home-button"]').click();
      
      // Verify updated project
      cy.get('[data-testid="project-list"]').should('contain', updatedName);
      cy.get('[data-testid="project-list"]').should('not.contain', originalName);
      
      // Load and verify changes
      cy.get('[data-testid="project-list"]').contains(updatedName).click();
      cy.get('[data-testid="load-confirm"]').click();
      
      cy.get('[data-testid="project-title"]').should('contain', updatedName);
      cy.get('[data-testid="note-count"]').should('contain', '3');
    });

    it('deletes-project', () => {
      const projectName = 'Project to Delete';
      
      // Create project
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add content and save
      cy.get('[data-testid="pitch-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(200, 250);
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="home-button"]').click();
      
      // Verify project exists
      cy.get('[data-testid="project-list"]').should('contain', projectName);
      
      // Delete project
      cy.get('[data-testid="project-list"]').contains(projectName).within(() => {
        cy.get('[data-testid="delete-project-button"]').click();
      });
      
      // Confirm deletion
      cy.get('[data-testid="delete-confirm-dialog"]').should('be.visible');
      cy.get('[data-testid="delete-confirm-button"]').click();
      
      // Verify project deleted
      cy.get('[data-testid="project-list"]').should('not.contain', projectName);
      cy.get('[data-testid="deletion-success"]').should('contain', 'Project deleted successfully');
    });
  });

  context('project-validation', () => {
    it('prevents-duplicate-project-names', () => {
      const projectName = 'Duplicate Name Test';
      
      // Create first project
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="home-button"]').click();
      
      // Attempt to create second project with same name
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Should show error
      cy.get('[data-testid="validation-error"]').should('contain', 'Project name already exists');
      cy.get('[data-testid="project-name-input"]').should('have.class', 'error');
    });

    it('validates-project-name-length', () => {
      // Test empty name
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="validation-error"]').should('contain', 'Project name is required');
      
      // Test name too short
      cy.get('[data-testid="project-name-input"]').type('A');
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="validation-error"]').should('contain', 'Project name must be at least 3 characters');
      
      // Test name too long
      const longName = 'A'.repeat(101);
      cy.get('[data-testid="project-name-input"]').clear().type(longName);
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="validation-error"]').should('contain', 'Project name must be less than 100 characters');
    });

    it('validates-special-characters', () => {
      const invalidNames = ['Test/Project', 'Test\\Project', 'Test|Project', 'Test<Project'];
      
      invalidNames.forEach(name => {
        cy.get('[data-testid="new-project-button"]').click();
        cy.get('[data-testid="project-name-input"]').type(name);
        cy.get('[data-testid="create-project-confirm"]').click();
        
        cy.get('[data-testid="validation-error"]').should('contain', 'Invalid characters in project name');
        cy.get('[data-testid="project-create-cancel"]').click();
      });
    });
  });

  context('project-metadata', () => {
    it('tracks-project-creation-date', () => {
      const projectName = 'Metadata Test';
      
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="home-button"]').click();
      
      // Check metadata in project list
      cy.get('[data-testid="project-list"]').contains(projectName).within(() => {
        cy.get('[data-testid="creation-date"]').should('contain', new Date().getFullYear());
        cy.get('[data-testid="last-modified"]').should('contain', 'Today');
      });
    });

    it('updates-last-modified-date', () => {
      const projectName = 'Modified Date Test';
      
      // Create project
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      cy.get('[data-testid="save-button"]').click();
      
      // Get initial modification time
      cy.get('[data-testid="home-button"]').click();
      cy.get('[data-testid="project-list"]').contains(projectName).within(() => {
        cy.get('[data-testid="last-modified"]').should('contain', 'Today');
      });
      
      // Modify project
      cy.get('[data-testid="project-list"]').contains(projectName).click();
      cy.get('[data-testid="load-confirm"]').click();
      
      cy.get('[data-testid="pitch-selector"]').select('D4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="staff-canvas"]').click(300, 250);
      cy.get('[data-testid="save-button"]').click();
      
      // Verify modification time updated
      cy.get('[data-testid="home-button"]').click();
      cy.get('[data-testid="project-list"]').contains(projectName).within(() => {
        cy.get('[data-testid="last-modified"]').should('contain', 'Today');
        cy.get('[data-testid="note-count-preview"]').should('contain', '1 note');
      });
    });

    it('displays-project-statistics', () => {
      const projectName = 'Statistics Test';
      
      // Create project with various content
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type(projectName);
      cy.get('[data-testid="create-project-confirm"]').click();
      
      // Add notes with different durations
      const notes = [
        { pitch: 'C4', duration: 'whole' },
        { pitch: 'D4', duration: 'half' },
        { pitch: 'E4', duration: 'quarter' },
        { pitch: 'F4', duration: 'eighth' }
      ];
      
      notes.forEach((note, index) => {
        cy.get('[data-testid="pitch-selector"]').select(note.pitch);
        cy.get('[data-testid="duration-selector"]').select(note.duration);
        cy.get('[data-testid="staff-canvas"]').click((index + 1) * 150, 250);
      });
      
      // Set tempo
      cy.get('[data-testid="tempo-input"]').clear().type('140');
      
      cy.get('[data-testid="save-button"]').click();
      cy.get('[data-testid="home-button"]').click();
      
      // Verify statistics in project list
      cy.get('[data-testid="project-list"]').contains(projectName).within(() => {
        cy.get('[data-testid="note-count-preview"]').should('contain', '4 notes');
        cy.get('[data-testid="tempo-preview"]').should('contain', '140 BPM');
        cy.get('[data-testid="duration-preview"]').should('contain', 'Duration:');
      });
    });
  });

  context('project-search-and-filter', () => {
    beforeEach(() => {
      // Create multiple test projects
      const projects = [
        { name: 'Classical Symphony', genre: 'Classical' },
        { name: 'Jazz Standard', genre: 'Jazz' },
        { name: 'Rock Anthem', genre: 'Rock' },
        { name: 'Classical Sonata', genre: 'Classical' }
      ];
      
      projects.forEach(project => {
        cy.get('[data-testid="new-project-button"]').click();
        cy.get('[data-testid="project-name-input"]').type(project.name);
        cy.get('[data-testid="create-project-confirm"]').click();
        
        // Add genre metadata
        cy.get('[data-testid="project-settings"]').click();
        cy.get('[data-testid="genre-select"]').select(project.genre);
        cy.get('[data-testid="project-settings-save"]').click();
        
        cy.get('[data-testid="save-button"]').click();
        cy.get('[data-testid="home-button"]').click();
      });
    });

    it('searches-projects-by-name', () => {
      // Search for "Classical" projects
      cy.get('[data-testid="project-search"]').type('Classical');
      
      cy.get('[data-testid="project-list"]').should('contain', 'Classical Symphony');
      cy.get('[data-testid="project-list"]').should('contain', 'Classical Sonata');
      cy.get('[data-testid="project-list"]').should('not.contain', 'Jazz Standard');
      cy.get('[data-testid="project-list"]').should('not.contain', 'Rock Anthem');
    });

    it('filters-projects-by-genre', () => {
      // Filter by Jazz genre
      cy.get('[data-testid="genre-filter"]').select('Jazz');
      
      cy.get('[data-testid="project-list"]').should('contain', 'Jazz Standard');
      cy.get('[data-testid="project-list"]').should('not.contain', 'Classical Symphony');
      cy.get('[data-testid="project-list"]').should('not.contain', 'Rock Anthem');
      cy.get('[data-testid="project-list"]').should('not.contain', 'Classical Sonata');
    });

    it('sorts-projects-by-date', () => {
      // Sort by creation date (newest first)
      cy.get('[data-testid="sort-select"]').select('Date (Newest)');
      
      cy.get('[data-testid="project-list"] [data-testid="project-item"]').first()
        .should('contain', 'Classical Sonata');
      
      // Sort by creation date (oldest first)
      cy.get('[data-testid="sort-select"]').select('Date (Oldest)');
      
      cy.get('[data-testid="project-list"] [data-testid="project-item"]').first()
        .should('contain', 'Classical Symphony');
    });

    it('clears-search-and-filters', () => {
      // Apply search and filter
      cy.get('[data-testid="project-search"]').type('Jazz');
      cy.get('[data-testid="genre-filter"]').select('Classical');
      
      // Should show no results (search for Jazz but filter Classical)
      cy.get('[data-testid="no-results"]').should('be.visible');
      
      // Clear all filters
      cy.get('[data-testid="clear-filters"]').click();
      
      // Should show all projects again
      cy.get('[data-testid="project-list"] [data-testid="project-item"]').should('have.length', 4);
    });
  });

  context('bar-management', () => {
    beforeEach(() => {
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Bar Management Test');
      cy.get('[data-testid="create-project-confirm"]').click();
    });

    it('opens-bar-management-modal', () => {
      // Open bar management
      cy.get('[data-testid="bar-management-button"]').click();
      cy.get('[data-testid="bar-management-modal"]').should('be.visible');
      
      // Verify bar management controls
      cy.get('[data-testid="bar-management"]').should('be.visible');
      cy.get('[data-testid="bar-list"]').should('be.visible');
      cy.get('[data-testid="add-bar-button"]').should('be.visible');
    });

    it('adds-and-removes-bars', () => {
      cy.get('[data-testid="bar-management-button"]').click();
      
      // Verify initial bar count
      cy.get('[data-testid="bar-list"] .bar-item').should('have.length', 1);
      
      // Add new bar
      cy.get('[data-testid="add-bar-button"]').click();
      cy.get('[data-testid="bar-list"] .bar-item').should('have.length', 2);
      
      // Remove bar
      cy.get('[data-testid="bar-list"] .bar-item').last().within(() => {
        cy.get('[data-testid="remove-bar-button"]').click();
      });
      cy.get('[data-testid="bar-list"] .bar-item').should('have.length', 1);
    });

    it('changes-time-signature', () => {
      cy.get('[data-testid="bar-management-button"]').click();
      
      // Select time signature
      cy.get('[data-testid="bar-list"] .bar-item').first().within(() => {
        cy.get('[data-testid="time-signature-selector"]').click();
      });
      
      cy.get('[data-testid="time-signature-3-4"]').click();
      
      // Verify change applied
      cy.get('[data-testid="bar-list"] .bar-item').first().should('contain', '3/4');
    });
  });

  context('audio-quality-management', () => {
    beforeEach(() => {
      cy.get('[data-testid="new-project-button"]').click();
      cy.get('[data-testid="project-name-input"]').type('Audio Quality Test');
      cy.get('[data-testid="create-project-confirm"]').click();
    });

    it('changes-audio-quality-settings', () => {
      // Verify audio quality selector is visible
      cy.get('[data-testid="audio-quality-selector"]').should('be.visible');
      
      // Change quality setting
      cy.get('[data-testid="audio-quality-selector"]').select('hi-res');
      
      // Verify memory impact warning
      cy.get('[data-testid="memory-monitor"]').should('contain', 'High quality');
    });

    it('shows-quality-impact-on-memory', () => {
      // Select high quality
      cy.get('[data-testid="audio-quality-selector"]').select('hi-res');
      
      // Verify memory usage increases
      cy.get('[data-testid="memory-usage-bar"]').then(($bar) => {
        const highUsage = $bar.attr('data-usage');
        
        // Switch to lower quality
        cy.get('[data-testid="audio-quality-selector"]').select('draft');
        
        // Verify memory usage decreases
        cy.get('[data-testid="memory-usage-bar"]').then(($newBar) => {
          const lowUsage = $newBar.attr('data-usage') || '0';
          cy.wrap(parseInt(lowUsage)).should('be.lessThan', parseInt(highUsage || '100'));
        });
      });
    });
  });
});