import Soundfont from 'soundfont-player';
import * as Tone from 'tone';
import type { MusicNote, NoteDuration } from '../types/musicTypes';

export interface AudioNote {
  pitch: MusicNote;
  duration: NoteDuration;
  startTime: number;
  velocity?: number;
}

export class AudioEngine {
  private synth: Tone.PolySynth;
  private instrument: Soundfont.InstrumentPlayer | null = null;
  private currentInstrumentName: string = 'acoustic_grand_piano';
  private masterVolume: Tone.Volume;
  private transport: typeof Tone.Transport;
  private currentSequence: Tone.Part | null = null;
  private isInitialized = false;
  private _volume: number = 0.8;

  constructor() {
    this.masterVolume = new Tone.Volume(Tone.gainToDb(0.8)).toDestination();
    this.synth = new Tone.PolySynth(Tone.Synth).connect(this.masterVolume);
    this.transport = Tone.Transport;
    
    // Configure default settings
    this.synth.set({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.1, sustain: 0.3, release: 1 }
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true; // Mark early to prevent double calls
    await this.loadInstrument(this.currentInstrumentName);
  }

  async loadInstrument(instrumentName: string) {
    this.currentInstrumentName = instrumentName;
    try {
      // Access the raw AudioContext
      const ac = Tone.getContext().rawContext as unknown as AudioContext;
      
      this.instrument = await Soundfont.instrument(
        ac,
        instrumentName as any,
        {
          format: 'mp3',
          soundfont: 'FluidR3_GM'
        }
      );
    } catch (e) {
      console.warn("Failed to load instrument: ", instrumentName, e);
      this.instrument = null; //Fallback to synth
    }
  }

  getInstrumentName() {
    return this.currentInstrumentName;
  }

  private convertNoteToPitch(note: MusicNote): string {
    // Convert our note format (C4, D4, etc.) to Tone.js format
    return note.replace(/(\d)/, '$1');
  }

  private convertDurationToTime(duration: NoteDuration): string {
    const durations = {
      'whole': '1n',
      'half': '2n', 
      'quarter': '4n',
      'eighth': '8n',
      'sixteenth': '16n'
    };
    return durations[duration] || '4n';
  }

async playNote(note: MusicNote, duration: NoteDuration = 'quarter', velocity: number = 0.8) {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
      } catch (e) {
        console.warn("Could not start Tone context:", e);
        return;
      }
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }

    const pitch = this.convertNoteToPitch(note);
    const timeToSeconds = Tone.Time(this.convertDurationToTime(duration)).toSeconds();
    const effectiveVelocity = velocity * this._volume;

    if (this.instrument) {
      this.instrument.play(pitch, Tone.context.currentTime, { duration: timeToSeconds, gain: effectiveVelocity });
    } else {
      this.synth.triggerAttackRelease(pitch, this.convertDurationToTime(duration), undefined, effectiveVelocity);
    }
  }

  loadSequence(notes: AudioNote[]) {
    if (this.currentSequence) {
      this.currentSequence.dispose();
    }

    const sequence = notes.map(note => ({
      time: note.startTime,
      note: {
        pitch: this.convertNoteToPitch(note.pitch),
        duration: this.convertDurationToTime(note.duration),
        timeSecs: Tone.Time(this.convertDurationToTime(note.duration)).toSeconds(),
        velocity: note.velocity || 0.8
      }
    }));

    this.currentSequence = new Tone.Part((time, value) => {
      const effectiveVelocity = value.note.velocity * this._volume;
      if (this.instrument) {
        this.instrument.play(value.note.pitch, time, { duration: value.note.timeSecs, gain: effectiveVelocity });
      } else {
        this.synth.triggerAttackRelease(
          value.note.pitch, 
          value.note.duration, 
          time, 
          effectiveVelocity
        );
      }
    }, sequence);
    
    // Crucial: start the sequence so it plays when the transport is running
    this.currentSequence.start(0);
  }

async play() {
    if (Tone.context.state !== 'running') {
      try {
        await Tone.start();
      } catch (e) {
        console.warn("Could not start Tone context:", e);
      }
    }
    
    if (!this.isInitialized) {
      await this.initialize();
    }
    
    this.transport.start();
  }

  pause() {
    this.transport.pause();
  }

  stop() {
    this.transport.stop();
    this.transport.position = 0;
  }

  seek(position: number) {
    this.transport.position = position;
  }

  setTempo(bpm: number) {
    this.transport.bpm.value = bpm;
  }

  getTempo(): number {
    return this.transport.bpm.value;
  }

  getCurrentTime(): number {
    // Convert Tone.Transport position to seconds
    return this.transport.seconds;
  }

  get isPlaying(): boolean {
    return this.transport.state === 'started';
  }

  get isPaused(): boolean {
    return this.transport.state === 'paused';
  }

  setVolume(volume: number) {
    this._volume = volume;
    this.masterVolume.volume.value = Tone.gainToDb(volume);
  }

  dispose() {
    if (this.currentSequence) {
      this.currentSequence.dispose();
    }
    this.synth.dispose();
  }
}

// Singleton instance
export const audioEngine = new AudioEngine();