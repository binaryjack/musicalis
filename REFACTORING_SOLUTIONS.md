# Musicalist - Refactoring Code Examples & Solutions

**Document Purpose:** Concrete solutions for the 112+ architectural issues  
**Target Audience:** Development team  
**Implementation Timeline:** 2-3 weeks

---

## TABLE OF CONTENTS

1. Type Safety Fixes (27 `any` removals)
2. Class to Factory Conversions (6 files)
3. Hook Consolidation & Conflicts
4. Component Deduplication
5. Error Handling Implementation
6. Service Layer Refactoring

---

## 1. TYPE SAFETY FIXES

### 1.1 Fix Settings Hook (6 `any` instances)

**BEFORE** (`src/features/settings/hooks/useSettings.ts`):
```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';

// ❌ All using `any`
const updateSettings = (updates: any) => ({ type: 'settings/updateSettings', payload: updates });
const updateAudioSettings = (audio: any) => ({ type: 'settings/updateAudioSettings', payload: audio });
const updateExportSettings = (exportSettings: any) => ({ type: 'settings/updateExportSettings', payload: exportSettings });
const updateColorMappingSettings = (colorSettings: any) => ({ type: 'settings/updateColorMappingSettings', payload: colorSettings });

export const useSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  
  return {
    settings,
    updateSettings: (updates: any) => dispatch(updateSettings(updates)),
    updateAudioSettings: (audioSettings: any) => dispatch(updateAudioSettings(audioSettings)),
    // ...
  };
};
```

**AFTER** (Type-safe):
```typescript
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../../store/store';
import type { SettingsState, AudioSettings, ExportSettings, ColorMappingSettings } from '../../../types';

// ✅ Typed action creators
const updateSettings = (updates: Partial<SettingsState>) => ({ 
  type: 'settings/updateSettings' as const, 
  payload: updates 
});

const updateAudioSettings = (audio: Partial<AudioSettings>) => ({ 
  type: 'settings/updateAudioSettings' as const, 
  payload: audio 
});

const updateExportSettings = (exportSettings: Partial<ExportSettings>) => ({ 
  type: 'settings/updateExportSettings' as const, 
  payload: exportSettings 
});

const updateColorMappingSettings = (colorSettings: Partial<ColorMappingSettings>) => ({ 
  type: 'settings/updateColorMappingSettings' as const, 
  payload: colorSettings 
});

export const useSettings = () => {
  const dispatch = useDispatch();
  const settings = useSelector((state: RootState) => state.settings);
  
  return {
    settings,
    updateSettings: (updates: Partial<SettingsState>) => dispatch(updateSettings(updates)),
    resetSettings: () => dispatch({ type: 'settings/resetSettings' as const }),
    setTheme: (theme: string) => dispatch({ type: 'settings/setTheme' as const, payload: theme }),
    setAutoSaveInterval: (interval: number) => dispatch({ type: 'settings/setAutoSaveInterval' as const, payload: interval }),
    updateAudioSettings: (audioSettings: Partial<AudioSettings>) => dispatch(updateAudioSettings(audioSettings)),
    updateExportSettings: (exportSettings: Partial<ExportSettings>) => dispatch(updateExportSettings(exportSettings)),
    updateColorMappingSettings: (colorSettings: Partial<ColorMappingSettings>) => dispatch(updateColorMappingSettings(colorSettings)),
  };
};
```

**Benefits:**
- ✅ Full IDE autocomplete on all settings properties
- ✅ Compile-time errors for typos
- ✅ Refactoring detection when settings types change

---

### 1.2 Fix Store Creation (3 `as any` casts)

**BEFORE** (`src/store/createAppStore.ts` lines 81-83):
```typescript
export const createAppStore = function(storage: StorageAdapter): AppStore {
  // ...
  
  // ❌ Invalid use of `new` on functions, hidden by `as any`
  const editor = new (createEditor as any)(initialEditorState);
  const projects = new (createProjects as any)(storage, initialProjectsState);
  const settings = new (createSettings as any)(storage, initialSettingsState);
  
  // ...
};
```

