import { useEffect, useState } from 'react';
import { AddStaffButton } from '../components/atoms/add-staff-button';
import { BpmControl } from '../components/atoms/bpm-control';
import { ConfirmModal } from '../components/atoms/confirm-modal';
import { Dropdown } from '../components/atoms/dropdown';
import { TimeSignatureControl } from '../components/atoms/time-signature-control';
import type { MenuItem } from '../components/molecules/menu-bar';
import { MenuBar } from '../components/molecules/menu-bar';
import { TransportBar } from '../components/molecules/transport-bar';
import { MusicStaffCanvas } from '../components/organisms/music-staff-canvas';
import { useEditor } from '../features/editor/hooks/useEditor';
import { usePlayback } from '../hooks/usePlayback';
import { useProject } from '../hooks/useProject';
import {
    createEmptyBar,
    initializeStaff,
    parseTimeSignature
} from '../shared/utils/music-helpers';
import type { MusicNote, NoteDuration, Staff } from '../types/musicTypes';
import { MusicalElementType } from '../types';

import { MIDI_INSTRUMENTS } from '../shared/utils/midi-instruments';

export const EditorPage = () => {
  const { editorUI: { mode }, setMode } = useEditor();
  const project = useProject();
  const playback = usePlayback();
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [selectedRest, setSelectedRest] = useState<string>('');
  const [bpm, setBpm] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [videoResolution, setVideoResolution] = useState<string>('1080p');
  const [audioQuality, setAudioQuality] = useState<string>('high');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const defaultTimeSignature = parseTimeSignature('4/4');
  const [staffs, setStaffs] = useState<Staff[]>([
    initializeStaff({
      id: 'staff-1',
      name: 'Piano Staff 1',
      clef: 'treble',
      keySignature: 'C',
      instrument: 'piano',
    }, defaultTimeSignature, 1)
  ]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('staff-1');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [barToDelete, setBarToDelete] = useState<{staffId: string, barIndex: number} | null>(null);

  // Initialize time signature from first staff
  useEffect(() => {
    const firstStaff = staffs[0];
    if (firstStaff?.timeSignature) {
      const display = firstStaff.timeSignature.display;
      if (display && display !== timeSignature) {
        // Use setTimeout to avoid setState in render
        setTimeout(() => setTimeSignature(display), 0);
      }
    }
  }, [staffs]); // Removed timeSignature to avoid infinite loop

  const noteOptions = [
    { value: 'whole', label: 'Whole', icon: '𝅝' },
    { value: 'half', label: 'Half', icon: '𝅗𝅥' },
    { value: 'quarter', label: 'Quarter', icon: '♩' },
    { value: 'eighth', label: 'Eighth', icon: '♪' },
    { value: 'sixteenth', label: '16th', icon: '𝅘𝅥𝅯' },
  ];

  const restOptions = [
    { value: 'whole-rest', label: 'Whole', icon: '𝄻' },
    { value: 'half-rest', label: 'Half', icon: '𝄼' },
    { value: 'quarter-rest', label: 'Quarter', icon: '𝄽' },
    { value: 'eighth-rest', label: 'Eighth', icon: '𝄾' },
    { value: 'sixteenth-rest', label: '16th', icon: '𝄿' },
  ];

  const ToolboxButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) => (
    <button
      onClick={onClick}
      title={label}
      style={{
        width: '32px',
        height: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: active ? '#4a9eff' : '#333',
        color: active ? '#fff' : '#ccc',
        border: '1px solid',
        borderColor: active ? '#2d88ff' : '#444',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '18px',
        padding: 0,
        boxShadow: active ? '0 0 0 2px rgba(74, 158, 255, 0.3)' : 'none',
        transition: 'all 0.1s ease',
      }}
    >
      {icon}
    </button>
  );

  const videoOptions = [
    { value: '720p', label: '720p HD', icon: '📺' },
    { value: '1080p', label: '1080p Full HD', icon: '🎥' },
    { value: '4k', label: '4K Ultra HD', icon: '🎬' },
    { value: '8k', label: '8K', icon: '📽️' },
  ];

  const audioOptions = [
    { value: 'low', label: 'Low Quality (22kHz)', icon: '🔈' },
    { value: 'medium', label: 'Medium Quality (44.1kHz)', icon: '🔉' },
    { value: 'high', label: 'High Quality (48kHz)', icon: '🔊' },
    { value: 'studio', label: 'Studio Quality (96kHz)', icon: '🎛️' },
  ];

  const menuConfig: MenuItem[] = [
    {
      id: 'file',
      label: 'File',
      icon: '📁',
      submenu: [
        { id: 'new', label: 'New', icon: '📄', action: () => console.log('New file') },
        { id: 'save', label: 'Save', icon: '💾', action: () => project.saveProject() },
        { id: 'load', label: 'Load', icon: '📂', action: () => console.log('Load file') },
        { id: 'sep1', label: '', separator: true },
        { id: 'settings', label: 'Settings', icon: '⚙️', action: () => console.log('Settings') },
      ]
    },
    {
      id: 'tools',
      label: 'Tools',
      icon: '🔧',
      submenu: [
        { id: 'colors', label: 'Note Color Scheme', icon: '🎨', action: () => console.log('Color scheme') },
      ]
    },
    {
      id: 'help',
      label: 'Help',
      icon: '❓',
      submenu: [
        { id: 'about', label: 'About', icon: 'ℹ️', action: () => alert('Musicalist Editor v1.0') },
      ]
    }
  ];

  // Initialize default project
  useEffect(() => {
    if (!project.currentProject && !project.isLoading) {
      project.createProject('New Composition');
    }
  }, [project]);

  // Sync playback position with cursor during playback
  useEffect(() => {
    if (playback.isPlaying) {
      let animationFrameId: number;
      
      // Calculate total beats in all staffs
      let maxBeats = 0;
      staffs.forEach(staff => {
        const beatsPerBar = staff.bars[0]?.beats.length || 4;
        const totalBeats = staff.bars.length * beatsPerBar;
        maxBeats = Math.max(maxBeats, totalBeats);
      });
      
      const updatePosition = () => {
        const currentTime = playback.currentTime;
        // Convert time (in seconds) to beat position based on BPM
        // At 120 BPM: 2 beats per second, at 60 BPM: 1 beat per second
        const beatsPerSecond = bpm / 60;
        const currentBeat = currentTime * beatsPerSecond;
        
        // Stop playback if we've reached the end
        if (currentBeat >= maxBeats) {
          playback.stop();
          setCursorPosition(maxBeats);
          return;
        }
        
        setCursorPosition(currentBeat);
        
        if (playback.isPlaying) {
          animationFrameId = requestAnimationFrame(updatePosition);
        }
      };
      
      animationFrameId = requestAnimationFrame(updatePosition);

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
  }, [playback, bpm, staffs]);

  // Load notes from staffs into playback system
  useEffect(() => {
    const allNotes: { pitch: string; duration: string; beatIndex: number }[] = [];
    staffs.forEach(staff => {
      staff.bars.forEach(bar => {
        bar.beats.forEach(beat => {
          beat.notes.forEach(note => {
            if ((note as Record<string, unknown>).type !== 'rest') {
              allNotes.push({
                pitch: `${note.pitch}${note.octave}`,
                duration: note.duration,
                beatIndex: bar.index * bar.beats.length + beat.index
              });
            }
          });
        });
      });
    });
    
    // Sort by beatIndex
    allNotes.sort((a, b) => a.beatIndex - b.beatIndex);
    
    playback.loadNotes(allNotes.map(n => ({
      pitch: n.pitch as MusicNote,
      duration: n.duration as NoteDuration,
      beatIndex: n.beatIndex
    })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffs]);

  const handleAddStaff = () => {
    const newStaffId = `staff-${staffs.length + 1}`;
    const newStaff = initializeStaff({
      id: newStaffId,
      name: `Piano Staff ${staffs.length + 1}`,
      clef: 'treble',
      keySignature: 'C',
      instrument: 'piano',
    }, defaultTimeSignature, 1);
    setStaffs([...staffs, newStaff]);
    setSelectedStaffId(newStaffId);
  };

  const handleBpmChange = (newBpm: number) => {
    setBpm(newBpm);
    playback.setTempo(newBpm);
    if (project.currentProject) {
      project.updateTempo(newBpm);
    }
  };

  const handleTimeSignatureChange = (newTimeSignature: string) => {
    setTimeSignature(newTimeSignature);
    const parsedTimeSig = parseTimeSignature(newTimeSignature);
    
    // Update all staffs with new time signature and recreate bars with correct beat count
    setStaffs(prevStaffs => 
      prevStaffs.map(staff => {
        // Recreate each bar with the new number of beats
        const updatedBars = staff.bars.map((_bar, index) => {
          // Create new bar with correct beat count based on new time signature
          return createEmptyBar(index, parsedTimeSig);
        });
        
        return {
          ...staff,
          timeSignature: parsedTimeSig,
          bars: updatedBars
        };
      })
    );
  };

  const handleGoToStart = () => {
    setCursorPosition(0);
    playback.seek(0);
  };

  const handleStepBackward = () => {
    const newPos = Math.max(0, cursorPosition - 0.25); // Quarter beat steps
    setCursorPosition(newPos);
    playback.seek(newPos);
  };

  const handleStepForward = () => {
    const newPos = cursorPosition + 0.25; // Quarter beat steps
    setCursorPosition(newPos);
    playback.seek(newPos);
  };

  const handleGoToEnd = () => {
    let maxBeats = 0;
    staffs.forEach(staff => {
      const totalBeats = staff.bars.length * (staff.bars[0]?.beats.length || 4);
      maxBeats = Math.max(maxBeats, totalBeats);
    });
    const endPos = Math.max(maxBeats, 4);
    setCursorPosition(endPos);
    playback.seek(endPos);
  };

  const handleAddBar = (staffId: string, afterBarIndex: number) => {
    console.log('Adding bar after index', afterBarIndex, 'for staff', staffId);
    setStaffs(prevStaffs => 
      prevStaffs.map(staff => {
        if (staff.id === staffId) {
          const timeSignature = staff.timeSignature || defaultTimeSignature;
          const newBarIndex = staff.bars.length;
          const newBar = createEmptyBar(newBarIndex, timeSignature);
          
          return {
            ...staff,
            bars: [...staff.bars, newBar]
          };
        }
        return staff;
      })
    );
  };

  const handleRemoveBar = (staffId: string, barIndex: number) => {
    console.log('Remove bar requested for staff', staffId, 'bar', barIndex);
    // Show confirmation modal
    setBarToDelete({ staffId, barIndex });
    setShowDeleteModal(true);
  };

  const confirmDeleteBar = () => {
    if (barToDelete) {
      console.log('Confirming delete bar', barToDelete.barIndex, 'from staff', barToDelete.staffId);
      setStaffs(prevStaffs => 
        prevStaffs.map(staff => {
          if (staff.id === barToDelete.staffId && staff.bars.length > 1) {
            // Remove the last bar and reindex remaining bars
            const updatedBars = staff.bars.slice(0, -1).map((bar, index) => ({
              ...bar,
              index
            }));
            return {
              ...staff,
              bars: updatedBars
            };
          }
          return staff;
        })
      );
    }
    setBarToDelete(null);
    setShowDeleteModal(false);
  };

  const cancelDeleteBar = () => {
    setBarToDelete(null);
    setShowDeleteModal(false);
  };

  const handlePlayheadChange = (position: number) => {
    setCursorPosition(position);
    playback.seek(position);
  };

  const handleRemoveNote = (staffId: string, barIndex: number, beatIndex: number, noteId: string) => {
    setStaffs(prevStaffs => 
      prevStaffs.map(staff => {
        if (staff.id === staffId) {
          const updatedBars = staff.bars.map((bar, bIdx) => {
            if (bIdx === barIndex) {
              const updatedBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === beatIndex) {
                  return {
                    ...beat,
                    notes: beat.notes.filter(note => note.id !== noteId)
                  };
                }
                return beat;
              });
              return { ...bar, beats: updatedBeats };
            }
            return bar;
          });
          return { ...staff, bars: updatedBars };
        }
        return staff;
      })
    );
  };

  const handleMoveNote = (
    staffId: string, 
    sourceBarIndex: number, 
    sourceBeatIndex: number, 
    noteId: string, 
    targetBarIndex: number, 
    targetBeatIndex: number, 
    pitch: string, 
    octave: number
  ) => {
    setStaffs(prevStaffs => 
      prevStaffs.map(staff => {
        if (staff.id === staffId) {
          let noteToMove: Note | null = null;
          
          // First pass: find and remove the note
          const tempBars = staff.bars.map((bar, bIdx) => {
            if (bIdx === sourceBarIndex) {
              const tempBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === sourceBeatIndex) {
                  noteToMove = beat.notes.find(n => n.id === noteId);
                  return {
                    ...beat,
                    notes: beat.notes.filter(n => n.id !== noteId)
                  };
                }
                return beat;
              });
              return { ...bar, beats: tempBeats };
            }
            return bar;
          });

          if (!noteToMove) return staff;
          
          // Play preview if note pitch changed noticeably
          if (noteToMove.pitch !== pitch || noteToMove.octave !== octave) {
            try {
              if (playback && typeof playback.playNote === 'function') {
                playback.playNote(`${pitch}${octave}` as MusicNote, noteToMove.duration);
              }
            } catch (e) {
              console.warn("Could not play note preview", e);
            }
          }

          // Update the note's pitch and octave
          const updatedNote = { ...noteToMove, pitch, octave };

          // Second pass: add note to target location
          const finalBars = tempBars.map((bar, bIdx) => {
            if (bIdx === targetBarIndex) {
              const finalBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === targetBeatIndex) {
                  return {
                    ...beat,
                    notes: [...beat.notes, updatedNote]
                  };
                }
                return beat;
              });
              return { ...bar, beats: finalBeats };
            }
            return bar;
          });

          return { ...staff, bars: finalBars };
        }
        return staff;
      })
    );
  };

  const handleAddNote = (staffId: string, barIndex: number, beatIndex: number, pitch: string, octave: number, duration: NoteDuration) => {
    // Play preview automatically
    try {
      if (playback && typeof playback.playNote === 'function') {
        playback.playNote(`${pitch}${octave}` as MusicNote, duration);
      }
    } catch (e) {
      console.warn("Could not play note preview", e);
    }

    setStaffs(prevStaffs =>
      prevStaffs.map(staff => {
        if (staff.id === staffId) {
          const updatedBars = staff.bars.map((bar, bIdx) => {
            if (bIdx === barIndex) {
              const updatedBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === beatIndex) {
                  // Add note to this beat
                  const newNote = {
                    id: `note-${Date.now()}-${Math.random()}`,
                    pitch,
                    octave,
                    duration,
                    beatIndex,
                    subdivisionOffset: 0,
                    visualOffsetX: 0,
                    visualOffsetY: 0,
                    velocity: 0.8,
                  };
                  return {
                    ...beat,
                    notes: [...beat.notes, newNote]
                  };
                }
                return beat;
              });
              return {
                ...bar,
                beats: updatedBeats
              };
            }
            return bar;
          });
          return {
            ...staff,
            bars: updatedBars
          };
        }
        return staff;
      })
    );
  };

  const handleAddRest = (staffId: string, barIndex: number, beatIndex: number, duration: NoteDuration) => {
    setStaffs(prevStaffs =>
      prevStaffs.map(staff => {
        if (staff.id === staffId) {
          const updatedBars = staff.bars.map((bar, bIdx) => {
            if (bIdx === barIndex) {
              const updatedBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === beatIndex) {
                  const newRest = {
                    id: `rest-${Date.now()}-${Math.random()}`,
                    type: 'rest',
                    duration,
                    beatIndex,
                    subdivisionOffset: 0,
                    visualOffsetX: 0,
                    visualOffsetY: 0,
                    pitch: 'R',
                    octave: 0,
                    velocity: 0,
                  };
                  return {
                    ...beat,
                    notes: [...beat.notes, newRest as unknown as typeof beat.notes[0]]
                  };
                }
                return beat;
              });
              return {
                ...bar,
                beats: updatedBeats
              };
            }
            return bar;
          });
          return {
            ...staff,
            bars: updatedBars
          };
        }
        return staff;
      })
    );
  };

  if (project.isLoading) {
    return <div style={{color: '#fff', padding: '20px'}}>Loading project...</div>;
  }
  
  if (project.error) {
    return <div style={{color: '#ff6b6b', padding: '20px'}}>Error: {project.error}</div>;
  }
  
  if (!project.currentProject) {
    return <div style={{color: '#fff', padding: '20px'}}>No project loaded...</div>;
  }

  return (
    <div style={{
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: '#f0f0f0',
      fontFamily: 'system-ui, sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden',
      position: 'fixed',
      top: 0,
      left: 0
    }}>
      {/* HEADER */}
      <div style={{
        height: '60px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #444',
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        flexShrink: 0
      }}>
        <MenuBar items={menuConfig} />
        
        <h1 style={{
          margin: '0 16px',
          fontSize: '18px',
          fontWeight: 'bold',
          color: '#f0f0f0',
          flexGrow: 1
        }}>
          🎵 {project.currentProject?.name || 'Musicalist Editor'}
        </h1>
        
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Dropdown
            options={MIDI_INSTRUMENTS}
            value={playback.instrumentName}
            onChange={(val) => playback.setInstrument(val)}
            placeholder="Select Instrument"
          />

          <Dropdown
            options={videoOptions}
            value={videoResolution}
            onChange={setVideoResolution}
            placeholder="Video Quality"
          />
          
          <Dropdown
            options={audioOptions}
            value={audioQuality}
            onChange={setAudioQuality}
            placeholder="Audio Quality"
          />
          
          <AddStaffButton onClick={handleAddStaff} />
          
          <button 
            onClick={() => setMode(mode === 'design' ? 'playback' : 'design')}
            style={{
              padding: '6px 12px',
              backgroundColor: mode === 'design' ? '#28a745' : '#4a9eff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            {mode === 'design' ? '✏️ Design' : '👁️ View'}
          </button>
        </div>
      </div>

      {/* MIDDLE CONTAINER */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'row',
        overflow: 'hidden'
      }}>
        {/* SIDEBAR TOOLBAR */}
        <div style={{
          width: '50px',
          backgroundColor: '#222',
          borderRight: '1px solid #444',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '16px 0',
          gap: '16px',
          overflowY: 'auto'
        }}>
          {/* Notes Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</div>
            {noteOptions.map(opt => (
              <ToolboxButton
                key={opt.value}
                active={selectedDuration === opt.value}
                onClick={() => {
                  setSelectedDuration(opt.value as NoteDuration);
                  setSelectedRest(''); // clear rest selection when note is selected
                }}
                icon={opt.icon}
                label={opt.label + ' Note'}
              />
            ))}
          </div>

          <div style={{ width: '30px', height: '1px', backgroundColor: '#444' }} />

          {/* Rests Selection */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
            <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '4px' }}>Rests</div>
            {restOptions.map(opt => (
              <ToolboxButton
                key={opt.value}
                active={selectedRest === opt.value}
                onClick={() => {
                  setSelectedRest(opt.value);
                  // Update duration to match the rest size so they take correct space
                  const noteValue = opt.value.replace('-rest', '') as NoteDuration;
                  setSelectedDuration(noteValue);
                }}
                icon={opt.icon}
                label={opt.label + ' Rest'}
              />
            ))}
          </div>
        </div>

        {/* MAIN CANVAS AREA */}
        <div style={{
          flex: 1,
          backgroundColor: '#151515',
          padding: '16px',
          overflow: 'auto'
        }}>
          <div style={{
            backgroundColor: '#222',
            borderRadius: '6px',
            padding: '0',
            height: 'calc(100% - 40px)',
            border: '1px solid #333',
            overflowX: 'auto',
            overflowY: 'auto'
          }}>
            <h2 style={{ margin: '0 0 8px 0', color: '#f0f0f0', fontSize: '16px', padding: '10px' }}>
              Staff Editor - Mode: {mode} - Selected: {selectedStaffId}
            </h2>
          {staffs.map(staff => {
            // Calculate canvas width based on number of bars
            const barStartX = 130;
            const finalBarX = barStartX + (staff.bars.length * 200) + 60; // barWidth=200 + extra space for buttons
            const canvasWidth = Math.max(800, finalBarX);
            
            return (
              <MusicStaffCanvas
                key={staff.id}
                staff={staff}
                playheadPosition={cursorPosition}
                darkMode={true}
                selectedTool={{
                  type: selectedRest ? MusicalElementType.REST : MusicalElementType.NOTE,
                  duration: selectedDuration as never
                }}
                selectedDuration={selectedDuration}
                selectedRest={selectedRest}
                mode={mode}
                onAddBar={handleAddBar}
                onRemoveBar={handleRemoveBar}
                onPlayheadChange={handlePlayheadChange}
                onAddNote={handleAddNote}
                onAddRest={handleAddRest}
                onRemoveNote={handleRemoveNote}
                onMoveNote={handleMoveNote}
                width={canvasWidth}
                height={200}
              />
            );
          })}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{
        height: '60px',
        backgroundColor: '#2d2d2d',
        borderTop: '1px solid #444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        gap: '16px',
        padding: '0 16px',
        flexShrink: 0
      }}>
        <TimeSignatureControl
          timeSignature={timeSignature}
          onChange={handleTimeSignatureChange}
        />
        
        <TransportBar
          isPlaying={playback.isPlaying}
          currentPosition={Math.floor(cursorPosition * 100) / 100} // Round to 2 decimal places
          duration={Math.max(playback.duration, 8)} // At least 8 beats duration
          onGoToStart={handleGoToStart}
          onStepBackward={handleStepBackward}
          onPlay={playback.play}
          onPause={playback.pause}
          onStop={playback.stop}
          onStepForward={handleStepForward}
          onGoToEnd={handleGoToEnd}
        />
        
        <BpmControl
          bpm={bpm}
          onChange={handleBpmChange}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
          <span title="Volume">🔊</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={playback.volume}
            onChange={(e) => playback.setVolume(parseFloat(e.target.value))}
            style={{ width: '80px', cursor: 'pointer' }}
          />
        </div>

        <div style={{
          backgroundColor: '#444',
          border: '1px solid #666',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
          color: '#f0f0f0',
          minWidth: '80px',
          textAlign: 'center',
          height: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {cursorPosition}
        </div>
        
        <span style={{ fontSize: '12px', color: '#ccc', marginLeft: 'auto' }}>
          Notes: {project.currentProject?.notes?.length || 0} | Staffs: {staffs.length} | Mode: {mode}
        </span>
      </div>
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteBar}
        onConfirm={confirmDeleteBar}
        title="Delete Bar"
        message={`Are you sure you want to delete bar ${(barToDelete?.barIndex || 0) + 1}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonColor="#dc3545"
      />
    </div>
  );
};