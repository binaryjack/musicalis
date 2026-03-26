import { useState } from 'react';
import { useEditor } from '../features/editor/hooks/useEditor';
import { useProjects } from '../features/projects/hooks/useProjects';
import { EditorLayout } from '../components/templates/editor-layout';
import { Toolbar } from '../components/organisms/toolbar';
import { NoteSelector } from '../components/molecules/note-selector';
import { DurationSelector } from '../components/molecules/duration-selector';
import { VelocityControl } from '../components/molecules/velocity-control';
import { BarControls } from '../components/molecules/bar-controls';
import { PlaybackBar } from '../components/molecules/playback-bar';
import { ColorPreview } from '../components/molecules/color-preview';
import { StaffCanvas } from '../components/organisms/staff-canvas';
import { EditorMode, MusicNote, NoteDuration } from '../types/enums';
import styles from './EditorPage.module.css';

interface EditorPageProps {
  projectId: string;
}

export const EditorPage = ({ projectId: _projectId }: EditorPageProps) => {
  const { currentProject } = useProjects();
  const { editorUI: { mode }, setMode } = useEditor();
  
  // Local editor state
  const [selectedNote, setSelectedNote] = useState<MusicNote | null>(null);
  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>(NoteDuration.QUARTER);
  const [velocity, setVelocity] = useState<number>(80);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const duration = 120;
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  if (!currentProject) {
    return <div>Loading project...</div>;
  }

  const isDesignMode = mode === EditorMode.DESIGN;
  const isPlaybackMode = mode === EditorMode.PLAYBACK;

  const toolbarItems = [
    {
      id: 'design-mode',
      label: 'Design',
      icon: '✏️',
      variant: (isDesignMode ? 'primary' : 'secondary') as 'primary' | 'secondary',
      onClick: () => setMode(EditorMode.DESIGN),
    },
    {
      id: 'playback-mode', 
      label: 'Playback',
      icon: '▶️',
      variant: (isPlaybackMode ? 'primary' : 'secondary') as 'primary' | 'secondary',
      onClick: () => setMode(EditorMode.PLAYBACK),
    },
    {
      id: 'save',
      label: 'Save',
      icon: '💾',
      variant: 'success' as 'success',
      onClick: () => {
        // Save project
      },
    },
    {
      id: 'export',
      label: 'Export',
      icon: '📹',
      variant: 'warning' as 'warning',
      onClick: () => {
        // Export to video
      },
    },
  ];

  const leftSidebar = (
    <div className={styles.sidebar}>
      <h3>Composition Tools</h3>
      
      <div className={styles.section}>
        <NoteSelector
          selectedNote={selectedNote}
          onSelectNote={setSelectedNote}
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
            currentTime={currentTime}
            duration={duration}
            playbackRate={playbackRate}
            onSeek={setCurrentTime}
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
      title={`Editing: ${currentProject.name}`}
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
          project={currentProject}
          mode={mode}
          selectedNote={selectedNote}
          selectedDuration={selectedDuration}
          velocity={velocity}
        />
      </div>
    </EditorLayout>
  );
};