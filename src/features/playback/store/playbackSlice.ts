import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { PlaybackStateShape } from '../../../types';
import { PlaybackState, AudioQuality } from '../../../types';

const initialState: PlaybackStateShape = {
  state: PlaybackState.STOPPED,
  currentTime: 0,
  duration: 0,
  isLooping: false,
  playbackRate: 1,
  audioQuality: AudioQuality.MID,
  scrollPosition: {
    x: 0,
    y: 0,
    state: 1,
  },
  visualPlayheadX: 0,
  visualPlayheadY: 0,
  error: null,
};

const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {
    play: (state) => {
      state.state = PlaybackState.PLAYING;
    },
    pause: (state) => {
      state.state = PlaybackState.PAUSED;
    },
    stop: (state) => {
      state.state = PlaybackState.STOPPED;
      state.currentTime = 0;
    },
    seek: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    updateCurrentTime: (state, action: PayloadAction<number>) => {
      state.currentTime = action.payload;
    },
    setDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload;
    },
    setPlaybackRate: (state, action: PayloadAction<number>) => {
      state.playbackRate = action.payload;
    },
    toggleLooping: (state) => {
      state.isLooping = !state.isLooping;
    },
    setAudioQuality: (state, action: PayloadAction<AudioQuality>) => {
      state.audioQuality = action.payload;
    },
    setScrollPosition: (
      state,
      action: PayloadAction<{
        x: number;
        y: number;
        state: 1 | 2 | 3;
        visualPlayheadX: number;
        visualPlayheadY: number;
      }>
    ) => {
      state.scrollPosition = {
        x: action.payload.x,
        y: action.payload.y,
        state: action.payload.state,
      };
      state.visualPlayheadX = action.payload.visualPlayheadX;
      state.visualPlayheadY = action.payload.visualPlayheadY;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
});

export default playbackSlice.reducer;
export const playbackActions = playbackSlice.actions;
