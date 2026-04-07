import type { NoteDuration } from '../../../types/musicTypes'
import { ToolCategorySelector } from './tool-category-selector'

const NOTE_OPTIONS = [
  { value: 'whole',     label: 'Whole',   icon: '𝅝' },
  { value: 'half',      label: 'Half',    icon: '𝅗𝅥' },
  { value: 'quarter',   label: 'Quarter', icon: '♩' },
  { value: 'eighth',    label: 'Eighth',  icon: '♪' },
  { value: 'sixteenth', label: '16th',    icon: '𝅘𝅥𝅯' },
];

const REST_OPTIONS = [
  { value: 'whole-rest',     label: 'Whole',   icon: '𝄻' },
  { value: 'half-rest',      label: 'Half',    icon: '𝄼' },
  { value: 'quarter-rest',   label: 'Quarter', icon: '𝄽' },
  { value: 'eighth-rest',    label: 'Eighth',  icon: '𝄾' },
  { value: 'sixteenth-rest', label: '16th',    icon: '𝄿' },
];

interface EditorSidebarProps {
  selectedDuration: NoteDuration;
  setSelectedDuration: (d: NoteDuration) => void;
  selectedRest: string;
  setSelectedRest: (r: string) => void;
}

export const EditorSidebar = function({ selectedDuration, setSelectedDuration, selectedRest, setSelectedRest }: EditorSidebarProps) {
  return (
    <div style={{ width: '50px', backgroundColor: '#222', borderRight: '1px solid #444', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '16px 0', gap: '16px', overflow: 'visible', zIndex: 50 }}>
      <ToolCategorySelector
        label="Notes"
        options={NOTE_OPTIONS}
        value={selectedDuration}
        active={selectedRest === ''}
        onChange={(val) => { setSelectedDuration(val as NoteDuration); setSelectedRest(''); }}
      />
      <div style={{ width: '30px', height: '1px', backgroundColor: '#444' }} />
      <ToolCategorySelector
        label="Rests"
        options={REST_OPTIONS}
        value={selectedRest}
        active={selectedRest !== ''}
        onChange={(val) => { setSelectedRest(val); setSelectedDuration(val.replace('-rest', '') as NoteDuration); }}
      />
    </div>
  );
};
