import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';

export default function PrivacyPage({ onBack }) {
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
            Privacy Policy
          </h1>

          <div style={{ fontSize: '1rem', color: '#374151', lineHeight: 1.8 }}>
            <p style={{ marginBottom: '1.5rem', fontSize: '0.875rem', color: '#6B7280' }}>
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Information We Collect
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              When you use UX Research Copilot, we collect:
            </p>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              <li>Research files you upload (transcripts, documents, etc.)</li>
              <li>Account information (name, email address) when you sign in</li>
              <li>Usage analytics (page views, feature usage) to improve our service</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              How We Use Your Information
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We use your information to:
            </p>
            <ul style={{ marginBottom: '1.5rem', paddingLeft: '1.5rem' }}>
              <li>Process your research files and generate insights</li>
              <li>Provide and improve our service</li>
              <li>Communicate with you about your account</li>
              <li>Understand how users interact with our platform</li>
            </ul>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Data Security
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We take data security seriously. Your uploaded files are encrypted in transit and at rest. We use industry-standard
              security practices to protect your data from unauthorized access.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Data Sharing
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We do not sell, trade, or share your research files or personal information with third parties. Your data belongs
              to you and remains confidential.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Data Retention
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We retain your uploaded files and generated reports for as long as your account is active. You can delete your
              data at any time by contacting us.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Your Rights
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              You have the right to access, correct, or delete your personal information. Contact us at{' '}
              <a href="mailto:steinrueckn@gmail.com" style={{ color: '#C65D5D', textDecoration: 'none', fontWeight: 600 }}>
                steinrueckn@gmail.com
              </a>{' '}
              to exercise these rights.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Contact Us
            </h2>
            <p style={{ marginBottom: '0' }}>
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:steinrueckn@gmail.com" style={{ color: '#C65D5D', textDecoration: 'none', fontWeight: 600 }}>
                steinrueckn@gmail.com
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
