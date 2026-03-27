import { useState, useCallback } from 'react';

export interface DeviceCapabilities {
  memoryLimit: number; // in MB
  processingPower: 'low' | 'medium' | 'high';
  touchSupported: boolean;
  screenSize: 'small' | 'medium' | 'large';
  networkConnection: 'none' | 'slow' | 'fast';
  audioLatency: number; // in milliseconds
}

export interface MobileConstraints {
  maxStaves: number;
  maxNotesPerStaff: number;
  audioBufferSize: number;
  renderingQuality: 'draft' | 'standard' | 'high';
  enabledFeatures: string[];
  disabledFeatures: string[];
}

export interface DeviceWarning {
  type: 'memory' | 'performance' | 'feature' | 'network';
  severity: 'info' | 'warning' | 'error';
  message: string;
  recommendation?: string;
  canOverride: boolean;
}

interface NavigatorWithMemory extends Navigator {
  deviceMemory?: number;
  connection?: {
    effectiveType: string;
  };
}

const DEVICE_PROFILES = {
  desktop: {
    maxStaves: 16,
    maxNotesPerStaff: 1000,
    audioBufferSize: 4096,
    renderingQuality: 'high' as const,
    enabledFeatures: ['multi-staff', 'video-export', 'real-time-playback', 'advanced-effects'],
    disabledFeatures: []
  },
  tablet: {
    maxStaves: 8,
    maxNotesPerStaff: 500,
    audioBufferSize: 2048,
    renderingQuality: 'standard' as const,
    enabledFeatures: ['multi-staff', 'basic-playback', 'touch-controls'],
    disabledFeatures: ['video-export', 'advanced-effects']
  },
  mobile: {
    maxStaves: 4,
    maxNotesPerStaff: 200,
    audioBufferSize: 1024,
    renderingQuality: 'draft' as const,
    enabledFeatures: ['basic-editing', 'touch-controls'],
    disabledFeatures: ['multi-staff', 'video-export', 'real-time-playback', 'advanced-effects']
  }
} as const;

function detectDeviceCapabilities(): DeviceCapabilities {
  // Memory detection
  const nav = navigator as NavigatorWithMemory;
  const memoryInfo = nav.deviceMemory;
  const memoryLimit = memoryInfo ? memoryInfo * 1024 : 4096; // Default to 4GB if not available
  
  // Processing power estimation based on hardware concurrency and memory
  const cores = navigator.hardwareConcurrency || 4;
  const processingPower: DeviceCapabilities['processingPower'] = 
    cores >= 8 && memoryLimit >= 8192 ? 'high' :
    cores >= 4 && memoryLimit >= 4096 ? 'medium' : 'low';
  
  // Touch support
  const touchSupported = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Screen size categorization
  const screenWidth = window.screen.width;
  const screenSize: DeviceCapabilities['screenSize'] = 
    screenWidth < 768 ? 'small' :
    screenWidth < 1024 ? 'medium' : 'large';
  
  // Network connection (if available)
  const connection = nav.connection;
  const networkConnection: DeviceCapabilities['networkConnection'] = 
    !connection ? 'fast' :
    connection.effectiveType === '4g' ? 'fast' :
    connection.effectiveType === '3g' ? 'slow' : 'none';
  
  // Audio latency estimation (simplified)
  const audioLatency = touchSupported ? 150 : 50; // Mobile devices typically have higher latency
  
  return {
    memoryLimit,
    processingPower,
    touchSupported,
    screenSize,
    networkConnection,
    audioLatency
  };
}

function generateConstraints(capabilities: DeviceCapabilities): MobileConstraints {
  const deviceType = 
    capabilities.screenSize === 'large' && !capabilities.touchSupported ? 'desktop' :
    capabilities.screenSize === 'medium' && capabilities.memoryLimit >= 4096 ? 'tablet' : 'mobile';
  
  const baseConstraints = DEVICE_PROFILES[deviceType];
  
  // Apply memory-based adjustments
  const memoryMultiplier = Math.min(capabilities.memoryLimit / 4096, 2);
  
  return {
    maxStaves: Math.floor(baseConstraints.maxStaves * memoryMultiplier),
    maxNotesPerStaff: Math.floor(baseConstraints.maxNotesPerStaff * memoryMultiplier),
    audioBufferSize: baseConstraints.audioBufferSize,
    renderingQuality: baseConstraints.renderingQuality,
    enabledFeatures: [...baseConstraints.enabledFeatures],
    disabledFeatures: [...baseConstraints.disabledFeatures]
  };
}

