import React, { useState } from 'react';

// Stacked Bar Chart Component (Total vs Confirmed)
function StackedBarChart({ data, title, legendLabels = ['Confirmed', 'Other Statuses'] }) {
  const margin = { top: 30, right: 20, bottom: 40, left: 40 };
  const width = 450;
  const height = 260;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxVal = Math.max(...data.map(d => d.total || 0), 5);
  const barWidth = Math.min(30, chartWidth / (data.length || 1) * 0.5);
  const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

  const hasData = data.some(d => d.total > 0);

  return (
    <div className="analytics-card">
      <h4 className="analytics-card-title">{title}</h4>
      <div className="chart-legend">
        <span className="legend-item">
          <span className="legend-color confirmed"></span>
          {legendLabels[0]}
        </span>
        <span className="legend-item">
          <span className="legend-color other"></span>
          {legendLabels[1]}
        </span>
      </div>
      
      {!hasData ? (
        <div className="delayed-empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          No data available for this period.
        </div>
      ) : (
        <div className="svg-container" style={{ position: 'relative', width: '100%', height: '200px' }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            {/* Grids and Y labels */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = margin.top + chartHeight * (1 - ratio);
              const val = Math.round(maxVal * ratio);
              return (
                <g key={idx}>
                  <line 
                    x1={margin.left} 
                    y1={y} 
                    x2={width - margin.right} 
                    y2={y} 
                    className="chart-grid-line"
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={margin.left - 10} 
                    y={y + 4} 
                    fill="var(--text-secondary)" 
                    fontSize="0.75rem" 
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Stacked Bars */}
            {data.map((d, idx) => {
              const x = margin.left + gap + idx * (barWidth + gap);
              
              const confHeight = (d.confirmed / maxVal) * chartHeight;
              const otherHeight = (d.other / maxVal) * chartHeight;
              
              const confY = margin.top + chartHeight - confHeight;
              const otherY = confY - otherHeight;

              return (
                <g key={idx} className="chart-bar-group">
                  {d.confirmed > 0 && (
                    <rect 
                      x={x} 
                      y={confY} 
                      width={barWidth} 
                      height={confHeight} 
                      fill="url(#gradient-conf)"
                      rx={otherHeight === 0 ? 4 : 0}
                    />
                  )}
                  {d.other > 0 && (
                    <rect 
                      x={x} 
                      y={otherY} 
                      width={barWidth} 
                      height={otherHeight} 
                      fill="url(#gradient-oth)"
                      rx={4}
                    />
                  )}
                  {d.total > 0 && (
                    <text 
                      x={x + barWidth / 2} 
                      y={otherY - 6} 
                      fill="var(--text-primary)" 
                      fontSize="0.72rem" 
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {d.total}
                    </text>
                  )}
                  <text 
                    x={x + barWidth / 2} 
                    y={height - margin.bottom + 18} 
                    fill="var(--text-secondary)" 
                    fontSize="0.75rem" 
                    textAnchor="middle"
                    className="chart-axis-label"
                  >
                    {d.label}
                  </text>
                  <title>{`${d.label}\nTotal: ${d.total}\nConfirmed: ${d.confirmed}\nOther: ${d.other}`}</title>
                </g>
              );
            })}

            <defs>
              <linearGradient id="gradient-conf" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="gradient-oth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

// Single Bar Chart Component (Stages breakdown / Delayed milestones)
function SingleBarChart({ data, title, emptyText = "No data available." }) {
  const margin = { top: 30, right: 20, bottom: 50, left: 40 };
  const width = 450;
  const height = 260;
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxVal = Math.max(...data.map(d => d.value || 0), 5);
  const barWidth = Math.min(26, chartWidth / (data.length || 1) * 0.4);
  const gap = (chartWidth - barWidth * data.length) / (data.length + 1);

  const hasData = data.some(d => d.value > 0);

  return (
    <div className="analytics-card">
      <h4 className="analytics-card-title">{title}</h4>
      
      {!hasData ? (
        <div className="delayed-empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>
          {emptyText}
        </div>
      ) : (
        <div className="svg-container" style={{ position: 'relative', width: '100%', height: '200px' }}>
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
              const y = margin.top + chartHeight * (1 - ratio);
              const val = Math.round(maxVal * ratio);
              return (
                <g key={idx}>
                  <line 
                    x1={margin.left} 
                    y1={y} 
                    x2={width - margin.right} 
                    y2={y} 
                    className="chart-grid-line"
                    strokeDasharray="4 4"
                  />
                  <text 
                    x={margin.left - 10} 
                    y={y + 4} 
                    fill="var(--text-secondary)" 
                    fontSize="0.75rem" 
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {data.map((d, idx) => {
              const x = margin.left + gap + idx * (barWidth + gap);
              const barHeight = (d.value / maxVal) * chartHeight;
              const y = margin.top + chartHeight - barHeight;

              return (
                <g key={idx} className="chart-bar-group">
                  {d.value > 0 && (
                    <rect 
                      x={x} 
                      y={y} 
                      width={barWidth} 
                      height={barHeight} 
                      fill="url(#gradient-sgl)"
                      rx={4}
                    />
                  )}
                  {d.value > 0 && (
                    <text 
                      x={x + barWidth / 2} 
                      y={y - 6} 
                      fill="var(--text-primary)" 
                      fontSize="0.72rem" 
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {d.value}
                    </text>
                  )}
                  <text 
                    x={x + barWidth / 2} 
                    y={height - margin.bottom + 16} 
                    fill="var(--text-secondary)" 
                    fontSize="0.68rem" 
                    textAnchor="middle"
                    transform={`rotate(-20, ${x + barWidth / 2}, ${height - margin.bottom + 16})`}
                    className="chart-axis-label"
                  >
                    {d.label}
                  </text>
                  <title>{`${d.label}: ${d.value}`}</title>
                </g>
              );
            })}

            <defs>
              <linearGradient id="gradient-sgl" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7e22ce" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      )}
    </div>
  );
}

export default function DashboardAnalytics({ enquiries }) {
  const [period, setPeriod] = useState('monthly'); // 'daily', 'monthly', 'quarterly', 'yearly'

  // Helper to format Date object as YYYY-MM-DD in local time
  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Helper to parse date string (YYYY-MM-DD) into local midnight Date object
  const parseLocalDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Current date (actual local time of the user using the portal)
  const currentDate = new Date();
  const todayStr = formatLocalDate(currentDate);

  // Group Queries by Selected Period
  const getFilteredDataByPeriod = () => {
    if (period === 'daily') {
      const result = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(currentDate);
        d.setDate(currentDate.getDate() - i);
        const dateStr = formatLocalDate(d);
        
        const dayEnquiries = enquiries.filter(e => e.date === dateStr);
        const confirmed = dayEnquiries.filter(e => e.currentStatus === 'Confirmed').length;
        const total = dayEnquiries.length;
        
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        result.push({ label, confirmed, other: total - confirmed, total });
      }
      return result;
    }
    
    if (period === 'monthly') {
      const result = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}`;
        
        const monthEnquiries = enquiries.filter(e => e.date && e.date.startsWith(prefix));
        const confirmed = monthEnquiries.filter(e => e.currentStatus === 'Confirmed').length;
        const total = monthEnquiries.length;
        
        const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        result.push({ label, confirmed, other: total - confirmed, total });
      }
      return result;
    }
    
    if (period === 'quarterly') {
      const result = [];
      for (let i = 3; i >= 0; i--) {
        const currentQuarter = Math.floor(currentDate.getMonth() / 3);
        const targetQuarterTotal = (currentDate.getFullYear() * 4 + currentQuarter) - i;
        const targetYear = Math.floor(targetQuarterTotal / 4);
        const targetQuarter = targetQuarterTotal % 4;
        
        const startMonth = targetQuarter * 3;
        const endMonth = startMonth + 2;
        
        const quarterEnquiries = enquiries.filter(e => {
          if (!e.date) return false;
          const enqDate = parseLocalDate(e.date);
          return enqDate.getFullYear() === targetYear && 
                 enqDate.getMonth() >= startMonth && 
                 enqDate.getMonth() <= endMonth;
        });
        
        const confirmed = quarterEnquiries.filter(e => e.currentStatus === 'Confirmed').length;
        const total = quarterEnquiries.length;
        
        const label = `Q${targetQuarter + 1} '${String(targetYear).substring(2)}`;
        result.push({ label, confirmed, other: total - confirmed, total });
      }
      return result;
    }
    
    if (period === 'yearly') {
      const result = [];
      const currentYear = currentDate.getFullYear();
      for (let i = 4; i >= 0; i--) {
        const targetYear = currentYear - i;
        const prefix = String(targetYear);
        
        const yearEnquiries = enquiries.filter(e => e.date && e.date.startsWith(prefix));
        const confirmed = yearEnquiries.filter(e => e.currentStatus === 'Confirmed').length;
        const total = yearEnquiries.length;
        
        result.push({ label: String(targetYear), confirmed, other: total - confirmed, total });
      }
      return result;
    }
    
    return [];
  };

  // Group Stacked Data by Field
  const getGroupedDataByField = (fieldName) => {
    const groupCounts = {};
    enquiries.forEach(e => {
      const rawVal = e[fieldName] || 'Unknown';
      
      let keys = [];
      if (fieldName === 'majorEquipments') {
        if (typeof rawVal === 'string' && rawVal.includes(',')) {
          keys = rawVal.split(',').map(item => item.trim()).filter(Boolean);
        } else if (typeof rawVal === 'string') {
          const trimmed = rawVal.trim();
          keys = [trimmed || 'Unknown'];
        } else {
          keys = ['Unknown'];
        }
      } else {
        keys = [typeof rawVal === 'string' ? rawVal.trim() : rawVal];
      }

      keys.forEach(key => {
        if (!groupCounts[key]) {
          groupCounts[key] = { confirmed: 0, total: 0 };
        }
        groupCounts[key].total += 1;
        if (e.currentStatus === 'Confirmed') {
          groupCounts[key].confirmed += 1;
        }
      });
    });

    const result = Object.keys(groupCounts).map(name => ({
      label: name,
      confirmed: groupCounts[name].confirmed,
      other: groupCounts[name].total - groupCounts[name].confirmed,
      total: groupCounts[name].total
    }));

    result.sort((a, b) => b.total - a.total);

    if (fieldName === 'majorEquipments') {
      return result.slice(0, 7);
    }

    if (result.length > 5 && fieldName !== 'majorEquipments') {
      const top = result.slice(0, 5);
      const rest = result.slice(5);
      let restConfirmed = 0;
      let restTotal = 0;
      rest.forEach(r => {
        restConfirmed += r.confirmed;
        restTotal += r.total;
      });
      top.push({
        label: 'Others',
        confirmed: restConfirmed,
        other: restTotal - restConfirmed,
        total: restTotal
      });
      return top;
    }
    return result;
  };

  // Stages Breakdown
  const getStagesData = () => {
    const stages = [
      "Costing",
      "Offer submitted",
      "Follow-up in progress",
      "Negotiation ongoing",
      "Lost",
      "Confirmed"
    ];
    return stages.map(stage => {
      const count = enquiries.filter(e => e.currentStatus === stage).length;
      return { label: stage, value: count };
    });
  };

  // Calculate Delayed Milestones
  const getDelayedMilestones = () => {
    const delayed = [];
    enquiries.forEach(enq => {
      if (enq.milestones) {
        enq.milestones.forEach(m => {
          if (m.status !== 'Completed' && m.endDate) {
            if (m.endDate < todayStr) {
              const todayDate = parseLocalDate(todayStr);
              const due = parseLocalDate(m.endDate);
              const diffTime = todayDate - due;
              const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
              delayed.push({
                poNumber: enq.poNumber || '-',
                clientName: enq.clientName,
                companyName: enq.companyName,
                milestoneName: m.name,
                fpr: m.fpr || 'Unassigned',
                dueDate: m.endDate,
                daysDelayed: diffDays
              });
            }
          }
        });
      }
    });
    delayed.sort((a, b) => b.daysDelayed - a.daysDelayed);
    return delayed;
  };

  // Calculate Delayed Milestones by FPR
  const getDelayedMilestonesByFpr = (delayedList) => {
    const counts = {};
    delayedList.forEach(item => {
      const key = item.fpr || 'Unassigned';
      counts[key] = (counts[key] || 0) + 1;
    });
    return Object.keys(counts).map(key => ({
      label: key,
      value: counts[key]
    }));
  };

  // Calculate Upcoming Milestones (Next 7 days)
  const getUpcomingMilestones = () => {
    const d = new Date(currentDate);
    d.setDate(currentDate.getDate() + 7);
    const sevenDaysLaterStr = formatLocalDate(d);
    
    const upcoming = [];
    enquiries.forEach(enq => {
      if (enq.milestones) {
        enq.milestones.forEach(m => {
          if (m.status !== 'Completed' && m.endDate) {
            // Include today + next 7 days
            if (m.endDate >= todayStr && m.endDate <= sevenDaysLaterStr) {
              upcoming.push({
                quotationNumber: enq.quotationNumber,
                clientName: enq.clientName,
                companyName: enq.companyName,
                milestoneName: m.name,
                fpr: m.fpr || 'Unassigned',
                dueDate: m.endDate,
                status: m.status
              });
            }
          }
        });
      }
    });
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    return upcoming;
  };

  const queriesData = getFilteredDataByPeriod();
  const stagesData = getStagesData();
  const clientData = getGroupedDataByField('clientName');
  const equipmentData = getGroupedDataByField('majorEquipments');
  const sourceData = getGroupedDataByField('enquirySource');
  const delayedMilestones = getDelayedMilestones();
  const upcomingMilestones = getUpcomingMilestones();

  return (
    <div className="analytics-dashboard">
      
      {/* Time Period Filter controls */}
      <div className="controls-bar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '1.05rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          Time Period Filtering
        </div>
        <div className="top-navbar" style={{ margin: '0' }}>
          {['daily', 'monthly', 'quarterly', 'yearly'].map((p) => (
            <button
              key={p}
              className={`nav-link ${period === p ? 'active' : ''}`}
              onClick={() => setPeriod(p)}
              style={{ textTransform: 'capitalize' }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of charts */}
      <div className="analytics-grid">
        <StackedBarChart 
          data={queriesData} 
          title={`Queries Overview (${period.toUpperCase()})`} 
        />
        
        <SingleBarChart 
          data={stagesData} 
          title="Stages of Enquiry" 
        />

        <StackedBarChart 
          data={clientData} 
          title="Client Wise Analysis (Top 5)" 
        />

        <StackedBarChart 
          data={equipmentData} 
          title="Equipment Wise Analysis (Top 7)" 
        />

        <StackedBarChart 
          data={sourceData} 
          title="Source Wise Analysis" 
        />
      </div>

      {/* Detailed Lists Section */}
      <div className="analytics-details-grid">
        {/* Delayed Milestones List */}
        <div className="table-card" style={{ marginTop: '0' }}>
          <div className="modal-header section-header-bar" style={{ padding: '16px 24px' }}>
            <h4 className="modal-title section-header-title section-header-danger" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> Delayed Milestones (Overdue List)
            </h4>
          </div>
          <div className="delayed-list-container" style={{ padding: '16px 24px', maxHeight: '380px', overflowY: 'auto' }}>
            {delayedMilestones.length === 0 ? (
              <div className="delayed-empty-state" style={{ height: '200px' }}>
                No delayed milestones! All projects are on track.
              </div>
            ) : (
              delayedMilestones.map((item, idx) => (
                <div className="delayed-item-row" key={idx}>
                  <div className="delayed-item-info">
                    <span className="delayed-item-qtn">{item.poNumber}</span>
                    <span className="delayed-item-name">{item.milestoneName}</span>
                    <div className="delayed-item-meta">
                      Company: {item.companyName} | Client: {item.clientName}
                    </div>
                  </div>
                  <div className="delayed-item-action" style={{ textAlign: 'right' }}>
                    <span className="delayed-badge">{item.daysDelayed}d overdue</span>
                    <div className="delayed-fpr">FPR: {item.fpr}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Milestones Table */}
        <div className="table-card" style={{ marginTop: '0' }}>
          <div className="modal-header section-header-bar" style={{ padding: '16px 24px' }}>
            <h4 className="modal-title section-header-title" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗓️</span> Upcoming Milestones (Next 7 Days)
            </h4>
          </div>
          
          <div className="table-responsive" style={{ maxHeight: '380px', overflowY: 'auto' }}>
            {upcomingMilestones.length === 0 ? (
              <div className="empty-state" style={{ padding: '36px', height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="empty-state-title" style={{ fontSize: '1rem' }}>No milestones due in the next 7 days</div>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Due Date</th>
                    <th>Enquiry No.</th>
                    <th>Client / Company</th>
                    <th>Milestone Name</th>
                    <th>FPR</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingMilestones.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ fontWeight: '600', color: 'var(--status-costing)' }}>{item.dueDate}</td>
                      <td>{item.quotationNumber}</td>
                      <td>{item.clientName} ({item.companyName})</td>
                      <td>{item.milestoneName}</td>
                      <td>{item.fpr}</td>
                      <td>
                        <span className={`status-badge milestone-status ${item.status.toLowerCase().replace(' ', '-')}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
