import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { API_BASE } from '../config';

export default function ManageEquipmentsModal({ isOpen, onClose, token, isAdmin, onEquipmentChange }) {
  const [equipments, setEquipments] = useState([]);
  const [newEquipName, setNewEquipName] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningToast, setWarningToast] = useState({ visible: false, message: '' });
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [equipToDelete, setEquipToDelete] = useState(null);
  const [dangerToast, setDangerToast] = useState({ visible: false, message: '' });

  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/equipments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch equipment list');
      }
      const data = await res.json();
      setEquipments(data);
    } catch (err) {
      showWarning(err.message || 'Error loading equipments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEquipments();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const showWarning = (msg) => {
    setWarningToast({ visible: true, message: msg });
    setTimeout(() => {
      setWarningToast({ visible: false, message: '' });
    }, 2000);
  };

  const showSuccess = (msg) => {
    setSuccessToast({ visible: true, message: msg });
    setTimeout(() => {
      setSuccessToast({ visible: false, message: '' });
    }, 2000);
  };

  const showDanger = (msg) => {
    setDangerToast({ visible: true, message: msg });
    setTimeout(() => {
      setDangerToast({ visible: false, message: '' });
    }, 2000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newEquipName.trim()) {
      showWarning('Please enter an equipment name');
      return;
    }
    const trimmed = newEquipName.trim();
    
    // Local check for duplicate (case-insensitive)
    const isDuplicate = equipments.some(
      (eq) => eq.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      showWarning('Equipment already exists');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/equipments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmed })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add equipment');
      }
      setNewEquipName('');
      showSuccess('Equipment added successfully');
      await fetchEquipments();
      if (onEquipmentChange) {
        onEquipmentChange();
      }
    } catch (err) {
      showWarning(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setEquipToDelete(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/equipments/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete equipment');
      }
      showDanger('Equipment deleted successfully');
      await fetchEquipments();
      if (onEquipmentChange) {
        onEquipmentChange();
      }
    } catch (err) {
      showWarning(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 2500 }}>
      <Spinner active={loading} />

      <div className="modal-content" style={{ width: '100%', maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Manage Major Equipments</h3>
          <button className="modal-close" aria-label="Close modal" type="button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="equipments-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '4px' }}>
            {equipments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No equipments found.</p>
            ) : (
              equipments.map((eq) => (
                <div key={eq._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 14px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  marginBottom: '8px',
                  transition: 'var(--transition-smooth)'
                }}>
                  <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{eq.name}</span>
                  {isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => setEquipToDelete({ id: eq._id, name: eq.name })}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--status-lost)',
                        cursor: 'pointer',
                        fontSize: '1.1rem',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        transition: 'var(--transition-smooth)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(248, 113, 113, 0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                      title="Delete equipment"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <input 
              type="text"
              className="form-input"
              placeholder="Enter new equipment name..."
              value={newEquipName}
              onChange={(e) => setNewEquipName(e.target.value)}
              style={{ flex: 1, margin: 0 }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary"
              style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </form>

          {!isAdmin && (
            <div style={{
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              textAlign: 'center',
              marginTop: '4px'
            }}>
              ℹ️ Only administrators can delete equipments.
            </div>
          )}

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" type="button" onClick={onClose}>Close</button>
        </div>
      </div>

      {/* Toast Warning Message */}
      {warningToast.visible && (
        <div className="toast-warning-banner" style={{ zIndex: 3100 }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>{warningToast.message}</span>
        </div>
      )}

      {/* Toast Success Message */}
      {successToast.visible && (
        <div className="toast-success-banner" style={{ zIndex: 3100 }}>
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <span>{successToast.message}</span>
        </div>
      )}

      {/* Toast Danger Message */}
      {dangerToast.visible && (
        <div className="toast-danger-banner" style={{ zIndex: 3100 }}>
          <span style={{ fontSize: '1.2rem' }}>🗑️</span>
          <span>{dangerToast.message}</span>
        </div>
      )}
      {/* Custom Yes/No Delete Confirmation Modal */}
      {equipToDelete && (
        <div className="modal-overlay" style={{ zIndex: 2600 }}>
          <div className="modal-content small" style={{ width: '90%', maxWidth: '360px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button 
                className="modal-close" 
                aria-label="Close modal" 
                type="button" 
                onClick={() => setEquipToDelete(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning-subtext" style={{ fontSize: '1.05rem', margin: '12px 0', color: 'var(--text-primary)' }}>
                Are you sure you want to delete <strong>"{equipToDelete.name}"</strong>?
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={() => setEquipToDelete(null)}>No</button>
              <button className="btn btn-danger" type="button" onClick={() => handleDelete(equipToDelete.id)}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
