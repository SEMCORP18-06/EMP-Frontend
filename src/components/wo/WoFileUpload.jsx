import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';

export default function WoFileUpload({ label, onUpload, optional }) {
  const [drag, setDrag] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div 
      style={{
        border: `2px dashed ${drag ? 'var(--accent-primary, #6366f1)' : 'var(--border-color)'}`,
        background: drag ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)',
        borderRadius: '16px',
        padding: '3rem 2rem',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        cursor: 'pointer'
      }}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => document.getElementById(`wo-file-upload-${label}`)?.click()}
    >
      <input type="file" id={`wo-file-upload-${label}`} style={{ display: 'none' }} onChange={handleChange} accept="application/pdf" />
      <UploadCloud size={48} color="var(--accent-primary, #6366f1)" style={{ margin: '0 auto 1rem' }} />
      <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{label}</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
        Drag and drop your PDF here, or click to browse
      </p>
      {optional && <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', display: 'inline-block', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Optional</div>}
    </div>
  );
}
