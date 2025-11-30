const ExcelJS = require('exceljs');

/**
 * Calculates XIRR (Extended Internal Rate of Return)
 * @param {Array} cashFlows - Array of {date, amount} objects
 * @returns {number} - XIRR as decimal (e.g., 0.15 for 15%)
 */
function calculateXIRR(cashFlows) {
  if (!cashFlows || cashFlows.length < 2) return 0;
  
  // Sort by date
  cashFlows.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  const firstDate = new Date(cashFlows[0].date);
  
  // Newton-Raphson method to find XIRR
  let guess = 0.1; // Initial guess 10%
  const maxIterations = 100;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;
    
    for (const cf of cashFlows) {
      const days = (new Date(cf.date) - firstDate) / (1000 * 60 * 60 * 24);
      const years = days / 365;
      const factor = Math.pow(1 + guess, years);
      
      npv += cf.amount / factor;
      dnpv -= (years * cf.amount) / (factor * (1 + guess));
    }
    
    const newGuess = guess - npv / dnpv;
    
    if (Math.abs(newGuess - guess) < tolerance) {
      return newGuess;
    }
    
    guess = newGuess;
  }
  
  return guess;
}

/**
 * Parses date string for XIRR calculation (returns Date object)
 * @param {string} dateStr - Date string in DD-MMM-YYYY format
 * @returns {Date} - Parsed date
 */
function parseDateForXIRR(dateStr) {
  if (!dateStr) return null;
  
  // Handle DD-MMM-YYYY format (e.g., "01-Jan-2014")
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const monthMap = {
      'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
      'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
    };
    const day = parseInt(parts[0]);
    const month = monthMap[parts[1]];
    const year = parseInt(parts[2]);
    return new Date(year, month, day);
  }
  
  return new Date(dateStr);
}

/**
 * Generates Return Calculation worksheet
 * @param {Object} workbook - ExcelJS workbook
 * @param {Object} transactionData - Transaction data from CAS
 * @param {Object} dateRangeInfo - Date range information
 * @param {string} navHistoryData - Raw NAV history data
 * @param {Object} niftyData - NIFTY 50 historical data (optional)
 */