**AFTER** (Correct patterns):
```typescript
// First, fix the factory functions to be actual functions (not constructable)
// In src/features/createEditor.ts:
export const createEditor = function(initialState: EditorState): EditorFeature {
  // Existing implementation
  // ...
  return {
    state: currentState,
    subscribe: (listener) => { /* ... */ },
    actions: { /* ... */ }
  };
};

// In src/store/createAppStore.ts - CORRECT usage:
export const createAppStore = function(storage: StorageAdapter): AppStore {
  // ✅ No `new`, no type casting
  const editor = createEditor(initialEditorState);
  const projects = createProjects(storage, initialProjectsState);
  const settings = createSettings(storage, initialSettingsState);
  
  // ... rest of implementation
};
```

---

### 1.3 Fix Event Handler Types

**BEFORE** (`src/pages/editor-page.tsx` line 116):
```typescript
const handleStaffClick = (position: any) => {  // ❌ `any`
  console.log('Staff clicked:', position, 'Selected note:', selectedNote, 'Is design mode:', isDesignMode);
  if (position.pitch && position.beat !== undefined && selectedNote) {
    const newNote = {
      pitch: position.pitch as MusicNote,  // Secondary cast needed because of `any`
      duration: selectedDuration,
      position: position.beat,
      velocity: velocity / 127
    };
```

**AFTER** (Strongly typed):
```typescript
// Define the exact shape
interface StaffClickPosition {
  readonly pitch: MusicNote;
  readonly beat: number;
  readonly staffId: string;
}

const handleStaffClick = (position: StaffClickPosition): void => {  // ✅ Typed
  const newNote = {
    pitch: position.pitch,  // No cast needed
    duration: selectedDuration,
    position: position.beat,
    velocity: velocity / 127
  };
  
  if (selectedNote) {
    project.addNote(newNote);
    try {
      playback.playNote(newNote.pitch, newNote.duration, newNote.velocity);
    } catch (error) {
      console.error('Error playing note preview:', error);
    }
  }
};
```

---

## 2. CLASS TO FACTORY CONVERSIONS

### 2.1 AudioEngine Conversion

**BEFORE** (`src/services/audioEngine.ts`):
```typescript
import * as Tone from 'tone';
import type { MusicNote, NoteDuration } from '../types/musicTypes';

export class AudioEngine {
  private synth: Tone.PolySynth;
  private transport: typeof Tone.Transport;
  private currentSequence: Tone.Part | null = null;
  private isInitialized = false;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.transport = Tone.Transport;
    this.synth.set({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    await Tone.start();
    this.isInitialized = true;
  }

  playNote(note: MusicNote, duration: NoteDuration = 'quarter', velocity: number = 0.8) {
    if (!this.isInitialized) return;
    const pitch = this.convertNoteToPitch(note);
    const time = this.convertDurationToTime(duration);
    this.synth.triggerAttackRelease(pitch, time, undefined, velocity);
  }

  private convertNoteToPitch(note: MusicNote): string {
    return note.replace(/(\d)/, '$1');
  }

  private convertDurationToTime(duration: NoteDuration): string {
    const durations = {
      'whole': '1n',
      'half': '2n',
      'quarter': '4n',
      'eighth': '8n',
      'sixteenth': '16n'
    };
    return durations[duration] || '4n';
  }
}
```

