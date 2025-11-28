const crypto = require('crypto');

/**
 * Encryption utility for securing sensitive data
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ITERATIONS = 100000;

/**
 * Get encryption key from environment or generate one
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    const isProduction = process.env.NODE_ENV === 'production';
    
    if (isProduction) {
      throw new Error('ENCRYPTION_KEY must be set in production environment');
    }
    
    console.warn('⚠️  ENCRYPTION_KEY not set in environment. Using default (NOT SECURE FOR PRODUCTION)');
    return crypto.scryptSync('default-key-change-in-production', 'salt', KEY_LENGTH);
  }
  
  // Validate key format (should be 64 hex characters)
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    console.warn('⚠️  ENCRYPTION_KEY format is invalid. Expected 64 hex characters.');
  }
  
  // Derive key from the provided key
  return crypto.scryptSync(key, 'salt', KEY_LENGTH);
}

/**
 * Encrypt text data
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted data in format: iv:encrypted:tag (hex encoded)
 */
function encrypt(text) {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    // Return format: iv:encrypted:tag
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
  } catch (error) {
    throw new Error(`Encryption failed: ${error.message}`);
  }
}

/**
 * Decrypt text data
 * @param {string} encryptedData - Encrypted data in format: iv:encrypted:tag
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedData) {
  try {
    const key = getEncryptionKey();
    const parts = encryptedData.split(':');
    
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    const tag = Buffer.from(parts[2], 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error(`Decryption failed: ${error.message}`);
  }
}

/**
 * Encrypt a file
 * @param {string} inputPath - Path to input file
 * @param {string} outputPath - Path to output encrypted file
 * @returns {Promise<object>} - Encryption metadata
 */
async function encryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const key = getEncryptionKey();
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      const input = require('fs').createReadStream(inputPath);
      const output = require('fs').createWriteStream(outputPath);
      
      // Write IV at the beginning of the file
      output.write(iv);
      
      input.pipe(cipher).pipe(output);
      
      output.on('finish', () => {
        const tag = cipher.getAuthTag();
        
        // Append auth tag at the end
        require('fs').appendFileSync(outputPath, tag);
        
        resolve({
          iv: iv.toString('hex'),
          tag: tag.toString('hex'),
          algorithm: ALGORITHM
        });
      });
      
      output.on('error', reject);
      input.on('error', reject);
      cipher.on('error', reject);
      
    } catch (error) {
      reject(new Error(`File encryption failed: ${error.message}`));
    }
  });
}

/**
 * Decrypt a file
 * @param {string} inputPath - Path to encrypted file
 * @param {string} outputPath - Path to output decrypted file
 * @returns {Promise<void>}
 */
async function decryptFile(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      const fs = require('fs');
      const key = getEncryptionKey();
      
      // Read the entire encrypted file
      const encryptedData = fs.readFileSync(inputPath);
      
      // Extract IV (first 16 bytes)
      const iv = encryptedData.slice(0, IV_LENGTH);
      
      // Extract auth tag (last 16 bytes)
      const tag = encryptedData.slice(-TAG_LENGTH);
      
      // Extract encrypted content (middle part)
      const encrypted = encryptedData.slice(IV_LENGTH, -TAG_LENGTH);
      
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      fs.writeFileSync(outputPath, decrypted);
      resolve();
      
    } catch (error) {
      reject(new Error(`File decryption failed: ${error.message}`));
    }
  });
}

/**
 * Hash sensitive data (one-way)
 * @param {string} data - Data to hash
 * @returns {string} - Hashed data (hex)
 */
function hash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate a secure random token
 * @param {number} length - Token length in bytes (default: 32)
 * @returns {string} - Random token (hex)
 */
function generateToken(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Encrypt JSON object
 * @param {object} obj - Object to encrypt
 * @returns {string} - Encrypted JSON
 */
function encryptJSON(obj) {
  const json = JSON.stringify(obj);
  return encrypt(json);
}

/**
 * Decrypt JSON object
 * @param {string} encryptedData - Encrypted JSON string
 * @returns {object} - Decrypted object
 */
function decryptJSON(encryptedData) {
  const json = decrypt(encryptedData);
  return JSON.parse(json);
}

module.exports = {
  encrypt,
  decrypt,
  encryptFile,
  decryptFile,
  hash,
  generateToken,
  encryptJSON,
  decryptJSON,
  ALGORITHM
};
