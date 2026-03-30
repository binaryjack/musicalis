# Complete Violation Index & File Mapping

**Purpose:** Quick lookup of every violation by file  
**Format:** Searchable, sortable reference  
**Last Updated:** March 30, 2026

---

## 🔍 VIOLATIONS BY FILE

### `src/features/settings/hooks/useSettings.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 5 | `updates: any` | `any` type | Replace with `Partial<SettingsState>` |
| 9 | `audio: any` | `any` type | Replace with `Partial<AudioSettings>` |
| 10 | `exportSettings: any` | `any` type | Replace with `Partial<ExportSettings>` |
| 11 | `colorSettings: any` | `any` type | Replace with `Partial<ColorMappingSettings>` |
| 19 | `updates: any` in dispatch | `any` type | Match action creator type |
| 23-25 | Multiple `any` in returns | `any` type | Use concrete types |

**Summary:** 6 `any` violations (CRITICAL)

---

### `src/store/createAppStore.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 81 | `new (createEditor as any)` | Anti-pattern + `any` | Remove `new`, remove `as any` |
| 82 | `new (createProjects as any)` | Anti-pattern + `any` | Remove `new`, remove `as any` |
| 83 | `new (createSettings as any)` | Anti-pattern + `any` | Remove `new`, remove `as any` |

**Summary:** 3 critical anti-patterns (CRITICAL)

---

### `src/pages/editor-page.tsx`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 117 | `console.log('Staff clicked:')` | Console statement | Remove or use logger |
| 116 | `position: any` | `any` parameter | Type as `StaffClickPosition` interface |
| 128 | `console.log('Adding note:')` | Console statement | Remove or use logger |
| 131 | `console.error('Error playing note preview:')` | Console statement | Use proper error handler |
| 401 | `staffId: string, position: any` | `any` in callback | Type as position interface |
| **636 lines total** | Monolithic page | Architecture | Decompose into 6+ sub-components |

**Summary:** 1 major monolithic component, 5 violations

---

### `src/services/audioEngine.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 11 | `export class AudioEngine` | Forbidden pattern | Convert to factory function |
| Entire file | Class-based implementation | Architecture | See REFACTORING_SOLUTIONS.md |

**Summary:** 1 forbidden class

---

### `src/services/videoExportService.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 9 | `class VideoExportServiceImpl` | Forbidden pattern | Convert to factory |

**Summary:** 1 forbidden class

---

### `src/features/videoExport/services/videoExporter.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 11 | `config: any` in action creator | `any` type | Replace with `VideoExportConfig` type |
| 24 | `export class VideoExporter` | Forbidden pattern | Convert to factory |

**Summary:** 1 forbidden class, 1 `any` type

---

### `src/features/playback/services/playheadScrollManager.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 16 | `export class PlayheadScrollManager` | Forbidden pattern | Convert to factory |

**Summary:** 1 forbidden class

---

### `src/features/playback/services/audioEngine.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 17 | `export class AudioEngine` | Forbidden pattern + duplicate | Merge with main audioEngine.ts |

**Summary:** 1 forbidden class (DUPLICATE of `src/services/audioEngine.ts`)

---

### `src/shared/services/storage/localStorageAdapter.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 7 | `export class LocalStorageAdapter` | Forbidden pattern | Convert to factory |

**Summary:** 1 forbidden class

---

### `src/features/createSettings.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 16 | `this: any` in constructor | `any` type | Remove or type properly |

**Summary:** 1 `any` type

---

### `src/features/createEditor.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 12 | `this: any` in constructor | `any` type | Remove or type properly |

**Summary:** 1 `any` type

---

### `src/features/createProjects.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 17 | `this: any` in constructor | `any` type | Remove or type properly |

**Summary:** 1 `any` type

---

### `src/features/projects/store/projectsSaga.ts`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 13 | `Generator<any, void, any>` | `any` in generic | Use proper type parameters |
| 99 | `Generator<any, void, any>` | `any` in generic | Use proper type parameters |

**Summary:** 2 `any` types

---

### `src/components/organisms/memory-monitor.tsx`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 18 | `(navigator as any).deviceMemory` | `any` cast | Use proper typing or feature detection |

**Summary:** 1 `any` type

---

### `src/components/molecules/color-mapping-editor.tsx`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 122 | `as any` value cast | `any` type | Use proper number conversion |

**Summary:** 1 `any` type

---

### `src/components/molecules/bar-controls.tsx`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 17 | `(v: any) =>` in onChange | `any` parameter | Type as `string` or `number` |

**Summary:** 1 `any` type (also monolithic inline function)

---

### `src/components/atoms/select.tsx`
| Line | Issue | Type | Fix |
|------|-------|------|-----|
| 26 | `(option: any) =>` in map | `any` parameter | Type based on option interface |

**Summary:** 1 `any` type

---

