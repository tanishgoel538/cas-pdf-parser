import React, { useState } from 'react';
import { Box, Button, ButtonGroup } from '@mui/material';
import './PDFUploader.css';
import FileUploadArea from './FileUploadArea';
import PasswordInput from './PasswordInput';
import OutputOptions from './OutputOptions';
import LoadingProgress from './LoadingProgress';
import MultipleFileUpload from './MultipleFileUpload';
import { ErrorMessage, SuccessMessage } from './StatusMessages';
import { useFileUpload } from '../hooks/useFileUpload';
import { useUploadProgress } from '../hooks/useUploadProgress';
import { useUploadHistory } from '../hooks/useUploadHistory';
import { extractCASData, extractCASDataBatch, downloadFile, extractFilenameFromHeaders, getOutputFilename } from '../api/casApi';
import { validatePdfFile } from '../api/validatePdf';
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
  const [validationStatus, setValidationStatus] = useState({});
  const [isValidating, setIsValidating] = useState(false);

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
    setIsDragOver,
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

  // Handle mode switch
  const handleModeSwitch = (mode) => {
    if (loading) return; // Don't switch during upload
    
    setUploadMode(mode);
    setError('');
    setSummary(null);
    
    if (mode === 'single') {
      setMultipleFiles([]);
      setFilePasswords({});
    } else {
      clearFile();
    }
  };

  // Handle multiple file selection
  const handleMultipleFileSelection = (selectedFiles) => {
    const filesArray = Array.from(selectedFiles);
    const validFiles = [];
    const errors = [];

    filesArray.forEach(file => {
      if (file.type !== 'application/pdf') {
        errors.push(`${file.name}: Not a PDF file`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      setError(errors.join(', '));
    } else {
      setError('');
    }

    setMultipleFiles(validFiles);
    setSummary(null);
  };

  const handleMultipleFileInputChange = (e) => {
    handleMultipleFileSelection(e.target.files);
  };

  const handleMultipleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    handleMultipleFileSelection(e.dataTransfer.files);
  };

  const handleRemoveMultipleFile = (filename) => {
    setMultipleFiles(prev => prev.filter(f => f.name !== filename));
    setFilePasswords(prev => {
      const updated = { ...prev };
      delete updated[filename];
      return updated;
    });
  };

  const handlePasswordChangeForFile = (filename, password) => {
    setFilePasswords(prev => ({
      ...prev,
      [filename]: password
    }));

    // If file had an error and now has a password, mark as pending validation
    const currentStatus = validationStatus[filename];
    if (currentStatus && !currentStatus.isValid && password) {
      setValidationStatus(prev => ({
        ...prev,
        [filename]: {
          ...currentStatus,
          isPending: true,
          error: 'Click Extract to validate'
        }
      }));
    }
  };

  // Validate all files
  const validateAllFiles = async () => {
    setIsValidating(true);
    const newValidationStatus = {};

    for (const file of multipleFiles) {
      const password = filePasswords[file.name] || '';
      const result = await validatePdfFile(file, password);
      newValidationStatus[file.name] = result;
    }

    setValidationStatus(newValidationStatus);
    setIsValidating(false);
    return newValidationStatus;
  };



  const handleClearMultipleFiles = () => {
    setMultipleFiles([]);
    setFilePasswords({});
    setValidationStatus({});
    setError('');
    setSummary(null);
    
    // Clear the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Single file handlers
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

  // Single file upload
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

  // Multiple files upload
  const handleBatchUpload = async () => {
    if (multipleFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    // Validate all files first
    setError('');
    setIsValidating(true);

    const validationResults = await validateAllFiles();
    setIsValidating(false);

    // Check if any files need passwords
    const filesNeedingPasswords = multipleFiles.filter(file => {
      const status = validationResults[file.name];
      return status && !status.isValid && status.needsPassword;
    });

    if (filesNeedingPasswords.length > 0) {
      const fileNames = filesNeedingPasswords.map(f => f.name).join(', ');
      setError(`Please provide passwords for highlighted files: ${fileNames}`);
      return;
    }

    // Check if any files are invalid
    const invalidFiles = multipleFiles.filter(file => {
      const status = validationResults[file.name];
      return status && !status.isValid;
    });

    if (invalidFiles.length > 0) {
      const fileNames = invalidFiles.map(f => f.name).join(', ');
      setError(`⚠️ Some files are invalid: ${fileNames}. Please check the highlighted files.`);
      return;
    }

    // All files are valid, proceed with upload
    setStatus('Uploading files...');
    setStatusState(STATUS_STATES.IN_PROGRESS);
    setProgress(PROGRESS_STEPS.START);
    startProgress();

    setError('');
    setStatus('Uploading files...');
    setStatusState(STATUS_STATES.IN_PROGRESS);
    setProgress(PROGRESS_STEPS.START);
    startProgress();

    try {
      const formData = new FormData();
      
      multipleFiles.forEach(file => {
        formData.append('pdfs', file);
      });
      
      formData.append('outputFormat', outputFormat);
      formData.append('passwords', JSON.stringify(filePasswords));

      if (outputFormat === OUTPUT_FORMATS.EXCEL) {
        const sheets = Object.keys(selectedSheets).filter(key => selectedSheets[key]);
        formData.append('sheets', JSON.stringify(sheets));
      }

      const response = await extractCASDataBatch(formData, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        const uploadProgress = Math.round(PROGRESS_STEPS.UPLOAD_MIN + (percentCompleted * 0.2));
        setProgress(uploadProgress);
        if (percentCompleted < 100) {
          setStatus('Uploading files...');
        } else {
          setStatus('Processing batch...');
        }
      });

      setStatus('Extracting data from all files...');
      setProgress(PROGRESS_STEPS.PARSING);
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('Generating reports...');
      setProgress(PROGRESS_STEPS.GENERATING);
      await new Promise(resolve => setTimeout(resolve, 500));

      setStatus('Creating ZIP file...');
      setProgress(95);

      const zipFilename = `CAS_Batch_${Date.now()}.zip`;
      downloadFile(response.data, zipFilename, 'application/zip');

      setStatus('Complete! ZIP file downloaded.');
      setStatusState(STATUS_STATES.COMPLETED);
      setProgress(PROGRESS_STEPS.COMPLETE);

      setSummary({
        success: true,
        message: `Successfully processed ${multipleFiles.length} files!`,
        filename: zipFilename,
        format: 'zip'
      });

      addHistoryItem({
        filename: `Batch Upload (${multipleFiles.length} files)`,
        originalFilename: zipFilename,
        format: 'zip',
        success: true,
        fileCount: multipleFiles.length,
        fileSize: multipleFiles.reduce((sum, f) => sum + f.size, 0)
      });

      setTimeout(() => {
        handleClearMultipleFiles();
        stopProgress();
      }, AUTO_CLEAR_DELAY);

    } catch (err) {
      console.error('Batch upload error:', err);

      let errorMessage = 'Failed to process batch. Please check if any files require passwords.';

      if (err.response) {
        if (err.response.status === 400) {
          errorMessage = 'Invalid files or missing data. Please check file formats and passwords.';
        } else if (err.response.status === 500) {
          try {
            const text = await err.response.data.text();
            const errorData = JSON.parse(text);
            errorMessage = errorData.message || errorMessage;
            
            // Check if it's a password error
            if (errorMessage.includes('password')) {
              errorMessage = 'One or more files require a password. Please enter passwords for protected files and try again.';
            }
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

      addHistoryItem({
        filename: `Batch Upload (${multipleFiles.length} files)`,
        originalFilename: 'batch_failed.zip',
        format: 'zip',
        success: false,
        error: errorMessage,
        fileCount: multipleFiles.length
      });
    } finally {
      setIsValidating(false);
      stopProgress();
    }
  };

  const currentFile = uploadMode === 'single' ? file : null;
  const hasFiles = uploadMode === 'single' ? !!file : multipleFiles.length > 0;

  return (
    <div className={`pdf-uploader ${darkMode ? 'dark-mode' : ''}`}>
      <div className="uploader-card">
        <div className="card-header">
          <h2>Upload CAS PDF</h2>
          <p>Extract comprehensive mutual fund data from your Consolidated Account Statement</p>
        </div>

        {/* Mode Switcher */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <ButtonGroup
            variant="contained"
            sx={{
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)',
              '& .MuiButton-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                padding: '0.6rem 1.5rem'
              }
            }}
          >
            <Button
              onClick={() => handleModeSwitch('single')}
              disabled={loading}
              sx={{
                background: uploadMode === 'single'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                color: uploadMode === 'single' ? 'white' : darkMode ? '#a8b9ff' : '#667eea',
                '&:hover': {
                  background: uploadMode === 'single'
                    ? 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)'
                    : darkMode ? 'rgba(168, 185, 255, 0.2)' : 'rgba(102, 126, 234, 0.2)'
                }
              }}
            >
              📄 Single File
            </Button>
            <Button
              onClick={() => handleModeSwitch('multiple')}
              disabled={loading}
              sx={{
                background: uploadMode === 'multiple'
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                color: uploadMode === 'multiple' ? 'white' : darkMode ? '#a8b9ff' : '#667eea',
                '&:hover': {
                  background: uploadMode === 'multiple'
                    ? 'linear-gradient(135deg, #5568d3 0%, #653a8b 100%)'
                    : darkMode ? 'rgba(168, 185, 255, 0.2)' : 'rgba(102, 126, 234, 0.2)'
                }
              }}
            >
              📦 Multiple Files
            </Button>
          </ButtonGroup>
        </Box>

        {uploadMode === 'single' ? (
          <>
            <FileUploadArea
              file={currentFile}
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

            {currentFile && (
              <PasswordInput
                password={password}
                showPassword={showPassword}
                loading={loading}
                onPasswordChange={(e) => setPassword(e.target.value)}
                onToggleShow={() => setShowPassword(!showPassword)}
              />
            )}
          </>
        ) : (
          <>
            <FileUploadArea
              file={null}
              isDragOver={isDragOver}
              loading={loading}
              multiple={true}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleMultipleFileDrop}
              onBrowseClick={() => fileInputRef.current.click()}
              onClearFile={handleClearMultipleFiles}
              fileInputRef={fileInputRef}
              onFileChange={handleMultipleFileInputChange}
            />

            {multipleFiles.length > 0 && (
              <MultipleFileUpload
                files={multipleFiles}
                passwords={filePasswords}
                validationStatus={validationStatus}
                onRemoveFile={handleRemoveMultipleFile}
                onPasswordChange={handlePasswordChangeForFile}
                darkMode={darkMode}
              />
            )}
          </>
        )}

        {hasFiles && !loading && !summary && (
          <OutputOptions
            outputFormat={outputFormat}
            selectedSheets={selectedSheets}
            onFormatChange={setOutputFormat}
            onSheetToggle={handleSheetToggle}
          />
        )}

        {hasFiles && !loading && !summary && (
          <button
            className="upload-button"
            onClick={uploadMode === 'single' ? handleUpload : handleBatchUpload}
            disabled={isValidating}
          >
            {isValidating ? (
              <>🔍 Validating Files...</>
            ) : uploadMode === 'single' ? (
              <>🚀 Extract & Generate {outputFormat === OUTPUT_FORMATS.EXCEL ? 'Excel' : outputFormat === OUTPUT_FORMATS.JSON ? 'JSON' : 'Text'}</>
            ) : (
              <>🚀 Extract All & Download ZIP ({multipleFiles.length} files)</>
            )}
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
