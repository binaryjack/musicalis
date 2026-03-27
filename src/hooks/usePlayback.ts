import { useState, useEffect, useCallback } from 'react';
import { audioEngine, type AudioNote } from '../services/audioEngine';
import type { MusicNote, NoteDuration } from '../types/musicTypes';

export interface UsePlaybackReturn {
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  duration: number;
  tempo: number;
  volume: number;
  play: () => Promise<void>;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setTempo: (bpm: number) => void;
  setVolume: (volume: number) => void;
  loadNotes: (notes: { pitch: MusicNote; duration: NoteDuration }[]) => void;
  playNote: (note: MusicNote, duration?: NoteDuration, velocity?: number) => void;
}

export const usePlayback = (): UsePlaybackReturn => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [tempo, setTempoState] = useState(120);
  const [volume, setVolumeState] = useState(0.8);

  // Initialize audio engine
  useEffect(() => {
    audioEngine.initialize();
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
    await audioEngine.initialize();
    audioEngine.play();
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

  const loadNotes = useCallback((notes: { pitch: MusicNote; duration: NoteDuration }[]) => {
    const audioNotes: AudioNote[] = notes.map((note, index) => ({
      ...note,
      startTime: index * 0.5, // Simple timing - 0.5 seconds apart
      velocity: 0.8
    }));

    audioEngine.loadSequence(audioNotes);
    
    // Calculate total duration (rough estimate)
    const totalDuration = audioNotes.length * 0.5 + 2; // Add 2 seconds buffer
    setDuration(totalDuration);
  }, []);

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
    play,
    pause,
    stop,
    seek,
    setTempo,
    setVolume,
    loadNotes,
    playNote
  };
};