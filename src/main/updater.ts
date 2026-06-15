import { app, dialog } from 'electron';

export function initAutoUpdate() {
  if (!app.isPackaged) return; // Only in production

  const { updateElectronApp, UpdateSourceType } = require('update-electron-app') as typeof import('update-electron-app');

  updateElectronApp({
    updateSource: {
      type: UpdateSourceType.ElectronPublicUpdateService,
      repo: 'mileslor/nexus-chat',
    },
    updateInterval: '1 hour',
    notifyUser: true,
  });
}
