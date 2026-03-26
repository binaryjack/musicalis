import { createSelector } from 'reselect';
import type { RootState } from '../../../store/store';

// Input selectors
const selectProjectsSlice = (state: RootState) => state.projects;

// Simple selectors
export const selectAllProjectIds = createSelector(
  [selectProjectsSlice],
  (projects) => projects.allIds
);

export const selectProjectsById = createSelector(
  [selectProjectsSlice],
  (projects) => projects.byId
);

export const selectCurrentProjectId = createSelector(
  [selectProjectsSlice],
  (projects) => projects.currentProjectId
);

export const selectProjectsLoading = createSelector(
  [selectProjectsSlice],
  (projects) => projects.loading
);

export const selectProjectsError = createSelector(
  [selectProjectsSlice],
  (projects) => projects.error
);

// Feature-level selectors
export const selectAllProjects = createSelector(
  [selectProjectsById, selectAllProjectIds],
  (byId, allIds) => allIds.map((id: string) => byId[id])
);

export const selectCurrentProject = createSelector(
  [selectCurrentProjectId, selectProjectsById],
  (currentId, byId) => (currentId ? byId[currentId] : null)
);

export const selectProjectById = (projectId: string) =>
  createSelector([selectProjectsById], (byId) => byId[projectId] || null);

// View-level selectors
export const selectProjectsSortedByUpdated = createSelector(
  [selectAllProjects],
  (projects) =>
    [...projects].sort((a, b) => b.updatedAt - a.updatedAt)
);

export const selectProjectCount = createSelector(
  [selectAllProjectIds],
  (ids) => ids.length
);

export const selectHasProjects = createSelector(
  [selectProjectCount],
  (count) => count > 0
);

// Status selectors
export const selectIsLoadingProjects = createSelector(
  [selectProjectsLoading],
  (loading) => loading
);

export const selectProjectsErrorMessage = createSelector(
  [selectProjectsError],
  (error) => error
);

// Component-level selectors with memo
export const selectProjectListForUI = createSelector(
  [selectProjectsSortedByUpdated, selectCurrentProjectId],
  (projects, currentId) =>
    projects.map((project) => ({
      id: project.id,
      name: project.name,
      tempo: project.tempo,
      updatedAt: new Date(project.updatedAt).toLocaleDateString(),
      isCurrent: project.id === currentId,
    }))
);
