/// <reference types="cypress" />

describe('advanced-components', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.clearLocalStorage();
    
    // Create test project for advanced component testing
    cy.get('[data-testid="new-project-button"]').click();
    cy.get('[data-testid="project-name-input"]').type('Advanced Components Test');
    cy.get('[data-testid="create-project-confirm"]').click();
  });

  context('color-mapping-editor', () => {
    it('opens-color-mapping-modal', () => {
      // Open color mapping editor
      cy.get('[data-testid="color-mapping-button"]').click();
      cy.get('[data-testid="color-mapping-modal"]').should('be.visible');
      
      // Verify color mapping editor components
      cy.get('[data-testid="color-mapping-editor"]').should('be.visible');
      cy.get('[data-testid="color-rule-list"]').should('be.visible');
      cy.get('[data-testid="add-color-rule-button"]').should('be.visible');
    });

    it('creates-pitch-based-color-rule', () => {
      cy.get('[data-testid="color-mapping-button"]').click();
      
      // Add new color rule
      cy.get('[data-testid="add-color-rule-button"]').click();
      
      // Configure pitch-based rule
      cy.get('[data-testid="rule-condition-type"]').select('pitch');
      cy.get('[data-testid="pitch-range-min"]').select('C4');
      cy.get('[data-testid="pitch-range-max"]').select('G4');
      cy.get('[data-testid="color-picker"]').click();
      cy.get('[data-testid="color-picker-red"]').click();
      
      // Save rule
      cy.get('[data-testid="save-color-rule"]').click();
      
      // Verify rule appears in list
      cy.get('[data-testid="color-rule-list"]').should('contain', 'C4-G4');
    });

    it('applies-color-rules-to-notes', () => {
      // Create color rule first
      cy.get('[data-testid="color-mapping-button"]').click();
      cy.get('[data-testid="add-color-rule-button"]').click();
      cy.get('[data-testid="rule-condition-type"]').select('pitch');
      cy.get('[data-testid="pitch-range-min"]').select('C4');
      cy.get('[data-testid="pitch-range-max"]').select('E4');
      cy.get('[data-testid="color-picker-red"]').click();
      cy.get('[data-testid="save-color-rule"]').click();
      cy.get('[data-testid="close-modal"]').click();
      
      // Add notes that should match the rule
      cy.get('[data-testid="note-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="multi-staff-canvas"]').click(200, 250);
      
      // Verify note is colored according to rule
      cy.get('[data-testid="multi-staff-canvas"] [data-note="0"]').should('have.css', 'fill', 'rgb(255, 0, 0)');
    });

    it('loads-color-presets', () => {
      cy.get('[data-testid="color-mapping-button"]').click();
      
      // Load teaching basic preset
      cy.get('[data-testid="preset-selector"]').select('teaching-basic');
      cy.get('[data-testid="load-preset-button"]').click();
      
      // Verify preset rules are loaded
      cy.get('[data-testid="color-rule-list"] .color-rule-item').should('have.length.greaterThan', 0);
      cy.get('[data-testid="color-rule-list"]').should('contain', 'Bass Notes');
      cy.get('[data-testid="color-rule-list"]').should('contain', 'Melody');
    });
  });

  context('staff-manager', () => {
    it('displays-all-available-staves', () => {
      // Verify staff manager shows multiple staves
      cy.get('[data-testid="staff-manager"]').should('be.visible');
      cy.get('[data-testid="staff-list"] .staff-item').should('have.length.at.least', 1);
      
      // Verify staff properties
      cy.get('[data-testid="staff-list"] .staff-item').first().within(() => {
        cy.get('[data-testid="staff-name"]').should('be.visible');
        cy.get('[data-testid="clef-selector"]').should('be.visible');
        cy.get('[data-testid="volume-control"]').should('be.visible');
      });
    });

    it('changes-staff-clef', () => {
      // Change clef for first staff
      cy.get('[data-testid="staff-list"] .staff-item').first().within(() => {
        cy.get('[data-testid="clef-selector"]').select('bass');
      });
      
      // Verify clef change reflected in multi-staff canvas
      cy.get('[data-testid="multi-staff-canvas"] .staff').first().should('contain', '𝄢'); // Bass clef symbol
    });

    it('adjusts-staff-volume', () => {
      // Adjust volume for first staff
      cy.get('[data-testid="staff-list"] .staff-item').first().within(() => {
        cy.get('[data-testid="volume-control"]').invoke('val', 0.5).trigger('change');
      });
      
      // Verify volume indicator updated
      cy.get('[data-testid="staff-list"] .staff-item').first().within(() => {
        cy.get('[data-testid="volume-display"]').should('contain', '50%');
      });
    });

    it('toggles-staff-visibility', () => {
      // Hide first staff
      cy.get('[data-testid="staff-list"] .staff-item').first().within(() => {
        cy.get('[data-testid="visibility-toggle"]').click();
      });
      
      // Verify staff is hidden in canvas
      cy.get('[data-testid="multi-staff-canvas"] .staff').first().should('have.class', 'staff-hidden');
    });

    it('reorders-staves-with-drag-drop', () => {
      // Get initial staff order
      cy.get('[data-testid="staff-list"] .staff-item').first().invoke('text').as('firstStaffName');
      cy.get('[data-testid="staff-list"] .staff-item').eq(1).invoke('text').as('secondStaffName');
      
      // Perform drag and drop (simulate)
      cy.get('[data-testid="staff-list"] .staff-item').first()
        .trigger('dragstart', { dataTransfer: new DataTransfer() });
      cy.get('[data-testid="staff-list"] .staff-item').eq(1)
        .trigger('dragover').trigger('drop');
      
      // Verify order changed
      cy.get('[data-testid="staff-list"] .staff-item').first().invoke('text').should('not.equal', '@firstStaffName');
    });
  });

  context('mobile-constraints', () => {
    it('detects-mobile-device-capabilities', () => {
      // Simulate mobile viewport
      cy.viewport(375, 667);
      
      // Verify mobile constraints are detected
      cy.get('[data-testid="mobile-warning-display"]').should('be.visible');
      cy.get('[data-testid="device-capabilities"]').should('contain', 'Mobile device detected');
    });

    it('shows-memory-limitations', () => {
      cy.viewport(375, 667);
      
      // Verify memory warnings for mobile
      cy.get('[data-testid="mobile-warning-display"]').within(() => {
        cy.get('[data-testid="memory-limitation-warning"]').should('be.visible');
        cy.get('[data-testid="performance-tips"]').should('be.visible');
      });
    });

    it('adapts-ui-for-mobile-constraints', () => {
      cy.viewport(375, 667);
      
      // Verify UI adaptations
      cy.get('[data-testid="responsive-layout"]').should('have.class', 'mobile-constrained');
      
      // Verify some advanced features are hidden or simplified
      cy.get('[data-testid="video-export-button"]').should('not.be.visible');
      cy.get('[data-testid="staff-manager"]').should('have.class', 'mobile-simplified');
    });

    it('provides-mobile-performance-optimizations', () => {
      cy.viewport(375, 667);
      
      // Add several notes to test performance optimization
      for (let i = 0; i < 5; i++) {
        cy.get('[data-testid="note-selector"]').select('C4');
        cy.get('[data-testid="duration-selector"]').select('quarter');
        cy.get('[data-testid="multi-staff-canvas"]').click(200 + (i * 50), 250);
      }
      
      // Verify mobile optimizations are applied
      cy.get('[data-testid="multi-staff-canvas"]').should('have.attr', 'data-mobile-optimized', 'true');
      cy.get('[data-testid="render-quality"]').should('contain', 'Low');
    });
  });

  context('project-management-advanced', () => {
    it('handles-large-project-memory-management', () => {
      // Create a large composition to test memory management
      for (let i = 0; i < 20; i++) {
        cy.get('[data-testid="note-selector"]').select(['C4', 'D4', 'E4', 'F4', 'G4'][i % 5]);
        cy.get('[data-testid="duration-selector"]').select('quarter');
        cy.get('[data-testid="multi-staff-canvas"]').click(100 + (i * 30), 250);
      }
      
      // Verify memory monitor shows increased usage
      cy.get('[data-testid="memory-monitor"]').within(() => {
        cy.get('[data-testid="memory-usage-bar"]').should('have.attr', 'data-usage').then((usage) => {
          const usageValue = usage as unknown as string;
          expect(parseInt(usageValue)).to.be.greaterThan(10);
        });
      });
      
      // Verify project auto-optimization kicks in
      cy.get('[data-testid="auto-optimization-notice"]').should('be.visible');
    });

    it('tests-project-backup-and-recovery', () => {
      // Add some content
      cy.get('[data-testid="note-selector"]').select('C4');
      cy.get('[data-testid="duration-selector"]').select('quarter');
      cy.get('[data-testid="multi-staff-canvas"]').click(200, 250);
      
      // Save project
      cy.get('[data-testid="save-button"]').click();
      
      // Simulate browser crash/reload
      cy.reload();
      
      // Verify recovery dialog appears
      cy.get('[data-testid="recovery-dialog"]').should('be.visible');
      cy.get('[data-testid="recover-project-button"]').click();
      
      // Verify project was recovered
      cy.get('[data-testid="project-title"]').should('contain', 'Advanced Components Test');
      cy.get('[data-testid="note-count"]').should('contain', '1');
    });
  });

  context('performance-monitoring', () => {
    it('monitors-render-performance', () => {
      // Add complex composition
      for (let i = 0; i < 10; i++) {
        cy.get('[data-testid="note-selector"]').select('C4');
        cy.get('[data-testid="duration-selector"]').select('eighth');
        cy.get('[data-testid="multi-staff-canvas"]').click(100 + (i * 20), 250);
      }
      
      // Start playback to test render performance
      cy.get('[data-testid="play-button"]').click();
      
      // Verify performance metrics are collected
      cy.get('[data-testid="performance-monitor"]').should('be.visible');
      cy.get('[data-testid="fps-counter"]').should('be.visible');
      cy.get('[data-testid="render-time"]').should('contain', 'ms');
    });

    it('shows-performance-warnings', () => {
      // Simulate heavy load
      cy.window().then((win) => {
        // Trigger performance warning
        win.dispatchEvent(new CustomEvent('performance-warning', { 
          detail: { type: 'render-lag', fps: 25 } 
        }));
      });
      
      cy.get('[data-testid="performance-warning"]').should('be.visible');
      cy.get('[data-testid="performance-suggestions"]').should('contain', 'Consider reducing');
    });
  });
});