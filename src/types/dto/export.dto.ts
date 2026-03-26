import { VideoQuality, VideoCodec, AudioCodec } from '../enums';

/**
 * DTO for video export request
 */
export interface VideoExportRequestDTO {
  projectId: string;
  quality: VideoQuality;
  videoCodec: VideoCodec;
  audioCodec: AudioCodec;
  includeMetronome: boolean;
  highlightCurrentNote: boolean;
  backgroundColor: string;
}

/**
 * DTO for video export response
 */
export interface VideoExportResponseDTO {
  id: string;
  status: string;
  downloadUrl: string;
  fileSize: number;
  duration: number;
}
