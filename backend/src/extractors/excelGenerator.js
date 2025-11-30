const ExcelJS = require('exceljs');

/**
 * Generates Excel report with selected sheets from extracted CAS data
 * @param {Object} portfolioData - Portfolio summary data
 * @param {Object} transactionData - Fund transactions data
 * @param {string} outputPath - Path to save Excel file
 * @param {Array<string>} sheets - Array of sheet names to generate ['portfolio', 'transactions', 'holdings', 'returns']
 * @param {Object} dateRangeInfo - Date range information (optional)
 * @param {string} navHistoryData - NAV history data (optional)
 * @param {Object} userInfo - User information (name, email, phone) (optional)
 * @returns {Promise<string>} - Path to generated Excel file
 */
async function generateExcelReport(portfolioData, transactionData, outputPath, sheets = ['portfolio', 'transactions', 'holdings'], dateRangeInfo = null, navHistoryData = null, userInfo = null) {
  try {
    const workbook = new ExcelJS.Workbook();
    
    // Set workbook properties with user info
    if (userInfo) {
      workbook.creator = userInfo.name || 'CAS Extractor';
      workbook.created = new Date();
      workbook.modified = new Date();
      workbook.properties = {
        ...workbook.properties,
        company: 'CAS Data Extractor',
        manager: userInfo.name || '',
        subject: `CAS Report for ${userInfo.name || 'User'}`,
        keywords: `CAS, Mutual Funds, ${userInfo.email || ''}`,
        description: `Consolidated Account Statement Report\nName: ${userInfo.name || 'N/A'}\nEmail: ${userInfo.email || 'N/A'}\nPhone: ${userInfo.phone || 'N/A'}`
      };
    }
    
    // Calculate MF Holdings total first if needed
    let holdingsTotalMarketValue = null;
    if (sheets.includes('holdings') && transactionData.funds) {
      holdingsTotalMarketValue = 0;
      transactionData.funds.forEach(fund => {
        if (fund.folios) {
          fund.folios.forEach(folio => {
            if (folio.marketValue !== null && folio.marketValue !== undefined) {
              holdingsTotalMarketValue += folio.marketValue;
            }
          });
        }
      });
    }
    
    // Sheet 1: Portfolio Summary
    if (sheets.includes('portfolio')) {
      generatePortfolioSummarySheet(workbook, portfolioData, holdingsTotalMarketValue);
    }
    
    // Sheet 2: Transactions
    if (sheets.includes('transactions')) {
      generateTransactionsSheet(workbook, transactionData);
    }
    
    // Sheet 3: MF Holdings
    if (sheets.includes('holdings')) {
      generateMFHoldingsSheet(workbook, transactionData);
    }
    
    // Sheet 4: Return Calculation (if NAV data available)
    let xirrData = null;
    if (sheets.includes('returns') && dateRangeInfo && navHistoryData) {
      const { generateReturnCalculationSheet } = require('./returnCalculator');
      const { fetchNifty50Data } = require('../utils/niftyFetcher');
      
      // Fetch NIFTY 50 data
      let niftyData = null;
      try {
        niftyData = await fetchNifty50Data(dateRangeInfo.openingDateRange, dateRangeInfo.closingDateRange);
      } catch (niftyError) {
        console.warn('⚠️  Could not fetch NIFTY 50 data:', niftyError.message);
      }
      
      const calculationLogs = await generateReturnCalculationSheet(workbook, transactionData, dateRangeInfo, navHistoryData, niftyData);
      
      // Extract XIRR values from Return Calculation sheet
      const returnSheet = workbook.getWorksheet('Return Calculation');
      if (returnSheet) {
        // Find XIRR row (usually near the end)
        returnSheet.eachRow((row, rowNumber) => {
          const nameCell = row.getCell(2).value; // Column B (name)
          if (nameCell && typeof nameCell === 'string' && nameCell.includes('XIRR')) {
            // Portfolio XIRR is in column C (transaction)
            const portfolioXirrValue = row.getCell(3).value;
            // NIFTY XIRR is in column F (niftyValue)
            const niftyXirrValue = row.getCell(6).value;
            
            if (portfolioXirrValue) {
              xirrData = xirrData || {};
              // Parse percentage string like "13.46%" to decimal 0.1346
              const percentStr = String(portfolioXirrValue).replace('%', '');
              xirrData.portfolioXirr = parseFloat(percentStr) / 100;
            }
            if (niftyXirrValue) {
              xirrData = xirrData || {};
              // Parse percentage string like "12.81%" to decimal 0.1281
              const percentStr = String(niftyXirrValue).replace('%', '');
              xirrData.niftyXirr = parseFloat(percentStr) / 100;
            }
          }
        });
      }
      
      // Generate Calculation Log sheet for validation
      if (calculationLogs && calculationLogs.length > 0) {
        generateCalculationLogSheet(workbook, calculationLogs);
      }
    }
    
    // Save workbook (User Summary sheet removed - only for Google Sheets)
    await workbook.xlsx.writeFile(outputPath);
    
    // Return XIRR data for Google Sheets append
    return { outputPath, xirrData };
    
  } catch (error) {
    console.error('Error generating Excel report:', error.message);
    throw new Error(`Failed to generate Excel report: ${error.message}`);
  }
}

