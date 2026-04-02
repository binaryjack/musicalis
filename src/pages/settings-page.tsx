import { useState } from 'react';
import { useSettings } from '../features/settings/hooks/useSettings';
import styles from './SettingsPage.module.css';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = () => {
    // Settings are auto-saved via Redux, just update UI
    setHasChanges(false);
  };

  const handleReset = () => {
    resetSettings();
    setHasChanges(false);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#f0f0f0' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 24px',
        backgroundColor: '#2d2d2d',
        borderBottom: '1px solid #444',
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: '1px solid #555',
            color: '#ccc',
            borderRadius: '6px',
            padding: '6px 14px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Back to Editor
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>⚙️ Settings</h1>
      </div>
      <div className={styles.settingsContainer}>
      <p>Settings interface will be fully implemented after template system is ready.</p>
      <p>Current theme: {settings.theme}</p>
      <div>
        <button onClick={handleSave} disabled={!hasChanges}>
          Save Changes
        </button>
        <button onClick={handleReset}>
          Reset to Defaults
        </button>
        <button onClick={() => {updateSettings({theme: 'dark'}); setHasChanges(true);}}>
          Test Theme Change
        </button>
      </div>
      </div>
    </div>
  );
};