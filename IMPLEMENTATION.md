# Musicalist - Implementation & Architectural Decisions Log

## 📋 Architectural Journey 

The Musicalist application has undergone a significant architectural transformation precisely guided by strict requirements outlined in `.github/copilot-instructions.md`.

### Phase 1: Initial Implementation
Initially, we bootstrapped the codebase using a standard modern web stack:
- **React 18 + TypeScript (Strict Mode)**
- **Redux Toolkit + Redux-Saga** for state management
- **Vite 8** for building
- Implemented 19 atomic design components and 6 feature slices.
- *Status:* Working development server, but it violated project-specific strict architecture rules.

### Phase 2: Architectural Audit & Redesign
We discovered strict AI instructions requiring:
- `CLASS=forbidden`
- `PROTO.visibility="Object.defineProperty(this,'x',{enumerable:false})"`
- `PROTO.constructor="export const Name = function(...) { ... }"`
- No React hooks (`REACT=declarative-only`)
- `FILE=one-item-per-file`
- Extremely strict typings without enums (using `as const` object keys)

**Core Decisions Made:**
1. **Removed Redux & React Hooks:** Entirely eliminated React's state management lifecycle, Redux, and Redux-Saga.
2. **Function Constructors:** Rebuilt the state stores (`createAppStore`, `createEditor`, `createProjects`, `createSettings`) and atomic UI components (`createButton`, `createInput`, etc.) using pure function constructors returning `Object.freeze()` definitions and implementing internal methods using `Object.defineProperty(...)`. 
3. **DOM Generation:** Components were shifted from returning JSX/React nodes to programmatically generating native DOM elements (`document.createElement`).

### Phase 3: The "Kebab-Case" TypeScript Challenge
An instruction specified `NAMING=kebab`. We aggressively attempted to apply `kebab-case` universally, including to TypeScript identifiers:
- `export type button-variant = ...`
- `export const create-editor = ...`

**Issue Encountered:** This strictly violates JavaScript/TypeScript syntax rules, producing 1,199 compilation errors (TS1005: '=' expected).
**Decision/Resolution:** 
- We compromised on identifier naming: TypeScript types and variable names are mapped to `camelCase` / `PascalCase` syntax (e.g., `ButtonVariant`, `createEditor`) allowing successful compilation.
- String literal states, class names, and general DOM targets still leverage `kebab-case`.

### 🚨 Current Implementation State (March 2026)

**Phase 1 Progress - Custom Music Rendering & TypeScript Interfaces (ACTIVE):**
- ✅ **SMuFL Canvas Rendering:** Custom canvas-based music notation using Bravura font and SMuFL glyphs
- ✅ **StaffCanvas Component:** Functional music notation rendering with note heads, stems, flags, accidentals
- ❌ **VexFlow Integration:** VexFlow imports exist but library NOT installed (66 compilation errors)
- ⏳ **Component Type Safety:** Mixed - some components typed, `MusicNote` enum conflicts need resolution
- ❌ **Build Stability:** 66 TypeScript compilation errors due to missing types and VexFlow
- ⏳ **Audio Engine:** Tone.js + SoundFont working, needs integration cleanup
- ❌ **Function Constructor Migration:** Main editor still uses React hooks, not function constructors

**What is completed and working:**
- **Custom Music Rendering:** Canvas-based music staff with SMuFL glyphs (Bravura font)
- **Audio System:** Tone.js + SoundFont Player for sound generation and playback
- **Basic Project Structure:** React app with proper routing and component organization
- **Type Definitions:** Core music types defined (Note, Staff, Bar, TimeSignature)
- **SMuFL Glyph System:** Complete glyph mapping for note heads, clefs, time signatures

**What is broken/incomplete:**
- **66 TypeScript Errors:** VexFlow imports but library not installed
- **Type Conflicts:** MusicNote enum vs interface mismatches across files
- **Function Constructor Conversion:** Main components still use React patterns
- **Build System:** Cannot compile due to missing dependencies and type errors

**What is broken / pending (Next Phase):**
- **EditorPage Integration:** Legacy editor page needs updating to use new component interfaces  
- **Audio Engine Connection:** Need to connect Tone.js to PlaybackBar controls
- **Project Data Flow:** Connect Redux state to StaffCanvas for real project data
- **Complete Template Layouts:** EditorLayout and MainLayout need proper implementation

## 🔜 Immediate Next Steps Required
1. **DOM Render / Reconciliation Engine:** We need a strict, hook-free mechanism within `createApp` to actually mount our specific instances of `createButton`, `createBarControls`, etc., recursively into the DOM root instead of raw template strings.
2. **Event Dispatch Wiring:** Connect DOM event listeners within atomic constructors to the `appStore.feature.actions`.
3. **Reactive Re-Renders:** Tie the store's `notify` callbacks to specifically mapped element updates via `defineProperty` getter/setters rather than re-rendering from scratch.

---
*End of architectural log. Awaiting implementation of the Reactive DOM mounting system.*

**Templates** (3 page layouts):
- MainLayout (header + optional sidebars + main content)
- EditorLayout (header + toolbars + left/right sidebars + editor canvas)
- SettingsLayout (header + nav tabs + main panel + actions)

### Type System

**Const-based Enums** (no TypeScript enums):
```typescript
export const MusicNote = { C: 'C', D: 'D', ... } as const;
export type MusicNote = typeof MusicNote[keyof typeof MusicNote];
```

**Models**:
- Project, PianoStaff, Bar, Note, MetronomeConfig, ColorMapping, VideoExport

**States**:
- ProjectsState, EditorState, PlaybackStateShape, ColorMappingState, VideoExportState, SettingsState

