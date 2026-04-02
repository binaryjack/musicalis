import { useState, useEffect } from 'react';
import { useEditor } from '../features/editor/hooks/useEditor';
import { useProject } from '../hooks/useProject';
import { usePlayback } from '../hooks/usePlayback';

import { Toolbar } from '../components/organisms/toolbar';
import { VelocityControl } from '../components/molecules/velocity-control';
import { BarControls } from '../components/molecules/bar-controls';
// Advanced Components
import { ResponsiveLayout } from '../components/organisms/responsive-layout';
import { MultiStaffCanvas } from '../widgets/multi-staff-canvas/ui/multi-staff-canvas';
import { MemoryMonitor } from '../components/organisms/memory-monitor';
import { VideoExportControls } from '../components/organisms/video-export-controls';
import { BarManagement } from '../components/organisms/bar-management';
import { AudioQualitySelector } from '../components/molecules/audio-quality-selector';
import { ColorMappingEditor } from '../components/molecules/color-mapping-editor';
import { MobileConstraintsProvider, MobileWarningDisplay } from '../components/organisms/mobile-constraints';
import { MusicalPalette, type MusicalTool } from '../components/organisms/MusicalPalette/MusicalPalette';

import type { MusicNote, NoteDuration, PianoStaff, VideoExportOptions } from '../types/musicTypes';
import { musicNote, noteDuration } from '../types/musicTypes';
import { MusicalElementType } from '../types';
import { createRest } from '../shared/utils/musical-elements';
import styles from './EditorPage.module.css';

interface StaffClickPosition {
  pitch?: MusicNote;
  beat?: number;
  x?: number;
  y?: number;
}

interface EditorPageProps {
  projectId?: string;
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
  const [showVideoExport, setShowVideoExport] = useState(false);
  const [showBarManagement, setShowBarManagement] = useState(false);
  const [showColorMapping, setShowColorMapping] = useState(false);
  const [videoExporting, setVideoExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [selectedAudioQuality, setSelectedAudioQuality] = useState({
    id: 'mid',
    name: 'Mid Quality (44.1kHz)',
    sampleRate: 44100,
    bitRate: 256,
    memoryImpactMB: 5.2
  });
  
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
  
  // Musical tool state - palette-based selection like Photoshop
  const [selectedTool, setSelectedTool] = useState<MusicalTool | null>(null);
  const [velocity, setVelocity] = useState<number>(80);
  
  // Initialize with quarter note tool
  useState(() => {
    const quarterNoteTool = {
      id: 'quarter-note',
      type: MusicalElementType.NOTE,
      name: 'Quarter Note',
      icon: '♩',
      duration: 'quarter' as NoteDuration,
      description: 'Click staff to add quarter notes'
    };
    setSelectedTool(quarterNoteTool);
  });
  
  // Use project notes directly
  const notes = project.currentProject?.notes.map(note => ({
    pitch: note.pitch,
    duration: note.duration
  })) || [];

  // Load notes into playback engine when they change
  useEffect(() => {
    playback.loadNotes(notes);
  }, [playback, notes]);

  if (project.isLoading) {
    return <div>Loading project...</div>;
  }
  
  if (project.error) {
    return <div>Error: {project.error}</div>;
  }
  
  if (!project.currentProject) {
    return <div>No project loaded...</div>;
  }

  // Musical element editing handlers - now supports both notes and rests
  const handleStaffClick = (position: StaffClickPosition) => {
    if (!selectedTool || !isDesignMode) return;
    
    console.log('Staff clicked:', position, 'Selected tool:', selectedTool);
    
    if (selectedTool.type === MusicalElementType.NOTE) {
      // Handle note placement
      if (position.pitch && position.beat !== undefined) {
        const newNote = {
          pitch: position.pitch as MusicNote,
          duration: selectedTool.duration,
          position: position.beat,
          velocity: velocity / 127
        };
        console.log('Adding note:', newNote);
        project.addNote(newNote);
        
        // Preview the note
        try {
          playback.playNote(newNote.pitch, newNote.duration, newNote.velocity);
        } catch (error) {
          console.error('Error playing note preview:', error);
        }
      }
    } else if (selectedTool.type === MusicalElementType.REST) {
      // Handle rest placement
      if (position.beat !== undefined) {
        const newRest = createRest({
          duration: selectedTool.duration
        });
        console.log('Adding rest:', newRest);
        
        // Fallback: add as a note with no pitch (silent)
        const silentNote = {
          pitch: null,
          duration: selectedTool.duration,
          position: position.beat,
          velocity: 0,
          isRest: true
        };
        project.addNote(silentNote as any);
      }
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
      <MemoryMonitor data-testid="memory-monitor" />
      
      {/* Audio Quality Selector */}
      <div className={styles.section}>
        <AudioQualitySelector
          selectedQuality={selectedAudioQuality}
          onQualityChange={(quality) => {
            console.log('Audio quality changed:', quality);
            setSelectedAudioQuality(quality);
            // Update audio engine quality
          }}
        />
      </div>
      
      {/* Musical Palette - Photoshop-style tool selection */}
      <div className={styles.section}>
        <MusicalPalette
          selectedTool={selectedTool}
          onSelectTool={(tool) => {
            console.log('Musical tool selected:', tool);
            setSelectedTool(tool);
            
            // Play preview for note tools
            if (tool.type === MusicalElementType.NOTE) {
              try {
                // Use middle C for preview since we don't have pitch selection yet
                playback.playNote('C4' as MusicNote, tool.duration, velocity / 127);
              } catch (error) {
                console.error('Error playing tool preview:', error);
              }
            }
          }}
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


  return (
    <MobileConstraintsProvider>
      <ResponsiveLayout
        data-testid="editor-page"
        headerContent={
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span data-testid="project-title">{project.currentProject?.name || 'Untitled Project'}</span>
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
              data-testid="multi-staff-canvas"
              staffs={staves}
              project={project.currentProject}
              mode={mode}
              playheadPosition={0}
              onStaffClick={isDesignMode ? (staffId: string, position: any) => {
                console.log('MultiStaffCanvas click:', staffId, position, 'Design mode:', isDesignMode);
                handleStaffClick(position);
              } : undefined}
              onNoteDelete={isDesignMode ? (noteId: string) => {
                console.log('Deleting note:', noteId);
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
              onExportStart={(_options: VideoExportOptions) => {
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
                timeSignature: { beatsPerMeasure: 4, beatValue: 4, display: '4/4' },
                keySignature: { key: 'C', mode: 'major', sharps: 0, flats: 0 },
                bars: [{
                    index: 0,
                    beats: []
                  }]
                } as any}
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
                onPresetLoad={(preset) => {
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