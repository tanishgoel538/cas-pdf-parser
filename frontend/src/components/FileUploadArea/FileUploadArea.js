import React from 'react';

const FileUploadArea = ({
  file,
  isDragOver,
  loading,
  multiple = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onBrowseClick,
  onClearFile,
  fileInputRef,
  onFileChange
}) => {
  return (
    <div
      className={`upload-area ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {!file ? (
        <div className="upload-content">
          <div className="upload-icon">📄</div>
          <h3>Drag & Drop PDF Here</h3>
          <p>or</p>
          <button
            className="browse-button"
            onClick={onBrowseClick}
            disabled={loading}
          >
            Browse Files
          </button>
          <p className="file-info">Maximum file size: 10MB</p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            multiple={multiple}
            onChange={onFileChange}
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
            <button className="remove-button" onClick={onClearFile}>
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUploadArea;
