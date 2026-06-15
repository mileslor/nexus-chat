import { contextBridge, ipcRenderer } from 'electron';
import type { Account, SessionState } from '../core/types';
import type { AppSettings } from '../main/settings';

contextBridge.exposeInMainWorld('nexus', {
  accounts: {
    load: (): Promise<Account[]> => ipcRenderer.invoke('accounts:load'),
    create: (account: Account): Promise<void> => ipcRenderer.invoke('session:create', account),
    remove: (accountId: string): Promise<void> => ipcRenderer.invoke('session:remove', accountId),
    focus: (accountId: string): void => ipcRenderer.send('session:focus', accountId),
  },
  modal: {
    open: (): void => ipcRenderer.send('modal:state', true),
    close: (): void => ipcRenderer.send('modal:state', false),
  },
  settings: {
    load: (): Promise<AppSettings> => ipcRenderer.invoke('settings:load'),
    save: (s: AppSettings): Promise<void> => ipcRenderer.invoke('settings:save', s),
  },
  on: {
    sessionStateChanged: (cb: (state: SessionState) => void) => {
      const handler = (_e: Electron.IpcRendererEvent, state: SessionState) => cb(state);
      ipcRenderer.on('session:state-changed', handler);
      return () => ipcRenderer.removeListener('session:state-changed', handler);
    },
  },
});

declare global {
  interface Window {
    nexus: {
      accounts: {
        load: () => Promise<Account[]>;
        create: (account: Account) => Promise<void>;
        remove: (accountId: string) => Promise<void>;
        focus: (accountId: string) => void;
      };
      modal: {
        open: () => void;
        close: () => void;
      };
      settings: {
        load: () => Promise<AppSettings>;
        save: (s: AppSettings) => Promise<void>;
      };
      on: {
        sessionStateChanged: (cb: (state: SessionState) => void) => () => void;
      };
    };
  }
}
