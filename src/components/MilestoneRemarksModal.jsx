import React, { useState, useEffect, useRef } from 'react';

const getInitials = (name) => {
  if (!name) return 'U';
  const cleanName = name.replace(/^(Mr\.|Ms\.|Mrs\.|Dr\.)\s+/i, '');
  const parts = cleanName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0] ? parts[0].substring(0, 2).toUpperCase() : 'U';
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

const formatTimestamp = (dateStr) => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (e) {
    return dateStr;
  }
};

export default function MilestoneRemarksModal({
  isOpen,
  onClose,
  milestoneName,
  poNumber,
  remarks = [],
  onSaveRemarks,
  currentUsername = '',
  currentDisplayName = ''
}) {
  const [newRemarkText, setNewRemarkText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const chatEndRef = useRef(null);

  const activeUserKey = (currentUsername || '').trim().toLowerCase();
  const activeUserDisplayName = currentDisplayName || currentUsername || 'User';

  useEffect(() => {
    if (isOpen) {
      setNewRemarkText('');
      setEditingId(null);
      setEditingText('');
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen, remarks.length]);

  if (!isOpen) return null;

  const handleAddRemark = (e) => {
    e?.preventDefault();
    if (!newRemarkText.trim()) return;

    const newRemark = {
      _id: 'rem_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      text: newRemarkText.trim(),
      authorName: activeUserDisplayName,
      createdBy: activeUserKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updated = [...remarks, newRemark];
    onSaveRemarks(updated);
    setNewRemarkText('');
  };

  const handleStartEdit = (remark) => {
    setEditingId(remark._id);
    setEditingText(remark.text);
  };

  const handleSaveEdit = (remarkId) => {
    if (!editingText.trim()) return;
    const updated = remarks.map(r => {
      if (r._id === remarkId) {
        return {
          ...r,
          text: editingText.trim(),
          updatedAt: new Date().toISOString()
        };
      }
      return r;
    });
    onSaveRemarks(updated);
    setEditingId(null);
    setEditingText('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingText('');
  };

  const handleDeleteRemark = (remarkId) => {
    if (window.confirm("Are you sure you want to delete this remark?")) {
      const updated = remarks.filter(r => r._id !== remarkId);
      onSaveRemarks(updated);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddRemark();
    }
  };

  return (
    <div className="modal-overlay remarks-modal-overlay">
      <div className="modal-content remarks-modal-container">
        {/* Header */}
        <div className="remarks-modal-header">
          <div className="remarks-header-title-group">
            <h4 className="remarks-modal-title">💬 Remarks Thread</h4>
            <span className="remarks-milestone-tag">{milestoneName || 'Milestone'}</span>
            {poNumber && <span className="remarks-po-badge">PO: {poNumber}</span>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close remarks">&times;</button>
        </div>

        {/* Chat Thread Body */}
        <div className="remarks-chat-body">
          {remarks.length === 0 ? (
            <div className="remarks-empty-state">
              <div className="remarks-empty-icon">💬</div>
              <p>No remarks recorded for this milestone yet.</p>
              <span>Write a remark below to start the conversation.</span>
            </div>
          ) : (
            <div className="remarks-thread">
              {remarks.map((item, index) => {
                const itemAuthorKey = (item.createdBy || '').trim().toLowerCase();
                const isMyRemark = itemAuthorKey === activeUserKey || (activeUserKey === 'admin' || activeUserKey === 'systemadmin');
                const isEditing = editingId === item._id;

                return (
                  <div key={item._id || index} className={`remark-card ${isMyRemark ? 'my-remark' : 'other-remark'}`}>
                    <div className="remark-avatar" style={{ backgroundColor: getAvatarColor(item.authorName || item.createdBy) }}>
                      {getInitials(item.authorName || item.createdBy)}
                    </div>
                    <div className="remark-content-box">
                      <div className="remark-meta-bar">
                        <span className="remark-author-name">
                          {item.authorName || item.createdBy || 'Unknown'}
                          {isMyRemark && <span className="remark-you-tag"> (You)</span>}
                        </span>
                        <span className="remark-timestamp">{formatTimestamp(item.createdAt)}</span>

                        {isMyRemark && !isEditing && (
                          <div className="remark-action-btns">
                            <button
                              type="button"
                              className="remark-icon-btn edit-btn"
                              onClick={() => handleStartEdit(item)}
                              title="Edit remark"
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="remark-icon-btn delete-btn"
                              onClick={() => handleDeleteRemark(item._id)}
                              title="Delete remark"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="remark-edit-box">
                          <textarea
                            className="form-input remark-edit-input"
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            rows={2}
                            autoFocus
                          />
                          <div className="remark-edit-actions">
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              onClick={() => handleSaveEdit(item._id)}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="remark-text-body">{item.text}</div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* New Remark Input Footer */}
        <div className="remarks-modal-footer">
          <form className="remarks-input-form" onSubmit={handleAddRemark}>
            <textarea
              className="form-input remarks-input-textarea"
              placeholder="Write a remark... (Press Enter to send)"
              value={newRemarkText}
              onChange={(e) => setNewRemarkText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />
            <button
              type="submit"
              className="btn btn-primary remarks-send-btn"
              disabled={!newRemarkText.trim()}
            >
              <span>Send</span>
              <span className="send-icon">📤</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
