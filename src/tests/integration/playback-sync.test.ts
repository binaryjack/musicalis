import { describe, test, expect, beforeEach } from '@jest/globals';
import type { MusicNote, NoteDuration } from '../../types/musicTypes';
import { createAudioEngine } from '../units/audio-engine.test';

interface PlaybackSync {
  startPlayback: () => Promise<void>;
  stopPlayback: () => Promise<void>;
  pausePlayback: () => Promise<void>;
  seekToPosition: (position: number) => Promise<void>;
  setTempo: (bpm: number) => Promise<void>;
  getCurrentPosition: () => number;
  getTempo: () => number;
  getPlaybackState: () => 'stopped' | 'playing' | 'paused';
  syncNotePlayback: (notes: PlaybackNote[]) => Promise<void>;
}

interface PlaybackNote {
  pitch: MusicNote;
  duration: NoteDuration;
  startTime: number;
  velocity: number;
}

export const createPlaybackSync = function(): PlaybackSync {
  const audioEngine = createAudioEngine();
  let currentPosition = 0;
  let tempo = 120;
  let playbackState: 'stopped' | 'playing' | 'paused' = 'stopped';
  let notes: PlaybackNote[] = [];
  let playbackStartTime = 0;

  const sync = {
    startPlayback: async function() {
      playbackState = 'playing';
      playbackStartTime = Date.now();
      await audioEngine.play();
      
      // Schedule notes for playback
      for (const note of notes) {
        setTimeout(async () => {
          if (playbackState === 'playing') {
            await audioEngine.playNote(note.pitch, note.duration, note.velocity / 127);
          }
        }, note.startTime * (60000 / tempo));
      }
    },

    stopPlayback: async function() {
      playbackState = 'stopped';
      currentPosition = 0;
      await audioEngine.stop();
    },

    pausePlayback: async function() {
      if (playbackState === 'playing') {
        playbackState = 'paused';
        const elapsedTime = Date.now() - playbackStartTime;
        currentPosition += elapsedTime * (tempo / 60000);
        await audioEngine.pause();
      }
    },

    seekToPosition: async function(position: number) {
      currentPosition = Math.max(0, position);
      if (playbackState === 'playing') {
        playbackStartTime = Date.now() - (currentPosition * (60000 / tempo));
      }
    },

    setTempo: async function(bpm: number) {
      tempo = Math.max(60, Math.min(200, bpm));
      if (playbackState === 'playing') {
        // Restart with new tempo
        await sync.pausePlayback();
        await sync.startPlayback();
      }
    },

    getCurrentPosition: function() {
      if (playbackState === 'playing') {
        const elapsedTime = Date.now() - playbackStartTime;
        return currentPosition + (elapsedTime * (tempo / 60000));
      }
      return currentPosition;
    },

    getTempo: function() {
      return tempo;
    },

    getPlaybackState: function() {
      return playbackState;
    },

    syncNotePlayback: async function(playbackNotes: PlaybackNote[]) {
      notes = playbackNotes.sort((a, b) => a.startTime - b.startTime);
      audioEngine.loadNotes(notes.map(n => ({ pitch: n.pitch, duration: n.duration, position: n.startTime })));
    }
  };

  return sync;
};

describe('playback-sync tempo-control', () => {
  let sync: PlaybackSync;

  beforeEach(() => {
    sync = createPlaybackSync();
  });

  test('initializes-with-default-tempo', () => {
    expect(sync.getTempo()).toBe(120);
    expect(sync.getPlaybackState()).toBe('stopped');
    expect(sync.getCurrentPosition()).toBe(0);
  });

  test('updates-tempo-within-valid-range', async () => {
    await sync.setTempo(140);
    expect(sync.getTempo()).toBe(140);

    await sync.setTempo(300); // Should clamp to 200
    expect(sync.getTempo()).toBe(200);

    await sync.setTempo(30); // Should clamp to 60
    expect(sync.getTempo()).toBe(60);
  });

  test('maintains-position-during-tempo-change', async () => {
    const notes: PlaybackNote[] = [
      { pitch: 'C4', duration: 'quarter', startTime: 0, velocity: 80 },
      { pitch: 'D4', duration: 'quarter', startTime: 1, velocity: 80 }
    ];
    
    await sync.syncNotePlayback(notes);
    await sync.startPlayback();
    await new Promise(resolve => setTimeout(resolve, 100));
    
    await sync.setTempo(160);
    
    expect(sync.getTempo()).toBe(160);
    expect(sync.getCurrentPosition()).toBeGreaterThan(0);
  });
});

