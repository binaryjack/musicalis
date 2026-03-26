import { PlaybackState } from '../enums';
import { AudioQuality } from '../enums';

/**
 * Redux state shape for playback feature
 * PlaybackState conflicts with the enum, so we use PlaybackStateShape instead
 */
export interface PlaybackStateShape {
  state: PlaybackState;
  currentTime: number; // milliseconds
  duration: number; // milliseconds
  isLooping: boolean;
  playbackRate: number; // 1.0 = normal
  audioQuality: AudioQuality;
  scrollPosition: {
    x: number;
    y: number;
    state: 1 | 2 | 3; // scroll state
  };
  visualPlayheadX: number;
  visualPlayheadY: number;
  error: string | null;
}
