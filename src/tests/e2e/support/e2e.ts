import './commands';
import '@cypress/code-coverage/support';

// Cypress E2E support configuration for music editor
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
  }
}

// Global test hooks
beforeEach(() => {
  cy.clearLocalStorage();
  cy.visit('/');
});

// Handle uncaught exceptions during tests
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore VexFlow and audio context errors during testing
  if (err.message.includes('VexFlow') || 
      err.message.includes('AudioContext') ||
      err.message.includes('Web Audio API')) {
    return false;
  }
  return true;
});

export {};