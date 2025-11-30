const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const upload = require('../middleware/upload');
const { extractTextFromPDF } = require('../extractors/pdfExtractor');
const { extractPortfolioSummary } = require('../extractors/portfolioExtractor');
const { extractFundTransactions } = require('../extractors/transactionExtractor');
const { extractDateRange } = require('../extractors/dateRangeExtractor');
const { generateExcelReport } = require('../extractors/excelGenerator');

/**
 * POST /api/extract-cas-batch
 * Batch endpoint for multiple CAS PDF extraction
 * Returns a ZIP file containing all processed files
 */
router.post('/extract-cas-batch', upload.array('pdfs', 50), async (req, res) => {
  const startTime = Date.now();
  const uploadedFiles = [];
  const outputFiles = [];
  let zipFilePath = null;
  
  try {
    // Validate file uploads
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        message: 'Please upload at least one PDF file'
      });
    }
    
    console.log(`\n📦 Processing ${req.files.length} CAS PDFs in batch mode`);
    
    const outputFormat = req.body.outputFormat || 'excel';
    const selectedSheets = req.body.sheets ? JSON.parse(req.body.sheets) : ['portfolio', 'transactions', 'holdings'];
    const passwords = req.body.passwords ? JSON.parse(req.body.passwords) : {};
    
    const results = [];
    
    // Process each file
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const uploadedFilePath = file.path;
      uploadedFiles.push(uploadedFilePath);
      
      try {
        console.log(`\n[${i + 1}/${req.files.length}] Processing: ${file.originalname}`);
        
        const password = passwords[file.originalname] || null;
        
        // Extract text from PDF
        let textContent;
        try {
          textContent = await extractTextFromPDF(uploadedFilePath, password);
        } catch (pdfError) {
          // Check if it's a password error
          if (pdfError.message && pdfError.message.includes('password')) {
            throw new Error('Password required or incorrect password');
          }
          throw pdfError;
        }
        
        if (!textContent || textContent.length < 100) {
          throw new Error('Extracted text is too short');
        }
        
        // Extract date range
        const dateRangeInfo = extractDateRange(textContent);
        
        // Extract portfolio summary
        const portfolioData = extractPortfolioSummary(textContent);
        
        if (!portfolioData.portfolioSummary || portfolioData.portfolioSummary.length === 0) {
          throw new Error('No portfolio data found');
        }
        
        // Extract fund transactions
        const transactionData = extractFundTransactions(textContent, portfolioData);
        
        if (!transactionData.funds || transactionData.funds.length === 0) {
          throw new Error('No transaction data found');
        }
        
        const timestamp = Date.now();
        const originalName = path.parse(file.originalname).name;
        let fileName, outputFilePath;
        
        // Generate output based on format
        if (outputFormat === 'json') {
          fileName = `${originalName}_CAS_Data.json`;
          outputFilePath = path.join(__dirname, '../../output', `${timestamp}_${fileName}`);
          
          const jsonData = {
            metadata: {
              extractedAt: new Date().toISOString(),
              sourceFile: file.originalname
            },
            dateRangeInfo,
            portfolioData,
            transactionData
          };
          
          fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
          
        } else if (outputFormat === 'text') {
          fileName = `${originalName}_CAS_Extracted.txt`;
          outputFilePath = path.join(__dirname, '../../output', `${timestamp}_${fileName}`);
          
          fs.writeFileSync(outputFilePath, textContent);
          
        } else {
          // Excel
          fileName = `${originalName}_CAS_Report.xlsx`;
          outputFilePath = path.join(__dirname, '../../output', `${timestamp}_${fileName}`);
          
          await generateExcelReport(portfolioData, transactionData, outputFilePath, selectedSheets);
        }
        
        outputFiles.push({ path: outputFilePath, name: fileName });
        
        results.push({
          filename: file.originalname,
          success: true,
          outputFile: fileName
        });
        
      } catch (error) {
        console.error(`✗ Failed to process ${file.originalname}:`, error.message);
        
        // Provide more specific error message
        let errorMsg = error.message;
        if (error.message.includes('password')) {
          errorMsg = `Password required or incorrect for ${file.originalname}`;
        }
        
        results.push({
          filename: file.originalname,
          success: false,
          error: errorMsg
        });
      }
    }
    
    // Check if any files were successfully processed
    const successCount = results.filter(r => r.success).length;
    
    if (successCount === 0) {
      throw new Error('Failed to process any files');
    }
    
    console.log(`\n✅ Batch processing complete: ${successCount}/${req.files.length} successful`);
    
    // Create ZIP file
    const zipFileName = `CAS_Batch_${Date.now()}.zip`;
    zipFilePath = path.join(__dirname, '../../output', zipFileName);
    
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`📦 ZIP file created: ${zipFileName} (${archive.pointer()} bytes)`);
      
      // Send ZIP file
      const processingTime = Date.now() - startTime;
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}"`);
      res.setHeader('X-Processing-Time', `${processingTime}ms`);
      
      res.download(zipFilePath, zipFileName, (err) => {
        // Cleanup all files
        uploadedFiles.forEach(file => {
          if (fs.existsSync(file)) fs.unlinkSync(file);
        });
        
        outputFiles.forEach(file => {
          if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
        });
        
        if (err) {
          console.error('Error sending ZIP file:', err);
        }
        
        // Delete ZIP file after delay
        setTimeout(() => {
          if (zipFilePath && fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
            console.log(`🗑️  Cleaned up: ${zipFileName}`);
          }
        }, 5 * 60 * 1000);
      });
    });
    
    archive.on('error', (err) => {
      throw err;
    });
    
    archive.pipe(output);
    
    // Add files to ZIP
    outputFiles.forEach(file => {
      archive.file(file.path, { name: file.name });
    });
    
    // Add results summary
    archive.append(JSON.stringify(results, null, 2), { name: 'batch_results.json' });
    
    await archive.finalize();
    
  } catch (error) {
    console.error('\n❌ Batch extraction error:', error.message);
    
    // Cleanup on error
    uploadedFiles.forEach(file => {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    });
    
    outputFiles.forEach(file => {
      if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
    });
    
    if (zipFilePath && fs.existsSync(zipFilePath)) {
      fs.unlinkSync(zipFilePath);
    }
    
    res.status(500).json({
      error: 'Batch extraction failed',
      message: error.message
    });
  }
});

module.exports = router;
