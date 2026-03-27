import { useState, useEffect, useRef } from 'react';
import type { MemoryInfo } from '../../types/musicTypes';

export interface MemoryManagerProps {
  onMemoryWarning?: (level: 'warning' | 'critical') => void;
  onCleanupRequested?: () => void;
  'data-testid'?: string;
}

export const createMemoryManager = function() {
  let deviceMemory = 4; // Default fallback
  let maxCacheSize = 1024; // MB
  let currentCacheSize = 0;
  let bufferCache: Map<string, ArrayBuffer> = new Map();
  
  // Detect device memory if available
  if ('deviceMemory' in navigator) {
    deviceMemory = (navigator as any).deviceMemory;
  } else {
    // Fallback estimation based on performance
    deviceMemory = navigator.hardwareConcurrency > 8 ? 8 : 4;
  }
  
  maxCacheSize = Math.min(Math.floor(deviceMemory * 0.15 * 1024), 2048); // 15% of RAM, max 2GB
  
  const getMemoryInfo = function(): MemoryInfo {
    const totalMemoryMB = deviceMemory * 1024;
    const usedMemoryMB = currentCacheSize;
    const bufferCacheMB = currentCacheSize;
    const usagePercent = (currentCacheSize / maxCacheSize) * 100;
    
    let warningLevel: 'safe' | 'warning' | 'critical' = 'safe';
    if (usagePercent >= 90) warningLevel = 'critical';
    else if (usagePercent >= 85) warningLevel = 'warning';
    
    return {
      totalMemoryMB,
      usedMemoryMB,
      bufferCacheMB,
      maxCacheMB: maxCacheSize,
      usagePercent,
      warningLevel
    };
  };
  
  const addToCache = function(key: string, buffer: ArrayBuffer): boolean {
    const bufferSizeMB = buffer.byteLength / (1024 * 1024);
    
    if (currentCacheSize + bufferSizeMB > maxCacheSize) {
      // Cleanup oldest entries (LRU eviction)
      const entries = Array.from(bufferCache.entries());
      const toRemove = Math.ceil(entries.length * 0.3); // Remove 30%
      
      for (let i = 0; i < toRemove && bufferCache.size > 0; i++) {
        const [oldKey, oldBuffer] = entries[i];
        currentCacheSize -= oldBuffer.byteLength / (1024 * 1024);
        bufferCache.delete(oldKey);
      }
    }
    
    if (currentCacheSize + bufferSizeMB <= maxCacheSize) {
      bufferCache.set(key, buffer);
      currentCacheSize += bufferSizeMB;
      return true;
    }
    
    return false;
  };
  
  const clearCache = function(): void {
    bufferCache.clear();
    currentCacheSize = 0;
  };
  
  const preloadBuffer = function(key: string, audioData: Float32Array): Promise<boolean> {
    return new Promise((resolve) => {
      // Simulate audio buffer creation
      setTimeout(() => {
        const buffer = new ArrayBuffer(audioData.length * 4); // 32-bit float
        const success = addToCache(key, buffer);
        resolve(success);
      }, 10);
    });
  };
  
  return Object.freeze({
    getMemoryInfo,
    addToCache,
    clearCache,
    preloadBuffer,
    get currentCacheSize() { return currentCacheSize; },
    get maxCacheSize() { return maxCacheSize; },
    get deviceMemory() { return deviceMemory; }
  });
};

export const MemoryMonitor = function(props: MemoryManagerProps) {
  const [memoryInfo, setMemoryInfo] = useState<MemoryInfo | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const managerRef = useRef(createMemoryManager());
  const intervalRef = useRef<number | null>(null);
  
  useEffect(() => {
    const updateMemoryInfo = () => {
      const info = managerRef.current.getMemoryInfo();
      setMemoryInfo(info);
      
      // Trigger warnings
      if (props.onMemoryWarning) {
        if (info.warningLevel === 'critical' || info.warningLevel === 'warning') {
          props.onMemoryWarning(info.warningLevel);
        }
      }
    };
    
    // Initial update
    updateMemoryInfo();
    
    // Update every 5 seconds
    intervalRef.current = setInterval(updateMemoryInfo, 5000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [props]);
  
  if (!memoryInfo) return null;
  
  const getStatusColor = (level: string) => {
    switch (level) {
      case 'critical': return '#dc3545';
      case 'warning': return '#ffc107';
      default: return '#28a745';
    }
  };
  
  const getStatusIcon = (level: string) => {
    switch (level) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      default: return '✅';
    }
  };
  
  return (
    <div 
      data-testid={props['data-testid']}
      style={{
      position: 'fixed',
      top: 10,
      right: 10,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      border: `2px solid ${getStatusColor(memoryInfo.warningLevel)}`,
      borderRadius: 8,
      padding: isExpanded ? 15 : 8,
      minWidth: isExpanded ? 280 : 120,
      fontSize: '12px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      cursor: 'pointer'
    }} onClick={() => setIsExpanded(!isExpanded)}>
      {!isExpanded ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span>{getStatusIcon(memoryInfo.warningLevel)}</span>
          <span style={{ fontWeight: 'bold' }}>
            {memoryInfo.usagePercent.toFixed(0)}%
          </span>
        </div>
      ) : (
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 10,
            borderBottom: '1px solid #ddd',
            paddingBottom: 8
          }}>
            <span style={{ fontWeight: 'bold' }}>Memory Monitor</span>
            <span style={{ fontSize: 16 }}>{getStatusIcon(memoryInfo.warningLevel)}</span>
          </div>
          
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Buffer Cache:</span>
              <span>{memoryInfo.bufferCacheMB.toFixed(1)} MB</span>
            </div>
            <div style={{ 
              width: '100%', 
              height: 8, 
              backgroundColor: '#e9ecef', 
              borderRadius: 4, 
              marginTop: 4 
            }}>
              <div style={{
                width: `${memoryInfo.usagePercent}%`,
                height: '100%',
                backgroundColor: getStatusColor(memoryInfo.warningLevel),
                borderRadius: 4,
                transition: 'width 0.3s ease'
              }} />
            </div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              marginTop: 4,
              fontSize: 10,
              color: '#666'
            }}>
              <span>0 MB</span>
              <span>{memoryInfo.maxCacheMB} MB</span>
            </div>
          </div>
          
          <div style={{ fontSize: 10, color: '#666', marginBottom: 8 }}>
            <div>Device RAM: {memoryInfo.totalMemoryMB} MB</div>
            <div>Usage: {memoryInfo.usagePercent.toFixed(1)}%</div>
            <div>Status: {memoryInfo.warningLevel.toUpperCase()}</div>
          </div>
          
          {memoryInfo.warningLevel !== 'safe' && (
            <div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  managerRef.current.clearCache();
                  props.onCleanupRequested?.();
                }}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 10,
                  marginTop: 5
                }}
              >
                🗑️ Clear Cache
              </button>
            </div>
          )}
          
          <div style={{ 
            marginTop: 8, 
            fontSize: 9, 
            color: '#999',
            textAlign: 'center' 
          }}>
            Click to collapse
          </div>
        </div>
      )}
    </div>
  );
};