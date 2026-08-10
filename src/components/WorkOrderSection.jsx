import React, { useState, useEffect, useReducer } from 'react';
import { 
  uploadOffer, 
  generateWorkOrder, 
  getSalesTeam, 
  getWorkOrderHistory, 
  downloadGeneratedPdf, 
  getOfferPdfViewUrl 
} from '../woApi';
import WoFileUpload from './wo/WoFileUpload';
import EditableField from './wo/EditableField';
import EquipmentAccordion from './wo/EquipmentAccordion';
import EditableTable from './wo/EditableTable';
import EditableBulletList from './wo/EditableBulletList';
import { 
  CheckCircle, 
  AlertTriangle, 
  Edit3, 
  Download, 
  Plus, 
  History, 
  FileText, 
  ArrowLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';

const initialWoState = {
  job_no: '',
  client_name: { value: '', confidence: 'manual', source: '' },
  po_no: '',
  po_date: '',
  project_name: { value: '', confidence: 'manual', source: '' },
  sales_person: '',
  revision: 0,
  system_overview: '',
  equipment_tables: [],
  scope_bullets: [],
  scope_table: [],
  exclusion_bullets: [],
  delivery_period: '',
  price_basis: { value: '', confidence: 'must_confirm', source: '' },
  freight: { value: '', confidence: 'derived', source: '' },
  packing_forwarding: { value: '', confidence: 'derived', source: '' },
  destination: '',
  gst_no: '',
  payment_terms: { value: '', confidence: 'must_confirm', source: '' },
  warranty: '',
  remarks_notes: [],
};

function woReducer(state, action) {
  switch (action.type) {
    case 'SET_DATA':
      return { ...state, ...action.data };
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'UPDATE_CONFIDENCE_FIELD':
      return {
        ...state,
        [action.field]: {
          ...state[action.field],
          value: action.value,
        },
      };
    default:
      return state;
  }
}

export default function WorkOrderSection({ confirmedEnquiries = [], preSelectedEnquiry = null, onClearPreSelected }) {
  const [currentTab, setCurrentTab] = useState('generator'); // 'generator' | 'history'
  const [state, dispatch] = useReducer(woReducer, initialWoState);
  const [offerPdfUrl, setOfferPdfUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [salesTeamList, setSalesTeamList] = useState([]);
  const [confirmedFields, setConfirmedFields] = useState(new Set());
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [downloadName, setDownloadName] = useState('');
  const [error, setError] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload' | 'review'

  // Fetch sales team list
  useEffect(() => {
    getSalesTeam().then(list => setSalesTeamList(list)).catch(() => {});
  }, []);

  // Fetch history when history tab active
  useEffect(() => {
    if (currentTab === 'history') {
      setLoadingHistory(true);
      getWorkOrderHistory()
        .then(data => setHistoryList(data))
        .catch(err => setError('Failed to load work order history'))
        .finally(() => setLoadingHistory(false));
    }
  }, [currentTab]);

  // Handle pre-selected enquiry from Confirmed Orders tab
  useEffect(() => {
    if (preSelectedEnquiry) {
      setStep('review');
      dispatch({
        type: 'SET_DATA',
        data: {
          client_name: { value: preSelectedEnquiry.companyName || preSelectedEnquiry.clientName || '', confidence: 'high', source: 'enquiry_portal' },
          po_no: preSelectedEnquiry.poNumber || '',
          project_name: { value: preSelectedEnquiry.projectNumber ? `Project ${preSelectedEnquiry.projectNumber}` : (preSelectedEnquiry.majorEquipments || ''), confidence: 'high', source: 'enquiry_portal' },
          sales_person: preSelectedEnquiry.projectEngineer || preSelectedEnquiry.fpr || '',
          delivery_period: preSelectedEnquiry.expectedDateOfDispatch ? `Dispatch expected by ${preSelectedEnquiry.expectedDateOfDispatch}` : '',
          gst_no: '',
          system_overview: preSelectedEnquiry.enquiryDetails || '',
        }
      });
    }
  }, [preSelectedEnquiry]);

  const updateField = (field, val) => {
    dispatch({ type: 'UPDATE_FIELD', field, value: val });
  };

  const updateConfidenceField = (field, val) => {
    dispatch({ type: 'UPDATE_CONFIDENCE_FIELD', field, value: val });
  };

  const confirmField = (field) => {
    setConfirmedFields(prev => new Set(prev).add(field));
  };

  const handleFileUpload = async (file) => {
    setUploading(true);
    setError(null);
    try {
      const data = await uploadOffer(file);
      if (data.offer_pdf_url) {
        setOfferPdfUrl(data.offer_pdf_url);
      }
      dispatch({ type: 'SET_DATA', data });
      setStep('review');
    } catch (err) {
      setError(err.message || 'Failed to extract data from Offer PDF');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await generateWorkOrder(state);
      setDownloadUrl(res.pdf_url);
      setDownloadName(`${res.job_no}_WorkOrder.pdf`);
    } catch (err) {
      setError(err.message || 'Failed to generate Work Order PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadHistoryPdf = async (item) => {
    try {
      const blob = await downloadGeneratedPdf(item.pdf_url);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${item.job_no}_WorkOrder.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PDF');
    }
  };

  // Field stats
  const confidenceFields = ['client_name', 'project_name', 'price_basis', 'freight', 'packing_forwarding', 'payment_terms'];
  let autoCount = 0, confirmCount = 0, manualCount = 0;
  confidenceFields.forEach(f => {
    const field = state[f];
    if (field?.confidence === 'high') autoCount++;
    else if (field?.confidence === 'must_confirm' || field?.confidence === 'derived') confirmCount++;
    else manualCount++;
  });
  const manualFields = ['po_no', 'po_date', 'sales_person', 'destination', 'gst_no'];
  manualFields.forEach(f => {
    if (!state[f]) manualCount++;
  });

  return (
    <div className="wo-container" style={{ padding: '1.5rem', color: 'var(--text-primary)' }}>
      {/* Top Sub-Nav */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button 
            className={`btn ${currentTab === 'generator' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('generator')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            <Sparkles size={16} /> Work Order Generator
          </button>
          <button 
            className={`btn ${currentTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrentTab('history')}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer' }}
          >
            <History size={16} /> History Log
          </button>
        </div>

        {preSelectedEnquiry && (
          <div style={{ background: 'rgba(99, 102, 241, 0.15)', border: '1px solid var(--accent-primary)', padding: '0.4rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>Pre-filled from Enquiry: <strong>{preSelectedEnquiry.companyName || preSelectedEnquiry.clientName}</strong></span>
            <button onClick={onClearPreSelected} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
          </div>
        )}
      </div>

      {/* HISTORY TAB VIEW */}
      {currentTab === 'history' && (
        <div>
          <h3 style={{ marginBottom: '1rem' }}>Generated Work Orders History</h3>
          {loadingHistory ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}><RefreshCw className="spin" size={24} /> Loading history...</div>
          ) : historyList.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)' }}>No Work Orders have been generated yet.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-tertiary)', borderRadius: '12px', overflow: 'hidden' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '1rem' }}>Job No.</th>
                  <th style={{ padding: '1rem' }}>Client Name</th>
                  <th style={{ padding: '1rem' }}>Project Name</th>
                  <th style={{ padding: '1rem' }}>Rev</th>
                  <th style={{ padding: '1rem' }}>Date Generated</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyList.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold', color: 'var(--accent-primary, #6366f1)' }}>{item.job_no}</td>
                    <td style={{ padding: '1rem' }}>{item.client_name}</td>
                    <td style={{ padding: '1rem' }}>{item.project_name}</td>
                    <td style={{ padding: '1rem' }}>Rev.{item.revision}</td>
                    <td style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{new Date(item.date).toLocaleDateString()}</td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <button 
                        onClick={() => handleDownloadHistoryPdf(item)}
                        className="btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                      >
                        <Download size={14} /> Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* GENERATOR TAB VIEW */}
      {currentTab === 'generator' && (
        <div>
          {/* SUCCESS VIEW AFTER GENERATING */}
          {downloadUrl ? (
            <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Work Order Generated Successfully!</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Your Work Order PDF is ready to download and saved to history.</p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <a 
                  href={`${import.meta.env.VITE_WO_API_BASE || 'http://localhost:8080'}${downloadUrl}`} 
                  download={downloadName} 
                  target="_blank" 
                  rel="noreferrer"
                  className="btn-primary" 
                  style={{ padding: '0.8rem 1.8rem', fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', borderRadius: '8px', cursor: 'pointer' }}
                >
                  <Download size={20} /> Download Work Order PDF
                </a>
                <button 
                  className="btn-secondary" 
                  style={{ padding: '0.8rem 1.8rem', borderRadius: '8px', cursor: 'pointer' }} 
                  onClick={() => { setDownloadUrl(null); setDownloadName(''); }}
                >
                  Edit & Regenerate
                </button>
              </div>
            </div>
          ) : step === 'upload' ? (
            /* UPLOAD STEP */
            <div style={{ maxWidth: '700px', margin: '2rem auto' }}>
              <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 style={{ fontSize: '1.6rem', marginBottom: '0.5rem' }}>Upload Offer PDF</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                  Upload the client offer/quotation PDF. Gemini AI will automatically extract equipment tables, scope of supply, and commercial terms.
                </p>
              </div>

              {uploading ? (
                <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <RefreshCw className="spin" size={36} color="var(--accent-primary, #6366f1)" style={{ margin: '0 auto 1rem' }} />
                  <h3>Analyzing & Extracting Offer PDF...</h3>
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', fontSize: '0.9rem' }}>Gemini 2.5 Flash is extracting structured tables and specifications.</p>
                </div>
              ) : (
                <>
                  <WoFileUpload label="SEMCO Offer PDF" onUpload={handleFileUpload} />
                  
                  {preSelectedEnquiry && (
                    <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Or proceed directly with pre-filled enquiry data:</p>
                      <button 
                        className="btn-secondary" 
                        onClick={() => setStep('review')}
                        style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer' }}
                      >
                        Skip Upload & Use Enquiry Data →
                      </button>
                    </div>
                  )}
                </>
              )}

              {error && <div style={{ color: 'var(--error-red, #ef4444)', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>{error}</div>}
            </div>
          ) : (
            /* REVIEW & EDIT STEP */
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <button 
                  onClick={() => setStep('upload')} 
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}
                >
                  <ArrowLeft size={16} /> Re-upload PDF
                </button>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Review & edit extracted data before generating final PDF
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1.5rem' }}>
                {/* LEFT PANE: Form */}
                <div style={{ flex: offerPdfUrl ? '1 1 60%' : '1 1 100%', display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingRight: '0.5rem' }}>
                  
                  {/* Section 1: WO Details */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>📋 Work Order Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <EditableField label="Job No." field={{ value: state.job_no, confidence: 'manual', source: 'auto' }} onChange={v => updateField('job_no', v)} />
                      <EditableField label="Client Name" field={state.client_name} onChange={v => updateConfidenceField('client_name', v)} />
                      <EditableField label="PO No." field={{ value: state.po_no, confidence: 'manual', source: '' }} onChange={v => updateField('po_no', v)} />
                      <EditableField label="PO Date" field={{ value: state.po_date, confidence: 'manual', source: '' }} onChange={v => updateField('po_date', v)} type="date" />
                      <EditableField label="Project Name" field={state.project_name} onChange={v => updateConfidenceField('project_name', v)} />
                      
                      <div>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Sales Person *</label>
                        <select
                          value={state.sales_person}
                          onChange={e => updateField('sales_person', e.target.value)}
                          style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                        >
                          <option value="">-- Select Sales Person --</option>
                          {salesTeamList.map(s => (
                            <option key={s.id || s.name} value={s.name}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: System Overview */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>📝 System Overview</h3>
                    <textarea 
                      value={state.system_overview}
                      onChange={e => updateField('system_overview', e.target.value)}
                      rows={4}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', lineHeight: '1.5' }}
                    />
                  </div>

                  {/* Section 3: Equipment Details */}
                  <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>
                      ⚙️ Equipment Details ({state.equipment_tables.length} items)
                    </h3>
                    {state.equipment_tables.map((table, i) => (
                      <EquipmentAccordion 
                        key={i} 
                        data={table} 
                        onChange={newData => {
                          const newTables = [...state.equipment_tables];
                          newTables[i] = newData;
                          updateField('equipment_tables', newTables);
                        }}
                        onDelete={() => {
                          if (confirm(`Delete "${table.heading}"?`)) {
                            updateField('equipment_tables', state.equipment_tables.filter((_, idx) => idx !== i));
                          }
                        }}
                      />
                    ))}
                    <button 
                      onClick={() => updateField('equipment_tables', [...state.equipment_tables, { heading: 'New Equipment', rows: [{ parameter: '', specification: '' }] }])}
                      className="btn-secondary"
                      style={{ width: '100%', padding: '0.6rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '8px', cursor: 'pointer' }}
                    >
                      <Plus size={16} /> Add Equipment Section
                    </button>
                  </div>

                  {/* Section 4: Scope of Supply */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>📦 Scope of Supply</h3>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Scope Bullets</h4>
                    <EditableBulletList items={state.scope_bullets} onChange={b => updateField('scope_bullets', b)} />
                    
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '1.2rem 0 0.5rem' }}>Scope Table</h4>
                    <EditableTable data={state.scope_table} onChange={d => updateField('scope_table', d)} />
                  </div>

                  {/* Section 5: Exclusion */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>🚫 Exclusion</h3>
                    <EditableBulletList items={state.exclusion_bullets} onChange={b => updateField('exclusion_bullets', b)} />
                  </div>

                  {/* Section 6: Delivery Period */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>🚚 Delivery Period</h3>
                    <textarea 
                      value={state.delivery_period}
                      onChange={e => updateField('delivery_period', e.target.value)}
                      rows={2}
                      style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                    />
                  </div>

                  {/* Section 7: Despatch Details */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>📍 Despatch Details</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <EditableField label="Price Basis" field={state.price_basis} onChange={v => updateConfidenceField('price_basis', v)} />
                      <EditableField label="Freight" field={state.freight} onChange={v => updateConfidenceField('freight', v)} />
                      <EditableField label="Packing & Forwarding" field={state.packing_forwarding} onChange={v => updateConfidenceField('packing_forwarding', v)} />
                      <EditableField label="Payment Terms" field={state.payment_terms} onChange={v => updateConfidenceField('payment_terms', v)} />
                    </div>
                    <div style={{ marginTop: '1rem' }}>
                      <EditableField label="Destination" field={{ value: state.destination, confidence: 'manual', source: '' }} onChange={v => updateField('destination', v)} />
                      <EditableField label="GST No. (Client)" field={{ value: state.gst_no, confidence: 'manual', source: '' }} onChange={v => updateField('gst_no', v)} />
                    </div>
                  </div>

                  {/* Section 8: Remarks & Notes */}
                  <div style={{ background: 'var(--bg-tertiary)', padding: '1.2rem', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '3rem' }}>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary, #6366f1)', fontSize: '1.1rem' }}>📌 Remarks & Notes</h3>
                    <EditableBulletList 
                      items={state.remarks_notes.filter(n => n.enabled).map(n => n.text)} 
                      onChange={bullets => {
                        const notes = bullets.map(text => ({ text, is_boilerplate: false, enabled: true }));
                        updateField('remarks_notes', notes);
                      }} 
                    />
                    <div style={{ marginTop: '1rem' }}>
                      <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Warranty</label>
                      <textarea 
                        value={state.warranty}
                        onChange={e => updateField('warranty', e.target.value)}
                        rows={2}
                        style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* RIGHT PANE: PDF Viewer (if offer uploaded) */}
                {offerPdfUrl && (
                  <div style={{ flex: '1 1 40%', height: 'calc(100vh - 220px)', background: 'var(--bg-tertiary)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '0.8rem 1rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>
                      📄 Source Offer PDF
                    </div>
                    <iframe 
                      src={getOfferPdfViewUrl(offerPdfUrl)} 
                      style={{ flex: 1, border: 'none', width: '100%' }}
                      title="Offer PDF Viewer"
                    />
                  </div>
                )}
              </div>

              {/* ACTION BAR (sticky at bottom) */}
              <div style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '1rem 2rem',
                background: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justify: 'space-between',
                alignItems: 'center',
                zIndex: 90
              }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--success-green, #22c55e)', fontSize: '0.85rem' }}>
                    <CheckCircle size={14} /> {autoCount} Auto-filled
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--warning-amber, #f59e0b)', fontSize: '0.85rem' }}>
                    <AlertTriangle size={14} /> {confirmCount} Must Confirm
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--error-red, #ef4444)', fontSize: '0.85rem' }}>
                    <Edit3 size={14} /> {manualCount} Manual
                  </span>
                </div>

                {error && <span style={{ color: 'var(--error-red, #ef4444)', fontSize: '0.85rem' }}>{error}</span>}

                <button 
                  className="btn-primary" 
                  onClick={handleGenerate} 
                  disabled={generating}
                  style={{ padding: '0.75rem 1.8rem', fontSize: '0.95rem', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  {generating ? <><RefreshCw className="spin" size={16} /> Generating PDF...</> : '🔧 Generate Work Order'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
