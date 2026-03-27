import { useState } from 'react';
import type { ColorMapping, ColorRule, NoteCondition } from '../../types/musicTypes';

export interface ColorMappingEditorProps {
  colorMapping: ColorMapping;
  onMappingChange: (mapping: ColorMapping) => void;
  onPresetLoad?: (presetName: string) => void;
}

const COLOR_PRESETS = {
  'teaching-basic': {
    name: 'Teaching Basic',
    colors: [
      { id: 'bass', name: 'Bass Notes', hex: '#ff6b6b', condition: { pitchRange: { min: 'C4', max: 'G4' } } },
      { id: 'melody', name: 'Melody', hex: '#4ecdc4', condition: { pitchRange: { min: 'A4', max: 'C5' } } },
      { id: 'harmony', name: 'Harmony', hex: '#45b7d1', condition: { velocityRange: { min: 80, max: 127 } } }
    ]
  },
  'velocity-based': {
    name: 'Velocity Based',
    colors: [
      { id: 'soft', name: 'Soft (pp)', hex: '#e8f5e8', condition: { velocityRange: { min: 1, max: 40 } } },
      { id: 'medium', name: 'Medium (mf)', hex: '#ffeb3b', condition: { velocityRange: { min: 41, max: 80 } } },
      { id: 'loud', name: 'Loud (ff)', hex: '#ff5722', condition: { velocityRange: { min: 81, max: 127 } } }
    ]
  },
  'duration-based': {
    name: 'Duration Based',
    colors: [
      { id: 'whole', name: 'Whole Notes', hex: '#9c27b0', condition: { durationTypes: ['whole'] } },
      { id: 'half', name: 'Half Notes', hex: '#3f51b5', condition: { durationTypes: ['half'] } },
      { id: 'quarter', name: 'Quarter Notes', hex: '#009688', condition: { durationTypes: ['quarter'] } },
      { id: 'eighth', name: 'Eighth Notes', hex: '#ff9800', condition: { durationTypes: ['eighth'] } }
    ]
  }
} as const;

