# Encryption & Security Guide

This document explains the encryption and security features implemented in the CAS Data Extractor application.

## Overview

The application uses **AES-256-GCM** (Advanced Encryption Standard with Galois/Counter Mode) for authenticated encryption, providing both confidentiality and integrity.

## Features

### Backend Encryption (Node.js)

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **IV Length**: 16 bytes (randomly generated)
- **Auth Tag**: 16 bytes (for integrity verification)

### Frontend Encryption (Web Crypto API)

- **Algorithm**: AES-GCM
- **Key Length**: 256 bits
- **IV Length**: 12 bytes (randomly generated)
- **Key Derivation**: PBKDF2 with 100,000 iterations

## Setup

### 1. Generate Encryption Key

Generate a secure encryption key for production:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Configure Backend

Add to `backend/.env`:

```env
ENCRYPTION_KEY=your-generated-key-here
```

### 3. Configure Frontend

Add to `frontend/.env`:

```env
REACT_APP_ENCRYPTION_KEY=your-generated-key-here
```

**Important**: Use the same key for both backend and frontend if you need cross-platform encryption/decryption.

## Usage

### Backend Usage

#### Encrypt/Decrypt Text

```javascript
const { encrypt, decrypt } = require('./src/utils/encryption');

// Encrypt
const encrypted = encrypt('sensitive data');
console.log(encrypted); // iv:encrypted:tag

// Decrypt
const decrypted = decrypt(encrypted);
console.log(decrypted); // 'sensitive data'
```

#### Encrypt/Decrypt JSON

```javascript
const { encryptJSON, decryptJSON } = require('./src/utils/encryption');

const data = { user: 'john', email: 'john@example.com' };

// Encrypt
const encrypted = encryptJSON(data);

// Decrypt
const decrypted = decryptJSON(encrypted);
```

#### Encrypt/Decrypt Files

```javascript
const { encryptFile, decryptFile } = require('./src/utils/encryption');

// Encrypt file
await encryptFile('input.pdf', 'output.pdf.enc');

// Decrypt file
await decryptFile('output.pdf.enc', 'decrypted.pdf');
```

#### Hash Data (One-Way)

```javascript
const { hash } = require('./src/utils/encryption');

const hashed = hash('password123');
console.log(hashed); // SHA-256 hash
```

### Frontend Usage

#### Encrypt/Decrypt Text

```javascript
import { encrypt, decrypt } from './utils/encryption';

// Encrypt
const encrypted = await encrypt('sensitive data');

// Decrypt
const decrypted = await decrypt(encrypted);
```

#### Encrypt/Decrypt JSON

```javascript
import { encryptJSON, decryptJSON } from './utils/encryption';

const data = { user: 'john', email: 'john@example.com' };

// Encrypt
const encrypted = await encryptJSON(data);

// Decrypt
const decrypted = await decryptJSON(encrypted);
```

#### Encrypt/Decrypt Files

```javascript
import { encryptFile, decryptFile } from './utils/encryption';

// Encrypt file
const file = document.getElementById('fileInput').files[0];
const encryptedBlob = await encryptFile(file);

// Decrypt file
const decryptedBlob = await decryptFile(encryptedBlob);
```

### API Endpoints

#### Encrypt Data

```bash
POST /api/encrypt
Content-Type: application/json

{
  "data": "text to encrypt"
}

Response:
{
  "success": true,
  "encrypted": "iv:encrypted:tag",
  "algorithm": "aes-256-gcm"
}
```

#### Decrypt Data

```bash
POST /api/decrypt
Content-Type: application/json

{
  "data": "iv:encrypted:tag"
}

Response:
{
  "success": true,
  "decrypted": "original text"
}
```

#### Hash Data

```bash
POST /api/hash
Content-Type: application/json

{
  "data": "text to hash"
}

Response:
{
  "success": true,
  "hash": "sha256-hash",
  "algorithm": "sha256"
}
```

#### Generate Token

```bash
GET /api/generate-token?length=32

Response:
{
  "success": true,
  "token": "random-hex-token",
  "length": 32
}
```

### Encrypted API Requests

#### Enable Encryption for Any Endpoint

Add `?encrypt=true` query parameter or `x-encrypt-response: true` header:

```javascript
// Using query parameter
fetch('/api/extract-cas?encrypt=true', {
  method: 'POST',
  body: formData
});

// Using header
fetch('/api/extract-cas', {
  method: 'POST',
  headers: {
    'x-encrypt-response': 'true'
  },
  body: formData
});
```

#### Using Encrypted API Wrapper

