import React, { useState } from 'react';
import './PDFUploader.css';
import FileUploadArea from './FileUploadArea';
import PasswordInput from './PasswordInput';
import OutputOptions from './OutputOptions';
import LoadingProgress from './LoadingProgress';
import { ErrorMessage, SuccessMessage } from './StatusMessages';
import { useFileUpload } from '../hooks/useFileUpload';
import { useUploadProgress } from '../hooks/useUploadProgress';
import { useUploadHistory } from '../hooks/useUploadHistory';
import { extractCASData, downloadFile, extractFilenameFromHeaders, getOutputFilename } from '../api/casApi';
import UploadHistory from './UploadHistory';
import {
  OUTPUT_FORMATS,
  MIME_TYPES,
  FILE_EXTENSIONS,
  PROGRESS_STEPS,
  AUTO_CLEAR_DELAY
} from '../constants/config';
import {
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  STATUS_MESSAGES,
  STATUS_STATES
} from '../constants/messages';

const PDFUploader = ({ darkMode }) => {
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'
  const [multipleFiles, setMultipleFiles] = useState([]);
  const [filePasswords, setFilePasswords] = useState({});

  const { history, addHistoryItem, clearHistory, removeHistoryItem } = useUploadHistory();

  const {
    file,
    password,
    showPassword,
    isDragOver,
    outputFormat,
    selectedSheets,
    fileInputRef,
    setPassword,
    setShowPassword,
    setOutputFormat,
    handleFileSelection,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    clearFile,
    handleSheetToggle
  } = useFileUpload();

  const {
    loading,
    progress,
    status,
    statusState,
    funMessage,
    funFact,
    setProgress,
    setStatus,
    setStatusState,
    startProgress,
    stopProgress,
    resetProgress
  } = useUploadProgress();

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files[0];
    const result = handleFileSelection(selectedFile);
    if (!result.success) {
      setError(result.error);
    } else {
      setError('');
      setSummary(null);
    }
  };

  const handleFileDrop = (e) => {
    const result = handleDrop(e);
    if (!result.success) {
      setError(result.error);
    } else {
      setError('');
      setSummary(null);
    }
  };

  const handleClearFile = () => {
    clearFile();
    setError('');
    setSummary(null);
    resetProgress();
  };

  const handleUpload = async () => {
    if (!file) {
      setError(ERROR_MESSAGES.NO_FILE_SELECTED);
      return;
    }

    setError('');
    setStatus(STATUS_MESSAGES.UPLOADING);
    setStatusState(STATUS_STATES.IN_PROGRESS);
    setProgress(PROGRESS_STEPS.START);
    startProgress();

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      if (password) {
        formData.append('password', password);
      }
      formData.append('outputFormat', outputFormat);

      if (outputFormat === OUTPUT_FORMATS.EXCEL) {
        const sheets = Object.keys(selectedSheets).filter(key => selectedSheets[key]);
        formData.append('sheets', JSON.stringify(sheets));
      }

      const response = await extractCASData(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        const uploadProgress = Math.round(PROGRESS_STEPS.UPLOAD_MIN + (percentCompleted * 0.2));
        setProgress(uploadProgress);
        if (percentCompleted < 100) {
          setStatus(STATUS_MESSAGES.UPLOADING);
        } else {
          setStatus(STATUS_MESSAGES.EXTRACTING);
        }
      });

      setStatus(STATUS_MESSAGES.PARSING);
      setProgress(PROGRESS_STEPS.PARSING);
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus(STATUS_MESSAGES.TRANSACTIONS);
      setProgress(PROGRESS_STEPS.TRANSACTIONS);
      await new Promise(resolve => setTimeout(resolve, 500));

      const statusText = outputFormat === OUTPUT_FORMATS.EXCEL ? STATUS_MESSAGES.GENERATING_EXCEL :
        outputFormat === OUTPUT_FORMATS.JSON ? STATUS_MESSAGES.GENERATING_JSON :
          STATUS_MESSAGES.GENERATING_TEXT;
      setStatus(statusText);
      setProgress(PROGRESS_STEPS.GENERATING);

      const mimeType = MIME_TYPES[outputFormat];
      const defaultFilename = getOutputFilename(file.name, outputFormat, FILE_EXTENSIONS);
      const filename = extractFilenameFromHeaders(response.headers, defaultFilename);

      downloadFile(response.data, filename, mimeType);

      const completeText = outputFormat === OUTPUT_FORMATS.EXCEL ? SUCCESS_MESSAGES.EXCEL_DOWNLOADED :
        outputFormat === OUTPUT_FORMATS.JSON ? SUCCESS_MESSAGES.JSON_DOWNLOADED :
          SUCCESS_MESSAGES.TEXT_DOWNLOADED;
      setStatus(completeText);
      setStatusState(STATUS_STATES.COMPLETED);
      setProgress(PROGRESS_STEPS.COMPLETE);

      setSummary({
        success: true,
        message: SUCCESS_MESSAGES.EXTRACTION_COMPLETE,
        filename: filename,
        format: outputFormat
      });

      // Add to history
      addHistoryItem({
        filename: filename,
        originalFilename: file.name,
        format: outputFormat,
        success: true,
        fileSize: file.size
      });

      setTimeout(() => {
        handleClearFile();
      }, AUTO_CLEAR_DELAY);

    } catch (err) {
      console.error('Upload error:', err);

      let errorMessage = ERROR_MESSAGES.EXTRACTION_FAILED;

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = ERROR_MESSAGES.INVALID_DATA;
        } else if (err.response.status === 500) {
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // Use default message
          }
        }
      } else if (err.request) {
        errorMessage = ERROR_MESSAGES.SERVER_ERROR;
      }

      setError(errorMessage);
      setStatusState(STATUS_STATES.FAILED);
      setSummary(null);
      resetProgress();

      // Add failed attempt to history
      if (file) {
        addHistoryItem({
          filename: file.name,
          originalFilename: file.name,
          format: outputFormat,
          success: false,
          error: errorMessage,
          fileSize: file.size
        });
      }
    } finally {
      stopProgress();
    }
  };

  return (
    <div className={`pdf-uploader ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uploader-card">
        <div className="card-header">
          <h2>Upload CAS PDF</h2>
          <p>Extract comprehensive mutual fund data from your Consolidated Account Statement</p>
        </div>

        <FileUploadArea
          file={file}
          isDragOver={isDragOver}
          loading={loading}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleFileDrop}
          onBrowseClick={() => fileInputRef.current.click()}
          onClearFile={handleClearFile}
          fileInputRef={fileInputRef}
          onFileChange={handleFileInputChange}
        />

        {file && (
          <PasswordInput
            password={password}
            showPassword={showPassword}
            loading={loading}
            onPasswordChange={(e) => setPassword(e.target.value)}
            onToggleShow={() => setShowPassword(!showPassword)}
          />
        )}

        {file && !loading && !summary && (
          <OutputOptions
            outputFormat={outputFormat}
            selectedSheets={selectedSheets}
            onFormatChange={setOutputFormat}
            onSheetToggle={handleSheetToggle}
          />
        )}

        {file && !loading && !summary && (
          <button className="upload-button" onClick={handleUpload}>
            🚀 Extract & Generate {outputFormat === OUTPUT_FORMATS.EXCEL ? 'Excel' : outputFormat === OUTPUT_FORMATS.JSON ? 'JSON' : 'Text'}
          </button>
        )}

        {loading && (
          <LoadingProgress
            progress={progress}
            status={status}
            statusState={statusState}
            funMessage={funMessage}
            funFact={funFact}
          />
        )}

        {error && <ErrorMessage message={error} />}

        {summary && summary.success && <SuccessMessage summary={summary} />}

        <UploadHistory
          history={history}
          onClearHistory={clearHistory}
          onRemoveItem={removeHistoryItem}
          darkMode={darkMode}
        />
      </div>
    </div>
  );
};

export default PDFUploader;
