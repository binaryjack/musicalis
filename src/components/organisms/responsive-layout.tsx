import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';

export interface ResponsiveLayoutProps {
  children: React.ReactNode;
  sidebarContent?: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
}

export const ResponsiveLayout = function(props: ResponsiveLayoutProps) {
  const { screenSize, layoutConfig, toggleSidebar, isMobile } = useResponsiveLayout();
  
  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f8f9fa'
  };
  
  const headerStyle: React.CSSProperties = {
    height: layoutConfig.headerHeight,
    backgroundColor: '#343a40',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    padding: `0 ${layoutConfig.contentPadding}px`,
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    zIndex: 100
  };
  
  const mainStyle: React.CSSProperties = {
    flex: 1,
    display: 'flex',
    overflow: 'hidden'
  };
  
  const sidebarStyle: React.CSSProperties = {
    width: layoutConfig.showSidebar ? layoutConfig.sidebarWidth : 0,
    backgroundColor: '#495057',
    color: 'white',
    overflow: 'hidden',
    transition: 'width 0.3s ease',
    boxShadow: layoutConfig.showSidebar ? '2px 0 4px rgba(0,0,0,0.1)' : 'none'
  };
  
  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'auto',
    padding: layoutConfig.contentPadding,
    backgroundColor: '#ffffff'
  };
  
  const footerStyle: React.CSSProperties = {
    height: layoutConfig.footerHeight,
    backgroundColor: '#6c757d',
    color: 'white',
    display: layoutConfig.footerHeight > 0 ? 'flex' : 'none',
    alignItems: 'center',
    padding: `0 ${layoutConfig.contentPadding}px`,
    fontSize: layoutConfig.isCompact ? 12 : 14
  };
  
  return (
    <div style={containerStyle}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              style={{
                padding: 8,
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: 18
              }}
            >
              ☰
            </button>
          )}
          
          <div style={{ fontSize: layoutConfig.isCompact ? 16 : 20, fontWeight: 'bold' }}>
            🎵 Musicalist
          </div>
        </div>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Screen size indicator */}
          <div style={{
            fontSize: 11,
            backgroundColor: 'rgba(255,255,255,0.2)',
            padding: '2px 6px',
            borderRadius: 3
          }}>
            {screenSize.width}×{screenSize.height} ({screenSize.breakpoint})
          </div>
          
          {props.headerContent}
        </div>
      </header>
      
      {/* Main Content Area */}
      <main style={mainStyle}>
        {/* Sidebar */}
        {layoutConfig.showSidebar && (
          <aside style={sidebarStyle}>
            <div style={{ padding: layoutConfig.contentPadding }}>
              {/* Sidebar header */}
              <div style={{
                borderBottom: '1px solid rgba(255,255,255,0.2)',
                paddingBottom: 8,
                marginBottom: 12
              }}>
                <h3 style={{ 
                  margin: 0, 
                  fontSize: layoutConfig.isCompact ? 14 : 16,
                  fontWeight: 'bold'
                }}>
                  Tools & Settings
                </h3>
              </div>
              
              {props.sidebarContent}
            </div>
          </aside>
        )}
        
        {/* Content Area */}
        <section style={contentStyle}>
          {props.children}
        </section>
      </main>
      
      {/* Footer */}
      {layoutConfig.footerHeight > 0 && (
        <footer style={footerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div>
              Ready • {screenSize.breakpoint.charAt(0).toUpperCase() + screenSize.breakpoint.slice(1)} View
            </div>
            
            {props.footerContent}
          </div>
          
          <div style={{ marginLeft: 'auto', fontSize: 11, opacity: 0.8 }}>
            Layout: {layoutConfig.isCompact ? 'Compact' : 'Standard'}
          </div>
        </footer>
      )}
      
      {/* Mobile sidebar overlay */}
      {isMobile && layoutConfig.showSidebar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 150
          }}
          onClick={toggleSidebar}
        />
      )}
      
      {/* Mobile sidebar panel */}
      {isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: layoutConfig.showSidebar ? 0 : -280,
            width: 280,
            height: '100vh',
            backgroundColor: '#495057',
            color: 'white',
            transition: 'left 0.3s ease',
            zIndex: 200,
            overflow: 'auto',
            padding: layoutConfig.contentPadding,
            boxShadow: '2px 0 8px rgba(0,0,0,0.2)'
          }}
        >
          <div style={{
            borderBottom: '1px solid rgba(255,255,255,0.2)',
            paddingBottom: 8,
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 'bold' }}>
              Menu
            </h3>
            <button
              onClick={toggleSidebar}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontSize: 20
              }}
            >
              ✕
            </button>
          </div>
          
          {props.sidebarContent}
        </div>
      )}
    </div>
  );
};