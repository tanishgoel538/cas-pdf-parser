const https = require('https');

/**
 * Fetches NAV history from AMFI portal
 * @param {string} openingDate - Opening date in format "01-Jan-2014"
 * @returns {Promise<string>} - NAV history data as text
 */
async function fetchNAVHistory(openingDate) {
  return new Promise((resolve, reject) => {
    try {
      // Convert date format from "01-Jan-2014" to "01-Jan-2014" (already in correct format)
      const formattedDate = openingDate;
      
      const url = `https://portal.amfiindia.com/DownloadNAVHistoryReport_Po.aspx?frmdt=${formattedDate}`;
      
      console.log(`📊 Fetching NAV history from: ${url}`);
      
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br, zstd',
          'Accept-Language': 'en-US,en;q=0.9,en-IN;q=0.8',
          'Cache-Control': 'max-age=0',
          'Sec-Ch-Ua': '"Chromium";v="142", "Microsoft Edge";v="142", "Not_A Brand";v="99"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0'
        }
      };
      
      https.get(url, options, (response) => {
        let data = '';
        
        // Handle gzip encoding
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
            resolve(data);
          } else {
            reject(new Error(`Failed to fetch NAV history. Status: ${response.statusCode}`));
          }
        });
        
        stream.on('error', (error) => {
          reject(new Error(`Stream error: ${error.message}`));
        });
        
      }).on('error', (error) => {
        reject(new Error(`Request error: ${error.message}`));
      });
      
    } catch (error) {
      reject(new Error(`Failed to fetch NAV history: ${error.message}`));
    }
  });
}

/**
 * Parses NAV history text data into structured format
 * @param {string} navData - Raw NAV history text
 * @returns {Array} - Parsed NAV records
 */
function parseNAVHistory(navData) {
  try {
    const lines = navData.split('\n');
    const records = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Skip header row
      if (line.includes('Scheme Code') || line.includes('ISIN Div Payout')) continue;
      
      // NAV data format: Scheme Code;ISIN Div Payout/ISIN Growth;ISIN Div Reinvestment;Scheme Name;Net Asset Value;Repurchase Price;Sale Price;Date
      const parts = line.split(';');
      
      if (parts.length >= 6 && parts[0] && parts[0].match(/^\d+$/)) {
        records.push({
          schemeCode: parts[0]?.trim(),
          isinDivPayout: parts[1]?.trim(),
          isinDivReinvestment: parts[2]?.trim(),
          schemeName: parts[3]?.trim(),
          nav: parts[4]?.trim(),
          repurchasePrice: parts[5]?.trim(),
          salePrice: parts[6]?.trim(),
          date: parts[7]?.trim()
        });
      }
    }
    
    return records;
    
  } catch (error) {
    console.error('Error parsing NAV history:', error.message);
    return [];
  }
}

module.exports = {
  fetchNAVHistory,
  parseNAVHistory
};
