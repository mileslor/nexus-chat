import { app } from 'electron';
import fs from 'fs';
import path from 'path';

export interface AppSettings {
  launchAtLogin: boolean;
  showNotifications: boolean;
  notificationSound: boolean;
  theme: 'dark' | 'light' | 'system';
}

const defaults: AppSettings = {
  launchAtLogin: true,
  showNotifications: true,
  notificationSound: true,
  theme: 'dark',
};

const storePath = () => path.join(app.getPath('userData'), 'settings.json');

export function loadSettings(): AppSettings {
  try {
    const raw = JSON.parse(fs.readFileSync(storePath(), 'utf-8'));
    return { ...defaults, ...raw };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(settings: AppSettings): void {
  fs.writeFileSync(storePath(), JSON.stringify(settings, null, 2), 'utf-8');
}

export function applySettings(settings: AppSettings): void {
  app.setLoginItemSettings({ openAtLogin: settings.launchAtLogin });
}
