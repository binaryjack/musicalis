import { createSelector } from 'reselect';
import type { RootState } from '../../../store/store';

// Input selector
const selectPlaybackSlice = (state: RootState) => state.playback;

// Simple selectors
export const selectPlaybackState = createSelector(
  [selectPlaybackSlice],
  (playback) => playback.state
);

export const selectCurrentTime = createSelector(
  [selectPlaybackSlice],
  (playback) => playback.currentTime
);

export const selectDuration = createSelector(
  [selectPlaybackSlice],
  (playback) => playback.duration
);

export const selectPlaybackRate = createSelector(
  [selectPlaybackSlice],
  (playback) => playback.playbackRate
);

export const selectAudioQuality = createSelector(
  [selectPlaybackSlice],
  (playback) => playback.audioQuality
);

export const selectScrollPosition = createSelector(
  [selectPlaybackSlice],
  (playback) => playback.scrollPosition
);

export const selectVisualPlayheadPosition = createSelector(
  [selectPlaybackSlice],
  (playback) => ({
    x: playback.visualPlayheadX,
    y: playback.visualPlayheadY,
  })
);

export const selectIsPlaying = createSelector(
  [selectPlaybackState],
  (state) => state === 'playing'
);

export const selectIsPaused = createSelector(
  [selectPlaybackState],
  (state) => state === 'paused'
);

export const selectIsStopped = createSelector(
  [selectPlaybackState],
  (state) => state === 'stopped'
);

// Feature-level selectors
export const selectPlaybackProgress = createSelector(
  [selectCurrentTime, selectDuration],
  (current, duration) => (duration > 0 ? (current / duration) * 100 : 0)
);

export const selectPlaybackInfo = createSelector(
  [selectCurrentTime, selectDuration, selectPlaybackState, selectPlaybackRate],
  (current, duration, state, rate) => ({
    currentTime: current,
    duration,
    state,
    playbackRate: rate,
    progress: duration > 0 ? (current / duration) * 100 : 0,
    isPlaying: state === 'playing',
  })
);

// Component-level selectors
export const selectPlaybackControlsUI = createSelector(
  [selectPlaybackInfo, selectAudioQuality],
  (info, quality) => ({
    ...info,
    audioQuality: quality,
    formattedTime: formatTime(info.currentTime),
    formattedDuration: formatTime(info.duration),
  })
);

export const selectPlayheadDisplay = createSelector(
  [selectVisualPlayheadPosition, selectScrollPosition],
  (visual, scroll) => ({
    x: visual.x,
    y: visual.y,
    scrollX: scroll.x,
    scrollY: scroll.y,
    scrollState: scroll.state,
  })
);

// Helper function
function formatTime(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
