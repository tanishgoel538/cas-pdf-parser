const { encrypt, decrypt, encryptJSON, decryptJSON } = require('../utils/encryption');

/**
 * Middleware to encrypt API responses
 * Add ?encrypt=true to any endpoint to get encrypted response
 */
function encryptResponse(req, res, next) {
  const shouldEncrypt = req.query.encrypt === 'true' || req.headers['x-encrypt-response'] === 'true';
  
  if (!shouldEncrypt) {
    return next();
  }
  
  // Store original json method
  const originalJson = res.json.bind(res);
  
  // Override json method
  res.json = function(data) {
    try {
      const encrypted = encryptJSON(data);
      
      // Send encrypted response with metadata
      return originalJson({
        encrypted: true,
        data: encrypted,
        algorithm: 'aes-256-gcm'
      });
    } catch (error) {
      console.error('Response encryption failed:', error);
      return originalJson({
        error: 'Encryption failed',
        message: error.message
      });
    }
  };
  
  next();
}

/**
 * Middleware to decrypt incoming request body
 * Expects body format: { encrypted: true, data: "..." }
 */
function decryptRequest(req, res, next) {
  if (!req.body || !req.body.encrypted) {
    return next();
  }
  
  try {
    const decrypted = decryptJSON(req.body.data);
    req.body = decrypted;
    req.wasEncrypted = true;
    next();
  } catch (error) {
    console.error('Request decryption failed:', error);
    return res.status(400).json({
      error: 'Decryption failed',
      message: 'Invalid encrypted data'
    });
  }
}

/**
 * Middleware to encrypt sensitive fields in response
 * @param {string[]} fields - Array of field names to encrypt
 */
function encryptFields(fields = []) {
  return (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      try {
        const encrypted = { ...data };
        
        fields.forEach(field => {
          if (encrypted[field]) {
            encrypted[field] = encrypt(String(encrypted[field]));
            encrypted[`${field}_encrypted`] = true;
          }
        });
        
        return originalJson(encrypted);
      } catch (error) {
        console.error('Field encryption failed:', error);
        return originalJson(data);
      }
    };
    
    next();
  };
}

module.exports = {
  encryptResponse,
  decryptRequest,
  encryptFields
};
