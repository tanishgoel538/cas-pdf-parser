const ExcelJS = require('exceljs');

/**
 * Generates Excel report with selected sheets from extracted CAS data
 * @param {Object} portfolioData - Portfolio summary data
 * @param {Object} transactionData - Fund transactions data
 * @param {string} outputPath - Path to save Excel file
 * @param {Array<string>} sheets - Array of sheet names to generate ['portfolio', 'transactions', 'holdings']
 * @returns {Promise<string>} - Path to generated Excel file
 */
async function generateExcelReport(portfolioData, transactionData, outputPath, sheets = ['portfolio', 'transactions', 'holdings']) {
  try {
    console.log('Starting Excel report generation...');
    console.log('Selected sheets:', sheets);
    
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Portfolio Summary
    if (sheets.includes('portfolio')) {
      generatePortfolioSummarySheet(workbook, portfolioData);
      console.log('✓ Portfolio Summary sheet created');
    }
    
    // Sheet 2: Transactions
    if (sheets.includes('transactions')) {
      generateTransactionsSheet(workbook, transactionData);
      console.log('✓ Transactions sheet created');
    }
    
    // Sheet 3: MF Holdings
    if (sheets.includes('holdings')) {
      generateMFHoldingsSheet(workbook, transactionData);
      console.log('✓ MF Holdings sheet created');
    }
    
    // Save workbook
    await workbook.xlsx.writeFile(outputPath);
    console.log(`✓ Excel report saved: ${outputPath}`);
    
    return outputPath;
    
  } catch (error) {
    console.error('Error generating Excel report:', error.message);
    throw new Error(`Failed to generate Excel report: ${error.message}`);
  }
}

/**
 * Generates Portfolio Summary sheet
 */
function generatePortfolioSummarySheet(workbook, portfolioData) {
  const worksheet = workbook.addWorksheet('Portfolio Summary');
  
  // Add columns
  worksheet.columns = [
    { header: 'Mutual Fund', key: 'fundName', width: 40 },
    { header: 'Cost Value (INR)', key: 'costValue', width: 20 },
    { header: 'Market Value (INR)', key: 'marketValue', width: 20 }
  ];
  
  // Add data rows
  if (portfolioData && portfolioData.portfolioSummary) {
    portfolioData.portfolioSummary.forEach(fund => {
      worksheet.addRow({
        fundName: fund.fundName,
        costValue: fund.costValue,
        marketValue: fund.marketValue
      });
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
  
  // Add data rows
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
