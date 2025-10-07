import { useState } from 'react';
import UploadPage from './pages/UploadPage';
import ResultsPage from './pages/ResultsPage';
import SavedReportsPage from './pages/SavedReportsPage';
import { sampleReport } from './data/sampleReport';
import './index.css';

function App() {
  const [currentPage, setCurrentPage] = useState('upload');
  const [sessionId, setSessionId] = useState(null);
  const [isSampleReport, setIsSampleReport] = useState(false);

  const goToResults = (sid) => {
    setSessionId(sid);
    setIsSampleReport(false);
    setCurrentPage('results');
  };

  const goToUpload = () => {
    setCurrentPage('upload');
    setIsSampleReport(false);
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
    setIsSampleReport(false);
    setCurrentPage('results');
  };

  const goToSampleReport = () => {
    setSessionId('sample');
    setIsSampleReport(true);
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
          onViewSampleReport={goToSampleReport}
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
          isSampleReport={isSampleReport}
          sampleData={isSampleReport ? sampleReport : null}
        />
      )}
    </>
  );
}

export default App;
