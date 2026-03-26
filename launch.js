#!/usr/bin/env node

/**
 * Musicalist Development Launcher
 * Comprehensive launch script for development with build error detection
 */

import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const colors = {
  red: '\x1b[31m%s\x1b[0m',
  green: '\x1b[32m%s\x1b[0m', 
  yellow: '\x1b[33m%s\x1b[0m',
  blue: '\x1b[34m%s\x1b[0m',
  magenta: '\x1b[35m%s\x1b[0m',
  cyan: '\x1b[36m%s\x1b[0m',
};

function log(color, message) {
  console.log(color, message);
}

function runCommand(command, options = {}) {
  return new Promise((resolve, reject) => {
    log(colors.cyan, `\n🔧 Running: ${command}`);
    const child = spawn(command, { 
      shell: true, 
      stdio: 'inherit',
      cwd: process.cwd(),
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
  });
}

async function checkProject() {
  log(colors.blue, '\n🔍 Checking Musicalist project...');
  
  const requiredFiles = [
    'package.json',
    'vite.config.ts',
    'tsconfig.json',
    'src/main.tsx',
    'src/App.tsx'
  ];
  
  for (const file of requiredFiles) {
    if (!existsSync(file)) {
      log(colors.red, `❌ Missing required file: ${file}`);
      return false;
    }
  }
  
  log(colors.green, '✅ Project structure looks good');
  return true;
}

async function installDependencies() {
  log(colors.blue, '\n📦 Checking dependencies...');
  
  if (!existsSync('node_modules')) {
    log(colors.yellow, '📦 Installing dependencies...');
    await runCommand('npm install');
  } else {
    log(colors.green, '✅ Dependencies already installed');
  }
}

async function compileTypeScript() {
  log(colors.blue, '\n🔨 Compiling TypeScript...');
  
  try {
    await runCommand('npx tsc -b');
    log(colors.green, '✅ TypeScript compilation successful');
    return true;
  } catch (error) {
    log(colors.red, '❌ TypeScript compilation failed');
    log(colors.yellow, '⚠️  Starting dev server anyway (hot reload will show errors)');
    return false;
  }
}

async function startDevServer() {
  log(colors.blue, '\n🚀 Starting development server...');
  log(colors.cyan, '📍 Dev server will be available at: http://localhost:5173');
  log(colors.cyan, '🔄 Hot reload enabled - changes will update automatically');
  log(colors.magenta, '\n📋 Development Commands:');
  log(colors.white, '   npm run compile  - TypeScript compilation only');  
  log(colors.white, '   npm run lint     - Run ESLint');
  log(colors.white, '   npm run fix      - Auto-fix ESLint issues');
  log(colors.white, '   npm run build    - Production build');
  log(colors.white, '   Ctrl+C          - Stop server');
  
  await runCommand('npx vite --host --open');
}

async function main() {
  console.clear();
  log(colors.magenta, '🎵 MUSICALIST DEVELOPMENT LAUNCHER 🎵\n');
  log(colors.cyan, 'React Music Composition & Video Export Tool\n');
  
  try {
    // Check project structure
    const projectOk = await checkProject();
    if (!projectOk) {
      log(colors.red, '\n❌ Project structure check failed');
      process.exit(1);
    }
    
    // Install dependencies
    await installDependencies();
    
    // Compile TypeScript (optional)
    await compileTypeScript();
    
    // Start development server
    await startDevServer();
    
  } catch (error) {
    log(colors.red, `\n💥 Error: ${error.message}`);
    log(colors.yellow, '\n🔧 Troubleshooting:');
    log(colors.white, '   1. npm run clean      - Clean build cache');
    log(colors.white, '   2. npm run reset      - Fresh install');  
    log(colors.white, '   3. npm run type-check - Check TypeScript errors');
    process.exit(1);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--build')) {
  // Production build mode
  (async () => {
    log(colors.blue, '🏗️  Production build mode');
    await checkProject();
    await installDependencies();
    await runCommand('npm run build');
    log(colors.green, '\n✅ Build complete! Run npm run start to preview');
  })();
} else if (args.includes('--clean')) {
  // Clean install mode
  (async () => {
    log(colors.yellow, '🧹 Clean install mode');
    await runCommand('npm run clean');
    await runCommand('npm install');
    await main();
  })();
} else {
  // Default development mode
  main();
}