### `src/components/atoms/` (Duplicate Components)
| Component | Location 1 | Location 2 | Action |
|-----------|-----------|-----------|--------|
| Button | `button.tsx` | `Button/Button.tsx` | Delete `button.tsx` |
| Input | `input.tsx` | `Input/Input.tsx` | Delete `input.tsx` |
| Select | `select.tsx` | `Select/Select.tsx` | Delete `select.tsx` |
| Label | `label.tsx` | `Label/Label.tsx` | Delete `label.tsx` |
| Slider | `slider.tsx` | `Slider/Slider.tsx` | Delete `slider.tsx` |
| ColorPicker | `color-picker.tsx` | `ColorPicker/ColorPicker.tsx` | Delete `color-picker.tsx` |
| Modal | `modal.tsx` | `Modal/Modal.tsx` | Delete `modal.tsx` |

**Summary:** 7 duplicate atom components

---

### `src/components/molecules/` (Duplicate Components)
| Component | Location 1 | Location 2 | Action |
|-----------|-----------|-----------|--------|
| BarControls | `bar-controls.tsx` | `BarControls/BarControls.tsx` | Delete `bar-controls.tsx` |
| PlaybackBar | `playback-bar.tsx` | `PlaybackBar/PlaybackBar.tsx` | Delete `playback-bar.tsx` |
| ColorPreview | `color-preview.tsx` | `ColorPreview/ColorPreview.tsx` | Delete `color-preview.tsx` |
| NoteSelector | `note-selector.tsx` | `NoteSelector/NoteSelector.tsx` | Delete `note-selector.tsx` |
| DurationSelector | `duration-selector.tsx` | `DurationSelector/DurationSelector.tsx` | Delete `duration-selector.tsx` |
| VelocityControl | `velocity-control.tsx` | `VelocityControl/VelocityControl.tsx` | Delete `velocity-control.tsx` |

**Summary:** 6 duplicate molecule components

---

### `src/components/organisms/` (Duplicate Components)
| Component | Location 1 | Location 2 | Action |
|-----------|-----------|-----------|--------|
| Header | `header.tsx` | `Header/Header.tsx` | Delete `header.tsx` |
| Modal | `modal.tsx` | `Modal/Modal.tsx` | Delete `modal.tsx` |
| Navigation | `navigation.tsx` | `Navigation/Navigation.tsx` | Delete `navigation.tsx` |
| Sidebar | `sidebar.tsx` | `Sidebar/Sidebar.tsx` | Delete `sidebar.tsx` |
| Toolbar | `toolbar.tsx` | `Toolbar/Toolbar.tsx` | Delete `toolbar.tsx` |

**Summary:** 5 duplicate organism components (Modal counted once)

---

### `src/hooks/usePlayback.ts` vs `src/features/playback/hooks/usePlayback.ts`
| Location | Returns | State | Issue |
|----------|---------|-------|-------|
| `src/hooks/usePlayback.ts` | Local playback state + audio methods | Direct audio engine | Different API |
| `src/features/playback/hooks/usePlayback.ts` | Redux UI state | Redux store selectors | Different API |

**Issue:** Two hooks with identical names but incompatible signatures

**Action:** Consolidate into single facade or rename one to `usePlaybackFacade`

---

### `src/hooks/useProject.ts` vs `src/features/projects/hooks/useProjects.ts`
| Location | Returns | Purpose | Concern |
|----------|---------|---------|---------|
| `src/hooks/useProject.ts` | Single project + operations | Direct service layer | Local state management |
| `src/features/projects/hooks/useProjects.ts` | Multiple projects + Redux | Redux selectors + actions | Redux integration |

**Issue:** Overlapping responsibilities, unclear boundaries

**Action:** Create unified `useProjectManager` hook

---

## 🗂️ GROUPED BY VIOLATION TYPE

### Type Safety Issues (27 total)
```
src/features/settings/hooks/useSettings.ts: 6
src/store/createAppStore.ts: 3 (also anti-pattern)
src/pages/editor-page.tsx: 2
src/features/videoExport/services/videoExporter.ts: 1
src/features/projects/store/projectsSaga.ts: 2
src/features/createSettings.ts: 1
src/features/createEditor.ts: 1
src/features/createProjects.ts: 1
src/components/organisms/memory-monitor.tsx: 1
src/components/molecules/color-mapping-editor.tsx: 1
src/components/molecules/bar-controls.tsx: 1
src/components/atoms/select.tsx: 1
```

### Forbidden Class Definitions (6 total)
```
src/services/audioEngine.ts
src/services/videoExportService.ts
src/features/videoExport/services/videoExporter.ts
src/features/playback/services/playheadScrollManager.ts
src/features/playback/services/audioEngine.ts (DUPLICATE)
src/shared/services/storage/localStorageAdapter.ts
```

### Duplicate Components (12 sets)
```
Atoms: 7 (Button, Input, Select, Label, Slider, ColorPicker, Modal)
Molecules: 6 (BarControls, PlaybackBar, ColorPreview, NoteSelector, DurationSelector, VelocityControl)
Organisms: 5 (Header, Modal, Navigation, Sidebar, Toolbar)
```

