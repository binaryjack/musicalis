import * as Tone from 'tone';
import { MusicNote } from '../../../types/enums';
import type { Project } from '../../../types/models';

interface AudioEngineConfig {
  sampleRate?: number;
  bufferSize?: number;
  masterVolume?: number;
}

export const createAudioEngine = function(config: AudioEngineConfig = {}) {
  // Private state
  let synth: Tone.PolySynth | null = null;
  let reverb: Tone.Reverb | null = null;
  let masterVolume: Tone.Volume | null = null;
  let initialized = false;

  const initialize = async function() {
    if (initialized) return;

    try {
      await Tone.start();

      // Configure audio context
      if (config.sampleRate && Tone.context.rawContext) {
        // Note: Sample rate is typically fixed by the system
        console.log(`Target sample rate: ${config.sampleRate}Hz, Actual: ${Tone.context.sampleRate}Hz`);
      }

      // Create synth
      synth = new Tone.PolySynth(Tone.Synth).toDestination();
      synth.set({
        oscillator: {
          type: 'sine'
        },
        envelope: {
          attack: 0.01,
          decay: 0.1,
          sustain: 0.3,
          release: 0.5
        }
      });

      // Create effects
      reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.2
      });

      masterVolume = new Tone.Volume(config.masterVolume || -10);

      // Connect audio chain
      if (synth && reverb && masterVolume) {
        synth.connect(reverb);
        reverb.connect(masterVolume);
        masterVolume.toDestination();
      }

      initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  };

  const dispose = async function() {
    if (synth) {
      synth.dispose();
      synth = null;
    }
    if (reverb) {
      reverb.dispose(); 
      reverb = null;
    }
    if (masterVolume) {
      masterVolume.dispose();
      masterVolume = null;
    }
    initialized = false;
  };

  const playNote = function(note: MusicNote, duration: string = '8n', velocity: number = 0.7) {
    if (!synth || !initialized) {
      console.warn('Audio engine not initialized');
      return;
    }

    try {
      const frequency = noteToFrequency(note);
      synth.triggerAttackRelease(frequency, duration, undefined, velocity);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  };

  const playChord = function(notes: MusicNote[], duration: string = '8n', velocity: number = 0.7) {
    if (!synth || !initialized) {
      console.warn('Audio engine not initialized');
      return;
    }

    try {
      const frequencies = notes.map(note => noteToFrequency(note));
      synth.triggerAttackRelease(frequencies, duration, undefined, velocity);
    } catch (error) {
      console.error('Failed to play chord:', error);
    }
  };

  const setMasterVolume = function(volume: number) {
    if (masterVolume) {
      masterVolume.volume.value = Tone.gainToDb(volume);
    }
  };

  const setReverbAmount = function(amount: number) {
    if (reverb) {
      reverb.wet.value = Math.max(0, Math.min(1, amount));
    }
  };

  const noteToFrequency = function(note: MusicNote): string {
    // Convert MusicNote enum to Tone.js note format
    const noteMap: Record<string, string> = {
      [MusicNote.C]: 'C4',
      [MusicNote.D]: 'D4',
      [MusicNote.E]: 'E4',
      [MusicNote.F]: 'F4',
      [MusicNote.G]: 'G4',
      [MusicNote.A]: 'A4',
      [MusicNote.B]: 'B4',
    };

    return noteMap[note] || 'C4';
  };

  // Public API with frozen interface
  return Object.freeze({
    initialize,
    dispose,
    playNote,
    playChord,
    setMasterVolume,
    setReverbAmount,
  });
};

// Service for managing audio engine with state dispatch
export const createAudioEngineService = function(dispatch: (action: { type: string; payload?: unknown }) => void) {
  let audioEngine: ReturnType<typeof createAudioEngine> | null = null;

  const initializeAudio = async function() {
    try {
      if (!audioEngine) {
        audioEngine = createAudioEngine({
          sampleRate: 44100,
          bufferSize: 256,
          masterVolume: 0.8,
        });
      }

      await audioEngine.initialize();
      dispatch({ type: 'playback/setAudioEngineReady', payload: true });
    } catch (error) {
      dispatch({ 
        type: 'playback/setError', 
        payload: error instanceof Error ? error.message : 'Failed to initialize audio' 
      });
    }
  };

  const disposeAudio = async function() {
    if (audioEngine) {
      await audioEngine.dispose();
      audioEngine = null;
    }
    dispatch({ type: 'playback/setAudioEngineReady', payload: false });
  };

  const playNote = function(note: MusicNote, duration?: string, velocity?: number) {
    if (audioEngine) {
      audioEngine.playNote(note, duration, velocity);
    }
  };

  const playChord = function(notes: MusicNote[], duration?: string, velocity?: number) {
    if (audioEngine) {
      audioEngine.playChord(notes, duration, velocity);
    }
  };

  const setMasterVolume = function(volume: number) {
    if (audioEngine) {
      audioEngine.setMasterVolume(volume);
    }
  };

  const setReverbAmount = function(amount: number) {
    if (audioEngine) {
      audioEngine.setReverbAmount(amount);
    }
  };

  const playProject = async function(project: Project) {
    if (!audioEngine) {
      console.warn('Audio engine not ready');
      return;
    }

    dispatch({ type: 'playback/play' });
    console.log('Playing project:', project.name);
  };

  const stopPlayback = function() {
    dispatch({ type: 'playback/stop' });
    Tone.Transport.stop();
    Tone.Transport.cancel();
  };

  return Object.freeze({
    initializeAudio,
    disposeAudio,
    playNote,
    playChord,
    playProject,
    stopPlayback,
    setMasterVolume,
    setReverbAmount,
    isReady: true, // Placeholder - managed by Redux
  });
};