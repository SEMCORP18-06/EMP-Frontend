import React, { useState, useEffect } from 'react';
import Spinner from './Spinner';
import EnquiryModal from './EnquiryModal';
import DeleteModal from './DeleteModal';
import MilestoneModal from './MilestoneModal';
import BinModal from './BinModal';
import DashboardAnalytics from './DashboardAnalytics';
import UserManagementPanel from './UserManagementPanel';
import GanttModal from './GanttModal';
import SendMailModal from './SendMailModal';
import { API_BASE } from '../config';



const HEADER_MAP = {
  'enquiry date': 'date',
  'date': 'date',
  'enq. date': 'date',
  'enq date': 'date',
  'enq.date': 'date',
  'enqdate': 'date',
  'company name': 'companyName',
  'company': 'companyName',
  'companyname': 'companyName',
  'client name': 'clientName',
  'client': 'clientName',
  'clientname': 'clientName',
  'name': 'clientName',
  'mail id': 'mailId',
  'email': 'mailId',
  'email id': 'mailId',
  'email address': 'mailId',
  'mailid': 'mailId',
  'enquiry details': 'enquiryDetails',
  'details': 'enquiryDetails',
  'enquiry': 'enquiryDetails',
  'enquirydetails': 'enquiryDetails',
  'major equipments': 'majorEquipments',
  'equipments': 'majorEquipments',
  'equipment': 'majorEquipments',
  'major equipment': 'majorEquipments',
  'majorequipments': 'majorEquipments',
  'source': 'enquirySource',
  'enquiry source': 'enquirySource',
  'enquirysource': 'enquirySource',
  'fpr': 'fpr',
  'quotation number': 'quotationNumber',
  'quotationnumber': 'quotationNumber',
  'status': 'currentStatus',
  'offer submitted date': 'offerSubmittedDate',
  'offersubmitteddate': 'offerSubmittedDate',
  'offter sub date': 'offerSubmittedDate',
  'offter sub. date': 'offerSubmittedDate',
  'offer sub date': 'offerSubmittedDate',
  'offer sub. date': 'offerSubmittedDate',
  'offtersubdate': 'offerSubmittedDate',
  'offersubdate': 'offerSubmittedDate',
  'po number': 'poNumber',
  'ponumber': 'poNumber',
  'expected date of dispatch': 'expectedDateOfDispatch',
  'expecteddateofdispatch': 'expectedDateOfDispatch',
  'dispatch date': 'expectedDateOfDispatch',
  'expected dispatch date': 'expectedDateOfDispatch',
  'project engineer': 'projectEngineer',
  'projectengineer': 'projectEngineer',
  'engineer': 'projectEngineer',
  'follow-up comments': 'followUpComments',
  'comments': 'followUpComments',
  'followupcomments': 'followUpComments',
  'country code': 'contactCountryCode',
  'countrycode': 'contactCountryCode',
  'contact number': 'contactNumber',
  'contact-number': 'contactNumber',
  'contactnumber': 'contactNumber',
  'phone': 'contactNumber',
  'phone number': 'contactNumber',
  'mobile': 'contactNumber',
  'mobile number': 'contactNumber',
  'contact': 'contactNumber',
  'contact details': 'contactNumber'
};

const parseCSV = (text) => {
  if (!text) return [];

  // Check if binary zip file (like .xlsx)
  if (text.startsWith('PK\x03\x04') || text.includes('\x00')) {
    throw new Error("It looks like you uploaded a binary Excel file (.xlsx). Please save the file as 'CSV (Comma delimited)' in Excel and try again.");
  }

  // Strip UTF-8 BOM if present
  let cleanText = text;
  if (cleanText.charCodeAt(0) === 0xFEFF) {
    cleanText = cleanText.substring(1);
  }

  // Detect separator
  const firstLine = cleanText.split(/\r?\n/)[0] || "";
  let separator = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) {
    separator = ';';
  } else if (tabCount > commaCount && tabCount > semiCount) {
    separator = '\t';
  }

  const lines = [];
  let row = [""];
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const c = cleanText[i];
    const next = cleanText[i+1];
    
    if (inQuotes) {
      if (c === '"') {
        if (next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        row[row.length - 1] += c;
      }
    } else {
      if (c === '"') {
        inQuotes = true;
      } else if (c === separator) {
        row.push("");
      } else if (c === '\r' || c === '\n') {
        if (c === '\r' && next === '\n') {
          i++;
        }
        lines.push(row);
        row = [""];
      } else {
        row[row.length - 1] += c;
      }
    }
  }
  if (row.length > 1 || row[0] !== "") {
    lines.push(row);
  }
  return lines;
};

