import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ExportMenu({ results, sessionId }) {
  const [reportName, setReportName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const handleExportPDF = () => {
    window.print();
  };

  const handleSaveReport = async () => {
    if (!reportName.trim()) {
      setSaveStatus('Please enter a report name');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/session/${sessionId}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_name: reportName.trim(),
          results: results
        })
      });

      if (response.ok) {
        setSaveStatus('Report saved successfully!');
        setTimeout(() => {
          setShowSaveDialog(false);
          setSaveStatus('');
          setReportName('');
        }, 1500);
      } else {
        setSaveStatus('Failed to save report');
      }
    } catch (error) {
      setSaveStatus('Error saving report');
      console.error(error);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <button
        onClick={() => setShowSaveDialog(true)}
        className="btn-primary"
        style={{
          fontSize: '0.875rem',
          padding: '0.5rem 1.25rem',
          backgroundColor: '#00C9A5',
          borderColor: '#00C9A5'
        }}
      >
        Save Report
      </button>
      <button
        onClick={handleExportPDF}
        className="btn-primary"
        style={{
          fontSize: '0.875rem',
          padding: '0.5rem 1.25rem'
        }}
      >
        Export PDF
      </button>

      {showSaveDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
          onClick={() => setShowSaveDialog(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '0.5rem',
              padding: '2rem',
              maxWidth: '400px',
              width: '90%'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1rem', color: '#201E32' }}>
              Save Report
            </h2>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
              Give your report a name to save it for later access.
            </p>

            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="e.g., Q4 User Research"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #E5E7EB',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                marginBottom: '1rem'
              }}
              autoFocus
            />

            {saveStatus && (
              <p style={{
                color: saveStatus.includes('success') ? '#00C9A5' : '#F9524C',
                fontSize: '0.875rem',
                marginBottom: '1rem'
              }}>
                {saveStatus}
              </p>
            )}

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSaveDialog(false);
                  setSaveStatus('');
                  setReportName('');
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #E5E7EB',
                  borderRadius: '0.375rem',
                  background: 'white',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveReport}
                className="btn-primary"
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem'
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
