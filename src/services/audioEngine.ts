import * as Tone from 'tone';
import Soundfont from 'soundfont-player';
import type { MusicNote, NoteDuration } from '../types/musicTypes';

export interface AudioNote {
  pitch: MusicNote;
  duration: NoteDuration;
  startTime: number;
  velocity?: number;
}

export const createAudioEngine = function() {
  const masterVolume = new Tone.Volume(Tone.gainToDb(0.8)).toDestination();
  const synth = new Tone.PolySynth(Tone.Synth).connect(masterVolume);
  const transport = Tone.Transport;
  
  let instrument: Soundfont.InstrumentPlayer | null = null;
  let currentInstrumentName = 'acoustic_grand_piano';
  let currentSequence: Tone.Part | null = null;
  let isInitialized = false;
  let volume = 0.8;
  
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

  const convertNoteToPitch = function(note: MusicNote | string): string {
    if (note.match(/\d+$/)) {
      return note; // Already has octave
    }
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

  const playNote = async function(note: MusicNote, duration: NoteDuration = 'quarter', velocity: number = 0.8) {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    
    if (!isInitialized) {
      await initialize();
    }

    const pitch = convertNoteToPitch(note);
    const timeValue = convertDurationToTime(duration);

    if (instrument && note) {
      try {
        const durationSecs = Tone.Time(timeValue).toSeconds();
        instrument.play(pitch, undefined, {
          duration: durationSecs,
          gain: (velocity > 1 ? velocity / 127 : velocity) * volume
        });
      } catch (error) {
        console.error('Failed to play note with instrument:', error);
        synth.triggerAttackRelease(pitch, timeValue, undefined, velocity);
      }
    } else {
      synth.triggerAttackRelease(pitch, timeValue, undefined, velocity);
    }
  };

  const loadSequence = function(notes: AudioNote[]) {
    if (currentSequence) {
      currentSequence.dispose();
    }
    
    const sequence = notes.map(note => ({
      time: note.startTime,
      note: {
        pitch: convertNoteToPitch(note.pitch),
        duration: convertDurationToTime(note.duration),
        velocity: note.velocity ?? 0.8
      }
    }));
    
    currentSequence = new Tone.Part((time, noteData) => {
      console.log('Sequence playing note:', noteData.note.pitch, '@ time', time);
      if (instrument) {
        try {
          instrument.play(noteData.note.pitch, time, {
            duration: Tone.Time(noteData.note.duration).toSeconds(),
            gain: (noteData.note.velocity > 1 ? noteData.note.velocity / 127 : noteData.note.velocity) * volume
          });
        } catch (e) {
          console.error("Instrument play error:", e);
          synth.triggerAttackRelease(noteData.note.pitch, noteData.note.duration, time, noteData.note.velocity);
        }
      } else {
        synth.triggerAttackRelease(noteData.note.pitch, noteData.note.duration, time, noteData.note.velocity);
      }
    }, sequence);
    console.log('Loaded sequence with notes:', sequence.length);
    currentSequence.start(0);
  };

  const play = async function() {
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }
    if (!isInitialized) await initialize();
    await transport.start();
  };

  const pause = function() {
    transport.pause();
  };

  const stop = function() {
    transport.stop();
    transport.seconds = 0;
  };

  const seek = function(position: number) {
    if (!Number.isNaN(position)) {
      transport.seconds = position;
    }
  };

  const setTempo = function(bpm: number) {
    transport.bpm.value = bpm;
  };

  const getTempo = function(): number {
    return transport.bpm.value;
  };

  const getCurrentTime = function(): number {
    return transport.seconds;
  };

  const getIsPlaying = function(): boolean {
    return transport.state === 'started';
  };

  const getIsPaused = function(): boolean {
    return transport.state === 'paused';
  };

  const setVolume = function(newVolume: number) {
    volume = Math.max(0, Math.min(1, newVolume));
    masterVolume.volume.value = Tone.gainToDb(volume);
  };

  const getVolume = function(): number {
    return volume;
  };

  const dispose = function() {
    if (currentSequence) {
      currentSequence.dispose();
    }
    synth.dispose();
    masterVolume.dispose();
  };

  return Object.freeze({
    initialize,
    loadInstrument,
    getInstrumentName,
    playNote,
    loadSequence,
    play,
    pause,
    stop,
    seek,
    setTempo,
    getTempo,
    getCurrentTime,
    get isPlaying() { return getIsPlaying(); },
    get isPaused() { return getIsPaused(); },
    setVolume,
    getVolume,
    dispose
  });
};

export const audioEngine = createAudioEngine();