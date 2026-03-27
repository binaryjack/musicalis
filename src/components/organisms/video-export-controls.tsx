import { useState, useCallback } from 'react';

export interface VideoExportControlsProps {
  onExportStart: (options: VideoExportOptions) => void;
  onExportCancel: () => void;
  isExporting?: boolean;
  progress?: number;
  estimatedTimeRemaining?: number;
}

export interface VideoExportOptions {
  format: 'mp4' | 'webm' | 'avi';
  quality: 'draft' | 'mid' | 'hi-res';
  audioSampleRate: number;
  videoBitrate: number;
  resolution: { width: number; height: number };
  includeMetadata: boolean;
  showNoteColors: boolean;
  showPlayhead: boolean;
}

const EXPORT_PRESETS = {
  'youtube-hd': {
    name: 'YouTube HD',
    format: 'mp4' as const,
    quality: 'mid' as const,
    audioSampleRate: 44100,
    videoBitrate: 5000,
    resolution: { width: 1920, height: 1080 },
    includeMetadata: true,
    showNoteColors: true,
    showPlayhead: true
  },
  'social-media': {
    name: 'Social Media',
    format: 'mp4' as const,
    quality: 'draft' as const,
    audioSampleRate: 22050,
    videoBitrate: 2500,
    resolution: { width: 1280, height: 720 },
    includeMetadata: false,
    showNoteColors: true,
    showPlayhead: true
  },
  'high-quality': {
    name: 'High Quality',
    format: 'mp4' as const,
    quality: 'hi-res' as const,
    audioSampleRate: 48000,
    videoBitrate: 8000,
    resolution: { width: 2560, height: 1440 },
    includeMetadata: true,
    showNoteColors: true,
    showPlayhead: true
  }
} as const;

