import React from 'react';
import ProgressBar from '../ProgressBar';
import { STATUS_STATES } from '../../constants/messages';

const LoadingProgress = ({ progress, status, statusState, funMessage, funFact }) => {
  const getStatusClass = () => {
    switch (statusState) {
      case STATUS_STATES.COMPLETED:
        return 'status-completed';
      case STATUS_STATES.FAILED:
        return 'status-failed';
      case STATUS_STATES.IN_PROGRESS:
      default:
        return 'status-in-progress';
    }
  };

  return (
    <div className="progress-section">
      <ProgressBar progress={progress} />
      <div className="status-container">
        <div className={`status-badge ${getStatusClass()}`}>
          {statusState}
        </div>
        <div className="status-details">
          {funMessage && <p className="fun-message">{funMessage}</p>}
        </div>
      </div>
      {funFact && <p className="fun-fact">{funFact}</p>}
    </div>
  );
};

export default LoadingProgress;
