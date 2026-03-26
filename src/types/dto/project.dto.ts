import type { Project } from '../models';
import { TimeSignature, AudioQuality } from '../enums';

/**
 * DTO for creating a new project
 */
export interface CreateProjectDTO {
  name: string;
  description?: string;
  tempo: number;
  timeSignature: TimeSignature;
  audioQuality: AudioQuality;
}

/**
 * DTO for updating project
 */
export interface UpdateProjectDTO extends Partial<CreateProjectDTO> {
  id: string;
}

/**
 * DTO for exporting project
 */
export interface ExportProjectDTO extends Project {
  exportedAt: number;
  appVersion: string;
}
