const express = require('express');
const router = express.Router();
const fs = require('fs');
const upload = require('../middleware/upload');
const { extractTextFromPDF } = require('../extractors/pdfExtractor');

/**
 * POST /api/validate-pdf
 * Validate a PDF file and check if it needs a password
 */
router.post('/validate-pdf', upload.single('pdf'), async (req, res) => {
  let uploadedFilePath = null;
  
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a PDF file'
      });
    }
    
    uploadedFilePath = req.file.path;
    const password = req.body.password || null;
    
    // Try to extract text from PDF
    try {
      const textContent = await extractTextFromPDF(uploadedFilePath, password);
      
      // If we got here, the PDF is valid and password (if needed) is correct
      if (textContent && textContent.length > 0) {
        // Cleanup
        if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
          fs.unlinkSync(uploadedFilePath);
        }
        
        return res.json({
          valid: true,
          needsPassword: false,
          message: 'PDF is valid'
        });
      } else {
        throw new Error('Empty PDF or corrupted file');
      }
    } catch (pdfError) {
      // Cleanup
      if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
        fs.unlinkSync(uploadedFilePath);
      }
      
      const errorMessage = pdfError.message.toLowerCase();
      
      // Check if it's a password-related error
      if (errorMessage.includes('password') || errorMessage.includes('encrypted')) {
        if (password) {
          // Password was provided but wrong
          return res.status(401).json({
            valid: false,
            needsPassword: true,
            wrongPassword: true,
            message: 'Wrong password provided'
          });
        } else {
          // No password provided but needed
          return res.status(401).json({
            valid: false,
            needsPassword: true,
            wrongPassword: false,
            message: 'Password required for this PDF'
          });
        }
      }
      
      // Other PDF errors
      return res.status(400).json({
        valid: false,
        needsPassword: false,
        message: pdfError.message || 'Invalid or corrupted PDF file'
      });
    }
    
  } catch (error) {
    console.error('Validation error:', error);
    
    // Cleanup on error
    if (uploadedFilePath && fs.existsSync(uploadedFilePath)) {
      fs.unlinkSync(uploadedFilePath);
    }
    
    res.status(500).json({
      valid: false,
      error: 'Validation failed',
      message: error.message
    });
  }
});

module.exports = router;
