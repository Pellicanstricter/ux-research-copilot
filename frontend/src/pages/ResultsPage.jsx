import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { usePageTracking } from '../hooks/usePageTracking';
import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';
import owlIcon from '../assets/IconOwl.png';
import ExportMenu from '../components/ExportMenu';

export default function ResultsPage({ sessionId, onBack, onViewSavedReports, isSampleReport, sampleData }) {
  // Track page view
  usePageTracking('results');
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
  const [showResearchGoalsSlide, setShowResearchGoalsSlide] = useState(true);
  const [researchGoals, setResearchGoals] = useState({
    goals: [''],
    background: [''],
    assumptions: [''],
    purpose: ''
  });
  const [editingSlide, setEditingSlide] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });

  useEffect(() => {
    // If it's a sample report, load the sample data immediately
    if (isSampleReport && sampleData) {
      setResults(sampleData);
      setStatus('completed');
      setPolling(false);

      // Auto-detect methodology values
      const detectedParticipants = sampleData.themes?.length || 0;
      setMethodology(prev => ({
        ...prev,
        participants: detectedParticipants
      }));

      // Auto-generate research goals from data
      const themes = sampleData.themes || [];
      const generatedGoals = themes.slice(0, 3).map(theme =>
        `Understand ${theme.theme_name?.toLowerCase() || 'user needs'}`
      ).filter(g => g);

      const generatedBackground = [
        `Sample research based on ${detectedParticipants} participant${detectedParticipants !== 1 ? 's' : ''}`,
        'Demo report showcasing UX Research Copilot capabilities'
      ];

      const generatedAssumptions = [
        'Users have varying levels of experience',
        'Feedback represents typical user behavior'
      ];

      const generatedPurpose = `Evaluate user experience and identify areas for improvement based on ${detectedParticipants} research session${detectedParticipants !== 1 ? 's' : ''}.`;

      setResearchGoals({
        goals: generatedGoals.length > 0 ? generatedGoals : ['Define research objectives'],
        background: generatedBackground,
        assumptions: generatedAssumptions,
        purpose: generatedPurpose
      });

      return;
    }

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

          // Auto-generate research goals from data
          const themes = resultsData.full_report?.themes || [];
          const insights = resultsData.full_report?.key_insights || [];
          const summary = resultsData.full_report?.executive_summary;

          // Generate goals based on themes
          const generatedGoals = themes.slice(0, 3).map(theme =>
            `Understand ${theme.theme_name?.toLowerCase() || 'user needs'}`
          ).filter(g => g);

          // Generate background from executive summary
          const generatedBackground = summary ? [
            `Research based on ${detectedParticipants} participant${detectedParticipants !== 1 ? 's' : ''}`,
            summary.research_question || ''
          ].filter(b => b) : [];

          // Generate assumptions
          const generatedAssumptions = [
            'Users have varying levels of experience',
            'Feedback represents typical user behavior'
          ];

          // Generate purpose from key finding
          const generatedPurpose = summary?.key_insight ||
            `Evaluate user experience and identify areas for improvement based on ${detectedParticipants} research session${detectedParticipants !== 1 ? 's' : ''}.`;

          setResearchGoals({
            goals: generatedGoals.length > 0 ? generatedGoals : ['Define research objectives'],
            background: generatedBackground.length > 0 ? generatedBackground : [''],
            assumptions: generatedAssumptions,
            purpose: generatedPurpose
          });

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
  }, [sessionId, polling, isSampleReport, sampleData]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8F9FA' }}>
      {/* Demo Banner */}
      {isSampleReport && (
        <div style={{
          backgroundColor: '#FEF3C7',
          borderBottom: '2px solid #F59E0B',
          padding: '0.75rem 2rem',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            fontSize: '0.875rem',
            fontWeight: 600,
            color: '#92400E'
          }}>
            📊 Sample Report Demo - This is example data showcasing the platform's capabilities
          </p>
        </div>
      )}

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
            <img src="/owl jumps.gif" alt="Processing" style={{ width: '200px', height: '200px', marginBottom: '1rem' }} />
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
            {/* Edit Modal */}
            {editingSlide && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1000
              }}>
                <div style={{
                  backgroundColor: 'white',
                  borderRadius: '0.5rem',
                  padding: '2rem',
                  maxWidth: '600px',
                  width: '90%',
                  maxHeight: '80vh',
                  overflow: 'auto'
                }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#201E32', marginBottom: '1.5rem' }}>
                    Edit {editingSlide.type === 'theme' ? 'Theme' : editingSlide.type === 'insight' ? 'Insight' : 'Recommendation'}
                  </h2>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.375rem',
                        fontSize: '1rem'
                      }}
                    />
                  </div>

                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                      Description
                    </label>
                    <textarea
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #D1D5DB',
                        borderRadius: '0.375rem',
                        fontSize: '1rem',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => setEditingSlide(null)}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#F3F4F6',
                        color: '#374151',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: 600
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        const newResults = { ...results };

                        if (editingSlide.type === 'theme') {
                          newResults.themes[editingSlide.index] = {
                            ...newResults.themes[editingSlide.index],
                            theme_name: editForm.title,
                            name: editForm.title,
                            summary: editForm.description,
                            description: editForm.description
                          };
                        } else if (editingSlide.type === 'insight') {
                          newResults.key_insights[editingSlide.index] = {
                            ...newResults.key_insights[editingSlide.index],
                            title: editForm.title,
                            main_finding: editForm.description
                          };
                        } else if (editingSlide.type === 'recommendation') {
                          newResults.recommendations[editingSlide.index] = {
                            ...newResults.recommendations[editingSlide.index],
                            title: editForm.title,
                            description: editForm.description
                          };
                        }

                        setResults(newResults);
                        setEditingSlide(null);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#0079C8',
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
                        padding: '0.5rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '0.375rem',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    >
                      <img src="/Edit.png" alt="Edit" style={{ width: '20px', height: '20px' }} />
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

            {/* Research Goals Slide */}
            {showResearchGoalsSlide ? (
              <div style={{ marginBottom: '3rem' }}>
                {!showResearchGoalsForm ? (
                  <div className="card" style={{
                    maxWidth: '1280px',
                    margin: '0 auto 3rem auto',
                    aspectRatio: '16 / 9',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    padding: '1.5rem',
                    borderTop: '4px solid #0079C8'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#201E32', margin: 0 }}>
                        Research Goals & Background
                      </h1>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => setShowResearchGoalsForm(true)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.375rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#F3F4F6'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <img src="/Edit.png" alt="Edit" style={{ width: '20px', height: '20px' }} />
                        </button>
                        <button
                          onClick={() => setShowResearchGoalsSlide(false)}
                          style={{
                            padding: '0.5rem',
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '0.375rem',
                            transition: 'background-color 0.2s'
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#FEE2E2'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                        >
                          <img src="/image 1.png" alt="Delete" style={{ width: '20px', height: '20px' }} />
                        </button>
                      </div>
                    </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div style={{ backgroundColor: '#E0F2FE', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#0369A1', marginBottom: '0.75rem' }}>
                        Research Goals
                      </h2>
                      {researchGoals.goals.filter(g => g.trim()).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {researchGoals.goals.filter(g => g.trim()).map((goal, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{goal}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0 }}>No goals specified</p>
                      )}
                    </div>

                    <div style={{ backgroundColor: '#F0FDF4', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#065F46', marginBottom: '0.75rem' }}>
                        Background
                      </h2>
                      {researchGoals.background.filter(b => b.trim()).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {researchGoals.background.filter(b => b.trim()).map((item, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, fontStyle: 'italic' }}>Optional</p>
                      )}
                    </div>

                    <div style={{ backgroundColor: '#F3E8FF', padding: '1rem', borderRadius: '0.5rem' }}>
                      <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#6B21A8', marginBottom: '0.75rem' }}>
                        Assumptions
                      </h2>
                      {researchGoals.assumptions.filter(a => a.trim()).length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6 }}>
                          {researchGoals.assumptions.filter(a => a.trim()).map((assumption, idx) => (
                            <li key={idx} style={{ marginBottom: '0.25rem' }}>{assumption}</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: 0, fontStyle: 'italic' }}>Optional</p>
                      )}
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#FEF3C7', padding: '1rem', borderRadius: '0.5rem', flex: 1 }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#92400E', marginBottom: '0.5rem' }}>
                      Purpose of Testing:
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: '#201E32', margin: 0, lineHeight: 1.6 }}>
                      {researchGoals.purpose || 'No purpose specified'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="card" style={{
                  maxWidth: '1280px',
                  margin: '0 auto 3rem auto',
                  padding: '2rem',
                  borderTop: '4px solid #0079C8'
                }}>
                  <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#201E32', marginBottom: '1.5rem' }}>
                    Edit Research Goals & Background
                  </h1>

                  <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Research Goals
                      </label>
                      {researchGoals.goals.map((goal, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Enter a research goal..."
                            value={goal}
                            onChange={(e) => {
                              const newGoals = [...researchGoals.goals];
                              newGoals[idx] = e.target.value;
                              setResearchGoals({...researchGoals, goals: newGoals});
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '0.375rem',
                              fontSize: '1rem'
                            }}
                          />
                          {idx === researchGoals.goals.length - 1 && (
                            <button
                              onClick={() => setResearchGoals({...researchGoals, goals: [...researchGoals.goals, '']})}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#0079C8',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              + Add
                            </button>
                          )}
                          {researchGoals.goals.length > 1 && (
                            <button
                              onClick={() => {
                                const newGoals = researchGoals.goals.filter((_, i) => i !== idx);
                                setResearchGoals({...researchGoals, goals: newGoals});
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Background (Optional)
                      </label>
                      {researchGoals.background.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Enter background information..."
                            value={item}
                            onChange={(e) => {
                              const newBackground = [...researchGoals.background];
                              newBackground[idx] = e.target.value;
                              setResearchGoals({...researchGoals, background: newBackground});
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '0.375rem',
                              fontSize: '1rem'
                            }}
                          />
                          {idx === researchGoals.background.length - 1 && (
                            <button
                              onClick={() => setResearchGoals({...researchGoals, background: [...researchGoals.background, '']})}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              + Add
                            </button>
                          )}
                          {researchGoals.background.length > 1 && (
                            <button
                              onClick={() => {
                                const newBackground = researchGoals.background.filter((_, i) => i !== idx);
                                setResearchGoals({...researchGoals, background: newBackground});
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Assumptions (Optional)
                      </label>
                      {researchGoals.assumptions.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input
                            type="text"
                            placeholder="Enter an assumption..."
                            value={item}
                            onChange={(e) => {
                              const newAssumptions = [...researchGoals.assumptions];
                              newAssumptions[idx] = e.target.value;
                              setResearchGoals({...researchGoals, assumptions: newAssumptions});
                            }}
                            style={{
                              flex: 1,
                              padding: '0.5rem',
                              border: '1px solid #D1D5DB',
                              borderRadius: '0.375rem',
                              fontSize: '1rem'
                            }}
                          />
                          {idx === researchGoals.assumptions.length - 1 && (
                            <button
                              onClick={() => setResearchGoals({...researchGoals, assumptions: [...researchGoals.assumptions, '']})}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#8B5CF6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              + Add
                            </button>
                          )}
                          {researchGoals.assumptions.length > 1 && (
                            <button
                              onClick={() => {
                                const newAssumptions = researchGoals.assumptions.filter((_, i) => i !== idx);
                                setResearchGoals({...researchGoals, assumptions: newAssumptions});
                              }}
                              style={{
                                padding: '0.5rem 1rem',
                                backgroundColor: '#EF4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.875rem',
                                fontWeight: 600
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.5rem' }}>
                        Purpose of Testing
                      </label>
                      <textarea
                        placeholder="Describe the purpose of this testing..."
                        value={researchGoals.purpose}
                        onChange={(e) => setResearchGoals({...researchGoals, purpose: e.target.value})}
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
                        onClick={() => setShowResearchGoalsForm(false)}
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
                        onClick={() => setShowResearchGoalsForm(false)}
                        style={{
                          padding: '0.5rem 1.5rem',
                          backgroundColor: '#0079C8',
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
            ) : (
              <div style={{ maxWidth: '1280px', margin: '0 auto 3rem auto', textAlign: 'center' }}>
                <button
                  onClick={() => setShowResearchGoalsSlide(true)}
                  style={{
                    padding: '1rem 2rem',
                    backgroundColor: '#0079C8',
                    color: 'white',
                    border: '2px dashed #0079C8',
                    borderRadius: '0.5rem',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: 600
                  }}
                >
                  + Add Research Goals & Background Slide
                </button>
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: '#5F2A82',
                              backgroundColor: '#F3E8FF',
                              padding: '0.25rem 0.75rem',
                              borderRadius: '0.375rem'
                            }}>
                              Theme {index + 1}
                            </span>
                          </div>
                          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#201E32', margin: 0 }}>
                            {theme.theme_name || theme.name || `Theme ${index + 1}`}
                          </h3>
                        </div>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          <button
                            onClick={() => {
                              setEditingSlide({ type: 'theme', index });
                              setEditForm({
                                title: theme.theme_name || theme.name || `Theme ${index + 1}`,
                                description: theme.summary || theme.description
                              });
                            }}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '0.375rem',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <img src="/Edit.png" alt="Edit" style={{ width: '16px', height: '16px' }} />
                          </button>
                          <button
                            onClick={() => {
                              const newResults = { ...results };
                              newResults.themes = newResults.themes.filter((_, i) => i !== index);
                              setResults(newResults);
                            }}
                            style={{
                              padding: '0.375rem',
                              backgroundColor: 'transparent',
                              border: 'none',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              borderRadius: '0.375rem',
                              transition: 'background-color 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <img src="/image 1.png" alt="Delete" style={{ width: '16px', height: '16px' }} />
                          </button>
                        </div>
                      </div>
                      <p style={{ color: '#6B7280', marginBottom: '1rem', lineHeight: 1.5, fontSize: '0.875rem' }}>
                        {theme.summary || theme.description}
                      </p>
                      {theme.insights && theme.insights.length > 0 && (
                        <div style={{ marginTop: 'auto' }}>
                          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Supporting Quotes
                          </p>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            {theme.insights.slice(0, 4).map((insight, qIndex) => (
                              <div key={qIndex} style={{
                                backgroundColor: '#F9FAFB',
                                padding: '0.75rem',
                                borderLeft: '3px solid #5F2A82',
                                fontStyle: 'italic',
                                color: '#374151',
                                fontSize: '0.875rem',
                                lineHeight: 1.5
                              }}>
                                "{insight.quote}"
                              </div>
                            ))}
                          </div>
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
                  {results.key_insights.map((insight, index) => {
                    // Determine if this is a critical/high priority insight
                    const isCritical = insight.priority === 'High' || insight.title?.toLowerCase().includes('critical');

                    return (
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                              <span style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                color: '#00C9A5',
                                backgroundColor: '#ECFDF5',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '0.375rem'
                              }}>
                                Insight {index + 1}
                              </span>
                            </div>
                            <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#201E32', margin: 0 }}>
                              {insight.title}
                            </h3>
                          </div>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => {
                                setEditingSlide({ type: 'insight', index });
                                setEditForm({
                                  title: insight.title,
                                  description: insight.main_finding
                                });
                              }}
                              style={{
                                padding: '0.375rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.375rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <img src="/Edit.png" alt="Edit" style={{ width: '16px', height: '16px' }} />
                            </button>
                            <button
                              onClick={() => {
                                const newResults = { ...results };
                                newResults.key_insights = newResults.key_insights.filter((_, i) => i !== index);
                                setResults(newResults);
                              }}
                              style={{
                                padding: '0.375rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.375rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <img src="/image 1.png" alt="Delete" style={{ width: '16px', height: '16px' }} />
                            </button>
                          </div>
                        </div>
                        <p style={{ color: '#6B7280', lineHeight: 1.5, marginBottom: '0.75rem', fontSize: '0.875rem' }}>
                          {insight.main_finding}
                        </p>
                        {insight.supporting_quotes && insight.supporting_quotes.length > 0 && (
                          <div>
                            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Supporting Evidence
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: insight.supporting_quotes.length === 1 ? '1fr' : '1fr 1fr', gap: '0.5rem' }}>
                              {insight.supporting_quotes.slice(0, 4).map((quoteObj, qIndex) => (
                                <div key={qIndex} style={{
                                  backgroundColor: '#F0FDF4',
                                  padding: '0.5rem',
                                  borderLeft: '3px solid #00C9A5',
                                  fontStyle: 'italic',
                                  color: '#374151',
                                  fontSize: '0.75rem',
                                  lineHeight: 1.4
                                }}>
                                  "{quoteObj.quote}"
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Recommendations Section */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div className="card" style={{
                marginBottom: '3rem',
                maxWidth: '1280px',
                margin: '0 auto 3rem auto',
                aspectRatio: '16 / 9',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                padding: '0',
                borderTop: '4px solid #0079C8'
              }}>
                <div style={{
                  backgroundColor: '#0079C8',
                  padding: '1rem 1.5rem',
                  borderBottom: '2px solid #005A9C'
                }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white', margin: 0 }}>
                    Primary Recommendations
                  </h2>
                </div>

                <div style={{ padding: '1.5rem', flex: 1, overflow: 'auto' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    {results.recommendations.map((rec, index) => {
                      const colors = [
                        { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
                        { bg: '#F3E8FF', border: '#8B5CF6', text: '#6B21A8' },
                        { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' },
                        { bg: '#E0F2FE', border: '#0079C8', text: '#0C4A6E' }
                      ];
                      const color = colors[index % colors.length];

                      return (
                        <div key={index} style={{
                          backgroundColor: color.bg,
                          padding: '1rem',
                          borderRadius: '0.5rem',
                          borderLeft: `4px solid ${color.border}`,
                          position: 'relative'
                        }}>
                          <div style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', display: 'flex', gap: '0.25rem' }}>
                            <button
                              onClick={() => {
                                setEditingSlide({ type: 'recommendation', index });
                                setEditForm({
                                  title: rec.title || `Recommendation ${index + 1}`,
                                  description: rec.description
                                });
                              }}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F3F4F6'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <img src="/Edit.png" alt="Edit" style={{ width: '14px', height: '14px' }} />
                            </button>
                            <button
                              onClick={() => {
                                const newResults = { ...results };
                                newResults.recommendations = newResults.recommendations.filter((_, i) => i !== index);
                                setResults(newResults);
                              }}
                              style={{
                                padding: '0.25rem',
                                backgroundColor: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '0.25rem',
                                transition: 'background-color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEE2E2'}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                              <img src="/image 1.png" alt="Delete" style={{ width: '14px', height: '14px' }} />
                            </button>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span style={{
                              fontSize: '0.875rem',
                              fontWeight: 700,
                              color: 'white',
                              backgroundColor: color.border,
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              minWidth: '1.5rem',
                              textAlign: 'center'
                            }}>
                              {index + 1}
                            </span>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: color.text, margin: 0, paddingRight: '2rem' }}>
                              {rec.title || `Recommendation ${index + 1}`}
                            </h3>
                          </div>
                          {rec.description && (
                            <p style={{ color: '#374151', lineHeight: 1.5, margin: 0, fontSize: '0.8rem' }}>
                              {rec.description}
                            </p>
                          )}
                          {rec.details && Array.isArray(rec.details) && (
                            <ul style={{ margin: '0.5rem 0 0 0', paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#4B5563' }}>
                              {rec.details.map((detail, dIndex) => (
                                <li key={dIndex} style={{ marginBottom: '0.25rem' }}>{detail}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </main>
    </div>
  );
}
