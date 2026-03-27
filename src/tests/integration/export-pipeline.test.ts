import { describe, test, expect, beforeEach } from '@jest/globals';

interface ExportFormat {
  format: 'midi' | 'json' | 'wav';
  quality: 'low' | 'medium' | 'high';
  includeMetadata: boolean;
}

interface ExportOptions {
  startTime?: number;
  endTime?: number;
  tracks?: string[];
  normalize?: boolean;
}

interface ExportResult {
  success: boolean;
  data?: string;
  size?: number;
  duration?: number;
  error?: string;
}

interface MockProject {
  id: string;
  name: string;
  notes: Array<{ pitch: string; duration: string; position: number }>;
  tempo: number;
}

interface ExportPipeline {
  validateProject: (projectId: string) => Promise<boolean>;
  prepareExport: (projectId: string, format: ExportFormat) => Promise<ExportOptions>;
  processExport: (projectId: string, format: ExportFormat, options: ExportOptions) => Promise<ExportResult>;
  compressData: (data: string, quality: string) => Promise<string>;
  generateMetadata: (projectId: string) => Promise<Record<string, unknown>>;
  finalizeExport: (result: ExportResult, metadata?: Record<string, unknown>) => Promise<ExportResult>;
}

interface MockExportPipeline extends ExportPipeline {
  addMockProject: (project: MockProject) => void;
}

