import React from 'react';
import ProgressBar from './ProgressBar';

const LoadingProgress = ({ progress, status, funMessage, funFact }) => {
  return (
    <div className="progress-section">
      <ProgressBar progress={progress} />
      <p className="status-text">{status}</p>
      {funMessage && <p className="fun-message">{funMessage}</p>}
      {funFact && <p className="fun-fact">{funFact}</p>}
    </div>
  );
};

export default LoadingProgress;
