import { useState, useEffect } from 'react';
import type { AudioQuality } from '../../types/musicTypes';

export interface AudioQualitySelectorProps {
  selectedQuality: AudioQuality;
  onQualityChange: (quality: AudioQuality) => void;
  memoryUsageMB?: number;
  onMemoryWarning?: (warning: string) => void;
}

const AUDIO_QUALITIES: AudioQuality[] = [
  {
    id: 'draft',
    name: 'Draft (22kHz)',
    sampleRate: 22050,
    bitRate: 128,
    memoryImpactMB: 2.5
  },
  {
    id: 'mid',
    name: 'Mid Quality (44.1kHz)',
    sampleRate: 44100,
    bitRate: 256,
    memoryImpactMB: 5.2
  },
  {
    id: 'hi-res',
    name: 'Hi-Res (48kHz)',
    sampleRate: 48000,
    bitRate: 320,
    memoryImpactMB: 6.8
  }
];

export const AudioQualitySelector = function(props: AudioQualitySelectorProps) {
  const [estimatedMemory, setEstimatedMemory] = useState(0);
  
  useEffect(() => {
    // Estimate total memory usage for current project
    const baseMemory = props.memoryUsageMB || 0;
    const qualityMemory = props.selectedQuality.memoryImpactMB;
    const bufferMemory = qualityMemory * 2; // Double buffering
    const total = baseMemory + qualityMemory + bufferMemory;
    
    setEstimatedMemory(total);
    
    // Check for memory warnings
    if (total > 500 && props.onMemoryWarning) {
      props.onMemoryWarning(`High memory usage: ${total.toFixed(0)}MB. Consider lowering quality.`);
    }
  }, [props.selectedQuality, props.memoryUsageMB, props.onMemoryWarning]);
  
  const handleQualityChange = (quality: AudioQuality) => {
    props.onQualityChange(quality);
  };
  
  const getQualityColor = (quality: AudioQuality) => {
    if (quality.memoryImpactMB > 6) return '#dc3545'; // Red
    if (quality.memoryImpactMB > 4) return '#ffc107'; // Yellow
    return '#28a745'; // Green
  };
  
  const getPerformanceIndicator = (quality: AudioQuality) => {
    if (quality.memoryImpactMB > 6) return '🔥'; // High performance needed
    if (quality.memoryImpactMB > 4) return '⚡'; // Medium performance
    return '🍃'; // Low performance
  };
  
  return (
    <div style={{
      padding: 15,
      border: '1px solid #ddd',
      borderRadius: 8,
      backgroundColor: '#f8f9fa'
    }}>
      <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 'bold' }}>
        Audio Quality
      </h4>
      
      <div style={{ marginBottom: 12 }}>
        {AUDIO_QUALITIES.map((quality) => (
          <div
            key={quality.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 8,
              marginBottom: 6,
              borderRadius: 6,
              backgroundColor: props.selectedQuality.id === quality.id ? '#e3f2fd' : '#fff',
              border: props.selectedQuality.id === quality.id ? '2px solid #2196f3' : '1px solid #ddd',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onClick={() => handleQualityChange(quality)}
          >
            <input
              type="radio"
              name="audioQuality"
              checked={props.selectedQuality.id === quality.id}
              onChange={() => handleQualityChange(quality)}
              style={{ marginRight: 8 }}
            />
            
            <div style={{ flex: 1 }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 6,
                marginBottom: 2
              }}>
                <span style={{ 
                  fontWeight: props.selectedQuality.id === quality.id ? 'bold' : 'normal',
                  fontSize: 13
                }}>
                  {quality.name}
                </span>
                <span style={{ fontSize: 14 }}>
                  {getPerformanceIndicator(quality)}
                </span>
              </div>
              
              <div style={{ 
                fontSize: 11, 
                color: '#666',
                display: 'flex',
                gap: 10
              }}>
                <span>{quality.bitRate}kbps</span>
                <span>•</span>
                <span style={{ color: getQualityColor(quality) }}>
                  {quality.memoryImpactMB.toFixed(1)}MB
                </span>
              </div>
            </div>
            
            <div style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: getQualityColor(quality),
              opacity: 0.7
            }} />
          </div>
        ))}
      </div>
      
      <div style={{
        padding: 8,
        backgroundColor: estimatedMemory > 500 ? '#fff3cd' : '#d1edff',
        borderRadius: 4,
        border: `1px solid ${estimatedMemory > 500 ? '#ffc107' : '#bee5eb'}`,
        fontSize: 11
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginBottom: 4
        }}>
          <span>Estimated Memory:</span>
          <span style={{ 
            fontWeight: 'bold',
            color: estimatedMemory > 500 ? '#856404' : '#0c5460'
          }}>
            {estimatedMemory.toFixed(0)}MB
          </span>
        </div>
        
        <div style={{ fontSize: 10, color: '#666' }}>
          <div>Base: {(props.memoryUsageMB || 0).toFixed(0)}MB</div>
          <div>Quality: {props.selectedQuality.memoryImpactMB.toFixed(1)}MB</div>
          <div>Buffer: {(props.selectedQuality.memoryImpactMB * 2).toFixed(1)}MB</div>
        </div>
        
        {estimatedMemory > 500 && (
          <div style={{
            marginTop: 6,
            padding: 4,
            backgroundColor: '#f8d7da',
            borderRadius: 3,
            fontSize: 10,
            color: '#721c24'
          }}>
            ⚠️ High memory usage may cause stuttering
          </div>
        )}
      </div>
    </div>
  );
};