function generateWarnings(capabilities: DeviceCapabilities, constraints: MobileConstraints): DeviceWarning[] {
  const warnings: DeviceWarning[] = [];
  
  // Memory warnings
  if (capabilities.memoryLimit < 2048) {
    warnings.push({
      type: 'memory',
      severity: 'error',
      message: 'Low device memory detected',
      recommendation: 'Consider using a device with more RAM for better performance',
      canOverride: false
    });
  } else if (capabilities.memoryLimit < 4096) {
    warnings.push({
      type: 'memory',
      severity: 'warning',
      message: 'Limited device memory may affect performance',
      recommendation: 'Reduce the number of staves and notes for smoother operation',
      canOverride: true
    });
  }
  
  // Performance warnings
  if (capabilities.processingPower === 'low') {
    warnings.push({
      type: 'performance',
      severity: 'warning',
      message: 'Limited processing power detected',
      recommendation: 'Some advanced features have been disabled to improve performance',
      canOverride: false
    });
  }
  
  // Feature limitations
  if (constraints.disabledFeatures.includes('video-export')) {
    warnings.push({
      type: 'feature',
      severity: 'info',
      message: 'Video export is not available on this device',
      recommendation: 'Use a desktop computer for video export functionality',
      canOverride: false
    });
  }
  
  // Audio latency warnings
  if (capabilities.audioLatency > 100) {
    warnings.push({
      type: 'performance',
      severity: 'warning',
      message: 'High audio latency detected',
      recommendation: 'Real-time playback may have noticeable delay',
      canOverride: true
    });
  }
  
  // Network warnings
  if (capabilities.networkConnection === 'slow') {
    warnings.push({
      type: 'network',
      severity: 'warning',
      message: 'Slow network connection detected',
      recommendation: 'Large project loads and saves may take longer',
      canOverride: false
    });
  }
  
  return warnings;
}

export function useMobileConstraints() {
  const [capabilities] = useState<DeviceCapabilities>(() => detectDeviceCapabilities());
  const [constraints] = useState<MobileConstraints>(() => generateConstraints(detectDeviceCapabilities()));
  const [warnings] = useState<DeviceWarning[]>(() => {
    const caps = detectDeviceCapabilities();
    const cons = generateConstraints(caps);
    return generateWarnings(caps, cons);
  });
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  
  const dismissWarning = useCallback((warningMessage: string) => {
    setDismissedWarnings(prev => new Set([...prev, warningMessage]));
  }, []);
  
  const isFeatureEnabled = useCallback((feature: string) => {
    return constraints.enabledFeatures.includes(feature);
  }, [constraints.enabledFeatures]);
  
  const isFeatureDisabled = useCallback((feature: string) => {
    return constraints.disabledFeatures.includes(feature);
  }, [constraints.disabledFeatures]);
  
  const getActiveWarnings = useCallback(() => {
    return warnings.filter(warning => !dismissedWarnings.has(warning.message));
  }, [warnings, dismissedWarnings]);
  
  return {
    capabilities,
    constraints,
    warnings: getActiveWarnings(),
    dismissWarning,
    isFeatureEnabled,
    isFeatureDisabled,
    isMobile: capabilities.screenSize === 'small' && capabilities.touchSupported,
    isTablet: capabilities.screenSize === 'medium' && capabilities.touchSupported,
    isDesktop: capabilities.screenSize === 'large' && !capabilities.touchSupported,
    hasLowMemory: capabilities.memoryLimit < 4096,
    hasSlowProcessor: capabilities.processingPower === 'low',
    hasHighLatency: capabilities.audioLatency > 100
  };
}

// Device capability detection utilities
export const deviceUtils = {
  isMobile: () => {
    const capabilities = detectDeviceCapabilities();
    return capabilities.screenSize === 'small' && capabilities.touchSupported;
  },
  
  isLowEndDevice: () => {
    const capabilities = detectDeviceCapabilities();
    return capabilities.memoryLimit < 4096 || capabilities.processingPower === 'low';
  },
  
  supportsAdvancedFeatures: () => {
    const capabilities = detectDeviceCapabilities();
    return capabilities.memoryLimit >= 8192 && capabilities.processingPower === 'high';
  },
  
  getRecommendedSettings: () => {
    const capabilities = detectDeviceCapabilities();
    return generateConstraints(capabilities);
  }
};