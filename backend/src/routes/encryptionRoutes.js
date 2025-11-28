const express = require('express');
const router = express.Router();
const { encrypt, decrypt, hash, generateToken } = require('../utils/encryption');

/**
 * POST /api/encrypt
 * Encrypt arbitrary data
 */
router.post('/encrypt', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'No data provided',
        message: 'Please provide data to encrypt'
      });
    }
    
    const encrypted = encrypt(String(data));
    
    res.json({
      success: true,
      encrypted,
      algorithm: 'aes-256-gcm'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Encryption failed',
      message: error.message
    });
  }
});

/**
 * POST /api/decrypt
 * Decrypt data
 */
router.post('/decrypt', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'No data provided',
        message: 'Please provide data to decrypt'
      });
    }
    
    const decrypted = decrypt(data);
    
    res.json({
      success: true,
      decrypted
    });
  } catch (error) {
    res.status(500).json({
      error: 'Decryption failed',
      message: error.message
    });
  }
});

/**
 * POST /api/hash
 * Hash data (one-way)
 */
router.post('/hash', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        error: 'No data provided',
        message: 'Please provide data to hash'
      });
    }
    
    const hashed = hash(String(data));
    
    res.json({
      success: true,
      hash: hashed,
      algorithm: 'sha256'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Hashing failed',
      message: error.message
    });
  }
});

/**
 * GET /api/generate-token
 * Generate a secure random token
 */
router.get('/generate-token', (req, res) => {
  try {
    const length = parseInt(req.query.length) || 32;
    
    if (length < 16 || length > 128) {
      return res.status(400).json({
        error: 'Invalid length',
        message: 'Token length must be between 16 and 128 bytes'
      });
    }
    
    const token = generateToken(length);
    
    res.json({
      success: true,
      token,
      length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Token generation failed',
      message: error.message
    });
  }
});

module.exports = router;
