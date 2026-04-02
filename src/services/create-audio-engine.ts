import * as Tone from 'tone';
import Soundfont from 'soundfont-player';
import type { MusicNote, NoteDuration } from '../types/musicTypes';
import { isNote, getDurationInMs } from '../shared/utils/musical-elements';
import type { MusicalNote } from '../types/models/note.model';

export interface AudioNote {
  pitch?: MusicNote;
  duration: NoteDuration | number;
  startTime: number;
  velocity?: number;
  type?: 'note' | 'rest';
}

export const createAudioEngine = function() {
  let synth: Tone.PolySynth;
  let instrument: Soundfont.InstrumentPlayer | null = null;
  let currentInstrumentName = 'acoustic_grand_piano';
  let masterVolume: Tone.Volume;
  let transport: typeof Tone.Transport;
  let currentSequence: Tone.Part | null = null;
  let isInitialized = false;
  let _volume = 0.8;

  // Initialize components
  masterVolume = new Tone.Volume(Tone.gainToDb(0.8)).toDestination();
  synth = new Tone.PolySynth(Tone.Synth).connect(masterVolume);
  transport = Tone.Transport;
  
  // Configure default settings
  synth.set({
    oscillator: { type: 'triangle' },
    envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
  });

  const initialize = async function() {
    if (isInitialized) return;
    isInitialized = true;
    await loadInstrument(currentInstrumentName);
  };

  const loadInstrument = async function(instrumentName: string) {
    try {
      const audioContext = Tone.getContext().rawContext;
      instrument = await Soundfont.instrument(audioContext, instrumentName);
      currentInstrumentName = instrumentName;
    } catch (error) {
      console.error('Failed to load instrument:', error);
    }
  };

  const getInstrumentName = function() {
    return currentInstrumentName;
  };

  const convertNoteToPitch = function(note: MusicNote): string {
    return `${note}4`; // Default to 4th octave
  };

  const convertDurationToTime = function(duration: NoteDuration): string {
    const durations: Record<NoteDuration, string> = {
      'whole': '1n',
      'half': '2n', 
      'quarter': '4n',
      'eighth': '8n',
      'sixteenth': '16n'
    };
    return durations[duration] ?? '4n';
  };

  const convertMusicalElementToAudio = function(element: MusicalNote, startTime: number, bpm: number): AudioNote {
    if (!isNote(element)) {
      return {
        type: 'rest' as const,
        startTime,
        duration: getDurationInMs(element.duration, bpm)
      };
    }

    return {
      type: 'note' as const,
      pitch: element.pitch,
      startTime,
      duration: getDurationInMs(element.duration, bpm),
      velocity: element.velocity || 64
    };
  };

  const playNote = function(note: MusicNote, duration: NoteDuration = 'quarter', velocity = 0.8) {
    if (!isInitialized) {
      console.warn('AudioEngine not initialized. Call initialize() first.');
      return;
    }

    if (instrument && note) {
      try {
        instrument.play(
          note,
          undefined,
          {
            duration: getDurationInMs(duration, 120) / 1000,
            gain: (velocity || 64) / 127
          }
        );
      } catch (error) {
        console.error('Failed to play note with instrument:', error);
        const pitch = convertNoteToPitch(note);
        const time = convertDurationToTime(duration);
        synth.triggerAttackRelease(
          pitch,
          time,
          undefined,
          (velocity || 64) / 127
        );
      }
    } else {
      const pitch = convertNoteToPitch(note);
      const time = convertDurationToTime(duration);
      synth.triggerAttackRelease(
        pitch,
        time,
        undefined,
        (velocity || 64) / 127
      );
    }
  };

  const loadSequence = function(notes: readonly AudioNote[]) {
    if (currentSequence) {
      currentSequence.dispose();
    }
    
    const sequence = notes
      .filter(note => note.pitch && note.type !== 'rest')
      .map(note => ({
      time: note.startTime,
      note: {
        pitch: convertNoteToPitch(note.pitch as MusicNote),
        duration: typeof note.duration === 'number' ? (note.duration / 1000) : convertDurationToTime(note.duration),
        velocity: note.velocity ?? 0.8
      }
    }));
    
    currentSequence = new Tone.Part((time, event) => {
      synth.triggerAttackRelease(event.note.pitch, event.note.duration, time, event.note.velocity);
    }, sequence);
  };

  const play = async function() {
    if (!isInitialized) await initialize();
    await transport.start();
  };

  const pause = function() {
    transport.pause();
  };

  const stop = function() {
    transport.stop();
    transport.position = 0;
  };

  const seek = function(position: number) {
    transport.position = position;
  };

  const getCurrentTime = function(): number {
    return Number(transport.position);
  };

  const getDuration = function(): number {
    return Number(transport.bpm.value);
  };

  const getIsPlaying = function(): boolean {
    return transport.state === 'started';
  };

  const setVolume = function(volume: number) {
    _volume = Math.max(0, Math.min(1, volume));
    masterVolume.volume.value = Tone.gainToDb(_volume);
  };

  const getVolume = function(): number {
    return _volume;
  };

  // Public API - frozen object per copilot instructions
  return Object.freeze({
    initialize,
    loadInstrument,
    getInstrumentName,
    convertMusicalElementToAudio,
    playNote,
    loadSequence,
    play,
    pause,
    stop,
    seek,
    getCurrentTime,
    getDuration,
    isPlaying: getIsPlaying,
    setVolume,
    getVolume
  });
};