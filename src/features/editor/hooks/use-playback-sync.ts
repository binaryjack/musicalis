import { useState, useEffect } from 'react'
import type { UsePlaybackReturn } from '../../../hooks/usePlayback'
import type { Staff, MusicNote, NoteDuration } from '../../../types/musicTypes'

interface UsePlaybackSyncOptions {
  staffs: Staff[];
  playback: UsePlaybackReturn;
  cursorPosition: number;
  setCursorPosition: React.Dispatch<React.SetStateAction<number>>;
}

export const usePlaybackSync = ({ staffs, playback, cursorPosition, setCursorPosition }: UsePlaybackSyncOptions) => {
  const [bpm, setBpm] = useState(120);

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    playback.setTempo(newBpm);
  };

  const handlePlayheadChange = (position: number) => {
    setCursorPosition(position);
    playback.seek(position);
  };

  const handleGoToStart = () => { setCursorPosition(0); playback.seek(0); };

  const handleStepBackward = () => {
    const pos = Math.max(0, cursorPosition - 0.25);
    setCursorPosition(pos); playback.seek(pos);
  };

  const handleStepForward = () => {
    const pos = cursorPosition + 0.25;
    setCursorPosition(pos); playback.seek(pos);
  };

  const handleGoToEnd = () => {
    let maxBeats = 0;
    staffs.forEach(s => { maxBeats = Math.max(maxBeats, s.bars.length * (s.bars[0]?.beats.length || 4)); });
    const endPos = Math.max(maxBeats, 4);
    setCursorPosition(endPos); playback.seek(endPos);
  };

  // Load notes into playback engine whenever staffs change
  useEffect(() => {
    const allNotes: { pitch: MusicNote; duration: NoteDuration; beatIndex: number }[] = [];
    staffs.forEach(staff => {
      staff.bars.forEach(bar => {
        bar.beats.forEach(beat => {
          beat.notes.forEach(note => {
            if ((note as unknown as { type: string }).type !== 'rest') {
              allNotes.push({
                pitch: `${note.pitch}${note.octave}` as MusicNote,
                duration: note.duration,
                beatIndex: bar.index * bar.beats.length + beat.index + (note.subdivisionOffset || 0),
              });
            }
          });
        });
      });
    });
    allNotes.sort((a, b) => a.beatIndex - b.beatIndex);
    playback.loadNotes(allNotes);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffs]);

  // rAF loop: advance cursor while playing
  useEffect(() => {
    if (!playback.isPlaying) return;
    let raf: number;
    let maxBeats = 0;
    staffs.forEach(s => { maxBeats = Math.max(maxBeats, s.bars.length * (s.bars[0]?.beats.length || 4)); });
    const bps = bpm / 60;
    const update = () => {
      const beat = playback.currentTime * bps;
      if (beat >= maxBeats) { playback.stop(); setCursorPosition(maxBeats); return; }
      setCursorPosition(beat);
      if (playback.isPlaying) raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [playback, bpm, staffs, setCursorPosition]);

  return { bpm, handleBpmChange, handlePlayheadChange, handleGoToStart, handleStepBackward, handleStepForward, handleGoToEnd };
};
