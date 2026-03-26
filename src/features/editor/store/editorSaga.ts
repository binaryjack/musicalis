import { takeEvery, put } from 'redux-saga/effects';
import { editorActions } from './editorSlice';
import { projectsActions } from '../../../features/projects/store/projectsSlice';

/**
 * Trigger persistence when editor makes changes
 */
function* onEditorMutationSaga() {
  yield put(projectsActions.editSnapPoint('EDITOR_MUTATION'));
}

/**
 * Root saga for editor feature
 */
export function* editorSaga() {
  // Watch for editor mutations
  yield takeEvery([
    editorActions.setMode.type,
    editorActions.setCurrentStaff.type,
    editorActions.setCurrentBar.type,
    editorActions.markDirty.type,
  ], onEditorMutationSaga);
}
