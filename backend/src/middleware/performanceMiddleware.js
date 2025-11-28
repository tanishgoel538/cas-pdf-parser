/**
 * Performance monitoring middleware
 */

/**
 * Request timing middleware
 * Logs request duration and adds timing headers
 */
function requestTiming(req, res, next) {
  const start = Date.now();
  
  // Store start time
  req.startTime = start;
  
  // Override res.end to calculate duration
  const originalEnd = res.end;
  res.end = function(...args) {
    const duration = Date.now() - start;
    
    // Only set header if headers haven't been sent yet
    if (!res.headersSent) {
      try {
        res.setHeader('X-Response-Time', `${duration}ms`);
      } catch (err) {
        // Ignore header errors if response already sent
      }
    }
    
    // Log slow requests (> 10 seconds for production, 1 second for dev)
    const slowThreshold = process.env.NODE_ENV === 'production' ? 10000 : 1000;
    if (duration > slowThreshold) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    originalEnd.apply(res, args);
  };
  
  // Also track when response finishes (for res.download, res.sendFile, etc.)
  res.on('finish', () => {
    const duration = Date.now() - start;
    const slowThreshold = process.env.NODE_ENV === 'production' ? 10000 : 1000;
    if (duration > slowThreshold) {
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
}

/**
 * Memory usage monitoring
 * Logs memory usage for each request
 */
function memoryMonitor(req, res, next) {
  const used = process.memoryUsage();
  const memoryMB = Math.round(used.heapUsed / 1024 / 1024);
  
  // Log high memory usage (> 500MB)
  if (memoryMB > 500) {
    console.warn(`⚠️  High memory usage: ${memoryMB}MB`);
  }
  
  next();
}

/**
 * Rate limiting helper
 * Simple in-memory rate limiter
 */
const requestCounts = new Map();

function simpleRateLimit(maxRequests = 100, windowMs = 60000) {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    // Clean old entries
    for (const [key, data] of requestCounts.entries()) {
      if (now - data.resetTime > windowMs) {
        requestCounts.delete(key);
      }
    }
    
    // Check rate limit
    const userData = requestCounts.get(ip) || { count: 0, resetTime: now };
    
    if (now - userData.resetTime > windowMs) {
      userData.count = 0;
      userData.resetTime = now;
    }
    
    userData.count++;
    requestCounts.set(ip, userData);
    
    if (userData.count > maxRequests) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Please try again later'
      });
    }
    
    next();
  };
}

module.exports = {
  requestTiming,
  memoryMonitor,
  simpleRateLimit
};
