import { useState } from 'react';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import SavedReportsPage from './pages/SavedReportsPage';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('upload');
  const [sessionId, setSessionId] = useState(null);

  const goToResults = (sid) => {
    setSessionId(sid);
    setCurrentPage('results');
  };

  const goToUpload = () => {
    setCurrentPage('upload');
    // Keep sessionId so user can return to results
  };

  const goToSavedReports = () => {
    setCurrentPage('savedReports');
  };

  const goBackToResults = () => {
    if (sessionId) {
      setCurrentPage('results');
    }
  };

  const loadSavedReport = (sid) => {
    setSessionId(sid);
    setCurrentPage('results');
  };

  return (
    <>
      {currentPage === 'upload' ? (
        <UploadPage
          onProcessingStarted={goToResults}
          hasSession={!!sessionId}
          onViewResults={goBackToResults}
          onViewSavedReports={goToSavedReports}
        />
      ) : currentPage === 'savedReports' ? (
        <SavedReportsPage
          onLoadReport={loadSavedReport}
          onBack={goToUpload}
          hasSession={!!sessionId}
          onViewResults={goBackToResults}
        />
      ) : (
        <ResultsPage
          sessionId={sessionId}
          onBack={goToUpload}
          onViewSavedReports={goToSavedReports}
        />
      )}
    </>
  );
}

export default App;
