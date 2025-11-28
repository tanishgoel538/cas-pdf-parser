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
            <h1><span className="title-icon">📊</span> ITR Complete</h1>
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
        <div className="main-container">
           <div className="uploader-panel">
            <PDFUploader darkMode={darkMode} />
          </div>
          <div className="features-panel">
            <h2>What You'll Get</h2>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <div>
                <strong>Portfolio Summary</strong>
                <p>Overview by fund house with cost and market values</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">💰</span>
              <div>
                <strong>Detailed Transactions</strong>
                <p>Complete history with NAV, units, and balances</p>
              </div>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📈</span>
              <div>
                <strong>MF Holdings</strong>
                <p>Current holdings with folio details, PAN, ISIN</p>
              </div>
            </div>
          </div>
         
        </div>
      </main>
      
      <footer className="App-footer">
        <p>© 2025 ITR Complete • Professional CAS Data Extraction • Secure & Accurate</p>
      </footer>
    </div>
  );
}

export default App;