export const ColorMappingEditor = function(props: ColorMappingEditorProps) {
  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  
  const handleAddColor = () => {
    const newRule: ColorRule = {
      id: `color-${Date.now()}`,
      name: `New Color ${props.colorMapping.colors.length + 1}`,
      hex: '#007bff',
      condition: { velocityRange: { min: 1, max: 127 } }
    };
    
    const updatedMapping: ColorMapping = {
      ...props.colorMapping,
      colors: [...props.colorMapping.colors, newRule]
    };
    
    props.onMappingChange(updatedMapping);
  };
  
  const handleRemoveColor = (colorId: string) => {
    const updatedMapping: ColorMapping = {
      ...props.colorMapping,
      colors: props.colorMapping.colors.filter(c => c.id !== colorId)
    };
    
    props.onMappingChange(updatedMapping);
    
    if (selectedRuleId === colorId) {
      setSelectedRuleId(null);
    }
  };
  
  const handleColorChange = (colorId: string, updates: Partial<ColorRule>) => {
    const updatedMapping: ColorMapping = {
      ...props.colorMapping,
      colors: props.colorMapping.colors.map(color => 
        color.id === colorId ? { ...color, ...updates } : color
      )
    };
    
    props.onMappingChange(updatedMapping);
  };
  
  const handleLoadPreset = (presetKey: string) => {
    const preset = COLOR_PRESETS[presetKey as keyof typeof COLOR_PRESETS];
    const newColors = preset.colors.map((color, index) => ({
      ...color,
      id: `preset-${presetKey}-${index}`,
      condition: color.condition as NoteCondition
    }));
    
    const updatedMapping: ColorMapping = {
      ...props.colorMapping,
      name: preset.name,
      colors: newColors
    };
    
    props.onMappingChange(updatedMapping);
    setShowPresets(false);
    props.onPresetLoad?.(preset.name);
  };
  
  const renderConditionEditor = (rule: ColorRule) => (
    <div style={{ 
      padding: 10, 
      backgroundColor: '#f8f9fa', 
      borderRadius: 4,
      marginTop: 8
    }}>
      <h5 style={{ margin: '0 0 8px 0', fontSize: 12 }}>Conditions</h5>
      
      {/* Pitch Range */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
          Pitch Range:
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <select
            value={rule.condition.pitchRange?.min || ''}
            onChange={(e) => {
              const condition = { 
                ...rule.condition, 
                pitchRange: { 
                  min: e.target.value as any, 
                  max: rule.condition.pitchRange?.max || 'C5' 
                } 
              };
              handleColorChange(rule.id, { condition });
            }}
            style={{ fontSize: 10, padding: 3 }}
          >
            <option value="">Any</option>
            <option value="C4">C4</option>
            <option value="D4">D4</option>
            <option value="E4">E4</option>
            <option value="F4">F4</option>
            <option value="G4">G4</option>
            <option value="A4">A4</option>
            <option value="B4">B4</option>
            <option value="C5">C5</option>
          </select>
          <span style={{ fontSize: 10 }}>to</span>
          <select
            value={rule.condition.pitchRange?.max || ''}
            onChange={(e) => {
              const condition = { 
                ...rule.condition, 
                pitchRange: { 
                  min: rule.condition.pitchRange?.min || 'C4', 
                  max: e.target.value as any 
                } 
              };
              handleColorChange(rule.id, { condition });
            }}
            style={{ fontSize: 10, padding: 3 }}
          >
            <option value="">Any</option>
            <option value="C4">C4</option>
            <option value="D4">D4</option>
            <option value="E4">E4</option>
            <option value="F4">F4</option>
            <option value="G4">G4</option>
            <option value="A4">A4</option>
            <option value="B4">B4</option>
            <option value="C5">C5</option>
          </select>
        </div>
      </div>
      
      {/* Velocity Range */}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 11, fontWeight: 'bold', display: 'block', marginBottom: 4 }}>
          Velocity Range:
        </label>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="range"
            min="1"
            max="127"
            value={rule.condition.velocityRange?.min || 1}
            onChange={(e) => {
              const condition = { 
                ...rule.condition, 
                velocityRange: { 
                  min: parseInt(e.target.value), 
                  max: rule.condition.velocityRange?.max || 127 
                } 
              };
              handleColorChange(rule.id, { condition });
            }}
            style={{ width: 60 }}
          />
          <span style={{ fontSize: 10, minWidth: 20 }}>
            {rule.condition.velocityRange?.min || 1}
          </span>
          <span style={{ fontSize: 10 }}>to</span>
          <input
            type="range"
            min="1"
            max="127"
            value={rule.condition.velocityRange?.max || 127}
            onChange={(e) => {
              const condition = { 
                ...rule.condition, 
                velocityRange: { 
                  min: rule.condition.velocityRange?.min || 1, 
                  max: parseInt(e.target.value) 
                } 
              };
              handleColorChange(rule.id, { condition });
            }}
            style={{ width: 60 }}
          />
          <span style={{ fontSize: 10, minWidth: 20 }}>
            {rule.condition.velocityRange?.max || 127}
          </span>
        </div>
      </div>
    </div>
  );
  
  return (
    <div style={{
      padding: 15,
      border: '1px solid #ddd',
      borderRadius: 8,
      backgroundColor: '#fff'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15
      }}>
        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 'bold' }}>
          Color Mapping: {props.colorMapping.name}
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowPresets(!showPresets)}
            style={{
              padding: '4px 8px',
              fontSize: 10,
              border: '1px solid #ddd',
              borderRadius: 4,
              backgroundColor: '#f8f9fa',
              cursor: 'pointer'
            }}
          >
            📁 Presets
          </button>
          <button
            onClick={handleAddColor}
            style={{
              padding: '4px 8px',
              fontSize: 10,
              border: 'none',
              borderRadius: 4,
              backgroundColor: '#28a745',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            + Add Color
          </button>
        </div>
      </div>
      
      {showPresets && (
        <div style={{
          marginBottom: 15,
          padding: 10,
          backgroundColor: '#f8f9fa',
          borderRadius: 4,
          border: '1px solid #dee2e6'
        }}>
          <h5 style={{ margin: '0 0 8px 0', fontSize: 12 }}>Load Preset:</h5>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(COLOR_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleLoadPreset(key)}
                style={{
                  padding: '4px 8px',
                  fontSize: 10,
                  border: '1px solid #007bff',
                  borderRadius: 4,
                  backgroundColor: '#fff',
                  color: '#007bff',
                  cursor: 'pointer'
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        {props.colorMapping.colors.map((rule) => (
          <div
            key={rule.id}
            style={{
              marginBottom: 8,
              padding: 10,
              border: selectedRuleId === rule.id ? '2px solid #007bff' : '1px solid #ddd',
              borderRadius: 6,
              backgroundColor: selectedRuleId === rule.id ? '#f0f7ff' : '#fff'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="color"
                value={rule.hex}
                onChange={(e) => handleColorChange(rule.id, { hex: e.target.value })}
                style={{ 
                  width: 30, 
                  height: 30, 
                  border: 'none', 
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              />
              
              <input
                type="text"
                value={rule.name}
                onChange={(e) => handleColorChange(rule.id, { name: e.target.value })}
                style={{
                  flex: 1,
                  padding: '4px 8px',
                  fontSize: 12,
                  border: '1px solid #ddd',
                  borderRadius: 3
                }}
                placeholder="Color name"
              />
              
              <button
                onClick={() => setSelectedRuleId(selectedRuleId === rule.id ? null : rule.id)}
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  border: '1px solid #6c757d',
                  borderRadius: 3,
                  backgroundColor: selectedRuleId === rule.id ? '#6c757d' : '#fff',
                  color: selectedRuleId === rule.id ? '#fff' : '#6c757d',
                  cursor: 'pointer'
                }}
              >
                ⚙️
              </button>
              
              <button
                onClick={() => handleRemoveColor(rule.id)}
                style={{
                  padding: '2px 6px',
                  fontSize: 10,
                  border: 'none',
                  borderRadius: 3,
                  backgroundColor: '#dc3545',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                ×
              </button>
            </div>
            
            {selectedRuleId === rule.id && renderConditionEditor(rule)}
          </div>
        ))}
      </div>
      
      {props.colorMapping.colors.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 20,
          color: '#6c757d',
          fontSize: 12
        }}>
          No colors defined. Add colors to create visual note categories.
        </div>
      )}
    </div>
  );
};