import { useState } from 'react';
import { useSettings } from '../features/settings/hooks/useSettings';
import { BehaviorTreeEditor } from '../features/behavior-tree';
import styles from './SettingsPage.module.css';

type SettingsTab = 'general' | 'behavior-tree';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage = ({ onBack }: SettingsPageProps) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [hasChanges, setHasChanges] = useState(false);

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

        {/* Tab bar */}
        <div style={{ display: 'flex', gap: '4px', marginLeft: '24px' }}>
          {([
            { id: 'general',       label: '⚙ General' },
            { id: 'behavior-tree', label: '🌳 Behavior Trees' },
          ] as { id: SettingsTab; label: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px',
                backgroundColor: activeTab === tab.id ? '#4a9eff' : 'transparent',
                color: activeTab === tab.id ? '#fff' : '#aaa',
                border: '1px solid',
                borderColor: activeTab === tab.id ? '#4a9eff' : '#555',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── General Tab ────────────────────────── */}
      {activeTab === 'general' && (
      <div className={styles.settingsContainer}>
      <p>Current theme: {settings.theme}</p>
      <div>
        <button onClick={() => { resetSettings(); setHasChanges(false); }}>
          Reset to Defaults
        </button>
        <button onClick={() => {updateSettings({theme: 'dark'}); setHasChanges(true);}}>
          Test Theme Change
        </button>
        <button onClick={() => setHasChanges(false)} disabled={!hasChanges}>
          Save Changes
        </button>
      </div>
      </div>
      )}

      {/* ── Behavior Tree Tab ──────────────────── */}
      {activeTab === 'behavior-tree' && (
        <div style={{ padding: '16px', height: 'calc(100vh - 120px)' }}>
          <BehaviorTreeEditor />
        </div>
      )}
    </div>
  );
};