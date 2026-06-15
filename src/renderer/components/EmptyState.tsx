import React from 'react';
import { useStore } from '../store/useStore';

export function EmptyState() {
  const { setShowAddModal } = useStore();

  return (
    <div className="empty-state">
      <div className="empty-icon">💬</div>
      <h2>Welcome to NexusChat</h2>
      <p>Manage all your messaging accounts in one place.</p>
      <button className="btn-primary" onClick={() => setShowAddModal(true)}>
        Add Your First Account
      </button>
    </div>
  );
}
