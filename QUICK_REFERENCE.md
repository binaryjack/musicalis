# Architecture Violations - Quick Reference

## 🚨 CRITICAL ISSUES (Fix immediately)

### 1️⃣ Type Safety - 27 `any` Types Found

**Files affected (in priority order):**
1. `src/features/settings/hooks/useSettings.ts` → 6 `any` instances
2. `src/store/createAppStore.ts` → 3 `as any` casts (WRONG pattern)
3. `src/pages/editor-page.tsx` → 2 `any` in event handlers
4. `src/features/videoExport/services/videoExporter.ts` → 1 `any`
5. `src/features/projects/store/projectsSaga.ts` → 2 `any` (Generator types)
6. `src/features/createSettings.ts` → 1 `this: any`
7. `src/features/createEditor.ts` → 1 `this: any`
8. `src/features/createProjects.ts` → 1 `this: any`
9. `src/components/organisms/memory-monitor.tsx` → 1 `any` cast
10. `src/components/molecules/color-mapping-editor.tsx` → 1 `any`
11. `src/components/molecules/bar-controls.tsx` → 1 `any`
12. `src/components/atoms/select.tsx` → 1 `any`

**Quick fix:** Replace all `any` with concrete types from `src/types/*`

---

### 2️⃣ Forbidden Classes - 6 Found

| File | Class Name | Line | Action |
|------|-----------|------|--------|
| `src/services/audioEngine.ts` | `AudioEngine` | 11 | Convert to factory |
| `src/services/videoExportService.ts` | `VideoExportServiceImpl` | 9 | Convert to factory |
| `src/features/videoExport/services/videoExporter.ts` | `VideoExporter` | 24 | Convert to factory |
| `src/features/playback/services/playheadScrollManager.ts` | `PlayheadScrollManager` | 16 | Convert to factory |
| `src/features/playback/services/audioEngine.ts` | `AudioEngine` | 17 | Merge with main |
| `src/shared/services/storage/localStorageAdapter.ts` | `LocalStorageAdapter` | 7 | Convert to factory |

**Pattern:** Replace `class X { }` with `export const createX = function() { return Object.freeze({...}) }`

---

### 3️⃣ Hook Naming Conflict - 2 Different `usePlayback` Implementations

```
File: src/hooks/usePlayback.ts
File: src/features/playback/hooks/usePlayback.ts
```

**Problem:** Same name, different APIs, different implementations
**Solution:** Rename one to `usePlaybackFacade` or consolidate into single unified hook

---

## 🔴 HIGH PRIORITY ISSUES (Week 1-2)

### 4️⃣ Duplicate Components - 12 Sets

**Pairs to consolidate:**

| Atom/Molecule | File 1 | File 2 | Keep |
|---|---|---|---|
| Button | `atoms/button.tsx` | `atoms/Button/Button.tsx` | Button/Button.tsx |
| Input | `atoms/input.tsx` | `atoms/Input/Input.tsx` | Input/Input.tsx |
| Select | `atoms/select.tsx` | `atoms/Select/Select.tsx` | Select/Select.tsx |
| Label | `atoms/label.tsx` | `atoms/Label/Label.tsx` | Label/Label.tsx |
| Slider | `atoms/slider.tsx` | `atoms/Slider/Slider.tsx` | Slider/Slider.tsx |
| ColorPicker | `atoms/color-picker.tsx` | `atoms/ColorPicker/ColorPicker.tsx` | ColorPicker/ColorPicker.tsx |
| Modal | `atoms/modal.tsx` + `organisms/modal.tsx` | `organisms/Modal/Modal.tsx` | Modal/Modal.tsx |
| BarControls | `molecules/bar-controls.tsx` | `molecules/BarControls/BarControls.tsx` | BarControls/BarControls.tsx |
| PlaybackBar | `molecules/playback-bar.tsx` | `molecules/PlaybackBar/PlaybackBar.tsx` | PlaybackBar/PlaybackBar.tsx |
| NoteSelector | `molecules/note-selector.tsx` | `molecules/NoteSelector/NoteSelector.tsx` | NoteSelector/NoteSelector.tsx |
| Header | `organisms/header.tsx` | `organisms/Header/Header.tsx` | Header/Header.tsx |
| Toolbar | `organisms/toolbar.tsx` | `organisms/Toolbar/Toolbar.tsx` | Toolbar/Toolbar.tsx |
| Sidebar | `organisms/sidebar.tsx` | `organisms/Sidebar/Sidebar.tsx` | Sidebar/Sidebar.tsx |
| Navigation | `organisms/navigation.tsx` | `organisms/Navigation/Navigation.tsx` | Navigation/Navigation.tsx |

**Action:** Delete left column, update imports to use right column (PascalCase folders)

---

### 5️⃣ Monolithic Page Component

