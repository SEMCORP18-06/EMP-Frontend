import React from 'react';

export default function DeleteModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content small">
        <div className="modal-header">
          <h3 className="modal-title">Confirm Delete</h3>
          <button className="modal-close" aria-label="Close modal" onClick={onClose}>&times;</button>
        </div>
        
        <div className="modal-body">
          <div className="delete-warning-subtext" style={{ fontSize: '1.05rem', margin: '12px 0' }}>
            Are you absolutely sure you want to proceed?
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>No</button>
          <button className="btn btn-danger" onClick={onConfirm}>Yes</button>
        </div>
      </div>
    </div>
  );
}
