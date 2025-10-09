import { useState } from 'react';
import { SignInButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import { api } from '../services/api';
import { usePageTracking } from '../hooks/usePageTracking';
import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';
import owlIcon from '../assets/IconOwl.png';
import eyesIcon from '../assets/icon eyes.png';
import uploadIcon from '../assets/UploadCloud.png';
import analyzeIcon from '../assets/Analyize.png';
import presentIcon from '../assets/Present.png';
import folderIcon from '../assets/Folder.png';

export default function UploadPage({ onProcessingStarted, hasSession, onViewResults, onViewSavedReports, onViewSampleReport, onViewAdmin }) {
  const [files, setFiles] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useUser();

  const isAdmin = user?.primaryEmailAddress?.emailAddress === 'steinrueckn@gmail.com';

  // Track page view
  usePageTracking('upload');

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
    setError(null);
    setSessionId(null); // Reset session when new files are selected
  };

  const handleStartProcessing = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setError(null);

    try {
      const response = await api.processFiles(files);
      setSessionId(response.session_id);
      // Navigate to results page
      onProcessingStarted(response.session_id);
    } catch (err) {
      setError(err.message || 'Failed to process files. Please try again.');
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F0F9FF 0%, #FFF9F5 100%)' }}>
      {/* Header */}
      <header style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E5E7EB',
        padding: '2rem 0 1.5rem 0'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {isAdmin && (
                <button
                  onClick={onViewAdmin}
                  style={{
                    padding: '0.5rem 1rem',
                    backgroundColor: 'transparent',
                    color: '#6B7280',
                    border: '1px solid #D1D5DB',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#F3F4F6';
                    e.target.style.borderColor = '#C65D5D';
                    e.target.style.color = '#C65D5D';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                    e.target.style.borderColor = '#D1D5DB';
                    e.target.style.color = '#6B7280';
                  }}
                >
                  Admin
                </button>
              )}
              <SignedOut>
                <SignInButton mode="modal">
                  <button style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#C65D5D',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.5rem',
                    fontSize: '1rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#B54D4D'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#C65D5D'}>
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '0.5rem 2rem 3rem 2rem' }}>
        {/* Hero Section */}
        <div style={{
          textAlign: 'left',
          marginBottom: '1rem',
          padding: '2rem 2rem',
          transition: 'all 0.3s ease'
        }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '1rem',
            lineHeight: 1.2,
            color: '#C65D5D',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap'
          }}>
            User Interviews to Presentation in <span style={{ color: '#C65D5D', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>One Click<img src={eyesIcon} alt="Eyes" style={{ width: '3.5rem', height: '3.5rem', verticalAlign: 'middle' }} /></span>
          </h2>
          <p style={{ fontSize: '1.125rem', color: '#6B7280', maxWidth: '900px', lineHeight: 1.6 }}>
            Create compelling presentations with your data. Upload your interview transcripts and we'll generate research insights and recommendations in under 5 minutes—ready to present. <button
              onClick={onViewSampleReport}
              style={{
                background: 'none',
                border: 'none',
                color: '#C65D5D',
                fontWeight: 700,
                fontSize: '1.125rem',
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0,
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => e.target.style.color = '#B54D4D'}
              onMouseLeave={(e) => e.target.style.color = '#C65D5D'}
            >
              View sample report
            </button>
          </p>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #E5E7EB', marginBottom: '2rem' }}>
          <button
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: '3px solid #0079C8',
              color: '#0079C8',
              fontWeight: 600,
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
              color: hasSession ? '#0079C8' : '#9CA3AF',
              fontWeight: hasSession ? 600 : 500,
              cursor: hasSession ? 'pointer' : 'not-allowed',
              fontSize: '1rem',
              opacity: hasSession ? 1 : 0.5
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
        </div>

        {/* Cards Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '3rem' }}>
          {/* Upload Files Card */}
          <div className="card" style={{
            minHeight: '320px',
            borderTop: '4px solid #C65D5D',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#FFF5EE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={folderIcon} alt="Upload" style={{ width: '28px', height: '28px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#201E32', margin: 0 }}>
                Upload Research Files
              </h3>
            </div>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Upload your user interview transcripts and research data to create presentation-ready insights. We support PDF, TXT, DOCX, and CSV files.
            </p>

            <div
              style={{
                border: '2px dashed #D1D5DB',
                borderRadius: '0.5rem',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                marginBottom: '1rem',
                backgroundColor: files.length > 0 ? '#F0F9FF' : '#FAFAFA',
                transition: 'all 0.3s ease'
              }}
            >
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.docx,.csv"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                id="file-upload"
                disabled={isProcessing}
              />
              <label
                htmlFor="file-upload"
                style={{
                  cursor: isProcessing ? 'wait' : 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
              >
                <img src={folderIcon} alt="Upload folder" style={{ width: '56px', height: '56px', marginBottom: '0.5rem' }} />
                <p style={{ fontSize: '1rem', color: '#201E32', fontWeight: 500, marginBottom: '0.5rem' }}>
                  {files.length > 0 ? `${files.length} files selected` : 'Click to browse or drag files here'}
                </p>
                <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                  PDF, TXT, DOCX, CSV up to 10MB each
                </p>
              </label>
            </div>

            {files.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: '#201E32', marginBottom: '0.5rem' }}>
                  Selected files:
                </p>
                <ul style={{ fontSize: '0.875rem', color: '#6B7280', paddingLeft: '1.25rem', margin: 0 }}>
                  {files.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Start Processing Card */}
          <div className="card" style={{
            minHeight: '320px',
            position: 'relative',
            borderTop: '4px solid #60A5FA',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'none';
            e.currentTarget.style.transform = 'translateY(0)';
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#F0F9FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={analyzeIcon} alt="Processing" style={{ width: '28px', height: '28px' }} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#201E32', margin: 0 }}>
                Start Processing
              </h3>
            </div>
            <p style={{ color: '#6B7280', marginBottom: '1.5rem' }}>
              Once your files are uploaded, click below to start the AI analysis. This typically takes 2-5 minutes depending on file size.
            </p>

            {files.length > 0 ? (
              <div
                style={{
                  border: '2px dashed #0079C8',
                  borderRadius: '0.5rem',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#F0F9FF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  transition: 'all 0.3s ease'
                }}
              >
                <img src={owlIcon} alt="Owl" style={{ width: '64px', height: '64px', marginBottom: '1rem', display: 'block', margin: '0 auto 1rem auto' }} />
                <button
                  onClick={handleStartProcessing}
                  disabled={isProcessing}
                  className="btn-primary"
                  style={{
                    fontSize: '1.125rem',
                    padding: '1rem 2rem',
                    opacity: isProcessing ? 0.5 : 1,
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Start Processing'}
                </button>
                <p style={{ fontSize: '0.875rem', color: '#6B7280', marginTop: '1rem' }}>
                  {files.length} {files.length === 1 ? 'file' : 'files'} ready for analysis
                </p>
              </div>
            ) : (
              <div
                style={{
                  border: '2px dashed #D1D5DB',
                  borderRadius: '0.5rem',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: '#FAFAFA',
                  transition: 'all 0.3s ease'
                }}
              >
                <p style={{ color: '#9CA3AF', fontSize: '1rem' }}>
                  Upload files first to start processing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '2rem',
            }}
          >
            <p style={{ color: '#991B1B', margin: 0 }}>{error}</p>
          </div>
        )}

        {/* How It Works Section */}
        <div style={{ marginTop: '3rem', padding: '2rem 0', borderTop: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: '1.875rem', fontWeight: 600, color: '#201E32', textAlign: 'center', marginBottom: '2.5rem' }}>
            How It Works
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3rem' }}>
            {[
              { icon: uploadIcon, title: 'Upload', desc: 'Drop your interview transcripts and research files' },
              { icon: analyzeIcon, title: 'Analyze', desc: 'AI extracts themes, quotes, and patterns automatically' },
              { icon: presentIcon, title: 'Present', desc: 'Get presentation-ready insights in minutes' },
            ].map((step, index) => (
              <div key={index} style={{
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}>
                <img src={step.icon} alt={step.title} style={{ width: '64px', height: '64px', marginBottom: '1rem', objectFit: 'contain', transition: 'all 0.3s ease' }} />
                <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#201E32', marginBottom: '0.5rem' }}>
                  {step.title}
                </h4>
                <p style={{ fontSize: '0.875rem', color: '#6B7280' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
