import React from 'react';

export default function ConfidenceBadge({ level }) {
  const config = {
    high: { color: 'var(--success-green, #22c55e)', text: 'Auto-filled' },
    derived: { color: 'var(--accent-primary, #6366f1)', text: 'Derived' },
    must_confirm: { color: 'var(--warning-amber, #f59e0b)', text: 'Confirm' },
    manual: { color: 'var(--error-red, #ef4444)', text: 'Required' },
  };

  const { color, text } = config[level] || config.manual;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
      <span style={{ color: 'var(--text-secondary)' }}>{text}</span>
    </div>
  );
}
