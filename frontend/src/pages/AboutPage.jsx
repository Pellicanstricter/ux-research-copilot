import logo from '../assets/logos/ux_research_copilot_logo_transparent.png';

export default function AboutPage({ onBack }) {
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
            About UX Research Copilot
          </h1>

          <div style={{ fontSize: '1rem', color: '#374151', lineHeight: 1.8 }}>
            <p style={{ marginBottom: '1.5rem' }}>
              UX Research Copilot is an AI-powered tool designed to help UX researchers transform raw interview transcripts
              and research data into compelling, presentation-ready insights.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Our Mission
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              We believe that great research insights shouldn't be buried in lengthy transcripts. Our mission is to help
              researchers spend less time on data processing and more time on strategic thinking and stakeholder engagement.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              How It Works
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              Using advanced natural language processing and AI, we analyze your research files to identify key themes,
              extract meaningful quotes, and generate actionable recommendations. The result? A professional presentation
              ready to share with your team in minutes, not hours.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Who We Serve
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              UX Research Copilot is built for UX researchers, product managers, designers, and anyone who conducts
              qualitative research and needs to communicate findings effectively.
            </p>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#201E32', marginTop: '2rem', marginBottom: '1rem' }}>
              Get in Touch
            </h2>
            <p style={{ marginBottom: '0' }}>
              Have questions or feedback? We'd love to hear from you at{' '}
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
