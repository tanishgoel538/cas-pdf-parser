import { useState, useEffect } from 'react';

// Use sessionStorage for temporary, per-session history
// This ensures each user sees only their own history and it's cleared when they close the browser/tab
const STORAGE_KEY = 'cas_upload_history_session';
const MAX_HISTORY_ITEMS = 50;

export const useUploadHistory = () => {
  const [history, setHistory] = useState([]);

  // Load history from sessionStorage on mount
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  }, []);

  // Save history to sessionStorage whenever it changes
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Failed to save upload history:', error);
    }
  }, [history]);

  const addHistoryItem = (item) => {
    const newItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...item
    };

    setHistory(prev => {
      const updated = [newItem, ...prev];
      // Keep only the most recent items
      return updated.slice(0, MAX_HISTORY_ITEMS);
    });

    return newItem;
  };

  const clearHistory = () => {
    setHistory([]);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const removeHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  return {
    history,
    addHistoryItem,
    clearHistory,
    removeHistoryItem
  };
};
