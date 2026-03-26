import { combineReducers } from '@reduxjs/toolkit';
import projectsReducer from '../features/projects/store/projectsSlice';
import editorReducer from '../features/editor/store/editorSlice';
import playbackReducer from '../features/playback/store/playbackSlice';
import colorMappingReducer from '../features/colorMapping/store/colorMappingSlice';
import videoExportReducer from '../features/videoExport/store/videoExportSlice';
import settingsReducer from '../features/settings/store/settingsSlice';

const rootReducer = combineReducers({
  projects: projectsReducer,
  editor: editorReducer,
  playback: playbackReducer,
  colorMapping: colorMappingReducer,
  videoExport: videoExportReducer,
  settings: settingsReducer,
});

export default rootReducer;