export const createExportPipeline = function(): MockExportPipeline {
  const mockProjects = new Map<string, MockProject>();
  
  const pipeline = {
    validateProject: async function(projectId: string): Promise<boolean> {
      const project = mockProjects.get(projectId);
      if (!project) return false;
      
      // Validate project has required data
      if (!project.name || project.notes.length === 0) return false;
      if (project.tempo < 60 || project.tempo > 200) return false;
      
      return true;
    },

    prepareExport: async function(projectId: string, format: ExportFormat): Promise<ExportOptions> {
      const project = mockProjects.get(projectId);
      if (!project) throw new Error('Project not found');
      
      const options: ExportOptions = {
        normalize: format.quality !== 'low',
        tracks: ['main']
      };
      
      // Calculate timing
      if (project.notes.length > 0) {
        const positions = project.notes.map(n => n.position);
        options.startTime = Math.min(...positions);
        options.endTime = Math.max(...positions) + 2; // Add buffer
      }
      
      return options;
    },

    processExport: async function(projectId: string, format: ExportFormat, options: ExportOptions): Promise<ExportResult> {
      const project = mockProjects.get(projectId);
      if (!project) {
        return { success: false, error: 'Project not found' };
      }
      
      try {
        let exportData: string;
        let size: number;
        
        switch (format.format) {
          case 'json': {
            const jsonData = {
              project: project,
              options: options,
              exportedAt: Date.now()
            };
            exportData = JSON.stringify(jsonData, null, format.quality === 'high' ? 2 : 0);
            size = exportData.length;
            break;
          }
            
          case 'midi': {
            // Mock MIDI export
            const midiData = {
              tracks: [{
                name: project.name,
                notes: project.notes.map(note => ({
                  pitch: note.pitch,
                  duration: note.duration,
                  time: note.position * (60 / project.tempo)
                }))
              }],
              tempo: project.tempo
            };
            exportData = JSON.stringify(midiData);
            size = exportData.length * 1.5; // MIDI is typically larger
            break;
          }
            
          case 'wav': {
            // Mock WAV export
            const duration = project.notes.length > 0 
              ? Math.max(...project.notes.map(n => n.position)) * (60 / project.tempo) + 2
              : 0;
            
            const sampleRate = format.quality === 'high' ? 48000 : format.quality === 'medium' ? 44100 : 22050;
            size = duration * sampleRate * 2; // Stereo 16-bit
            exportData = `WAV_DATA_${project.id}_${sampleRate}Hz_${duration}s`;
            break;
          }
            
          default:
            return { success: false, error: 'Unsupported format' };
        }
        
        if (format.quality !== 'low') {
          exportData = await pipeline.compressData(exportData, format.quality);
        }
        
        const result: ExportResult = {
          success: true,
          data: exportData,
          size: size,
          duration: format.format === 'wav' ? 
            (project.notes.length > 0 ? Math.max(...project.notes.map(n => n.position)) * (60 / project.tempo) + 2 : 0) : 
            undefined
        };
        
        return result;
        
      } catch (error) {
        return { 
          success: false, 
          error: `Export failed: ${error}` 
        };
      }
    },

    compressData: async function(data: string, quality: string): Promise<string> {
      // Mock compression - in reality would use actual compression
      const compressionRatio = quality === 'high' ? 0.9 : 0.7;
      const compressedLength = Math.floor(data.length * compressionRatio);
      return `COMPRESSED:${compressedLength}:${data.slice(0, Math.min(100, compressedLength))}`;
    },

    generateMetadata: async function(projectId: string): Promise<Record<string, unknown>> {
      const project = mockProjects.get(projectId);
      if (!project) return {};
      
      return {
        projectId: project.id,
        projectName: project.name,
        noteCount: project.notes.length,
        tempo: project.tempo,
        duration: project.notes.length > 0 ? Math.max(...project.notes.map(n => n.position)) * (60 / project.tempo) + 2 : 0,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
    },

    finalizeExport: async function(result: ExportResult, metadata?: Record<string, unknown>): Promise<ExportResult> {
      if (!result.success) return result;
      
      if (metadata && result.data) {
        // Embed metadata in export
        const finalData = {
          data: result.data,
          metadata: metadata
        };
        
        return {
          ...result,
          data: JSON.stringify(finalData),
          size: (result.size || 0) + JSON.stringify(metadata).length
        };
      }
      
      return result;
    }
  };

  // Helper method to add mock projects for testing
  (pipeline as MockExportPipeline).addMockProject = function(project: MockProject) {
    mockProjects.set(project.id, project);
  };
  
  return pipeline as MockExportPipeline;
};

describe('export-pipeline validation', () => {
  let pipeline: MockExportPipeline;

  beforeEach(() => {
    pipeline = createExportPipeline();
  });

  test('validates-project-exists', async () => {
    const isValid = await pipeline.validateProject('nonexistent-project');
    expect(isValid).toBe(false);
  });

  test('validates-project-has-content', async () => {
    const emptyProject: MockProject = {
      id: 'empty-project',
      name: 'Empty Project',
      notes: [],
      tempo: 120
    };
    pipeline.addMockProject(emptyProject);
    
    const isValid = await pipeline.validateProject(emptyProject.id);
    expect(isValid).toBe(false);
  });

  test('validates-project-with-valid-data', async () => {
    const project: MockProject = {
      id: 'valid-project',
      name: 'Valid Project',
      notes: [{ pitch: 'C4', duration: 'quarter', position: 0 }],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const isValid = await pipeline.validateProject(project.id);
    expect(isValid).toBe(true);
  });

  test('rejects-invalid-tempo', async () => {
    const project: MockProject = {
      id: 'invalid-project',
      name: 'Invalid Tempo',
      notes: [{ pitch: 'C4', duration: 'quarter', position: 0 }],
      tempo: 300
    };
    pipeline.addMockProject(project);
    
    const isValid = await pipeline.validateProject(project.id);
    expect(isValid).toBe(false);
  });
});

describe('export-pipeline preparation', () => {
  let pipeline: MockExportPipeline;

  beforeEach(() => {
    pipeline = createExportPipeline();
  });

  test('prepares-export-options-for-json', async () => {
    const project: MockProject = {
      id: 'test-project',
      name: 'Test Project',
      notes: [
        { pitch: 'C4', duration: 'quarter', position: 1 },
        { pitch: 'D4', duration: 'half', position: 3 }
      ],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const format: ExportFormat = { format: 'json', quality: 'high', includeMetadata: true };
    const options = await pipeline.prepareExport(project.id, format);
    
    expect(options.startTime).toBe(1);
    expect(options.endTime).toBe(5); // 3 + 2 buffer
    expect(options.normalize).toBe(true);
    expect(options.tracks).toContain('main');
  });

  test('handles-empty-project-timing', async () => {
    const project: MockProject = {
      id: 'empty-project',
      name: 'Empty Project',
      notes: [],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const format: ExportFormat = { format: 'midi', quality: 'medium', includeMetadata: false };
    const options = await pipeline.prepareExport(project.id, format);
    
    expect(options.startTime).toBeUndefined();
    expect(options.endTime).toBeUndefined();
  });
});

describe('export-pipeline processing', () => {
  let pipeline: MockExportPipeline;

  beforeEach(() => {
    pipeline = createExportPipeline();
  });

  test('exports-project-as-json', async () => {
    const project: MockProject = {
      id: 'json-export',
      name: 'JSON Export',
      notes: [{ pitch: 'C4', duration: 'quarter', position: 0 }],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const format: ExportFormat = { format: 'json', quality: 'low', includeMetadata: true };
    const options = await pipeline.prepareExport(project.id, format);
    const result = await pipeline.processExport(project.id, format, options);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
    expect(result.size).toBeGreaterThan(0);
    
    const parsed = JSON.parse(result.data!);
    expect(parsed.project.name).toBe('JSON Export');
  });

  test('exports-project-as-midi', async () => {
    const project: MockProject = {
      id: 'midi-export',
      name: 'MIDI Export',
      notes: [
        { pitch: 'C4', duration: 'quarter', position: 0 },
        { pitch: 'D4', duration: 'half', position: 1 }
      ],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const format: ExportFormat = { format: 'midi', quality: 'low', includeMetadata: false };
    const options = await pipeline.prepareExport(project.id, format);
    const result = await pipeline.processExport(project.id, format, options);
    
    expect(result.success).toBe(true);
    expect(result.data).toBeTruthy();
    expect(result.size).toBeGreaterThan(0);
    
    const parsed = JSON.parse(result.data!);
    expect(parsed.tracks[0].notes).toHaveLength(2);
  });

  test('exports-project-as-wav', async () => {
    const project: MockProject = {
      id: 'wav-export',
      name: 'WAV Export',
      notes: [{ pitch: 'C4', duration: 'quarter', position: 0 }],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const format: ExportFormat = { format: 'wav', quality: 'high', includeMetadata: true };
    const options = await pipeline.prepareExport(project.id, format);
    const result = await pipeline.processExport(project.id, format, options);
    
    expect(result.success).toBe(true);
    expect(result.data).toContain('WAV_DATA_');
    expect(result.duration).toBeGreaterThan(0);
    expect(result.size).toBeGreaterThan(0);
  });

  test('handles-unsupported-format', async () => {
    const project: MockProject = {
      id: 'invalid-format',
      name: 'Invalid Format',
      notes: [{ pitch: 'C4', duration: 'quarter', position: 0 }],
      tempo: 120
    };
    pipeline.addMockProject(project);
    
    const format = { format: 'invalid' as 'midi', quality: 'medium' as const, includeMetadata: false };
    const options = await pipeline.prepareExport(project.id, format);
    const result = await pipeline.processExport(project.id, format, options);
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported format');
  });
});

describe('export-pipeline finalization', () => {
  let pipeline: MockExportPipeline;

  beforeEach(() => {
    pipeline = createExportPipeline();
  });

  test('generates-comprehensive-metadata', async () => {
    const project: MockProject = {
      id: 'metadata-test',
      name: 'Metadata Test',
      notes: [
        { pitch: 'C4', duration: 'quarter', position: 0 },
        { pitch: 'D4', duration: 'half', position: 2 }
      ],
      tempo: 140
    };
    pipeline.addMockProject(project);
    
    const metadata = await pipeline.generateMetadata(project.id);
    
    expect(metadata.projectId).toBe(project.id);
    expect(metadata.projectName).toBe('Metadata Test');
    expect(metadata.noteCount).toBe(2);
    expect(metadata.tempo).toBe(140);
    expect(metadata.duration).toBeGreaterThan(0);
    expect(metadata.version).toBe('1.0');
  });

  test('finalizes-export-with-metadata', async () => {
    const result: ExportResult = {
      success: true,
      data: 'test-data',
      size: 100
    };
    
    const metadata = { project: 'test', version: '1.0' };
    const finalized = await pipeline.finalizeExport(result, metadata);
    
    expect(finalized.success).toBe(true);
    expect(finalized.size).toBeGreaterThan(100);
    
    const parsed = JSON.parse(finalized.data!);
    expect(parsed.data).toBe('test-data');
    expect(parsed.metadata).toEqual(metadata);
  });

  test('handles-failed-export', async () => {
    const result: ExportResult = {
      success: false,
      error: 'Test error'
    };
    
    const finalized = await pipeline.finalizeExport(result);
    
    expect(finalized.success).toBe(false);
    expect(finalized.error).toBe('Test error');
  });
});