import { useState, useEffect } from 'react';
import { useEditor } from '../features/editor/hooks/useEditor';
import { useProject } from '../hooks/useProject';
import { usePlayback } from '../hooks/usePlayback';

import { Toolbar } from '../components/organisms/toolbar';
import { NoteSelector } from '../components/molecules/note-selector';
import { DurationSelector } from '../components/molecules/duration-selector';
import { VelocityControl } from '../components/molecules/velocity-control';
import { BarControls } from '../components/molecules/bar-controls';
import { PlaybackBar } from '../components/molecules/playback-bar';
import { ColorPreview } from '../components/molecules/color-preview';
// Advanced Components
import { ResponsiveLayout } from '../components/organisms/responsive-layout';
import { MultiStaffCanvas } from '../components/organisms/multi-staff-canvas';
import { MemoryMonitor } from '../components/organisms/memory-monitor';
import { VideoExportControls } from '../components/organisms/video-export-controls';
import { BarManagement } from '../components/organisms/bar-management';
import { AudioQualitySelector } from '../components/molecules/audio-quality-selector';
import { ColorMappingEditor } from '../components/molecules/color-mapping-editor';
import { MobileConstraintsProvider, MobileWarningDisplay } from '../components/organisms/mobile-constraints';

import type { MusicNote, NoteDuration, PianoStaff, VideoExportOptions } from '../types/musicTypes';
import { musicNote, noteDuration } from '../types/musicTypes';
import styles from './EditorPage.module.css';

interface EditorPageProps {
  projectId: string;
}

