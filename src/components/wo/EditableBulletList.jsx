import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function EditableBulletList({ items = [], onChange }) {
  const updateItem = (index, val) => {
    const newItems = [...items];
    newItems[index] = val;
    onChange(newItems);
  };

  const remove = (index) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ color: 'var(--accent-primary, #6366f1)', fontSize: '1.2rem' }}>•</span>
          <input 
            className="form-input" 
            value={item} 
            onChange={(e) => updateItem(i, e.target.value)} 
            style={{
              flex: 1,
              padding: '0.5rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem'
            }}
          />
          <button onClick={() => remove(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error-red, #ef4444)', cursor: 'pointer' }}>
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ''])} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px', cursor: 'pointer', alignSelf: 'flex-start' }}>
        <Plus size={16} /> Add Item
      </button>
    </div>
  );
}
