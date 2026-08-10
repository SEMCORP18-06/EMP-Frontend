import React from 'react';
import ConfidenceBadge from './ConfidenceBadge';

export default function EditableField({ label, field, onChange, type = 'text' }) {
  const confidence = field?.confidence || 'manual';
  const value = field?.value ?? (typeof field === 'string' ? field : '');

  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</label>
        <ConfidenceBadge level={confidence} />
      </div>
      <input
        type={type}
        className={`form-input confidence-${confidence}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '0.6rem 0.8rem',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          fontSize: '0.9rem'
        }}
      />
    </div>
  );
}
