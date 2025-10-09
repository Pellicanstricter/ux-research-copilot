import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { api } from '../services/api';
import { usePageTracking } from '../hooks/usePageTracking';

export default function AdminPage({ onBack }) {
  const [feedback, setFeedback] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  // Track page view
  usePageTracking('admin');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feedbackRes, analyticsRes] = await Promise.all([
        fetch('http://localhost:8001/api/admin/feedback'),
        fetch('http://localhost:8001/api/admin/analytics')
      ]);

      const feedbackData = await feedbackRes.json();
      const analyticsData = await analyticsRes.json();

      setFeedback(feedbackData.feedback || []);
      setAnalytics(analyticsData);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check if user is admin (you can customize this logic)
  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'steinrueckn@gmail.com';

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ color: '#C65D5D', marginBottom: '1rem' }}>Access Denied</h1>
          <p style={{ color: '#6B7280' }}>You don't have permission to view this page.</p>
          <button
            onClick={onBack}
            style={{
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#C65D5D',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #E5E7EB',
        padding: '1.5rem 2rem'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, color: '#201E32' }}>Admin Dashboard</h1>
          <button
            onClick={onBack}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: 'transparent',
              border: '1px solid #D1D5DB',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#6B7280',
            }}
          >
            Back to App
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Page Views</p>
            <h2 style={{ margin: 0, color: '#201E32', fontSize: '2rem' }}>{analytics?.total_pageviews || 0}</h2>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Unique Visitors</p>
            <h2 style={{ margin: 0, color: '#201E32', fontSize: '2rem' }}>{analytics?.unique_visitors || 0}</h2>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Processing Sessions</p>
            <h2 style={{ margin: 0, color: '#201E32', fontSize: '2rem' }}>{analytics?.total_sessions || 0}</h2>
          </div>
          <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
            <p style={{ margin: 0, color: '#6B7280', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Total Feedback</p>
            <h2 style={{ margin: 0, color: '#201E32', fontSize: '2rem' }}>{feedback.length}</h2>
          </div>
        </div>

        {/* Feedback Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem' }}>
          <h2 style={{ margin: 0, marginBottom: '1.5rem', color: '#201E32' }}>User Feedback</h2>

          {loading ? (
            <p style={{ color: '#6B7280' }}>Loading feedback...</p>
          ) : error ? (
            <p style={{ color: '#EF4444' }}>{error}</p>
          ) : feedback.length === 0 ? (
            <p style={{ color: '#6B7280' }}>No feedback yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {feedback.map((item, index) => (
                <div
                  key={index}
                  style={{
                    padding: '1rem',
                    backgroundColor: '#F9FAFB',
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <strong style={{ color: '#201E32' }}>{item.name}</strong>
                      <span style={{ color: '#6B7280', marginLeft: '0.5rem' }}>({item.email})</span>
                    </div>
                    <span style={{ color: '#9CA3AF', fontSize: '0.875rem' }}>
                      {new Date(item.submitted_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, color: '#374151' }}>{item.feedback}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* File Types Section */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '1.5rem', marginTop: '2rem' }}>
          <h2 style={{ margin: 0, marginBottom: '1.5rem', color: '#201E32' }}>Popular File Types</h2>
          {analytics?.file_types && Object.keys(analytics.file_types).length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              {Object.entries(analytics.file_types)
                .sort(([, a], [, b]) => b - a)
                .map(([fileType, count]) => (
                  <div
                    key={fileType}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid #E5E7EB',
                      textAlign: 'center',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 600, color: '#C65D5D' }}>
                      {count}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.875rem', color: '#6B7280', marginTop: '0.25rem', textTransform: 'uppercase' }}>
                      {fileType}
                    </p>
                  </div>
                ))}
            </div>
          ) : (
            <p style={{ color: '#6B7280' }}>No file uploads yet.</p>
          )}
        </div>
      </main>
    </div>
  );
}
