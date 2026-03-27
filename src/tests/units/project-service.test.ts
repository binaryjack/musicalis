import { describe, test, expect, beforeEach } from '@jest/globals';
import type { MusicNote, NoteDuration } from '../../types/musicTypes';

interface ProjectData {
  id: string;
  name: string;
  notes: { pitch: MusicNote; duration: NoteDuration; position: number }[];
  tempo: number;
}

interface ProjectServiceInterface {
  create: (name: string) => ProjectData;
  save: (project: ProjectData) => Promise<void>;
  load: (id: string) => Promise<ProjectData | null>;
  delete: (id: string) => Promise<void>;
  listProjects: () => { id: string; name: string }[];
}

export const createProjectService = function(): ProjectServiceInterface {
  const storage = new Map<string, ProjectData>();
  const projectsList: { id: string; name: string }[] = [];

  const service = {
    create: function(name: string): ProjectData {
      const id = `project-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return {
        id,
        name,
        notes: [],
        tempo: 120,
      };
    },

    save: function(project: ProjectData): Promise<void> {
      storage.set(project.id, { ...project });
      const existingIndex = projectsList.findIndex(p => p.id === project.id);
      const projectSummary = { id: project.id, name: project.name };
      
      if (existingIndex >= 0) {
        projectsList[existingIndex] = projectSummary;
      } else {
        projectsList.push(projectSummary);
      }
      
      return Promise.resolve();
    },

    load: function(id: string): Promise<ProjectData | null> {
      const project = storage.get(id);
      return Promise.resolve(project || null);
    },

    delete: function(id: string): Promise<void> {
      storage.delete(id);
      const index = projectsList.findIndex(p => p.id === id);
      if (index >= 0) {
        projectsList.splice(index, 1);
      }
      return Promise.resolve();
    },

    listProjects: function() {
      return [...projectsList];
    }
  };

  return service;
};

describe('project-service creation', () => {
  let service: ProjectServiceInterface;

  beforeEach(() => {
    service = createProjectService();
  });

  test('creates-project-with-name', () => {
    const project = service.create('test-project');
    expect(project.name).toBe('test-project');
    expect(project.id).toBeDefined();
    expect(project.notes).toEqual([]);
    expect(project.tempo).toBe(120);
  });

  test('generates-unique-ids', () => {
    const project1 = service.create('project-1');
    const project2 = service.create('project-2');
    expect(project1.id).not.toBe(project2.id);
  });
});

describe('project-service persistence', () => {
  let service: ProjectServiceInterface;

  beforeEach(() => {
    service = createProjectService();
  });

  test('saves-and-loads-project', async () => {
    const project = service.create('test-project');
    await service.save(project);
    
    const loaded = await service.load(project.id);
    expect(loaded).toEqual(project);
  });

  test('loads-nonexistent-project', async () => {
    const loaded = await service.load('nonexistent-id');
    expect(loaded).toBeNull();
  });

  test('deletes-project', async () => {
    const project = service.create('test-project');
    await service.save(project);
    
    await service.delete(project.id);
    const loaded = await service.load(project.id);
    expect(loaded).toBeNull();
  });
});

describe('project-service listing', () => {
  let service: ProjectServiceInterface;

  beforeEach(() => {
    service = createProjectService();
  });

  test('lists-empty-projects', () => {
    const projects = service.listProjects();
    expect(projects).toEqual([]);
  });

  test('lists-saved-projects', async () => {
    const project1 = service.create('project-1');
    const project2 = service.create('project-2');
    
    await service.save(project1);
    await service.save(project2);
    
    const projects = service.listProjects();
    expect(projects).toHaveLength(2);
    expect(projects[0].name).toBe('project-1');
    expect(projects[1].name).toBe('project-2');
  });

  test('removes-deleted-from-list', async () => {
    const project = service.create('test-project');
    await service.save(project);
    
    let projects = service.listProjects();
    expect(projects).toHaveLength(1);
    
    await service.delete(project.id);
    projects = service.listProjects();
    expect(projects).toHaveLength(0);
  });
});