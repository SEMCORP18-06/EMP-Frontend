import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { API_BASE } from '../config';

export default function ManageProjectEngineersModal({ isOpen, onClose, token, isAdmin, onProjectEngineerChange }) {
  const [engineers, setEngineers] = useState([]);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newContactNumber, setNewContactNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [warningToast, setWarningToast] = useState({ visible: false, message: '' });
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });
  const [engineerToDelete, setEngineerToDelete] = useState(null);
  const [dangerToast, setDangerToast] = useState({ visible: false, message: '' });

  const fetchEngineers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/project-engineers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch Project Engineers list');
      }
      const data = await res.json();
      setEngineers(data);
    } catch (err) {
      showWarning(err.message || 'Error loading Project Engineers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEngineers();
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
    if (!newName.trim()) {
      showWarning('Please enter a Project Engineer name');
      return;
    }
    const trimmedName = newName.trim();
    const trimmedEmail = newEmail.trim();
    const trimmedContactNumber = newContactNumber.trim();

    // Local check for duplicate (case-insensitive)
    const isDuplicate = engineers.some(
      (eng) => eng.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      showWarning('Project Engineer already exists');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/project-engineers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, contactNumber: trimmedContactNumber })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to add Project Engineer');
      }
      setNewName('');
      setNewEmail('');
      setNewContactNumber('');
      showSuccess('Project Engineer added successfully');
      await fetchEngineers();
      if (onProjectEngineerChange) {
        onProjectEngineerChange();
      }
    } catch (err) {
      showWarning(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    setEngineerToDelete(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/project-engineers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete Project Engineer');
      }
      showDanger('Project Engineer deleted successfully');
      await fetchEngineers();
      if (onProjectEngineerChange) {
        onProjectEngineerChange();
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
          <h3 className="modal-title">Manage Project Engineers</h3>
          <button className="modal-close" aria-label="Close modal" type="button" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div className="equipments-list" style={{ maxHeight: '240px', overflowY: 'auto', paddingRight: '4px' }}>
            {engineers.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', margin: '20px 0' }}>No Project Engineers found.</p>
            ) : (
              engineers.map((eng) => (
                <div key={eng._id} style={{
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
                    <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{eng.name}</span>
                    {(eng.email || eng.contactNumber) && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {eng.email || 'No email'}{eng.contactNumber ? ` | ${eng.contactNumber}` : ''}
                      </span>
                    )}
                  </div>
                  {isAdmin && (
                    <button 
                      type="button" 
                      onClick={() => setEngineerToDelete({ id: eng._id, name: eng.name })}
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
                      title="Delete Project Engineer"
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
                placeholder="Enter Project Engineer name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                style={{ margin: 0 }}
                disabled={loading}
                required
              />
              <input 
                type="email"
                className="form-input"
                placeholder="Enter Project Engineer email (optional)..."
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                style={{ margin: 0 }}
                disabled={loading}
              />
              <input 
                type="tel"
                className="form-input"
                placeholder="Enter Project Engineer contact number (optional)..."
                value={newContactNumber}
                onChange={(e) => setNewContactNumber(e.target.value)}
                style={{ margin: 0 }}
                disabled={loading}
              />
              <button 
                type="submit" 
                className="btn btn-primary"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '42px' }}
                disabled={loading}
              >
                {loading ? 'Adding...' : 'Add Project Engineer'}
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
              ℹ️ Only administrators can add or delete Project Engineers.
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
      {engineerToDelete && (
        <div className="modal-overlay" style={{ zIndex: 2600 }}>
          <div className="modal-content small" style={{ width: '90%', maxWidth: '360px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Confirm Delete</h3>
              <button 
                className="modal-close" 
                aria-label="Close modal" 
                type="button" 
                onClick={() => setEngineerToDelete(null)}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-warning-subtext" style={{ fontSize: '1.05rem', margin: '12px 0', color: 'var(--text-primary)' }}>
                Are you sure you want to delete <strong>"{engineerToDelete.name}"</strong>?
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" type="button" onClick={() => setEngineerToDelete(null)}>No</button>
              <button className="btn btn-danger" type="button" onClick={() => handleDelete(engineerToDelete.id)}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
