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
const path = require('path');

/**
 * Appends user summary row to Google Sheet
 * @param {Object} summaryData - User summary data
 * @returns {Promise<Object>} - Result of append operation
 */
async function appendToGoogleSheet(summaryData) {
  try {
    // Check if Google Sheets integration is configured
    const credentialsEnv = process.env.GOOGLE_SHEETS_CREDENTIALS; // For Render/cloud deployment
    const credentialsPath = process.env.GOOGLE_SHEETS_CREDENTIALS_PATH; // For local development
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId) {
      console.log('⚠️  Google Sheets integration not configured. Skipping append.');
      console.log('   Set GOOGLE_SHEET_ID to enable.');
      return { success: false, message: 'Not configured' };
    }
    
    if (!credentialsEnv && !credentialsPath) {
      console.log('⚠️  Google Sheets credentials not configured. Skipping append.');
      console.log('   Set GOOGLE_SHEETS_CREDENTIALS or GOOGLE_SHEETS_CREDENTIALS_PATH to enable.');
      return { success: false, message: 'Not configured' };
    }
    
    console.log('📊 Appending data to Google Sheet...');
    
    // Load credentials from environment variable (Render) or file (local)
    let credentials;
    if (credentialsEnv) {
      console.log('   Using credentials from environment variable');
      credentials = JSON.parse(credentialsEnv);
    } else if (credentialsPath) {
      console.log('   Using credentials from file');
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
    
    // Prepare row data
    const rowData = [
      summaryData.date,
      summaryData.name,
      summaryData.email,
      summaryData.phone,
      summaryData.period,
      summaryData.investment,
      summaryData.currentValue,
      summaryData.gains,
      summaryData.revenuePercent,
      summaryData.navBreakdown
    ];
    
    // Append to sheet
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Sheet1!A:J', // Adjust sheet name if needed
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [rowData]
      }
    });
    
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
      // Add header row
      const headerRow = [
        'Date',
        'Name',
        'Email',
        'Phone',
        'Period',
        'Total Investment (₹)',
        'Current Value (₹)',
        'Total Gains (₹)',
        'Revenue %',
        'Top 5 Funds Breakdown'
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
      
      console.log('✓ Header row created in Google Sheet');
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
