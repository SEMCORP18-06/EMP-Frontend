import React, { useState, useEffect } from 'react';
import { Mail, Plus, X, Paperclip, Send, RefreshCw } from 'lucide-react';

export default function SendWorkOrderMailModal({ isOpen, onClose, woData, downloadUrl, token, showToast }) {
  const [toEmails, setToEmails] = useState([]);
  const [toInput, setToInput] = useState('');
  const [ccEmails, setCcEmails] = useState([]);
  const [ccInput, setCcInput] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filename = `${woData?.job_no || 'WO'}_WorkOrder.pdf`;

  useEffect(() => {
    if (isOpen && woData) {
      const clientMail = woData.client_name?.value || '';
      setToEmails(clientMail ? [clientMail] : []);
      setToInput('');
      setCcEmails([]);
      setCcInput('');
      
      const jobNo = woData.job_no || '';
      const clientName = typeof woData.client_name === 'object' ? woData.client_name.value : (woData.client_name || '');
      const projectName = typeof woData.project_name === 'object' ? woData.project_name.value : (woData.project_name || '');
      
      setSubject(`SEMCO Work Order: ${jobNo} - ${clientName}`);
      setMessage(
        `Dear Team / Client,\n\nPlease find attached the official SEMCO Work Order (${jobNo}) for ${projectName}.\n\n` +
        `Work Order Summary:\n` +
        `- Job No.: ${jobNo}\n` +
        `- Client Name: ${clientName}\n` +
        `- PO No.: ${woData.po_no || 'N/A'}\n` +
        `- Sales Person: ${woData.sales_person || 'N/A'}\n\n` +
        `Best regards,\nSEMCO Groups Team`
      );
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, woData]);

  if (!isOpen) return null;

  // Add email helper
  const addEmail = (type) => {
    if (type === 'to') {
      const trimmed = toInput.trim().replace(/,/g, '');
      if (trimmed && !toEmails.includes(trimmed)) {
        setToEmails([...toEmails, trimmed]);
        setToInput('');
      }
    } else {
      const trimmed = ccInput.trim().replace(/,/g, '');
      if (trimmed && !ccEmails.includes(trimmed)) {
        setCcEmails([...ccEmails, trimmed]);
        setCcInput('');
      }
    }
  };

  const removeEmail = (type, emailToRemove) => {
    if (type === 'to') {
      setToEmails(toEmails.filter(e => e !== emailToRemove));
    } else {
      setCcEmails(ccEmails.filter(e => e !== emailToRemove));
    }
  };

  const handleKeyDown = (e, type) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ' ') {
      e.preventDefault();
      addEmail(type);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Add any remaining text in input
    let finalTo = [...toEmails];
    if (toInput.trim()) {
      const val = toInput.trim().replace(/,/g, '');
      if (!finalTo.includes(val)) finalTo.push(val);
    }

    let finalCc = [...ccEmails];
    if (ccInput.trim()) {
      const val = ccInput.trim().replace(/,/g, '');
      if (!finalCc.includes(val)) finalCc.push(val);
    }

    if (finalTo.length === 0) {
      setErrorMsg('At least one recipient email (To) is required.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const API_BASE = import.meta.env.VITE_API_BASE || 'https://emp-backend-amber.vercel.app/api';
      const res = await fetch(`${API_BASE}/send-workorder-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          to: finalTo.join(', '),
          cc: finalCc.join(', '),
          subject: subject.trim(),
          message: message.trim(),
          pdfUrl: downloadUrl,
          filename: filename
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send Work Order email');
      }

      setSuccessMsg('Work Order email sent successfully!');
      if (showToast) showToast('Work Order email sent successfully!');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to send email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
      <div style={{ background: 'var(--bg-secondary)', borderRadius: '16px', border: '1px solid var(--border-color)', width: '100%', maxWidth: '650px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        
        {/* Header */}
        <div style={{ padding: '1.2rem 1.5rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(79, 70, 229, 0.1) 100%)', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Mail size={20} color="var(--accent-primary, #6366f1)" /> Email Work Order Document
          </h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          {errorMsg && <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--error-red, #ef4444)', color: 'var(--error-red, #ef4444)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{errorMsg}</div>}
          {successMsg && <div style={{ background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--success-green, #22c55e)', color: 'var(--success-green, #22c55e)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>{successMsg}</div>}

          {/* Recipient TO Field with Multiple Badges */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Recipient Email (To) * <span style={{ fontWeight: 'normal', fontSize: '0.75rem' }}>(Press Enter or comma to add multiple)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '44px', alignItems: 'center' }}>
              {toEmails.map(email => (
                <span key={email} style={{ background: 'var(--accent-primary, #6366f1)', color: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  {email}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeEmail('to', email)} />
                </span>
              ))}
              <input 
                type="email" 
                placeholder={toEmails.length === 0 ? "Enter recipient email and press Enter..." : "Add another email..."} 
                value={toInput}
                onChange={e => setToInput(e.target.value)}
                onKeyDown={e => handleKeyDown(e, 'to')}
                onBlur={() => addEmail('to')}
                style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', minWidth: '180px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* CC Field with Multiple Badges */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              CC (Additional Recipients) <span style={{ fontWeight: 'normal', fontSize: '0.75rem' }}>(Optional)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', padding: '0.5rem', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '8px', minHeight: '44px', alignItems: 'center' }}>
              {ccEmails.map(email => (
                <span key={email} style={{ background: 'rgba(255,255,255,0.15)', color: 'var(--text-primary)', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  {email}
                  <X size={14} style={{ cursor: 'pointer' }} onClick={() => removeEmail('cc', email)} />
                </span>
              ))}
              <input 
                type="email" 
                placeholder={ccEmails.length === 0 ? "e.g. sales@semcogroups.com..." : "Add CC email..."} 
                value={ccInput}
                onChange={e => setCcInput(e.target.value)}
                onKeyDown={e => handleKeyDown(e, 'cc')}
                onBlur={() => addEmail('cc')}
                style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', outline: 'none', minWidth: '180px', fontSize: '0.9rem' }}
              />
            </div>
          </div>

          {/* Subject */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Subject *</label>
            <input 
              type="text" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
              required 
            />
          </div>

          {/* Message Content */}
          <div style={{ marginBottom: '1.2rem' }}>
            <label style={{ display: 'block', fontWeight: 'bold', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Message Content *</label>
            <textarea 
              value={message} 
              onChange={e => setMessage(e.target.value)} 
              rows={6}
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.9rem', lineHeight: '1.5' }}
              required
            />
          </div>

          {/* PDF Attachment Badge */}
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Paperclip size={18} color="var(--accent-primary, #6366f1)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>{filename}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Generated Work Order PDF Attachment</div>
            </div>
            <span style={{ fontSize: '0.75rem', background: 'var(--success-green, #22c55e)', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>Attached</span>
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={loading} style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '0.6rem 1.5rem', borderRadius: '8px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              {loading ? <><RefreshCw className="spin" size={16} /> Sending Email...</> : <><Send size={16} /> Send Email</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
