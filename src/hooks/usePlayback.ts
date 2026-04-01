import * as Tone from 'tone';
import { useCallback, useEffect, useState } from 'react';
import { audioEngine, type AudioNote } from '../services/audioEngine';
import type { MusicNote, NoteDuration } from '../types/musicTypes';

export interface UsePlaybackReturn {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  tempo: number;
  volume: number;
  instrumentName: string;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setTempo: (bpm: number) => void;
  setVolume: (volume: number) => void;
  setInstrument: (name: string) => Promise<void>;
  loadNotes: (notes: { pitch: MusicNote; duration: NoteDuration; beatIndex?: number; startTime?: number }[]) => void;
  playNote: (note: MusicNote, duration?: NoteDuration, velocity?: number) => void;
}

export const usePlayback = (): UsePlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempoState] = useState(120);
  const [volume, setVolumeState] = useState(0.8);
  const [instrumentName, setInstrumentName] = useState('acoustic_grand_piano');

  // Initialize audio engine
  useEffect(() => {
    audioEngine.initialize().then(() => {
      setInstrumentName(audioEngine.getInstrumentName());
    });
  }, []);

  // Update playback state periodically
  useEffect(() => {
    let intervalId: number;

    if (isPlaying) {
      intervalId = setInterval(() => {
        const time = audioEngine.getCurrentTime();
        setCurrentTime(time);
        
        // Check if playback has stopped
        if (!audioEngine.isPlaying && isPlaying) {
          setIsPlaying(false);
          setIsPaused(false);
        }
      }, 100); // Update every 100ms
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying]);

  const play = useCallback(async () => {
    if (Tone.context.state !== 'running') {
      await Tone.start(); // IMMEDIATELY on click to respect browser autoplay policies
    }
    await audioEngine.initialize();
    await audioEngine.play();
    setIsPlaying(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    audioEngine.pause();
    setIsPlaying(false);
    setIsPaused(true);
  }, []);

  const stop = useCallback(() => {
    audioEngine.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentTime(0);
  }, []);

  const seek = useCallback((position: number) => {
    audioEngine.seek(position);
    setCurrentTime(position);
  }, []);

  const setTempo = useCallback((bpm: number) => {
    audioEngine.setTempo(bpm);
    setTempoState(bpm);
  }, []);

  const setVolume = useCallback((vol: number) => {
    audioEngine.setVolume(vol);
    setVolumeState(vol);
  }, []);

  const setInstrument = useCallback(async (name: string) => {
    await audioEngine.loadInstrument(name);
    setInstrumentName(name);
  }, []);

  const loadNotes = useCallback((notes: { pitch: MusicNote; duration: NoteDuration; beatIndex?: number; startTime?: number }[]) => {
    const secondsPerBeat = 60 / tempo;
    const audioNotes: AudioNote[] = notes.map((note, index) => {
      let startTime = index * 0.5;
      if (note.startTime !== undefined) {
        startTime = note.startTime;
      } else if (note.beatIndex !== undefined) {
        startTime = note.beatIndex * secondsPerBeat;
      }
      return {
        pitch: note.pitch,
        duration: note.duration,
        startTime,
        velocity: 0.8
      };
    });

    audioEngine.loadSequence(audioNotes);
    
    // Calculate total duration
    const maxStartTime = audioNotes.length > 0 ? Math.max(...audioNotes.map(n => n.startTime)) : 0;
    const totalDuration = maxStartTime + 2; // Add 2 seconds buffer
    setDuration(totalDuration);
  }, [tempo]);

  const playNote = useCallback((note: MusicNote, dur: NoteDuration = 'quarter', velocity: number = 0.8) => {
    audioEngine.playNote(note, dur, velocity);
  }, []);

  return {
    isPlaying,
    isPaused,
    currentTime,
    duration,
    tempo,
    volume,
    instrumentName,
    play,
    pause,
    stop,
    seek,
    setTempo,
    setVolume,
    setInstrument,
    loadNotes,
    playNote
  };
};