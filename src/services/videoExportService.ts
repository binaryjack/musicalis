import type { VideoExportOptions } from '../components/organisms/video-export-controls';

export interface VideoExportService {
  exportVideo: (options: VideoExportOptions, onProgress: (progress: number) => void) => Promise<Blob>;
  cancelExport: () => void;
  isExporting: boolean;
}

class VideoExportServiceImpl implements VideoExportService {
  private isCurrentlyExporting = false;
  private shouldCancel = false;
  
  get isExporting() {
    return this.isCurrentlyExporting;
  }
  
  async exportVideo(
    options: VideoExportOptions, 
    onProgress: (progress: number) => void
  ): Promise<Blob> {
    if (this.isCurrentlyExporting) {
      throw new Error('Export already in progress');
    }
    
    this.isCurrentlyExporting = true;
    this.shouldCancel = false;
    
    try {
      // Mock export process
      onProgress(0);
      await this.delay(200);
      
      if (this.shouldCancel) throw new Error('Export cancelled');
      onProgress(25);
      await this.delay(300);
      
      if (this.shouldCancel) throw new Error('Export cancelled');
      onProgress(50);
      await this.delay(400);
      
      if (this.shouldCancel) throw new Error('Export cancelled');
      onProgress(75);
      await this.delay(300);
      
      if (this.shouldCancel) throw new Error('Export cancelled');
      onProgress(100);
      
      // Create mock video blob
      const mockVideoData = new ArrayBuffer(1024 * 1024); // 1MB
      return new Blob([mockVideoData], { type: `video/${options.format}` });
      
    } finally {
      this.isCurrentlyExporting = false;
    }
  }
  
  cancelExport() {
    this.shouldCancel = true;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const videoExportService = new VideoExportServiceImpl();

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