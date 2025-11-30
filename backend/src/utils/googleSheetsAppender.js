/**
 * Google Sheets Appender
 * Appends user summary data to a Google Sheet
 * 
 * Setup Instructions:
 * 1. Create a Google Cloud Project: https://console.cloud.google.com/
 * 2. Enable Google Sheets API
 * 3. Create Service Account and download credentials JSON
 * 4. Share your Google Sheet with the service account email
 * 5. Set environment variables:
 *    - GOOGLE_SHEETS_CREDENTIALS_PATH (path to credentials JSON)
 *    - GOOGLE_SHEET_ID (from sheet URL)
 */

const { google } = require('googleapis');
const fs = require('fs');

/**
 * Appends user summary row to Google Sheet
 * @param {Object} summaryData - User summary data
 * @param {string} apiKey - Optional API key for Google Sheets append
 * @returns {Promise<Object>} - Result of append operation
 */
async function appendToGoogleSheet(summaryData, apiKey = null) {
  try {
    // Check if Google Sheets integration is configured
    const credentialsEnv = process.env.GOOGLE_SHEETS_CREDENTIALS; // For Render/cloud deployment
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH; // For local development
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const requiredApiKey = process.env.GOOGLE_SHEETS_API_KEY; // Secret key for append access
    
    if (!sheetId) {
      return { success: false, message: 'Not configured' };
    }
    
    if (!credentialsEnv && !credentialsPath) {
      return { success: false, message: 'Not configured' };
    }
    
    // Check API key if configured
    if (requiredApiKey) {
      if (!apiKey || apiKey !== requiredApiKey) {
        // Silent fail - don't log to avoid exposing the feature
        return { success: false, message: 'Unauthorized' };
      }
    }
    
    // Load credentials from environment variable (Render) or file (local)
    let credentials;
    if (credentialsEnv) {
      credentials = JSON.parse(credentialsEnv);
    } else if (credentialsPath) {
      if (!fs.existsSync(credentialsPath)) {
        console.warn(`⚠️  Credentials file not found: ${credentialsPath}`);
        return { success: false, message: 'Credentials file not found' };
      }
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    
    // Create auth client
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Prepare row data - simplified columns
    // Format date as string to prevent Excel serial number conversion
    const rowData = [
      `'${summaryData.date}`, // Prefix with ' to force text format
      summaryData.name,
      summaryData.email,
      summaryData.phone,
      summaryData.period,
      summaryData.investment,
      summaryData.currentValue,
      summaryData.gains,
      summaryData.portfolioXirr || 'N/A',
      summaryData.niftyXirr || 'N/A'
    ];
    
    // Append to sheet with RAW input to preserve formatting
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:J', // 10 columns
      valueInputOption: 'RAW', // Use RAW to prevent date conversion
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    });
    
    // Get the row number that was just added
    const updatedRange = response.data.updates.updatedRange;
    const rowMatch = updatedRange.match(/\d+$/);
    
    if (rowMatch) {
      const rowNumber = parseInt(rowMatch[0]);
      
      // Format the newly added row (remove blue background, set white background)
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: rowNumber - 1,
                endRowIndex: rowNumber
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 1, green: 1, blue: 1 }, // White background
                  textFormat: {
                    foregroundColor: { red: 0, green: 0, blue: 0 }, // Black text
                    bold: false
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }]
        }
      });
    }
    
    console.log(`✓ Data appended to Google Sheet: ${response.data.updates.updatedRows} row(s)`);
    
    return {
      success: true,
      message: 'Data appended successfully',
      updatedRange: response.data.updates.updatedRange,
      updatedRows: response.data.updates.updatedRows
    };
    
  } catch (error) {
    console.error('❌ Error appending to Google Sheet:', error.message);
    return {
      success: false,
      message: error.message,
      error: error
    };
  }
}

/**
 * Creates header row in Google Sheet if it doesn't exist
 * @returns {Promise<Object>} - Result of operation
 */
async function ensureGoogleSheetHeader() {
  try {
    const credentialsEnv = process.env.GOOGLE_SHEETS_CREDENTIALS;
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH;
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId || (!credentialsEnv && !credentialsPath)) {
      return { success: false, message: 'Not configured' };
    }
    
    // Load credentials from environment variable or file
    let credentials;
    if (credentialsEnv) {
      credentials = JSON.parse(credentialsEnv);
    } else {
      credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    }
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Check if header exists
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'Sheet1!A1:J1'
    });
    
    if (!response.data.values || response.data.values.length === 0) {
      // Add header row - simplified columns
      const headerRow = [
        'Date',
        'Name',
        'Email',
        'Phone',
        'Period',
        'Total Investment (₹)',
        'Current Value (₹)',
        'Total Gains (₹)',
        'Portfolio XIRR %',
        'NIFTY 50 XIRR %'
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: 'Sheet1!A1:J1',
        valueInputOption: 'RAW',
        resource: {
          values: [headerRow]
        }
      });
      
      // Format header
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        resource: {
          requests: [{
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.18, green: 0.46, blue: 0.71 },
                  textFormat: {
                    foregroundColor: { red: 1, green: 1, blue: 1 },
                    bold: true
                  }
                }
              },
              fields: 'userEnteredFormat(backgroundColor,textFormat)'
            }
          }]
        }
      });
      
    }
    
    return { success: true, message: 'Header ensured' };
    
  } catch (error) {
    console.error('Error ensuring header:', error.message);
    return { success: false, message: error.message };
  }
}

module.exports = {
  appendToGoogleSheet,
  ensureGoogleSheetHeader
};