/**
 * Generates Portfolio Summary sheet
 */
function generatePortfolioSummarySheet(workbook, portfolioData, holdingsTotalMarketValue) {
  const worksheet = workbook.addWorksheet('Portfolio Summary');
  
  // Add columns
  worksheet.columns = [
    { header: 'Mutual Fund', key: 'fundName', width: 40 },
    { header: 'Cost Value (INR)', key: 'costValue', width: 20 },
    { header: 'Market Value (INR)', key: 'marketValue', width: 20 }
  ];
  
  let totalRowNumber = null;
  
  // Add data rows
  if (portfolioData && portfolioData.portfolioSummary) {
    portfolioData.portfolioSummary.forEach(fund => {
      worksheet.addRow({
        fundName: fund.fundName,
        costValue: fund.costValue,
        marketValue: fund.marketValue
      });
    });
    
    // Add total row if available
    if (portfolioData.total) {
      const totalRow = worksheet.addRow({
        fundName: 'Total',
        costValue: portfolioData.total.costValue,
        marketValue: portfolioData.total.marketValue
      });
      
      totalRowNumber = totalRow.number;
      
      // Format total row with bold font and background color
      totalRow.font = { bold: true };
      totalRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE7E6E6' }
      };
      
      // Color the market value cell based on comparison with holdings total
      if (holdingsTotalMarketValue !== null) {
        const marketValueCell = totalRow.getCell(3);
        // Compare integer parts only (ignore decimal differences)
        const portfolioInteger = Math.floor(portfolioData.total.marketValue);
        const holdingsInteger = Math.floor(holdingsTotalMarketValue);
        
        if (portfolioInteger === holdingsInteger) {
          // Green if integer parts match (decimal differences ignored)
          marketValueCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF90EE90' } // Light green
          };
          marketValueCell.font = { bold: true, color: { argb: 'FF006400' } }; // Dark green text
        } else {
          // Red if integer parts don't match
          marketValueCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFF6B6B' } // Light red
          };
          marketValueCell.font = { bold: true, color: { argb: 'FF8B0000' } }; // Dark red text
        }
      }
    }
  }
  
  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Format data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.getCell(2).numFmt = '#,##0.00';
      row.getCell(2).alignment = { horizontal: 'right' };
      row.getCell(3).numFmt = '#,##0.00';
      row.getCell(3).alignment = { horizontal: 'right' };
      row.getCell(1).alignment = { horizontal: 'left' };
    }
  });
  
  // Freeze header row
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Generates Transactions sheet
 */
