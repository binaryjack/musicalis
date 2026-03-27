import { useState, useCallback, useEffect } from 'react';

export interface ScreenSize {
  width: number;
  height: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop' | 'ultrawide';
  orientation: 'portrait' | 'landscape';
}

export interface LayoutConfig {
  showSidebar: boolean;
  sidebarWidth: number;
  headerHeight: number;
  footerHeight: number;
  contentPadding: number;
  isCompact: boolean;
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
  ultrawide: 1920
} as const;

function getBreakpoint(width: number): ScreenSize['breakpoint'] {
  if (width < BREAKPOINTS.mobile) return 'mobile';
  if (width < BREAKPOINTS.tablet) return 'tablet';
  if (width < BREAKPOINTS.desktop) return 'desktop';
  return 'ultrawide';
}

const DEFAULT_LAYOUTS = {
  mobile: {
    showSidebar: false,
    sidebarWidth: 0,
    headerHeight: 60,
    footerHeight: 0,
    contentPadding: 8,
    isCompact: true
  },
  tablet: {
    showSidebar: true,
    sidebarWidth: 240,
    headerHeight: 70,
    footerHeight: 40,
    contentPadding: 12,
    isCompact: true
  },
  desktop: {
    showSidebar: true,
    sidebarWidth: 300,
    headerHeight: 80,
    footerHeight: 50,
    contentPadding: 16,
    isCompact: false
  },
  ultrawide: {
    showSidebar: true,
    sidebarWidth: 350,
    headerHeight: 90,
    footerHeight: 60,
    contentPadding: 24,
    isCompact: false
  }
} as const;

export function useResponsiveLayout() {
  const [screenSize, setScreenSize] = useState<ScreenSize>(() => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    return {
      width,
      height,
      breakpoint: getBreakpoint(width),
      orientation: width > height ? 'landscape' : 'portrait'
    };
  });
  
  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>(() => 
    DEFAULT_LAYOUTS[getBreakpoint(window.innerWidth)]
  );
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const breakpoint = getBreakpoint(width);
      const orientation = width > height ? 'landscape' : 'portrait';
      
      setScreenSize({ width, height, breakpoint, orientation });
      setLayoutConfig(DEFAULT_LAYOUTS[breakpoint]);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const toggleSidebar = useCallback(() => {
    setLayoutConfig(prev => ({ ...prev, showSidebar: !prev.showSidebar }));
  }, []);
  
  const updateLayout = useCallback((updates: Partial<LayoutConfig>) => {
    setLayoutConfig(prev => ({ ...prev, ...updates }));
  }, []);
  
  return {
    screenSize,
    layoutConfig,
    toggleSidebar,
    updateLayout,
    isMobile: screenSize.breakpoint === 'mobile',
    isTablet: screenSize.breakpoint === 'tablet',
    isDesktop: screenSize.breakpoint === 'desktop',
    isUltrawide: screenSize.breakpoint === 'ultrawide',
    isPortrait: screenSize.orientation === 'portrait',
    isLandscape: screenSize.orientation === 'landscape'
  };
}