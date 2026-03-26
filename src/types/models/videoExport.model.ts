import { VideoQuality, ExportStatus, VideoCodec, AudioCodec } from '../enums';

/**
 * Video export configuration
 */
export interface VideoExportConfig {
  quality: VideoQuality;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  includeMetronome: boolean;
  highlightCurrentNote: boolean;
  backgroundColor: string; // hex color
  fps?: number; // frames per second (auto-set by quality)
  bitrate?: string; // bitrate string (auto-set by quality)
}

/**
 * Video export progress information
 */
export interface VideoExportProgress {
  status: ExportStatus;
  progress: number; // 0-100
  currentPhase: 'preparation' | 'recording' | 'processing' | 'encoding';
  message: string;
  error?: string;
}

/**
 * Video export result
 */
export interface VideoExportResult {
  id: string;
  projectId: string;
  fileName: string;
  fileSize: number; // bytes
  duration: number; // seconds
  quality: VideoQuality;
  createdAt: number;
  downloadUrl?: string;
}