function generateTransactionsSheet(workbook, transactionData) {
  const worksheet = workbook.addWorksheet('Transactions');
  
  // Add columns - Split Amount into Credit and Debit
  worksheet.columns = [
    { header: 'Folio Number', key: 'folioNumber', width: 15 },
    { header: 'Scheme Name', key: 'schemeName', width: 50 },
    { header: 'ISIN', key: 'isin', width: 15 },
    { header: 'Date of Transaction', key: 'date', width: 20 },
    { header: 'Transaction Type', key: 'transactionType', width: 20 },
    { header: 'Credit Amount', key: 'creditAmount', width: 20 },
    { header: 'Debit Amount', key: 'debitAmount', width: 20 },
    { header: 'NAV (Price per Unit)', key: 'nav', width: 20 },
    { header: 'Units Transacted', key: 'units', width: 18 },
    { header: 'Unit Balance', key: 'unitBalance', width: 18 }
  ];
  
  // Add data rows
  if (transactionData.funds) {
    transactionData.funds.forEach(fund => {
      if (fund.folios) {
        fund.folios.forEach(folio => {
          if (folio.transactions) {
            folio.transactions.forEach(transaction => {
              // Split amount into credit (positive) and debit (negative)
              // Credit: Purchase, Switch-In, Dividend (positive amounts)
              // Debit: Redemption, Switch-Out (negative amounts)
              let creditAmount = null;
              let debitAmount = null;
              
              if (transaction.amount !== null && transaction.amount !== undefined) {
                if (transaction.amount >= 0) {
                  creditAmount = transaction.amount;
                } else {
                  debitAmount = Math.abs(transaction.amount); // Store as positive value
                }
              }
              
              // Note: isAdministrative field is intentionally excluded from Excel output
              worksheet.addRow({
                folioNumber: folio.folioNumber || '',
                schemeName: folio.schemeName || '',
                isin: folio.isin || '',
                date: transaction.date || '',
                transactionType: transaction.transactionType || '',
                creditAmount: creditAmount,
                debitAmount: debitAmount,
                nav: transaction.nav,
                units: transaction.units,
                unitBalance: transaction.unitBalance
              });
            });
          }
        });
      }
    });
  }
  
  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Format data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      row.getCell(4).alignment = { horizontal: 'left' };  // Date
      
      // Credit Amount (Column 6)
      const creditCell = row.getCell(6);
      if (creditCell.value !== null && creditCell.value !== undefined) {
        creditCell.numFmt = '#,##0.00';
      }
      creditCell.alignment = { horizontal: 'right' };
      
      // Debit Amount (Column 7)
      const debitCell = row.getCell(7);
      if (debitCell.value !== null && debitCell.value !== undefined) {
        debitCell.numFmt = '#,##0.00';
      }
      debitCell.alignment = { horizontal: 'right' };
      
      // NAV (Column 8)
      const navCell = row.getCell(8);
      if (navCell.value !== null && navCell.value !== undefined) {
        navCell.numFmt = '#,##0.0000';
      }
      navCell.alignment = { horizontal: 'right' };
      
      // Units (Column 9)
      const unitsCell = row.getCell(9);
      if (unitsCell.value !== null && unitsCell.value !== undefined) {
        unitsCell.numFmt = '#,##0.0000';
      }
      unitsCell.alignment = { horizontal: 'right' };
      
      // Balance (Column 10)
      const balanceCell = row.getCell(10);
      if (balanceCell.value !== null && balanceCell.value !== undefined) {
        balanceCell.numFmt = '#,##0.0000';
      }
      balanceCell.alignment = { horizontal: 'right' };
      
      row.getCell(1).alignment = { horizontal: 'left' };  // Folio Number
      row.getCell(2).alignment = { horizontal: 'left' };  // Scheme Name
      row.getCell(3).alignment = { horizontal: 'left' };  // ISIN
      row.getCell(5).alignment = { horizontal: 'left' };  // Transaction Type
    }
  });
  
  // Freeze header row
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Generates MF Holdings sheet
 */
