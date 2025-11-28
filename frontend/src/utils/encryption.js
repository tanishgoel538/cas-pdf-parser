/**
 * Frontend encryption utilities
 * Uses Web Crypto API for secure encryption/decryption
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * Get or generate encryption key
 * In production, this should come from secure key management
 */
async function getEncryptionKey() {
  const keyString = process.env.REACT_APP_ENCRYPTION_KEY || 'default-key-change-in-production';
  
  // Convert string to key material
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(keyString),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );
  
  // Derive actual encryption key
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text data
 * @param {string} text - Text to encrypt
 * @returns {Promise<string>} - Encrypted data in format: iv:encrypted (base64)
 */
export async function encrypt(text) {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      data
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt text data
 * @param {string} encryptedData - Encrypted data (base64)
 * @returns {Promise<string>} - Decrypted text
 */
export async function decrypt(encryptedData) {
  try {
    const key = await getEncryptionKey();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt JSON object
 * @param {object} obj - Object to encrypt
 * @returns {Promise<string>} - Encrypted JSON
 */
export async function encryptJSON(obj) {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Decrypt JSON object
 * @param {string} encryptedData - Encrypted JSON string
 * @returns {Promise<object>} - Decrypted object
 */
export async function decryptJSON(encryptedData) {
  const json = await decrypt(encryptedData);
  return JSON.parse(json);
}

/**
 * Hash data (one-way)
 * @param {string} data - Data to hash
 * @returns {Promise<string>} - Hashed data (hex)
 */
export async function hash(data) {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate secure random token
 * @param {number} length - Token length in bytes
 * @returns {string} - Random token (hex)
 */
export function generateToken(length = 32) {
  const array = new Uint8Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypt file
 * @param {File} file - File to encrypt
 * @returns {Promise<Blob>} - Encrypted file blob
 */
export async function encryptFile(file) {
  try {
    const key = await getEncryptionKey();
    const arrayBuffer = await file.arrayBuffer();
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encrypted = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      key,
      arrayBuffer
    );
    
    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return new Blob([combined], { type: 'application/octet-stream' });
  } catch (error) {
    throw new Error(`File encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt file
 * @param {Blob} encryptedBlob - Encrypted file blob
 * @returns {Promise<Blob>} - Decrypted file blob
 */
export async function decryptFile(encryptedBlob) {
  try {
    const key = await getEncryptionKey();
    const arrayBuffer = await encryptedBlob.arrayBuffer();
    const combined = new Uint8Array(arrayBuffer);
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, IV_LENGTH);
    const encrypted = combined.slice(IV_LENGTH);
    
    const decrypted = await window.crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );
    
    return new Blob([decrypted]);
  } catch (error) {
    throw new Error(`File decryption failed: ${error.message}`);
  }
}

export default {
  encrypt,
  decrypt,
  encryptJSON,
  decryptJSON,
  hash,
  generateToken,
  encryptFile,
  decryptFile
};
