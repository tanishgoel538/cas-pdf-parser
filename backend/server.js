// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const casRoutes = require('./src/routes/casRoutes');
const batchCasRoutes = require('./src/routes/batchCasRoutes');
const validateRoutes = require('./src/routes/validateRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

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

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
