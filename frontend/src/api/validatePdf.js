import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

/**
 * Validate a single PDF file to check if it needs a password
 * @param {File} file - The PDF file to validate
 * @param {string} password - Optional password to test
 * @returns {Promise<{needsPassword: boolean, isValid: boolean, error: string}>}
 */
export const validatePdfFile = async (file, password = '') => {
  try {
    const formData = new FormData();
    formData.append('pdf', file);
    if (password) {
      formData.append('password', password);
    }

    await axios.post(`${API_BASE_URL}/api/validate-pdf`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 10000 // 10 second timeout
    });

    return {
      needsPassword: false,
      isValid: true,
      error: null
    };
  } catch (error) {
    if (error.response) {
      const data = error.response.data;
      
      // Check if it's a password error
      if (data.needsPassword) {
        return {
          needsPassword: true,
          isValid: false,
          error: 'Password required'
        };
      }
      
      if (data.wrongPassword) {
        return {
          needsPassword: true,
          isValid: false,
          error: 'Wrong password'
        };
      }
      
      return {
        needsPassword: false,
        isValid: false,
        error: data.message || 'Invalid PDF file'
      };
    }
    
    return {
      needsPassword: false,
      isValid: false,
      error: 'Failed to validate file'
    };
  }
};

/**
 * Validate multiple PDF files
 * @param {Array<{file: File, password: string}>} files - Array of files with passwords
 * @returns {Promise<Object>} - Object mapping filename to validation result
 */
export const validateMultiplePdfFiles = async (files) => {
  const results = {};
  
  for (const { file, password } of files) {
    results[file.name] = await validatePdfFile(file, password);
  }
  
  return results;
};
