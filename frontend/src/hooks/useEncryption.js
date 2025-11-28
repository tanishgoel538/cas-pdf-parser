import { useState, useCallback } from 'react';
import { 
  encrypt, 
  decrypt, 
  encryptJSON, 
  decryptJSON, 
  hash, 
  generateToken,
  encryptFile,
  decryptFile
} from '../utils/encryption';

/**
 * React hook for encryption operations
 * Provides easy-to-use encryption functions with loading and error states
 */
export function useEncryption() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const encryptText = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    try {
      const result = await encrypt(text);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const decryptText = useCallback(async (encryptedText) => {
    setLoading(true);
    setError(null);
    try {
      const result = await decrypt(encryptedText);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const encryptData = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await encryptJSON(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const decryptData = useCallback(async (encryptedData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await decryptJSON(encryptedData);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const hashData = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const result = await hash(data);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createToken = useCallback(async (length = 32) => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateToken(length);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const encryptFileData = useCallback(async (file) => {
    setLoading(true);
    setError(null);
    try {
      const result = await encryptFile(file);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const decryptFileData = useCallback(async (encryptedBlob) => {
    setLoading(true);
    setError(null);
    try {
      const result = await decryptFile(encryptedBlob);
      return result;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Functions
    encryptText,
    decryptText,
    encryptData,
    decryptData,
    hashData,
    createToken,
    encryptFile: encryptFileData,
    decryptFile: decryptFileData,
    
    // State
    loading,
    error,
    clearError
  };
}

export default useEncryption;
