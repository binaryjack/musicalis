import { useState, useCallback } from 'react';
import { projectService, type ProjectData } from '../services/projectService';
import type { MusicNote, NoteDuration } from '../types/musicTypes';

export interface UseProjectReturn {
  // Current project state
  currentProject: ProjectData | null;
  isLoading: boolean;
  error: string | null;
  
  // Project operations
  createProject: (name: string) => Promise<void>;
  loadProject: (projectId: string) => Promise<void>;
  saveProject: () => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  
  // Project data operations
  updateProjectName: (name: string) => void;
  updateTempo: (tempo: number) => void;
  updateTimeSignature: (numerator: number, denominator: number) => void;
  
  // Notes operations
  addNote: (note: { pitch: MusicNote; duration: NoteDuration; position: number; velocity?: number }) => void;
  removeNote: (index: number) => void;
  updateNote: (index: number, note: { pitch: MusicNote; duration: NoteDuration; position: number; velocity?: number }) => void;
  clearNotes: () => void;
  
  // Import/Export
  exportAsJSON: () => string | null;
  importFromJSON: (jsonString: string) => Promise<void>;
  
  // Project list
  listAllProjects: () => { id: string; name: string; lastModified: Date; noteCount: number }[];
}

export const useProject = (): UseProjectReturn => {
  const [currentProject, setCurrentProject] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProject = useCallback(async (name: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const newProject = projectService.create(name);
      await projectService.save(newProject);
      setCurrentProject(newProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const project = await projectService.load(projectId);
      if (project) {
        setCurrentProject(project);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveProject = useCallback(async () => {
    if (!currentProject) {
      setError('No project to save');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      await projectService.save(currentProject);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      await projectService.delete(projectId);
      
      // If we just deleted the current project, clear it
      if (currentProject?.id === projectId) {
        setCurrentProject(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  }, [currentProject]);

  const updateProjectName = useCallback((name: string) => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        name,
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const updateTempo = useCallback((tempo: number) => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        tempo,
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const updateTimeSignature = useCallback((numerator: number, denominator: number) => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        timeSignature: { numerator, denominator },
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const addNote = useCallback((note: { pitch: MusicNote; duration: NoteDuration; position: number; velocity?: number }) => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        notes: [...currentProject.notes, note],
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const removeNote = useCallback((index: number) => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        notes: currentProject.notes.filter((_, i) => i !== index),
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const updateNote = useCallback((index: number, note: { pitch: MusicNote; duration: NoteDuration; position: number; velocity?: number }) => {
    if (currentProject) {
      const updatedNotes = [...currentProject.notes];
      updatedNotes[index] = note;
      
      setCurrentProject({
        ...currentProject,
        notes: updatedNotes,
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const clearNotes = useCallback(() => {
    if (currentProject) {
      setCurrentProject({
        ...currentProject,
        notes: [],
        metadata: {
          ...currentProject.metadata,
          lastModified: new Date()
        }
      });
    }
  }, [currentProject]);

  const exportAsJSON = useCallback(() => {
    if (currentProject) {
      return projectService.exportJSON(currentProject);
    }
    return null;
  }, [currentProject]);

  const importFromJSON = useCallback(async (jsonString: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const importedProject = projectService.importJSON(jsonString);
      if (importedProject) {
        // Generate new ID for imported project to avoid conflicts
        const newProject = {
          ...importedProject,
          id: `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          metadata: {
            ...importedProject.metadata,
            lastModified: new Date()
          }
        };
        
        await projectService.save(newProject);
        setCurrentProject(newProject);
      } else {
        setError('Invalid project file format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import project');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const listAllProjects = useCallback(() => {
    return projectService.listProjects();
  }, []);

  return {
    currentProject,
    isLoading,
    error,
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    updateProjectName,
    updateTempo,
    updateTimeSignature,
    addNote,
    removeNote,
    updateNote,
    clearNotes,
    exportAsJSON,
    importFromJSON,
    listAllProjects
  };
};