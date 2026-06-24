import React from 'react';

export default function ConfirmModal({ isOpen, title, message, confirmText = 'Yes', cancelText = 'No', onConfirm, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content small">
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" aria-label="Close modal" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div style={{ fontSize: '1.05rem', margin: '12px 0', color: 'var(--text-primary)' }}>
            {message}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>{cancelText}</button>
          <button className="btn btn-primary" onClick={onConfirm}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
}
