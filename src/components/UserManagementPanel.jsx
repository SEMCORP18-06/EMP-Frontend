import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function UserManagementPanel({ token, currentUsername }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null); // stores user ID of active update
  
  // Local confirmation modal state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const fetchUsers = async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch users list');
      }
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleRoleChange = async (userId, newRole) => {
    if (!token) return;
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update user role');
      }
      // Update local state
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
    } catch (err) {
      console.error('Error updating role:', err);
      alert(err.message || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setIsConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!token || !userToDelete) return;
    const userId = userToDelete._id;
    setIsConfirmOpen(false);
    setActionLoading(userId);
    try {
      const res = await fetch(`${API_BASE}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete user');
      }
      // Remove from local list
      setUsers(prev => prev.filter(u => u._id !== userId));
    } catch (err) {
      console.error('Error deleting user:', err);
      alert(err.message || 'Failed to delete user');
    } finally {
      setActionLoading(null);
      setUserToDelete(null);
    }
  };

  return (
    <div className="table-card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Portal Users</h3>
        <button 
          className="add-btn" 
          onClick={fetchUsers} 
          disabled={loading}
          style={{ fontSize: '0.85rem', padding: '8px 14px' }}
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#f87171', borderRadius: '8px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '60px 0' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(255,255,255,0.1)', borderTop: '4px solid var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : (
        <div className="table-responsive">
          <table className="custom-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email (Username)</th>
                <th>Role</th>
                <th>Email Verification</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-secondary)' }}>
                    No other users registered.
                  </td>
                </tr>
              ) : (
                users.map(u => {
                  const isSelf = u.username === currentUsername;
                  const isUpdating = actionLoading === u._id;
                  
                  return (
                    <tr key={u._id} style={{ opacity: isUpdating ? 0.6 : 1 }}>
                      <td style={{ fontWeight: '500' }}>{u.name || '-'}</td>
                      <td>{u.username}</td>
                      <td>
                        {isSelf ? (
                          <span className="status-badge admin" style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                            {u.role} (You)
                          </span>
                        ) : (
                          <select
                            className="select-filter table-select"
                            value={u.role}
                            disabled={isUpdating}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            style={{ 
                              width: '120px', 
                              padding: '4px 8px', 
                              fontSize: '0.82rem',
                              background: 'var(--bg-secondary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '6px',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <option value="General">General</option>
                            <option value="Admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td>
                        <span className={`status-badge ${u.isEmailVerified ? 'completed' : 'pending'}`} style={{ fontSize: '0.8rem', padding: '4px 10px' }}>
                          {u.isEmailVerified ? 'Verified' : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {isSelf ? (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>-</span>
                        ) : (
                          <button
                            className="action-btn delete"
                            disabled={isUpdating}
                            onClick={() => handleDeleteClick(u)}
                            style={{ 
                              padding: '5px 12px', 
                              fontSize: '0.8rem', 
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.3)',
                              color: '#f87171',
                              borderRadius: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirmation Modal */}
      {isConfirmOpen && userToDelete && (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-content small">
            <div className="modal-header">
              <h3 className="modal-title">Confirm User Deletion</h3>
              <button 
                type="button" 
                className="modal-close" 
                aria-label="Close modal" 
                onClick={() => {
                  setIsConfirmOpen(false);
                  setUserToDelete(null);
                }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.95rem', lineHeight: '1.5', color: 'var(--text-primary)', margin: 0 }}>
                Are you sure you want to permanently delete user <strong>{userToDelete.name || userToDelete.username}</strong> ({userToDelete.username})? This action cannot be undone.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsConfirmOpen(false);
                  setUserToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
