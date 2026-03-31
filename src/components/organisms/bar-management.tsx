import { useState, useCallback, useMemo } from 'react';
import type { MusicComposition, Bar, TimeSignature, KeySignature } from '../../types/musicTypes';

export interface BarManagementProps {
  composition: MusicComposition;
  onBarsChange: (bars: Bar[]) => void;
  onTimeSignatureChange: (barIndex: number, timeSignature: TimeSignature) => void;
  onKeySignatureChange: (barIndex: number, keySignature: KeySignature) => void;
  selectedBarIndex?: number;
  onBarSelect: (barIndex: number) => void;
}

const COMMON_TIME_SIGNATURES = [
  { numerator: 4, denominator: 4 },
  { numerator: 3, denominator: 4 },
  { numerator: 2, denominator: 4 },
  { numerator: 6, denominator: 8 },
  { numerator: 9, denominator: 8 },
  { numerator: 12, denominator: 8 }
];

const COMMON_KEY_SIGNATURES = [
  { key: 'C', mode: 'major' as const, sharps: 0, flats: 0 },
  { key: 'G', mode: 'major' as const, sharps: 1, flats: 0 },
  { key: 'D', mode: 'major' as const, sharps: 2, flats: 0 },
  { key: 'A', mode: 'major' as const, sharps: 3, flats: 0 },
  { key: 'E', mode: 'major' as const, sharps: 4, flats: 0 },
  { key: 'B', mode: 'major' as const, sharps: 5, flats: 0 },
  { key: 'F#', mode: 'major' as const, sharps: 6, flats: 0 },
  { key: 'F', mode: 'major' as const, sharps: 0, flats: 1 },
  { key: 'Bb', mode: 'major' as const, sharps: 0, flats: 2 },
  { key: 'Eb', mode: 'major' as const, sharps: 0, flats: 3 },
  { key: 'Ab', mode: 'major' as const, sharps: 0, flats: 4 },
  { key: 'Db', mode: 'major' as const, sharps: 0, flats: 5 },
  { key: 'Gb', mode: 'major' as const, sharps: 0, flats: 6 }
];

