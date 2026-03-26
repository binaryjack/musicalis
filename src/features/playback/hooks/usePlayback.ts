import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectPlaybackControlsUI,
  selectPlayheadDisplay,
  selectIsPlaying,
  selectAudioQuality,
} from '../store/playbackSelectors';
import { playbackActions } from '../store/playbackSlice';
import type { AudioQuality } from '../../../types';

/**
 * Custom hook for playback feature
 * Provides access to playback state and actions
 */
export const usePlayback = () => {
  const dispatch = useAppDispatch();
  const playbackUI = useAppSelector(selectPlaybackControlsUI);
  const playheadDisplay = useAppSelector(selectPlayheadDisplay);
  const isPlaying = useAppSelector(selectIsPlaying);
  const audioQuality = useAppSelector(selectAudioQuality);

  return {
    // State
    playbackUI,
    playheadDisplay,
    isPlaying,
    audioQuality,

    // Actions
    play: () => dispatch(playbackActions.play()),
    pause: () => dispatch(playbackActions.pause()),
    stop: () => dispatch(playbackActions.stop()),
    seek: (time: number) => dispatch(playbackActions.seek(time)),
    updateCurrentTime: (time: number) => dispatch(playbackActions.updateCurrentTime(time)),
    setDuration: (duration: number) => dispatch(playbackActions.setDuration(duration)),
    setPlaybackRate: (rate: number) => dispatch(playbackActions.setPlaybackRate(rate)),
    toggleLooping: () => dispatch(playbackActions.toggleLooping()),
    setAudioQuality: (quality: AudioQuality) => dispatch(playbackActions.setAudioQuality(quality)),
  };
};
