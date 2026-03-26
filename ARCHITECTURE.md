# Architecture Documentation - Musicalist

## Core Requirements Analysis

### User Requirements
- Music scoring tool for teachers/educators
- Multi-layer piano composition (up to 16 staves)
- Synchronized audio playback with quality tiers
- Customizable note coloring for teaching
- Video export capabilities 
- Responsive design (desktop/tablet/mobile)

### Technical Requirements
- Responsive/intuitive scope
- Audio quality tiers: 22kHz (draft), 44.1kHz (mid), 48kHz (hi-res)
- Memory-optimized Redux with reselect
- Testing strategy: E2E (Cypress) + unit + integration
- Single MP4 export initially (extensible)

## Design Pattern Decisions

### State Management Architecture
**Redux with Saga Middleware**
- Normalized state structure: `bars.byId`, `notes.byId`, `bars[id].noteIds[]`
- Reselect memoized selectors (4-level hierarchy)
- Memory-aware buffer management with LRU cache
- Debounced persistence (500ms) on edit snap points

### Responsive Layout Strategy
**Orientation Constraints**
- Desktop: landscape-only with rotation warning
- Mobile: portrait-only with rotation warning
- Horizontal scroll for score progression
- Vertical scroll for staff navigation

### Dual-Mode Interaction System
**Design Mode vs Playback Mode**
```typescript
// Design Mode: Full user freedom
- Horizontal/vertical scroll enabled
- Click/drag note placement
- No playhead restrictions

// Playback Mode: Cursor-locked scrolling
- Horizontal scroll LOCKED to playhead
- Vertical staff scroll ENABLED (fluid)
- 3-state playhead algorithm
```

### 3-State Playhead Scroll Algorithm
**STATE 1: Free Movement**
- Playhead moves from left edge to center
- No viewport scrolling
- Condition: `playheadX < (viewportWidth / 2)`

**STATE 2: Center-Lock**  
- Playhead locked at center visually
- Viewport scrolls underneath
- Condition: `playheadX >= center && playheadX <= (contentWidth - center)`

**STATE 3: End Boundary**
- Viewport pinned to max scroll
- Playhead continues to right edge
- Condition: `playheadX > (contentWidth - viewportWidth/2)`

## Memory Management Strategy

### Device-Adaptive Buffer Allocation
```typescript
// RAM detection and allocation
const deviceMemory = navigator.deviceMemory; // 1, 2, 4, 8, 16 GB
const bufferCacheSize = Math.floor(deviceMemory * 0.15); // 15% of RAM
const maxCacheSize = Math.min(bufferCacheSize, 2048); // 2GB max
```

### Aggressive Buffer Preloading
- 10-bar lookahead preloading
- Dual-tier: immediate (±5 bars), deferred (5-10 bars)
- Auto-evict buffers >8 bars behind playhead
- Memory threshold alerts: 85% warning, 90% cleanup

### Quality-Aware Memory Warnings
```typescript
// Memory calculation per quality tier
const memoryRequired = (barCount × sampleRate × channels × 4) / 1048576; // MB
if (memoryRequired > allocatedCache) {
  displayWarning("⚠️ Quality may cause stuttering");
}
```

## Persistence Architecture

### Storage Adapter Pattern (DI)
```typescript
interface IStorageAdapter {
  save(key: string, data: unknown): Promise<void>;
  load(key: string): Promise<unknown | null>;
  clear(key?: string): Promise<void>;
  getUsagePercent(): Promise<number>;
}

// Phase 1: LocalStorageAdapter
// Phase 2: IndexedDBAdapter  
// Phase 3: DatabaseAdapter
```

### Edit Snap Point Strategy
**Persistence Triggers**
- Note placement/movement → snap point
- Bar completion → snap point
- Staff structure changes → snap point
- Project metadata changes → snap point
- Debounced 500ms from last snap point

## Component Architecture

### Strict Compliance Transformation
**From React to Pure Function Constructors**
```typescript
// Before (React)
export const Button: React.FC<Props> = ({ variant }) => { ... };

// After (Compliance)
export const createButton = function(params) {
  const element = document.createElement('button');
  // Pure function constructor pattern
  return Object.freeze({ element, update, destroy });
};
```

