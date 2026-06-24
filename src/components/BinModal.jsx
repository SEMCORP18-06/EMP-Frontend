import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { API_BASE } from '../config';

export default function BinModal({ isOpen, onClose, token, isAdmin, onRecoverSuccess }) {
  const [binList, setBinList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Permanent Delete states
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [enquiryToPermDelete, setEnquiryToPermDelete] = useState(null);
  const [confirmDeleteAllOpen, setConfirmDeleteAllOpen] = useState(false);

  const fetchBin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/bin`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to fetch deleted enquiries.');
      }
      const data = await res.json();
      setBinList(data);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load Recycle Bin.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBin();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRecover = async (id) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/bin/${id}/recover`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to recover enquiry.');
      }
      // Notify parent to refresh list, close modal and show toast
      onRecoverSuccess();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to recover enquiry.');
      setLoading(false);
    }
  };

  const triggerPermanentDelete = (item) => {
    setEnquiryToPermDelete(item);
    setConfirmDeleteOpen(true);
  };

  const handlePermanentDelete = async () => {
    if (!enquiryToPermDelete) return;
    setLoading(true);
    setError('');
    setConfirmDeleteOpen(false);
    try {
      const res = await fetch(`${API_BASE}/bin/${enquiryToPermDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to permanently delete enquiry.');
      }
      // Refresh list
      await fetchBin();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to delete enquiry permanently.');
    } finally {
      setLoading(false);
      setEnquiryToPermDelete(null);
    }
  };

  const handleDeleteAll = async () => {
    setLoading(true);
    setError('');
    setConfirmDeleteAllOpen(false);
    try {
      const res = await fetch(`${API_BASE}/bin`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Failed to empty recycle bin.');
      }
      await fetchBin();
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to empty recycle bin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" style={{ zIndex: 1100 }}>
        <div className="modal-content large" style={{ maxWidth: '850px' }}>
          <div className="modal-header">
            <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗑️</span> Recycle Bin (Deleted Enquiries)
            </h3>
            <button className="modal-close" aria-label="Close Recycle Bin" onClick={onClose}>&times;</button>
          </div>

          <div style={{ 
            background: 'rgba(226, 135, 67, 0.08)', 
            borderBottom: '1px solid rgba(226, 135, 67, 0.15)', 
            padding: '10px 24px', 
            fontSize: '0.88rem', 
            color: '#e28743', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            fontWeight: '500' 
          }}>
            <span>ℹ️</span> Enquiries in the Recycle Bin will be deleted automatically after 30 days.
          </div>

          <div className="modal-body" style={{ maxHeight: '450px', overflowY: 'auto' }}>
            {error && <div style={{ color: '#f87171', marginBottom: '16px', textAlign: 'center' }}>{error}</div>}
            
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}>
                <Spinner />
              </div>
            ) : binList.length === 0 ? (
              <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🗑️</div>
                <div className="empty-state-title" style={{ fontSize: '1.1rem', fontWeight: '600' }}>Your Recycle Bin is empty</div>
                <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>Deleted enquiries will appear here for recovery.</p>
              </div>
            ) : (
              <div className="table-responsive">
              <table className="custom-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Quotation Number</th>
                    <th>Client / Company</th>
                    <th>Major Equipments</th>
                    <th>FPR</th>
                    {isAdmin && <th>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {binList.map(item => (
                    <tr key={item._id}>
                      <td style={{ fontWeight: '600' }}>{item.quotationNumber || '-'}</td>
                      <td>
                        <div>{item.clientName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.companyName}</div>
                      </td>
                      <td style={{ fontSize: '0.88rem' }}>{item.majorEquipments}</td>
                      <td>{item.fpr || '-'}</td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button 
                              className="action-btn modify" 
                              onClick={() => handleRecover(item._id)}
                              style={{ 
                                background: 'rgba(99, 102, 241, 0.15)', 
                                color: 'var(--accent-primary)', 
                                border: '1px solid rgba(99, 102, 241, 0.3)', 
                                padding: '6px 10px', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Recover Enquiry"
                            >
                              🔄
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => triggerPermanentDelete(item)}
                              style={{ 
                                background: 'rgba(239, 68, 68, 0.15)', 
                                color: '#f87171', 
                                border: '1px solid rgba(239, 68, 68, 0.3)', 
                                padding: '6px 10px', 
                                borderRadius: '6px', 
                                cursor: 'pointer',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Permanently Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </div>

          <div className="modal-footer bin-modal-footer" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            {binList.length > 0 ? (
              <button 
                className="btn btn-danger" 
                onClick={() => setConfirmDeleteAllOpen(true)}
                style={{ 
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>🗑️</span> Delete All Enquiries
              </button>
            ) : (
              <div />
            )}
            <button className="btn btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>

      {/* Warning Popup for Permanent Delete */}
      {confirmDeleteOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content small" style={{ maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#f87171' }}>⚠️ Warning</h3>
              <button className="modal-close" onClick={() => setConfirmDeleteOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Data will be deleted permanently
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteOpen(false)}>No</button>
              <button className="btn btn-danger" onClick={handlePermanentDelete}>Yes</button>
            </div>
          </div>
        </div>
      )}
      {/* Warning Popup for Empty Recycle Bin */}
      {confirmDeleteAllOpen && (
        <div className="modal-overlay" style={{ zIndex: 1200 }}>
          <div className="modal-content small" style={{ maxWidth: '400px', border: '1px solid rgba(239, 68, 68, 0.4)' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#f87171' }}>⚠️ Warning</h3>
              <button className="modal-close" onClick={() => setConfirmDeleteAllOpen(false)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '24px 16px', textAlign: 'center' }}>
              <p style={{ fontSize: '1.05rem', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Delete all enquiries permanently?
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setConfirmDeleteAllOpen(false)}>No</button>
              <button className="btn btn-danger" onClick={handleDeleteAll}>Yes</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
