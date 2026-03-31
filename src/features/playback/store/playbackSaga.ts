import { put, takeEvery, select } from 'redux-saga/effects';
import { playbackActions } from './playbackSlice';
import { createPlayheadScrollManager } from '../services/playheadScrollManager';
import type { RootState } from '../../../store/store';

// Create playhead scroll manager instance
const playheadScrollManager = createPlayheadScrollManager();

/**
 * Update playhead scroll position on time change
 * Implements 3-state scroll algorithm
 */
function* updatePlayheadScrollSaga() {
  try {
    const state: RootState = yield select();
    const { currentTime } = state.playback;

    // TODO: Get actual content dimensions from editor state
    // For now, using defaults
    const contentWidth = 10000; // Pixel width of all bars
    const contentHeight = 1000; // Pixel height of all staves
    const viewportWidth = window.innerWidth - 20; // Account for margins
    const viewportHeight = window.innerHeight - 200; // Account for header/controls

    // Convert time to pixel position (rough estimate)
    // Assumes ~100px per second of audio
    const pixelsPerSecond = 100;
    const playheadXPosition = (currentTime / 1000) * pixelsPerSecond;
    const playheadYPosition = 0; // TODO: Update based on active staff

    const scrollStates = playheadScrollManager.getScrollStatesBoth(
      playheadXPosition,
      playheadYPosition,
      contentWidth,
      contentHeight,
      viewportWidth,
      viewportHeight,
      0.5, // Center offset X (50%)
      0.5  // Center offset Y (50%)
    );

    yield put(
      playbackActions.setScrollPosition({
        x: scrollStates.x,
        y: scrollStates.y,
        state: scrollStates.state.horizontal,
        visualPlayheadX: scrollStates.visualPlayheadX,
        visualPlayheadY: scrollStates.visualPlayheadY,
      })
    );
  } catch (error) {
    console.error('Error updating playhead scroll:', error);
  }
}

/**
 * Root saga for playback feature
 */
export function* playbackSaga() {
  // Watch for playhead position updates
  yield takeEvery(playbackActions.updateCurrentTime.type, updatePlayheadScrollSaga);
}
