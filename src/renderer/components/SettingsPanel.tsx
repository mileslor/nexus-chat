import React from 'react';
import { useStore } from '../store/useStore';
import type { AppSettings } from '../../main/settings';

function Toggle({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <div className="setting-info">
        <span className="setting-label">{label}</span>
        {desc && <span className="setting-desc">{desc}</span>}
      </div>
      <button
        className={`toggle ${checked ? 'on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="switch"
      >
        <span className="toggle-knob" />
      </button>
    </div>
  );
}

export function SettingsPanel() {
  const { settings, saveSettings, setShowSettings } = useStore();
  if (!settings) return null;

  const update = (patch: Partial<AppSettings>) => {
    saveSettings({ ...settings, ...patch });
  };

  return (
    <div className="modal-overlay" onClick={() => setShowSettings(false)}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>Settings</h2>
          <button className="close-btn" onClick={() => setShowSettings(false)}>
            ✕
          </button>
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">General</h3>
          <Toggle
            label="Launch at Login"
            desc="Start NexusChat automatically when you log in"
            checked={settings.launchAtLogin}
            onChange={(v) => update({ launchAtLogin: v })}
          />
        </div>

        <div className="settings-section">
          <h3 className="settings-section-title">Notifications</h3>
          <Toggle
            label="Show Notifications"
            desc="Display system notifications for new messages"
            checked={settings.showNotifications}
            onChange={(v) => update({ showNotifications: v })}
          />
          <Toggle
            label="Notification Sound"
            desc="Play a sound for new messages"
            checked={settings.notificationSound}
            onChange={(v) => update({ notificationSound: v })}
          />
        </div>

        <div className="settings-footer">
          <span className="settings-version">NexusChat v1.0.0</span>
        </div>
      </div>
    </div>
  );
}
