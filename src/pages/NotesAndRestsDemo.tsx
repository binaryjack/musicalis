import { useState } from 'react';
import { NoteDuration, RestType, MusicalElementType, MusicNote } from '../types';
import type { MusicalNote } from '../types/models/note.model';
import { MusicalElementSelector } from '../components/molecules/MusicalElementSelector/MusicalElementSelector';
import { Button } from '../components/atoms/Button/Button';
import { createNote, createRest, isNote, getElementDisplayName, getDurationSymbol, getRestSymbol } from '../shared/utils/musical-elements';
import { createAudioEngine } from '../services/audioEngine';
import styles from './NotesAndRestsDemo.module.css';

const audioEngine = createAudioEngine();

export const NotesAndRestsDemo = () => {
  // UI State
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [selectedElementType, setSelectedElementType] = useState<MusicalElementType>(MusicalElementType.NOTE);
  const [selectedNote, setSelectedNote] = useState<MusicNote>(MusicNote.C);
  const [selectedRest, setSelectedRest] = useState<RestType>(RestType.QUARTER_REST);
  const [selectedOctave, setSelectedOctave] = useState<number>(4);
  const [velocity, setVelocity] = useState<number>(64);
  const [bpm, setBpm] = useState<number>(120);

  // Musical sequence
  const [sequence, setSequence] = useState<MusicalNote[]>([]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Initialize audio engine
  useState(() => {
    audioEngine.initialize();
  });

  const addElement = () => {
    let newElement: MusicalNote;
    
    if (selectedElementType === MusicalElementType.NOTE) {
      newElement = createNote({
        pitch: selectedNote,
        octave: selectedOctave,
        duration: selectedDuration,
        velocity,
      });
    } else {
      newElement = createRest({
        duration: selectedDuration,
      });
    }
    
    setSequence(prev => [...prev, newElement]);
  };

  const clearSequence = () => {
    setSequence([]);
  };

  const removeElement = (index: number) => {
    setSequence(prev => prev.filter((_, i) => i !== index));
  };

  const playSequence = async () => {
    if (sequence.length === 0) {
      alert('Add some notes and rests first!');
      return;
    }
    
    setIsPlaying(true);
    try {
      audioEngine.setTempo(bpm);
      
      // Convert MusicalNote[] to AudioNote[] format
      let currentTime = 0;
      const audioSequence = sequence.map(element => {
        const startTime = currentTime;
        const durationMs = getDurationInMs(element.duration, bpm, element.dotted);
        currentTime += durationMs / 1000; // Convert to seconds
        
        if (isNote(element)) {
          return {
            pitch: element.pitch,
            duration: element.duration,
            startTime,
            velocity: element.velocity || 64
          };
        } else {
          // For rests, we still need to advance time but don't include in sequence
          return null;
        }
      }).filter(Boolean) as import('../services/audioEngine').AudioNote[];
      
      audioEngine.loadSequence(audioSequence);
      audioEngine.play();
    } catch (error) {
      console.error('Error playing sequence:', error);
    } finally {
      // Reset after estimated duration
      const totalDuration = sequence.reduce((total, element) => {
        const durationMs = getDurationInMs(element.duration, bpm, element.dotted);
        return total + durationMs;
      }, 0);
      
      setTimeout(() => {
        setIsPlaying(false);
      }, totalDuration + 500);
    }
  };

  const playPreview = async () => {
    if (selectedElementType === MusicalElementType.NOTE) {
      try {
        await audioEngine.playNote(selectedNote, selectedDuration, velocity / 127);
      } catch (error) {
        console.error('Error playing preview:', error);
      }
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>🎵 Musical Notes & Rests Demo</h1>
        <p>Create sequences with notes and rests to hear how silence shapes music</p>
      </div>

      <div className={styles.content}>
        <div className={styles.controls}>
          <div className={styles.section}>
            <h3>Element Selection</h3>
            <MusicalElementSelector
              selectedDuration={selectedDuration}
              selectedElementType={selectedElementType}
              selectedNote={selectedNote}
              selectedRest={selectedRest}
              onSelectDuration={setSelectedDuration}
              onSelectElementType={setSelectedElementType}
              onSelectNote={setSelectedNote}
              onSelectRest={setSelectedRest}
            />
          </div>

          <div className={styles.section}>
            <h3>Additional Controls</h3>
            
            <div className={styles.controlGroup}>
              <label>
                Octave:
                <select 
                  value={selectedOctave} 
                  onChange={(e) => setSelectedOctave(parseInt(e.target.value))}
                >
                  {[2, 3, 4, 5, 6, 7].map(oct => (
                    <option key={oct} value={oct}>{oct}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className={styles.controlGroup}>
              <label>
                Velocity: {velocity}
                <input
                  type="range"
                  min="1"
                  max="127"
                  value={velocity}
                  onChange={(e) => setVelocity(parseInt(e.target.value))}
                />
              </label>
            </div>

            <div className={styles.controlGroup}>
              <label>
                BPM: {bpm}
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={bpm}
                  onChange={(e) => setBpm(parseInt(e.target.value))}
                />
              </label>
            </div>
          </div>

          <div className={styles.actions}>
            <Button onClick={addElement}>
              Add {selectedElementType === MusicalElementType.NOTE ? 'Note' : 'Rest'}
            </Button>
            
            {selectedElementType === MusicalElementType.NOTE && (
              <Button onClick={playPreview} variant="secondary">
                Preview Note
              </Button>
            )}
            
            <Button onClick={clearSequence} variant="danger">
              Clear All
            </Button>
          </div>
        </div>

        <div className={styles.sequence}>
          <div className={styles.sequenceHeader}>
            <h3>Musical Sequence ({sequence.length} elements)</h3>
            <Button 
              onClick={playSequence} 
              disabled={sequence.length === 0 || isPlaying}
              variant="primary"
            >
              {isPlaying ? 'Playing...' : 'Play Sequence'}
            </Button>
          </div>

          <div className={styles.elementsList}>
            {sequence.length === 0 ? (
              <div className={styles.emptyMessage}>
                Add notes and rests to create your musical sequence
              </div>
            ) : (
              sequence.map((element, index) => (
                <div key={element.id} className={styles.element}>
                  <div className={styles.elementInfo}>
                    <div className={styles.elementSymbol}>
                      {isNote(element) 
                        ? getDurationSymbol(element.duration, element.dotted)
                        : getRestSymbol(element.restType, element.dotted)
                      }
                    </div>
                    <div className={styles.elementName}>
                      {getElementDisplayName(element)}
                    </div>
                    <div className={styles.elementDuration}>
                      {element.duration} {element.dotted ? '(dotted)' : ''}
                    </div>
                  </div>
                  <Button 
                    onClick={() => removeElement(index)} 
                    variant="danger" 
                    size="small"
                  >
                    ×
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.instructions}>
          <h3>How to Use:</h3>
          <ol>
            <li>Choose between <strong>Note</strong> or <strong>Rest</strong></li>
            <li>Select a <strong>duration</strong> (whole, half, quarter, eighth, sixteenth)</li>
            <li>For notes: pick pitch and octave</li>
            <li>For rests: they automatically match your duration</li>
            <li>Adjust velocity (volume) and tempo (BPM)</li>
            <li>Add elements to build your sequence</li>
            <li>Play to hear how rests create rhythm and phrasing</li>
          </ol>
          
          <div className={styles.tip}>
            💡 <strong>Tip:</strong> Try creating patterns like "note - rest - note - rest" 
            to hear how silence makes music more expressive!
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper function (should be in utils but included here for demo)
const getDurationInMs = (duration: NoteDuration, bpm: number, dotted: boolean = false): number => {
  const quarterNoteDuration = (60 / bpm) * 1000;
  
  let durationMs: number;
  
  switch (duration) {
    case NoteDuration.WHOLE:
      durationMs = quarterNoteDuration * 4;
      break;
    case NoteDuration.HALF:
      durationMs = quarterNoteDuration * 2;
      break;
    case NoteDuration.QUARTER:
      durationMs = quarterNoteDuration;
      break;
    case NoteDuration.EIGHTH:
      durationMs = quarterNoteDuration / 2;
      break;
    case NoteDuration.SIXTEENTH:
      durationMs = quarterNoteDuration / 4;
      break;
    default:
      durationMs = quarterNoteDuration;
  }
  
  if (dotted) {
    durationMs *= 1.5;
  }
  
  return durationMs;
};