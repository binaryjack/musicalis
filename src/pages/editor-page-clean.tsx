import { useEffect, useState, useRef } from 'react';
import { AddStaffButton } from '../components/atoms/add-staff-button';
import { BpmControl } from '../components/atoms/bpm-control';
import { ConfirmModal } from '../components/atoms/confirm-modal';
import { Dropdown } from '../components/atoms/dropdown';
import { TimeSignatureControl } from '../components/atoms/time-signature-control';
import type { MenuItem } from '../components/molecules/menu-bar';
import { MenuBar } from '../components/molecules/menu-bar';
import { TransportBar } from '../components/molecules/transport-bar';
import { MusicStaffCanvas } from '../widgets/music-staff-canvas';
import { useEditor } from '../features/editor/hooks/useEditor';
import { usePlayback } from '../hooks/usePlayback';
import { useProject } from '../hooks/useProject';
import {
  validateMeasureMatrix,
  reconstructBarNotes,
  createEmptyBar,
    getEffectiveTimeSignature,
    initializeStaff,
    parseTimeSignature
} from '../shared/utils/music-helpers';
import type { Note, MusicNote, NoteDuration, Staff } from '../types/musicTypes';
import { MIDI_INSTRUMENTS } from '../shared/utils/midi-instruments';

interface EditorPageProps {
  onSettings?: () => void;
}

