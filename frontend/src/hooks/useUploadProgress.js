import { useState, useRef, useEffect } from 'react';
import { FUN_MESSAGES, FUN_FACTS, STATUS_STATES } from '../constants/messages';
import { MESSAGE_ROTATION_INTERVAL } from '../constants/config';

export const useUploadProgress = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [statusState, setStatusState] = useState(STATUS_STATES.IN_PROGRESS);
  const [funMessage, setFunMessage] = useState('');
  const [funFact, setFunFact] = useState('');
  const messageIntervalRef = useRef(null);

  const startProgress = () => {
    setLoading(true);
    
    // Set random fun fact
    const randomFact = FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
    setFunFact(randomFact);

    // Start rotating fun messages
    let messageIndex = 0;
    setFunMessage(FUN_MESSAGES[messageIndex]);
    messageIntervalRef.current = setInterval(() => {
      messageIndex = (messageIndex + 1) % FUN_MESSAGES.length;
      setFunMessage(FUN_MESSAGES[messageIndex]);
    }, MESSAGE_ROTATION_INTERVAL);
  };

  const stopProgress = () => {
    setLoading(false);
    if (messageIntervalRef.current) {
      clearInterval(messageIntervalRef.current);
      messageIntervalRef.current = null;
    }
    setFunMessage('');
    setFunFact('');
  };

  const resetProgress = () => {
    setProgress(0);
    setStatus('');
    stopProgress();
  };

  useEffect(() => {
    return () => {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current);
      }
    };
  }, []);

  return {
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
  };
};