const mapStatus = (status) => {
  if (!status) return "-";
  const clean = status.trim().toLowerCase();
  
  if (clean.includes("costing")) return "Costing";
  if (clean.includes("offer")) return "Offer submitted";
  if (clean.includes("follow-up") || clean.includes("followup") || clean.includes("in progress")) return "Follow-up in progress";
  if (clean.includes("quotation")) return "Quotation Submitted";
  if (clean.includes("negotiation")) return "Negotiation ongoing";
  if (clean.includes("lost") || clean.includes("loss")) return "Lost";
  if (clean.includes("confirmed") || clean.includes("converted") || clean.includes("convert")) return "Confirmed";
  
  return "-";
};

const importCSVData = (csvText) => {
  const parsed = parseCSV(csvText);
  if (parsed.length < 2) {
    throw new Error("CSV file is empty or has no data rows.");
  }
  
  // Clean zero-width whitespace and BOM
  const headers = parsed[0].map(h => h.trim().toLowerCase().replace(/[\u200B-\u200D\uFEFF]/g, ''));
  console.log("Parsed CSV Headers (Cleaned):", headers);
  
  const indexMap = {};
  const canonicalHeaders = {
    date: ['enquiry date', 'date', 'enq. date', 'enq date', 'enq.date', 'enqdate'],
    companyName: ['company name', 'companyname'],
    clientName: ['client name', 'clientname'],
    mailId: ['mail id', 'mailid', 'email', 'email id', 'email address'],
    enquiryDetails: ['enquiry details', 'enquirydetails', 'details'],
    majorEquipments: ['major equipments', 'majorequipments', 'equipments', 'equipment', 'major equipment'],
    enquirySource: ['source', 'enquiry source', 'enquirysource'],
    contactCountryCode: ['country code', 'countrycode'],
    contactNumber: ['contact number', 'contactnumber', 'phone number', 'mobile number'],
    expectedDateOfDispatch: ['expected date of dispatch', 'expecteddateofdispatch', 'dispatch date', 'expected dispatch date'],
    projectEngineer: ['project engineer', 'projectengineer', 'engineer']
  };

  headers.forEach((h, idx) => {
    if (HEADER_MAP[h]) {
      const field = HEADER_MAP[h];
      if (indexMap[field] === undefined) {
        indexMap[field] = idx;
      } else {
        const prevIdx = indexMap[field];
        const prevH = headers[prevIdx];
        const canonicalList = canonicalHeaders[field] || [];
        const isCurrentCanonical = canonicalList.includes(h);
        const isPrevCanonical = canonicalList.includes(prevH);
        if (isCurrentCanonical && !isPrevCanonical) {
          indexMap[field] = idx;
        }
      }
    }
  });

  console.log("Mapped Fields indexMap:", indexMap);

  const contactDetailsIdx = headers.indexOf('contact details');
  const enquiriesToImport = [];
  const skippedRowsSummary = [];

  for (let i = 1; i < parsed.length; i++) {
    const row = parsed[i];
    if (row.length === 0 || (row.length === 1 && row[0].trim() === "")) continue;

    const item = {};
    Object.keys(indexMap).forEach(field => {
      const idx = indexMap[field];
      if (row[idx] !== undefined) {
        item[field] = row[idx].trim();
      }
    });

    if (!item.contactCountryCode || !item.contactNumber) {
      let cc = item.contactCountryCode || '';
      let num = item.contactNumber || '';
      if (contactDetailsIdx !== -1 && row[contactDetailsIdx] !== undefined) {
        const rawDetails = row[contactDetailsIdx].trim();
        const match = rawDetails.match(/^(\+\d+)\s*(.*)$/);
        if (match) {
          cc = match[1];
          num = match[2];
        } else {
          cc = '+91';
          num = rawDetails;
        }
      }
      item.contactCountryCode = cc || '+91';
      item.contactNumber = num || '';
    }

    if (item.contactCountryCode) {
      let cc = item.contactCountryCode.trim();
      if (cc && !cc.startsWith('+')) {
        cc = '+' + cc;
      }
      item.contactCountryCode = cc;
    }

    if (!item.date || item.date.trim() === "") {
      item.date = "-";
    }
    if (!item.expectedDateOfDispatch || item.expectedDateOfDispatch.trim() === "") {
      item.expectedDateOfDispatch = "-";
    }
    if (!item.projectEngineer || item.projectEngineer.trim() === "") {
      item.projectEngineer = "-";
    }
    if (!item.clientName || item.clientName.trim() === "") {
      item.clientName = "-";
    }
    if (!item.companyName || item.companyName.trim() === "") {
      item.companyName = "-";
    }
    if (!item.enquiryDetails || item.enquiryDetails.trim() === "") {
      item.enquiryDetails = "-";
    }
    if (!item.enquirySource || item.enquirySource.trim() === "") {
      item.enquirySource = "-";
    }
    if (!item.majorEquipments || item.majorEquipments.trim() === "") {
      item.majorEquipments = "-";
    }
    if (!item.mailId || item.mailId.trim() === "") {
      item.mailId = "-";
    }
    if (!item.contactCountryCode || item.contactCountryCode.trim() === "") {
      item.contactCountryCode = "+91";
    }
    if (!item.contactNumber || item.contactNumber.trim() === "") {
      item.contactNumber = "-";
    }
    item.currentStatus = mapStatus(item.currentStatus);

    enquiriesToImport.push(item);
  }

  if (enquiriesToImport.length === 0) {
    const mappedFieldsKeys = Object.keys(indexMap);
    const requiredFields = ["clientName", "companyName", "enquiryDetails", "majorEquipments", "enquirySource", "mailId", "contactNumber"];
    const unmappedRequired = requiredFields.filter(f => !mappedFieldsKeys.includes(f));
    
    const friendlyNames = {
      clientName: "Client Name",
      companyName: "Company Name",
      enquiryDetails: "Enquiry Details",
      majorEquipments: "Major Equipments",
      enquirySource: "Source",
      mailId: "Mail ID",
      contactNumber: "Contact Number"
    };

    const missingHeadersText = unmappedRequired.map(f => friendlyNames[f]).join(", ");
    
    let errorMsg = `No valid rows could be imported.\n\n`;
    if (unmappedRequired.length > 0) {
      errorMsg += `⚠️ Could not map required columns: (${missingHeadersText}).\n`;
      errorMsg += `We detected these headers in your file: [${headers.join(", ")}].\n\n`;
      errorMsg += `Please ensure your file headers match common names like: Client Name, Company Name, Mail ID, Enquiry Details, Major Equipments, Source, and Contact Number.`;
    } else if (skippedRowsSummary.length > 0) {
      errorMsg += `⚠️ Headers were mapped successfully, but all rows had empty values in required fields:\n`;
      errorMsg += skippedRowsSummary.slice(0, 5).join("\n");
      if (skippedRowsSummary.length > 5) {
        errorMsg += `\n...and ${skippedRowsSummary.length - 5} more rows.`;
      }
    } else {
      errorMsg += `The file contains headers but has no data rows.`;
    }

    throw new Error(errorMsg);
  }

  return enquiriesToImport;
};

