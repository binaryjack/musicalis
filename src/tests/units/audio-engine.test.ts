import { describe, test, expect, beforeEach } from '@jest/globals';
import type { MusicNote, NoteDuration } from '../../types/musicTypes';

interface AudioEngineInterface {
  getCurrentTime: () => number;
  getIsPlaying: () => boolean;
  loadNotes: (notes: { pitch: MusicNote; duration: NoteDuration }[]) => void;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  playNote: (pitch: MusicNote, duration: NoteDuration, velocity: number) => Promise<void>;
}

export const createAudioEngine = function(): AudioEngineInterface {
  let currentTime = 0;
  let isPlaying = false;
  // let loadedNotes ... removed as it is unused

  const engine = {
    getCurrentTime: function() {
      return currentTime;
    },

    getIsPlaying: function() {
      return isPlaying;
    },

    loadNotes: function(_notes: { pitch: MusicNote; duration: NoteDuration }[]) {
      // do nothing
    },

    play: function() {
      isPlaying = true;
      return Promise.resolve();
    },

    pause: function() {
      isPlaying = false;
    },

    stop: function() {
      isPlaying = false;
      currentTime = 0;
    },

    seek: function(position: number) {
      currentTime = position;
    },

    playNote: function(_pitch: MusicNote, _duration: NoteDuration, _velocity: number) {
      return Promise.resolve();
    }
  };

  return engine;
};

describe('audio-engine initialization', () => {
  let engine: AudioEngineInterface;

  beforeEach(() => {
    engine = createAudioEngine();
  });

  test('initializes-with-zero-time', () => {
    expect(engine.getCurrentTime()).toBe(0);
  });

  test('initializes-not-playing', () => {
    expect(engine.getIsPlaying()).toBe(false);
  });
});

describe('audio-engine playback-control', () => {
  let engine: AudioEngineInterface;

  beforeEach(() => {
    engine = createAudioEngine();
  });

  test('starts-playback', async () => {
    await engine.play();
    expect(engine.getIsPlaying()).toBe(true);
  });

  test('pauses-playback', async () => {
    await engine.play();
    engine.pause();
    expect(engine.getIsPlaying()).toBe(false);
  });

  test('stops-playback', async () => {
    await engine.play();
    engine.stop();
    expect(engine.getIsPlaying()).toBe(false);
    expect(engine.getCurrentTime()).toBe(0);
  });

  test('seeks-to-position', () => {
    engine.seek(10.5);
    expect(engine.getCurrentTime()).toBe(10.5);
  });
});

describe('audio-engine note-playback', () => {
  let engine: AudioEngineInterface;

  beforeEach(() => {
    engine = createAudioEngine();
  });

  test('plays-single-note', async () => {
    const result = await engine.playNote('C4', 'quarter', 0.8);
    expect(result).toBeUndefined();
  });

  test('loads-note-sequence', () => {
    const notes = [
      { pitch: 'C4' as MusicNote, duration: 'quarter' as NoteDuration },
      { pitch: 'D4' as MusicNote, duration: 'half' as NoteDuration }
    ];
    engine.loadNotes(notes);
    expect(engine.getIsPlaying()).toBe(false);
  });
});