export const VideoExportControls = function(props: VideoExportControlsProps) {
  const [options, setOptions] = useState<VideoExportOptions>(EXPORT_PRESETS['youtube-hd']);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('youtube-hd');
  const [estimatedSize, setEstimatedSize] = useState(0);
  
  const calculateEstimatedSize = useCallback((opts: VideoExportOptions) => {
    // Rough estimation based on bitrate and typical duration
    const durationMinutes = 3; // Assume 3-minute composition
    const audioSizeMB = (opts.audioSampleRate / 1000) * durationMinutes * 0.125; // Rough audio size
    const videoSizeMB = (opts.videoBitrate / 8000) * 60 * durationMinutes; // Video size
    return audioSizeMB + videoSizeMB;
  }, []);
  
  const handlePresetChange = (presetKey: string) => {
    const preset = EXPORT_PRESETS[presetKey as keyof typeof EXPORT_PRESETS];
    setOptions(preset);
    setSelectedPreset(presetKey);
    setEstimatedSize(calculateEstimatedSize(preset));
  };
  
  const handleOptionChange = (key: keyof VideoExportOptions, value: unknown) => {
    const newOptions = { ...options, [key]: value };
    setOptions(newOptions);
    setSelectedPreset('custom');
    setEstimatedSize(calculateEstimatedSize(newOptions));
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div style={{
      width: 400,
      backgroundColor: '#fff',
      border: '1px solid #dee2e6',
      borderRadius: 8,
      padding: 20,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <h3 style={{ 
        margin: '0 0 16px 0', 
        fontSize: 18, 
        fontWeight: 'bold',
        color: '#343a40'
      }}>
        📹 Export to Video
      </h3>
      
      {/* Export Progress */}
      {props.isExporting && (
        <div style={{
          marginBottom: 16,
          padding: 12,
          backgroundColor: '#e3f2fd',
          borderRadius: 6,
          border: '1px solid #2196f3'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 8,
            fontSize: 12
          }}>
            <span>Exporting...</span>
            <span>{(props.progress || 0).toFixed(0)}%</span>
          </div>
          
          <div style={{
            width: '100%',
            height: 8,
            backgroundColor: '#e0e0e0',
            borderRadius: 4,
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${props.progress || 0}%`,
              height: '100%',
              backgroundColor: '#2196f3',
              transition: 'width 0.3s ease'
            }} />
          </div>
          
          {props.estimatedTimeRemaining && (
            <div style={{
              marginTop: 6,
              fontSize: 11,
              color: '#666',
              textAlign: 'center'
            }}>
              Time remaining: {formatTime(props.estimatedTimeRemaining)}
            </div>
          )}
          
          <button
            onClick={props.onExportCancel}
            style={{
              width: '100%',
              marginTop: 8,
              padding: '6px 12px',
              fontSize: 12,
              border: 'none',
              borderRadius: 4,
              backgroundColor: '#dc3545',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            Cancel Export
          </button>
        </div>
      )}
      
      {!props.isExporting && (
        <>
          {/* Preset Selection */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 6, 
              fontSize: 13, 
              fontWeight: 'bold' 
            }}>
              Quick Presets:
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr',
              gap: 6
            }}>
              {Object.entries(EXPORT_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => handlePresetChange(key)}
                  style={{
                    padding: 8,
                    fontSize: 12,
                    border: selectedPreset === key ? '2px solid #007bff' : '1px solid #dee2e6',
                    borderRadius: 4,
                    backgroundColor: selectedPreset === key ? '#e3f2fd' : '#fff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: 'bold' }}>{preset.name}</div>
                  <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                    {preset.resolution.width}×{preset.resolution.height} • {preset.videoBitrate}k • {preset.audioSampleRate/1000}kHz
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Advanced Settings Toggle */}
          <div style={{ marginBottom: 16 }}>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                width: '100%',
                padding: 8,
                fontSize: 12,
                border: '1px solid #6c757d',
                borderRadius: 4,
                backgroundColor: '#f8f9fa',
                cursor: 'pointer'
              }}
            >
              ⚙️ Advanced Settings {showAdvanced ? '▲' : '▼'}
            </button>
          </div>
          
          {showAdvanced && (
            <div style={{
              marginBottom: 16,
              padding: 12,
              backgroundColor: '#f8f9fa',
              borderRadius: 6,
              fontSize: 12
            }}>
              {/* Format Selection */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  Format:
                </label>
                <select
                  value={options.format}
                  onChange={(e) => handleOptionChange('format', e.target.value)}
                  style={{ width: '100%', padding: 4, fontSize: 11 }}
                >
                  <option value="mp4">MP4 (Recommended)</option>
                  <option value="webm">WebM</option>
                  <option value="avi">AVI</option>
                </select>
              </div>
              
              {/* Resolution */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  Resolution:
                </label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={options.resolution.width}
                    onChange={(e) => handleOptionChange('resolution', { 
                      ...options.resolution, 
                      width: parseInt(e.target.value) 
                    })}
                    style={{ width: 80, padding: 4, fontSize: 11 }}
                  />
                  <span>×</span>
                  <input
                    type="number"
                    value={options.resolution.height}
                    onChange={(e) => handleOptionChange('resolution', { 
                      ...options.resolution, 
                      height: parseInt(e.target.value) 
                    })}
                    style={{ width: 80, padding: 4, fontSize: 11 }}
                  />
                </div>
              </div>
              
              {/* Video Bitrate */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  Video Bitrate: {options.videoBitrate}k
                </label>
                <input
                  type="range"
                  min="1000"
                  max="15000"
                  step="500"
                  value={options.videoBitrate}
                  onChange={(e) => handleOptionChange('videoBitrate', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
              
              {/* Audio Sample Rate */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 4, fontWeight: 'bold' }}>
                  Audio Sample Rate:
                </label>
                <select
                  value={options.audioSampleRate}
                  onChange={(e) => handleOptionChange('audioSampleRate', parseInt(e.target.value))}
                  style={{ width: '100%', padding: 4, fontSize: 11 }}
                >
                  <option value="22050">22.05 kHz (Draft)</option>
                  <option value="44100">44.1 kHz (CD Quality)</option>
                  <option value="48000">48 kHz (Professional)</option>
                </select>
              </div>
              
              {/* Visual Options */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ marginBottom: 6, fontWeight: 'bold', display: 'block' }}>
                  Visual Options:
                </label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={options.showNoteColors}
                      onChange={(e) => handleOptionChange('showNoteColors', e.target.checked)}
                    />
                    Show Note Colors
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={options.showPlayhead}
                      onChange={(e) => handleOptionChange('showPlayhead', e.target.checked)}
                    />
                    Show Playhead
                  </label>
                  
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="checkbox"
                      checked={options.includeMetadata}
                      onChange={(e) => handleOptionChange('includeMetadata', e.target.checked)}
                    />
                    Include Metadata
                  </label>
                </div>
              </div>
            </div>
          )}
          
          {/* Estimated File Size */}
          <div style={{
            marginBottom: 16,
            padding: 10,
            backgroundColor: '#e9ecef',
            borderRadius: 4,
            fontSize: 12
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Estimated file size:</span>
              <span style={{ fontWeight: 'bold' }}>
                {estimatedSize.toFixed(1)} MB
              </span>
            </div>
            <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
              Based on 3-minute composition
            </div>
          </div>
          
          {/* Export Button */}
          <button
            onClick={() => props.onExportStart(options)}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 14,
              fontWeight: 'bold',
              border: 'none',
              borderRadius: 6,
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🎬 Start Export
          </button>
        </>
      )}
    </div>
  );
};