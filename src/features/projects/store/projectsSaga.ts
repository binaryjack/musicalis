import { call, put, takeEvery, debounce, select } from 'redux-saga/effects';
import { projectsActions } from './projectsSlice';
import { createStorageAdapter } from '../../../shared/services/storage';
import type { Project } from '../../../types';
import type { RootState } from '../../../store/store';

const storageAdapter = createStorageAdapter('localStorage');
const STORAGE_KEY = 'appState';

/**
 * Load projects from localStorage on app startup
 */
function* loadProjectsSaga(): Generator<any, void, any> {
  try {
    const data = yield call(() => storageAdapter.load(STORAGE_KEY));

    if (data && typeof data === 'object' && 'projects' in data) {
      const { byId, allIds } = data.projects as { byId: Record<string, Project>; allIds: string[] };

      // Convert to array
      const projects = allIds.map((id: string) => byId[id]);

      yield put(projectsActions.loadProjectsSuccess(projects));
    } else {
      yield put(projectsActions.loadProjectsSuccess([]));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load projects';
    yield put(projectsActions.loadProjectsFailure(message));
  }
}

/**
 * Create a new project
 */
function* createProjectSaga(action: ReturnType<typeof projectsActions.createProjectRequest>) {
  try {
    const newProject: Project = {
      ...action.payload,
      id: `project-${Date.now()}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      pianoStaves: [],
      activeColorMappingId: `color-${Date.now()}`,
      metronomeConfig: {
        enabled: true,
        bpm: action.payload.tempo || 120,
        volume: 0.5,
        soundType: 'click' as const,
        subdivision: 'quarter' as const,
        accentFirst: true,
      },
    };

    yield put(projectsActions.createProjectSuccess(newProject));
    yield put(projectsActions.editSnapPoint('CREATE_PROJECT'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create project';
    yield put(projectsActions.createProjectFailure(message));
  }
}

/**
 * Update a project
 */
function* updateProjectSaga(action: ReturnType<typeof projectsActions.updateProjectRequest>) {
  try {
    const updatedProject: Project = {
      ...(action.payload.updates as Project),
      id: action.payload.id,
      updatedAt: Date.now(),
    };

    yield put(projectsActions.updateProjectSuccess(updatedProject));
    yield put(projectsActions.editSnapPoint('UPDATE_PROJECT'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update project';
    yield put(projectsActions.updateProjectFailure(message));
  }
}

/**
 * Delete a project
 */
function* deleteProjectSaga(action: ReturnType<typeof projectsActions.deleteProjectRequest>) {
  try {
    yield put(projectsActions.deleteProjectSuccess(action.payload));
    yield put(projectsActions.editSnapPoint('DELETE_PROJECT'));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete project';
    yield put(projectsActions.deleteProjectFailure(message));
  }
}

/**
 * Persist projects to localStorage on edit snap points
 * Debounced to batch multiple edits
 */
function* persistProjectsSaga(): Generator<any, void, any> {
  try {
    const state: RootState = yield select();
    const projects = state.projects;

    // Only persist the normalized state
    const dataToSave = {
      version: 1,
      timestamp: Date.now(),
      projects: {
        byId: projects.byId,
        allIds: projects.allIds,
      },
    };

    yield call(() => storageAdapter.save(STORAGE_KEY, dataToSave));

    yield put(projectsActions.persistenceSuccess());
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to persist projects';
    yield put(projectsActions.persistenceError(message));
  }
}

/**
 * Root saga for projects feature
 */
export function* projectsSaga() {
  // Load projects on app startup
  yield call(loadProjectsSaga);

  // Watch for project mutations
  yield takeEvery(projectsActions.createProjectRequest.type, createProjectSaga);
  yield takeEvery(projectsActions.updateProjectRequest.type, updateProjectSaga);
  yield takeEvery(projectsActions.deleteProjectRequest.type, deleteProjectSaga);

  // Debounce persistence on edit snap points (500ms)
  yield debounce(500, projectsActions.editSnapPoint.type, persistProjectsSaga);
}
