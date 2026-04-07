import { AddStaffButton } from '../../../components/atoms/add-staff-button'
import { Dropdown } from '../../../components/atoms/dropdown'
import { MenuBar, type MenuItem } from '../../../components/molecules/menu-bar'
import { MIDI_INSTRUMENTS } from '../../../shared/utils/midi-instruments'

interface EditorHeaderProps {
  mode: 'design' | 'playback';
  onModeToggle: () => void;
  projectName: string | undefined;
  onSettings?: () => void;
  onSave: () => void;
  onAddStaff: () => void;
  instrumentName: string;
  onSetInstrument: (name: string) => Promise<void>;
  videoResolution: string;
  setVideoResolution: (v: string) => void;
  audioQuality: string;
  setAudioQuality: (q: string) => void;
}

const VIDEO_OPTIONS = [
  { value: '720p',  label: '720p HD',        icon: '📺' },
  { value: '1080p', label: '1080p Full HD',   icon: '🎥' },
  { value: '4k',    label: '4K Ultra HD',     icon: '🎬' },
  { value: '8k',    label: '8K',              icon: '📽️' },
];

const AUDIO_OPTIONS = [
  { value: 'low',    label: 'Low Quality (22kHz)',    icon: '🔈' },
  { value: 'medium', label: 'Medium Quality (44.1kHz)', icon: '🔉' },
  { value: 'high',   label: 'High Quality (48kHz)',   icon: '🔊' },
  { value: 'studio', label: 'Studio Quality (96kHz)', icon: '🎛️' },
];

export const EditorHeader = function({ mode, onModeToggle, projectName, onSettings, onSave, onAddStaff, instrumentName, onSetInstrument, videoResolution, setVideoResolution, audioQuality, setAudioQuality }: EditorHeaderProps) {
  const menuConfig: MenuItem[] = [
    {
      id: 'file', label: 'File', icon: '📁',
      submenu: [
        { id: 'new', label: 'New', icon: '📄', action: () => {} },
        { id: 'save', label: 'Save', icon: '💾', action: onSave },
        { id: 'load', label: 'Load', icon: '📂', action: () => {} },
        { id: 'sep1', label: '', separator: true },
        { id: 'settings', label: 'Settings', icon: '⚙️', action: () => onSettings?.() },
      ],
    },
    {
      id: 'tools', label: 'Tools', icon: '🔧',
      submenu: [{ id: 'colors', label: 'Note Color Scheme', icon: '🎨', action: () => {} }],
    },
    {
      id: 'help', label: 'Help', icon: '❓',
      submenu: [{ id: 'about', label: 'About', icon: 'ℹ️', action: () => alert('Musicalist Editor v1.0') }],
    },
  ];

  return (
    <div style={{ height: '60px', backgroundColor: '#2d2d2d', borderBottom: '1px solid #444', display: 'flex', alignItems: 'center', padding: '0 16px', flexShrink: 0 }}>
      <MenuBar items={menuConfig} />
      <h1 style={{ margin: '0 16px', fontSize: '18px', fontWeight: 'bold', color: '#f0f0f0', flexGrow: 1 }}>
        🎵 {projectName || 'Musicalist Editor'}
      </h1>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
        <Dropdown options={MIDI_INSTRUMENTS} value={instrumentName} onChange={onSetInstrument} placeholder="Select Instrument" />
        <Dropdown options={VIDEO_OPTIONS} value={videoResolution} onChange={setVideoResolution} placeholder="Video Quality" />
        <Dropdown options={AUDIO_OPTIONS} value={audioQuality} onChange={setAudioQuality} placeholder="Audio Quality" />
        <AddStaffButton onClick={onAddStaff} />
        <button
          onClick={onModeToggle}
          style={{ padding: '6px 12px', backgroundColor: mode === 'design' ? '#28a745' : '#4a9eff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '14px' }}
        >
          {mode === 'design' ? '✏️ Design' : '👁️ View'}
        </button>
      </div>
    </div>
  );
};
