import React, { useState } from 'react';
import './App.css';
import PDFUploader from './components/PDFUploader';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  React.useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <header className="App-header">
        <div className="header-content">
          <div className="title-section">
            <h1>📊 ITR Complete</h1>
            <p>CAS Data Extractor & Analyzer</p>
          </div>
          <button
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      </header>
      
      <main className="App-main">
        <PDFUploader darkMode={darkMode} />
      </main>
      
      <footer className="App-footer">
        <p>Extract comprehensive mutual fund data from your CAS PDFs</p>
        <p className="version">Version 1.0.0 | Powered by ITR2 Extraction Engine</p>
      </footer>
    </div>
  );
}

export default App;