### Hook Conflicts (2 total)
```
usePlayback (2 incompatible implementations)
useProject/useProjects (overlapping concerns)
```

### Monolithic Components (1)
```
src/pages/editor-page.tsx: 636 lines (should be <200)
```

### Console Statements (15+)
```
src/pages/editor-page.tsx: console.log, console.error (4)
src/pages/EditorPageWorking.tsx: multiple console.log (10+)
src/components/organisms/music-staff-canvas.tsx: console.error, console.warn (2)
src/services/*: various (multiple)
```

### Missing Implementations (7 TODOs)
```
src/shared/services/storage/index.ts:13 - IndexedDB adapter
src/shared/services/storage/index.ts:17 - Database adapter
src/pages/editor-page.tsx:145 - Bar addition
src/pages/editor-page.tsx:150 - Bar removal
src/features/videoExport/store/videoExportSaga.ts:3 - Video export saga
src/features/settings/store/settingsSaga.ts:3 - Settings saga
src/features/playback/store/playbackSaga.ts:15,26 - Playhead tracking
src/components/organisms/staff-manager.tsx:66 - Staff reordering
```

---

## 🎯 QUICK STATS

| Category | Count | Files Affected |
|----------|-------|---|
| `any` types | 27 | 12 |
| Forbidden classes | 6 | 6 |
| Duplicate components | 12 sets | 18 |
| Hook conflicts | 2 | 2 |
| Console statements | 15+ | 4 |
| Missing implementations | 7 | 7 |
| Monolithic components | 1 | 1 |
| **TOTAL VIOLATIONS** | **70+** | **50+ files** |

---

## ✅ REFACTORING CHECKLIST (By File)

### Phase 1 - Type Safety (Week 1)
- [ ] `src/features/settings/hooks/useSettings.ts` (6 fixes)
- [ ] `src/store/createAppStore.ts` (3 fixes + pattern fix)
- [ ] `src/pages/editor-page.tsx` (2 type + 3 console fixes)
- [ ] `src/features/videoExport/services/videoExporter.ts` (1 type fix)
- [ ] `src/features/projects/store/projectsSaga.ts` (2 type fixes)
- [ ] `src/features/createSettings.ts` (1 fix)
- [ ] `src/features/createEditor.ts` (1 fix)
- [ ] `src/features/createProjects.ts` (1 fix)
- [ ] `src/components/organisms/memory-monitor.tsx` (1 fix)
- [ ] `src/components/molecules/color-mapping-editor.tsx` (1 fix)
- [ ] `src/components/molecules/bar-controls.tsx` (1 fix + remove console)
- [ ] `src/components/atoms/select.tsx` (1 fix)
- [ ] Remove all console statements (15+)

### Phase 2 - Pattern Compliance (Week 2)
- [ ] `src/services/audioEngine.ts` (class → factory)
- [ ] `src/services/videoExportService.ts` (class → factory)
- [ ] `src/features/videoExport/services/videoExporter.ts` (class → factory)
- [ ] `src/features/playback/services/playheadScrollManager.ts` (class → factory)
- [ ] `src/features/playback/services/audioEngine.ts` (merge with main)
- [ ] `src/shared/services/storage/localStorageAdapter.ts` (class → factory)

### Phase 3 - Component Consolidation (Week 2)
- [ ] Delete 7 duplicate atoms
- [ ] Delete 6 duplicate molecules
- [ ] Delete 5 duplicate organisms
- [ ] Update `src/components/atoms/index.ts`
- [ ] Update `src/components/molecules/index.ts`
- [ ] Update `src/components/organisms/index.ts`
- [ ] Update all import statements (50+ files)

### Phase 4 - Hook Resolution (Week 2-3)
- [ ] Create `src/hooks/usePlaybackFacade.ts`
- [ ] Create `src/hooks/useProjectManager.ts`
- [ ] Update EditorPage imports

### Phase 5 - Missing Features (Week 3)
- [ ] `src/pages/editor-page.tsx` - Implement bar add/remove
- [ ] `src/features/videoExport/store/videoExportSaga.ts` - Complete saga
- [ ] `src/features/settings/store/settingsSaga.ts` - Complete saga
- [ ] Storage adapter implementations

### Phase 6 - Error Handling (Week 3)
- [ ] Create Error Boundary organism
- [ ] Create logging service
- [ ] Add retry logic
- [ ] Proper error states

---

## 🚀 USAGE

1. **Find all violations in a file:** Ctrl+F for filename
2. **See all `any` types:** Search "Type Safety Issues"
3. **Find all classes:** Search "Forbidden Class Definitions"
4. **Get fix count:** Check "TOTAL VIOLATIONS"
5. **Plan sprints:** Use "REFACTORING CHECKLIST"

---

**This document is auto-generated from codebase analysis. Last update: March 30, 2026**
