import React, { useState, useEffect, useMemo } from 'react';
import ManageEquipmentsModal from './ManageEquipmentsModal';
import ManageFprsModal from './ManageFprsModal';
import ManageProjectEngineersModal from './ManageProjectEngineersModal';
import { API_BASE } from '../config';

const STATUS_OPTIONS = [
  "Costing",
  "Offer submitted",
  "Follow-up in progress",
  "Quotation Submitted",
  "Negotiation ongoing",
  "Lost",
  "Confirmed",
  "-"
];

const COUNTRY_CODES = [
  { code: '+91', label: 'India (+91)' },
  { code: '+1', label: 'USA (+1)' },
  { code: '+44', label: 'UK (+44)' },
  { code: '+971', label: 'UAE (+971)' },
  { code: '+65', label: 'Singapore (+65)' },
  { code: '+61', label: 'Australia (+61)' },
  { code: '+81', label: 'Japan (+81)' },
  { code: '+49', label: 'Germany (+49)' },
  { code: '+33', label: 'France (+33)' },
  { code: '+86', label: 'China (+86)' }
];

const getCountryCodesOptions = (currentCode) => {
  const codes = [...COUNTRY_CODES];
  if (currentCode && !codes.some(c => c.code === currentCode)) {
    codes.push({ code: currentCode, label: `${currentCode}` });
  }
  return codes;
};

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

const INITIAL_STATE = {
  date: new Date().toISOString().split('T')[0],
  quotationNumber: '',
  clientName: '',
  companyName: '',
  enquiryDetails: '',
  majorEquipments: '',
  enquirySource: '',
  fpr: '',
  mailId: '',
  contactCountryCode: '+91',
  contactNumber: '',
  currentStatus: 'Costing',
  offerSubmittedDate: '',
  poNumber: '',
  expectedDateOfDispatch: '',
  projectEngineer: '',
  followUpComments: ''
};