export const EditorPage = ({ projectId }: EditorPageProps) => {
  const project = useProject();
  const { editorUI: { mode }, setMode } = useEditor();
  const playback = usePlayback();
  
  // Advanced editor state
  const [staves] = useState<PianoStaff[]>([
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
      instrument: 'piano'
    }
  ]);
  const [selectedStaffIndex, setSelectedStaffIndex] = useState(0);
  const [showVideoExport, setShowVideoExport] = useState(false);
  const [showBarManagement, setShowBarManagement] = useState(false);
  const [showColorMapping, setShowColorMapping] = useState(false);
  const [videoExporting, setVideoExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  
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
  const handleStaffClick = (position: any) => {
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

  // Bar management handlers
  const handleAddBar = () => {
    console.log('Adding bar');
    // TODO: Implement bar addition
  };

  const handleRemoveBar = () => {
    console.log('Removing bar');
    // TODO: Implement bar removal
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
        setShowVideoExport(true);
      },
      disabled: !project.currentProject
    },
    {
      id: 'manage-bars',
      label: 'Manage Bars',
      icon: '📊',
      variant: 'secondary' as 'secondary',
      onClick: () => {
        setShowBarManagement(true);
      },
      disabled: !project.currentProject
    },
    {
      id: 'color-mapping',
      label: 'Note Colors',
      icon: '🎨',
      variant: 'secondary' as 'secondary',
      onClick: () => {
        setShowColorMapping(true);
      },
      disabled: !project.currentProject
    },
  ];

  const leftSidebar = (
    <div className={styles.sidebar}>
      <h3>🎵 Composition Tools</h3>
      
      {/* Memory Monitor */}
      <MemoryMonitor />
      
      {/* Audio Quality Selector */}
      <div className={styles.section}>
        <AudioQualitySelector
          onQualityChange={(quality) => {
            console.log('Audio quality changed:', quality);
            // Update audio engine quality
          }}

        />
      </div>
      
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


  return (
    <MobileConstraintsProvider>
      <ResponsiveLayout
        headerContent={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{project.currentProject?.name || 'Untitled Project'}</span>
            <div style={{
              padding: '4px 8px',
              backgroundColor: mode === 'design' ? '#28a745' : '#007bff',
              color: 'white',
              borderRadius: 4,
              fontSize: 11
            }}>
              {mode === 'design' ? '✏️ Design' : '▶️ Play'}
            </div>
          </div>
        }
        sidebarContent={
          <div>
            {leftSidebar}
            <div className={styles.section}>
              <BarControls
                onAddBar={handleAddBar}
                onRemoveBar={handleRemoveBar}
                disabled={!isDesignMode}
              />
            </div>
          </div>
        }
        footerContent={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span>{notes.length} notes</span>
            <span>{staves.length} staves</span>
            <span>BPM: {project.currentProject?.tempo || 120}</span>
          </div>
        }
      >
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Toolbar */}
          <div style={{ marginBottom: 16 }}>
            <Toolbar items={toolbarItems} position="top" />
          </div>
          
          {/* Main Canvas Area */}
          <div style={{ flex: 1, position: 'relative' }}>
            <MultiStaffCanvas
              staffs={staves}
              project={project.currentProject}
              playheadPosition={0}
              onStaffClick={(staffId: string, position: any) => {
                setSelectedStaffIndex(0); // Mock implementation
                if (isDesignMode && selectedNote) {
                  handleStaffClick(position);
                }
              }}
              onNoteDelete={isDesignMode ? (noteId: string) => {
                // Find the note index by parsing the noteId
                const index = parseInt(noteId.replace('note-', ''));
                if (index >= 0 && index < notes.length) {
                  handleNoteDelete(index);
                }
              } : undefined}
            />
          </div>
        </div>
        
        {/* Video Export Modal */}
        {showVideoExport && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <VideoExportControls
              onExportStart={(options: VideoExportOptions) => {
                setVideoExporting(true);
                setExportProgress(0);
                // Simulate export process
                const interval = setInterval(() => {
                  setExportProgress(prev => {
                    if (prev >= 100) {
                      clearInterval(interval);
                      setVideoExporting(false);
                      setShowVideoExport(false);
                      alert('Video export completed!');
                      return 100;
                    }
                    return prev + 5;
                  });
                }, 100);
              }}
              onExportCancel={() => {
                setVideoExporting(false);
                setShowVideoExport(false);
              }}
              isExporting={videoExporting}
              progress={exportProgress}
              estimatedTimeRemaining={videoExporting ? Math.max(0, (100 - exportProgress) * 2) : undefined}
            />
            
            {!videoExporting && (
              <button
                onClick={() => setShowVideoExport(false)}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  padding: 8,
                  fontSize: 16,
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        
        {/* Bar Management Modal */}
        {showBarManagement && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 20,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              <BarManagement
                composition={{
                  id: project.currentProject?.id || 'temp',
                  title: project.currentProject?.name || 'Untitled',
                  bpm: project.currentProject?.tempo || 120,
                  timeSignature: { numerator: 4, denominator: 4 },
                  keySignature: { key: 'C', mode: 'major', sharps: 0, flats: 0 },
                  bars: [{
                    id: 'bar-1',
                    number: 1,
                    timeSignature: '4/4',
                    keySignature: 'C major',
                    duration: 240,
                    notes: notes.map((note, index) => ({
                      id: `note-${index}`,
                      pitch: note.pitch,
                      duration: note.duration,
                      position: note.position,
                      velocity: note.velocity || 0.5,
                      staffId: 'staff-1',
                      barNumber: 1
                    })),
                    isEmpty: notes.length === 0,
                    isRepeatable: false
                  }]
                }}
                onBarsChange={(bars) => {
                  console.log('Bars changed:', bars);
                }}
                onTimeSignatureChange={(barIndex, timeSignature) => {
                  console.log('Time signature changed:', barIndex, timeSignature);
                }}
                onKeySignatureChange={(barIndex, keySignature) => {
                  console.log('Key signature changed:', barIndex, keySignature);
                }}
                selectedBarIndex={0}
                onBarSelect={(index) => {
                  console.log('Bar selected:', index);
                }}
              />
              
              <button
                onClick={() => setShowBarManagement(false)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  padding: 8,
                  fontSize: 16,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Color Mapping Modal */}
        {showColorMapping && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              borderRadius: 8,
              padding: 20,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}>
              <ColorMappingEditor
                colorMapping={{
                  id: 'default',
                  name: 'Default Mapping',
                  colors: [{
                    id: 'bass',
                    name: 'Bass Notes',
                    hex: '#ff6b6b',
                    condition: { pitchRange: { min: 'C4', max: 'G4' } }
                  }]
                }}
                onMappingChange={(mapping) => {
                  console.log('Color mapping changed:', mapping);
                }}
                availablePresets={[
                  {
                    id: 'teaching-basic',
                    name: 'Teaching Basic',
                    description: 'Simple color coding for beginners',
                    rules: []
                  }
                ]}
                onPresetSelect={(preset) => {
                  console.log('Preset selected:', preset);
                }}
              />
              
              <button
                onClick={() => setShowColorMapping(false)}
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  padding: 8,
                  fontSize: 16,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        
        {/* Mobile Warnings */}
        <MobileWarningDisplay />
      </ResponsiveLayout>
    </MobileConstraintsProvider>
  );
};