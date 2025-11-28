import { useState, useRef } from 'react';
import { FILE_CONSTRAINTS, DEFAULT_SHEETS, OUTPUT_FORMATS } from '../constants/config';
import { ERROR_MESSAGES } from '../constants/messages';

export const useFileUpload = () => {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [outputFormat, setOutputFormat] = useState(OUTPUT_FORMATS.EXCEL);
  const [selectedSheets, setSelectedSheets] = useState(DEFAULT_SHEETS);
  const fileInputRef = useRef(null);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return null;

    if (selectedFile.type !== FILE_CONSTRAINTS.ACCEPTED_TYPE) {
      return ERROR_MESSAGES.INVALID_FILE;
    }

    if (selectedFile.size > FILE_CONSTRAINTS.MAX_SIZE) {
      return ERROR_MESSAGES.FILE_TOO_LARGE;
    }

    return null;
  };

  const handleFileSelection = (selectedFile) => {
    const error = validateFile(selectedFile);
    if (error) {
      return { success: false, error };
    }

    setFile(selectedFile);
    return { success: true, error: null };
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
    return handleFileSelection(droppedFile);
  };

  const clearFile = () => {
    setFile(null);
    setPassword('');
    setOutputFormat(OUTPUT_FORMATS.EXCEL);
    setSelectedSheets(DEFAULT_SHEETS);
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

  return {
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
  };
};
