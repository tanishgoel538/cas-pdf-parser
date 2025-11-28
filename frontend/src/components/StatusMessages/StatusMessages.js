import React from 'react';

export const ErrorMessage = ({ message }) => {
  return (
    <div className="error-message">
      <span className="error-icon">⚠️</span>
      <span>{message}</span>
    </div>
  );
};

export const SuccessMessage = ({ summary }) => {
  return (
    <div className="success-message">
      <span className="success-icon">✅</span>
      <div className="success-content">
        <h4>{summary.message}</h4>
        <p>File: {summary.filename}</p>
        <p className="success-note">Check your downloads folder</p>
      </div>
    </div>
  );
};
