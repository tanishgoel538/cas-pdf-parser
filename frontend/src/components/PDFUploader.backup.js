import React, { useState, useRef } from 'react';
import axios from 'axios';
import './PDFUploader.css';
import ProgressBar from './ProgressBar';

const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const PDFUploader = ({ darkMode }) => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [outputFormat, setOutputFormat] = useState('excel');
  const [selectedSheets, setSelectedSheets] = useState({
    portfolio: true,
    transactions: true,
    holdings: true
  });
  const [funMessage, setFunMessage] = useState('');
  const fileInputRef = useRef(null);
  const messageIntervalRef = useRef(null);

  const funMessages = [
    "Hold on a sec... ⏳",
    "Crunching the numbers... 🔢",
    "Reading your portfolio... 📊",
    "Almost there... 🚀",
    "Extracting data magic... ✨",
    "Parsing transactions... 💰",
    "Organizing your funds... 📈",
    "Just a moment... ⌛",
    "Working on it... 🔧",
    "Processing your data... 💼",
    "Analyzing holdings... 📋",
    "Generating your report... 📄",
    "Hang tight... 🎯",
    "Making it perfect... 💎",
    "Nearly done... 🏁"
  ];

  const funFacts = [
    "💡 Did you know? Mutual funds were invented in 1924!",
    "💡 Fun fact: India has over 40 million mutual fund investors!",
    "💡 Tip: Diversification helps reduce investment risk.",
    "💡 Did you know? SIP stands for Systematic Investment Plan.",
    "💡 Fun fact: The first index fund was created in 1975.",
    "💡 Tip: Long-term investing often beats short-term trading.",
    "💡 Did you know? NAV is calculated at the end of each trading day.",
    "💡 Fun fact: Equity funds invest primarily in stocks.",
    "💡 Tip: Review your portfolio at least once a year.",
    "💡 Did you know? SEBI regulates mutual funds in India.",
    "💡 Fun fact: Debt funds are generally less risky than equity funds.",
    "💡 Tip: Start investing early to benefit from compounding.",
    "💡 Did you know? ELSS funds offer tax benefits under Section 80C.",
    "💡 Fun fact: Mutual funds pool money from multiple investors.",
    "💡 Tip: Always read the scheme document before investing."
  ];

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setFile(selectedFile);
    setError('');
    setSummary(null);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    handleFileSelection(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    handleFileSelection(droppedFile);
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const clearFile = () => {
    setFile(null);
    setPassword('');
    setError('');
    setStatus('');
    setProgress(0);
    setSummary(null);
    setOutputFormat('excel');
    setSelectedSheets({
      portfolio: true,
      transactions: true,
      holdings: true
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSheetToggle = (sheetName) => {
    setSelectedSheets(prev => ({
      ...prev,
      [sheetName]: !prev[sheetName]
    }));
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file first.');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Uploading PDF...');
    setProgress(10);

    // Start rotating fun messages
    let messageIndex = 0;
    setFunMessage(funMessages[messageIndex]);
    messageIntervalRef.current = setInterval(() => {
      messageIndex = (messageIndex + 1) % funMessages.length;
      setFunMessage(funMessages[messageIndex]);
    }, 2000); // Change message every 2 seconds

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      if (password) {
        formData.append('password', password);
      }
      formData.append('outputFormat', outputFormat);

      // Add selected sheets for Excel format
      if (outputFormat === 'excel') {
        const sheets = Object.keys(selectedSheets).filter(key => selectedSheets[key]);
        formData.append('sheets', JSON.stringify(sheets));
      }

      const response = await axios.post(`${API}/api/extract-cas`, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          const uploadProgress = Math.round(10 + (percentCompleted * 0.2)); // 10% to 30%
          setProgress(uploadProgress);
          if (percentCompleted < 100) {
            setStatus('Uploading PDF...');
          } else {
            setStatus('Extracting text from PDF...');
          }
        }
      });


      setStatus('Parsing portfolio data...');
      setProgress(60);

      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('Extracting transactions...');
      setProgress(80);

      await new Promise(resolve => setTimeout(resolve, 500));

      const statusText = outputFormat === 'excel' ? 'Generating Excel report...' :
        outputFormat === 'json' ? 'Generating JSON file...' :
          'Generating text file...';
      setStatus(statusText);
      setProgress(95);

      // Determine MIME type and filename based on format
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      // Get base filename from uploaded PDF (without .pdf extension)
      const baseFilename = file.name.replace(/\.pdf$/i, '');
      
      let defaultFilename = `${baseFilename}.xlsx`;
      if (outputFormat === 'json') {
        mimeType = 'application/json';
        defaultFilename = `${baseFilename}.json`;
      } else if (outputFormat === 'text') {
        mimeType = 'text/plain';
        defaultFilename = `${baseFilename}.txt`;
      }

      // Create download link with proper MIME type
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Extract filename from response headers or use default based on uploaded file
      const contentDisposition = response.headers['content-disposition'];
      let filename = defaultFilename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        link.remove();
        window.URL.revokeObjectURL(url);
      }, 100);

      const completeText = outputFormat === 'excel' ? 'Complete! Excel file downloaded.' :
        outputFormat === 'json' ? 'Complete! JSON file downloaded.' :
          'Complete! Text file downloaded.';
      setStatus(completeText);
      setProgress(100);

      // Show success summary
      setSummary({
        success: true,
        message: 'Extraction completed successfully!',
        filename: filename,
        format: outputFormat
      });

      // Clear file after successful extraction
      setTimeout(() => {
        clearFile();
      }, 5000);

    } catch (err) {
      console.error('Upload error:', err);

      let errorMessage = 'Failed to extract CAS data. Please try again.';

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = 'Invalid file or missing data. Please upload a valid CAS PDF.';
        } else if (err.response.status === 500) {
          // Try to extract error message from blob
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If parsing fails, use default message
          }
        }
      } else if (err.request) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running.';
      }

      setError(errorMessage);
      setStatus('');
      setProgress(0);
      setSummary(null);
    } finally {
      setLoading(false);
      // Clear the message interval
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
        messageIntervalRef.current = null;
      }
      setFunMessage('');
    }
  };

  return (
    <div className={`pdf-uploader ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uploader-card">
        <div className="card-header">
          <h2>Upload CAS PDF</h2>
          <p>Extract comprehensive mutual fund data from your Consolidated Account Statement</p>
        </div>

        <div
          className={`upload-area ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <div className="upload-content">
              <div className="upload-icon">📄</div>
              <h3>Drag & Drop PDF Here</h3>
              <p>or</p>
              <button
                className="browse-button"
                onClick={handleButtonClick}
                disabled={loading}
              >
                Browse Files
              </button>
              <p className="file-info">Maximum file size: 10MB</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div className="file-selected">
              <div className="file-icon">📄</div>
              <div className="file-details">
                <h4>{file.name}</h4>
                <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              {!loading && (
                <button className="remove-button" onClick={clearFile}>
                  ✕
                </button>
              )}
            </div>
          )}
        </div>

        {file && (
          <div className="password-section">
            <label htmlFor="pdf-password">
              PDF Password (if protected):
            </label>
            <div className="password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="pdf-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
        )}

        {file && !loading && !summary && (
          <div className="options-section">
            <div className="format-selection">
              <label>Output Format:</label>
              <div className="format-options">
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="excel"
                    checked={outputFormat === 'excel'}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  />
                  <span>📊 Excel</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={outputFormat === 'json'}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  />
                  <span>📦 JSON</span>
                </label>
                <label className="format-option">
                  <input
                    type="radio"
                    name="format"
                    value="text"
                    checked={outputFormat === 'text'}
                    onChange={(e) => setOutputFormat(e.target.value)}
                  />
                  <span>📝 Text</span>
                </label>
              </div>
            </div>

            {outputFormat === 'excel' && (
              <div className="sheet-selection">
                <label>Select Sheets to Generate:</label>
                <div className="sheet-options">
                  <label className="sheet-option">
                    <input
                      type="checkbox"
                      checked={selectedSheets.portfolio}
                      onChange={() => handleSheetToggle('portfolio')}
                    />
                    <span>Portfolio Summary</span>
                  </label>
                  <label className="sheet-option">
                    <input
                      type="checkbox"
                      checked={selectedSheets.transactions}
                      onChange={() => handleSheetToggle('transactions')}
                    />
                    <span>Transactions</span>
                  </label>
                  <label className="sheet-option">
                    <input
                      type="checkbox"
                      checked={selectedSheets.holdings}
                      onChange={() => handleSheetToggle('holdings')}
                    />
                    <span>MF Holdings</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        )}

        {file && !loading && !summary && (
          <button className="upload-button" onClick={handleUpload}>
            🚀 Extract & Generate {outputFormat === 'excel' ? 'Excel' : outputFormat === 'json' ? 'JSON' : 'Text'}
          </button>
        )}

        {loading && (
          <div className="progress-section">
            <ProgressBar progress={progress} />
            <p className="status-text">{status}</p>
            {funMessage && <p className="fun-message">{funMessage}</p>}
            {funMessage && <p className="fun-fact">{funFacts[Math.floor(Math.random() * funFacts.length)]}</p>}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {summary && summary.success && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            <div className="success-content">
              <h4>{summary.message}</h4>
              <p>File: {summary.filename}</p>
              <p className="success-note">Check your downloads folder</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFUploader;
