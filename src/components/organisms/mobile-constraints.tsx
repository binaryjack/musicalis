import React from 'react';
import { useMobileConstraints } from '../../hooks/useMobileConstraints';
import { MobileConstraintsContext } from '../../hooks/MobileConstraintsContext';

export const MobileConstraintsProvider = function({ children }: { children: React.ReactNode }) {
  const constraints = useMobileConstraints();
  
  return (
    <MobileConstraintsContext.Provider value={constraints}>
      {children}
    </MobileConstraintsContext.Provider>
  );
};

export const MobileWarningDisplay = function() {
  const constraints = useMobileConstraints();
  const activeWarnings = constraints.warnings;
  
  if (activeWarnings.length === 0) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      zIndex: 1000,
      maxWidth: 350
    }}>
      {activeWarnings.map((warning, index) => (
        <div
          key={index}
          style={{
            backgroundColor: 
              warning.severity === 'error' ? '#f8d7da' :
              warning.severity === 'warning' ? '#fff3cd' : '#d1ecf1',
            color: 
              warning.severity === 'error' ? '#721c24' :
              warning.severity === 'warning' ? '#856404' : '#0c5460',
            border: `1px solid ${
              warning.severity === 'error' ? '#f5c6cb' :
              warning.severity === 'warning' ? '#ffeaa7' : '#bee5eb'
            }`,
            borderRadius: 8,
            padding: 12,
            marginBottom: 8,
            fontSize: 13,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}
        >
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: 4
          }}>
            <div style={{ fontWeight: 'bold' }}>
              {warning.severity === 'error' ? '⚠️' : warning.severity === 'warning' ? '⚡' : 'ℹ️'} {warning.type.toUpperCase()}
            </div>
            <button
              onClick={() => constraints.dismissWarning(warning.message)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontSize: 16,
                padding: 0,
                marginLeft: 8
              }}
            >
              ✕
            </button>
          </div>
          
          <div style={{ marginBottom: 6 }}>
            {warning.message}
          </div>
          
          {warning.recommendation && (
            <div style={{ 
              fontSize: 11, 
              opacity: 0.8,
              fontStyle: 'italic'
            }}>
              💡 {warning.recommendation}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};