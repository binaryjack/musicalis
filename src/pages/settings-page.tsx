import { useState } from 'react';
import { useSettings } from '../features/settings/hooks/useSettings';
import styles from './SettingsPage.module.css';

export const SettingsPage = () => {
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

  // For now, return a simple placeholder until component templates are fixed
  return (
    <div className={styles.settingsContainer}>
      <h1>Settings</h1>
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
  );
};