import { useEffect, useState } from 'react';
import { useEditor } from '../features/editor/hooks/useEditor';
import { useProject } from '../hooks/useProject';
import { usePlayback } from '../hooks/usePlayback';
import { musicNote, noteDuration } from '../types/musicTypes';
import { Dropdown } from '../components/atoms/dropdown';
import { BpmControl } from '../components/atoms/bpm-control';
import { AddStaffButton } from '../components/atoms/add-staff-button';
import { TimeSignatureControl } from '../components/atoms/time-signature-control';
import { ConfirmModal } from '../components/atoms/confirm-modal';
import { MenuBar } from '../components/molecules/menu-bar';
import { TransportBar } from '../components/molecules/transport-bar';
import { MultiStaffCanvas } from '../components/organisms/multi-staff-canvas';
import type { NoteDuration, PianoStaff } from '../types/musicTypes';
import type { MenuItem } from '../components/molecules/menu-bar';

export const EditorPage = () => {
  const { editorUI: { mode }, setMode } = useEditor();
  const project = useProject();
  const playback = usePlayback();
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [selectedRest, setSelectedRest] = useState<string>('quarter-rest');
  const [bpm, setBpm] = useState<number>(120);
  const [timeSignature, setTimeSignature] = useState<string>('4/4');
  const [videoResolution, setVideoResolution] = useState<string>('1080p');
  const [audioQuality, setAudioQuality] = useState<string>('high');
  const [cursorPosition, setCursorPosition] = useState<number>(0);
  const [staffs, setStaffs] = useState<PianoStaff[]>([
    {
      id: 'staff-1',
      name: 'Piano Staff 1',
      clef: 'treble',
      keySignature: 'C',
      timeSignature: '4/4',
      notes: [],
      colorMapping: { id: 'default', name: 'Default', colors: [] },
      visible: true,
      muted: false,
      volume: 0.8,
      instrument: 'piano',
      measuresCount: 4 // Start with 4 measures
    }
  ]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('staff-1');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [barToDelete, setBarToDelete] = useState<{staffId: string, barIndex: number} | null>(null);

  // Initialize time signature from first staff
  useEffect(() => {
    if (staffs.length > 0 && staffs[0].timeSignature !== timeSignature) {
      setTimeSignature(staffs[0].timeSignature);
    }
  }, [staffs, timeSignature]);

  const noteOptions = [
    { value: 'whole', label: 'Whole Note', icon: '𝅝' },
    { value: 'half', label: 'Half Note', icon: '𝅗𝅥' },
    { value: 'quarter', label: 'Quarter Note', icon: '♩' },
    { value: 'eighth', label: 'Eighth Note', icon: '♪' },
    { value: 'sixteenth', label: 'Sixteenth Note', icon: '𝅘𝅥𝅯' },
    { value: 'thirty-second', label: 'Thirty-second Note', icon: '𝅘𝅥𝅰' },
  ];

  const restOptions = [
    { value: 'whole-rest', label: 'Whole Rest', icon: '𝄻' },
    { value: 'half-rest', label: 'Half Rest', icon: '𝄼' },
    { value: 'quarter-rest', label: 'Quarter Rest', icon: '𝄽' },
    { value: 'eighth-rest', label: 'Eighth Rest', icon: '𝄾' },
    { value: 'sixteenth-rest', label: 'Sixteenth Rest', icon: '𝄿' },
    { value: 'thirty-second-rest', label: 'Thirty-second Rest', icon: '𝅀' },
  ];

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
      project.createProject('New Composition').then(() => {
        const initialNotes = [
          { pitch: musicNote.C4, duration: noteDuration.quarter, position: 0, velocity: 0.7 },
          { pitch: musicNote.D4, duration: noteDuration.quarter, position: 1, velocity: 0.7 },
          { pitch: musicNote.E4, duration: noteDuration.half, position: 2, velocity: 0.7 },
        ];
        initialNotes.forEach(note => project.addNote(note));
      });
    }
  }, [project]);

  // Sync playback position with cursor during playback
  useEffect(() => {
    if (playback.isPlaying) {
      const interval = setInterval(() => {
        const currentTime = playback.currentTime;
        // Convert time to beats (assuming 4/4 time signature)
        const beatsPerSecond = bpm / 60;
        const currentBeat = currentTime * beatsPerSecond;
        setCursorPosition(currentBeat);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [playback.isPlaying, bpm]); // Remove playback.currentTime from dependencies

  // Load notes from staffs into playback system
  useEffect(() => {
    const allNotes: { pitch: any; duration: any; position: number }[] = [];
    staffs.forEach(staff => {
      staff.notes.forEach(note => {
        allNotes.push({
          pitch: note.pitch,
          duration: note.duration,
          position: note.position
        });
      });
    });
    
    // Sort by position and load into playback
    allNotes.sort((a, b) => a.position - b.position);
    if (allNotes.length > 0) {
      playback.loadNotes(allNotes);
    }
  }, [staffs]); // Remove playback from dependencies

  const handleAddStaff = () => {
    const newStaffId = `staff-${staffs.length + 1}`;
    const newStaff: PianoStaff = {
      id: newStaffId,
      name: `Piano Staff ${staffs.length + 1}`,
      clef: 'treble',
      keySignature: 'C',
      timeSignature: timeSignature, // Use current time signature
      notes: [],
      colorMapping: { id: 'default', name: 'Default', colors: [] },
      visible: true,
      muted: false,
      volume: 0.8,
      instrument: 'piano'
    };
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
    // Update all staffs with new time signature
    setStaffs(prevStaffs => 
      prevStaffs.map(staff => ({
        ...staff,
        timeSignature: newTimeSignature
      }))
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
    // Calculate end based on staff notes
    let maxPosition = 0;
    staffs.forEach(staff => {
      staff.notes.forEach(note => {
        const noteEnd = note.position + (note.duration === 'whole' ? 4 : note.duration === 'half' ? 2 : note.duration === 'quarter' ? 1 : 0.5);
        maxPosition = Math.max(maxPosition, noteEnd);
      });
    });
    const endPos = Math.max(maxPosition, 4); // At least 4 beats
    setCursorPosition(endPos);
    playback.seek(endPos);
  };

  const handleStaffClick = (staffId: string, position: { x: number; y: number; pitch?: string; beat?: number }) => {
    console.log('Staff clicked:', staffId, position);
    setSelectedStaffId(staffId);
    if (mode === 'design' && position.pitch && position.beat !== undefined) {
      // Add note logic here
      console.log('Adding note:', position.pitch, 'at beat:', position.beat);
    }
  };

  const handlePlayheadDrag = (newPosition: number) => {
    console.log('Playhead dragged to:', newPosition);
    setCursorPosition(newPosition);
    playback.seek(newPosition);
  };

  const handleAddBar = (staffId: string, afterBarIndex: number) => {
    console.log('Adding bar after index', afterBarIndex, 'for staff', staffId);
    setStaffs(prevStaffs => 
      prevStaffs.map(staff => 
        staff.id === staffId 
          ? { ...staff, measuresCount: (staff.measuresCount || 4) + 1 }
          : staff
      )
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
        prevStaffs.map(staff => 
          staff.id === barToDelete.staffId 
            ? { ...staff, measuresCount: Math.max(1, (staff.measuresCount || 4) - 1) }
            : staff
        )
      );
    }
    setBarToDelete(null);
    setShowDeleteModal(false);
  };

  const cancelDeleteBar = () => {
    setBarToDelete(null);
    setShowDeleteModal(false);
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
            options={noteOptions}
            value={selectedDuration}
            onChange={(value) => setSelectedDuration(value as NoteDuration)}
            placeholder="Select Note"
          />
          
          <Dropdown
            options={restOptions}
            value={selectedRest}
            onChange={setSelectedRest}
            placeholder="Select Rest"
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

      {/* BODY */}
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
          overflow: 'auto'
        }}>
          <h2 style={{ margin: '0 0 8px 0', color: '#f0f0f0', fontSize: '16px', padding: '10px' }}>
            Staff Editor - Mode: {mode} - Selected: {selectedStaffId}
          </h2>
          <MultiStaffCanvas
            staffs={staffs}
            project={project.currentProject}
            playheadPosition={cursorPosition}
            selectedStaffId={selectedStaffId}
            darkMode={true}
            onStaffClick={handleStaffClick}
            onPlayheadDrag={handlePlayheadDrag}
            onAddBar={handleAddBar}
            onRemoveBar={handleRemoveBar}
            width={800}
            height={staffs.length * 140 + 100}
          />
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