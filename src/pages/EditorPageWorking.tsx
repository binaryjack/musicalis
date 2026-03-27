import React, { useState, useEffect } from 'react';
import { useProject } from '../hooks/useProject';
import { usePlayback } from '../hooks/usePlayback';
import { StaffCanvas } from '../components/organisms/staff-canvas';
import type { MusicNote, NoteDuration } from '../types/musicTypes';
import { musicNote, noteDuration } from '../types/musicTypes';

interface EditorPageProps {
  projectId?: string;
}

export const EditorPage = ({ projectId }: EditorPageProps) => {
  const project = useProject();
  const playback = usePlayback();
  
  // Local editor state
  const [mode, setMode] = useState<'design' | 'playback'>('design');
  const [selectedNote, setSelectedNote] = useState<MusicNote | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [velocity, setVelocity] = useState<number>(80);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // Initialize project
  useEffect(() => {
    if (projectId && !project.currentProject) {
      project.loadProject(projectId);
    } else if (!projectId && !project.currentProject && !project.isLoading) {
      // Create a default project with some sample notes for testing
      project.createProject('New Composition').then(() => {
        // Add some initial notes for demonstration
        const initialNotes = [
          { pitch: musicNote.C4, duration: noteDuration.quarter, position: 0, velocity: 0.7 },
          { pitch: musicNote.D4, duration: noteDuration.quarter, position: 1, velocity: 0.7 },
          { pitch: musicNote.E4, duration: noteDuration.half, position: 2, velocity: 0.7 },
          { pitch: musicNote.F4, duration: noteDuration.quarter, position: 3, velocity: 0.7 },
        ];
        
        initialNotes.forEach(note => project.addNote(note));
      });
    }
  }, [projectId, project]);

  if (project.isLoading) {
    return <div style={{ padding: '20px' }}>Loading project...</div>;
  }
  
  if (project.error) {
    return <div style={{ padding: '20px', color: 'red' }}>Error: {project.error}</div>;
  }
  
  if (!project.currentProject) {
    return <div style={{ padding: '20px' }}>No project loaded...</div>;
  }

  // Convert project notes to format expected by StaffCanvas
  const notes = project.currentProject.notes.map(note => ({
    pitch: note.pitch,
    duration: note.duration
  }));

  // Load notes into playback engine when they change
  useEffect(() => {
    playback.loadNotes(notes);
  }, [playback, notes]);

  // Note editing handlers
  const handleStaffClick = (position: { x: number; y: number; pitch?: string; beat?: number }) => {
    if (position.pitch && position.beat !== undefined) {
      const newNote = {
        pitch: position.pitch as MusicNote,
        duration: selectedDuration,
        position: position.beat,
        velocity: velocity / 127
      };
      project.addNote(newNote);
      // Preview the note
      playback.playNote(newNote.pitch, newNote.duration, newNote.velocity);
    }
  };
  
  const handleNoteDelete = (noteIndex: number) => {
    project.removeNote(noteIndex);
  };

  const handleNoteClick = (index: number) => {
    const note = notes[index];
    if (note) {
      playback.playNote(note.pitch, note.duration, velocity / 127);
      setSelectedNote(note.pitch);
      setSelectedDuration(note.duration);
    }
  };

  const isDesignMode = mode === 'design';
  const isPlaybackMode = mode === 'playback';

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>🎵 Music Editor</h1>
      <h2>Project: {project.currentProject.name}</h2>
      
      {/* Mode Toggle */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => setMode('design')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: isDesignMode ? '#007acc' : '#ccc',
            color: isDesignMode ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ✏️ Design Mode
        </button>
        <button
          onClick={() => setMode('playback')}
          style={{
            padding: '10px 20px',
            backgroundColor: isPlaybackMode ? '#007acc' : '#ccc',
            color: isPlaybackMode ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          ▶️ Playback Mode
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={() => project.saveProject()}
          disabled={project.isLoading}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          💾 Save
        </button>
        
        <button
          onClick={() => {
            const jsonData = project.exportAsJSON();
            if (jsonData) {
              const blob = new Blob([jsonData], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${project.currentProject?.name || 'project'}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }
          }}
          style={{
            padding: '8px 16px',
            marginRight: '10px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📄 Export JSON
        </button>
        
        <button
          onClick={() => project.clearNotes()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🗑️ Clear All Notes
        </button>
      </div>

      {/* Playback Controls */}
      {isPlaybackMode && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Playback Controls</h3>
          <div style={{ marginBottom: '10px' }}>
            {!playback.isPlaying ? (
              <button
                onClick={playback.play}
                style={{
                  padding: '10px 20px',
                  marginRight: '10px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ▶️ Play
              </button>
            ) : (
              <button
                onClick={playback.pause}
                style={{
                  padding: '10px 20px',
                  marginRight: '10px',
                  backgroundColor: '#ffc107',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                ⏸️ Pause
              </button>
            )}
            
            <button
              onClick={playback.stop}
              style={{
                padding: '10px 20px',
                backgroundColor: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⏹️ Stop
            </button>
          </div>
          
          <div>
            <span>Time: {playback.currentTime.toFixed(1)}s / {playback.duration.toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* Design Controls */}
      {isDesignMode && (
        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h3>Design Tools</h3>
          <div style={{ marginBottom: '10px' }}>
            <label style={{ marginRight: '10px' }}>
              Duration:
              <select
                value={selectedDuration}
                onChange={(e) => setSelectedDuration(e.target.value as NoteDuration)}
                style={{ marginLeft: '5px', padding: '4px' }}
              >
                <option value="whole">Whole</option>
                <option value="half">Half</option>
                <option value="quarter">Quarter</option>
                <option value="eighth">Eighth</option>
                <option value="sixteenth">Sixteenth</option>
              </select>
            </label>
            
            <label style={{ marginRight: '10px' }}>
              Velocity:
              <input
                type="range"
                min="1"
                max="127"
                value={velocity}
                onChange={(e) => setVelocity(Number(e.target.value))}
                style={{ marginLeft: '5px' }}
              />
              <span style={{ marginLeft: '5px' }}>{velocity}</span>
            </label>
          </div>
          
          <p style={{ fontSize: '14px', color: '#666' }}>
            Click on the staff to add notes. Right-click notes to delete them.
          </p>
        </div>
      )}

      {/* Music Staff */}
      <div style={{ border: '2px solid #333', borderRadius: '8px', padding: '10px', backgroundColor: '#fff' }}>
        <StaffCanvas
          project={project.currentProject}
          notes={notes}
          width={800}
          height={300}
          onNoteClick={handleNoteClick}
          onStaffClick={isDesignMode ? handleStaffClick : undefined}
          onNoteDelete={isDesignMode ? handleNoteDelete : undefined}
        />
      </div>

      {/* Status Info */}
      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <p>Notes: {notes.length} | Mode: {mode} | Status: {playback.isPlaying ? 'Playing' : 'Stopped'}</p>
      </div>
    </div>
  );
};