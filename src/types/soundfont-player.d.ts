declare module 'soundfont-player' {
  export interface PlayerOptions {
    format?: 'mp3' | 'ogg';
    soundfont?: 'FluidR3_GM' | 'MusyngKite';
    nameToUrl?: (name: string, soundfont: string, format: string) => string;
    destination?: any;
    gain?: number;
    attack?: number;
    decay?: number;
    sustain?: number;
    release?: number;
  }

  export interface AudioNode {
    stop(when?: number): void;
  }

  export interface InstrumentPlayer {
    play(note: string | number, time?: number, options?: { duration?: number; gain?: number; attack?: number; release?: number }): AudioNode;
    stop(time?: number): void;
    schedule(time: number, events: { time: number; note: string | number; duration?: number; gain?: number }[]): void;
  }

  export function instrument(
    audioContext: AudioContext | any,
    instrumentName: string,
    options?: PlayerOptions
  ): Promise<InstrumentPlayer>;
}
