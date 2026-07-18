import React, { useState, useEffect } from 'react';
import DeleteModal from './DeleteModal';
import ManageFprsModal from './ManageFprsModal';
import ConfirmModal from './ConfirmModal';
import MilestoneRemarksModal from './MilestoneRemarksModal';
import { API_BASE } from '../config';

const DEFAULT_MILESTONES = [
  "project start",
  "Kickoff meeting",
  "Lay-Out Preparation and approval",
  "Civil drawings and site lay-out",
  "GAD Preperation",
  "MEE+ATFD GA preparation",
  "QAP Preperation",
  "Fabrication drawings preperation",
  "Raw material",
  "Preparation for fabrication",
  "Equipment febrication",
  "Structure fabrication",
  "Structure Galvanization",
  "ATFD fabrication and m/c",
  "Structure erection",
  "Equipment erection",
  "PLC panel development",
  "Cabling and piping",
  "Hydro test",
  "Labling",
  "Internal inspection",
  "Final Inspection",
  "Dismantel and dispatch",
  "Site erection",
  "Out side skid piping",
  "Water test run and commissioning"
];

const getInitials = (name) => {
  if (!name) return '';
  const cleanName = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '');
  const parts = cleanName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0] ? parts[0].substring(0, 2).toUpperCase() : '';
};

