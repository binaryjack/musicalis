import type { ColorMapping } from '../models';

/**
 * Redux state shape for color mapping feature
 */
export interface ColorMappingState {
  byId: Record<string, ColorMapping>;
  allIds: string[];
  selectedId: string | null;
  loading: boolean;
  error: string | null;
}