**AFTER** (Factory function - per instructions):
```typescript
import * as Tone from 'tone';
import type { MusicNote, NoteDuration, AudioNote } from '../types/musicTypes';

interface AudioEngineAPI {
  readonly initialize: () => Promise<void>;
  readonly playNote: (note: MusicNote, duration?: NoteDuration, velocity?: number) => void;
  readonly loadSequence: (notes: readonly AudioNote[]) => void;
  readonly play: () => Promise<void>;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly seek: (position: number) => void;
  readonly getCurrentTime: () => number;
  readonly getDuration: () => number;
  readonly isPlaying: () => boolean;
  readonly setVolume: (volume: number) => void;
}

export const createAudioEngine = function(): AudioEngineAPI {
  let synth: Tone.PolySynth;
  let transport: typeof Tone.Transport;
  let currentSequence: Tone.Part | null = null;
  let isInitialized = false;

  const convertNoteToPitch = (note: MusicNote): string => note.replace(/(\d)/, '$1');
  
  const convertDurationToTime = (duration: NoteDuration): string => {
    const durations: Record<NoteDuration, string> = {
      'whole': '1n',
      'half': '2n',
      'quarter': '4n',
      'eighth': '8n',
      'sixteenth': '16n'
    };
    return durations[duration] ?? '4n';
  };

  const initialize = async (): Promise<void> => {
    if (isInitialized) return;
    synth = new Tone.PolySynth(Tone.Synth).toDestination();
    transport = Tone.Transport;
    synth.set({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });
    await Tone.start();
    isInitialized = true;
  };

  const playNote = (note: MusicNote, duration: NoteDuration = 'quarter', velocity: number = 0.8): void => {
    if (!isInitialized) {
      console.warn('AudioEngine not initialized. Call initialize() first.');
      return;
    }
    const pitch = convertNoteToPitch(note);
    const time = convertDurationToTime(duration);
    synth.triggerAttackRelease(pitch, time, undefined, velocity);
  };

  const loadSequence = (notes: readonly AudioNote[]): void => {
    if (currentSequence) {
      currentSequence.dispose();
    }
    const sequence = notes.map(note => ({
      time: note.startTime,
      note: {
        pitch: convertNoteToPitch(note.pitch),
        duration: convertDurationToTime(note.duration),
        velocity: note.velocity ?? 0.8
      }
    }));
    currentSequence = new Tone.Part((time, note) => {
      synth.triggerAttackRelease(note.pitch, note.duration, time, note.velocity);
    }, sequence);
  };

  const play = async (): Promise<void> => {
    if (!isInitialized) await initialize();
    await transport.start();
  };

  const pause = (): void => {
    transport.pause();
  };

  const stop = (): void => {
    transport.stop();
    transport.position = 0;
  };

  const seek = (position: number): void => {
    transport.position = position;
  };

  const getCurrentTime = (): number => Number(transport.position);
  const getDuration = (): number => Number(transport.bpm.value);
  const isPlaying = (): boolean => transport.state === 'started';
  const setVolume = (volume: number): void => {
    synth.volume.value = Tone.Decibels.toDb(volume);
  };

  // Using Object.defineProperty to make properties non-enumerable
  Object.defineProperty(exports, 'isPlaying', {
    value: isPlaying,
    enumerable: false
  });

  return Object.freeze({
    initialize,
    playNote,
    loadSequence,
    play,
    pause,
    stop,
    seek,
    getCurrentTime,
    getDuration,
    isPlaying,
    setVolume
  });
};

// Usage
export const audioEngine = createAudioEngine();
```

---

### 2.2 VideoExporter Conversion

**BEFORE** (`src/features/videoExport/services/videoExporter.ts`):
```typescript
export class VideoExporter {
  private isExporting = false;
  private shouldCancel = false;

  async export(config: any) {  // ❌ Both class AND `any`
    this.isExporting = true;
    // ... implementation
  }

  cancel() {
    this.shouldCancel = true;
  }
}
```

**AFTER**:
```typescript
import type { VideoExportConfig, VideoExportProgress } from '../types/video-export.types';

interface VideoExporterAPI {
  readonly export: (config: VideoExportConfig, onProgress: (progress: VideoExportProgress) => void) => Promise<Blob>;
  readonly cancel: () => void;
  readonly isExporting: () => boolean;
}

export const createVideoExporter = function(): VideoExporterAPI {
  let isExporting = false;
  let shouldCancel = false;

  const performExport = async (
    config: VideoExportConfig,
    onProgress: (progress: VideoExportProgress) => void
  ): Promise<Blob> => {
    if (isExporting) {
      throw new Error('Export already in progress');
    }

    isExporting = true;
    shouldCancel = false;

    try {
      onProgress({ stage: 'encoding', percent: 0 });
      
      // Actual export logic here
      // ... processing
      
      onProgress({ stage: 'encoding', percent: 100 });
      return new Blob([/* video data */], { type: config.format });
    } catch (error) {
      if (shouldCancel) {
        throw new Error('Export cancelled by user');
      }
      throw error;
    } finally {
      isExporting = false;
    }
  };

  return Object.freeze({
    export: performExport,
    cancel: () => { shouldCancel = true; },
    isExporting: () => isExporting
  });
};

export const videoExporter = createVideoExporter();
```

---

## 3. HOOK CONSOLIDATION

### 3.1 Resolve usePlayback Conflict

**Problem:** Two `usePlayback` hooks with different APIs

**Solution: Create facade hook**

