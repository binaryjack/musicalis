import { all, fork } from 'redux-saga/effects';
import { projectsSaga } from '../features/projects/store/projectsSaga';
import { editorSaga } from '../features/editor/store/editorSaga';
import { playbackSaga } from '../features/playback/store/playbackSaga';
import { colorMappingSaga } from '../features/colorMapping/store/colorMappingSaga';
import { videoExportSaga } from '../features/videoExport/store/videoExportSaga';
import { settingsSaga } from '../features/settings/store/settingsSaga';

export default function* rootSaga() {
  yield all([
    fork(projectsSaga),
    fork(editorSaga),
    fork(playbackSaga),
    fork(colorMappingSaga),
    fork(videoExportSaga),
    fork(settingsSaga),
  ]);
}
