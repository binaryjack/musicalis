import type { VideoExportOptions } from '../components/organisms/video-export-controls';

export interface VideoExportService {
  exportVideo: (options: VideoExportOptions, onProgress: (progress: number) => void) => Promise<Blob>;
  cancelExport: () => void;
  isExporting: boolean;
}

export const createVideoExportService = function(): VideoExportService {
  let isCurrentlyExporting = false;
  let shouldCancel = false;
  
  const delay = function(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  };
  
  const exportVideo = async function(
    options: VideoExportOptions, 
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    if (isCurrentlyExporting) {
      throw new Error('Export already in progress');
    }
    
    isCurrentlyExporting = true;
    shouldCancel = false;
    
    try {
      // Mock export process
      onProgress(0);
      await delay(200);
      
      if (shouldCancel) throw new Error('Export cancelled');
      onProgress(25);
      await delay(300);
      
      if (shouldCancel) throw new Error('Export cancelled');
      onProgress(50);
      await delay(400);
      
      if (shouldCancel) throw new Error('Export cancelled');
      onProgress(75);
      await delay(300);
      
      if (shouldCancel) throw new Error('Export cancelled');
      onProgress(100);
      
      // Create mock video blob
      const mockVideoData = new ArrayBuffer(1024 * 1024); // 1MB
      return new Blob([mockVideoData], { type: `video/${options.format}` });
      
    } finally {
      isCurrentlyExporting = false;
    }
  };
  
  const cancelExport = function() {
    shouldCancel = true;
  };
  
  return Object.freeze({
    exportVideo,
    cancelExport,
    get isExporting() { return isCurrentlyExporting; }
  });
};

export const videoExportService = createVideoExportService();

// Utility functions
export const videoExportUtils = {
  estimateFileSize: (options: VideoExportOptions, durationSeconds: number) => {
    const videoBitrateBps = options.videoBitrate * 1000;
    const audioBitrateBps = options.audioSampleRate * 16 * 2;
    const totalBitrateBps = videoBitrateBps + audioBitrateBps;
    return (totalBitrateBps * durationSeconds) / 8;
  },
  
  getSupportedFormats: () => {
    const video = document.createElement('video');
    return {
      mp4: video.canPlayType('video/mp4') !== '',
      webm: video.canPlayType('video/webm') !== '',
      avi: false
    };
  }
};