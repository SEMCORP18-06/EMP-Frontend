import React from 'react';
import { Trash2, GripVertical, Plus } from 'lucide-react';

export default function EditableTable({ data, onChange }) {
  const updateRow = (index, field, value) => {
    const newData = [...data];
    newData[index] = { ...newData[index], [field]: value };
    onChange(newData);
  };

  const addRow = () => {
    onChange([...data, { sr_no: data.length + 1, parameter: '', scope: '' }]);
  };

  const removeRow = (index) => {
    onChange(data.filter((_, i) => i !== index));
  };

  return (
    <div style={{
      padding: '1rem',
      borderRadius: '12px',
      border: '1px solid var(--border-color)',
      background: 'var(--bg-tertiary)',
      marginBottom: '1rem'
    }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <th style={{ padding: '0.5rem', width: '40px' }}></th>
            <th style={{ padding: '0.5rem', width: '60px' }}>Sr</th>
            <th style={{ padding: '0.5rem' }}>Parameter</th>
            <th style={{ padding: '0.5rem' }}>Scope</th>
            <th style={{ padding: '0.5rem', width: '40px' }}></th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '0.5rem' }}><GripVertical size={16} color="var(--text-secondary)" style={{ cursor: 'grab' }}/></td>
              <td style={{ padding: '0.5rem', color: 'var(--text-primary)' }}>{row.sr_no || i + 1}</td>
              <td style={{ padding: '0.5rem' }}>
                <input className="form-input" value={row.parameter} onChange={e => updateRow(i, 'parameter', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </td>
              <td style={{ padding: '0.5rem' }}>
                <input className="form-input" value={row.scope} onChange={e => updateRow(i, 'scope', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }} />
              </td>
              <td style={{ padding: '0.5rem' }}>
                <button onClick={() => removeRow(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error-red, #ef4444)', cursor: 'pointer' }}>
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={addRow} className="btn-secondary" style={{ marginTop: '1rem', width: '100%', padding: '0.5rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}>
        <Plus size={16} /> Add Row
      </button>
    </div>
  );
}
