import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react';

export default function EquipmentAccordion({ data, onChange, onDelete }) {
  const [open, setOpen] = useState(false);

  const updateRow = (idx, field, val) => {
    const newRows = [...data.rows];
    newRows[idx] = { ...newRows[idx], [field]: val };
    onChange({ ...data, rows: newRows });
  };

  const addRow = () => onChange({ ...data, rows: [...data.rows, { parameter: '', specification: '' }] });
  const removeRow = (idx) => onChange({ ...data, rows: data.rows.filter((_, i) => i !== idx) });

  return (
    <div className="wo-card" style={{
      padding: 0,
      marginBottom: '1rem',
      overflow: 'hidden',
      border: '1px solid var(--border-color)',
      borderRadius: '12px',
      background: 'var(--bg-tertiary)'
    }}>
      <div 
        style={{ padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)' }}
        onClick={() => setOpen(!open)}
      >
        <input 
          className="form-input" 
          value={data.heading} 
          onChange={(e) => { e.stopPropagation(); onChange({ ...data, heading: e.target.value }) }}
          style={{ width: 'auto', flex: 1, marginRight: '1rem', background: 'transparent', border: 'none', fontWeight: 'bold', fontSize: '1rem', color: 'var(--text-primary)' }}
        />
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: 'transparent', border: 'none', color: 'var(--error-red, #ef4444)', cursor: 'pointer' }}><Trash2 size={18}/></button>
          {open ? <ChevronUp size={20} color="var(--text-secondary)"/> : <ChevronDown size={20} color="var(--text-secondary)"/>}
        </div>
      </div>
      
      {open && (
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.5rem' }}>Parameter</th>
                <th style={{ padding: '0.5rem' }}>Specification</th>
                <th style={{ padding: '0.5rem', width: '40px' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.5rem' }}>
                    <input className="form-input" value={row.parameter} onChange={e => updateRow(i, 'parameter', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input className="form-input" value={row.specification} onChange={e => updateRow(i, 'specification', e.target.value)} style={{ width: '100%', padding: '0.4rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}/>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <button onClick={() => removeRow(i)} style={{ background: 'transparent', border: 'none', color: 'var(--error-red, #ef4444)', cursor: 'pointer' }}><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}>
            <Plus size={16} /> Add Parameter
          </button>
        </div>
      )}
    </div>
  );
}
