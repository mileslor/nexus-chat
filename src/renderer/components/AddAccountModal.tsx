import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { getAllPlatforms } from '../../core/platforms';
import type { PlatformId } from '../../core/types';

const platforms = getAllPlatforms();

export function AddAccountModal() {
  const { addAccount, setShowAddModal } = useStore();
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId>('whatsapp');
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);

  const platform = platforms.find((p) => p.id === selectedPlatform)!;

  const handleAdd = async () => {
    setLoading(true);
    await addAccount(selectedPlatform, label);
    setShowAddModal(false);
    setLoading(false);
  };

  return (
    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Add Account</h2>

        <div className="platform-grid">
          {platforms.map((p) => (
            <button
              key={p.id}
              className={`platform-btn ${selectedPlatform === p.id ? 'active' : ''}`}
              style={{ '--accent': p.colors[0] } as React.CSSProperties}
              onClick={() => setSelectedPlatform(p.id)}
            >
              <span className="platform-icon">{p.icon}</span>
              <span className="platform-name">{p.name}</span>
            </button>
          ))}
        </div>

        <input
          className="input"
          type="text"
          placeholder={`Label (e.g. Work ${platform.name})`}
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          autoFocus
        />

        <div className="modal-actions">
          <button className="btn-secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ '--accent': platform.colors[0] } as React.CSSProperties}
            onClick={handleAdd}
            disabled={loading}
          >
            {loading ? 'Opening…' : 'Add Account'}
          </button>
        </div>
      </div>
    </div>
  );
}
