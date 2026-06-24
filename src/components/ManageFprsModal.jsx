import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { API_BASE } from '../config';

export default function ManageFprsModal({ isOpen, onClose, token, isAdmin, onFprChange }) {
  const [fprs, setFprs] = useState([]);
  const [newFprName, setNewFprName] = useState('');
  const [newFprEmail, setNewFprEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningToast, setWarningToast] = useState({ visible: false, message: '' });
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [fprToDelete, setFprToDelete] = useState(null);
  const [dangerToast, setDangerToast] = useState({ visible: false, message: '' });

  const fetchFprs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fprs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch FPR list');
      }
      const data = await res.json();
      setFprs(data);
    } catch (err) {
      showWarning(err.message || 'Error loading FPRs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFprs();
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
    if (!newFprName.trim()) {
      showWarning('Please enter an FPR name');
      return;
    }
    const trimmedName = newFprName.trim();
    const trimmedEmail = newFprEmail.trim();

    // Local check for duplicate (case-insensitive)
    const isDuplicate = fprs.some(
      (fpr) => fpr.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showWarning('FPR already exists');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fprs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add FPR');
      }
      setNewFprName('');
      setNewFprEmail('');
      showSuccess('FPR added successfully');
      await fetchFprs();
      if (onFprChange) {
        onFprChange();
      }
    } catch (err) {
      showWarning(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setFprToDelete(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/fprs/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete FPR');
      }
      showDanger('FPR deleted successfully');
      await fetchFprs();
      if (onFprChange) {
        onFprChange();
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
          <h3 className="modal-title">Manage FPRs</h3>
          <button className="modal-close" aria-label="Close modal" type="button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="equipments-list" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            {fprs.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No FPRs found.</p>
            ) : (
              fprs.map((fpr) => (
                <div key={fpr._id} style={{
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
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{fpr.name}</span>
                    {fpr.email && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fpr.email}</span>
                    )}
                  </div>
                  {isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => setFprToDelete({ id: fpr._id, name: fpr.name })}
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
                      title="Delete FPR"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {isAdmin ? (
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '8px' }}>
              <input 
                type="text"
                className="form-input"
                placeholder="Enter new FPR name..."
                value={newFprName}
                onChange={(e) => setNewFprName(e.target.value)}
                style={{ margin: 0 }}
                disabled={loading}
              />
              <input 
                type="email"
                className="form-input"
                placeholder="Enter new FPR email (optional)..."
                value={newFprEmail}
                onChange={(e) => setNewFprEmail(e.target.value)}
                style={{ margin: 0 }}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px' }}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add FPR'}
              </button>
            </form>
          ) : (
            <div style={{
              padding: '12px',
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.2)',
              borderRadius: '8px',
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              textAlign: 'center'
            }}>
              ℹ️ Only administrators can add or delete FPRs.
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
      {fprToDelete && (
        <div className="modal-overlay" style={{ zIndex: 2600 }}>
          <div className="modal-content small" style={{ width: '90%', maxWidth: '360px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button 
                className="modal-close" 
                aria-label="Close modal" 
                type="button" 
                onClick={() => setFprToDelete(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning-subtext" style={{ fontSize: '1.05rem', margin: '12px 0', color: 'var(--text-primary)' }}>
                Are you sure you want to delete <strong>"{fprToDelete.name}"</strong>?
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={() => setFprToDelete(null)}>No</button>
              <button className="btn btn-danger" type="button" onClick={() => handleDelete(fprToDelete.id)}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
