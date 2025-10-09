import { useState, useEffect } from 'react';
import { usePageTracking } from '../hooks/usePageTracking';
import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function SavedReportsPage({ onLoadReport, onBack, hasSession, onViewResults }) {
  // Track page view
  usePageTracking('saved-reports');
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSavedReports();
  }, []);

  const fetchSavedReports = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/saved-reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      } else {
        setError('Failed to load saved reports');
      }
    } catch (err) {
      setError('Error loading saved reports');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Unknown';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFF9F5 100%)',
        borderBottom: '1px solid #E5E7EB',
        padding: '2rem 0 1.5rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <img src={logo} alt="UX Research Copilot" style={{ height: '140px' }} />
            <div>
              <p style={{
                fontSize: '0.875rem',
                color: '#6B7280',
                margin: 0,
                fontWeight: 500,
                letterSpacing: '0.05em'
              }}>
                AI-POWERED RESEARCH ANALYSIS
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '1rem 2rem 3rem 2rem' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E5E7EB', marginBottom: '2rem' }}>
          <button
            onClick={onBack}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              color: '#6B7280',
              fontWeight: 500,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Upload
          </button>
          <button
            onClick={onViewResults}
            disabled={!hasSession}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '3px solid transparent',
              color: hasSession ? '#6B7280' : '#9CA3AF',
              fontWeight: 500,
              cursor: hasSession ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              opacity: hasSession ? 1 : 0.5
            }}
          >
            Results
          </button>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'white',
              border: 'none',
              borderBottom: '3px solid #0079C8',
              color: '#0079C8',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: '1rem'
            }}
          >
            Saved Reports
          </button>
        </div>

        {/* Page Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#201E32', marginBottom: '0.5rem' }}>
            Saved Reports
          </h1>
          <p style={{ color: '#6B7280', fontSize: '1rem' }}>
            Access your previously saved research reports
          </p>
        </div>

        {/* Reports List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: '#6B7280', fontSize: '1.125rem' }}>Loading saved reports...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: '#F9524C', fontSize: '1.125rem' }}>{error}</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <p style={{ color: '#6B7280', fontSize: '1.125rem', marginBottom: '1rem' }}>
              No saved reports yet
            </p>
            <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
              Process some research files and save your reports to see them here
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {reports.map((report, index) => (
              <div
                key={report.session_id || index}
                className="card"
                style={{
                  borderLeft: '4px solid #0079C8',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
                onClick={() => onLoadReport(report.session_id)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem' }}>
                      {report.report_name || 'Untitled Report'}
                    </h3>
                    <p style={{ color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                      Session ID: {report.session_id}
                    </p>
                    <p style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                      Saved: {formatDate(report.saved_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadReport(report.session_id);
                    }}
                    className="btn-primary"
                    style={{
                      fontSize: '0.875rem',
                      padding: '0.5rem 1rem'
                    }}
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