function generateMFHoldingsSheet(workbook, transactionData) {
  const worksheet = workbook.addWorksheet('MF Holdings');
  
  // Add columns
  worksheet.columns = [
    { header: 'Folio Number', key: 'folioNumber', width: 15 },
    { header: 'Scheme Name', key: 'schemeName', width: 50 },
    { header: 'ISIN', key: 'isin', width: 15 },
    { header: 'Opening Unit Balance', key: 'openingUnitBalance', width: 22 },
    { header: 'Closing Unit Balance', key: 'closingUnitBalance', width: 22 },
    { header: 'NAV', key: 'nav', width: 15 },
    { header: 'Total Cost Value', key: 'totalCostValue', width: 20 },
    { header: 'Market Value', key: 'marketValue', width: 20 },
    { header: 'Advisor', key: 'advisor', width: 15 },
    { header: 'PAN', key: 'pan', width: 15 }
  ];
  
  // Add data rows and calculate totals
  let totalClosingUnits = 0;
  let totalCostValue = 0;
  let totalMarketValue = 0;
  
  if (transactionData.funds) {
    transactionData.funds.forEach(fund => {
      if (fund.folios) {
        fund.folios.forEach(folio => {
          worksheet.addRow({
            folioNumber: folio.folioNumber || '',
            schemeName: folio.schemeName || '',
            isin: folio.isin || '',
            openingUnitBalance: folio.openingUnitBalance,
            closingUnitBalance: folio.closingUnitBalance,
            nav: folio.navOnDate,
            totalCostValue: folio.totalCostValue,
            marketValue: folio.marketValue,
            advisor: folio.advisor || null,
            pan: folio.pan || ''
          });
          
          // Accumulate totals
          if (folio.closingUnitBalance !== null && folio.closingUnitBalance !== undefined) {
            totalClosingUnits += folio.closingUnitBalance;
          }
          if (folio.totalCostValue !== null && folio.totalCostValue !== undefined) {
            totalCostValue += folio.totalCostValue;
          }
          if (folio.marketValue !== null && folio.marketValue !== undefined) {
            totalMarketValue += folio.marketValue;
          }
        });
      }
    });
    
    // Add total row
    const totalRow = worksheet.addRow({
      folioNumber: '',
      schemeName: 'Total',
      isin: '',
      openingUnitBalance: null,
      closingUnitBalance: totalClosingUnits,
      nav: null,
      totalCostValue: totalCostValue,
      marketValue: totalMarketValue,
      advisor: null,
      pan: ''
    });
    
    // Format total row with bold font and background color
    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' }
    };
  }
  
  // Format header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Format data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber > 1) {
      const openingCell = row.getCell(4);
      if (openingCell.value !== null && openingCell.value !== undefined) {
        openingCell.numFmt = '#,##0.000';
      }
      openingCell.alignment = { horizontal: 'right' };
      
      const closingCell = row.getCell(5);
      if (closingCell.value !== null && closingCell.value !== undefined) {
        closingCell.numFmt = '#,##0.000';
      }
      closingCell.alignment = { horizontal: 'right' };
      
      const navCell = row.getCell(6);
      if (navCell.value !== null && navCell.value !== undefined) {
        navCell.numFmt = '#,##0.0000';
      }
      navCell.alignment = { horizontal: 'right' };
      
      const costCell = row.getCell(7);
      if (costCell.value !== null && costCell.value !== undefined) {
        costCell.numFmt = '#,##0.00';
      }
      costCell.alignment = { horizontal: 'right' };
      
      const marketCell = row.getCell(8);
      if (marketCell.value !== null && marketCell.value !== undefined) {
        marketCell.numFmt = '#,##0.00';
      }
      marketCell.alignment = { horizontal: 'right' };
      
      row.getCell(1).alignment = { horizontal: 'left' };
      row.getCell(2).alignment = { horizontal: 'left' };
      row.getCell(3).alignment = { horizontal: 'left' };
      row.getCell(9).alignment = { horizontal: 'left' };
      row.getCell(10).alignment = { horizontal: 'left' };
    }
  });
  
  // Freeze header row
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

module.exports = {
  generateExcelReport
};


/**
 * Generates Calculation Log sheet for validation
 * Shows ISIN to NAV mappings
 */
function generateCalculationLogSheet(workbook, calculationLogs) {
  const worksheet = workbook.addWorksheet('NAV Mapping Log');
  
  // Add columns - simplified to show only ISIN and NAV mappings
  worksheet.columns = [
    { header: 'Row #', key: 'rowNum', width: 10 },
    { header: 'ISIN', key: 'isin', width: 15 },
    { header: 'Scheme Name', key: 'schemeName', width: 50 },
    { header: 'Date', key: 'transactionDate', width: 15 },
    { header: 'NAV Value', key: 'navUsed', width: 15 },
    { header: 'NAV Source', key: 'navSource', width: 30 }
  ];
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 20;
  
  // Add data rows - only show entries with ISIN and NAV
  let rowIndex = 0;
  calculationLogs.forEach((log, index) => {
    // Only add rows that have ISIN and NAV information
    if (log.isin && log.navUsed) {
      rowIndex++;
      const row = worksheet.addRow({
        rowNum: rowIndex,
        isin: log.isin,
        schemeName: log.schemeName || '',
        transactionDate: log.transactionDate || '',
        navUsed: log.navUsed,
        navSource: log.navSource || 'Transaction Data'
      });
      
      // Format NAV value
      if (log.navUsed !== null && log.navUsed !== undefined) {
        row.getCell('navUsed').numFmt = '#,##0.0000';
      }
      
      // Alternate row colors
      if (rowIndex % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF2F2F2' }
        };
      }
    }
  });
  
  // Freeze header row and first 2 columns
  worksheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];
  
  // Add auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: `F${rowIndex + 1}`
  };
}


/**
 * Generates User Summary sheet with key metrics
 * Single row format for easy appending to Google Sheets
 */
