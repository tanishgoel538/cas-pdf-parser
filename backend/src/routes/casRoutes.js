const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const upload = require('../middleware/upload');
const { extractTextFromPDF } = require('../extractors/pdfExtractor');
const { extractPortfolioSummary } = require('../extractors/portfolioExtractor');
const { extractFundTransactions } = require('../extractors/transactionExtractor');
const { generateExcelReport } = require('../extractors/excelGenerator');

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
    const selectedSheets = req.body.sheets ? JSON.parse(req.body.sheets) : ['portfolio', 'transactions', 'holdings'];
    
    console.log(`\n📄 Processing CAS PDF: ${req.file.originalname}`);
    console.log(`   File size: ${(req.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   Output format: ${outputFormat}`);
    if (password) console.log(`   Password protected: Yes`);
    if (outputFormat === 'excel') console.log(`   Selected sheets: ${selectedSheets.join(', ')}`);
    
    // Step 1: Extract text from PDF
    console.log('\n🔍 Step 1: Extracting text from PDF...');
    const textContent = await extractTextFromPDF(uploadedFilePath, password);
    
    if (!textContent || textContent.length < 100) {
      throw new Error('Extracted text is too short. PDF may be empty or corrupted.');
    }
    
    // Step 2: Extract portfolio summary
    console.log('\n📊 Step 2: Extracting portfolio summary...');
    const portfolioData = extractPortfolioSummary(textContent);
    
    if (!portfolioData.portfolioSummary || portfolioData.portfolioSummary.length === 0) {
      throw new Error('No portfolio data found. Please ensure this is a valid CAS PDF.');
    }
    
    // Step 3: Extract fund transactions
    console.log('\n💼 Step 3: Extracting fund transactions...');
    const transactionData = extractFundTransactions(textContent, portfolioData);
    
    if (!transactionData.funds || transactionData.funds.length === 0) {
      throw new Error('No transaction data found. Please ensure this is a valid CAS PDF.');
    }
    
    // Prepare summary
    const summary = {
      totalFunds: portfolioData.fundCount,
      totalFolios: transactionData.totalFolios,
      totalTransactions: 0
    };
    
    // Count total transactions
    transactionData.funds.forEach(fund => {
      fund.folios.forEach(folio => {
        if (folio.transactions) {
          summary.totalTransactions += folio.transactions.length;
        }
      });
    });
    
    console.log('\n✅ Extraction Complete!');
    console.log(`   Funds: ${summary.totalFunds}`);
    console.log(`   Folios: ${summary.totalFolios}`);
    console.log(`   Transactions: ${summary.totalTransactions}`);
    
    const timestamp = Date.now();
    const originalName = path.parse(req.file.originalname).name;
    let fileName, contentType;
    
    // Step 4: Generate output based on format
    if (outputFormat === 'json') {
      console.log('\n📦 Step 4: Generating JSON output...');
      fileName = `${originalName}_CAS_Data_${timestamp}.json`;
      outputFilePath = path.join(__dirname, '../../output', fileName);
      
      const jsonData = {
        metadata: {
          extractedAt: new Date().toISOString(),
          sourceFile: req.file.originalname,
          summary
        },
        portfolioData,
        transactionData,
        rawText: textContent
      };
      
      fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
      contentType = 'application/json';
      console.log(`✓ JSON file saved: ${fileName}`);
      
    } else if (outputFormat === 'text') {
      console.log('\n📝 Step 4: Generating text output...');
      fileName = `${originalName}_CAS_Extracted_${timestamp}.txt`;
      outputFilePath = path.join(__dirname, '../../output', fileName);
      
      fs.writeFileSync(outputFilePath, textContent);
      contentType = 'text/plain';
      console.log(`✓ Text file saved: ${fileName}`);
      
    } else {
      // Default: Excel
      console.log('\n📈 Step 4: Generating Excel report...');
      fileName = `${originalName}_CAS_Report_${timestamp}.xlsx`;
      outputFilePath = path.join(__dirname, '../../output', fileName);
      
      await generateExcelReport(portfolioData, transactionData, outputFilePath, selectedSheets);
      contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      console.log(`✓ Excel file saved: ${fileName}`);
    }
    
    // Send file as download with proper headers
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
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
          console.log(`🗑️  Cleaned up: ${fileName}`);
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