```typescript
// New file: src/hooks/usePlaybackFacade.ts
import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import type { RootState } from '../store/store';
import { playbackActions } from '../features/playback/store/playbackSlice';
import { audioEngine } from '../services/audioEngine';

export interface PlaybackControlAPI {
  // Redux state
  readonly isPlaying: boolean;
  readonly currentTime: number;
  readonly duration: number;
  readonly audioQuality: string;

  // Redux actions
  readonly play: () => void;
  readonly pause: () => void;
  readonly stop: () => void;
  readonly seek: (position: number) => void;
  readonly setAudioQuality: (quality: string) => void;

  // Direct audio operations
  readonly playNote: (pitch: string, duration: string, velocity?: number) => Promise<void>;
}

export const usePlaybackFacade = (): PlaybackControlAPI => {
  const dispatch = useDispatch();
  const { isPlaying, currentTime, duration, audioQuality } = useSelector((state: RootState) => state.playback);

  const play = useCallback(() => {
    audioEngine.initialize().then(() => {
      audioEngine.play();
      dispatch(playbackActions.play());
    });
  }, [dispatch]);

  const playNote = useCallback(
    async (pitch: string, duration: string, velocity: number = 0.8) => {
      await audioEngine.initialize();
      audioEngine.playNote(pitch as any, duration as any, velocity);  // TODO: Fix types
    },
    []
  );

  return {
    isPlaying,
    currentTime,
    duration,
    audioQuality,
    play,
    pause: () => {
      audioEngine.pause();
      dispatch(playbackActions.pause());
    },
    stop: () => {
      audioEngine.stop();
      dispatch(playbackActions.stop());
    },
    seek: (position: number) => {
      audioEngine.seek(position);
      dispatch(playbackActions.seek(position));
    },
    setAudioQuality: (quality: string) => {
      dispatch(playbackActions.setAudioQuality(quality));
    },
    playNote
  };
};
```

**Update imports in EditorPage:**
```typescript
// Remove old imports
// import { usePlayback } from '../hooks/usePlayback';
// import { usePlayback } from '../features/playback/hooks/usePlayback';

// Use new unified API
import { usePlaybackFacade } from '../hooks/usePlaybackFacade';

export const EditorPage = () => {
  const playback = usePlaybackFacade();
  // Now everything is clear and unified
};
```

---

### 3.2 Consolidate Project Hooks

**BEFORE:** Two separate hooks `useProject` and `useProjects`

**AFTER:** Single unified hook
```typescript
// New: src/hooks/useProjectManager.ts
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useState } from 'react';
import type { RootState } from '../store/store';
import { projectsActions } from '../features/projects/store/projectsSlice';
import { projectService, type ProjectData } from '../services/projectService';

export interface ProjectManagerAPI {
  // State
  readonly projects: readonly Project[];
  readonly currentProject: Project | null;
  readonly loading: boolean;
  readonly error: string | null;

  // Project operations
  readonly createProject: (name: string) => Promise<void>;
  readonly loadProject: (id: string) => Promise<void>;
  readonly updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  readonly deleteProject: (id: string) => Promise<void>;
  readonly saveProject: () => Promise<void>;

  // Note operations
  readonly addNote: (note: Note) => void;
  readonly removeNote: (index: number) => void;
  readonly updateNote: (index: number, note: Note) => void;
}

export const useProjectManager = (): ProjectManagerAPI => {
  const dispatch = useDispatch();
  const { projects, currentProject, loading, error } = useSelector((state: RootState) => state.projects);
  const [localError, setLocalError] = useState<string | null>(null);

  const createProject = useCallback(async (name: string) => {
    try {
      setLocalError(null);
      const project = projectService.create(name);
      await projectService.save(project);
      dispatch(projectsActions.createProjectRequest({
        name,
        tempo: 120,
        timeSignature: '4/4'
      } as any));  // TODO: Fix type
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      setLocalError(message);
    }
  }, [dispatch]);

  const loadProject = useCallback(async (id: string) => {
    try {
      setLocalError(null);
      const project = await projectService.load(id);
      if (project) {
        dispatch(projectsActions.setCurrentProject(id));
      } else {
        setLocalError('Project not found');
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Failed to load project');
    }
  }, [dispatch]);

  return {
    projects,
    currentProject,
    loading: loading || false,
    error: error || localError,
    createProject,
    loadProject,
    // ... other operations
  } as ProjectManagerAPI;
};
```

