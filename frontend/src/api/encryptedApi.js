import { encryptJSON, decryptJSON } from '../utils/encryption';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

/**
 * Make an encrypted API request
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {boolean} encrypt - Whether to encrypt request/response
 * @returns {Promise<any>} - Response data
 */
export async function encryptedFetch(endpoint, options = {}, encrypt = false) {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    let body = options.body;
    
    // Encrypt request body if needed
    if (encrypt && body && typeof body === 'object') {
      const encrypted = await encryptJSON(body);
      body = JSON.stringify({
        encrypted: true,
        data: encrypted
      });
    } else if (body && typeof body === 'object') {
      body = JSON.stringify(body);
    }
    
    // Add encryption header if needed
    if (encrypt) {
      headers['x-encrypt-response'] = 'true';
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
      body
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    
    // Decrypt response if encrypted
    if (data.encrypted && data.data) {
      return await decryptJSON(data.data);
    }
    
    return data;
  } catch (error) {
    console.error('Encrypted API request failed:', error);
    throw error;
  }
}

/**
 * Encrypt data using backend API
 * @param {string} data - Data to encrypt
 * @returns {Promise<string>} - Encrypted data
 */
export async function encryptData(data) {
  const response = await fetch(`${API_BASE_URL}/api/encrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  
  if (!response.ok) {
    throw new Error('Encryption failed');
  }
  
  const result = await response.json();
  return result.encrypted;
}

/**
 * Decrypt data using backend API
 * @param {string} data - Encrypted data
 * @returns {Promise<string>} - Decrypted data
 */
export async function decryptData(data) {
  const response = await fetch(`${API_BASE_URL}/api/decrypt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  
  if (!response.ok) {
    throw new Error('Decryption failed');
  }
  
  const result = await response.json();
  return result.decrypted;
}

/**
 * Hash data using backend API
 * @param {string} data - Data to hash
 * @returns {Promise<string>} - Hashed data
 */
export async function hashData(data) {
  const response = await fetch(`${API_BASE_URL}/api/hash`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data })
  });
  
  if (!response.ok) {
    throw new Error('Hashing failed');
  }
  
  const result = await response.json();
  return result.hash;
}

/**
 * Generate a secure token
 * @param {number} length - Token length in bytes
 * @returns {Promise<string>} - Random token
 */
export async function generateToken(length = 32) {
  const response = await fetch(`${API_BASE_URL}/api/generate-token?length=${length}`);
  
  if (!response.ok) {
    throw new Error('Token generation failed');
  }
  
  const result = await response.json();
  return result.token;
}

export default {
  encryptedFetch,
  encryptData,
  decryptData,
  hashData,
  generateToken
};