function generateUserSummarySheet(workbook, userInfo, portfolioData, dateRangeInfo, xirrData = null) {
  const worksheet = workbook.addWorksheet('User Summary', { state: 'visible' });
  
  // Calculate metrics
  const totalCostValue = portfolioData.total?.costValue || 0;
  const totalMarketValue = portfolioData.total?.marketValue || 0;
  const totalGains = totalMarketValue - totalCostValue;
  const revenuePercentage = totalCostValue > 0 ? ((totalGains / totalCostValue) * 100) : 0;
  
  // Calculate NAV breakdown (top 5 funds by market value)
  const sortedFunds = [...(portfolioData.portfolioSummary || [])]
    .sort((a, b) => (b.marketValue || 0) - (a.marketValue || 0))
    .slice(0, 5);
  
  const navBreakdown = sortedFunds.map(fund => {
    const percentage = totalMarketValue > 0 ? ((fund.marketValue / totalMarketValue) * 100) : 0;
    return `${fund.fundName}: ${percentage.toFixed(2)}%`;
  }).join(' | ');
  
  // Add columns for single-row format
  worksheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Phone', key: 'phone', width: 20 },
    { header: 'Period', key: 'period', width: 25 },
    { header: 'Total Investment (₹)', key: 'investment', width: 20 },
    { header: 'Current Value (₹)', key: 'currentValue', width: 20 },
    { header: 'Total Gains (₹)', key: 'gains', width: 20 },
    { header: 'Revenue %', key: 'revenuePercent', width: 15 },
    { header: 'Portfolio XIRR %', key: 'portfolioXirr', width: 18 },
    { header: 'NIFTY 50 XIRR %', key: 'niftyXirr', width: 18 },
    { header: 'Top 5 Funds Breakdown', key: 'navBreakdown', width: 80 }
  ];
  
  // Style header row
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF2E75B6' }
  };
  headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
  headerRow.height = 25;
  
  // Add data row
  const dataRow = worksheet.addRow({
    date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
    name: userInfo.name || 'N/A',
    email: userInfo.email || 'N/A',
    phone: userInfo.phone || 'N/A',
    period: dateRangeInfo?.fullDateRange || 'N/A',
    investment: totalCostValue,
    currentValue: totalMarketValue,
    gains: totalGains,
    revenuePercent: revenuePercentage,
    portfolioXirr: xirrData?.portfolioXirr || null,
    niftyXirr: xirrData?.niftyXirr || null,
    navBreakdown: navBreakdown
  });
  
  // Format numbers
  dataRow.getCell('investment').numFmt = '#,##0.00';
  dataRow.getCell('currentValue').numFmt = '#,##0.00';
  dataRow.getCell('gains').numFmt = '#,##0.00';
  dataRow.getCell('revenuePercent').numFmt = '0.00"%"';
  if (xirrData?.portfolioXirr) {
    dataRow.getCell('portfolioXirr').numFmt = '0.00"%"';
  }
  if (xirrData?.niftyXirr) {
    dataRow.getCell('niftyXirr').numFmt = '0.00"%"';
  }
  
  // Color code gains and XIRR
  if (totalGains >= 0) {
    dataRow.getCell('gains').font = { color: { argb: 'FF006400' }, bold: true };
    dataRow.getCell('revenuePercent').font = { color: { argb: 'FF006400' }, bold: true };
  } else {
    dataRow.getCell('gains').font = { color: { argb: 'FFDC143C' }, bold: true };
    dataRow.getCell('revenuePercent').font = { color: { argb: 'FFDC143C' }, bold: true };
  }
  
  // Color code XIRR values
  if (xirrData?.portfolioXirr) {
    dataRow.getCell('portfolioXirr').font = { color: { argb: 'FF006400' }, bold: true };
  }
  if (xirrData?.niftyXirr) {
    dataRow.getCell('niftyXirr').font = { color: { argb: 'FF4169E1' }, bold: true }; // Blue for benchmark
  }
  
  // Add summary section below
  worksheet.addRow([]);
  worksheet.addRow(['Summary Metrics']);
  worksheet.getRow(3).font = { bold: true, size: 12 };
  
  worksheet.addRow(['Total Funds', portfolioData.fundCount || 0]);
  worksheet.addRow(['Total Investment', totalCostValue]);
  worksheet.addRow(['Current Market Value', totalMarketValue]);
  worksheet.addRow(['Total Gains/Loss', totalGains]);
  worksheet.addRow(['Return Percentage', `${revenuePercentage.toFixed(2)}%`]);
  
  // Format summary values
  worksheet.getCell('B5').numFmt = '#,##0.00';
  worksheet.getCell('B6').numFmt = '#,##0.00';
  worksheet.getCell('B7').numFmt = '#,##0.00';
  
  // Freeze header row
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}
