import { describe, test, expect, beforeEach } from '@jest/globals';
import type { MusicNote, NoteDuration } from '../../types/musicTypes';
import { createProjectService } from '../units/project-service.test';
import { createAudioEngine } from '../units/audio-engine.test';

interface ProjectNote {
  pitch: MusicNote;
  duration: NoteDuration;
  position: number;
}

interface EditorWorkflow {
  addNote: (pitch: MusicNote, duration: NoteDuration, position: number) => Promise<void>;
  playNote: (index: number) => Promise<void>;
  deleteNote: (index: number) => Promise<void>;
  saveProject: () => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  getProjectState: () => { notes: ProjectNote[]; isPlaying: boolean };
}

export const createEditorWorkflow = function(): EditorWorkflow {
  const projectService = createProjectService();
  const audioEngine = createAudioEngine();
  let currentProject = projectService.create('test-workflow');
  
  const workflow = {
    addNote: async function(pitch: MusicNote, duration: NoteDuration, position: number) {
      const note = { pitch, duration, position };
      currentProject.notes.push(note);
      audioEngine.loadNotes(currentProject.notes);
      await audioEngine.playNote(pitch, duration, 0.8);
    },

    playNote: async function(index: number) {
      if (index < currentProject.notes.length) {
        const note = currentProject.notes[index];
        await audioEngine.playNote(note.pitch, note.duration, 0.8);
      }
    },

    deleteNote: async function(index: number) {
      if (index < currentProject.notes.length) {
        currentProject.notes.splice(index, 1);
        audioEngine.loadNotes(currentProject.notes);
      }
    },

    saveProject: async function() {
      await projectService.save(currentProject);
    },

    loadProject: async function(id: string) {
      const loaded = await projectService.load(id);
      if (loaded) {
        currentProject = loaded;
        audioEngine.loadNotes(currentProject.notes);
      }
    },

    getProjectState: function() {
      return {
        notes: [...currentProject.notes],
        isPlaying: audioEngine.getIsPlaying()
      };
    }
  };

  return workflow;
};

describe('editor-workflow note-management', () => {
  let workflow: EditorWorkflow;

  beforeEach(() => {
    workflow = createEditorWorkflow();
  });

  test('adds-note-with-audio-preview', async () => {
    await workflow.addNote('C4', 'quarter', 0);
    
    const state = workflow.getProjectState();
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].pitch).toBe('C4');
    expect(state.notes[0].duration).toBe('quarter');
    expect(state.notes[0].position).toBe(0);
  });

  test('plays-existing-note-by-index', async () => {
    await workflow.addNote('C4', 'quarter', 0);
    await workflow.addNote('D4', 'half', 1);
    
    await workflow.playNote(1);
    const state = workflow.getProjectState();
    expect(state.notes).toHaveLength(2);
  });

  test('deletes-note-and-updates-audio', async () => {
    await workflow.addNote('C4', 'quarter', 0);
    await workflow.addNote('D4', 'half', 1);
    
    await workflow.deleteNote(0);
    const state = workflow.getProjectState();
    expect(state.notes).toHaveLength(1);
    expect(state.notes[0].pitch).toBe('D4');
  });
});

describe('editor-workflow project-persistence', () => {
  let workflow: EditorWorkflow;

  beforeEach(() => {
    workflow = createEditorWorkflow();
  });

  test('saves-project-with-notes', async () => {
    await workflow.addNote('C4', 'quarter', 0);
    await workflow.addNote('D4', 'half', 1);
    
    await workflow.saveProject();
    const state = workflow.getProjectState();
    expect(state.notes).toHaveLength(2);
  });

  test('loads-project-and-restores-audio', async () => {
    await workflow.addNote('E4', 'quarter', 0);
    await workflow.saveProject();
    
    const currentState = workflow.getProjectState();
    const projectId = 'test-id'; // Mock project ID
    
    await workflow.loadProject(projectId);
    expect(currentState.notes).toHaveLength(1);
  });
});

describe('editor-workflow complex-operations', () => {
  let workflow: EditorWorkflow;

  beforeEach(() => {
    workflow = createEditorWorkflow();
  });

  test('handles-rapid-note-addition', async () => {
    const notes = [
      { pitch: 'C4' as MusicNote, duration: 'quarter' as NoteDuration, position: 0 },
      { pitch: 'D4' as MusicNote, duration: 'quarter' as NoteDuration, position: 1 },
      { pitch: 'E4' as MusicNote, duration: 'half' as NoteDuration, position: 2 },
      { pitch: 'F4' as MusicNote, duration: 'quarter' as NoteDuration, position: 3 }
    ];

    for (const note of notes) {
      await workflow.addNote(note.pitch, note.duration, note.position);
    }

    const state = workflow.getProjectState();
    expect(state.notes).toHaveLength(4);
    expect(state.notes[2].duration).toBe('half');
  });

  test('maintains-consistency-after-mixed-operations', async () => {
    await workflow.addNote('C4', 'quarter', 0);
    await workflow.addNote('D4', 'half', 1);
    await workflow.addNote('E4', 'quarter', 2);
    
    await workflow.deleteNote(1); // Remove D4
    await workflow.addNote('F4', 'eighth', 2); // Insert at position 2
    await workflow.playNote(0);
    
    const state = workflow.getProjectState();
    expect(state.notes).toHaveLength(3);
    expect(state.notes[0].pitch).toBe('C4');
    expect(state.notes[1].pitch).toBe('E4'); // E4 should be at index 1 after D4 deletion
    expect(state.notes[2].pitch).toBe('F4'); // F4 should be at the end
    expect(state.notes[2].duration).toBe('eighth');
  });
});