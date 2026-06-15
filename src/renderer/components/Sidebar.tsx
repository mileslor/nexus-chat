import React from 'react';
import { useStore } from '../store/useStore';
import { getPlatform } from '../../core/platforms';
import type { Account } from '../../core/types';

function AccountButton({ account }: { account: Account }) {
  const { activeAccountId, setActiveAccount, sessionStates, removeAccount } = useStore();
  const state = sessionStates[account.id];
  const isActive = activeAccountId === account.id;
  const platform = getPlatform(account.platformId);
  const unread = state?.unreadCount ?? 0;
  const isDisconnected = state?.status === 'disconnected';
  const isConnecting = state?.status === 'connecting';

  return (
    <div className="account-wrapper" title={account.label}>
      <button
        className={`account-btn ${isActive ? 'active' : ''} ${isDisconnected ? 'disconnected' : ''}`}
        style={{ '--color': account.color } as React.CSSProperties}
        onClick={() => setActiveAccount(account.id)}
        onContextMenu={(e) => {
          e.preventDefault();
          if (confirm(`Remove "${account.label}"?`)) removeAccount(account.id);
        }}
      >
        <span className="account-icon">{platform.icon}</span>
        {unread > 0 && (
          <span className="badge">{unread > 99 ? '99+' : unread}</span>
        )}
        {isConnecting && <span className="status-dot connecting" />}
        {isDisconnected && <span className="status-dot disconnected" />}
      </button>
      <div className={`active-indicator ${isActive ? 'visible' : ''}`} />
    </div>
  );
}

export function Sidebar() {
  const { accounts, setShowAddModal, setShowSettings } = useStore();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">N</div>

      <div className="account-list">
        {accounts.map((acc) => (
          <AccountButton key={acc.id} account={acc} />
        ))}
      </div>

      <div className="sidebar-bottom">
        <button
          className="add-btn"
          onClick={() => setShowAddModal(true)}
          title="Add Account"
        >
          +
        </button>
        <button
          className="settings-btn"
          onClick={() => setShowSettings(true)}
          title="Settings"
        >
          ⚙
        </button>
      </div>
    </aside>
  );
}
