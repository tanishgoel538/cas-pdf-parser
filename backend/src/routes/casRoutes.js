const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { extractTextFromPDF } = require('../extractors/pdfExtractor');
const { extractPortfolioSummary } = require('../extractors/portfolioExtractor');
const { extractFundTransactions } = require('../extractors/transactionExtractor');
const { generateExcelReport } = require('../extractors/excelGenerator');
const { extractDateRange } = require('../extractors/dateRangeExtractor');
const { fetchNAVHistory } = require('../utils/navFetcher');
const { extractUserInfo } = require('../extractors/userInfoExtractor');
const { appendToGoogleSheet, ensureGoogleSheetHeader } = require('../utils/googleSheetsAppender');

/**
 * POST /api/extract-cas
 * Main endpoint for CAS PDF extraction and file generation
 * Supports multiple output formats: excel, json, text
 * Supports sheet selection for Excel: portfolio, transactions, holdings
 */
router.post('/extract-cas', upload.single('pdf'), async (req, res) => {
  let uploadedFilePath = null;
  let outputFilePath = null;
  
  try {
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF file'
      });
    }
    
    uploadedFilePath = req.file.path;
    const password = req.body.password || null;
    const outputFormat = req.body.outputFormat || 'excel'; // excel, json, text
    const selectedSheets = req.body.sheets ? JSON.parse(req.body.sheets) : ['portfolio', 'transactions', 'holdings', 'returns'];
    

    
    // Step 1: Extract text from PDF
    const startTime = Date.now();
    const textContent = await extractTextFromPDF(uploadedFilePath, password);
    
    if (!textContent || textContent.length < 100) {
      throw new Error('Extracted text is too short. PDF may be empty or corrupted.');
    }
    

    
    // Step 2: Extract user information
    const userInfo = extractUserInfo(textContent);
    
    // Step 3: Extract date range
    const dateRangeInfo = extractDateRange(textContent);
    
    // Step 4 & 5: Extract portfolio and transactions in parallel
    const [portfolioData, transactionData] = await Promise.all([
      Promise.resolve(extractPortfolioSummary(textContent)),
      Promise.resolve(extractFundTransactions(textContent, extractPortfolioSummary(textContent)))
    ]).catch(err => {
      // Fallback to sequential if parallel fails
      const portfolio = extractPortfolioSummary(textContent);
      const transactions = extractFundTransactions(textContent, portfolio);
      return [portfolio, transactions];
    });
    

    
    if (!portfolioData.portfolioSummary || portfolioData.portfolioSummary.length === 0) {
      throw new Error('No portfolio data found. Please ensure this is a valid CAS PDF.');
    }
    
    if (!transactionData.funds || transactionData.funds.length === 0) {
      throw new Error('No transaction data found. Please ensure this is a valid CAS PDF.');
    }
    
    // Prepare summary (optimized with reduce)
    const summary = {
      totalFunds: portfolioData.fundCount,
      totalFolios: transactionData.totalFolios,
      totalTransactions: transactionData.funds.reduce((total, fund) => 
        total + fund.folios.reduce((folioTotal, folio) => 
          folioTotal + (folio.transactions?.length || 0), 0), 0)
    };
    

    
    const timestamp = Date.now();
    const originalName = path.parse(req.file.originalname).name;
    let fileName, contentType;
    
    // Step 4: Generate output based on format
    if (outputFormat === 'json') {
      fileName = `${originalName}_CAS_Data_${timestamp}.json`;
      outputFilePath = path.join(__dirname, '../../output', fileName);
      
      const jsonData = {
        metadata: {
          extractedAt: new Date().toISOString(),
          sourceFile: req.file.originalname,
          summary
        },
        userInfo,
        dateRangeInfo,
        portfolioData,
        transactionData,
        rawText: textContent
      };
      
      fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
      contentType = 'application/json';
      
    } else if (outputFormat === 'text') {
      fileName = `${originalName}_CAS_Extracted_${timestamp}.txt`;
      outputFilePath = path.join(__dirname, '../../output', fileName);
      
      fs.writeFileSync(outputFilePath, textContent);
      contentType = 'text/plain';
      
    } else {
      // Default: Excel
      fileName = `${originalName}_CAS_Report_${timestamp}.xlsx`;
      outputFilePath = path.join(__dirname, '../../output', fileName);
      
      // Fetch NAV history if returns sheet is requested
      let navHistoryData = null;
      if (selectedSheets.includes('returns') && dateRangeInfo.openingDateRange) {
        try {
          navHistoryData = await fetchNAVHistory(dateRangeInfo.openingDateRange);
        } catch (navError) {
          console.warn('⚠️  Could not fetch NAV history:', navError.message);
        }
      }
      
      const result = await generateExcelReport(portfolioData, transactionData, outputFilePath, selectedSheets, dateRangeInfo, navHistoryData, userInfo);
      const xirrData = result.xirrData;
      outputFilePath = result.outputPath; // Update outputFilePath from result
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      
      // Append summary to Google Sheets (if configured)
      if (userInfo) {
        const totalCostValue = portfolioData.total?.costValue || 0;
        const totalMarketValue = portfolioData.total?.marketValue || 0;
        const totalGains = totalMarketValue - totalCostValue;
        
        const summaryData = {
          date: new Date().toISOString().split('T')[0],
          name: userInfo.name || 'N/A',
          email: userInfo.email || 'N/A',
          phone: userInfo.phone || 'N/A',
          period: dateRangeInfo?.fullDateRange || 'N/A',
          investment: totalCostValue,
          currentValue: totalMarketValue,
          gains: totalGains,
          portfolioXirr: xirrData?.portfolioXirr ? (xirrData.portfolioXirr * 100).toFixed(2) + '%' : 'N/A',
          niftyXirr: xirrData?.niftyXirr ? (xirrData.niftyXirr * 100).toFixed(2) + '%' : 'N/A'
        };
        
        // Ensure header exists and append data
        // Get API key from request header or body
        const sheetsApiKey = req.headers['x-sheets-api-key'] || req.body.sheetsApiKey;
        await ensureGoogleSheetHeader();
        await appendToGoogleSheet(summaryData, sheetsApiKey);
      }
    }
    
    // Send file as download with proper headers
    const totalProcessingTime = Date.now() - startTime;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('X-Processing-Time', `${totalProcessingTime}ms`);
    
    res.download(outputFilePath, fileName, (err) => {
      // Cleanup files after download
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            error: 'Download failed',
            message: 'Failed to download file'
          });
        }
      }
      
      // Delete output file after a delay (5 minutes)
      setTimeout(() => {
        if (outputFilePath && fs.existsSync(outputFilePath)) {
          fs.unlinkSync(outputFilePath);
        }
      }, 5 * 60 * 1000);
    });
    
  } catch (error) {
    console.error('\n❌ Error during extraction:', error.message);
    
    // Cleanup uploaded file on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    
    // Cleanup output file on error
    if (outputFilePath && fs.existsSync(outputFilePath)) {
      fs.unlinkSync(outputFilePath);
    }
    
    // Send error response
    res.status(500).json({
      error: 'Extraction failed',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/status
 * Check extraction status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'ready',
    message: 'CAS extraction service is ready',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
