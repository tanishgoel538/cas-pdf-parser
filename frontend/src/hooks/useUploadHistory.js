import { useState, useEffect } from 'react';

const STORAGE_KEY = 'cas_upload_history';
const MAX_HISTORY_ITEMS = 50;

export const useUploadHistory = () => {
  const [history, setHistory] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load upload history:', error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
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
    localStorage.removeItem(STORAGE_KEY);
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