async function generateReturnCalculationSheet(workbook, transactionData, dateRangeInfo, navHistoryData, niftyData = null) {
  try {
    const worksheet = workbook.addWorksheet('Return Calculation');
    
    // Add columns (include NIFTY 50 if data available)
    const columns = [
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Transaction', key: 'transaction', width: 20 }
    ];
    
    if (niftyData) {
      columns.push({ header: 'NIFTY 50', key: 'nifty50', width: 15 });
      columns.push({ header: 'Units', key: 'units', width: 15 });
      columns.push({ header: 'NIFTY Value', key: 'niftyValue', width: 20 });
    }
    
    worksheet.columns = columns;
    
    const cashFlows = [];
    const niftyCashFlows = [];
    const allUnits = []; // Track all units for summing
    const calculationLogs = []; // Collect all calculation logs for validation
    
    // Import NIFTY fetcher if needed
    const { getNiftyValueForDate } = niftyData ? require('../utils/niftyFetcher') : {};
    
    // Step 1: Parse NAV history for opening balance calculation
    const navMap = parseNAVHistory(navHistoryData);
    
    // Step 2: Get opening and closing dates (use exact strings from PDF)
    const openingDateStr = dateRangeInfo.openingDateRange; // "01-Jan-2014"
    const closingDateStr = dateRangeInfo.closingDateRange; // "17-Nov-2025"
  
  // Step 3: Calculate opening balance
  let openingBalance = 0;
  const holdingsSheet = workbook.getWorksheet('MF Holdings');
  
  if (holdingsSheet) {
    holdingsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const isin = row.getCell(3).value; // ISIN column
      const schemeName = row.getCell(2).value; // Scheme Name
      const openingUnits = row.getCell(4).value; // Opening Unit Balance
      
      if (openingUnits && openingUnits > 0 && isin) {
        const nav = getNavForISIN(navMap, isin, dateRangeInfo.openingDateRange);
        if (nav) {
          openingBalance += openingUnits * nav;
          
          // Log NAV mapping for opening balance
          calculationLogs.push({
            folioNumber: row.getCell(1).value || '',
            schemeName: schemeName || '',
            isin: isin,
            transactionDate: dateRangeInfo.openingDateRange,
            transactionType: 'Opening Balance NAV',
            amount: null,
            units: openingUnits,
            navUsed: nav,
            navSource: 'NAV History Data',
            openingNav: nav,
            openingNavDate: dateRangeInfo.openingDateRange,
            openingNavSource: 'NAV History Data',
            closingUnits: null,
            closingNav: null,
            closingValue: openingUnits * nav,
            niftyOpening: null,
            niftyClosing: null,
            niftyUnits: null,
            notes: `Opening balance: ${openingUnits} units × NAV ${nav} = ₹${(openingUnits * nav).toFixed(2)}`
          });
        }
      }
    });
  }
  
  // Add opening balance row
  if (openingBalance > 0) {
    const openingNifty = niftyData ? getNiftyValueForDate(niftyData, openingDateStr) : null;
    const transaction = -openingBalance; // Negative for investment
    const rowData = {
      date: openingDateStr,
      name: 'Opening Balance',
      transaction: transaction
    };
    
    // Log opening balance calculation
    calculationLogs.push({
      folioNumber: 'ALL',
      schemeName: 'Opening Balance',
      isin: 'MULTIPLE',
      transactionDate: openingDateStr,
      transactionType: 'Opening Balance',
      amount: transaction,
      units: null,
      navUsed: null,
      navSource: 'Calculated from MF Holdings',
      openingNav: null,
      openingNavDate: openingDateStr,
      openingNavSource: 'NAV History Data',
      closingUnits: null,
      closingNav: null,
      closingValue: openingBalance,
      niftyOpening: openingNifty,
      niftyClosing: null,
      niftyUnits: null,
      notes: `Opening balance calculated from ${holdingsSheet ? 'MF Holdings sheet' : 'portfolio data'}`
    });
    
    if (niftyData && openingNifty) {
      const units = transaction / openingNifty; // Preserve sign: negative / positive = negative
      rowData.nifty50 = openingNifty; // Show actual NIFTY value (positive)
      rowData.units = units; // Units with sign preserved
      rowData.niftyValue = openingNifty * units; // NIFTY Value = NIFTY × Units
      allUnits.push(units); // Track units
      
      // Update log with NIFTY data
      calculationLogs[calculationLogs.length - 1].niftyUnits = units;
      // For XIRR calculation, use negative (investment)
      niftyCashFlows.push({ date: parseDateForXIRR(openingDateStr), amount: -openingNifty });
    }
    
    worksheet.addRow(rowData);
    cashFlows.push({ date: parseDateForXIRR(openingDateStr), amount: transaction });
  }
  
  // Step 4: Add credit transactions (multiply by -1)
  const transactionsSheet = workbook.getWorksheet('Transactions');
  if (transactionsSheet) {
    transactionsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const schemeName = row.getCell(2).value; // Scheme Name column
      const dateCell = row.getCell(4).value; // Date column
      const transactionType = row.getCell(5).value; // Transaction Type column
      const creditAmount = row.getCell(6).value; // Credit Amount column
      
      if (creditAmount && creditAmount > 0 && dateCell) {
        const dateStr = typeof dateCell === 'string' ? dateCell : dateCell.toString();
        const amount = -creditAmount; // Negative for investment
        const name = `${transactionType || 'Purchase'} - ${schemeName || 'Fund'}`;
        
        const niftyValue = niftyData ? getNiftyValueForDate(niftyData, dateStr) : null;
        const rowData = { date: dateStr, name, transaction: amount };
        
        // Log credit transaction
        const log = {
          folioNumber: row.getCell(1).value || '',
          schemeName: schemeName || '',
          isin: row.getCell(3).value || '',
          transactionDate: dateStr,
          transactionType: transactionType || 'Purchase',
          amount: amount,
          units: row.getCell(8).value || null,
          navUsed: row.getCell(9).value || null,
          navSource: 'Transaction Sheet',
          openingNav: null,
          openingNavDate: null,
          openingNavSource: null,
          closingUnits: null,
          closingNav: null,
          closingValue: null,
          niftyOpening: null,
          niftyClosing: niftyValue,
          niftyUnits: null,
          notes: `Credit transaction: ${transactionType || 'Purchase'}`
        };
        
        if (niftyData && niftyValue) {
          const units = amount / niftyValue; // Preserve sign: negative / positive = negative
          rowData.nifty50 = niftyValue; // Show actual NIFTY value (positive)
          rowData.units = units; // Units with sign preserved
          rowData.niftyValue = niftyValue * units; // NIFTY Value = NIFTY × Units
          allUnits.push(units); // Track units
          // For XIRR calculation, use negative (investment)
          niftyCashFlows.push({ date: parseDateForXIRR(dateStr), amount: -niftyValue });
          
          log.niftyUnits = units;
          log.notes += ` | NIFTY: ${niftyValue.toFixed(2)} | Units: ${units.toFixed(4)}`;
        }
        
        calculationLogs.push(log);
        worksheet.addRow(rowData);
        cashFlows.push({ date: parseDateForXIRR(dateStr), amount });
      }
    });
  }
  
  // Step 5: Add debit transactions (no multiplication)
  if (transactionsSheet) {
    transactionsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const schemeName = row.getCell(2).value; // Scheme Name column
      const dateCell = row.getCell(4).value; // Date column
      const transactionType = row.getCell(5).value; // Transaction Type column
      const debitAmount = row.getCell(7).value; // Debit Amount column
      
      if (debitAmount && debitAmount > 0 && dateCell) {
        const dateStr = typeof dateCell === 'string' ? dateCell : dateCell.toString();
        const amount = debitAmount; // Positive for redemption
        const name = `${transactionType || 'Redemption'} - ${schemeName || 'Fund'}`;
        
        const niftyValue = niftyData ? getNiftyValueForDate(niftyData, dateStr) : null;
        const rowData = { date: dateStr, name, transaction: amount };
        
        // Log debit transaction
        const log = {
          folioNumber: row.getCell(1).value || '',
          schemeName: schemeName || '',
          isin: row.getCell(3).value || '',
          transactionDate: dateStr,
          transactionType: transactionType || 'Redemption',
          amount: amount,
          units: row.getCell(8).value || null,
          navUsed: row.getCell(9).value || null,
          navSource: 'Transaction Sheet',
          openingNav: null,
          openingNavDate: null,
          openingNavSource: null,
          closingUnits: null,
          closingNav: null,
          closingValue: null,
          niftyOpening: null,
          niftyClosing: niftyValue,
          niftyUnits: null,
          notes: `Debit transaction: ${transactionType || 'Redemption'}`
        };
        
        if (niftyData && niftyValue) {
          const units = amount / niftyValue;
          rowData.nifty50 = niftyValue; // Show actual NIFTY value (positive)
          rowData.units = units; // Units = Transaction / NIFTY
          rowData.niftyValue = niftyValue * units; // NIFTY Value = NIFTY × Units (positive for redemption)
          allUnits.push(units); // Track units
          // For XIRR calculation, use positive (redemption)
          niftyCashFlows.push({ date: parseDateForXIRR(dateStr), amount: niftyValue });
          
          log.niftyUnits = units;
          log.notes += ` | NIFTY: ${niftyValue.toFixed(2)} | Units: ${units.toFixed(4)}`;
        }
        
        calculationLogs.push(log);
        worksheet.addRow(rowData);
        cashFlows.push({ date: parseDateForXIRR(dateStr), amount });
      }
    });
  }
  
  // Step 6: Add closing balance (use total row from MF Holdings)
  let closingBalance = 0;
  if (holdingsSheet) {
    // Find the total row (last row with "Total" in scheme name)
    let totalRowFound = false;
    holdingsSheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header
      
      const schemeName = row.getCell(2).value; // Scheme Name column
      if (schemeName && schemeName.toString().toLowerCase() === 'total') {
        const marketValue = row.getCell(8).value; // Market Value column
        if (marketValue && marketValue > 0) {
          closingBalance = marketValue;
          totalRowFound = true;
        }
      }
    });
    
    // If no total row found, sum all market values
    if (!totalRowFound) {
      holdingsSheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        const marketValue = row.getCell(8).value; // Market Value column
        if (marketValue && marketValue > 0) {
          closingBalance += marketValue;
        }
      });
    }
  }
  
  const closingNifty = niftyData ? getNiftyValueForDate(niftyData, closingDateStr) : null;
  
  // Calculate total units (sum of all previous units, excluding closing balance)
  const totalUnits = allUnits.reduce((sum, u) => sum + u, 0);
  
  const closingRowData = {
    date: closingDateStr,
    name: 'Closing Balance',
    transaction: closingBalance // Positive for current value
  };
  
  if (niftyData && closingNifty) {
    const calculatedNiftyValue = closingNifty * totalUnits;
    closingRowData.nifty50 = closingNifty; // Positive for current value
    closingRowData.units = totalUnits; // Sum of all previous units
    // Ensure NIFTY Value is positive (multiply by -1 if negative)
    closingRowData.niftyValue = calculatedNiftyValue < 0 ? -calculatedNiftyValue : calculatedNiftyValue;
    niftyCashFlows.push({ date: parseDateForXIRR(closingDateStr), amount: closingNifty });
  }
  
  const closingRow = worksheet.addRow(closingRowData);
  const closingRowNumber = closingRow.number;
  cashFlows.push({ date: parseDateForXIRR(closingDateStr), amount: closingBalance });
  
  // Step 7: Calculate XIRR for Portfolio
  const xirr = calculateXIRR(cashFlows);
  const xirrPercentage = (xirr * 100).toFixed(2);
  
  // Step 8: Calculate total gains, purchases, and redemptions for Portfolio
  const totalGains = cashFlows.reduce((sum, cf) => sum + cf.amount, 0);
  
  // Calculate purchases (negative values excluding opening balance)
  const totalPurchases = Math.abs(
    cashFlows
      .slice(1, -1) // Exclude first (opening) and last (closing)
      .filter(cf => cf.amount < 0)
      .reduce((sum, cf) => sum + cf.amount, 0)
  );
  
  // Calculate redemptions (positive values excluding closing balance)
  const totalRedemptions = cashFlows
    .slice(1, -1) // Exclude first (opening) and last (closing)
    .filter(cf => cf.amount > 0)
    .reduce((sum, cf) => sum + cf.amount, 0);
  
  // Step 8b: Calculate for NIFTY Value column
  let niftyValueTotalGains = 0;
  let niftyValueTotalPurchases = 0;
  let niftyValueTotalRedemptions = 0;
  
  if (niftyData) {
    // Collect all NIFTY Values from the worksheet
    const niftyValues = [];
    let rowIndex = 2; // Start from first data row (after header)
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber <= cashFlows.length + 1) {
        const niftyValueCell = row.getCell(6).value;
        if (niftyValueCell !== null && niftyValueCell !== undefined) {
          niftyValues.push(niftyValueCell);
        }
      }
    });
    
    // Calculate totals
    niftyValueTotalGains = niftyValues.reduce((sum, val) => sum + val, 0);
    
    // Purchases (negative values excluding first)
    niftyValueTotalPurchases = Math.abs(
      niftyValues
        .slice(1, -1)
        .filter(val => val < 0)
        .reduce((sum, val) => sum + val, 0)
    );
    
    // Redemptions (positive values excluding last)
    niftyValueTotalRedemptions = niftyValues
      .slice(1, -1)
      .filter(val => val > 0)
      .reduce((sum, val) => sum + val, 0);
  }
  
  // Step 9: Calculate XIRR for NIFTY Value column (if data available)
  let niftyValueXirr = null;
  let niftyValueXirrPercentage = null;
  
  if (niftyData) {
    // Create cash flows from NIFTY Value column
    const niftyValueCashFlows = [];
    let rowIndex = 0;
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && rowNumber <= cashFlows.length + 1) {
        const dateCell = row.getCell(1).value;
        const niftyValueCell = row.getCell(6).value;
        
        if (dateCell && niftyValueCell !== null && niftyValueCell !== undefined) {
          const date = parseDateForXIRR(dateCell);
          niftyValueCashFlows.push({ date, amount: niftyValueCell });
        }
      }
    });
    
    if (niftyValueCashFlows.length > 0) {
      niftyValueXirr = calculateXIRR(niftyValueCashFlows);
      niftyValueXirrPercentage = (niftyValueXirr * 100).toFixed(2);
    }
  }
  
  // Add spacing and results
  worksheet.addRow({});
  worksheet.addRow({});
  
  const xirrRow = worksheet.addRow({
    date: '',
    name: 'XIRR (Annual Return)',
    transaction: `${xirrPercentage}%`,
    nifty50: '',
    units: '',
    niftyValue: niftyValueXirrPercentage ? `${niftyValueXirrPercentage}%` : ''
  });
  xirrRow.font = { bold: true, size: 12 };
  xirrRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFEB3B' }
  };
  
  const gainsRow = worksheet.addRow({
    date: '',
    name: 'Total Gains',
    transaction: totalGains.toFixed(2),
    nifty50: '',
    units: '',
    niftyValue: niftyValueTotalGains.toFixed(2)
  });
  gainsRow.font = { bold: true, size: 12 };
  gainsRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: totalGains >= 0 ? { argb: 'FF90EE90' } : { argb: 'FFFF6B6B' }
  };
  
  // Add Purchase row
  const purchaseRow = worksheet.addRow({
    date: '',
    name: 'Total Purchases',
    transaction: totalPurchases.toFixed(2),
    nifty50: '',
    units: '',
    niftyValue: niftyValueTotalPurchases.toFixed(2)
  });
  purchaseRow.font = { bold: true, size: 11 };
  purchaseRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFFFD700' }
  };
  
  // Add Redemption row
  const redemptionRow = worksheet.addRow({
    date: '',
    name: 'Total Redemptions',
    transaction: totalRedemptions.toFixed(2),
    nifty50: '',
    units: '',
    niftyValue: niftyValueTotalRedemptions.toFixed(2)
  });
  redemptionRow.font = { bold: true, size: 11 };
  redemptionRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFADD8E6' }
  };
  
  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Format data rows and add conditional formatting for NIFTY Value
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1 && rowNumber <= cashFlows.length + 1) {
      // Don't format date column - keep as text to preserve exact format
      row.getCell(1).alignment = { horizontal: 'left' };
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(3).alignment = { horizontal: 'right' };
      
      if (niftyData) {
        row.getCell(4).numFmt = '#,##0.00'; // NIFTY 50
        row.getCell(4).alignment = { horizontal: 'right' };
        row.getCell(5).numFmt = '#,##0.00'; // Units
        row.getCell(5).alignment = { horizontal: 'right' };
        
        // NIFTY Value with conditional formatting
        const transactionCell = row.getCell(3);
        const niftyValueCell = row.getCell(6);
        niftyValueCell.numFmt = '#,##0.00';
        niftyValueCell.alignment = { horizontal: 'right' };
        
        // Compare values (allow small tolerance for rounding)
        // Skip comparison for closing balance row (it uses total units)
        const transactionValue = transactionCell.value;
        const niftyValue = niftyValueCell.value;
        
        if (transactionValue !== null && niftyValue !== null && rowNumber !== closingRowNumber) {
          const difference = Math.abs(Math.abs(transactionValue) - Math.abs(niftyValue));
          const tolerance = 1.0; // Allow 1 rupee difference
          
          if (difference <= tolerance) {
            // Green if values match
            niftyValueCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FF90EE90' }
            };
            niftyValueCell.font = { color: { argb: 'FF006400' } };
          } else {
            // Red if values don't match
            niftyValueCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF6B6B' }
            };
            niftyValueCell.font = { color: { argb: 'FF8B0000' } };
          }
        }
      }
    }
  });
  
  // Freeze header row
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    
    return calculationLogs; // Return logs for validation sheet
    
  } catch (error) {
    console.error('❌ Error generating Return Calculation sheet:', error.message);
    console.error(error.stack);
    throw error;
  }
}