export default function Dashboard({ token, userRole, username, displayName, onLogout, isDark, onToggleTheme }) {
  const [enquiries, setEnquiries] = useState([]);
  const [filteredEnquiries, setFilteredEnquiries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Navigation tab state
  const [activeTab, setActiveTab] = useState('enquiries'); // 'enquiries', 'milestones' or 'analytics'
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  
  // Modals state
  const [isEnquiryModalOpen, setIsEnquiryModalOpen] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState(null); // null means adding new
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [enquiryToDelete, setEnquiryToDelete] = useState(null);
  
  // Enquiry Details Popup state
  const [enqDetailsPopup, setEnqDetailsPopup] = useState(null);
  
  // Milestone Modal state
  const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
  const [enquiryForMilestone, setEnquiryForMilestone] = useState(null);

  // Gantt Modal state
  const [isGanttModalOpen, setIsGanttModalOpen] = useState(false);
  const [enquiryForGantt, setEnquiryForGantt] = useState(null);

  // Custom Send Mail Modal state
  const [isSendMailModalOpen, setIsSendMailModalOpen] = useState(false);
  const [enquiryForCustomMail, setEnquiryForCustomMail] = useState(null);

  // Recycle Bin Modal state
  const [isBinModalOpen, setIsBinModalOpen] = useState(false);
  
  // Success toast popup state
  const [successToast, setSuccessToast] = useState({ visible: false, message: '' });

  const showSuccessToast = (message, duration = 3000) => {
    setSuccessToast({ visible: true, message });
    setTimeout(() => {
      setSuccessToast({ visible: false, message: '' });
    }, duration);
  };

  const isAdmin = userRole === 'Admin';

  const fetchEnquiries = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/enquiries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          onLogout();
        }
        throw new Error('Failed to load enquiries');
      }
      const data = await response.json();
      setEnquiries(data);
      setFilteredEnquiries(data);
    } catch (err) {
      setError(err.message || 'Error loading data from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnquiries();
  }, [token]);

  // Handle local searching & filtering
  useEffect(() => {
    let result = enquiries;

    if (activeTab === 'milestones') {
      result = result.filter(enq => enq.currentStatus === 'Confirmed');
    }

    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(enq => 
        (enq.quotationNumber && enq.quotationNumber.toLowerCase().includes(term)) ||
        (enq.clientName && enq.clientName.toLowerCase().includes(term)) ||
        (enq.companyName && enq.companyName.toLowerCase().includes(term)) ||
        (enq.majorEquipments && enq.majorEquipments.toLowerCase().includes(term))
      );
    }

    if (activeTab === 'enquiries' && statusFilter !== '') {
      result = result.filter(enq => enq.currentStatus === statusFilter);
    }

    if (startDateFilter) {
      result = result.filter(enq => enq.date && enq.date !== '-' && enq.date >= startDateFilter);
    }

    if (endDateFilter) {
      result = result.filter(enq => enq.date && enq.date !== '-' && enq.date <= endDateFilter);
    }

    setFilteredEnquiries(result);
  }, [searchTerm, statusFilter, startDateFilter, endDateFilter, enquiries, activeTab]);

  // Add or Edit Submission
  const handleEnquirySubmit = async (formData) => {
    setLoading(true);
    try {
      const url = selectedEnquiry 
        ? `${API_BASE}/enquiries/${selectedEnquiry._id}` 
        : `${API_BASE}/enquiries`;
      const method = selectedEnquiry ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      await fetchEnquiries();
      setIsEnquiryModalOpen(false);
      setSelectedEnquiry(null);
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!enquiryToDelete) return;
    
    setLoading(true);
    setIsDeleteModalOpen(false);

    try {
      const response = await fetch(`${API_BASE}/enquiries/${enquiryToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Deletion failed');
      }

      await fetchEnquiries();
      
      // Show success toast for 1 second
      setSuccessToast({ visible: true, message: 'Data is moved successfully to bin' });
      setTimeout(() => {
        setSuccessToast({ visible: false, message: '' });
      }, 1000);
    } catch (err) {
      alert(err.message || 'Failed to delete record');
    } finally {
      setLoading(false);
      setEnquiryToDelete(null);
    }
  };

  // Add Milestone Submission
  const handleMilestoneSubmit = async (updatedMilestones, sendClientEmail, sendFprEmail, shouldCloseModal = true) => {
    if (!enquiryForMilestone) return;
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/enquiries/${enquiryForMilestone._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ milestones: updatedMilestones, sendClientEmail, sendFprEmail })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to save milestones');
      }

      await fetchEnquiries();

      if (shouldCloseModal) {
        setIsMilestoneModalOpen(false);
        setEnquiryForMilestone(null);
        
        let successMsg = 'Milestones updated successfully!';
        if (sendClientEmail && sendFprEmail) {
          successMsg = 'Milestones saved & emails sent to client & FPR successfully!';
        } else if (sendClientEmail) {
          successMsg = 'Milestones saved & client email sent successfully!';
        } else if (sendFprEmail) {
          successMsg = 'Milestones saved & FPR email sent successfully!';
        }
        showSuccessToast(successMsg);
      } else {
        setEnquiryForMilestone(data);
      }
    } catch (err) {
      alert(err.message || 'Failed to save milestones');
    } finally {
      setLoading(false);
    }
  };

  const handleRecoverSuccess = () => {
    setIsBinModalOpen(false);
    fetchEnquiries();
    setSuccessToast({ visible: true, message: 'Recovered Successfully' });
    setTimeout(() => {
      setSuccessToast({ visible: false, message: '' });
    }, 1000);
  };

  const handleExportToExcel = () => {
    if (enquiries.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      'Enquiry Date',
      'Company Name',
      'Client Name',
      'Country Code',
      'Contact Number',
      'Mail ID',
      'Enquiry Details',
      'Major Equipments',
      'Source',
      'FPR',
      'Quotation Number',
      'Status',
      'Offer Submitted Date',
      'PO Number',
      'Expected Dispatch Date',
      'Project Engineer',
      'Follow-up Comments'
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('\n') || str.includes('\r') || str.includes('"')) {
        str = `"${str}"`;
      }
      return str;
    };

    const rows = enquiries.map(enq => {
      return [
        enq.date || '',
        enq.companyName || '',
        enq.clientName || '',
        enq.contactCountryCode || '',
        enq.contactNumber || '',
        enq.mailId || '',
        enq.enquiryDetails || '',
        enq.majorEquipments || '',
        enq.enquirySource || '',
        enq.fpr || '',
        enq.quotationNumber || '',
        enq.currentStatus || '',
        enq.offerSubmittedDate || '',
        enq.poNumber || '',
        enq.expectedDateOfDispatch || '',
        enq.projectEngineer || '',
        enq.followUpComments || ''
      ];
    });

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(','))
    ].join('\r\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `semco_enquiries_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      
      try {
        const parsedData = importCSVData(text);
        if (parsedData.length === 0) {
          alert("No valid enquiry rows found in CSV. Please verify required fields (Client Name, Company Name, Mail ID, Contact Details, Enquiry Details, Major Equipments, Source).");
          return;
        }

        setLoading(true);
        const response = await fetch(`${API_BASE}/enquiries/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ enquiries: parsedData })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Import failed');
        }

        await fetchEnquiries();
        
        setSuccessToast({ 
          visible: true, 
          message: `Import complete. Imported: ${data.imported}, Skipped: ${data.skipped} duplicate entries.` 
        });
        setTimeout(() => {
          setSuccessToast({ visible: false, message: '' });
        }, 3000);
      } catch (err) {
        console.error("Import error:", err);
        alert(`Error importing CSV: ${err.message}`);
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Costing': return 'costing';
      case 'Offer submitted': return 'offer';
      case 'Follow-up in progress': return 'follow-up';
      case 'Negotiation ongoing': return 'negotiation';
      case 'Lost': return 'lost';
      case 'Confirmed': return 'confirmed';
      case '-': return 'neutral';
      default: return '';
    }
  };

  return (
    <div className="dashboard-container">
      <Spinner active={loading} />
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-capsule" style={{ background: '#ffffff', padding: '6px 12px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)', display: 'flex', alignItems: 'center' }}>
          <img src="/semco_logo.png" alt="SEMCO Logo" style={{ height: '32px', objectFit: 'contain', display: 'block' }} />
        </div>

        {/* Navigation Navbar */}
        <nav className="top-navbar">
          <button 
            className={`nav-link ${activeTab === 'enquiries' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('enquiries');
              setSearchTerm('');
              setStatusFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
              setShowDateDropdown(false);
              setShowStatusDropdown(false);
            }}
          >
            Enquiries
          </button>
          <button 
            className={`nav-link ${activeTab === 'milestones' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('milestones');
              setSearchTerm('');
              setStatusFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
              setShowDateDropdown(false);
              setShowStatusDropdown(false);
            }}
          >
            Confirmed Orders
          </button>
          <button 
            className={`nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('analytics');
              setSearchTerm('');
              setStatusFilter('');
              setStartDateFilter('');
              setEndDateFilter('');
              setShowDateDropdown(false);
              setShowStatusDropdown(false);
            }}
          >
            Dashboard
          </button>
        </nav>

        <div className="user-profile">
          <div className="user-badge">
            <span className={`user-role-dot ${userRole.toLowerCase()}`}></span>
            <span>{displayName || username}</span>
          </div>
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? '☀️' : '🌙'}
          </button>
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="dashboard-main">
        
        {/* Title Bar */}
        <div className="dashboard-title-bar">
          <h2 className="dashboard-title">
            {activeTab === 'analytics' ? 'Analytics Dashboard' : activeTab === 'enquiries' ? 'Enquiries Database' : activeTab === 'users' ? 'User Management' : 'Confirmed Orders'}
          </h2>
          {(activeTab === 'enquiries' || activeTab === 'users') && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {userRole === 'Admin' && (
                <button 
                  className="add-btn" 
                  onClick={() => {
                    setActiveTab(activeTab === 'users' ? 'enquiries' : 'users');
                    setSearchTerm('');
                    setStatusFilter('');
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                    boxShadow: '0 4px 14px rgba(99, 102, 241, 0.3)'
                  }}
                >
                  {activeTab === 'users' ? '📋 View Enquiries' : '👥 Manage Users'}
                </button>
              )}
              {activeTab === 'enquiries' && (
                <>
                  <input 
                    type="file" 
                    accept=".csv" 
                    id="csv-import-file" 
                    style={{ display: 'none' }} 
                    onChange={handleImportCSV} 
                  />
                  <button 
                    className="add-btn" 
                    onClick={() => document.getElementById('csv-import-file').click()}
                    style={{
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
                    }}
                  >
                    📤 Import Excel
                  </button>
                  {userRole === 'Admin' && (
                    <button 
                      className="add-btn" 
                      onClick={handleExportToExcel}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)'
                      }}
                    >
                      📥 Export Excel
                    </button>
                  )}
                  {(userRole === 'Admin' || userRole === 'General') && (
                    <button className="add-btn" onClick={() => {
                      setSelectedEnquiry(null);
                      setIsEnquiryModalOpen(true);
                    }}>
                      <span>+</span> Add Enquiry
                    </button>
                  )}
                  <button 
                    className="add-btn bin-trigger-btn" 
                    style={{ 
                      background: 'rgba(239, 68, 68, 0.15)', 
                      border: '1px solid rgba(239, 68, 68, 0.3)', 
                      color: '#f87171',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.2rem',
                      lineHeight: '1'
                    }}
                    onClick={() => setIsBinModalOpen(true)}
                    title="Recycle Bin"
                  >
                    🗑️
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Filters Controls */}
        {activeTab !== 'analytics' && activeTab !== 'users' && (
          <div className="controls-bar">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search by ENQ, Client, Company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Analytics or Table Card */}
        {activeTab === 'analytics' ? (
          <DashboardAnalytics enquiries={enquiries} />
        ) : activeTab === 'users' ? (
          <UserManagementPanel token={token} currentUsername={username} />
        ) : (
          <div className="table-card">
            {error && <div style={{ padding: '24px', color: '#fca5a5' }}>{error}</div>}
            
            <div className="table-responsive">
              {filteredEnquiries.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-title">No enquiries found</div>
                  <p>Try refining your search term.</p>
                </div>
              ) : (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>Enq Date</span>
                          <button 
                            onClick={() => {
                              setShowDateDropdown(!showDateDropdown);
                              setShowStatusDropdown(false);
                            }}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              cursor: 'pointer', 
                              padding: '2px', 
                              fontSize: '0.85rem', 
                              color: (startDateFilter || endDateFilter) ? 'var(--accent-primary)' : 'var(--text-muted)',
                              display: 'inline-flex', 
                              alignItems: 'center' 
                            }}
                            title="Filter by Date"
                          >
                            <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                              <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                        {showDateDropdown && (
                          <div className="header-filter-dropdown">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>From Date:</label>
                              <input 
                                type="date" 
                                className="select-filter"
                                style={{ width: '100%' }}
                                value={startDateFilter}
                                onChange={(e) => setStartDateFilter(e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>To Date:</label>
                              <input 
                                type="date" 
                                className="select-filter"
                                style={{ width: '100%' }}
                                value={endDateFilter}
                                onChange={(e) => setEndDateFilter(e.target.value)}
                              />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button 
                                onClick={() => { setStartDateFilter(''); setEndDateFilter(''); setShowDateDropdown(false); }}
                                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Clear
                              </button>
                              <button 
                                onClick={() => setShowDateDropdown(false)}
                                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </th>
                      <th>Company Name</th>
                      <th>Client Name</th>
                      <th>Country Code</th>
                      <th>Contact Number</th>
                      <th>Mail ID</th>
                      <th>Enq Details</th>
                      <th>Major Equipments</th>
                      <th>Source</th>
                      <th>FPR</th>
                      <th>Quotation Number</th>
                      <th>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <span>Status</span>
                          {activeTab !== 'milestones' && (
                            <button 
                              onClick={() => {
                                setShowStatusDropdown(!showStatusDropdown);
                                setShowDateDropdown(false);
                              }}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                cursor: 'pointer', 
                                padding: '2px', 
                                fontSize: '0.85rem', 
                                color: statusFilter ? 'var(--accent-primary)' : 'var(--text-muted)',
                                display: 'inline-flex', 
                                alignItems: 'center' 
                              }}
                              title="Filter by Status"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" style={{ width: '16px', height: '16px' }}>
                                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
                              </svg>
                            </button>
                          )}
                        </div>
                        {activeTab !== 'milestones' && showStatusDropdown && (
                          <div className="header-filter-dropdown">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</label>
                              <select 
                                className="select-filter"
                                style={{ width: '100%' }}
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                              >
                                <option value="">All Statuses</option>
                                <option value="Costing">Costing</option>
                                <option value="Offer submitted">Offer Submitted</option>
                                <option value="Follow-up in progress">Follow-up In Progress</option>
                                <option value="Negotiation ongoing">Negotiation Ongoing</option>
                                <option value="Lost">Lost</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="-">-</option>
                              </select>
                            </div>
                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                              <button 
                                onClick={() => { setStatusFilter(''); setShowStatusDropdown(false); }}
                                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem' }}
                              >
                                Clear
                              </button>
                              <button 
                                onClick={() => setShowStatusDropdown(false)}
                                style={{ flex: 1, padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'var(--accent-primary)', color: '#ffffff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}
                              >
                                Apply
                              </button>
                            </div>
                          </div>
                        )}
                      </th>
                      <th>Offter Sub Date</th>
                      <th>PO Number</th>
                      <th>Expected Dispatch Date</th>
                      <th>Project Engineer</th>
                      <th>Follow-up Comments</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEnquiries.map((enq) => (
                      <tr key={enq._id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{enq.date}</td>
                        <td>{enq.companyName}</td>
                        <td>{enq.clientName}</td>
                        <td>{enq.contactCountryCode}</td>
                        <td>{enq.contactNumber}</td>
                        <td>
                          <a href={`mailto:${enq.mailId}`} style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>
                            {enq.mailId}
                          </a>
                        </td>
                        <td style={{ minWidth: '180px', maxWidth: '300px', fontSize: '0.88rem' }}>
                          <div 
                            className="clamp-2-lines" 
                            onClick={() => setEnqDetailsPopup(enq.enquiryDetails)}
                            title="Click to view full details"
                          >
                            {enq.enquiryDetails}
                          </div>
                        </td>
                        <td>{enq.majorEquipments}</td>
                        <td>{enq.enquirySource}</td>
                        <td>{enq.fpr || '-'}</td>
                        <td style={{ fontWeight: '600' }}>{enq.quotationNumber || '-'}</td>
                        <td>
                          {activeTab === 'milestones' ? (
                            <div style={{ minWidth: '100px' }}>
                              <span className={`status-badge ${getStatusClass(enq.currentStatus)}`} style={{ marginBottom: '6px', display: 'inline-block' }}>
                                {enq.currentStatus}
                              </span>
                              {enq.milestones && enq.milestones.length > 0 && (
                                <div style={{ marginTop: '4px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '2px' }}>
                                    <span>Progress</span>
                                    <span>{enq.milestones.reduce((acc, m) => m.status === 'Completed' ? acc + (m.percentage || 0) : acc, 0)}%</span>
                                  </div>
                                  <div style={{ width: '100%', background: 'var(--bg-secondary)', borderRadius: '3px', height: '6px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                    <div style={{ 
                                      width: `${enq.milestones.reduce((acc, m) => m.status === 'Completed' ? acc + (m.percentage || 0) : acc, 0)}%`, 
                                      background: 'var(--accent-primary)', 
                                      height: '100%', 
                                      borderRadius: '3px' 
                                    }}></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className={`status-badge ${getStatusClass(enq.currentStatus)}`}>
                              {enq.currentStatus}
                            </span>
                          )}
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>{enq.offerSubmittedDate || '-'}</td>
                        <td>{enq.poNumber || '-'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{enq.expectedDateOfDispatch || '-'}</td>
                        <td>{enq.projectEngineer || '-'}</td>
                        <td>{enq.followUpComments || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              {activeTab === 'enquiries' ? (
                                <>
                                  <button 
                                    className="action-btn modify"
                                    onClick={() => {
                                      setSelectedEnquiry(enq);
                                      setIsEnquiryModalOpen(true);
                                    }}
                                  >
                                    Modify
                                  </button>
                                  <button 
                                    className="action-btn delete"
                                    onClick={() => {
                                      setEnquiryToDelete(enq);
                                      setIsDeleteModalOpen(true);
                                    }}
                                  >
                                    Delete
                                  </button>
                                  {enq.currentStatus === 'Confirmed' && (
                                    <button 
                                      className="action-btn mail-btn"
                                      title="Send Email to Client"
                                      onClick={() => {
                                        setEnquiryForCustomMail(enq);
                                        setIsSendMailModalOpen(true);
                                      }}
                                    >
                                      📧
                                    </button>
                                  )}
                                </>
                              ) : (
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    className="action-btn add-milestone"
                                    onClick={() => {
                                      setEnquiryForMilestone(enq);
                                      setIsMilestoneModalOpen(true);
                                    }}
                                  >
                                    Add / Modify Milestone
                                  </button>
                                  <button 
                                    className="action-btn gantt-btn"
                                    onClick={() => {
                                      setEnquiryForGantt(enq);
                                      setIsGanttModalOpen(true);
                                    }}
                                    style={{
                                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                      boxShadow: '0 2px 6px rgba(16, 185, 129, 0.2)',
                                      color: '#ffffff'
                                    }}
                                  >
                                    📊 Gantt Chart
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="dashboard-footer">
        &copy; {new Date().getFullYear()} SEMCO Groups. All rights reserved. | Enquiry Management Portal
      </footer>

      {/* Add / Edit Modal */}
      <EnquiryModal 
        isOpen={isEnquiryModalOpen}
        onClose={() => {
          setIsEnquiryModalOpen(false);
          setSelectedEnquiry(null);
        }}
        onSubmit={handleEnquirySubmit}
        enquiry={selectedEnquiry}
        isAdmin={isAdmin}
        token={token}
        enquiries={enquiries}
      />

      {/* Deletion Warning Modal */}
      <DeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setEnquiryToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
      />

      <MilestoneModal
        isOpen={isMilestoneModalOpen}
        isAdmin={true}
        isSystemAdmin={isAdmin}
        token={token}
        username={username}
        displayName={displayName}
        onClose={() => {
          setIsMilestoneModalOpen(false);
          setEnquiryForMilestone(null);
        }}
        onSubmit={handleMilestoneSubmit}
        enquiry={enquiryForMilestone}
      />

      <GanttModal
        isOpen={isGanttModalOpen}
        onClose={() => {
          setIsGanttModalOpen(false);
          setEnquiryForGantt(null);
        }}
        enquiry={enquiryForGantt}
        showSuccessToast={showSuccessToast}
      />

      {/* Recycle Bin Modal */}
      <BinModal 
        isOpen={isBinModalOpen}
        token={token}
        isAdmin={isAdmin}
        onClose={() => setIsBinModalOpen(false)}
        onRecoverSuccess={handleRecoverSuccess}
      />

      <SendMailModal
        isOpen={isSendMailModalOpen}
        onClose={() => {
          setIsSendMailModalOpen(false);
          setEnquiryForCustomMail(null);
        }}
        enquiry={enquiryForCustomMail}
        token={token}
        showSuccessToast={showSuccessToast}
      />

      {/* Enquiry Details Popup Modal */}
      {enqDetailsPopup && (
        <div className="modal-overlay" onClick={() => setEnqDetailsPopup(null)} style={{ zIndex: 1100 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', borderRadius: '16px' }}>
            <div className="modal-header">
              <h3 className="modal-title">Enquiry Details</h3>
              <button className="close-btn" onClick={() => setEnqDetailsPopup(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '0.95rem', color: 'var(--text-primary)', textAlign: 'left', padding: '16px 24px' }}>
              {enqDetailsPopup}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', paddingRight: '24px', paddingBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="action-btn" style={{ background: 'var(--accent-primary)', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setEnqDetailsPopup(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Success Message */}
      {successToast.visible && (
        <div className="toast-success-banner">
          <span style={{ fontSize: '1.2rem' }}>✅</span>
          <span>{successToast.message}</span>
        </div>
      )}
    </div>
  );
}
