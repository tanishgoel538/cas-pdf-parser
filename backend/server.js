// backend/server.js
const express = require('express');
const compression = require('compression');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Load environment variables with priority: .env.local > .env.production > .env
const dotenv = require('dotenv');
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
dotenv.config({ path: path.join(__dirname, envFile) });
dotenv.config({ path: path.join(__dirname, '.env.local') }); // Override with local if exists

const casRoutes = require('./src/routes/casRoutes');
const batchCasRoutes = require('./src/routes/batchCasRoutes');
const validateRoutes = require('./src/routes/validateRoutes');
const encryptionRoutes = require('./src/routes/encryptionRoutes');
const { encryptResponse, decryptRequest } = require('./src/middleware/encryptionMiddleware');
const { requestTiming, memoryMonitor, simpleRateLimit } = require('./src/middleware/performanceMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Performance optimizations
app.set('x-powered-by', false); // Remove X-Powered-By header
app.set('etag', false); // Disable ETags for dynamic content

// === CORS setup ===
// Accept a comma-separated list in CORS_ORIGIN, e.g.
// CORS_ORIGIN=https://your-frontend.vercel.app,https://preview-your.vercel.app
const rawOrigins = (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);

const corsOptions = {
  origin: function(origin, callback) {
    // allow non-browser tools (curl, Postman) or no origin (server-to-server)
    if (!origin) return callback(null, true);

    if (!rawOrigins.length) {
      // If no origins set, be permissive (use only for dev). You can change this to block by default.
      return callback(null, true);
    }

    if (rawOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS policy: This origin is not allowed'), false);
  },
  methods: ['GET','POST','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
};

// Enable gzip compression for faster responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  },
  level: 6 // Balance between speed and compression ratio
}));

// Performance monitoring
app.use(requestTiming);
if (process.env.NODE_ENV === 'development') {
  app.use(memoryMonitor);
}

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' })); // Increase limit for large payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting (100 requests per minute)
app.use('/api', simpleRateLimit(100, 60000));

// Encryption middleware (optional - activated by query param or header)
app.use(decryptRequest);
app.use(encryptResponse);

// === Ensure directories exist (safe on ephemeral FS; used only for temp storage) ===
const uploadsDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
} catch(err) {
  console.warn('Could not create directories:', err.message);
}

// === Routes ===
app.use('/api', casRoutes);
app.use('/api', batchCasRoutes);
app.use('/api', validateRoutes);
app.use('/api', encryptionRoutes);

// Simple healthcheck
app.get('/health', (req, res) => res.json({ status: 'OK', message: 'ITR Complete Backend is running' }));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err && err.stack ? err.stack : err);
  // If this is a CORS error, respond 403
  if (err && err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({ error: 'CORS error', message: err.message });
  }
  res.status(500).json({ error: 'Internal Server Error', message: err && err.message ? err.message : 'unknown' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 ITR Complete Backend Server`);
  console.log(`📡 Listening on port ${PORT}`);
  console.log(`🔗 Health: /health`);
  // On hosts like Render the external URL is shown in dashboard; still copy that URL for frontend env.
});

module.exports = app;
