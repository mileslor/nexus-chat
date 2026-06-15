import { create } from 'zustand';
import type { Account, PlatformId, SessionState } from '../../core/types';
import { getPlatform } from '../../core/platforms';
import type { AppSettings } from '../../main/settings';

interface AppState {
  accounts: Account[];
  activeAccountId: string | null;
  sessionStates: Record<string, SessionState>;
  showAddModal: boolean;
  showSettings: boolean;
  settings: AppSettings | null;

  setAccounts: (accounts: Account[]) => void;
  setActiveAccount: (id: string) => void;
  setSessionState: (state: SessionState) => void;
  setShowAddModal: (show: boolean) => void;
  setShowSettings: (show: boolean) => void;
  addAccount: (platformId: PlatformId, label: string) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  loadAccounts: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (s: AppSettings) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  accounts: [],
  activeAccountId: null,
  sessionStates: {},
  showAddModal: false,
  showSettings: false,
  settings: null,

  setAccounts: (accounts) => set({ accounts }),
  setActiveAccount: (id) => {
    window.nexus.accounts.focus(id);
    set({ activeAccountId: id });
  },
  setSessionState: (state) =>
    set((s) => ({
      sessionStates: { ...s.sessionStates, [state.accountId]: state },
    })),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setShowSettings: (show) => set({ showSettings: show }),

  addAccount: async (platformId, label) => {
    const id = `${platformId}-${Date.now()}`;
    const platform = getPlatform(platformId);
    const account: Account = {
      id,
      platformId,
      label: label || platform.name,
      color: platform.colors[0],
      sessionPartition: id,
      createdAt: Date.now(),
    };
    await window.nexus.accounts.create(account);
    set((s) => ({ accounts: [...s.accounts, account], activeAccountId: id }));
  },

  removeAccount: async (id) => {
    await window.nexus.accounts.remove(id);
    set((s) => {
      const accounts = s.accounts.filter((a) => a.id !== id);
      const states = { ...s.sessionStates };
      delete states[id];
      const activeAccountId =
        s.activeAccountId === id ? (accounts[0]?.id ?? null) : s.activeAccountId;
      return { accounts, sessionStates: states, activeAccountId };
    });
  },

  loadAccounts: async () => {
    const accounts = await window.nexus.accounts.load();
    set({ accounts, activeAccountId: accounts[0]?.id ?? null });
  },

  loadSettings: async () => {
    const settings = await window.nexus.settings.load();
    set({ settings });
  },

  saveSettings: async (s) => {
    await window.nexus.settings.save(s);
    set({ settings: s });
  },
}));
