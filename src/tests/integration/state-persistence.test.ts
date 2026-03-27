import { describe, test, expect, beforeEach } from '@jest/globals';
import type { MusicNote, NoteDuration } from '../../types/musicTypes';
import { createProjectService } from '../units/project-service.test';
import { createStorageAdapter } from '../units/storage-adapter.test';

interface ProjectData {
  id: string;
  name: string;
  notes: { pitch: MusicNote; duration: NoteDuration; position: number }[];
  tempo: number;
}

interface ProjectMetadata {
  id: string;
  name: string;
  lastModified: number;
  noteCount: number;
  tempo: number;
}

interface StatePersistence {
  saveState: (key: string, data: unknown) => Promise<void>;
  loadState: (key: string) => Promise<unknown | null>;
  clearState: (key: string) => Promise<void>;
  getAllStates: () => Promise<Record<string, unknown>>;
  persistProject: (project: ProjectData) => Promise<void>;
  restoreProject: (id: string) => Promise<ProjectData | null>;
  backupAllProjects: () => Promise<string>;
  restoreFromBackup: (backupData: string) => Promise<void>;
}

export const createStatePersistence = function(): StatePersistence {
  const storage = createStorageAdapter();
  const projectService = createProjectService();
  
  const persistence = {
    saveState: async function(key: string, data: unknown) {
      const serialized = JSON.stringify(data);
      storage.setItem(key, serialized);
    },

    loadState: async function(key: string) {
      const serialized = storage.getItem(key);
      if (serialized) {
        try {
          return JSON.parse(serialized);
        } catch (error) {
          console.warn(`Failed to parse state for key: ${key}`, error);
          return null;
        }
      }
      return null;
    },

    clearState: async function(key: string) {
      storage.removeItem(key);
    },

    getAllStates: async function() {
      const allKeys = storage.getAllKeys();
      const states: Record<string, unknown> = {};
      
      for (const key of allKeys) {
        const value = await persistence.loadState(key);
        if (value !== null) {
          states[key] = value;
        }
      }
      
      return states;
    },

    persistProject: async function(project: ProjectData) {
      await projectService.save(project);
      
      // Also save project metadata
      const metadata = {
        id: project.id,
        name: project.name,
        lastModified: Date.now(),
        noteCount: project.notes.length,
        tempo: project.tempo
      };
      
      await persistence.saveState(`project-meta-${project.id}`, metadata);
    },

    restoreProject: async function(id: string) {
      const project = await projectService.load(id);
      if (project) {
        const metadata = await persistence.loadState(`project-meta-${id}`);
        if (metadata) {
          // Validate metadata matches project
          const meta = metadata as ProjectMetadata;
          if (meta.id === project.id) {
            return project;
          }
        }
        return project;
      }
      return null;
    },

    backupAllProjects: async function() {
      const projectList = projectService.listProjects();
      const backup = {
        version: '1.0',
        timestamp: Date.now(),
        projects: [] as ProjectData[],
        metadata: [] as ProjectMetadata[]
      };
      
      for (const projectInfo of projectList) {
        const project = await projectService.load(projectInfo.id);
        if (project) {
          backup.projects.push(project);
          
          const meta = await persistence.loadState(`project-meta-${projectInfo.id}`);
          if (meta) {
            backup.metadata.push(meta as ProjectMetadata);
          }
        }
      }
      
      return JSON.stringify(backup);
    },

    restoreFromBackup: async function(backupData: string) {
      try {
        const backup = JSON.parse(backupData);
        
        if (backup.version !== '1.0') {
          throw new Error('Unsupported backup version');
        }
        
        // Clear existing data
        const allKeys = storage.getAllKeys();
        for (const key of allKeys) {
          if (key.startsWith('project-')) {
            storage.removeItem(key);
          }
        }
        
        // Restore projects
        for (const project of backup.projects) {
          await projectService.save(project);
        }
        
        // Restore metadata
        for (const meta of backup.metadata) {
          const metadata = meta as ProjectMetadata;
          if (metadata.id) {
            await persistence.saveState(`project-meta-${metadata.id}`, metadata);
          }
        }
      } catch (error) {
        throw new Error(`Backup restoration failed: ${error}`);
      }
    }
  };

  return persistence;
};

describe('state-persistence basic-operations', () => {
  let persistence: StatePersistence;

  beforeEach(() => {
    persistence = createStatePersistence();
  });

  test('saves-and-loads-simple-state', async () => {
    const testData = { counter: 42, message: 'test' };
    
    await persistence.saveState('test-key', testData);
    const loaded = await persistence.loadState('test-key');
    
    expect(loaded).toEqual(testData);
  });

  test('returns-null-for-nonexistent-key', async () => {
    const loaded = await persistence.loadState('nonexistent');
    expect(loaded).toBeNull();
  });

  test('clears-state-successfully', async () => {
    await persistence.saveState('temp-key', { value: 123 });
    await persistence.clearState('temp-key');
    
    const loaded = await persistence.loadState('temp-key');
    expect(loaded).toBeNull();
  });

  test('retrieves-all-states', async () => {
    await persistence.saveState('key1', { a: 1 });
    await persistence.saveState('key2', { b: 2 });
    
    const allStates = await persistence.getAllStates();
    expect(Object.keys(allStates)).toContain('key1');
    expect(Object.keys(allStates)).toContain('key2');
    expect(allStates['key1']).toEqual({ a: 1 });
  });
});

