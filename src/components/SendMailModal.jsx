import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import { API_BASE } from '../config';

export default function SendMailModal({ isOpen, onClose, enquiry, token, showSuccessToast }) {
  const [toEmail, setToEmail] = useState('');
  const [ccEmails, setCcEmails] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentBase64, setAttachmentBase64] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Set default state values when modal opens
  useEffect(() => {
    if (isOpen && enquiry) {
      setToEmail(enquiry.mailId || '');
      setCcEmails('');
      const po = enquiry.poNumber || '';
      const poSuffix = po ? ` - PO: ${po}` : '';
      setSubject(`Project Confirmation${poSuffix}`);
      setMessage('');
      setAttachment(null);
      setAttachmentBase64(null);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, enquiry]);

  if (!isOpen || !enquiry) return null;

  const handleFileChange = (file) => {
    if (!file) return;

    // Check size: limit to 15MB
    const maxSize = 15 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrorMsg('Attachment is too large. Maximum size is 15MB.');
      setAttachment(null);
      setAttachmentBase64(null);
      return;
    }

    setErrorMsg('');
    setAttachment(file);

    // Convert file to Base64
    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result.split(',')[1];
      setAttachmentBase64({
        filename: file.name,
        data: base64Data
      });
    };
    reader.onerror = () => {
      setErrorMsg('Failed to process file attachment.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!toEmail.trim()) {
      setErrorMsg('Recipient email address is required.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Subject is required.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Mail content message is required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch(`${API_BASE}/enquiries/${enquiry._id}/send-custom-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: toEmail.trim(),
          cc: ccEmails.trim() || undefined,
          subject: subject.trim(),
          message: message.trim(),
          attachment: attachmentBase64
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send email.');
      }

      setSuccessMsg('Email sent successfully to the client!');
      if (showSuccessToast) {
        showSuccessToast('Email sent successfully to the client!');
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while sending the email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content medium" style={{ borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.2)' }}>
        <div className="modal-header" style={{ background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.05) 0%, rgba(2, 132, 199, 0.05) 100%)', borderBottom: '1px solid var(--border-color)', padding: '18px 24px' }}>
          <h3 className="modal-title" style={{ fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✉️</span> Project Confirmation Email
          </h3>
          <button className="modal-close" onClick={onClose} aria-label="Close modal" style={{ fontSize: '1.5rem', transition: 'color 0.2s' }}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ padding: '24px' }}>
            {errorMsg && <div className="error-banner" style={{ borderRadius: '8px', marginBottom: '16px' }}>{errorMsg}</div>}
            {successMsg && <div className="success-banner" style={{ borderRadius: '8px', marginBottom: '16px' }}>{successMsg}</div>}

            {/* Editable Recipient Field */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email-recipient" style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Recipient Email (To) *</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', fontSize: '1.1rem', pointerEvents: 'none', color: 'var(--text-secondary)' }}>📧</span>
                <input
                  id="email-recipient"
                  type="email"
                  className="form-control"
                  placeholder="Enter recipient email address"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  disabled={loading}
                  required
                  style={{
                    borderRadius: '10px',
                    padding: '10px 14px 10px 38px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    fontSize: '0.92rem',
                    transition: 'border-color 0.25s ease'
                  }}
                />
              </div>
            </div>

            {/* CC Recipients Field */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email-cc" style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>CC (Additional Recipients)</label>
              <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                <span style={{ position: 'absolute', left: '14px', fontSize: '1.1rem', pointerEvents: 'none', color: 'var(--text-secondary)' }}>👥</span>
                <input
                  id="email-cc"
                  type="text"
                  className="form-control"
                  placeholder="e.g. john@example.com, jane@example.com"
                  value={ccEmails}
                  onChange={(e) => setCcEmails(e.target.value)}
                  disabled={loading}
                  style={{
                    borderRadius: '10px',
                    padding: '10px 14px 10px 38px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-card)',
                    fontSize: '0.92rem',
                    transition: 'border-color 0.25s ease'
                  }}
                />
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', display: 'block' }}>Separate multiple email addresses with commas</span>
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email-subject" style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Subject *</label>
              <input
                id="email-subject"
                type="text"
                className="form-control"
                placeholder="Enter email subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                disabled={loading}
                required
                style={{
                  borderRadius: '10px',
                  padding: '10px 14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  fontSize: '0.92rem',
                  transition: 'border-color 0.25s ease'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label htmlFor="email-message" style={{ fontWeight: '600', display: 'block', marginBottom: '6px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Message Content *</label>
              <textarea
                id="email-message"
                className="form-control"
                rows="7"
                placeholder="Write your confirmation message here..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={loading}
                required
                style={{ 
                  resize: 'vertical',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-card)',
                  fontSize: '0.92rem',
                  lineHeight: '1.5',
                  transition: 'border-color 0.25s ease'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '8px' }}>
              <label style={{ fontWeight: '600', display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: 'var(--text-primary)' }}>Attachment</label>
              
              {attachment ? (
                <div className="send-mail-modal-file-card">
                  <div className="send-mail-modal-file-card-details">
                    <div className="send-mail-modal-file-card-icon">
                      📎
                    </div>
                    <div className="send-mail-modal-file-card-info">
                      <span className="send-mail-modal-file-card-name" title={attachment.name}>
                        {attachment.name}
                      </span>
                      <span className="send-mail-modal-file-card-size">
                        {(attachment.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="send-mail-modal-file-card-remove"
                    onClick={(e) => {
                      e.preventDefault();
                      setAttachment(null);
                      setAttachmentBase64(null);
                    }}
                    title="Remove file"
                  >
                    🗑️
                  </button>
                </div>
              ) : (
                <div 
                  className={`send-mail-modal-dropzone ${dragActive ? 'active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="email-file-attachment"
                    onChange={(e) => handleFileChange(e.target.files[0])}
                    disabled={loading}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      cursor: 'pointer'
                    }}
                  />
                  <div>
                    <span className="send-mail-modal-dropzone-icon">📤</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)', display: 'block', fontWeight: '500' }}>
                      Drag & drop your file here, or <span style={{ color: '#0ea5e9', textDecoration: 'underline' }}>browse</span>
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                      Supports any file type up to 15MB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', padding: '16px 24px', background: 'var(--bg-card-hover)' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={loading}
              style={{ borderRadius: '10px', padding: '9px 18px' }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                borderColor: '#0284c7',
                borderRadius: '10px',
                padding: '9px 20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.15)',
                transition: 'all 0.2s ease'
              }}
            >
              {loading ? (
                <>
                  <Spinner /> Sending...
                </>
              ) : (
                <>
                  🚀 Send Email
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