**DTOs**:
- CreateProjectDTO, UpdateProjectDTO, ExportProjectDTO, VideoExportRequestDTO/ResponseDTO

## 🔄 Key Algorithms

### 3-State Playhead Scroll Algorithm

Manages smooth playback scrolling with center-lock behavior:

**STATE 1: Free Movement** (playhead < 50% viewport)
- Scrolls from left edge, keeping playhead visible
- No scroll lock

**STATE 2: Center-Lock** (playhead 50-right boundary)
- Playhead stays centered visually
- Viewport scrolls underneath playhead
- Smooth continuous scrolling

**STATE 3: End Boundary** (playhead > right threshold)
- Viewport pinned to max scroll
- Playhead continues right (off-screen)
- Prevents over-scrolling

```typescript
class PlayheadScrollManager {
  static getScrollStatesBoth(
    playheadXPosition, playheadYPosition,
    contentWidth, contentHeight,
    viewportWidth, viewportHeight,
    centerOffsetX, centerOffsetY
  ) {
    // Returns { state, scrollPosition, visualPlayheadPosition }
  }
}
```

### Debounced Persistence

- Editor mutations trigger `editSnapPoint` action
- Saga debounces by 500ms
- Persists to localStorage on final edit
- Prevents excessive I/O during rapid edits

### Storage Adapter DI Pattern

```typescript
interface IStorageAdapter {
  save(key: string, data: unknown): Promise<void>;
  load(key: string): Promise<unknown | null>;
  clear(key?: string): Promise<void>;
  getUsagePercent(): Promise<number>;
}

// Phase 1: LocalStorageAdapter (85% quota warning)
// Phase 2: IndexedDBAdapter (unlimited storage)
// Phase 3: RemoteStorageAdapter (cloud sync)
```

## 🎨 Styling System

### CSS Variables (Light/Dark Mode)

```css
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: #1a1a1a;
  --color-primary: #2563eb;
  --color-border: #e5e5e5;
  /* ... 30+ variables */
}

@media (prefers-color-scheme: dark) {
  :root {
    /* Dark mode overrides */
  }
}
```

All components use CSS Modules for scoped styling + CSS Variables for theming.

## 🚀 Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
# Runs Vite dev server on http://localhost:5173/
```

### Build

```bash
npm run build
# Produces optimized build in dist/
```

### Testing

```bash
npm run test          # Jest + RTL unit tests
npm run test:e2e      # Cypress E2E tests
npm run lint          # ESLint + TypeScript
```

## 📦 Feature Slice Pattern

Each feature is self-contained with:

```
feature/
├── components/        # Feature-specific UI
├── hooks/            # Custom hooks (useFeature)
├── services/         # Business logic
├── store/
│   ├── featureSlice.ts      # Redux slice
│   ├── featureSaga.ts       # Side effects
│   ├── featureSelectors.ts  # Memoized selectors
│   └── index.ts             # Exports
└── types.ts          # Feature-specific types
```

## 🔌 Storage Adapter Usage

```typescript
// Phase 1: LocalStorage
const adapter = createStorageAdapter('localStorage');
await adapter.save('appState', stateSnapshot);
const loaded = await adapter.load('appState');

// Future: Swap implementation without code changes
const adapter = createStorageAdapter('indexedDB');
const adapter = createStorageAdapter('remote');
```

## 📊 Build Completion Status

| Component | Status | Count | Notes |
|-----------|--------|-------|-------|
| Type System | ✅ Complete | 40+ files | Enums, models, states, DTOs |
| Redux Store | ✅ Complete | 6 slices | All features + Saga middleware |
| Atomic Components | ✅ Complete | 6 atoms | Button, Input, Select, etc. |
| Molecules | ✅ Complete | 5 molecules | Note/Duration/Velocity/Bar/Color |
| Organisms | ✅ Complete | 5 organisms | Header, Modal, Sidebar, etc. |
| Templates | ✅ Complete | 3 layouts | Main, Editor, Settings |
| Pages | ✅ Partial | 1 page | HomePage complete |
| Storage Adapter | ✅ Complete | DI pattern | LocalStorage phase 1 |
| Playback Services | ✅ Complete | 3-state scroll | PlayheadScrollManager |
| E2E Tests | ⏳ Not Started | 0 tests | Next: Cypress scenarios |

## 🎯 Next Steps

1. **Page Implementation** (EditorPage, SettingsPage)
2. **StaffCanvas Component** (Opensheetmusicdisplay integration)
3. **Audio Engine Integration** (Tone.js synthesis)
4. **Color Mapping UI** (Preset editor)
5. **Video Export** (FFmpeg.wasm or similar)
6. **E2E Tests** (Cypress user journeys)

## 📝 Key Design Decisions

1. **No TypeScript Enums**: Const-based enums for better tree-shaking and type inference
2. **Strict Mode**: Full TypeScript strict mode enabled
3. **DI for Storage**: Storage adapter pattern for flexibility
4. **Feature Slices**: Each feature owns its state, actions, selectors, and sagas
5. **Atomic Design**: Clear separation of concerns (atoms → molecules → organisms → templates)
6. **CSS Modules**: Scoped styling prevents naming conflicts
7. **Reselect Memoization**: Efficient selector composition for performance
8. **Debounced Persistence**: 500ms debounce prevents excessive I/O

## 📄 License

Licensed under MIT. See LICENSE file for details.

## 👥 Contributing

Contributions welcome! Please follow:
- Feature Slice pattern for new features
- Atomic Design for components
- TypeScript strict mode
- CSS Modules for styling
- Reselect for selectors

---

**Development Status**: Foundation Phase Complete ✅  
**Last Updated**: Current Session  
**Version**: 0.0.0 (Pre-alpha)