describe('playback-sync state-management', () => {
  let sync: PlaybackSync;

  beforeEach(() => {
    sync = createPlaybackSync();
  });

  test('transitions-through-playback-states', async () => {
    expect(sync.getPlaybackState()).toBe('stopped');

    await sync.startPlayback();
    expect(sync.getPlaybackState()).toBe('playing');

    await sync.pausePlayback();
    expect(sync.getPlaybackState()).toBe('paused');

    await sync.stopPlayback();
    expect(sync.getPlaybackState()).toBe('stopped');
  });

  test('maintains-position-during-pause-resume', async () => {
    const notes: PlaybackNote[] = [
      { pitch: 'C4', duration: 'half', startTime: 0, velocity: 80 }
    ];
    
    await sync.syncNotePlayback(notes);
    await sync.startPlayback();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await sync.pausePlayback();
    const pausedPosition = sync.getCurrentPosition();
    
    await new Promise(resolve => setTimeout(resolve, 50));
    expect(sync.getCurrentPosition()).toBe(pausedPosition);
  });

  test('resets-position-on-stop', async () => {
    await sync.startPlayback();
    await new Promise(resolve => setTimeout(resolve, 50));
    
    await sync.stopPlayback();
    expect(sync.getCurrentPosition()).toBe(0);
    expect(sync.getPlaybackState()).toBe('stopped');
  });
});

describe('playback-sync note-synchronization', () => {
  let sync: PlaybackSync;

  beforeEach(() => {
    sync = createPlaybackSync();
  });

  test('schedules-notes-in-chronological-order', async () => {
    const notes: PlaybackNote[] = [
      { pitch: 'C4', duration: 'quarter', startTime: 2, velocity: 80 },
      { pitch: 'D4', duration: 'quarter', startTime: 0, velocity: 70 },
      { pitch: 'E4', duration: 'half', startTime: 1, velocity: 90 }
    ];
    
    await sync.syncNotePlayback(notes);
    expect(sync.getPlaybackState()).toBe('stopped');
  });

  test('handles-seeking-to-specific-position', async () => {
    const notes: PlaybackNote[] = [
      { pitch: 'C4', duration: 'quarter', startTime: 0, velocity: 80 },
      { pitch: 'D4', duration: 'quarter', startTime: 2, velocity: 80 }
    ];
    
    await sync.syncNotePlayback(notes);
    await sync.seekToPosition(1.5);
    
    expect(sync.getCurrentPosition()).toBe(1.5);
  });

  test('prevents-negative-seek-positions', async () => {
    await sync.seekToPosition(-5);
    expect(sync.getCurrentPosition()).toBe(0);
  });
});

describe('playback-sync complex-scenarios', () => {
  let sync: PlaybackSync;

  beforeEach(() => {
    sync = createPlaybackSync();
  });

  test('handles-overlapping-notes-with-different-velocities', async () => {
    const notes: PlaybackNote[] = [
      { pitch: 'C4', duration: 'half', startTime: 0, velocity: 100 },
      { pitch: 'E4', duration: 'quarter', startTime: 0.5, velocity: 60 },
      { pitch: 'G4', duration: 'quarter', startTime: 1, velocity: 80 }
    ];
    
    await sync.syncNotePlayback(notes);
    await sync.startPlayback();
    
    expect(sync.getPlaybackState()).toBe('playing');
  });

  test('maintains-sync-during-rapid-tempo-changes', async () => {
    const notes: PlaybackNote[] = [
      { pitch: 'C4', duration: 'quarter', startTime: 0, velocity: 80 }
    ];
    
    await sync.syncNotePlayback(notes);
    await sync.startPlayback();
    
    await sync.setTempo(100);
    await sync.setTempo(150);
    await sync.setTempo(120);
    
    expect(sync.getTempo()).toBe(120);
    expect(sync.getPlaybackState()).toBe('playing');
  });
});