export const BarManagement = function(props: BarManagementProps) {
  const [showTimeSignatureDialog, setShowTimeSignatureDialog] = useState(false);
  const [showKeySignatureDialog, setShowKeySignatureDialog] = useState(false);
  const [showBarActions, setShowBarActions] = useState(false);
  const [draggedBarIndex, setDraggedBarIndex] = useState<number | null>(null);
  const [customTimeSignature, setCustomTimeSignature] = useState<TimeSignature>({ 
    beatsPerMeasure: 4, 
    beatValue: 4, 
    display: '4/4' 
  });
  
  const bars = useMemo(() => props.composition?.bars || [], [props.composition?.bars]);
  
  const handleBarDragStart = useCallback((barIndex: number) => {
    setDraggedBarIndex(barIndex);
  }, []);
  
  const handleBarDrop = useCallback((targetIndex: number) => {
    if (draggedBarIndex === null || draggedBarIndex === targetIndex) return;
    
    const newBars = [...bars];
    const draggedBar = newBars[draggedBarIndex];
    newBars.splice(draggedBarIndex, 1);
    newBars.splice(targetIndex, 0, draggedBar);
    
    // Renumber bars
    newBars.forEach((bar, index) => {
      bar.number = index + 1;
    });
    
    props.onBarsChange(newBars);
    setDraggedBarIndex(null);
  }, [draggedBarIndex, bars, props]);
  
  const handleAddBar = useCallback((insertIndex?: number) => {
    const newBar: Bar = {
      id: `bar_${Date.now()}_${Math.random()}`,
      number: (insertIndex || bars.length) + 1,
      timeSignature: { numerator: 4, denominator: 4 },
      keySignature: { key: 'C', mode: 'major', sharps: 0, flats: 0 },
      duration: 240, // 4 quarter notes in ticks
      notes: [],
      isEmpty: true,
      isRepeatable: false
    };
    
    const newBars = [...bars];
    const targetIndex = insertIndex !== undefined ? insertIndex : bars.length;
    newBars.splice(targetIndex, 0, newBar);
    
    // Renumber bars
    newBars.forEach((bar, index) => {
      bar.number = index + 1;
    });
    
    props.onBarsChange(newBars);
  }, [bars, props]);
  
  const handleDeleteBar = useCallback((barIndex: number) => {
    if (bars.length <= 1) return; // Don't delete the last bar
    
    const newBars = bars.filter((_: Bar, index: number) => index !== barIndex);
    
    // Renumber bars
    newBars.forEach((bar, index) => {
      bar.number = index + 1;
    });
    
    props.onBarsChange(newBars);
    
    // Adjust selected bar index
    if (props.selectedBarIndex === barIndex && props.selectedBarIndex > 0) {
      props.onBarSelect(props.selectedBarIndex - 1);
    }
  }, [bars, props]);
  
  const handleDuplicateBar = useCallback((barIndex: number) => {
    const barToDuplicate = bars[barIndex];
    const duplicatedBar: Bar = {
      ...barToDuplicate,
      id: `bar_${Date.now()}_${Math.random()}`,
      number: barIndex + 2
    };
    
    const newBars = [...bars];
    newBars.splice(barIndex + 1, 0, duplicatedBar);
    
    // Renumber bars
    newBars.forEach((bar, index) => {
      bar.number = index + 1;
    });
    
    props.onBarsChange(newBars);
  }, [bars, props]);
  
  const formatTimeSignature = (ts: TimeSignature) => {
    return `${ts.numerator}/${ts.denominator}`;
  };
  
  const formatKeySignature = (ks: KeySignature) => {
    const accidentalCount = ks.sharps > 0 ? `${ks.sharps}♯` : ks.flats > 0 ? `${ks.flats}♭` : '';
    return `${ks.key}${ks.mode === 'minor' ? 'm' : ''} ${accidentalCount}`.trim();
  };

  // Helper functions for string-based signatures
  const displayTimeSignature = (ts: string | TimeSignature | undefined) => {
    if (!ts) return '4/4';
    if (typeof ts === 'string') return ts;
    return formatTimeSignature(ts);
  };

  const displayKeySignature = (ks: string | KeySignature | undefined) => {
    if (!ks) return 'C major';
    if (typeof ks === 'string') return ks;
    return formatKeySignature(ks);
  };
  
  const getBarTypeIcon = (bar: Bar) => {
    if (bar.isEmpty) return '⬜';
    if (bar.isRepeatable) return '🔄';
    return '🎵';
  };
  
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: 8,
      padding: 12
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
      }}>
        <h4 style={{ 
          margin: 0, 
          fontSize: 14, 
          fontWeight: 'bold',
          color: '#495057'
        }}>
          📊 Bar Management ({bars.length} bars)
        </h4>
        
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleAddBar()}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              border: '1px solid #28a745',
              borderRadius: 4,
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            ➕ Add Bar
          </button>
          
          <button
            onClick={() => setShowBarActions(!showBarActions)}
            style={{
              padding: '4px 8px',
              fontSize: 12,
              border: '1px solid #6c757d',
              borderRadius: 4,
              backgroundColor: showBarActions ? '#6c757d' : '#fff',
              color: showBarActions ? 'white' : '#6c757d',
              cursor: 'pointer'
            }}
          >
            ⚙️ Tools
          </button>
        </div>
      </div>
      
      {/* Bar Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
        gap: 8,
        marginBottom: 12
      }}>
        {bars.map((bar: Bar, index: number) => (
          <div
            key={bar.id}
            draggable
            onDragStart={() => handleBarDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleBarDrop(index)}
            onClick={() => props.onBarSelect(index)}
            style={{
              padding: 8,
              border: props.selectedBarIndex === index ? '2px solid #007bff' : '1px solid #dee2e6',
              borderRadius: 6,
              backgroundColor: props.selectedBarIndex === index ? '#e3f2fd' : '#fff',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              opacity: draggedBarIndex === index ? 0.5 : 1
            }}
          >
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 4
            }}>
              <span style={{ fontSize: 11, fontWeight: 'bold', color: '#495057' }}>
                {getBarTypeIcon(bar)} #{bar.number}
              </span>
              <span style={{ fontSize: 10, color: '#6c757d' }}>
                🕐 {((bar.duration || 240) / 60).toFixed(1)}s
              </span>
            </div>
            
            <div style={{ fontSize: 10, color: '#6c757d', marginBottom: 4 }}>
              <div>⏱️ {displayTimeSignature(bar.timeSignature)}</div>
              <div>🎼 {displayKeySignature(bar.keySignature)}</div>
            </div>
            
            <div style={{
              height: 20,
              backgroundColor: '#e9ecef',
              borderRadius: 2,
              position: 'relative',
              overflow: 'hidden'
            }}>
              {/* Note density visualization */}
              <div style={{
                width: `${Math.min((bar.notes.length / 16) * 100, 100)}%`,
                height: '100%',
                backgroundColor: bar.isEmpty ? '#6c757d' : '#28a745',
                transition: 'width 0.3s ease'
              }} />
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 9,
                color: '#fff',
                textShadow: '0 1px 2px rgba(0,0,0,0.5)'
              }}>
                {bar.notes.length} notes
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Bar Actions Panel */}
      {showBarActions && props.selectedBarIndex !== undefined && (
        <div style={{
          padding: 12,
          backgroundColor: '#e9ecef',
          borderRadius: 6,
          marginTop: 12
        }}>
          <h5 style={{ 
            margin: '0 0 8px 0', 
            fontSize: 12, 
            fontWeight: 'bold' 
          }}>
            Bar #{bars[props.selectedBarIndex]?.number} Actions:
          </h5>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', 
            gap: 6 
          }}>
            <button
              onClick={() => setShowTimeSignatureDialog(true)}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                border: '1px solid #17a2b8',
                borderRadius: 3,
                backgroundColor: '#17a2b8',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              ⏱️ Time Sig
            </button>
            
            <button
              onClick={() => setShowKeySignatureDialog(true)}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                border: '1px solid #6f42c1',
                borderRadius: 3,
                backgroundColor: '#6f42c1',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              🎼 Key Sig
            </button>
            
            <button
              onClick={() => handleDuplicateBar(props.selectedBarIndex!)}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                border: '1px solid #fd7e14',
                borderRadius: 3,
                backgroundColor: '#fd7e14',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              📄 Duplicate
            </button>
            
            <button
              onClick={() => handleAddBar(props.selectedBarIndex! + 1)}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                border: '1px solid #28a745',
                borderRadius: 3,
                backgroundColor: '#28a745',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              ➕ Insert
            </button>
            
            <button
              onClick={() => handleDeleteBar(props.selectedBarIndex!)}
              disabled={bars.length <= 1}
              style={{
                padding: '6px 8px',
                fontSize: 11,
                border: '1px solid #dc3545',
                borderRadius: 3,
                backgroundColor: bars.length <= 1 ? '#6c757d' : '#dc3545',
                color: 'white',
                cursor: bars.length <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              🗑️ Delete
            </button>
          </div>
        </div>
      )}
      
      {/* Time Signature Dialog */}
      {showTimeSignatureDialog && props.selectedBarIndex !== undefined && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: 300
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>
            Change Time Signature - Bar #{bars[props.selectedBarIndex].number}
          </h4>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Common Time Signatures:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
              {COMMON_TIME_SIGNATURES.map((ts) => (
                <button
                  key={`${ts.numerator}/${ts.denominator}`}
                  onClick={() => props.onTimeSignatureChange(props.selectedBarIndex!, ts)}
                  style={{
                    padding: 8,
                    fontSize: 12,
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {formatTimeSignature(ts)}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Custom Time Signature:
            </label>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                min="1"
                max="16"
                value={customTimeSignature.numerator}
                onChange={(e) => setCustomTimeSignature({
                  ...customTimeSignature,
                  numerator: parseInt(e.target.value) || 1
                })}
                style={{ width: 60, padding: 4, fontSize: 12 }}
              />
              <span>/</span>
              <select
                value={customTimeSignature.denominator}
                onChange={(e) => setCustomTimeSignature({
                  ...customTimeSignature,
                  denominator: parseInt(e.target.value)
                })}
                style={{ width: 60, padding: 4, fontSize: 12 }}
              >
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="4">4</option>
                <option value="8">8</option>
                <option value="16">16</option>
              </select>
              <button
                onClick={() => props.onTimeSignatureChange(props.selectedBarIndex!, customTimeSignature)}
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  border: '1px solid #007bff',
                  borderRadius: 4,
                  backgroundColor: '#007bff',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                Apply
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowTimeSignatureDialog(false)}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                border: '1px solid #6c757d',
                borderRadius: 4,
                backgroundColor: '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Key Signature Dialog */}
      {showKeySignatureDialog && props.selectedBarIndex !== undefined && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1000,
          backgroundColor: 'white',
          border: '1px solid #dee2e6',
          borderRadius: 8,
          padding: 20,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          width: 400
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: 14 }}>
            Change Key Signature - Bar #{bars[props.selectedBarIndex].number}
          </h4>
          
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 12 }}>
              Major Keys:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
              {COMMON_KEY_SIGNATURES.filter(ks => ks.mode === 'major').map((ks) => (
                <button
                  key={`${ks.key}-${ks.mode}`}
                  onClick={() => props.onKeySignatureChange(props.selectedBarIndex!, ks)}
                  style={{
                    padding: 6,
                    fontSize: 11,
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    backgroundColor: '#fff',
                    cursor: 'pointer'
                  }}
                >
                  {formatKeySignature(ks)}
                </button>
              ))}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowKeySignatureDialog(false)}
              style={{
                padding: '8px 16px',
                fontSize: 12,
                border: '1px solid #6c757d',
                borderRadius: 4,
                backgroundColor: '#6c757d',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Modal backdrop */}
      {(showTimeSignatureDialog || showKeySignatureDialog) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 999
          }}
          onClick={() => {
            setShowTimeSignatureDialog(false);
            setShowKeySignatureDialog(false);
          }}
        />
      )}
    </div>
  );
};