describe('state-persistence project-management', () => {
  let persistence: StatePersistence;

  beforeEach(() => {
    persistence = createStatePersistence();
  });

  test('persists-project-with-metadata', async () => {
    const project: ProjectData = {
      id: 'test-project',
      name: 'Test Project',
      notes: [
        { pitch: 'C4', duration: 'quarter', position: 0 },
        { pitch: 'D4', duration: 'half', position: 1 }
      ],
      tempo: 130
    };
    
    await persistence.persistProject(project);
    const restored = await persistence.restoreProject('test-project');
    
    expect(restored).not.toBeNull();
    expect(restored?.name).toBe('Test Project');
    expect(restored?.notes).toHaveLength(2);
    expect(restored?.tempo).toBe(130);
  });

  test('handles-missing-project-gracefully', async () => {
    const restored = await persistence.restoreProject('missing-project');
    expect(restored).toBeNull();
  });

  test('validates-metadata-consistency', async () => {
    const project: ProjectData = {
      id: 'validated-project',
      name: 'Validated',
      notes: [],
      tempo: 120
    };
    
    await persistence.persistProject(project);
    
    // Manually corrupt metadata
    await persistence.saveState('project-meta-validated-project', { id: 'wrong-id' });
    
    const restored = await persistence.restoreProject('validated-project');
    expect(restored?.id).toBe('validated-project');
  });
});

describe('state-persistence backup-restore', () => {
  let persistence: StatePersistence;

  beforeEach(() => {
    persistence = createStatePersistence();
  });

  test('creates-complete-backup', async () => {
    const project1: ProjectData = {
      id: 'backup-test-1',
      name: 'Project 1',
      notes: [{ pitch: 'C4', duration: 'quarter', position: 0 }],
      tempo: 120
    };
    
    const project2: ProjectData = {
      id: 'backup-test-2',
      name: 'Project 2',
      notes: [{ pitch: 'D4', duration: 'half', position: 0 }],
      tempo: 140
    };
    
    await persistence.persistProject(project1);
    await persistence.persistProject(project2);
    
    const backup = await persistence.backupAllProjects();
    expect(backup).toBeTruthy();
    
    const parsed = JSON.parse(backup);
    expect(parsed.version).toBe('1.0');
    expect(parsed.projects).toHaveLength(2);
    expect(parsed.timestamp).toBeGreaterThan(0);
  });

  test('restores-from-backup-successfully', async () => {
    const backupData = JSON.stringify({
      version: '1.0',
      timestamp: Date.now(),
      projects: [{
        id: 'restored-project',
        name: 'Restored',
        notes: [{ pitch: 'E4', duration: 'quarter', position: 0 }],
        tempo: 110
      }],
      metadata: [{
        id: 'restored-project',
        name: 'Restored',
        lastModified: Date.now(),
        noteCount: 1,
        tempo: 110
      }]
    });
    
    await persistence.restoreFromBackup(backupData);
    const restored = await persistence.restoreProject('restored-project');
    
    expect(restored).not.toBeNull();
    expect(restored?.name).toBe('Restored');
    expect(restored?.tempo).toBe(110);
  });

  test('handles-invalid-backup-format', async () => {
    const invalidBackup = '{"version":"2.0","invalid":true}';
    
    await expect(persistence.restoreFromBackup(invalidBackup))
      .rejects.toThrow('Unsupported backup version');
  });

  test('handles-malformed-backup-data', async () => {
    const malformedBackup = 'not-json-data';
    
    await expect(persistence.restoreFromBackup(malformedBackup))
      .rejects.toThrow('Backup restoration failed');
  });
});

describe('state-persistence edge-cases', () => {
  let persistence: StatePersistence;

  beforeEach(() => {
    persistence = createStatePersistence();
  });

  test('handles-circular-references', async () => {
    const circular: { name: string; self?: unknown } = { name: 'test' };
    circular.self = circular;
    
    await expect(persistence.saveState('circular', circular))
      .rejects.toThrow();
  });

  test('handles-large-data-sets', async () => {
    const largeProject: ProjectData = {
      id: 'large-project',
      name: 'Large Project',
      notes: Array.from({ length: 1000 }, (_, i) => ({
        pitch: 'C4' as const,
        duration: 'quarter' as const,
        position: i
      })),
      tempo: 120
    };
    
    await persistence.persistProject(largeProject);
    const restored = await persistence.restoreProject('large-project');
    
    expect(restored?.notes).toHaveLength(1000);
  });

  test('preserves-data-types', async () => {
    const complexData = {
      number: 42,
      string: 'test',
      boolean: true,
      array: [1, 2, 3],
      nested: { key: 'value' },
      nullValue: null
    };
    
    await persistence.saveState('complex', complexData);
    const loaded = await persistence.loadState('complex');
    
    expect(loaded).toEqual(complexData);
  });
});