export const EditorPage = ({ onSettings }: EditorPageProps) => {
  const { editorUI: { mode }, setMode } = useEditor();
  const project = useProject();
  const playback = usePlayback();
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [selectedRest, setSelectedRest] = useState<string>('');
  const [zoom, setZoom] = useState<number>(1.2);
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
  
  // Track selected note/rest for keyboard operations
  const [selectedElement, setSelectedElement] = useState<{staffId: string, barIndex: number, beatIndex: number, note: any} | null>(null);

  // Console Logs
  const [logs, setLogs] = useState<{id: string, message: string, type: 'error'|'warning'|'info', timestamp: Date}[]>([]);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);

  const addLog = (message: string, type: 'error' | 'warning' | 'info' = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substring(2, 11),
      message,
      type,
      timestamp: new Date()
    }, ...prev]);
  };

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

  const ToolboxButton = ({ active, onClick, icon, label, onContextMenu, children, className }: { active: boolean, onClick: () => void, icon: string, label: string, onContextMenu?: (e: React.MouseEvent) => void, children?: React.ReactNode, className?: string }) => (
    <button
      className={className}
      onClick={onClick}
      onContextMenu={onContextMenu}
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
        position: 'relative',
      }}
    >
      {icon}
      {children}
    </button>
  );

  const ToolCategorySelector = ({ 
    label, 
    options, 
    value, 
    active, 
    onChange 
  }: { 
    label: string, 
    options: { value: string, label: string, icon: string }[], 
    value: string, 
    active: boolean, 
    onChange: (val: string) => void 
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [lastSelected, setLastSelected] = useState(options[2] || options[0]); // default to ~quarter

    const currentOption = options.find(o => o.value === value);
    const displayOption = currentOption || lastSelected;

    useEffect(() => {
      if (currentOption) setLastSelected(currentOption);
    }, [currentOption]);

    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };
      if (isOpen) document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: isOpen ? 10 : 1 }}>
        <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '-4px' }}>{label}</div>
        
        <ToolboxButton
          active={active}
          onClick={() => {
            if (active) {
              setIsOpen(!isOpen);
            } else {
              onChange(displayOption.value);
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            setIsOpen(true);
          }}
          icon={displayOption.icon}
          label={`${displayOption.label} (Click active, or right-click, for more tools)`}
        >
          {/* Drawer indicator triangle */}
          <div style={{ 
            position: 'absolute', 
            bottom: '2px', 
            right: '2px', 
            width: 0, 
            height: 0, 
            borderStyle: 'solid', 
            borderWidth: '0 0 6px 6px', 
            borderColor: 'transparent transparent #888 transparent' 
          }} />
        </ToolboxButton>

        {isOpen && (
          <div style={{
            position: 'absolute',
            left: '100%',
            top: '16px',
            marginLeft: '8px',
            backgroundColor: '#2a2a2a',
            border: '1px solid #444',
            borderRadius: '4px',
            display: 'flex',
            flexDirection: 'row',
            padding: '4px',
            gap: '4px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
          }}>
            {options.map(opt => (
              <ToolboxButton
                key={opt.value}
                active={opt.value === value && active}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                icon={opt.icon}
                label={opt.label}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

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
        { id: 'settings', label: 'Settings', icon: '⚙️', action: () => onSettings?.() },
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
            if ((note as any).type !== 'rest') {
              allNotes.push({
                pitch: `${note.pitch}${note.octave}`,
                duration: note.duration,
                beatIndex: (bar.index * bar.beats.length) + beat.index + (note.subdivisionOffset || 0)
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
                  const remainingNotes = beat.notes.filter(note => note.id !== noteId);
                  return { ...beat, notes: remainingNotes };
                }
                return beat;
              });
              const timeSig = getEffectiveTimeSignature(bar, staff, defaultTimeSignature);
              return reconstructBarNotes({ ...bar, beats: updatedBeats }, timeSig);
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
          let noteToMove = null as unknown as Note;
          
          // First pass: find and remove the note without manually adding rests
          const tempBars = staff.bars.map((bar, bIdx) => {
            if (bIdx === sourceBarIndex) {
              const tempBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === sourceBeatIndex) {
                  const targetNote = beat.notes.find(n => n.id === noteId);
                  if (targetNote) noteToMove = targetNote;
                  
                  const remainingNotes = beat.notes.filter(n => n.id !== noteId);
                  return { ...beat, notes: remainingNotes };
                }
                return beat;
              });
              return { ...bar, beats: tempBeats };
            }
            return bar;
          });

          if (!noteToMove) return staff;
          
          // Validate the target location matrix before accepting the move
          const targetBar = tempBars[targetBarIndex];
          if (targetBar) {
            const timeSig = getEffectiveTimeSignature(targetBar, staff, defaultTimeSignature);
            if (!validateMeasureMatrix(targetBar, { beatIndex: Math.floor(targetBeatIndex), subdivisionOffset: targetBeatIndex - Math.floor(targetBeatIndex), duration: noteToMove.duration }, timeSig)) {
              addLog(`Move rejected: Matrix bounds or overlap check failed.`, 'warning');
              return staff; // Cancel move
            }
          }

          // Play preview if note pitch changed noticeably
          if (noteToMove.pitch !== pitch || noteToMove.octave !== octave) {
            try {
              if (playback && typeof playback.playNote === 'function' && pitch !== 'R') {
                playback.playNote(`${pitch}${octave}` as MusicNote, noteToMove.duration);
              }
            } catch (e) {
              console.warn("Could not play note preview", e);
            }
          }

          // Update the note's position, pitch and octave, and morph rest -> note if dragged to a pitch
          const updatedNote = { 
            ...noteToMove, 
            pitch, 
            octave, 
            type: pitch === 'R' ? 'rest' : 'note',
            velocity: pitch === 'R' ? 0 : 0.8,
            beatIndex: Math.floor(targetBeatIndex),
            subdivisionOffset: targetBeatIndex - Math.floor(targetBeatIndex)
          };

          // Second pass: add note to target location and run reconstruct matrix
          const finalBars = tempBars.map((bar, bIdx) => {
            // Need to reconstruct if it's the source OR the target bar
            if (bIdx === targetBarIndex || bIdx === sourceBarIndex) {
              let finalBeats = bar.beats;
              if (bIdx === targetBarIndex) {
                finalBeats = bar.beats.map((beat, btIdx) => {
                  if (btIdx === Math.floor(targetBeatIndex)) {
                    return { ...beat, notes: [...beat.notes, updatedNote] };
                  }
                  return beat;
                });
              }
              const timeSig = getEffectiveTimeSignature(bar, staff, defaultTimeSignature);
              return reconstructBarNotes({ ...bar, beats: finalBeats }, timeSig);
            }
            return bar;
          });

          return { ...staff, bars: finalBars };
        }
        return staff;
      })
    );
  };

  const handleAddNote = (staffId: string, barIndex: number, rawBeatIndex: number, pitch: string, octave: number, duration: NoteDuration) => {
    // Extract base beatIndex and subdivision offset from the raw canvas drop coordinates
    const beatIndex = Math.floor(rawBeatIndex);
    const subdivisionOffset = rawBeatIndex - beatIndex;

    // Check constraints first before adding
    const currentStaff = staffs.find(s => s.id === staffId);
    if (currentStaff) {
      const bar = currentStaff.bars[barIndex];
      if (bar) {
        const timeSig = getEffectiveTimeSignature(bar, currentStaff, defaultTimeSignature);
        
        if (!validateMeasureMatrix(bar, { beatIndex, subdivisionOffset, duration }, timeSig)) {
          const msg = `Cannot fit ${duration} note at beat ${beatIndex + 1} (offset +${subdivisionOffset}) in ${timeSig.display} measure. It would exceed bounds or collide with an existing element via matrix check.`;
          console.warn(msg);
          addLog(msg, 'warning');
          setIsConsoleOpen(true);
          return; // Block addition
        }
      }
    }

    // Play preview automatically
    try {
      if (playback && typeof playback.playNote === 'function' && !selectedRest) {
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
              const timeSig = getEffectiveTimeSignature(bar, staff, defaultTimeSignature);
              const updatedBeats = bar.beats.map((beat, btIdx) => {
                if (btIdx === beatIndex) {
                  // Add note (or rest) to this beat
                  const isRest = !!selectedRest;
                  const newNote = {
                    id: `${isRest ? 'rest' : 'note'}-${Date.now()}-${Math.random()}`,
                    type: isRest ? 'rest' : 'note',
                    pitch: isRest ? 'R' : pitch,
                    octave: isRest ? 0 : octave,
                    duration,
                    beatIndex,
                    subdivisionOffset,
                    visualOffsetX: 0,
                    visualOffsetY: 0,
                    velocity: isRest ? 0 : 0.8,
                  };
                  return {
                    ...beat,
                    notes: [...beat.notes, newNote as any]
                  };
                }
                return beat;
              });

              const updatedBar = { ...bar, beats: updatedBeats };
              return reconstructBarNotes(updatedBar, timeSig);
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
              const timeSig = getEffectiveTimeSignature(bar, staff, defaultTimeSignature);
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

              const updatedBar = { ...bar, beats: updatedBeats };
              return reconstructBarNotes(updatedBar, timeSig);
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

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      
      if (!selectedElement) return;

      const { staffId, barIndex, beatIndex, note } = selectedElement;

      // Delete/Backspace to remove note/rest
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const staff = staffs.find(s => s.id === staffId);
        if (staff) {
          // If we delete an actual note, it replaces with a rest for deletion integrity.
          // Since the user is explicitly deleting using a key, use the same logic.
          handleRemoveNote(staffId, barIndex, beatIndex, note.id);
          setSelectedElement(null);
        }
      } else if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 't') {
        // Toggle rest/note
        e.preventDefault();
        const isCurrentlyRest = note.type === 'rest' || note.pitch === 'R';
        
        setStaffs(prevStaffs => 
          prevStaffs.map(staff => {
            if (staff.id === staffId) {
              const updatedBars = staff.bars.map((bar, bIdx) => {
                if (bIdx === barIndex) {
                  const updatedBeats = bar.beats.map((beat, btIdx) => {
                    if (btIdx === beatIndex) {
                      const updatedNotes = beat.notes.map(n => {
                        if (n.id === note.id) {
                          const newType = isCurrentlyRest ? 'note' : 'rest';
                          return {
                            ...n,
                            type: newType,
                            pitch: isCurrentlyRest ? 'C' : 'R', // Default to middle C if becoming a note
                            octave: isCurrentlyRest ? 5 : 0,
                            velocity: isCurrentlyRest ? 0.8 : 0,
                          } as any;
                        }
                        return n;
                      });
                      return { ...beat, notes: updatedNotes };
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
        setSelectedElement(null);
      }
    };
    
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => document.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedElement, staffs]);

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
          overflow: 'visible',
          zIndex: 50
        }}>
          <ToolCategorySelector
            label="Notes"
            options={noteOptions}
            value={selectedDuration}
            active={selectedRest === ''}
            onChange={(val) => {
              setSelectedDuration(val as NoteDuration);
              setSelectedRest('');
            }}
          />

          <div style={{ width: '30px', height: '1px', backgroundColor: '#444' }} />

          <ToolCategorySelector
            label="Rests"
            options={restOptions}
            value={selectedRest}
            active={selectedRest !== ''}
            onChange={(val) => {
              setSelectedRest(val);
              const noteValue = val.replace('-rest', '') as NoteDuration;
              setSelectedDuration(noteValue);
            }}
          />
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
            const barWidth = 280;
            const finalBarX = barStartX + (staff.bars.length * barWidth) + 60; // Extra space for buttons
            const canvasWidth = Math.max(800, finalBarX);

            return (
              <MusicStaffCanvas
                key={staff.id}
                staff={staff}
                zoom={zoom}
                playheadPosition={cursorPosition}
                darkMode={true}
                selectedDuration={selectedDuration}
                selectedRest={selectedRest}
                mode={mode}
                selectedElementId={selectedElement?.note.id || null}
                onSelectNote={(note) => setSelectedElement(note ? {staffId: staff.id, barIndex: note.barIndex, beatIndex: note.beatIndex, note: note.note} : null)}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '16px' }}>
          <span title="Zoom">🔍</span>
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
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
      
      {/* BOTTOM CONSOLE LOGS */}
      <div style={{
        position: 'relative',
        backgroundColor: '#111',
        borderTop: '1px solid #444',
        display: 'flex',
        flexDirection: 'column',
        height: isConsoleOpen ? '200px' : '30px',
        transition: 'height 0.2s ease',
        zIndex: 100,
      }}>
        {/* Console Header / Toggle */}
        <div 
          onClick={() => setIsConsoleOpen(!isConsoleOpen)}
          style={{
            height: '30px',
            minHeight: '30px',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            cursor: 'pointer',
            backgroundColor: '#222',
            borderBottom: isConsoleOpen ? '1px solid #444' : 'none',
            fontSize: '12px',
            userSelect: 'none',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ transform: isConsoleOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s', display: 'inline-block' }}>▶</span>
            <span style={{ fontWeight: 'bold' }}>Console / Rules Log</span>
            {logs.length > 0 && (
              <span style={{ 
                backgroundColor: logs[0].type === 'error' ? '#cc0000' : logs[0].type === 'warning' ? '#cc8800' : '#4a9eff', 
                color: '#fff', 
                padding: '2px 6px', 
                borderRadius: '10px',
                fontSize: '10px'
              }}>
                {logs.length}
              </span>
            )}
          </div>
          <button 
            onClick={(e) => { e.stopPropagation(); setLogs([]); setIsConsoleOpen(false); }}
            style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '10px' }}
          >
            Clear
          </button>
        </div>

        {/* Console Body */}
        {isConsoleOpen && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
            {logs.length === 0 ? (
              <div style={{ color: '#666', padding: '0 16px', fontSize: '12px', fontStyle: 'italic' }}>No logs to display.</div>
            ) : (
              logs.map(log => (
                <div key={log.id} style={{
                  padding: '4px 16px',
                  borderBottom: '1px solid #2a2a2a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  fontSize: '13px',
                  color: log.type === 'error' ? '#ff6b6b' : log.type === 'warning' ? '#ffc107' : '#4a9eff',
                  backgroundColor: log.type === 'error' ? 'rgba(255, 0, 0, 0.05)' : log.type === 'warning' ? 'rgba(255, 193, 7, 0.05)' : 'transparent',
                }}>
                  <div style={{ width: '60px', flexShrink: 0, color: '#666', fontSize: '11px', marginTop: '2px' }}>
                    {log.timestamp.toLocaleTimeString([], { hour12: false })}
                  </div>
                  <div>
                    <strong>[{log.type.toUpperCase()}]</strong> {log.message}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
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