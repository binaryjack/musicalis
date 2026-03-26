import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { ProjectsState, Project } from '../../../types';
import type { CreateProjectDTO } from '../../../types/dto/project.dto';

const initialState: ProjectsState = {
  byId: {},
  allIds: [],
  currentProjectId: null,
  loading: false,
  error: null,
};

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    loadProjectsRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    loadProjectsSuccess: (state, action: PayloadAction<Project[]>) => {
      state.loading = false;
      action.payload.forEach((project) => {
        state.byId[project.id] = project;
        if (!state.allIds.includes(project.id)) {
          state.allIds.push(project.id);
        }
      });
    },
    loadProjectsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    createProjectRequest: (state, _action: PayloadAction<CreateProjectDTO>) => {
      state.loading = true;
    },
    createProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.loading = false;
      state.byId[action.payload.id] = action.payload;
      state.allIds.push(action.payload.id);
      state.currentProjectId = action.payload.id;
    },
    createProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    updateProjectRequest: (state, _action: PayloadAction<{ id: string; updates: Partial<Project> }>) => {
      state.loading = true;
    },
    updateProjectSuccess: (state, action: PayloadAction<Project>) => {
      state.loading = false;
      state.byId[action.payload.id] = action.payload;
    },
    updateProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    deleteProjectRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
    },
    deleteProjectSuccess: (state, action: PayloadAction<string>) => {
      state.loading = false;
      delete state.byId[action.payload];
      state.allIds = state.allIds.filter((id) => id !== action.payload);
      if (state.currentProjectId === action.payload) {
        state.currentProjectId = state.allIds[0] || null;
      }
    },
    deleteProjectFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },

    setCurrentProject: (state, action: PayloadAction<string>) => {
      state.currentProjectId = action.payload;
    },

    editSnapPoint: (_state, _action: PayloadAction<string>) => {
      // Saga will handle persistence
    },

    persistenceSuccess: () => {
      // Mark as saved
    },
    persistenceError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
  },
});

export default projectsSlice.reducer;
export const projectsActions = projectsSlice.actions;
