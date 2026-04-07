import { useState, useCallback } from 'react'
import { useEditor } from '../features/editor/hooks/useEditor'
import { usePlayback } from '../hooks/usePlayback'
import { useProject } from '../hooks/useProject'
import { useStaffState } from '../features/editor/hooks/use-staff-state'
import { usePlaybackSync } from '../features/editor/hooks/use-playback-sync'
import { useKeyboardShortcuts } from '../features/editor/hooks/use-keyboard-shortcuts'
import { useBtPanelResize } from '../features/editor/hooks/use-bt-panel-resize'
import { EditorHeader } from '../features/editor/components/editor-header'
import { EditorSidebar } from '../features/editor/components/editor-sidebar'
import { EditorFooter } from '../features/editor/components/editor-footer'
import { EditorCanvasArea } from '../features/editor/components/editor-canvas-area'
import { EditorBtPanel } from '../features/editor/components/editor-bt-panel'
import { ConfirmModal } from '../components/atoms/confirm-modal'
import type { Note, NoteDuration } from '../types/musicTypes'

interface EditorWorkspaceProps {
  onSettings?: () => void;
}

export const EditorWorkspace = function({ onSettings }: EditorWorkspaceProps) {
  const { editorUI: { mode }, setMode } = useEditor()
  const project = useProject()
  const playback = usePlayback()

  const [selectedDuration, setSelectedDuration] = useState<NoteDuration>('quarter')
  const [selectedRest, setSelectedRest] = useState('')
  const [zoom, setZoom] = useState(1.2)
  const [btPanelWidth, setBtPanelWidth] = useState(420)
  const [btPanelCollapsed, setBtPanelCollapsed] = useState(false)
  const [cursorPosition, setCursorPosition] = useState(0)
  const [selectedElement, setSelectedElement] = useState<{ staffId: string; barIndex: number; beatIndex: number; note: Note } | null>(null)
  const [videoResolution, setVideoResolution] = useState('1080p')
  const [audioQuality, setAudioQuality] = useState('high')
  const [isConsoleOpen, setIsConsoleOpen] = useState(false)

  const addLog = useCallback((message: string, type?: 'error' | 'warning' | 'info') => {
    void message; void type; void isConsoleOpen;
  }, [isConsoleOpen])

  const staffState = useStaffState({ playback, selectedRest, addLog, setIsConsoleOpen })
  const transport = usePlaybackSync({ staffs: staffState.staffs, playback, cursorPosition, setCursorPosition })
  const handleBtResizeStart = useBtPanelResize(btPanelWidth, setBtPanelWidth)

  useKeyboardShortcuts({
    selectedElement,
    setSelectedElement,
    staffs: staffState.staffs,
    setStaffs: staffState.setStaffs,
    handleRemoveNote: staffState.handleRemoveNote,
  })

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', backgroundColor: '#1a1a1a', color: '#f0f0f0', fontFamily: 'system-ui, sans-serif', margin: 0, padding: 0, overflow: 'hidden', position: 'fixed', top: 0, left: 0 }}>
      <EditorHeader
        mode={mode}
        onModeToggle={() => setMode(mode === 'design' ? 'playback' : 'design')}
        projectName={project.currentProject?.name}
        onSettings={onSettings}
        onSave={project.saveProject}
        onAddStaff={staffState.handleAddStaff}
        instrumentName={playback.instrumentName}
        onSetInstrument={playback.setInstrument}
        videoResolution={videoResolution}
        setVideoResolution={setVideoResolution}
        audioQuality={audioQuality}
        setAudioQuality={setAudioQuality}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
        <EditorSidebar
          selectedDuration={selectedDuration}
          setSelectedDuration={setSelectedDuration}
          selectedRest={selectedRest}
          setSelectedRest={setSelectedRest}
        />
        <EditorCanvasArea
          staffs={staffState.staffs}
          mode={mode}
          cursorPosition={cursorPosition}
          zoom={zoom}
          selectedDuration={selectedDuration}
          selectedRest={selectedRest}
          selectedStaffId={staffState.selectedStaffId}
          selectedElement={selectedElement}
          onSelectNote={(note, staffId) => setSelectedElement(note ? { staffId, barIndex: note.barIndex, beatIndex: note.beatIndex, note: note.note } : null)}
          onAddBar={staffState.handleAddBar}
          onRemoveBar={staffState.handleRemoveBar}
          onPlayheadChange={transport.handlePlayheadChange}
          onAddNote={staffState.handleAddNote}
          onAddRest={staffState.handleAddRest}
          onRemoveNote={staffState.handleRemoveNote}
          onMoveNote={staffState.handleMoveNote}
          onResizeDuration={staffState.handleResizeDuration}
        />
        <EditorBtPanel
          width={btPanelWidth}
          collapsed={btPanelCollapsed}
          onCollapseToggle={() => setBtPanelCollapsed(c => !c)}
          onResizeStart={handleBtResizeStart}
        />
      </div>
      <EditorFooter
        timeSignature={staffState.timeSignature}
        onTimeSignatureChange={staffState.handleTimeSignatureChange}
        isPlaying={playback.isPlaying}
        cursorPosition={cursorPosition}
        bpm={transport.bpm}
        onBpmChange={transport.handleBpmChange}
        onPlay={playback.play}
        onPause={playback.pause}
        onStop={() => { playback.stop(); setCursorPosition(0); }}
        onGoToStart={transport.handleGoToStart}
        onStepBackward={transport.handleStepBackward}
        onStepForward={transport.handleStepForward}
        onGoToEnd={transport.handleGoToEnd}
        zoom={zoom}
        setZoom={setZoom}
      />
      {staffState.showDeleteModal && (
        <ConfirmModal
          isOpen={staffState.showDeleteModal}
          onClose={staffState.cancelDeleteBar}
          title="Confirm Deletion"
          message={`Are you sure you want to delete the last bar from staff "${staffState.barToDelete?.staffId}"?`}
          onConfirm={staffState.confirmDeleteBar}
        />
      )}
    </div>
  )
}
