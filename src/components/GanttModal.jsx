import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

export default function GanttModal({ isOpen, onClose, enquiry }) {
  const [isEmailSectionOpen, setIsEmailSectionOpen] = useState(false);
  const [emailTo, setEmailTo] = useState('');
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
      // Ensure start is before or equal to end
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
    
    // We add 1 day so that same-day milestones don't have 0 width
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

  // Generate grid marks (e.g. 5 columns)
  const gridMarks = [];
  if (minDate && maxDate) {
    const steps = 4; // 5 markers (0%, 25%, 50%, 75%, 100%)
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
          <h3 className="modal-title">📊 Gantt Chart: {enquiry.companyName}</h3>
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
                    // Cap bounds
                    if (leftPercent + widthPercent > 100) {
                      widthPercent = 100 - leftPercent;
                    }
                    if (widthPercent < 2) {
                      widthPercent = 2; // ensure minimum visibility
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

          {/* Collapsible Progress Email Section */}
          <div className="gantt-email-section">
            <button 
              className="gantt-email-toggle-btn"
              onClick={() => setIsEmailSectionOpen(!isEmailSectionOpen)}
              type="button"
            >
              <span>📧 Send Progress Update to Client</span>
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
                    <label htmlFor="emailSubject">Subject:</label>
                    <input
                      id="emailSubject"
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject"
                      required
                      className="form-control-input"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="emailMessage">Custom Message (Notes on project progress):</label>
                  <textarea
                    id="emailMessage"
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    placeholder="Write your custom progress message here..."
                    rows="4"
                    className="form-control-textarea"
                  />
                </div>

                {/* Picture Uploader */}
                <div className="form-group">
                  <label>📸 Upload Progress Pictures:</label>
                  <div 
                    className="gantt-file-dropzone"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('gantt-file-input').click()}
                  >
                    <input
                      id="gantt-file-input"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div className="dropzone-prompt">
                      <span className="upload-icon">📤</span>
                      <p>Drag & Drop progress images here, or <strong>click to browse</strong></p>
                      <span className="upload-note">Supports PNG, JPG, JPEG, GIF</span>
                    </div>
                  </div>

                  {/* Image Previews */}
                  {images.length > 0 && (
                    <div className="gantt-image-previews">
                      {images.map((img, index) => (
                        <div key={index} className="preview-thumbnail-container">
                          <img src={img.data} alt={img.name} className="preview-thumbnail" />
                          <button 
                            type="button" 
                            className="preview-remove-btn" 
                            onClick={() => removeImage(index)}
                            title="Remove image"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Toggle options */}
                <div className="form-group-checkbox">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={includeGanttChart}
                      disabled={validMilestones.length === 0}
                      onChange={(e) => setIncludeGanttChart(e.target.checked)}
                    />
                    Include HTML Gantt Chart timeline table in the email
                  </label>
                  {validMilestones.length === 0 && (
                    <span className="checkbox-warning-hint">⚠️ Dates not set; Gantt chart cannot be attached.</span>
                  )}
                </div>

                <div className="gantt-email-actions">
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-send-update" 
                    disabled={isSending}
                  >
                    {isSending ? (
                      <>
                        <span className="loading-spinner-small"></span> Sending...
                      </>
                    ) : 'Send Progress Update'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
