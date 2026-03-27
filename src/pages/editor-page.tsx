import { useState, useEffect } from 'react';
import { useEditor } from '../features/editor/hooks/useEditor';
import { useProject } from '../hooks/useProject';
import { usePlayback } from '../hooks/usePlayback';
import { EditorLayout } from '../components/templates/editor-layout';
import { Toolbar } from '../components/organisms/toolbar';
import { NoteSelector } from '../components/molecules/note-selector';
import { DurationSelector } from '../components/molecules/duration-selector';
import { VelocityControl } from '../components/molecules/velocity-control';
import { BarControls } from '../components/molecules/bar-controls';
import { PlaybackBar } from '../components/molecules/playback-bar';
import { ColorPreview } from '../components/molecules/color-preview';
import { StaffCanvas } from '../components/organisms/staff-canvas';
import type { MusicNote, NoteDuration } from '../types/musicTypes';
import { musicNote, noteDuration } from '../types/musicTypes';
import styles from './EditorPage.module.css';

interface EditorPageProps {
  projectId: string;
}

export const EditorPage = ({ projectId }: EditorPageProps) => {
  const project = useProject();
  const { editorUI: { mode }, setMode } = useEditor();
  const playback = usePlayback();
  
  // Initialize project if projectId provided or create a new one
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
  
  // Local editor state (not related to project data)
  const [selectedNote, setSelectedNote] = useState<MusicNote | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter');
  const [velocity, setVelocity] = useState<number>(80);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  
  // Use project notes directly
  const notes = project.currentProject?.notes.map(note => ({
    pitch: note.pitch,
    duration: note.duration
  })) || [];

  if (project.isLoading) {
    return <div>Loading project...</div>;
  }
  
  if (project.error) {
    return <div>Error: {project.error}</div>;
  }
  
  if (!project.currentProject) {
    return <div>No project loaded...</div>;
  }

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
  
  const handleNoteMove = (noteIndex: number, newPosition: number) => {
    if (project.currentProject) {
      const note = project.currentProject.notes[noteIndex];
      if (note) {
        project.updateNote(noteIndex, { ...note, position: newPosition });
      }
    }
  };

  const isDesignMode = mode === 'design';
  const isPlaybackMode = mode === 'playback';

  const toolbarItems = [
    {
      id: 'design-mode',
      label: 'Design',
      icon: '✏️',
      variant: (isDesignMode ? 'primary' : 'secondary') as 'primary' | 'secondary',
      onClick: () => setMode('design'),
    },
    {
      id: 'playback-mode', 
      label: 'Playback',
      icon: '▶️',
      variant: (isPlaybackMode ? 'primary' : 'secondary') as 'primary' | 'secondary',
      onClick: () => setMode('playback'),
    },
    {
      id: 'save',
      label: 'Save',
      icon: '💾',
      variant: 'success' as 'success',
      onClick: () => {
        project.saveProject();
      },
      disabled: project.isLoading
    },
    {
      id: 'export-json',
      label: 'Export JSON',
      icon: '📄',
      variant: 'secondary' as 'secondary',
      onClick: () => {
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
      },
      disabled: !project.currentProject
    },
    {
      id: 'export-video',
      label: 'Export Video',
      icon: '📹',
      variant: 'warning' as 'warning',
      onClick: () => {
        // Export to video - placeholder for future implementation
        alert('Video export feature coming soon!');
      },
    },
  ];

  const leftSidebar = (
    <div className={styles.sidebar}>
      <h3>Composition Tools</h3>
      
      <div className={styles.section}>
        <NoteSelector
          selectedNote={selectedNote}
          onSelectNote={(note: MusicNote | null) => {
            setSelectedNote(note);
            // Play preview note when selected
            if (note) {
              playback.playNote(note, selectedDuration, velocity / 127);
            }
          }}
          disabled={!isDesignMode}
        />
      </div>

      <div className={styles.section}>
        <DurationSelector
          selectedDuration={selectedDuration}
          onSelectDuration={setSelectedDuration}
          disabled={!isDesignMode}
        />
      </div>

      <div className={styles.section}>
        <VelocityControl
          velocity={velocity}
          onVelocityChange={setVelocity}
          disabled={!isDesignMode}
        />
      </div>

      <div className={styles.section}>
        <BarControls
          barNumber={1}
          totalBars={4} // Placeholder until PianoStaff structure is fully defined
          onAddBar={() => {}}
          onRemoveBar={() => {}}
          onDuplicateBar={() => {}}
          disabled={!isDesignMode}
        />
      </div>
    </div>
  );

  const rightSidebar = (
    <div className={styles.sidebar}>
      <h3>Color Mapping</h3>
      
      <ColorPreview
        colors={[
          { id: '1', name: 'Bass Notes', hex: '#ff6b6b' },
          { id: '2', name: 'Melody', hex: '#4ecdc4' },
          { id: '3', name: 'Harmony', hex: '#45b7d1' },
        ]}
        selectedColorId={'1'}
        onSelectColor={() => {}}
        onAddColor={() => {}}
        onRemoveColor={() => {}}
      />

      {isPlaybackMode && (
        <div className={styles.section}>
          <h4>Playback Controls</h4>
          <PlaybackBar
            isPlaying={playback.isPlaying}
            currentTime={playback.currentTime}
            duration={playback.duration}
            playbackRate={playbackRate}
            onPlay={playback.play}
            onPause={playback.pause}
            onStop={playback.stop}
            onSeek={playback.seek}
            onRateChange={setPlaybackRate}
          />
        </div>
      )}
    </div>
  );

  const toolbar = (
    <Toolbar
      items={toolbarItems}
      position="top"
    />
  );

  return (
    <EditorLayout
      title={`Editing: ${project.currentProject?.name || 'Untitled'}`}
      onHome={() => {
        // Navigate to home
      }}
      onSettings={() => {
        // Navigate to settings
      }}
      toolbar={toolbar}
      toolbarPosition="top"
      leftSidebar={leftSidebar}
      rightSidebar={rightSidebar}
      leftSidebarTitle="Tools"
      rightSidebarTitle="Properties"
    >
      <div className={styles.canvasContainer}>
        <StaffCanvas
          project={project.currentProject}
          notes={notes}
          width={800}
          height={300}
          onNoteClick={(index) => {
            // Play the clicked note
            const note = notes[index];
            if (note) {
              playback.playNote(note.pitch, note.duration, velocity / 127);
              setSelectedNote(note.pitch);
              setSelectedDuration(note.duration);
            }
          }}
          onStaffClick={isDesignMode ? handleStaffClick : undefined}
          onNoteDelete={isDesignMode ? handleNoteDelete : undefined}
          onNoteMove={isDesignMode ? handleNoteMove : undefined}
        />
      </div>
    </EditorLayout>
  );
};