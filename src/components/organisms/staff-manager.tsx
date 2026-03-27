import { useState } from 'react';

export interface StaffManagerProps {
  staffs: Array<{
    id: string;
    name: string;
    clef: 'treble' | 'bass' | 'alto' | 'tenor';
    visible: boolean;
    muted: boolean;
    volume: number;
  }>;
  selectedStaffId?: string;
  maxStaffs?: number;
  onStaffAdd: (clef: 'treble' | 'bass' | 'alto' | 'tenor') => void;
  onStaffRemove: (staffId: string) => void;
  onStaffSelect: (staffId: string) => void;
  onStaffToggleVisibility: (staffId: string) => void;
  onStaffToggleMute: (staffId: string) => void;
  onStaffVolumeChange: (staffId: string, volume: number) => void;
  onStaffRename: (staffId: string, newName: string) => void;
}

export const StaffManager = function(props: StaffManagerProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [draggedStaffId, setDraggedStaffId] = useState<string | null>(null);
  const maxStaffs = props.maxStaffs || 16;
  
  const canAddStaff = props.staffs.length < maxStaffs;
  
  const handleAddStaff = (clef: 'treble' | 'bass' | 'alto' | 'tenor') => {
    if (canAddStaff) {
      props.onStaffAdd(clef);
    }
  };
  
  const getClefSymbol = (clef: string) => {
    switch (clef) {
      case 'treble': return '𝄞';
      case 'bass': return '𝄢';
      case 'alto': return '𝄡';
      case 'tenor': return '𝄡';
      default: return '𝄞';
    }
  };
  
  const getClefColor = (clef: string) => {
    switch (clef) {
      case 'treble': return '#e91e63';
      case 'bass': return '#3f51b5';
      case 'alto': return '#ff9800';
      case 'tenor': return '#4caf50';
      default: return '#e91e63';
    }
  };
  
  const handleDragStart = (staffId: string) => {
    setDraggedStaffId(staffId);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  const handleDrop = (targetStaffId: string) => {
    if (draggedStaffId && draggedStaffId !== targetStaffId) {
      // TODO: Implement staff reordering
      console.log(`Reorder staff ${draggedStaffId} to position of ${targetStaffId}`);
    }
    setDraggedStaffId(null);
  };
  
  return (
    <div style={{
      width: 280,
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: 8,
      overflow: 'hidden'
    }}>
      {/* Header */}
      <div 
        style={{
          padding: 12,
          backgroundColor: '#343a40',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 'bold' }}>
          Staffs ({props.staffs.length}/{maxStaffs})
        </h4>
        <span style={{ 
          fontSize: 12,
          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s ease'
        }}>
          ▼
        </span>
      </div>
      
      {isExpanded && (
        <div style={{ padding: 12 }}>
          {/* Add Staff Controls */}
          <div style={{ marginBottom: 15 }}>
            <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 'bold' }}>
              Add New Staff:
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr',
              gap: 6
            }}>
              {(['treble', 'bass', 'alto', 'tenor'] as const).map(clef => (
                <button
                  key={clef}
                  onClick={() => handleAddStaff(clef)}
                  disabled={!canAddStaff}
                  style={{
                    padding: '6px 8px',
                    fontSize: 11,
                    border: '1px solid #dee2e6',
                    borderRadius: 4,
                    backgroundColor: canAddStaff ? '#fff' : '#e9ecef',
                    color: canAddStaff ? getClefColor(clef) : '#6c757d',
                    cursor: canAddStaff ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    justifyContent: 'center'
                  }}
                >
                  <span style={{ fontSize: 14 }}>{getClefSymbol(clef)}</span>
                  <span style={{ textTransform: 'capitalize' }}>{clef}</span>
                </button>
              ))}
            </div>
            
            {!canAddStaff && (
              <div style={{
                marginTop: 6,
                padding: 6,
                backgroundColor: '#fff3cd',
                borderRadius: 3,
                fontSize: 10,
                color: '#856404',
                textAlign: 'center'
              }}>
                Maximum {maxStaffs} staffs reached
              </div>
            )}
          </div>
          
          {/* Staff List */}
          <div style={{ 
            maxHeight: 400, 
            overflowY: 'auto',
            border: '1px solid #dee2e6',
            borderRadius: 4
          }}>
            {props.staffs.length === 0 ? (
              <div style={{
                padding: 20,
                textAlign: 'center',
                fontSize: 12,
                color: '#6c757d'
              }}>
                No staffs created yet.<br />
                Add a staff to get started.
              </div>
            ) : (
              props.staffs.map((staff) => (
                <div
                  key={staff.id}
                  draggable
                  onDragStart={() => handleDragStart(staff.id)}
                  onDragOver={handleDragOver}
                  onDrop={() => handleDrop(staff.id)}
                  style={{
                    padding: 8,
                    borderBottom: '1px solid #dee2e6',
                    backgroundColor: props.selectedStaffId === staff.id ? '#e3f2fd' : '#fff',
                    cursor: 'pointer',
                    opacity: draggedStaffId === staff.id ? 0.5 : 1,
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => props.onStaffSelect(staff.id)}
                >
                  {/* Staff Header */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: 6
                  }}>
                    <span style={{
                      fontSize: 16,
                      color: getClefColor(staff.clef),
                      marginRight: 8,
                      width: 20,
                      textAlign: 'center'
                    }}>
                      {getClefSymbol(staff.clef)}
                    </span>
                    
                    <input
                      type="text"
                      value={staff.name}
                      onChange={(e) => {
                        e.stopPropagation();
                        props.onStaffRename(staff.id, e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        flex: 1,
                        padding: '2px 4px',
                        fontSize: 11,
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontWeight: props.selectedStaffId === staff.id ? 'bold' : 'normal'
                      }}
                    />
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onStaffRemove(staff.id);
                      }}
                      style={{
                        padding: '2px 4px',
                        fontSize: 10,
                        border: 'none',
                        borderRadius: 2,
                        backgroundColor: '#dc3545',
                        color: 'white',
                        cursor: 'pointer',
                        marginLeft: 4
                      }}
                    >
                      ×
                    </button>
                  </div>
                  
                  {/* Staff Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 10
                  }}>
                    {/* Visibility Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onStaffToggleVisibility(staff.id);
                      }}
                      style={{
                        padding: '2px 4px',
                        fontSize: 10,
                        border: '1px solid #dee2e6',
                        borderRadius: 2,
                        backgroundColor: staff.visible ? '#28a745' : '#6c757d',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {staff.visible ? '👁️' : '👁️‍🗨️'}
                    </button>
                    
                    {/* Mute Toggle */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        props.onStaffToggleMute(staff.id);
                      }}
                      style={{
                        padding: '2px 4px',
                        fontSize: 10,
                        border: '1px solid #dee2e6',
                        borderRadius: 2,
                        backgroundColor: staff.muted ? '#dc3545' : '#28a745',
                        color: 'white',
                        cursor: 'pointer'
                      }}
                    >
                      {staff.muted ? '🔇' : '🔊'}
                    </button>
                    
                    {/* Volume Control */}
                    <div style={{ 
                      flex: 1, 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 4 
                    }}>
                      <span style={{ fontSize: 8, minWidth: 12 }}>Vol:</span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={staff.volume}
                        onChange={(e) => {
                          e.stopPropagation();
                          props.onStaffVolumeChange(staff.id, parseInt(e.target.value));
                        }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          flex: 1,
                          height: 4
                        }}
                      />
                      <span style={{ fontSize: 8, minWidth: 20 }}>
                        {staff.volume}%
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};