/**
 * Parses NAV history data into a map
 * @param {string} navData - Raw NAV history data
 * @returns {Map} - Map of ISIN to NAV records
 */
function parseNAVHistory(navData) {
  const navMap = new Map();
  const lines = navData.split('\n');
  
  for (const line of lines) {
    if (!line.trim() || !line.match(/^\d+;/)) continue;
    
    const parts = line.split(';');
    if (parts.length >= 8) {
      const isinDivPayout = parts[2]?.trim();
      const nav = parseFloat(parts[4]?.trim());
      const date = parts[7]?.trim();
      
      if (isinDivPayout && nav && date) {
        if (!navMap.has(isinDivPayout)) {
          navMap.set(isinDivPayout, []);
        }
        navMap.get(isinDivPayout).push({ date, nav });
      }
    }
  }
  
  return navMap;
}

/**
 * Gets NAV for a specific ISIN on a specific date
 * @param {Map} navMap - NAV map
 * @param {string} isin - ISIN code
 * @param {string} dateStr - Date string
 * @returns {number} - NAV value
 */
function getNavForISIN(navMap, isin, dateStr) {
  const records = navMap.get(isin);
  if (!records || records.length === 0) return null;
  
  // Find exact match or closest date
  const targetDate = dateStr;
  const match = records.find(r => r.date === targetDate);
  
  return match ? match.nav : records[0].nav; // Return first if no exact match
}

module.exports = {
  generateReturnCalculationSheet,
  calculateXIRR
};
