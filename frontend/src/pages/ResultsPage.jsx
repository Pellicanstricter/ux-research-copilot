import { useState, useEffect } from 'react';
import { api } from '../services/api';
import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';
import owlIcon from '../assets/IconOwl.png';
import ExportMenu from '../components/ExportMenu';

export default function ResultsPage({ sessionId, onBack, onViewSavedReports }) {
  const [results, setResults] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(true);
  const [showMethodologyForm, setShowMethodologyForm] = useState(false);
  const [methodology, setMethodology] = useState({
    method: 'User Interviews',
    participants: 0,
    dateRange: '',
    duration: '',
    objectives: ''
  });
  const [showResearchGoalsForm, setShowResearchGoalsForm] = useState(false);
  const [researchGoals, setResearchGoals] = useState({
    goals: [''],
    background: [''],
    assumptions: [''],
    purpose: ''
  });

  useEffect(() => {
    let pollInterval;

    const checkStatus = async () => {
      try {
        const statusData = await api.getStatus(sessionId);

        if (statusData.status === 'completed') {
          setPolling(false);
          // Fetch results
          const resultsData = await api.getResults(sessionId);
          console.log('Received results:', resultsData);
          console.log('Key insights:', resultsData.full_report?.key_insights);
          console.log('Quote count test:', resultsData.full_report?.key_insights?.map(i => ({
            title: i.title,
            quoteCount: i.supporting_quotes?.length || 0
          })));
          setResults(resultsData.full_report);

          // Auto-detect methodology values
          const detectedParticipants = resultsData.full_report?.themes?.length || 0;
          setMethodology(prev => ({
            ...prev,
            participants: detectedParticipants
          }));

          setStatus('completed');
        } else if (statusData.status === 'failed') {
          setPolling(false);
          setStatus('failed');
          setError(statusData.error_message || 'Processing failed');
        } else {
          setStatus('processing');
        }
      } catch (err) {
        console.error('Error checking status:', err);
        setError(err.message);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 3 seconds while processing
    if (polling) {
      pollInterval = setInterval(checkStatus, 3000);
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [sessionId, polling]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(to bottom, #FFFFFF 0%, #FFF9F5 100%)',
        borderBottom: '1px solid #E5E7EB',
        padding: '1.5rem 0 1rem 0'
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
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '3rem 2rem' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E5E7EB', marginBottom: '2rem', alignItems: 'center' }}>
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
            Results
          </button>
          <button
            onClick={onViewSavedReports}
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
            Saved Reports
          </button>
          <div style={{ marginLeft: 'auto' }}>
            {status === 'completed' && results && (
              <ExportMenu results={results} sessionId={sessionId} />
            )}
          </div>
        </div>

        {status === 'loading' || status === 'processing' ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <img src={owlIcon} alt="Processing" style={{ width: '80px', height: '80px', marginBottom: '1rem', display: 'block' }} />
            <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#201E32', marginBottom: '1rem' }}>
              {status === 'loading' ? 'Loading...' : 'Processing Your Research'}
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#6B7280', marginBottom: '2rem' }}>
              Our AI agents are analyzing your data. This typically takes 2-5 minutes.
            </p>
            <div style={{ display: 'inline-block', padding: '1rem 2rem', backgroundColor: '#F0F9FF', borderRadius: '0.5rem' }}>
              <p style={{ color: '#0079C8', margin: 0, fontWeight: 500 }}>Session ID: {sessionId}</p>
            </div>
          </div>
        ) : status === 'failed' ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#F9524C', marginBottom: '1rem' }}>
              Processing Failed
            </h2>
            <p style={{ fontSize: '1.125rem', color: '#6B7280' }}>{error}</p>
          </div>
        ) : results ? (
          <div>
            {/* Summary Stats Dashboard - Moved to top */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #00C9A5', padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Key Insights
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#201E32', margin: 0 }}>
                    {results.key_insights?.length || 0}
                  </p>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #5F2A82', padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Themes
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#201E32', margin: 0 }}>
                    {results.themes?.length || 0}
                  </p>
                </div>
                <div className="card" style={{ textAlign: 'center', borderTop: '3px solid #0079C8', padding: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: '#6B7280', marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 600 }}>
                    Quotes
                  </p>
                  <p style={{ fontSize: '1.75rem', fontWeight: 700, color: '#201E32', margin: 0 }}>
                    {(() => {
                      let total = 0;
                      // Count quotes from insights
                      if (results.key_insights) {
                        results.key_insights.forEach(insight => {
                          total += insight.supporting_quotes?.length || 0;
                        });
                      }
                      // Count quotes from themes
                      if (results.themes) {
                        results.themes.forEach(theme => {
                          if (theme.insights) {
                            theme.insights.forEach(insight => {
                              total += 1; // Each insight in theme is a quote
                            });
                          }
                        });
                      }
                      return total;
                    })()}
                  </p>
                </div>
              </div>
            </div>

            {/* Methodology Slide */}
            <div style={{ marginBottom: '3rem' }}>
              {!showMethodologyForm ? (
                <div className="card" style={{
                  maxWidth: '1280px',
                  margin: '0 auto 3rem auto',
                  aspectRatio: '16 / 9',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  padding: '1.5rem',
                  borderTop: '4px solid #F9524C'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#201E32', margin: 0 }}>
                      Research Methodology
                    </h1>
                    <button
                      onClick={() => setShowMethodologyForm(true)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#F9524C',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      Edit Details
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flex: 1 }}>
                    <div style={{ backgroundColor: '#FFF5F5', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#F9524C', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Research Method
                      </h2>
                      <p style={{ fontSize: '1rem', color: '#201E32', margin: 0 }}>
                        {methodology.method}
                      </p>
                    </div>

                    <div style={{ backgroundColor: '#F0F9FF', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0079C8', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Participants
                      </h2>
                      <p style={{ fontSize: '1rem', color: '#201E32', margin: 0 }}>
                        {methodology.participants || 'Not specified'}
                      </p>
                    </div>

                    <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#065F46', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Date Range
                      </h2>
                      <p style={{ fontSize: '1rem', color: '#201E32', margin: 0 }}>
                        {methodology.dateRange || 'Not specified'}
                      </p>
                    </div>

                    <div style={{ backgroundColor: '#FAF5FF', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#5F2A82', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Session Duration
                      </h2>
                      <p style={{ fontSize: '1rem', color: '#201E32', margin: 0 }}>
                        {methodology.duration || 'Not specified'}
                      </p>
                    </div>
                  </div>

                  {methodology.objectives && (
                    <div style={{ backgroundColor: '#F9FAFB', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem' }}>
                      <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                        Research Objectives
                      </h2>
                      <p style={{ fontSize: '0.9rem', color: '#201E32', margin: 0, lineHeight: 1.4 }}>
                        {methodology.objectives}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="card" style={{
                  maxWidth: '1280px',
                  margin: '0 auto 3rem auto',
                  padding: '2rem',
                  borderTop: '4px solid #F9524C'
                }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#201E32', marginBottom: '1.5rem' }}>
                    Edit Research Methodology
                  </h1>

                  <div style={{ display: 'grid', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Research Method
                      </label>
                      <select
                        value={methodology.method}
                        onChange={(e) => setMethodology({...methodology, method: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          fontSize: '1rem'
                        }}
                      >
                        <option>User Interviews</option>
                        <option>Usability Testing</option>
                        <option>Survey</option>
                        <option>Focus Group</option>
                        <option>Field Study</option>
                        <option>Diary Study</option>
                        <option>Card Sorting</option>
                        <option>Other</option>
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                          Participants
                        </label>
                        <input
                          type="number"
                          value={methodology.participants}
                          onChange={(e) => setMethodology({...methodology, participants: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '0.375rem',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                          Date Range
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., Jan 2025"
                          value={methodology.dateRange}
                          onChange={(e) => setMethodology({...methodology, dateRange: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '0.375rem',
                            fontSize: '1rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                          Session Duration
                        </label>
                        <input
                          type="text"
                          placeholder="e.g., 45-60 min"
                          value={methodology.duration}
                          onChange={(e) => setMethodology({...methodology, duration: e.target.value})}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #D1D5DB',
                            borderRadius: '0.375rem',
                            fontSize: '1rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Research Objectives (Optional)
                      </label>
                      <textarea
                        placeholder="Describe the goals of this research..."
                        value={methodology.objectives}
                        onChange={(e) => setMethodology({...methodology, objectives: e.target.value})}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          fontSize: '1rem',
                          fontFamily: 'inherit',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                      <button
                        onClick={() => setShowMethodologyForm(false)}
                        style={{
                          padding: '0.5rem 1.5rem',
                          backgroundColor: 'white',
                          color: '#374151',
                          border: '1px solid #D1D5DB',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => setShowMethodologyForm(false)}
                        style={{
                          padding: '0.5rem 1.5rem',
                          backgroundColor: '#F9524C',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          fontWeight: 600
                        }}
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Executive Summary Section */}
            {results.executive_summary && (
              <div className="card" style={{
                marginBottom: '3rem',
                borderTop: '4px solid #0079C8',
                maxWidth: '1280px',
                margin: '0 auto 3rem auto',
                aspectRatio: '16 / 9',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '1.5rem'
              }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#201E32', marginBottom: '1rem', borderBottom: '2px solid #E5E7EB', paddingBottom: '0.5rem' }}>
                  Executive Summary
                </h1>

                <div style={{ marginBottom: '0.75rem', backgroundColor: '#F0F9FF', padding: '1rem', borderRadius: '0.5rem' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0079C8', marginBottom: '0.5rem' }}>
                    Research Question
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#201E32', lineHeight: 1.4, margin: 0 }}>
                    {results.executive_summary.research_question}
                  </p>
                </div>

                <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '0.5rem', marginBottom: '0.75rem', flex: 1 }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#065F46', marginBottom: '0.5rem' }}>
                    Key Finding & Insight
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#201E32', fontWeight: 600, marginBottom: '0.5rem' }}>
                    {results.executive_summary.key_finding}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#201E32', lineHeight: 1.4, margin: 0 }}>
                    {results.executive_summary.key_insight}
                  </p>
                </div>

                <div style={{ backgroundColor: '#F3F4F6', padding: '1rem', borderRadius: '0.5rem' }}>
                  <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#5F2A82', marginBottom: '0.5rem' }}>
                    Recommendation
                  </h2>
                  <p style={{ fontSize: '0.85rem', color: '#201E32', fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
                    {results.executive_summary.recommendation}
                  </p>
                </div>
              </div>
            )}

            {/* Themes Section */}
            {results.themes && results.themes.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#201E32', marginBottom: '1.5rem' }}>
                  Key Themes
                </h2>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {results.themes.map((theme, index) => (
                    <div key={index} className="card" style={{
                      borderLeft: '4px solid #5F2A82',
                      maxWidth: '1280px',
                      margin: '0 auto',
                      aspectRatio: '16 / 9',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      padding: '1.5rem'
                    }}>
                      <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginBottom: '0.75rem' }}>
                        {theme.theme_name || theme.name || `Theme ${index + 1}`}
                      </h3>
                      <p style={{ color: '#6B7280', marginBottom: '1rem', lineHeight: 1.6 }}>
                        {theme.summary || theme.description}
                      </p>
                      {theme.insights && theme.insights.length > 0 && (
                        <div style={{ marginTop: '1rem' }}>
                          <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem' }}>
                            Supporting Quotes:
                          </p>
                          {theme.insights.slice(0, 3).map((insight, qIndex) => (
                            <div key={qIndex} style={{
                              backgroundColor: '#F9FAFB',
                              padding: '0.75rem',
                              borderLeft: '3px solid #5F2A82',
                              marginBottom: '0.5rem',
                              fontStyle: 'italic',
                              color: '#374151'
                            }}>
                              "{insight.quote}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights Section */}
            {results.key_insights && results.key_insights.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#201E32', marginBottom: '1.5rem' }}>
                  Key Insights
                </h2>
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                  {results.key_insights.map((insight, index) => (
                    <div key={index} className="card" style={{
                      borderLeft: '4px solid #00C9A5',
                      maxWidth: '1280px',
                      margin: '0 auto',
                      aspectRatio: '16 / 9',
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      padding: '1.5rem'
                    }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem' }}>
                        {insight.title}
                      </h3>
                      <p style={{ color: '#6B7280', lineHeight: 1.6, marginBottom: '1rem' }}>
                        {insight.main_finding}
                      </p>
                      {insight.supporting_quotes && insight.supporting_quotes.length > 0 && (
                        <div style={{ marginTop: '0.75rem' }}>
                          {insight.supporting_quotes.map((quoteObj, qIndex) => (
                            <div key={qIndex} style={{
                              backgroundColor: '#F0FDF4',
                              padding: '0.75rem',
                              borderLeft: '3px solid #00C9A5',
                              marginBottom: '0.5rem',
                              fontStyle: 'italic',
                              color: '#374151',
                              fontSize: '0.9rem'
                            }}>
                              "{quoteObj.quote}"
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div style={{ marginBottom: '3rem' }}>
                <h2 style={{ fontSize: '2rem', fontWeight: 600, color: '#201E32', marginBottom: '1.5rem' }}>
                  Recommendations
                </h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {results.recommendations.map((rec, index) => (
                    <div key={index} className="card" style={{ borderLeft: '4px solid #0079C8' }}>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem' }}>
                        {rec.title || `Recommendation ${index + 1}`}
                      </h3>
                      <p style={{ color: '#6B7280', lineHeight: 1.6, margin: 0 }}>
                        {rec.description || rec}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
