import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    supportFile: 'src/tests/e2e/support/e2e.ts',
    specPattern: 'src/tests/e2e/**/*.cy.ts',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      require('@cypress/code-coverage/task')(on, config);
      
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
      
      return config;
    },
    env: {
      coverage: true,
      codeCoverage: {
        exclude: ['cypress/**/*.*']
      }
    }
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    supportFile: 'src/tests/e2e/support/component.ts',
    specPattern: 'src/tests/e2e/components/**/*.cy.ts'
  }
});