```javascript
import { encryptedFetch } from './api/encryptedApi';

// Make encrypted request
const data = await encryptedFetch('/extract-cas', {
  method: 'POST',
  body: { /* data */ }
}, true); // true = encrypt request/response
```

## Middleware

### Encrypt Response Middleware

Automatically encrypts API responses when requested:

```javascript
const { encryptResponse } = require('./src/middleware/encryptionMiddleware');

app.use(encryptResponse);
```

### Decrypt Request Middleware

Automatically decrypts incoming encrypted requests:

```javascript
const { decryptRequest } = require('./src/middleware/encryptionMiddleware');

app.use(decryptRequest);
```

### Encrypt Specific Fields

Encrypt only specific fields in responses:

```javascript
const { encryptFields } = require('./src/middleware/encryptionMiddleware');

// Encrypt 'email' and 'phone' fields
app.get('/user', encryptFields(['email', 'phone']), (req, res) => {
  res.json({
    name: 'John',
    email: 'john@example.com', // Will be encrypted
    phone: '1234567890' // Will be encrypted
  });
});
```

## Security Best Practices

### 1. Key Management

- **Never commit encryption keys to version control**
- Use environment variables for keys
- Rotate keys periodically
- Use different keys for development and production
- Consider using a key management service (AWS KMS, Azure Key Vault, etc.)

### 2. Key Generation

Always generate cryptographically secure random keys:

```bash
# Generate 256-bit key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. HTTPS Only

Always use HTTPS in production to prevent man-in-the-middle attacks.

### 4. File Encryption

For sensitive file uploads:

```javascript
// Backend: Encrypt uploaded files
const { encryptFile } = require('./src/utils/encryption');

router.post('/upload', upload.single('file'), async (req, res) => {
  const encryptedPath = req.file.path + '.enc';
  await encryptFile(req.file.path, encryptedPath);
  
  // Delete original unencrypted file
  fs.unlinkSync(req.file.path);
  
  // Store encrypted file
  // ...
});
```

### 5. Password Hashing

For passwords, use one-way hashing (not encryption):

```javascript
const { hash } = require('./src/utils/encryption');

const hashedPassword = hash(userPassword);
// Store hashedPassword in database
```

### 6. Secure Token Generation

For session tokens, API keys, etc.:

```javascript
const { generateToken } = require('./src/utils/encryption');

const sessionToken = generateToken(32); // 32 bytes = 256 bits
```

## Performance Considerations

- Encryption/decryption adds computational overhead
- Use encryption selectively for sensitive data only
- Consider caching encrypted data when appropriate
- For large files, consider streaming encryption

## Troubleshooting

### "Decryption failed" Error

- Verify encryption keys match on both ends
- Check data format (should be `iv:encrypted:tag` for backend)
- Ensure data wasn't corrupted during transmission

### "Invalid encrypted data format" Error

- Verify the encrypted data structure
- Check if data was properly base64/hex encoded

### Performance Issues

- Reduce encryption scope to sensitive data only
- Use compression before encryption for large data
- Consider async encryption for large files

## Examples

### Example 1: Secure File Upload

```javascript
// Frontend
import { encryptFile } from './utils/encryption';

const handleUpload = async (file) => {
  const encryptedBlob = await encryptFile(file);
  const formData = new FormData();
  formData.append('file', encryptedBlob, file.name + '.enc');
  
  await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });
};
```

### Example 2: Encrypted API Communication

```javascript
// Frontend
import { encryptedFetch } from './api/encryptedApi';

const sensitiveData = {
  ssn: '123-45-6789',
  creditCard: '1234-5678-9012-3456'
};

const response = await encryptedFetch('/api/process', {
  method: 'POST',
  body: sensitiveData
}, true); // Encrypt request and response
```

### Example 3: Selective Field Encryption

```javascript
// Backend
const { encryptFields } = require('./src/middleware/encryptionMiddleware');

router.get('/user/:id', encryptFields(['ssn', 'creditCard']), (req, res) => {
  const user = getUserById(req.params.id);
  res.json(user); // ssn and creditCard will be encrypted
});
```

## Testing

Test encryption/decryption:

```bash
# Test backend encryption
curl -X POST http://localhost:5000/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data":"test message"}'

# Test decryption
curl -X POST http://localhost:5000/api/decrypt \
  -H "Content-Type: application/json" \
  -d '{"data":"iv:encrypted:tag"}'
```

## Additional Resources

- [Node.js Crypto Documentation](https://nodejs.org/api/crypto.html)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
