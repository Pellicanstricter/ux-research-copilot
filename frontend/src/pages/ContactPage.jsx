import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';

export default function ContactPage({ onBack }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { user } = useUser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          feedback: message,
          email: user?.primaryEmailAddress?.emailAddress || 'anonymous',
          name: user?.fullName || 'Anonymous User',
        }),
      });

      if (response.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          setMessage('');
        }, 3000);
      }
    } catch (error) {
      console.error('Failed to submit message:', error);
      alert('Failed to submit message. Please try again.');
    } finally {
      setIsSubmitting(false);
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
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div className="card">
          <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#201E32', marginBottom: '1.5rem' }}>
            Contact Us
          </h1>

          <div style={{ fontSize: '1rem', color: '#374151', lineHeight: 1.8 }}>
            <p style={{ marginBottom: '2rem' }}>
              Have questions, feedback, or need support? We'd love to hear from you!
            </p>

            {submitted ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 2rem',
                backgroundColor: '#F0F9FF',
                borderRadius: '12px',
                marginBottom: '2rem'
              }}>
                <h3 style={{ color: '#201E32', marginBottom: '0.5rem' }}>Thank you!</h3>
                <p style={{ color: '#6B7280' }}>We've received your message and will get back to you soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    color: '#201E32',
                    fontWeight: 600,
                    fontSize: '1rem'
                  }}>
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    rows={8}
                    placeholder="Tell us what's on your mind..."
                    style={{
                      width: '100%',
                      padding: '0.875rem',
                      borderRadius: '8px',
                      border: '1px solid #D1D5DB',
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                  />
                </div>

                <div style={{
                  marginBottom: '1.5rem',
                  padding: '1rem',
                  backgroundColor: '#F0F9FF',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  color: '#6B7280'
                }}>
                  {user ? (
                    <p style={{ margin: 0 }}>
                      Sending as <strong>{user.fullName || user.primaryEmailAddress?.emailAddress}</strong>
                    </p>
                  ) : (
                    <p style={{ margin: 0 }}>Sending anonymously. Sign in to get updates on your message.</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.125rem',
                    opacity: isSubmitting ? 0.6 : 1,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}

            <div style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid #E5E7EB'
            }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginBottom: '1rem' }}>
                Other Ways to Reach Us
              </h2>
              <p style={{ marginBottom: '0.5rem' }}>
                <strong>Email:</strong>{' '}
                <a href="mailto:steinrueckn@gmail.com" style={{ color: '#C65D5D', textDecoration: 'none', fontWeight: 600 }}>
                  steinrueckn@gmail.com
                </a>
              </p>
              <p style={{ marginBottom: '0' }}>
                We typically respond within 24-48 hours.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
