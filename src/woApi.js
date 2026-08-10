export const WO_API_BASE = import.meta.env.VITE_WO_API_BASE || 'http://localhost:8080';

export async function uploadOffer(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${WO_API_BASE}/api/upload-offer`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(err.detail || 'Upload failed');
  }
  
  return res.json();
}

export async function uploadPO(file) {
  const formData = new FormData();
  formData.append('file', file);
  
  const res = await fetch(`${WO_API_BASE}/api/upload-po`, {
    method: 'POST',
    body: formData,
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'PO upload failed' }));
    throw new Error(err.detail || 'PO upload failed');
  }
  
  return res.json();
}

export async function generateWorkOrder(data) {
  const res = await fetch(`${WO_API_BASE}/api/generate-workorder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Generation failed' }));
    throw new Error(err.detail || 'Generation failed');
  }
  
  return res.json();
}

export async function downloadGeneratedPdf(pdfUrl) {
  const res = await fetch(`${WO_API_BASE}${pdfUrl}`);
  if (!res.ok) throw new Error('Download failed');
  return res.blob();
}

export async function getClients() {
  const res = await fetch(`${WO_API_BASE}/api/clients`);
  if (!res.ok) return [];
  return res.json();
}

export async function saveClient(client) {
  const res = await fetch(`${WO_API_BASE}/api/clients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  return res.json();
}

export async function updateClient(id, client) {
  const res = await fetch(`${WO_API_BASE}/api/clients/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(client),
  });
  return res.json();
}

export async function getSalesTeam() {
  const res = await fetch(`${WO_API_BASE}/api/sales-team`);
  if (!res.ok) return [];
  return res.json();
}

export async function getBoilerplateNotes() {
  const res = await fetch(`${WO_API_BASE}/api/boilerplate-notes`);
  if (!res.ok) return [];
  const notes = await res.json();
  return notes.map((n) => ({
    text: n.text,
    is_boilerplate: true,
    enabled: Boolean(n.enabled),
  }));
}

export async function getWorkOrderHistory() {
  const res = await fetch(`${WO_API_BASE}/api/work-orders`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((wo) => ({
    id: wo.id,
    job_no: wo.job_no,
    client_name: wo.client_name,
    project_name: wo.project_name,
    revision: wo.revision,
    date: wo.created_at,
    pdf_url: `/api/work-orders/download/${(wo.pdf_path || '').split('/').pop() || (wo.pdf_path || '').split('\\').pop()}`,
  }));
}

export async function getNextJobNumber() {
  const res = await fetch(`${WO_API_BASE}/api/next-job-number`);
  if (!res.ok) return '';
  const data = await res.json();
  return data.job_no;
}

export async function deleteWorkOrderHistory(id) {
  const res = await fetch(`${WO_API_BASE}/api/work-orders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to delete entry' }));
    throw new Error(err.detail || 'Failed to delete entry');
  }
  return res.json();
}

export function getOfferPdfViewUrl(offerPdfUrl) {
  return `${WO_API_BASE}${offerPdfUrl}`;
}
