import type { Project } from '../models';

/**
 * Redux state shape for projects feature
 */
export interface ProjectsState {
  byId: Record<string, Project>;
  allIds: string[];
  currentProjectId: string | null;
  loading: boolean;
  error: string | null;
}
