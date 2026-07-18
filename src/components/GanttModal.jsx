import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function GanttModal({ isOpen, onClose, enquiry, showSuccessToast }) {
  const [isEmailSectionOpen, setIsEmailSectionOpen] = useState(true);
  const [emailTo, setEmailTo] = useState('');
  const [emailCc, setEmailCc] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [includeGanttChart, setIncludeGanttChart] = useState(true);
  const [images, setImages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (enquiry) {
      setEmailTo(enquiry.mailId || '');
      setEmailCc('');
      setEmailSubject(`Project Progress Update: ${enquiry.companyName || '-'} (PO: ${enquiry.poNumber || '-'})`);
      setEmailMessage('');
      setImages([]);
      setErrorMsg('');
      setSuccessMsg('');
      setIsSending(false);
    }
  }, [enquiry]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files are allowed.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [
          ...prev,
          {
            name: file.name,
            data: reader.result
          }
        ]);
      };
      reader.onerror = () => {
        setErrorMsg('Failed to read image file.');
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;

    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Only image files are allowed.');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImages(prev => [
          ...prev,
          {
            name: file.name,
            data: reader.result
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!emailTo || !emailTo.trim()) {
      setErrorMsg('Recipient email is required.');
      return;
    }

    setIsSending(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/enquiries/${enquiry._id}/send-progress-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: emailTo.trim(),
          cc: emailCc.trim() || undefined,
          subject: emailSubject.trim(),
          message: emailMessage,
          includeGantt: includeGanttChart,
          images: images
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send progress email.');
      }

      setSuccessMsg('Progress update email sent successfully!');
      if (showSuccessToast) {
        showSuccessToast('Progress update email sent successfully!');
      }
      setEmailMessage('');
      setImages([]);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'An error occurred while sending the email.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen || !enquiry) return null;

  const milestones = enquiry.milestones || [];
  
  // Helper to parse dates YYYY-MM-DD
  const parseDate = (dStr) => {
    if (!dStr || dStr.trim() === '' || dStr === '-') return null;
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? null : d;
  };

  // Find milestones with valid dates
  const timedMilestones = milestones.map(m => {
    const start = parseDate(m.startDate);
    const end = parseDate(m.endDate);
    if (start && end) {
      return {
        ...m,
        start: start < end ? start : end,
        end: start < end ? end : start,
        hasDates: true
      };
    }
    return { ...m, hasDates: false };
  });

  const validMilestones = timedMilestones.filter(m => m.hasDates);

  let minDate = null;
  let maxDate = null;
  let totalDurationMs = 0;
  let durationDays = 0;

  if (validMilestones.length > 0) {
    minDate = new Date(Math.min(...validMilestones.map(m => m.start.getTime())));
    maxDate = new Date(Math.max(...validMilestones.map(m => m.end.getTime())));
    
    totalDurationMs = maxDate.getTime() - minDate.getTime();
    if (totalDurationMs === 0) {
      totalDurationMs = 24 * 60 * 60 * 1000; // 1 day
    }
    durationDays = Math.ceil(totalDurationMs / (24 * 60 * 60 * 1000)) + 1;
    totalDurationMs = durationDays * 24 * 60 * 60 * 1000;
  }

  // Formatting dates for display
  const formatDate = (date) => {
    if (!date) return '-';
    return date.toISOString().split('T')[0];
  };

  // Generate grid marks (5 columns: 0%, 25%, 50%, 75%, 100%)
  const gridMarks = [];
  if (minDate && maxDate) {
    const steps = 4;
    for (let i = 0; i <= steps; i++) {
      const timeOffset = (totalDurationMs * i) / steps;
      const dateMark = new Date(minDate.getTime() + timeOffset);
      gridMarks.push({
        percentage: (i / steps) * 100,
        label: formatDate(dateMark)
      });
    }
  }

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'Completed': return 'status-completed';
      case 'In Progress': return 'status-inprogress';
      default: return 'status-pending';
    }
  };

  // Calculate overall progress weight-wise
  const completedProgress = milestones.reduce((acc, m) => {
    return m.status === 'Completed' ? acc + (m.percentage || 0) : acc;
  }, 0);

  return (
    <div className="modal-overlay gantt-modal-overlay">
      <div className="modal-content large gantt-modal-content">
        <div className="modal-header">
          <h3 className="modal-title">📊 Gantt Chart & Progress Report: {enquiry.companyName}</h3>
          <button className="modal-close" aria-label="Close modal" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body gantt-modal-body">
          {/* Project Summary Header Cards */}
          <div className="gantt-summary-grid">
            <div className="summary-card">
              <span className="summary-card-label">Client Name</span>
              <span className="summary-card-value">{enquiry.clientName}</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-label">PO Number</span>
              <span className="summary-card-value">{enquiry.poNumber || '-'}</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-label">Expected Dispatch Date</span>
              <span className="summary-card-value">{enquiry.expectedDateOfDispatch || '-'}</span>
            </div>
            <div className="summary-card">
              <span className="summary-card-label">Project Engineer</span>
              <span className="summary-card-value">{enquiry.projectEngineer || '-'}</span>
            </div>
            <div className="summary-card progress-summary-card">
              <span className="summary-card-label">Overall Completion</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                <span className="summary-card-value" style={{ margin: 0 }}>{completedProgress}%</span>
                <div className="gantt-progress-bar-bg">
                  <div className="gantt-progress-bar-fill" style={{ width: `${completedProgress}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Gantt Chart Container */}
          {validMilestones.length === 0 ? (
            <div className="gantt-empty-state">
              <span style={{ fontSize: '3rem', marginBottom: '12px', display: 'block' }}>ℹ️</span>
              <h4>Timeline Dates Not Configured</h4>
              <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '8px auto 0 auto', fontSize: '0.95rem', lineHeight: '1.5' }}>
                None of the milestones for this project have both Start Date and End Date configured. 
                Please open the <strong>Milestone Manager</strong> to set valid dates to generate the Gantt chart.
              </p>
            </div>
          ) : (
            <div className="gantt-chart-container">
              {/* Gantt Header Timeline Grid Labels */}
              <div className="gantt-timeline-header">
                <div className="gantt-sidebar-placeholder" />
                <div className="gantt-timeline-track-header">
                  {gridMarks.map((mark, i) => (
                    <div 
                      key={i} 
                      className="gantt-grid-label" 
                      style={{ 
                        left: `${mark.percentage}%`, 
                        transform: i === 4 ? 'translateX(-100%)' : i > 0 ? 'translateX(-50%)' : 'none' 
                      }}
                    >
                      {mark.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Gantt Rows */}
              <div className="gantt-chart-body">
                {timedMilestones.map((m, idx) => {
                  let leftPercent = 0;
                  let widthPercent = 0;
                  let durationInDays = 0;

                  if (m.hasDates) {
                    leftPercent = ((m.start.getTime() - minDate.getTime()) / totalDurationMs) * 100;
                    widthPercent = ((m.end.getTime() - m.start.getTime() + (24 * 60 * 60 * 1000)) / totalDurationMs) * 100;
                    
                    // Cap bounds strictly inside 0% - 100%
                    if (leftPercent < 0) leftPercent = 0;
                    if (leftPercent > 98) leftPercent = 98;
                    if (leftPercent + widthPercent > 100) {
                      widthPercent = 100 - leftPercent;
                    }
                    if (widthPercent < 1.5) {
                      widthPercent = 1.5;
                    }
                    if (leftPercent + widthPercent > 100) {
                      leftPercent = 100 - widthPercent;
                    }
                    durationInDays = Math.ceil((m.end.getTime() - m.start.getTime()) / (24 * 60 * 60 * 1000)) + 1;
                  }

                  return (
                    <div key={idx} className="gantt-row">
                      {/* Left Sidebar Info */}
                      <div className="gantt-row-sidebar">
                        <div className="gantt-milestone-title" title={m.name}>
                          {m.name}
                        </div>
                        <div className="gantt-milestone-meta">
                          <span className="gantt-meta-weight">{m.percentage || 0}% weight</span>
                          {m.fpr && <span className="gantt-meta-fpr" title={`FPR: ${m.fpr}`}>👤 {m.fpr}</span>}
                        </div>
                      </div>

                      {/* Right Timeline Bar */}
                      <div className="gantt-row-track">
                        {/* Render vertical helper grid lines */}
                        {gridMarks.map((mark, i) => (
                          <div 
                            key={i} 
                            className="gantt-grid-line" 
                            style={{ left: `${mark.percentage}%` }}
                          />
                        ))}

                        {m.hasDates ? (
                          <div 
                            className={`gantt-bar ${getStatusColorClass(m.status)}`}
                            style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                          >
                            <span className="gantt-bar-label">
                              {durationInDays}d
                            </span>
                            
                            {/* CSS Tooltip */}
                            <div className="gantt-tooltip">
                              <strong>{m.name}</strong>
                              <hr style={{ border: 'none', borderTop: '1px solid rgba(255, 255, 255, 0.1)', margin: '6px 0' }} />
                              <div><strong>Status:</strong> {m.status}</div>
                              <div><strong>FPR:</strong> {m.fpr || '-'}</div>
                              <div><strong>Dates:</strong> {m.startDate} to {m.endDate}</div>
                              <div><strong>Duration:</strong> {durationInDays} day{durationInDays > 1 ? 's' : ''}</div>
                              <div><strong>Weight:</strong> {m.percentage || 0}%</div>
                              {m.remark && <div className="gantt-tooltip-remark" style={{ marginTop: '4px', fontStyle: 'italic', opacity: 0.8 }}><strong>Remark:</strong> {m.remark}</div>}
                            </div>
                          </div>
                        ) : (
                          <div className="gantt-bar-unconfigured">
                            Dates not configured
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Progress Report Email Section inside Gantt Chart Popup */}
          <div className="gantt-email-section">
            <button 
              className="gantt-email-toggle-btn"
              onClick={() => setIsEmailSectionOpen(!isEmailSectionOpen)}
              type="button"
            >
              <span>📧 Send Progress Report Email to Client</span>
              <span className="toggle-icon">{isEmailSectionOpen ? '▲' : '▼'}</span>
            </button>

            {isEmailSectionOpen && (
              <form onSubmit={handleSendEmail} className="gantt-email-form">
                {errorMsg && <div className="gantt-email-alert error">{errorMsg}</div>}
                {successMsg && <div className="gantt-email-alert success">{successMsg}</div>}

                <div className="gantt-email-grid">
                  <div className="form-group">
                    <label htmlFor="emailTo">To (Client Email):</label>
                    <input
                      id="emailTo"
                      type="email"
                      value={emailTo}
                      onChange={(e) => setEmailTo(e.target.value)}
                      placeholder="client@example.com"
                      required
                      className="form-control-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="emailCc">CC (Additional Recipients):</label>
                    <input
                      id="emailCc"
                      type="text"
                      value={emailCc}
                      onChange={(e) => setEmailCc(e.target.value)}
                      placeholder="e.g. john@example.com, jane@example.com"
                      className="form-control-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emailSubject">Subject:</label>
                  <input
                    id="emailSubject"
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    required
                    className="form-control-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="emailMessage">Remarks / Message for Client:</label>
                  <textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Enter progress remarks or additional context for the client..."
                    rows={3}
                    className="form-control-textarea"
                  />
                </div>

                <div className="form-group">
                  <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={includeGanttChart}
                      onChange={(e) => setIncludeGanttChart(e.target.checked)}
                    />
                    <span>Attach visual Gantt Chart timeline in email report</span>
                  </label>
                </div>

                {/* File Attachment Dropzone Section */}
                <div className="form-group">
                  <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: 'var(--text-primary)' }}>
                    📎 Attach Files / Site Photos / Inspection Reports:
                  </label>
                  
                  <div 
                    className="gantt-file-dropzone"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <input 
                      type="file" 
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" 
                      multiple 
                      onChange={handleFileChange}
                      id="imageFileInput"
                      style={{ display: 'none' }}
                    />
                    <label htmlFor="imageFileInput" className="gantt-dropzone-label">
                      <span style={{ fontSize: '1.6rem', display: 'block', marginBottom: '2px' }}>📁</span>
                      <span style={{ fontSize: '0.88rem', fontWeight: '600', color: 'var(--accent-primary)' }}>
                        Click to browse or Drag & Drop files here
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Supports Images, PDFs, Inspection Reports & Documents
                      </span>
                    </label>
                  </div>

                  {images.length > 0 && (
                    <div className="gantt-image-preview-grid">
                      {images.map((img, idx) => (
                        <div key={idx} className="gantt-image-preview-card">
                          {img.data && img.data.startsWith('data:image/') ? (
                            <img src={img.data} alt={img.name} />
                          ) : (
                            <div className="gantt-file-icon-placeholder">
                              {img.name.endsWith('.pdf') ? '📄' : img.name.match(/\.(xls|xlsx)$/i) ? '📊' : '📎'}
                            </div>
                          )}
                          <span className="gantt-image-name" title={img.name}>{img.name}</span>
                          <button 
                            type="button" 
                            className="gantt-remove-img-btn"
                            onClick={() => removeImage(idx)}
                            title="Remove attachment"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '14px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={onClose}
                    disabled={isSending}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isSending}
                  >
                    {isSending ? 'Sending Progress Report...' : 'Send Progress Report Email 📤'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
