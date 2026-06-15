import React, { useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { EmptyState } from './components/EmptyState';
import { AddAccountModal } from './components/AddAccountModal';
import { SettingsPanel } from './components/SettingsPanel';
import { useStore } from './store/useStore';

export function App() {
  const {
    accounts,
    showAddModal,
    showSettings,
    loadAccounts,
    loadSettings,
    setSessionState,
  } = useStore();

  useEffect(() => {
    loadAccounts();
    loadSettings();
    const off = window.nexus.on.sessionStateChanged(setSessionState);
    return off;
  }, []);

  // Hide the WebContentsView while any modal is open so it doesn't cover React UI
  useEffect(() => {
    if (showAddModal || showSettings) {
      window.nexus.modal.open();
    } else {
      window.nexus.modal.close();
    }
  }, [showAddModal, showSettings]);

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="content">
        {accounts.length === 0 && <EmptyState />}
      </main>
      {showAddModal && <AddAccountModal />}
      {showSettings && <SettingsPanel />}
    </div>
  );
}
