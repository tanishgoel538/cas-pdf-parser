const https = require('https');

/**
 * Converts date from DD-MMM-YYYY to YYYY-MM-DD format
 * @param {string} dateStr - Date in format "01-Jan-2014"
 * @returns {string} - Date in format "2014-01-01"
 */
function convertDateFormat(dateStr) {
  if (!dateStr) return null;
  
  const monthMap = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = monthMap[parts[1]];
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  
  return dateStr;
}

/**
 * Fetches NIFTY 50 historical data from Investing.com API
 * @param {string} startDate - Start date in DD-MMM-YYYY format (e.g., "01-Jan-2014")
 * @param {string} endDate - End date in DD-MMM-YYYY format (e.g., "17-Nov-2025")
 * @returns {Promise<Object>} - NIFTY 50 historical data
 */
async function fetchNifty50Data(startDate, endDate) {
  return new Promise((resolve, reject) => {
    try {
      // Convert dates to YYYY-MM-DD format
      const formattedStartDate = convertDateFormat(startDate);
      const formattedEndDate = convertDateFormat(endDate);
      
      // Use Yahoo Finance API for NIFTY 50 (^NSEI)
      // Convert dates to Unix timestamps
      const startTimestamp = Math.floor(new Date(formattedStartDate).getTime() / 1000);
      const endTimestamp = Math.floor(new Date(formattedEndDate).getTime() / 1000);
      
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?period1=${startTimestamp}&period2=${endTimestamp}&interval=1d`;
      
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
        }
      };
      
      https.get(url, options, (response) => {
        let data = '';
        
        // Handle encoding
        const encoding = response.headers['content-encoding'];
        let stream = response;
        
        if (encoding === 'gzip') {
          const zlib = require('zlib');
          stream = response.pipe(zlib.createGunzip());
        } else if (encoding === 'deflate') {
          const zlib = require('zlib');
          stream = response.pipe(zlib.createInflate());
        } else if (encoding === 'br') {
          const zlib = require('zlib');
          stream = response.pipe(zlib.createBrotliDecompress());
        }
        
        stream.on('data', (chunk) => {
          data += chunk;
        });
        
        stream.on('end', () => {
          if (response.statusCode === 200) {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (parseError) {
              reject(new Error(`Failed to parse JSON: ${parseError.message}`));
            }
          } else {
            reject(new Error(`Failed to fetch NIFTY 50 data. Status: ${response.statusCode}`));
          }
        });
        
        stream.on('error', (error) => {
          reject(new Error(`Stream error: ${error.message}`));
        });
        
      }).on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });
      
    } catch (error) {
      reject(new Error(`Failed to fetch NIFTY 50 data: ${error.message}`));
    }
  });
}

/**
 * Gets NIFTY 50 value for a specific date
 * @param {Object} niftyData - NIFTY 50 historical data from Yahoo Finance
 * @param {string} dateStr - Date in DD-MMM-YYYY format
 * @returns {number} - NIFTY 50 closing value
 */
function getNiftyValueForDate(niftyData, dateStr) {
  if (!niftyData || !niftyData.chart || !niftyData.chart.result) return null;
  
  const result = niftyData.chart.result[0];
  const timestamps = result.timestamp;
  const closes = result.indicators.quote[0].close;
  
  const targetTimestamp = Math.floor(new Date(convertDateFormat(dateStr)).getTime() / 1000);
  
  // Find exact match first
  for (let i = 0; i < timestamps.length; i++) {
    if (Math.abs(timestamps[i] - targetTimestamp) < 86400) { // Within 1 day
      if (closes[i] && closes[i] > 0) {
        return parseFloat(closes[i].toFixed(2));
      }
    }
  }
  
  // If no exact match, find closest previous trading day (within 14 days)
  let closestIndex = -1;
  let closestDiff = Infinity;
  const maxDiff = 14 * 86400; // 14 days in seconds (to handle holidays and weekends)
  
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] <= targetTimestamp) {
      const diff = targetTimestamp - timestamps[i];
      if (diff < closestDiff && diff <= maxDiff) {
        if (closes[i] && closes[i] > 0) {
          closestDiff = diff;
          closestIndex = i;
        }
      }
    }
  }
  
  if (closestIndex >= 0) {
    return parseFloat(closes[closestIndex].toFixed(2));
  }
  
  // If still not found, try next available date (within 14 days forward)
  for (let i = 0; i < timestamps.length; i++) {
    if (timestamps[i] >= targetTimestamp) {
      const diff = timestamps[i] - targetTimestamp;
      if (diff <= maxDiff) {
        if (closes[i] && closes[i] > 0) {
          return parseFloat(closes[i].toFixed(2));
        }
      }
    }
  }
  
  console.warn(`   NIFTY: No data found for ${dateStr} within 14 days`);
  return null;
}

module.exports = {
  fetchNifty50Data,
  getNiftyValueForDate,
  convertDateFormat
};