export default function EnquiryModal({ isOpen, onClose, onSubmit, enquiry, isAdmin, token, enquiries = [] }) {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [isEquipDropdownOpen, setIsEquipDropdownOpen] = useState(false);
  const [isFprDropdownOpen, setIsFprDropdownOpen] = useState(false);
  const [warningToast, setWarningToast] = useState({ visible: false, message: '' });
  const [equipments, setEquipments] = useState([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [equipSearchQuery, setEquipSearchQuery] = useState('');
  const [pastEnquiriesList, setPastEnquiriesList] = useState([]);
  const [isClientSuggestionsOpen, setIsClientSuggestionsOpen] = useState(false);
  const [isCompanySuggestionsOpen, setIsCompanySuggestionsOpen] = useState(false);

  const filteredEquipments = equipments.filter(eq => 
    eq.name.toLowerCase().includes(equipSearchQuery.toLowerCase())
  );

  const [fprs, setFprs] = useState([]);
  const [isManageFprsOpen, setIsManageFprsOpen] = useState(false);
  const [fprSearchQuery, setFprSearchQuery] = useState('');
  const [projectEngineers, setProjectEngineers] = useState([]);
  const [isPeDropdownOpen, setIsPeDropdownOpen] = useState(false);
  const [peSearchQuery, setPeSearchQuery] = useState('');
  const [isManageEngineersOpen, setIsManageEngineersOpen] = useState(false);

  const filteredFprs = fprs.filter(fpr => 
    fpr.name.toLowerCase().includes(fprSearchQuery.toLowerCase()) || 
    (fpr.email && fpr.email.toLowerCase().includes(fprSearchQuery.toLowerCase()))
  );

  const filteredEngineers = projectEngineers.filter(pe => 
    pe.name.toLowerCase().includes(peSearchQuery.toLowerCase()) ||
    (pe.email && pe.email.toLowerCase().includes(peSearchQuery.toLowerCase()))
  );

  const fetchPastEnquiries = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/enquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch enquiries');
      const data = await res.json();
      setPastEnquiriesList(data);
    } catch (err) {
      console.error('Error fetching past enquiries:', err);
    }
  };

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

  const fetchProjectEngineers = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/project-engineers`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch Project Engineers');
      const data = await res.json();
      setProjectEngineers(data);
    } catch (err) {
      console.error('Error fetching Project Engineers:', err);
    }
  };

  const fetchEquipments = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/equipments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch equipments');
      const data = await res.json();
      setEquipments(data);
    } catch (err) {
      console.error('Error fetching equipments:', err);
    }
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchEquipments();
      fetchFprs();
      fetchProjectEngineers();
      fetchPastEnquiries();
    }
  }, [isOpen, token]);

  const allEnquiries = (enquiries && enquiries.length > 0) ? enquiries : pastEnquiriesList;

  const pastClients = useMemo(() => {
    if (!allEnquiries || !Array.isArray(allEnquiries)) return [];
    const clientMap = new Map();
    allEnquiries.forEach(enq => {
      if (enq.clientName && enq.clientName.trim()) {
        const key = enq.clientName.trim().toLowerCase();
        if (!clientMap.has(key)) {
          clientMap.set(key, {
            clientName: enq.clientName.trim(),
            companyName: enq.companyName ? enq.companyName.trim() : '',
            mailId: enq.mailId ? enq.mailId.trim() : '',
            contactCountryCode: enq.contactCountryCode || '+91',
            contactNumber: enq.contactNumber ? enq.contactNumber.trim() : ''
          });
        }
      }
    });
    return Array.from(clientMap.values());
  }, [allEnquiries]);

  const matchingClients = useMemo(() => {
    const query = (formData.clientName || '').trim().toLowerCase();
    if (!query) return [];
    return pastClients.filter(c => 
      c.clientName.toLowerCase().includes(query) || 
      (c.companyName && c.companyName.toLowerCase().includes(query))
    );
  }, [pastClients, formData.clientName]);

  const handleSelectClientSuggestion = (c) => {
    setFormData(prev => ({
      ...prev,
      clientName: c.clientName,
      companyName: c.companyName || prev.companyName,
      mailId: c.mailId || prev.mailId,
      contactCountryCode: c.contactCountryCode || prev.contactCountryCode || '+91',
      contactNumber: c.contactNumber || prev.contactNumber
    }));
    setIsClientSuggestionsOpen(false);
  };

  const pastCompanies = useMemo(() => {
    if (!allEnquiries || !Array.isArray(allEnquiries)) return [];
    const companyMap = new Map();
    allEnquiries.forEach(enq => {
      if (enq.companyName && enq.companyName.trim()) {
        const key = enq.companyName.trim().toLowerCase();
        if (!companyMap.has(key)) {
          companyMap.set(key, {
            companyName: enq.companyName.trim(),
            clientName: enq.clientName ? enq.clientName.trim() : '',
            mailId: enq.mailId ? enq.mailId.trim() : '',
            contactCountryCode: enq.contactCountryCode || '+91',
            contactNumber: enq.contactNumber ? enq.contactNumber.trim() : ''
          });
        }
      }
    });
    return Array.from(companyMap.values());
  }, [allEnquiries]);

  const matchingCompanies = useMemo(() => {
    const query = (formData.companyName || '').trim().toLowerCase();
    if (!query) return [];
    return pastCompanies.filter(c => 
      c.companyName.toLowerCase().includes(query) || 
      (c.clientName && c.clientName.toLowerCase().includes(query))
    );
  }, [pastCompanies, formData.companyName]);

  const handleSelectCompanySuggestion = (c) => {
    setFormData(prev => ({
      ...prev,
      companyName: c.companyName,
      clientName: c.clientName || prev.clientName,
      mailId: c.mailId || prev.mailId,
      contactCountryCode: c.contactCountryCode || prev.contactCountryCode || '+91',
      contactNumber: c.contactNumber || prev.contactNumber
    }));
    setIsCompanySuggestionsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const insideEquip = event.target.closest('.equip-dropdown-container');
      if (!insideEquip) {
        setIsEquipDropdownOpen(false);
        setEquipSearchQuery('');
      }
      const insideFpr = event.target.closest('.fpr-dropdown-container');
      if (!insideFpr) {
        setIsFprDropdownOpen(false);
        setFprSearchQuery('');
      }
      const insidePe = event.target.closest('.pe-dropdown-container');
      if (!insidePe) {
        setIsPeDropdownOpen(false);
        setPeSearchQuery('');
      }
      const insideClient = event.target.closest('.client-autocomplete-container');
      if (!insideClient) {
        setIsClientSuggestionsOpen(false);
      }
      const insideCompany = event.target.closest('.company-autocomplete-container');
      if (!insideCompany) {
        setIsCompanySuggestionsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getSelectedEquipments = (str) => {
    if (!str) return [];
    return str.split(',').map(s => s.trim()).filter(Boolean);
  };

  const handleEquipToggle = (option) => {
    const currentList = getSelectedEquipments(formData.majorEquipments);
    let newList;
    if (currentList.includes(option)) {
      newList = currentList.filter(item => item !== option);
    } else {
      newList = [...currentList, option];
    }
    setFormData(prev => ({
      ...prev,
      majorEquipments: newList.join(', ')
    }));
  };

  useEffect(() => {
    if (enquiry) {
      setFormData({
        date: enquiry.date || '',
        quotationNumber: enquiry.quotationNumber || '',
        clientName: enquiry.clientName || '',
        companyName: enquiry.companyName || '',
        enquiryDetails: enquiry.enquiryDetails || '',
        majorEquipments: enquiry.majorEquipments || '',
        enquirySource: enquiry.enquirySource || '',
        fpr: enquiry.fpr || '',
        mailId: enquiry.mailId || '',
        contactCountryCode: enquiry.contactCountryCode || '+91',
        contactNumber: enquiry.contactNumber || '',
        currentStatus: enquiry.currentStatus || 'Costing',
        offerSubmittedDate: enquiry.offerSubmittedDate || '',
        poNumber: enquiry.poNumber || '',
        expectedDateOfDispatch: enquiry.expectedDateOfDispatch || '',
        projectEngineer: enquiry.projectEngineer || '',
        followUpComments: enquiry.followUpComments || ''
      });
    } else {
      setFormData({
        ...INITIAL_STATE,
        date: new Date().toISOString().split('T')[0],
        contactCountryCode: '+91',
        contactNumber: '',
        fpr: '',
        expectedDateOfDispatch: '',
        projectEngineer: ''
      });
    }
  }, [enquiry, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'currentStatus' && value === 'Offer submitted') {
      setFormData(prev => ({
        ...prev,
        currentStatus: value,
        offerSubmittedDate: prev.offerSubmittedDate || new Date().toISOString().split('T')[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFprChange = (e) => {
    const val = e.target.value;
    if (val === 'manage_fprs') {
      setIsManageFprsOpen(true);
    } else {
      setFormData(prev => ({
        ...prev,
        fpr: val
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.majorEquipments) {
      setWarningToast({ visible: true, message: "Please select at least one Major Equipment product." });
      setTimeout(() => {
        setWarningToast({ visible: false, message: "" });
      }, 2000);
      return;
    }

    // Validations:
    // 1. If status is Quotation Submitted, quotationNumber is required
    if (formData.currentStatus === 'Quotation Submitted' && !formData.quotationNumber?.trim()) {
      setWarningToast({ visible: true, message: "Please Enter the Quotation Number" });
      setTimeout(() => {
        setWarningToast({ visible: false, message: "" });
      }, 2000);
      return;
    }
    // 2. If status is Confirmed, poNumber is required
    if (formData.currentStatus === 'Confirmed' && !formData.poNumber?.trim()) {
      setWarningToast({ visible: true, message: "Please Enter the PO Number" });
      setTimeout(() => {
        setWarningToast({ visible: false, message: "" });
      }, 2000);
      return;
    }

    // If status is Confirmed, expectedDateOfDispatch is required
    if (formData.currentStatus === 'Confirmed' && !formData.expectedDateOfDispatch?.trim()) {
      setWarningToast({ visible: true, message: "Please Enter the Expected Date Of Dispatch" });
      setTimeout(() => {
        setWarningToast({ visible: false, message: "" });
      }, 2000);
      return;
    }

    // If status is Confirmed, projectEngineer is required
    if (formData.currentStatus === 'Confirmed' && (!formData.projectEngineer || !formData.projectEngineer.trim() || formData.projectEngineer === '-')) {
      setWarningToast({ visible: true, message: "Please select a Project Engineer" });
      setTimeout(() => {
        setWarningToast({ visible: false, message: "" });
      }, 2000);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setWarningToast({ visible: true, message: err.message || "Action failed" });
      setTimeout(() => {
        setWarningToast({ visible: false, message: "" });
      }, 3000);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h3 className="modal-title">{enquiry ? 'Modify Enquiry' : 'Add New Enquiry'}</h3>
          <button className="modal-close" aria-label="Close modal" type="button" onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="grid-form">

              {/* 1. Enq Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="date">Enq Date</label>
                <input
                  className="form-input"
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 2. Company Name with Auto-Complete */}
              <div className="form-group company-autocomplete-container" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="companyName">Company Name</label>
                <input
                  className="form-input"
                  type="text"
                  id="companyName"
                  name="companyName"
                  placeholder="Enter or search company name..."
                  value={formData.companyName}
                  onChange={(e) => {
                    handleChange(e);
                    setIsCompanySuggestionsOpen(true);
                  }}
                  onFocus={() => setIsCompanySuggestionsOpen(true)}
                  autoComplete="off"
                  required
                />

                {isCompanySuggestionsOpen && matchingCompanies.length > 0 && (
                  <div className="client-suggestions-dropdown">
                    <div className="suggestion-header">
                      <span>Past Companies Database ({matchingCompanies.length})</span>
                      <span className="suggestion-hint">Click to auto-fill Client, Email & Phone</span>
                    </div>
                    {matchingCompanies.map((c, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item"
                        onClick={() => handleSelectCompanySuggestion(c)}
                      >
                        <div className="suggestion-item-main">
                          <span className="suggestion-company-name" style={{ fontWeight: 700, color: 'var(--text-primary)' }}>🏢 {c.companyName}</span>
                          {c.clientName && <span className="suggestion-client-name" style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>👤 {c.clientName}</span>}
                        </div>
                        <div className="suggestion-item-details">
                          {c.mailId && <span className="suggestion-detail">✉️ {c.mailId}</span>}
                          {c.contactNumber && <span className="suggestion-detail">📞 {c.contactCountryCode || '+91'} {c.contactNumber}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. Client Name with Auto-Complete & Contact Auto-Fill */}
              <div className="form-group client-autocomplete-container" style={{ position: 'relative' }}>
                <label className="form-label" htmlFor="clientName">Client Name</label>
                <input
                  className="form-input"
                  type="text"
                  id="clientName"
                  name="clientName"
                  placeholder="Enter or search client name..."
                  value={formData.clientName}
                  onChange={(e) => {
                    handleChange(e);
                    setIsClientSuggestionsOpen(true);
                  }}
                  onFocus={() => setIsClientSuggestionsOpen(true)}
                  autoComplete="off"
                  required
                />

                {isClientSuggestionsOpen && matchingClients.length > 0 && (
                  <div className="client-suggestions-dropdown">
                    <div className="suggestion-header">
                      <span>Past Clients Database ({matchingClients.length})</span>
                      <span className="suggestion-hint">Click to auto-fill Email & Phone</span>
                    </div>
                    {matchingClients.map((c, idx) => (
                      <div 
                        key={idx} 
                        className="suggestion-item"
                        onClick={() => handleSelectClientSuggestion(c)}
                      >
                        <div className="suggestion-item-main">
                          <span className="suggestion-client-name">👤 {c.clientName}</span>
                          {c.companyName && <span className="suggestion-company-name">🏢 {c.companyName}</span>}
                        </div>
                        <div className="suggestion-item-details">
                          {c.mailId && <span className="suggestion-detail">✉️ {c.mailId}</span>}
                          {c.contactNumber && <span className="suggestion-detail">📞 {c.contactCountryCode || '+91'} {c.contactNumber}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 4. Country Code & Contact Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="contactNumber">Contact Details</label>
                <div className="contact-input-group">
                  <select
                    className="select-filter contact-country-select"
                    id="contactCountryCode"
                    name="contactCountryCode"
                    value={formData.contactCountryCode}
                    onChange={handleChange}
                    required
                  >
                    {getCountryCodesOptions(formData.contactCountryCode).map(opt => (
                      <option key={opt.code} value={opt.code}>{opt.label}</option>
                    ))}
                  </select>
                  <input
                    className="form-input contact-number-input"
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    placeholder="Contact number"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {/* 5. Mail ID */}
              <div className="form-group">
                <label className="form-label" htmlFor="mailId">Mail ID (Email)</label>
                <input
                  className="form-input"
                  type="email"
                  id="mailId"
                  name="mailId"
                  placeholder="client@company.com"
                  value={formData.mailId}
                  onChange={handleChange}
                />
              </div>

              {/* 6. Enq Details */}
              <div className="form-group span-2">
                <label className="form-label" htmlFor="enquiryDetails">Enq Details</label>
                <textarea
                  className="form-input"
                  id="enquiryDetails"
                  name="enquiryDetails"
                  placeholder="Detailed requirements from client..."
                  value={formData.enquiryDetails}
                  onChange={handleChange}
                  rows="3"
                  style={{ resize: 'vertical', minHeight: '80px' }}
                  required
                />
              </div>

              {/* 7. Major Equipments */}
              <div className="form-group span-2 equip-dropdown-container" style={{ position: 'relative' }}>
                <label className="form-label">major Equipments</label>
                <div 
                  className="form-input select-filter" 
                  style={{ 
                    cursor: 'pointer', 
                    minHeight: '47px', 
                    height: 'auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    userSelect: 'none'
                  }}
                  onClick={() => {
                    setIsEquipDropdownOpen(!isEquipDropdownOpen);
                    setEquipSearchQuery('');
                  }}
                >
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', flex: 1 }}>
                    {getSelectedEquipments(formData.majorEquipments).length === 0 ? (
                      <span style={{ color: 'var(--text-muted)' }}>Select major equipment(s)...</span>
                    ) : (
                      getSelectedEquipments(formData.majorEquipments).map(eq => (
                        <span 
                          key={eq} 
                          style={{ 
                            background: 'var(--accent-glow)', 
                            color: 'var(--text-primary)', 
                            padding: '2px 8px', 
                            borderRadius: '4px', 
                            fontSize: '0.82rem', 
                            border: '1px solid var(--border-focus)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {eq}
                          <span 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEquipToggle(eq);
                            }}
                            style={{ cursor: 'pointer', color: 'var(--text-muted)', fontWeight: 'bold' }}
                          >
                            &times;
                          </span>
                        </span>
                      ))
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', paddingRight: '4px', transition: 'transform 0.2s', transform: isEquipDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>
                </div>

                {isEquipDropdownOpen && (
                  <>
                    <div 
                      className="form-input-dropdown"
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
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
                      {/* Search Input Container */}
                      <div className="fpr-search-container">
                        <input
                          type="text"
                          className="fpr-search-input"
                          placeholder="Search equipment..."
                          value={equipSearchQuery}
                          onChange={(e) => setEquipSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>

                      <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                        {filteredEquipments.length === 0 ? (
                          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                            No equipments found
                          </div>
                        ) : (
                          filteredEquipments.map(eq => {
                            const opt = eq.name;
                            const isChecked = getSelectedEquipments(formData.majorEquipments).includes(opt);
                            return (
                              <label 
                                key={eq._id}
                                style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '10px', 
                                  padding: '8px 16px', 
                                  cursor: 'pointer',
                                  userSelect: 'none',
                                  fontSize: '0.88rem',
                                  color: 'var(--text-primary)',
                                  transition: 'background 0.2s'
                                }}
                                className="dropdown-option-label"
                              >
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleEquipToggle(opt)}
                                  style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }}
                                />
                                <span>{opt}</span>
                              </label>
                            );
                          })
                        )}
                      </div>
                      <>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />
                        <div 
                          onClick={() => {
                            setIsEquipDropdownOpen(false);
                            setEquipSearchQuery('');
                            setIsManageModalOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '8px 16px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: 'var(--accent-primary)',
                            transition: 'background 0.2s'
                          }}
                          className="dropdown-option-label"
                        >
                          <span>⚙️ Manage Equipments</span>
                        </div>
                      </>
                    </div>
                  </>
                )}
              </div>

              {/* 8. Source */}
              <div className="form-group">
                <label className="form-label" htmlFor="enquirySource">Source</label>
                <input
                  className="form-input"
                  type="text"
                  id="enquirySource"
                  name="enquirySource"
                  placeholder="e.g. Website, Cold Call, Referral"
                  value={formData.enquirySource}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* 9. FPR */}
              <div className="form-group fpr-dropdown-container" style={{ position: 'relative' }}>
                <label className="form-label">FPR</label>
                <div 
                  className="form-input select-filter" 
                  style={{ 
                    cursor: 'pointer', 
                    minHeight: '47px', 
                    height: 'auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    userSelect: 'none'
                  }}
                  onClick={() => {
                    setIsFprDropdownOpen(!isFprDropdownOpen);
                    setFprSearchQuery('');
                  }}
                >
                  <div className="fpr-trigger-container">
                    {formData.fpr ? (
                      <>
                        <div 
                          className="fpr-avatar small" 
                          style={{ backgroundColor: getAvatarColor(formData.fpr) }}
                        >
                          {getInitials(formData.fpr)}
                        </div>
                        <span className="fpr-trigger-text" style={{ color: 'var(--text-primary)' }}>
                          {formData.fpr}
                        </span>
                      </>
                    ) : (
                      <span className="fpr-trigger-text" style={{ color: 'var(--text-muted)' }}>
                        Select FPR...
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', paddingRight: '4px', transition: 'transform 0.2s', transform: isFprDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>
                </div>

                {isFprDropdownOpen && (
                  <>
                    <div 
                      className="form-input-dropdown"
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        background: 'var(--bg-tertiary)', 
                        border: '1px solid var(--border-focus)', 
                        borderRadius: '8px', 
                        marginTop: '4px', 
                        maxHeight: '290px', 
                        overflowY: 'auto', 
                        zIndex: 999,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                        padding: '0'
                      }}
                    >
                      {/* Search Input Container */}
                      <div className="fpr-search-container">
                        <input
                          type="text"
                          className="fpr-search-input"
                          placeholder="Search FPR name or email..."
                          value={fprSearchQuery}
                          onChange={(e) => setFprSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>

                      <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                        <div 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, fpr: '' }));
                            setIsFprDropdownOpen(false);
                            setFprSearchQuery('');
                          }}
                          className="fpr-clear-option"
                        >
                          None (Clear)
                        </div>
                        
                        {filteredFprs.length === 0 ? (
                          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                            No FPRs found
                          </div>
                        ) : (
                          filteredFprs.map(fpr => {
                            const isSelected = formData.fpr === fpr.name;
                            return (
                              <div 
                                key={fpr._id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, fpr: fpr.name }));
                                  setIsFprDropdownOpen(false);
                                  setFprSearchQuery('');
                                }}
                                className="fpr-option-row"
                                style={{
                                  background: isSelected ? 'var(--accent-glow)' : 'transparent',
                                }}
                              >
                                <div 
                                  className="fpr-avatar large" 
                                  style={{ backgroundColor: getAvatarColor(fpr.name) }}
                                >
                                  {getInitials(fpr.name)}
                                </div>
                                <div className="fpr-option-details">
                                  <span className="fpr-option-name">{fpr.name}</span>
                                  <span className="fpr-option-email">{fpr.email || 'No email registered'}</span>
                                </div>
                                {isSelected && <span className="fpr-option-checkmark">✓</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      <>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />
                        <div 
                          onClick={() => {
                            setIsFprDropdownOpen(false);
                            setFprSearchQuery('');
                            setIsManageFprsOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontSize: '0.88rem',
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
              </div>

              {/* 10. Quotation Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="quotationNumber">Quotation Number</label>
                <input
                  className="form-input"
                  type="text"
                  id="quotationNumber"
                  name="quotationNumber"
                  placeholder="e.g. QTN-2026-001"
                  value={formData.quotationNumber}
                  onChange={handleChange}
                />
              </div>

              {/* 11. Status */}
              <div className="form-group">
                <label className="form-label" htmlFor="currentStatus">Status</label>
                <select
                  className="select-filter"
                  style={{ width: '100%', height: '47px' }}
                  id="currentStatus"
                  name="currentStatus"
                  value={formData.currentStatus}
                  onChange={handleChange}
                  required
                >
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* 12. Offer Sub Date */}
              <div className="form-group">
                <label className="form-label" htmlFor="offerSubmittedDate">Offter Sub Date</label>
                <input
                  className="form-input"
                  type="date"
                  id="offerSubmittedDate"
                  name="offerSubmittedDate"
                  value={formData.offerSubmittedDate}
                  onChange={handleChange}
                />
              </div>

              {/* 13. PO Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="poNumber">PO Number</label>
                <input
                  className="form-input"
                  type="text"
                  id="poNumber"
                  name="poNumber"
                  placeholder="Enter PO Number"
                  value={formData.poNumber}
                  onChange={handleChange}
                />
              </div>

              {/* Expected Date Of Dispatch */}
              <div className="form-group">
                <label className="form-label" htmlFor="expectedDateOfDispatch">Expected Dispatch Date</label>
                <input
                  className="form-input"
                  type="date"
                  id="expectedDateOfDispatch"
                  name="expectedDateOfDispatch"
                  value={formData.expectedDateOfDispatch}
                  onChange={handleChange}
                />
              </div>

              {/* Project Engineer */}
              <div className="form-group pe-dropdown-container" style={{ position: 'relative' }}>
                <label className="form-label">Project Engineer</label>
                <div 
                  className="form-input select-filter" 
                  style={{ 
                    cursor: 'pointer', 
                    minHeight: '47px', 
                    height: 'auto', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    userSelect: 'none'
                  }}
                  onClick={() => {
                    setIsPeDropdownOpen(!isPeDropdownOpen);
                    setPeSearchQuery('');
                  }}
                >
                  <div className="fpr-trigger-container">
                    {formData.projectEngineer ? (
                      <>
                        <div 
                          className="fpr-avatar small" 
                          style={{ backgroundColor: getAvatarColor(formData.projectEngineer) }}
                        >
                          {getInitials(formData.projectEngineer)}
                        </div>
                        <span className="fpr-trigger-text" style={{ color: 'var(--text-primary)' }}>
                          {formData.projectEngineer}
                        </span>
                      </>
                    ) : (
                      <span className="fpr-trigger-text" style={{ color: 'var(--text-muted)' }}>
                        Select Project Engineer...
                      </span>
                    )}
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', paddingRight: '4px', transition: 'transform 0.2s', transform: isPeDropdownOpen ? 'rotate(180deg)' : 'none' }}>
                    ▼
                  </span>
                </div>

                {isPeDropdownOpen && (
                  <>
                    <div 
                      className="form-input-dropdown"
                      style={{ 
                        position: 'absolute', 
                        top: '100%', 
                        left: 0, 
                        right: 0, 
                        background: 'var(--bg-tertiary)', 
                        border: '1px solid var(--border-focus)', 
                        borderRadius: '8px', 
                        marginTop: '4px', 
                        maxHeight: '290px', 
                        overflowY: 'auto', 
                        zIndex: 999,
                        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                        padding: '0'
                      }}
                    >
                      {/* Search Input Container */}
                      <div className="fpr-search-container">
                        <input
                          type="text"
                          className="fpr-search-input"
                          placeholder="Search Engineer name or email..."
                          value={peSearchQuery}
                          onChange={(e) => setPeSearchQuery(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          autoFocus
                        />
                      </div>

                      <div style={{ maxHeight: '180px', overflowY: 'auto', padding: '4px 0' }}>
                        <div 
                          onClick={() => {
                            setFormData(prev => ({ ...prev, projectEngineer: '' }));
                            setIsPeDropdownOpen(false);
                            setPeSearchQuery('');
                          }}
                          className="fpr-clear-option"
                        >
                          None (Clear)
                        </div>
                        
                        {filteredEngineers.length === 0 ? (
                          <div style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
                            No Project Engineers found
                          </div>
                        ) : (
                          filteredEngineers.map(pe => {
                            const isSelected = formData.projectEngineer === pe.name;
                            return (
                              <div 
                                key={pe._id}
                                onClick={() => {
                                  setFormData(prev => ({ ...prev, projectEngineer: pe.name }));
                                  setIsPeDropdownOpen(false);
                                  setPeSearchQuery('');
                                }}
                                className="fpr-option-row"
                                style={{
                                  background: isSelected ? 'var(--accent-glow)' : 'transparent',
                                }}
                              >
                                <div 
                                  className="fpr-avatar large" 
                                  style={{ backgroundColor: getAvatarColor(pe.name) }}
                                >
                                  {getInitials(pe.name)}
                                </div>
                                <div className="fpr-option-details">
                                  <span className="fpr-option-name">{pe.name}</span>
                                  <span className="fpr-option-email">{pe.email || 'No email registered'}{pe.contactNumber ? ` | ${pe.contactNumber}` : ''}</span>
                                </div>
                                {isSelected && <span className="fpr-option-checkmark">✓</span>}
                              </div>
                            );
                          })
                        )}
                      </div>
                      
                      <>
                        <div style={{ height: '1px', background: 'var(--border-color)', margin: '0' }} />
                        <div 
                          onClick={() => {
                            setIsPeDropdownOpen(false);
                            setPeSearchQuery('');
                            setIsManageEngineersOpen(true);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            userSelect: 'none',
                            fontSize: '0.88rem',
                            fontWeight: '600',
                            color: 'var(--accent-primary)',
                            transition: 'background 0.2s',
                            background: 'var(--bg-tertiary)'
                          }}
                          className="dropdown-option-label"
                        >
                          <span>⚙️ Manage Project Engineers</span>
                        </div>
                      </>
                    </div>
                  </>
                )}
              </div>

              {/* 14. Follow-Up Comments */}
              <div className="form-group span-2">
                <label className="form-label" htmlFor="followUpComments">Follow-Up Comments</label>
                <textarea
                  className="form-input"
                  id="followUpComments"
                  name="followUpComments"
                  placeholder="Log follow-up details..."
                  value={formData.followUpComments}
                  onChange={handleChange}
                  rows="2"
                  style={{ resize: 'vertical', minHeight: '50px' }}
                />
              </div>

            </div>
          </div>

          <div className="modal-footer">
            <button className="btn btn-secondary" type="button" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" type="submit">
              {enquiry ? 'Save Changes' : 'Add Enquiry'}
            </button>
          </div>
        </form>
      </div>

      {/* Toast Warning Message */}
      {warningToast.visible && (
        <div className="toast-warning-banner">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>{warningToast.message}</span>
        </div>
      )}

      <ManageEquipmentsModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        token={token}
        isAdmin={isAdmin}
        onEquipmentChange={fetchEquipments}
      />

      <ManageFprsModal
        isOpen={isManageFprsOpen}
        onClose={() => setIsManageFprsOpen(false)}
        token={token}
        isAdmin={isAdmin}
        onFprChange={fetchFprs}
      />

      <ManageProjectEngineersModal
        isOpen={isManageEngineersOpen}
        onClose={() => setIsManageEngineersOpen(false)}
        token={token}
        isAdmin={isAdmin}
        onProjectEngineerChange={fetchProjectEngineers}
      />
    </div>
  );
}