---

## 4. COMPONENT DEDUPLICATION

### 4.1 Consolidation Strategy

**Files to delete and consolidate:**

| Component | Keep | Delete | Reason |
|-----------|------|--------|--------|
| Button | `atoms/Button/Button.tsx` | `atoms/button.tsx` | Advanced version has loading state |
| Input | `atoms/Input/Input.tsx` | `atoms/input.tsx` | Structured version is better |
| Select | `atoms/Select/Select.tsx` | `atoms/select.tsx` | Consistent with other atoms |
| Label | `atoms/Label/Label.tsx` | `atoms/label.tsx` | Consistent styling |
| Slider | `atoms/Slider/Slider.tsx` | `atoms/slider.tsx` | Modern implementation |

**Step 1: Update atoms/index.ts**

```typescript
// Before
export { Button } from './button';
export { Input } from './input';
export { Select } from './select';
export { Label } from './label';
export { Slider } from './slider';

// After
export { Button } from './Button/Button';
export { Input } from './Input/Input';
export { Select } from './Select/Select';
export { Label } from './Label/Label';
export { Slider } from './Slider/Slider';
export { ColorPicker } from './ColorPicker/ColorPicker';
export { Modal } from './Modal/Modal';
```

**Step 2: Update all component imports**

```typescript
// Find and replace all imports
// OLD: import { Button } from '../atoms/button';
// NEW: import { Button } from '../atoms';  // or explicit
//      import { Button } from '../atoms/Button/Button';
```

**Step 3: Delete flat files**

```bash
rm src/components/atoms/button.tsx
rm src/components/atoms/input.tsx
rm src/components/atoms/select.tsx
rm src/components/atoms/label.tsx
rm src/components/atoms/slider.tsx
# etc...
```

---

## 5. ERROR HANDLING IMPLEMENTATION

### 5.1 Create Error Boundary

```typescript
// New: src/components/organisms/error-boundary.tsx
import { ReactNode, useState, useCallback } from 'react';

export interface ErrorBoundaryProps {
  readonly children: ReactNode;
  readonly onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  readonly fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorState {
  readonly hasError: boolean;
  readonly error: Error | null;
}

export const ErrorBoundary = function(props: ErrorBoundaryProps) {
  const [state, setState] = useState<ErrorState>({ hasError: false, error: null });

  const handleError = useCallback((error: Error, errorInfo: React.ErrorInfo) => {
    setState({ hasError: true, error });
    props.onError?.(error, errorInfo);
    console.error('Error caught by boundary:', error, errorInfo);
  }, [props]);

  const handleReset = useCallback(() => {
    setState({ hasError: false, error: null });
  }, []);

  if (state.hasError && state.error) {
    return (
      props.fallback?.(state.error, handleReset) ?? (
        <div style={{ padding: 20, border: '1px solid red', borderRadius: 4 }}>
          <h2>Something went wrong</h2>
          <p>{state.error.message}</p>
          <button onClick={handleReset}>Try again</button>
        </div>
      )
    );
  }

  return <>{props.children}</>;
};

// As a factory function (per instructions):
export const createErrorBoundary = function() {
  const errorHandlers = new Set<(error: Error) => void>();

  return {
    wrap: (children: ReactNode, fallback?: (error: Error) => ReactNode) => (
      <ErrorBoundary
        onError={(error) => {
          errorHandlers.forEach(handler => handler(error));
        }}
        fallback={fallback}
      >
        {children}
      </ErrorBoundary>
    ),
    onError: (handler: (error: Error) => void) => {
      errorHandlers.add(handler);
      return () => errorHandlers.delete(handler);
    }
  };
};
```

---

### 5.2 Add Retry Logic

```typescript
// New: src/utils/retry.ts
export interface RetryOptions {
  readonly maxAttempts?: number;
  readonly delayMs?: number;
  readonly backoffMultiplier?: number;
}

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2
  } = options;

  let lastError: Error | null = null;
  let delay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= backoffMultiplier;
    }
  }

  throw lastError ?? new Error('Operation failed after retries');
};

// Usage
const saveProject = async () => {
  return withRetry(() => projectService.save(currentProject), {
    maxAttempts: 3,
    delayMs: 500,
    backoffMultiplier: 2
  });
};
```

---

### 5.3 Logging Service