const getAvatarColor = (name) => {
  const colors = [
    '#6366f1', // Indigo
    '#06b6d4', // Cyan
    '#14b8a6', // Teal
    '#10b981', // Emerald
    '#eab308', // Yellow/Gold
    '#f97316', // Orange
    '#ec4899', // Pink
    '#a855f7', // Purple
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function MilestoneModal({ isOpen, isAdmin, isSystemAdmin, onClose, onSubmit, enquiry, token, username, displayName }) {
  const [localMilestones, setLocalMilestones] = useState([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [indexToDelete, setIndexToDelete] = useState(null);
  const [fprs, setFprs] = useState([]);
  const [isManageFprsOpen, setIsManageFprsOpen] = useState(false);
  const [activeFprDropdownIdx, setActiveFprDropdownIdx] = useState(null);
  const [fprSearchQuery, setFprSearchQuery] = useState('');
  const [isConfirmClientOpen, setIsConfirmClientOpen] = useState(false);
  const [pendingMilestones, setPendingMilestones] = useState(null);
  const [sendClientMailFlag, setSendClientMailFlag] = useState(false);
  const [activeRemarksMilestoneIdx, setActiveRemarksMilestoneIdx] = useState(null);

  const filteredFprs = fprs.filter(fpr => 
    fpr.name.toLowerCase().includes(fprSearchQuery.toLowerCase()) || 
    (fpr.email && fpr.email.toLowerCase().includes(fprSearchQuery.toLowerCase()))
  );

  const fetchFprs = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/fprs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch FPRs');
      const data = await res.json();
      setFprs(data);
    } catch (err) {
      console.error('Error fetching FPRs:', err);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchFprs();
    }
  }, [isOpen, token]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const insideSelect = event.target.closest('.table-select-container');
      if (!insideSelect) {
        setActiveFprDropdownIdx(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Load milestones from enquiry prop when open or updated
  useEffect(() => {
    if (isOpen && enquiry) {
      if (enquiry.milestones && enquiry.milestones.length > 0) {
        const normalized = enquiry.milestones.map(m => {
          let remarksArr = Array.isArray(m.remarks) ? [...m.remarks] : [];
          if (remarksArr.length === 0 && m.remark && m.remark.trim()) {
            remarksArr.push({
              _id: 'rem_legacy_' + Math.random().toString(36).substring(2, 7),
              text: m.remark.trim(),
              authorName: m.fpr || 'System',
              createdBy: 'legacy',
              createdAt: enquiry.updatedAt || enquiry.createdAt || new Date().toISOString(),
              updatedAt: enquiry.updatedAt || enquiry.createdAt || new Date().toISOString()
            });
          }
          return {
            ...m,
            remarks: remarksArr
          };
        });
        setLocalMilestones(normalized);
      } else {
        const defaults = DEFAULT_MILESTONES.map(name => ({
          name,
          fpr: '',
          startDate: '',
          endDate: '',
          actualEndDate: '',
          status: 'Pending',
          remark: '',
          remarks: [],
          percentage: 0
        }));
        setLocalMilestones(defaults);
      }
    }
  }, [enquiry, isOpen]);

  const handleMoveRow = (index, direction) => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === localMilestones.length - 1) return;
    
    const updated = [...localMilestones];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    
    setLocalMilestones(updated);
  };

  const handleInsertRowBelow = (index) => {
    const updated = [...localMilestones];
    updated.splice(index + 1, 0, {
      name: '',
      fpr: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      actualEndDate: '',
      status: 'Pending',
      remark: '',
      remarks: [],
      percentage: 0
    });
    setLocalMilestones(updated);
  };

  if (!isOpen) return null;

  const handleFieldChange = (index, field, value) => {
    const updated = [...localMilestones];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    if (field === 'status') {
      if (value === 'Completed') {
        updated[index].actualEndDate = new Date().toISOString().split('T')[0];
      } else if (value === 'In Progress' || value === 'Pending') {
        updated[index].actualEndDate = '';
      }
    }
    setLocalMilestones(updated);
  };

  const handleAddRow = () => {
    setLocalMilestones([
      ...localMilestones,
      {
        name: '',
        fpr: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        actualEndDate: '',
        status: 'Pending',
        remark: '',
        remarks: [],
        percentage: 0
      }
    ]);
  };

  const handleRemoveRow = (index) => {
    setIndexToDelete(index);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRow = () => {
    if (indexToDelete !== null) {
      const updated = localMilestones.filter((_, idx) => idx !== indexToDelete);
      setLocalMilestones(updated);
    }
    setIsDeleteModalOpen(false);
    setIndexToDelete(null);
  };

  const hasNewlyAllottedMilestones = (milestones) => {
    const originalMilestones = enquiry?.milestones || [];
    if (milestones.length !== originalMilestones.length) {
      return true;
    }
    for (let i = 0; i < milestones.length; i++) {
      const sub = milestones[i];
      if (!sub.fpr || !sub.fpr.trim()) {
        continue;
      }
      const orig = originalMilestones[i];
      if (!orig) {
        return true;
      } else {
        const origFpr = orig.fpr ? orig.fpr.trim() : '';
        const subFpr = sub.fpr.trim();
        if (origFpr !== subFpr) {
          return true;
        } else {
          const nameChanged = (orig.name || '').trim() !== (sub.name || '').trim();
          const startChanged = (orig.startDate || '') !== (sub.startDate || '');
          const endChanged = (orig.endDate || '') !== (sub.endDate || '');
          const statusChanged = (orig.status || '') !== (sub.status || '');
          const remarkChanged = (orig.remark || '').trim() !== (sub.remark || '').trim();
          const actualEndChanged = (orig.actualEndDate || '') !== (sub.actualEndDate || '');
          const percentageChanged = (Number(orig.percentage) || 0) !== (Number(sub.percentage) || 0);

          if (nameChanged || startChanged || endChanged || statusChanged || remarkChanged || actualEndChanged || percentageChanged) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate that all milestone names are filled
    const invalid = localMilestones.some(m => !m.name.trim());
    if (invalid) {
      alert("Please enter a name for all milestones.");
      return;
    }
    // Validate that weight percentages sum to exactly 100%
    const totalWeight = localMilestones.reduce((sum, m) => sum + (Number(m.percentage) || 0), 0);
    if (totalWeight !== 100) {
      alert(`The sum of all milestone weights must be exactly 100%. Current sum: ${totalWeight}%`);
      return;
    }
    const mappedMilestones = localMilestones.map(m => ({
      name: m.name.trim(),
      fpr: m.fpr ? m.fpr.trim() : '',
      startDate: m.startDate || '',
      endDate: m.endDate || '',
      actualEndDate: m.actualEndDate || '',
      status: m.status || 'Pending',
      remark: (m.remarks && m.remarks.length > 0) ? m.remarks[m.remarks.length - 1].text : (m.remark || ''),
      remarks: m.remarks || [],
      percentage: Number(m.percentage) || 0
    }));

    const originalMilestones = enquiry?.milestones || [];
    let hasNewlyCompleted = false;

    for (let i = 0; i < mappedMilestones.length; i++) {
      const sub = mappedMilestones[i];
      if (sub.status === 'Completed') {
        const orig = originalMilestones[i];
        if (!orig || orig.status !== 'Completed') {
          hasNewlyCompleted = true;
          break;
        }
      }
    }

    setPendingMilestones(mappedMilestones);
    setSendClientMailFlag(false);

    if (hasNewlyCompleted) {
      setIsConfirmClientOpen(true);
    } else {
      const notifyFpr = hasNewlyAllottedMilestones(mappedMilestones);
      onSubmit(mappedMilestones, false, notifyFpr);
    }
  };

  const handleConfirmClientEmail = () => {
    setIsConfirmClientOpen(false);
    setSendClientMailFlag(true);
    const notifyFpr = hasNewlyAllottedMilestones(pendingMilestones);
    onSubmit(pendingMilestones, true, notifyFpr);
  };

  const handleCancelClientEmail = () => {
    setIsConfirmClientOpen(false);
    setSendClientMailFlag(false);
    const notifyFpr = hasNewlyAllottedMilestones(pendingMilestones);
    onSubmit(pendingMilestones, false, notifyFpr);
  };

  const completedPercentage = localMilestones.reduce((acc, m) => m.status === 'Completed' ? acc + (m.percentage || 0) : acc, 0);

  return (
    <div className="modal-overlay">
      <div className="modal-content extra-large">
        <div className="modal-header">
          <h3 className="modal-title">Milestones Tracker - PO Number: {enquiry?.poNumber || '-'}</h3>
          <button className="modal-close" aria-label="Close modal" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="milestones-modal-subheader" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <strong>Company:</strong> {enquiry?.companyName} | <strong>Client:</strong> {enquiry?.clientName}
              </div>
            </div>

            {/* Graphical Progress Bar */}
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.88rem', fontWeight: '600' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Overall Project Completion</span>
                <span style={{ color: 'var(--accent-primary)' }}>{completedPercentage}%</span>
              </div>
              <div style={{ width: '100%', background: 'var(--bg-tertiary)', borderRadius: '6px', height: '10px', overflow: 'hidden' }}>
                <div style={{ width: `${completedPercentage}%`, background: 'var(--accent-primary)', height: '100%', borderRadius: '6px', transition: 'width 0.3s ease' }}></div>
              </div>
            </div>

            <div className="table-responsive" style={{ maxHeight: '450px', overflowY: 'auto' }}>
              <table className="custom-table milestone-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th className="col-milestone" style={{ width: isAdmin ? '24%' : '28%' }}>Milestone <span style={{ color: 'red' }}>*</span></th>
                    <th style={{ width: isAdmin ? '11%' : '12%' }}>FPR</th>
                    <th style={{ width: '11%' }}>Start Date</th>
                    <th style={{ width: '11%' }}>End Date</th>
                    <th style={{ width: '11%' }}>Actual End Date</th>
                    <th style={{ width: '11%' }}>Status</th>
                    <th className="col-remark" style={{ width: isAdmin ? '11%' : '12%' }}>Remark</th>
                    <th style={{ width: '8%' }}>Weight (%)</th>
                    {isAdmin && <th style={{ width: '6%' }}>Action</th>}
                  </tr>
                </thead>
                <tbody>
                  {localMilestones.length === 0 ? (
                    <tr>
                      <td colSpan={isAdmin ? 8 : 7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-secondary)' }}>
                        No milestones defined yet. {isAdmin && 'Click "+ Add New" to start tracking.'}
                      </td>
                    </tr>
                  ) : (
                    localMilestones.map((m, idx) => (
                      <tr key={idx}>
                        {isAdmin ? (
                          <>
                            <td className="col-milestone">
                              <input
                                type="text"
                                className="form-input table-input"
                                value={m.name}
                                onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                                placeholder="e.g. Drawings Approval"
                                required
                              />
                            </td>
                            <td className="table-select-container" style={{ position: 'relative' }}>
                              <div
                                className="form-input table-input"
                                style={{
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  padding: '5px 8px',
                                  background: 'var(--bg-secondary)',
                                  border: '1px solid var(--border-color)',
                                  borderRadius: '6px',
                                  fontSize: '0.82rem',
                                  height: '34px',
                                  userSelect: 'none'
                                }}
                                onClick={() => {
                                  if (activeFprDropdownIdx === idx) {
                                    setActiveFprDropdownIdx(null);
                                  } else {
                                    setActiveFprDropdownIdx(idx);
                                    setFprSearchQuery('');
                                  }
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
                                  {m.fpr ? (
                                    <>
                                      <div 
                                        className="fpr-avatar small" 
                                        style={{ backgroundColor: getAvatarColor(m.fpr) }}
                                      >
                                        {getInitials(m.fpr)}
                                      </div>
                                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
                                        {m.fpr}
                                      </span>
                                    </>
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)' }}>Select FPR...</span>
                                  )}
                                </div>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.6rem', paddingLeft: '4px' }}>
                                  {activeFprDropdownIdx === idx ? '▲' : '▼'}
                                </span>
                              </div>

                              {activeFprDropdownIdx === idx && (
                                <>
                                  <div 
                                    className="form-input-dropdown"
                                    style={{ 
                                      position: 'absolute', 
                                      top: '100%', 
                                      left: 0, 
                                      minWidth: '220px', 
                                      background: 'var(--bg-tertiary)', 
                                      border: '1px solid var(--border-focus)', 
                                      borderRadius: '8px', 
                                      marginTop: '4px', 
                                      maxHeight: '260px', 
                                      overflowY: 'auto', 
                                      zIndex: 999,
                                      boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                                      padding: '0'
                                    }}
                                  >
                                    <div className="fpr-search-container" style={{ padding: '6px' }}>
                                      <input
                                        type="text"
                                        className="fpr-search-input"
                                        placeholder="Search FPR..."
                                        value={fprSearchQuery}
                                        onChange={(e) => setFprSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ padding: '6px 8px', fontSize: '0.8rem' }}
                                        autoFocus
                                      />
                                    </div>

                                    <div style={{ maxHeight: '140px', overflowY: 'auto', padding: '4px 0' }}>
                                      <div 
                                        onClick={() => {
                                          handleFieldChange(idx, 'fpr', '');
                                          setActiveFprDropdownIdx(null);
                                        }}
                                        className="fpr-clear-option"
                                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                      >
                                        None (Clear)
                                      </div>
                                      
                                      {filteredFprs.length === 0 ? (
                                        <div style={{ padding: '8px 12px', color: 'var(--text-muted)', fontSize: '0.78rem', textAlign: 'center' }}>
                                          No FPRs found
                                        </div>
                                      ) : (
                                        filteredFprs.map(fpr => {
                                          const isSelected = m.fpr === fpr.name;
                                          return (
                                            <div 
                                              key={fpr._id}
                                              onClick={() => {
                                                handleFieldChange(idx, 'fpr', fpr.name);
                                                setActiveFprDropdownIdx(null);
                                              }}
                                              className="fpr-option-row"
                                              style={{
                                                padding: '6px 12px',
                                                gap: '8px',
                                                background: isSelected ? 'var(--accent-glow)' : 'transparent',
                                              }}
                                            >
                                              <div 
                                                className="fpr-avatar small" 
                                                style={{ backgroundColor: getAvatarColor(fpr.name) }}
                                              >
                                                {getInitials(fpr.name)}
                                              </div>
                                              <div className="fpr-option-details">
                                                <span className="fpr-option-name" style={{ fontSize: '0.8rem' }}>{fpr.name}</span>
                                                <span className="fpr-option-email" style={{ fontSize: '0.7rem' }}>{fpr.email || 'No email'}</span>
                                              </div>
                                              {isSelected && <span className="fpr-option-checkmark" style={{ fontSize: '0.8rem' }}>✓</span>}
                                            </div>
                                          );
                                        })
                                      )}
                                    </div>

                                    <>
                                      <div style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />
                                      <div 
                                        onClick={() => {
                                          setActiveFprDropdownIdx(null);
                                          setIsManageFprsOpen(true);
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          padding: '8px 12px',
                                          cursor: 'pointer',
                                          userSelect: 'none',
                                          fontSize: '0.8rem',
                                          fontWeight: '600',
                                          color: 'var(--accent-primary)',
                                          transition: 'background 0.2s',
                                          background: 'var(--bg-tertiary)'
                                        }}
                                        className="dropdown-option-label"
                                      >
                                        <span>⚙️ Manage FPRs</span>
                                      </div>
                                    </>
                                  </div>
                                </>
                              )}
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-input table-input"
                                style={{ width: '100%', minWidth: '105px' }}
                                value={m.startDate}
                                onChange={(e) => handleFieldChange(idx, 'startDate', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-input table-input"
                                style={{ width: '100%', minWidth: '105px' }}
                                value={m.endDate}
                                onChange={(e) => handleFieldChange(idx, 'endDate', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="date"
                                className="form-input table-input"
                                style={{ width: '100%', minWidth: '105px' }}
                                value={m.actualEndDate}
                                onChange={(e) => handleFieldChange(idx, 'actualEndDate', e.target.value)}
                              />
                            </td>
                            <td>
                              <select
                                className="select-filter table-select"
                                value={m.status}
                                onChange={(e) => handleFieldChange(idx, 'status', e.target.value)}
                                style={{ width: '100%' }}
                              >
                                <option value="Pending">Pending</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Completed">Completed</option>
                              </select>
                            </td>
                            <td className="col-remark" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={`remarks-trigger-btn ${m.remarks && m.remarks.length > 0 ? 'has-remarks' : ''}`}
                                onClick={() => setActiveRemarksMilestoneIdx(idx)}
                              >
                                💬 Remarks ({m.remarks ? m.remarks.length : 0})
                              </button>
                            </td>
                            <td>
                              <input
                                type="number"
                                className="form-input table-input"
                                value={m.percentage !== undefined ? m.percentage : 0}
                                onChange={(e) => handleFieldChange(idx, 'percentage', parseFloat(e.target.value) || 0)}
                                placeholder="0"
                                min="0"
                                max="100"
                                style={{ width: '100%', textAlign: 'center' }}
                              />
                            </td>
                            <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                  <button
                                    type="button"
                                    className="action-btn insert-btn"
                                    onClick={() => handleInsertRowBelow(idx)}
                                    title="Insert Milestone Below"
                                  >
                                    ➕
                                  </button>
                                  <button
                                    type="button"
                                    className="action-btn delete"
                                    onClick={() => handleRemoveRow(idx)}
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="col-milestone" style={{ fontWeight: '600' }}>{m.name}</td>
                            <td>{m.fpr || '-'}</td>
                            <td>{m.startDate || '-'}</td>
                            <td>{m.endDate || '-'}</td>
                            <td>{m.actualEndDate || '-'}</td>
                            <td>
                              <span className={`status-badge milestone-status ${m.status.toLowerCase().replace(' ', '-')}`}>
                                {m.status}
                              </span>
                            </td>
                            <td className="col-remark" style={{ textAlign: 'center' }}>
                              <button
                                type="button"
                                className={`remarks-trigger-btn ${m.remarks && m.remarks.length > 0 ? 'has-remarks' : ''}`}
                                onClick={() => setActiveRemarksMilestoneIdx(idx)}
                              >
                                💬 Remarks ({m.remarks ? m.remarks.length : 0})
                              </button>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--accent-primary)', fontSize: '0.85rem' }}>
                              {m.percentage || 0}%
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>
              Close
            </button>
            {isAdmin && (
              <button className="btn btn-primary" type="submit">
                Save
              </button>
            )}
          </div>
        </form>
      </div>
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setIndexToDelete(null);
        }}
        onConfirm={confirmDeleteRow}
      />
      <ManageFprsModal
        isOpen={isManageFprsOpen}
        onClose={() => setIsManageFprsOpen(false)}
        token={token}
        isAdmin={isSystemAdmin}
        onFprChange={fetchFprs}
      />
      <ConfirmModal
        isOpen={isConfirmClientOpen}
        title="Send Client Update"
        message="Do you want to send the status update to the client?"
        confirmText="Yes"
        cancelText="No"
        onConfirm={handleConfirmClientEmail}
        onClose={handleCancelClientEmail}
      />
      {activeRemarksMilestoneIdx !== null && localMilestones[activeRemarksMilestoneIdx] && (
        <MilestoneRemarksModal
          isOpen={activeRemarksMilestoneIdx !== null}
          onClose={() => setActiveRemarksMilestoneIdx(null)}
          milestoneName={localMilestones[activeRemarksMilestoneIdx].name}
          poNumber={enquiry?.poNumber}
          remarks={localMilestones[activeRemarksMilestoneIdx].remarks || []}
          onSaveRemarks={(updatedRemarks) => {
            const updated = [...localMilestones];
            updated[activeRemarksMilestoneIdx] = {
              ...updated[activeRemarksMilestoneIdx],
              remarks: updatedRemarks,
              remark: updatedRemarks.length > 0 ? updatedRemarks[updatedRemarks.length - 1].text : ''
            };
            setLocalMilestones(updated);
          }}
          currentUsername={username}
          currentDisplayName={displayName}
        />
      )}
    </div>
  );
}
