import { useCallback, useRef, useEffect } from 'react';
import * as Tone from 'tone';
import { useDispatch } from 'react-redux';
import { MusicNote } from '../../../types/enums';
import type { Project } from '../../../types/models';

// Simple action creators to avoid slice.actions issues
const setAudioEngineReady = (ready: boolean) => ({ type: 'playback/setAudioEngineReady', payload: ready });
const setError = (error: string) => ({ type: 'playback/setError', payload: error });

interface AudioEngineConfig {
  sampleRate?: number;
  bufferSize?: number;
  masterVolume?: number;
}

export class AudioEngine {
  private synth: Tone.PolySynth | null = null;
  private reverb: Tone.Reverb | null = null;
  private masterVolume: Tone.Volume | null = null;
  private initialized = false;

  async initialize(config: AudioEngineConfig = {}) {
    if (this.initialized) return;

    try {
      await Tone.start();

      // Configure audio context
      if (config.sampleRate && Tone.context.rawContext) {
        // Note: Sample rate is typically fixed by the system
        console.log(`Target sample rate: ${config.sampleRate}Hz, Actual: ${Tone.context.sampleRate}Hz`);
      }

      // Create synth
      this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
      this.synth.set({
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
      this.reverb = new Tone.Reverb({
        decay: 2.5,
        wet: 0.2
      });

      this.masterVolume = new Tone.Volume(config.masterVolume || -10);

      // Connect audio chain
      if (this.synth && this.reverb && this.masterVolume) {
        this.synth.connect(this.reverb);
        this.reverb.connect(this.masterVolume);
        this.masterVolume.toDestination();
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize audio engine:', error);
      throw error;
    }
  }

  async dispose() {
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    if (this.reverb) {
      this.reverb.dispose(); 
      this.reverb = null;
    }
    if (this.masterVolume) {
      this.masterVolume.dispose();
      this.masterVolume = null;
    }
    this.initialized = false;
  }

  playNote(note: MusicNote, duration: string = '8n', velocity: number = 0.7) {
    if (!this.synth || !this.initialized) {
      console.warn('Audio engine not initialized');
      return;
    }

    try {
      const frequency = this.noteToFrequency(note);
      this.synth.triggerAttackRelease(frequency, duration, undefined, velocity);
    } catch (error) {
      console.error('Failed to play note:', error);
    }
  }

  playChord(notes: MusicNote[], duration: string = '8n', velocity: number = 0.7) {
    if (!this.synth || !this.initialized) {
      console.warn('Audio engine not initialized');
      return;
    }

    try {
      const frequencies = notes.map(note => this.noteToFrequency(note));
      this.synth.triggerAttackRelease(frequencies, duration, undefined, velocity);
    } catch (error) {
      console.error('Failed to play chord:', error);
    }
  }

  setMasterVolume(volume: number) {
    if (this.masterVolume) {
      this.masterVolume.volume.value = Tone.gainToDb(volume);
    }
  }

  setReverbAmount(amount: number) {
    if (this.reverb) {
      this.reverb.wet.value = Math.max(0, Math.min(1, amount));
    }
  }

  private noteToFrequency(note: MusicNote): string {
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
  }
}

// Hook for using the audio engine
export const useAudioEngine = () => {
  const dispatch = useDispatch();
  const audioEngineRef = useRef<AudioEngine | null>(null);
  // Remove unused selectors for now

  // Initialize audio engine
  const initializeAudio = useCallback(async () => {
    try {
      if (!audioEngineRef.current) {
        audioEngineRef.current = new AudioEngine();
      }

      await audioEngineRef.current.initialize({
        sampleRate: 44100, // Default fallback
        bufferSize: 256,   // Default fallback
        masterVolume: 0.8, // Default fallback
      });

      dispatch(setAudioEngineReady(true));
    } catch (error) {
      dispatch(setError(error instanceof Error ? error.message : 'Failed to initialize audio'));
    }
  }, [dispatch]);

  // Clean up audio engine
  const disposeAudio = useCallback(async () => {
    if (audioEngineRef.current) {
      await audioEngineRef.current.dispose();
      audioEngineRef.current = null;
    }
    dispatch(setAudioEngineReady(false));
  }, [dispatch]);

  // Play a single note
  const playNote = useCallback((note: MusicNote, duration?: string, velocity?: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.playNote(note, duration, velocity);
    }
  }, []);

  // Play multiple notes as a chord
  const playChord = useCallback((notes: MusicNote[], duration?: string, velocity?: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.playChord(notes, duration, velocity);
    }
  }, []);

  // Update master volume
  const setMasterVolume = useCallback((volume: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setMasterVolume(volume);
    }
  }, []);

  // Set reverb amount
  const setReverbAmount = useCallback((amount: number) => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setReverbAmount(amount);
    }
  }, []);

  // Play project as sequence
  const playProject = useCallback(async (project: Project) => {
    if (!audioEngineRef.current) {
      console.warn('Audio engine not ready');
      return;
    }

    dispatch({ type: 'playback/play' });
    console.log('Playing project:', project.name);
  }, [dispatch]);

  // Stop playback
  const stopPlayback = useCallback(() => {
    dispatch({ type: 'playback/stop' });
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }, [dispatch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disposeAudio();
    };
  }, [disposeAudio]);

  return {
    isReady: true, // Placeholder - will be properly managed by Redux
    initializeAudio,
    disposeAudio,
    playNote,
    playChord,
    playProject,
    stopPlayback,
    setMasterVolume,
    setReverbAmount,
  };
};