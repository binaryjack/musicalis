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
  private transport: typeof Tone.Transport;
  private currentSequence: Tone.Part | null = null;
  private isInitialized = false;

  constructor() {
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
    this.transport = Tone.Transport;
    
    // Configure default settings
    this.synth.set({
      oscillator: {
        type: 'triangle'
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    });
  }

  async initialize() {
    if (this.isInitialized) return;
    
    await Tone.start();
    this.isInitialized = true;
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

  playNote(note: MusicNote, duration: NoteDuration = 'quarter', velocity: number = 0.8) {
    if (!this.isInitialized) return;
    
    const pitch = this.convertNoteToPitch(note);
    const time = this.convertDurationToTime(duration);
    
    this.synth.triggerAttackRelease(pitch, time, undefined, velocity);
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
        velocity: note.velocity || 0.8
      }
    }));

    this.currentSequence = new Tone.Part((time, value) => {
      this.synth.triggerAttackRelease(
        value.note.pitch, 
        value.note.duration, 
        time, 
        value.note.velocity
      );
    }, sequence);
  }

  play() {
    if (!this.isInitialized) return;
    
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
    this.synth.volume.value = Tone.gainToDb(volume);
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