/**
 * Performance optimization utilities
 */

// Memoization cache
const memoCache = new Map();

/**
 * Memoize function results
 * @param {Function} fn - Function to memoize
 * @param {Function} keyGenerator - Generate cache key from arguments
 * @returns {Function} - Memoized function
 */
function memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
  return function(...args) {
    const key = keyGenerator(...args);
    
    if (memoCache.has(key)) {
      return memoCache.get(key);
    }
    
    const result = fn.apply(this, args);
    memoCache.set(key, result);
    
    // Limit cache size to prevent memory leaks
    if (memoCache.size > 1000) {
      const firstKey = memoCache.keys().next().value;
      memoCache.delete(firstKey);
    }
    
    return result;
  };
}

/**
 * Clear memoization cache
 */
function clearCache() {
  memoCache.clear();
}

/**
 * Batch process array items
 * @param {Array} items - Items to process
 * @param {Function} processor - Processing function
 * @param {number} batchSize - Batch size
 * @returns {Promise<Array>} - Processed results
 */
async function batchProcess(items, processor, batchSize = 100) {
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Debounce function execution
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(fn, delay = 300) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

/**
 * Throttle function execution
 * @param {Function} fn - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} - Throttled function
 */
function throttle(fn, limit = 300) {
  let inThrottle;
  
  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

/**
 * Measure function execution time
 * @param {Function} fn - Function to measure
 * @param {string} label - Label for logging
 * @returns {Function} - Wrapped function
 */
function measureTime(fn, label = 'Function') {
  return async function(...args) {
    const start = Date.now();
    const result = await fn.apply(this, args);
    const duration = Date.now() - start;
    console.log(`⏱️  ${label}: ${duration}ms`);
    return result;
  };
}

module.exports = {
  memoize,
  clearCache,
  batchProcess,
  debounce,
  throttle,
  measureTime
};