### Naming Convention Resolution
**Challenge**: kebab-case requirement vs JavaScript limitations
**Solution**: 
- File names: kebab-case (`create-button.ts`)
- Internal identifiers: camelCase (`createButton`) 
- Type names: PascalCase (`ButtonVariant`)
- String values: kebab-case (`'primary-button'`)

### File Structure Pattern
**One-Item-Per-File Compliance**
```
src/types/
├── uiTypes.ts              # UI-related types only
├── musicTypes.ts           # Music domain types only  
├── exportTypes.ts          # Export-related types only
└── ...

src/features/
├── createEditor.ts         # Editor constructor only
├── createProjects.ts       # Projects constructor only
└── ...
```

## Audio Engine Architecture

### Tone.js Integration
```typescript
export const createAudioEngine = function() {
  const synth = new Tone.PolySynth();
  const reverb = new Tone.Reverb();
  
  // Quality-aware context initialization
  const initContext = function(sampleRate) {
    Tone.context.dispose();
    Tone.setContext(new AudioContext({ sampleRate }));
  };
  
  return Object.freeze({ synth, reverb, initContext });
};
```

### Note-to-Frequency Mapping
```typescript
const noteToToneMap = {
  [MusicNote.C]: 'C4',
  [MusicNote.D]: 'D4',
  // ... complete chromatic mapping
};
```

## Video Export System

### FFmpeg.wasm Integration
```typescript
export const createVideoExporter = function() {
  const exportVideo = async function(project, format, quality) {
    // Canvas frame capture
    // Audio buffer extraction
    // FFmpeg processing with quality presets
    // Automatic download generation
  };
  
  return Object.freeze({ exportVideo });
};
```

### Quality Presets
- **Low**: 720p, 24fps, 1Mbps
- **Medium**: 1080p, 30fps, 3Mbps  
- **High**: 1080p, 60fps, 8Mbps
- **Ultra**: 4K, 60fps, 20Mbps

## Testing Strategy Implementation

### Coverage Requirements
- **E2E Tests (Cypress)**: User journey scenarios
  - Create project → compose bars → playback → export
- **Unit Tests**: Unpredictable components (95% coverage)
  - Audio calculations, color mapping, note validation
- **Integration Tests**: State flow validation
  - localStorage ↔ Redux ↔ selectors ↔ dispatchers

### Test File Colocation
```
ComponentName.ts
ComponentName.test.ts      // Same directory
ComponentName.e2e.spec.ts  // E2E scenarios
```

## Build System & Compliance

### TypeScript Configuration
```json
{
  "compilerOptions": {
    "strict": true,
    "verbatimModuleSyntax": true,
    "noImplicitAny": true,
    "noImplicitReturns": true
  }
}
```

### ESLint Rules
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## Performance Targets

### Benchmark Requirements
- Target: ≤10% of solid-js performance
- Memory usage monitoring via `performance.memory`
- Buffer cache hit ratio tracking
- Selector memoization efficiency

### Optimization Strategies
- Object.freeze() for immutable data
- Object.defineProperty() for non-enumerable methods
- LRU cache implementation
- Debounced DOM updates

## Migration Strategy

### Phase Implementation
**Phase 1**: localStorage + React (testing)
**Phase 2**: IndexedDB + optimization  
**Phase 3**: Remote storage + collaboration

### Rollback Strategy
- Schema versioning for localStorage
- Graceful degradation patterns
- Export/import functionality for data safety

## Current Implementation Status

### ✅ COMPLETED
- Type system architecture (camelCase compliant)
- Store architecture (Redux-free feature constructors)
- File structure (one-item-per-file pattern)
- Function constructors pattern with Object.freeze()
- TypeScript compilation (zero errors)

### ❌ MISSING CRITICAL
- DOM rendering engine
- Event binding system
- Component lifecycle management
- State-to-UI synchronization bridge
- App bootstrap integration

### 🔧 ROOT ISSUE
Architecture exists as isolated modules with no integration layer connecting store → components → DOM.

### 📋 NEXT MOVES
1. Build custom DOM rendering engine
2. Implement event delegation system
3. Create component mounting lifecycle
4. Wire state subscriptions to DOM updates
5. Integrate bootstrap system in main.tsx

---

**Status**: Foundation architecture complete, UI integration pending  
**Last Updated**: March 26, 2026  
**Compliance Level**: Ultra-strict (copilot instructions)  
**Build Status**: ✅ Zero TypeScript errors, ❌ Non-functional UI