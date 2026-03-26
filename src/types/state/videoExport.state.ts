import type { VideoExportProgress, VideoExportResult } from '../models';
import { VideoQuality } from '../enums';

/**
 * Redux state shape for video export feature
 */
export interface VideoExportState {
  progress: VideoExportProgress;
  results: VideoExportResult[];
  settings: {
    defaultQuality: VideoQuality;
    defaultBackgroundColor: string;
  };
  loading: boolean;
  error: string | null;
}