**File:** `src/pages/editor-page.tsx`
**Size:** 636 lines (should be <200)
**Issues:** 8+ responsibilities mixed together

**Extract into separate components:**
1. `EditorToolbar.tsx` (toolbar logic)
2. `EditorCanvas.tsx` (main canvas area)
3. `EditorSidebar.tsx` (left/right sidebars)
4. `EditorHeader.tsx` (header area)
5. `useEditorState.ts` (consolidated state hook)
6. `useEditorHandlers.ts` (all event handlers)

---

### 6️⃣ Missing Error Handling

**No React Error Boundary** - Components can crash silently
- Add `ErrorBoundary` organism wrapper
- Wrap main routes/pages with it

**Incomplete Try-Catch blocks** - 20+ locations
- Error logged but not handled: `console.error(...)`
- Add proper error states to UI
- Implement retry logic for network operations

**Console.log statements** - 15+ in production code
- Replace with logging service
- Remove debug statements before merge

---

## 🟡 MEDIUM PRIORITY (Week 2-3)

### 7️⃣ Missing Implementations (7 TODOs)

```
❌ IndexedDB storage adapter (HIGH)
❌ Database storage adapter (HIGH)  
❌ Bar addition logic (CRITICAL - user-facing)
❌ Bar removal logic (CRITICAL - user-facing)
❌ Video export saga (HIGH)
❌ Settings saga (HIGH)
❌ Staff reordering (MEDIUM)
```

---

### 8️⃣ Naming Convention Violations

**PascalCase directories should be kebab-case** (per NAMING=kebab):
- `Button/` → `button/` (or keep as exception for component folders)
- Files within should use consistent casing

---

## 📊 VIOLATION SUMMARY

| Issue | Count | Impact | Est. Fix Time |
|-------|-------|--------|---|
| `any` types | 27 | Type safety lost | 4h |
| Forbidden classes | 6 | Pattern violation | 8h |
| Duplicate components | 12 sets | Maintenance + bundle size | 6h |
| Hook conflicts | 2 | Runtime confusion | 2h |
| Console statements | 15+ | Production noise | 1h |
| Monolithic components | 1 major | Testability issues | 10h |
| Error boundaries | 0 | Crash risk | 3h |
| Missing implementations | 7 | Feature gaps | 16h |
| **TOTAL** | **70+** | **CRITICAL** | **50h** |

---

## ✅ SUCCESS CRITERIA

After refactoring:

- [ ] 0 `any` types in codebase
- [ ] 0 `class` definitions
- [ ] 0 duplicate components
- [ ] 0 console.log/console.error statements
- [ ] 95%+ test coverage
- [ ] All 7 TODOs implemented
- [ ] Error Boundary in place
- [ ] All ESLint checks passing
- [ ] TypeScript strict mode enabled
- [ ] <10% deviation from architecture doc

---

## 🎯 NEXT STEPS

### Immediate (Today)
1. Read full `ARCHITECTURE_ANALYSIS.md`
2. Read `REFACTORING_SOLUTIONS.md` 
3. Create feature branch for refactoring
4. Assign tasks to team members

### This Week
1. Fix all 27 `any` types
2. Convert 6 forbidden classes
3. Consolidate duplicate components
4. Remove all console statements
5. Resolve hook naming conflict

### Next Week
1. Implement error handling
2. Decompose monolithic components
3. Add Error Boundary
4. Complete TODO implementations
5. Full test suite pass

---

## 📝 FILES TO UPDATE

**Priority 1 (Week 1):**
- [ ] `src/features/settings/hooks/useSettings.ts`
- [ ] `src/store/createAppStore.ts`
- [ ] `src/pages/editor-page.tsx`
- [ ] `src/services/audioEngine.ts`
- [ ] `src/services/videoExportService.ts`

**Priority 2 (Week 1-2):**
- [ ] `src/components/atoms/index.ts` (import updates)
- [ ] `src/components/molecules/index.ts`
- [ ] `src/components/organisms/index.ts`
- [ ] 12+ component files (deduplication)
- [ ] `src/hooks/usePlayback.ts` (rename)
- [ ] `src/hooks/useProject.ts` (consolidate)

**Priority 3 (Week 2):**
- [ ] Create `src/components/organisms/error-boundary.tsx`
- [ ] Create `src/utils/retry.ts`
- [ ] Create `src/services/logging-service.ts`
- [ ] Create `src/hooks/usePlaybackFacade.ts`
- [ ] Create `src/hooks/useProjectManager.ts`

---

## 🔗 REFERENCES

- Full Analysis: `ARCHITECTURE_ANALYSIS.md`
- Code Examples: `REFACTORING_SOLUTIONS.md`
- Copilot Rules: `.github/copilot-instructions.md`
- Architecture Doc: `ARCHITECTURE.md`
