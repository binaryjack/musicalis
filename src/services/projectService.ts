import type { MusicNote, NoteDuration } from '../types/musicTypes';

export interface ProjectData {
  id: string;
  name: string;
  notes: { pitch: MusicNote; duration: NoteDuration; position: number; velocity?: number }[];
  tempo: number;
  timeSignature: { numerator: number; denominator: number };
  keySignature: string;
  metadata: {
    createdAt: Date;
    lastModified: Date;
    version: string;
  };
}

export const projectService = {
  // Save project to localStorage
  save: (project: ProjectData): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        const serialized = JSON.stringify({
          ...project,
          metadata: {
            ...project.metadata,
            lastModified: new Date()
          }
        });
        localStorage.setItem(`musicalist-project-${project.id}`, serialized);
        
        // Update projects list
        const projectsList = projectService.listProjects();
        const existingIndex = projectsList.findIndex(p => p.id === project.id);
        
        const projectSummary = {
          id: project.id,
          name: project.name,
          lastModified: new Date(),
          noteCount: project.notes.length
        };
        
        if (existingIndex >= 0) {
          projectsList[existingIndex] = projectSummary;
        } else {
          projectsList.push(projectSummary);
        }
        
        localStorage.setItem('musicalist-projects', JSON.stringify(projectsList));
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // Load project from localStorage
  load: (projectId: string): Promise<ProjectData | null> => {
    return new Promise((resolve) => {
      try {
        const data = localStorage.getItem(`musicalist-project-${projectId}`);
        if (data) {
          const project = JSON.parse(data);
          // Convert date strings back to Date objects
          project.metadata.createdAt = new Date(project.metadata.createdAt);
          project.metadata.lastModified = new Date(project.metadata.lastModified);
          resolve(project);
        } else {
          resolve(null);
        }
      } catch (error) {
        console.error('Error loading project:', error);
        resolve(null);
      }
    });
  },

  // List all projects
  listProjects: (): { id: string; name: string; lastModified: Date; noteCount: number }[] => {
    try {
      const data = localStorage.getItem('musicalist-projects');
      if (data) {
        const projects = JSON.parse(data);
        return projects.map((p: { id: string; name: string; lastModified: string; noteCount: number }) => ({
          ...p,
          lastModified: new Date(p.lastModified)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error listing projects:', error);
      return [];
    }
  },

  // Create new project
  create: (name: string): ProjectData => {
    const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id,
      name,
      notes: [],
      tempo: 120,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: 'C',
      metadata: {
        createdAt: new Date(),
        lastModified: new Date(),
        version: '1.0.0'
      }
    };
  },

  // Delete project
  delete: (projectId: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        localStorage.removeItem(`musicalist-project-${projectId}`);
        
        const projectsList = projectService.listProjects().filter(p => p.id !== projectId);
        localStorage.setItem('musicalist-projects', JSON.stringify(projectsList));
        
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // Export project as JSON
  exportJSON: (project: ProjectData): string => {
    return JSON.stringify(project, null, 2);
  },

  // Import project from JSON
  importJSON: (jsonString: string): ProjectData | null => {
    try {
      const project = JSON.parse(jsonString);
      
      // Validate required fields
      if (!project.id || !project.name || !Array.isArray(project.notes)) {
        throw new Error('Invalid project format');
      }
      
      // Convert date strings to Date objects
      if (project.metadata) {
        project.metadata.createdAt = new Date(project.metadata.createdAt);
        project.metadata.lastModified = new Date(project.metadata.lastModified);
      }
      
      return project;
    } catch (error) {
      console.error('Error importing JSON:', error);
      return null;
    }
  }
};