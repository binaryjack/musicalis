/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      createProject(name: string): Chainable<Element>;
      addNote(pitch: string, duration: string, position: number): Chainable<Element>;
      saveProject(): Chainable<Element>;
      loadProject(name: string): Chainable<Element>;
      playProject(): Chainable<Element>;
      waitForAudio(): Chainable<Element>;
      clearLocalStorage(): Chainable<Element>;
    }
    
    interface Window {
      audioContextReady?: boolean;
    }
  }
}

// Custom Cypress commands for music editor testing
Cypress.Commands.add('createProject', (name: string) => {
  cy.get('[data-testid="new-project-button"]').click();
  cy.get('[data-testid="project-name-input"]').type(name);
  cy.get('[data-testid="create-project-confirm"]').click();
  cy.get('[data-testid="editor-canvas"]').should('be.visible');
});

Cypress.Commands.add('addNote', (pitch: string, duration: string, position: number) => {
  // Select note properties
  cy.get('[data-testid="pitch-selector"]').select(pitch);
  cy.get('[data-testid="duration-selector"]').select(duration);
  
  // Click on staff canvas at position
  cy.get('[data-testid="staff-canvas"]')
    .click(position * 100 + 100, 200); // Convert position to pixel coordinates
    
  // Verify note was added
  cy.get('[data-testid="note-list"]').should('contain', pitch);
});

Cypress.Commands.add('saveProject', () => {
  cy.get('[data-testid="save-button"]').click();
  cy.get('[data-testid="save-status"]').should('contain', 'Saved');
});

Cypress.Commands.add('loadProject', (name: string) => {
  cy.get('[data-testid="load-button"]').click();
  cy.get('[data-testid="project-list"]').contains(name).click();
  cy.get('[data-testid="load-confirm"]').click();
  cy.get('[data-testid="project-title"]').should('contain', name);
});

Cypress.Commands.add('playProject', () => {
  cy.get('[data-testid="play-button"]').click();
  cy.get('[data-testid="playback-status"]').should('contain', 'Playing');
});

Cypress.Commands.add('waitForAudio', () => {
  // Wait for audio context to be ready
  cy.window().then((win) => {
    return new Cypress.Promise((resolve) => {
      const checkAudio = () => {
        if ((win as Cypress.Window).audioContextReady) {
          resolve();
        } else {
          setTimeout(checkAudio, 100);
        }
      };
      checkAudio();
    });
  });
});

// clearLocalStorage is already a built-in Cypress command

export {};