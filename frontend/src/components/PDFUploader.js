import React, { useState, useRef } from 'react';
import axios from 'axios';
import './PDFUploader.css';
import ProgressBar from './ProgressBar';

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
  const fileInputRef = useRef(null);

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

      setStatus('Extracting text from PDF...');
      setProgress(30);

      const response = await axios.post('/api/extract-cas', formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.min(percentCompleted, 25));
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

      // Determine MIME type based on format
      let mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      let defaultFilename = 'CAS_Report.xlsx';
      
      if (outputFormat === 'json') {
        mimeType = 'application/json';
        defaultFilename = 'CAS_Data.json';
      } else if (outputFormat === 'text') {
        mimeType = 'text/plain';
        defaultFilename = 'CAS_Extracted.txt';
      }

      // Create download link with proper MIME type
      const blob = new Blob([response.data], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Extract filename from response headers or use default
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

        <div className="features-section">
          <h3>What You'll Get:</h3>
          <ul className="features-list">
            <li>
              <span className="feature-icon">📊</span>
              <div>
                <strong>Portfolio Summary</strong>
                <p>Overview by fund house with cost and market values</p>
              </div>
            </li>
            <li>
              <span className="feature-icon">💰</span>
              <div>
                <strong>Detailed Transactions</strong>
                <p>Complete history with NAV, units, and balances (4 decimal precision)</p>
              </div>
            </li>
            <li>
              <span className="feature-icon">📈</span>
              <div>
                <strong>MF Holdings</strong>
                <p>Current holdings with folio details, PAN, ISIN, and advisor info</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PDFUploader;
