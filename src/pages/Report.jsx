import { useState, useEffect } from 'react';
import './Report.css';

const Report = ({ reportData, onBack }) => {
  const [copySuccess, setCopySuccess] = useState('');

  const copyToClipboard = () => {
    const reportText = formatReportForCopy(reportData);
    navigator.clipboard.writeText(reportText).then(() => {
      setCopySuccess('Report copied successfully!');
      setTimeout(() => setCopySuccess(''), 3000);
    });
  };

  const formatReportForCopy = (data) => {
    let text = `Auto-Fill Schedule Report\n${'='.repeat(30)}\n\n`;
    
    if (data.ignoredAppointments?.length > 0) {
      text += `Ignored Appointments (${data.ignoredAppointments.length}):\n`;
      text += '-'.repeat(20) + '\n';
      data.ignoredAppointments.forEach(apt => {
        text += `• ${apt.clientName} - ${apt.day} at ${apt.time}\n`;
        text += `  Reason: ${apt.reason}\n\n`;
      });
    }

    if (data.conflicts?.length > 0) {
      text += `Conflicts (${data.conflicts.length}):\n`;
      text += '-'.repeat(20) + '\n';
      data.conflicts.forEach(conflict => {
        text += `• ${conflict.day} at ${conflict.time}\n`;
        text += `  Workers: ${conflict.workers.join(', ')}\n\n`;
      });
    }

    text += `Worker Distribution:\n`;
    text += '-'.repeat(20) + '\n';
    Object.entries(data.workerStats || {}).forEach(([worker, stats]) => {
      text += `${worker}:\n`;
      text += `  Total Appointments: ${stats.total}\n`;
      text += `  Internal Work: ${stats.internal}\n`;
      text += `  External Work: ${stats.external}\n\n`;
    });

    text += `Statistics:\n`;
    text += '-'.repeat(20) + '\n';
    text += `Total Scheduled Appointments: ${data.totalScheduled || 0}\n`;
    text += `Total Ignored Appointments: ${data.ignoredAppointments?.length || 0}\n`;
    text += `Total Conflicts: ${data.conflicts?.length || 0}\n`;

    return text;
  };

  if (!reportData) {
    return (
      <div className="report-page">
        <div className="report-header">
          <button onClick={onBack} className="back-btn">← Back</button>
          <h2>No Report Available</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="report-page">
      <div className="report-header">
        <button onClick={onBack} className="back-btn">← Back</button>
        <h2>Auto-Fill Schedule Report</h2>
        <button onClick={copyToClipboard} className="copy-btn">
          📋 Copy Report
        </button>
      </div>

      {copySuccess && <div className="copy-success">Report copied successfully!</div>}

      <div className="report-content">
        {reportData.ignoredAppointments?.length > 0 && (
          <div className="report-section ignored-section">
            <h3>🚫 Ignored Appointments ({reportData.ignoredAppointments.length})</h3>
            <div className="ignored-list">
              {reportData.ignoredAppointments.map((apt, index) => (
                <div key={index} className="ignored-item">
                  <div className="ignored-client">
                    <strong>{apt.clientName}</strong>
                  </div>
                  <div className="ignored-details">
                    {apt.day} الساعة {apt.time}
                  </div>
                  <div className="ignored-reason">
                    Reason: {apt.reason}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {reportData.conflicts?.length > 0 && (
          <div className="report-section conflicts-section">
            <h3>⚠️ Conflicts ({reportData.conflicts.length})</h3>
            <div className="conflicts-list">
              {reportData.conflicts.map((conflict, index) => (
                <div key={index} className="conflict-item">
                  <div className="conflict-time">
                    {conflict.day} الساعة {conflict.time}
                  </div>
                  <div className="conflict-workers">
                    Workers: {conflict.workers.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="report-section stats-section">
          <h3>📊 Worker Distribution</h3>
          <div className="worker-stats">
            {Object.entries(reportData.workerStats || {}).map(([worker, stats]) => (
              <div key={worker} className="worker-stat">
                <h4>{worker}</h4>
                <div className="stat-item">
                  <span>Total Appointments:</span>
                  <span>{stats.total}</span>
                </div>
                <div className="stat-item">
                  <span>Internal Work:</span>
                  <span>{stats.internal}</span>
                </div>
                <div className="stat-item">
                  <span>External Work:</span>
                  <span>{stats.external}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="report-section summary-section">
          <h3>📈 Statistics Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span>Total Scheduled Appointments:</span>
              <span>{reportData.totalScheduled || 0}</span>
            </div>
            <div className="summary-item">
              <span>Total Ignored Appointments:</span>
              <span>{reportData.ignoredAppointments?.length || 0}</span>
            </div>
            <div className="summary-item">
              <span>Total Conflicts:</span>
              <span>{reportData.conflicts?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;