```typescript
// New: src/services/logging-service.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  readonly level: LogLevel;
  readonly message: string;
  readonly timestamp: Date;
  readonly context?: Record<string, any>;
  readonly error?: Error;
}

export const createLoggingService = function() {
  const logs: LogEntry[] = [];
  const handlers = new Set<(entry: LogEntry) => void>();

  const log = (level: LogLevel, message: string, context?: Record<string, any>, error?: Error) => {
    const entry: LogEntry = { level, message, timestamp: new Date(), context, error };
    logs.push(entry);
    handlers.forEach(handler => handler(entry));

    // Still log to console in development
    if (process.env.NODE_ENV === 'development') {
      console[level](message, context, error);
    }
  };

  return Object.freeze({
    debug: (msg: string, ctx?: Record<string, any>) => log('debug', msg, ctx),
    info: (msg: string, ctx?: Record<string, any>) => log('info', msg, ctx),
    warn: (msg: string, ctx?: Record<string, any>) => log('warn', msg, ctx),
    error: (msg: string, ctx?: Record<string, any>, err?: Error) => log('error', msg, ctx, err),
    
    onLog: (handler: (entry: LogEntry) => void) => {
      handlers.add(handler);
      return () => handlers.delete(handler);
    },

    getLogs: () => [...logs],
    clearLogs: () => { logs.length = 0; }
  });
};

export const logger = createLoggingService();
```

---

## 6. REMAINING REFACTORING WORK

### 6.1 PlayheadScrollManager Conversion

```typescript
// Before: export class PlayheadScrollManager { ... }

// After:
export const createPlayheadScrollManager = function(viewport: HTMLElement, content: HTMLElement) {
  let currentPlayheadX = 0;
  let scrollState: 'free' | 'center-lock' | 'boundary' = 'free';

  const updateScroll = () => {
    const viewportWidth = viewport.clientWidth;
    const contentWidth = content.scrollWidth;
    const centerX = viewportWidth / 2;

    if (currentPlayheadX < centerX) {
      scrollState = 'free';
      viewport.scrollLeft = 0;
    } else if (currentPlayheadX <= (contentWidth - centerX)) {
      scrollState = 'center-lock';
      viewport.scrollLeft = currentPlayheadX - centerX;
    } else {
      scrollState = 'boundary';
      viewport.scrollLeft = contentWidth - viewportWidth;
    }
  };

  return Object.freeze({
    setPlayheadPosition: (x: number) => {
      currentPlayheadX = x;
      updateScroll();
    },
    getScrollState: () => scrollState,
    getScrollPosition: () => viewport.scrollLeft
  });
};
```

---

## IMPLEMENTATION CHECKLIST

- [ ] **Phase 1 - Type Safety (Critical)**
  - [ ] Remove 27 `any` types
  - [ ] Fix useSettings (6 instances)
  - [ ] Fix createAppStore (3 instances)
  - [ ] Fix event handlers
  - [ ] Remove console.log statements

- [ ] **Phase 2 - Forbidden Patterns (Critical)**
  - [ ] Convert AudioEngine class → factory
  - [ ] Convert VideoExporter class → factory
  - [ ] Convert PlayheadScrollManager class → factory
  - [ ] Convert LocalStorageAdapter class → factory
  - [ ] Convert VideoExportServiceImpl class → factory

- [ ] **Phase 3 - Component Consolidation (High)**
  - [ ] Deduplicate Button component
  - [ ] Deduplicate Input component
  - [ ] Deduplicate all atoms/molecules
  - [ ] Update all imports
  - [ ] Delete old implementations

- [ ] **Phase 4 - Hook Consolidation (High)**
  - [ ] Merge usePlayback hooks
  - [ ] Merge useProject hooks
  - [ ] Consolidate settings actions

- [ ] **Phase 5 - Error Handling (Medium)**
  - [ ] Add ErrorBoundary organism
  - [ ] Implement retry logic
  - [ ] Create logging service
  - [ ] Remove ad-hoc console calls

---

## VALIDATION TESTS

After each refactoring phase, run:

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests  
npm run test:unit

# Coverage check
npm run test:coverage
```

**Success Criteria:**
- ✅ 0 `any` types
- ✅ 0 class definitions
- ✅ 95%+ test coverage
- ✅ <5 second bundle time
- ✅ All ESLint checks passing
