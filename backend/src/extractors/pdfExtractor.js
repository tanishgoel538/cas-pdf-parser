const fs = require('fs');
const { PDFParse: pdfParse } = require('pdf-parse');

/**
 * Extracts text content from a PDF file with password support
 * Uses PDFParse class exactly like ITR2 for proper password handling
 * 
 * @param {string} pdfPath - Path to the PDF file
 * @param {string} password - Optional password for protected PDFs
 * @returns {Promise<string>} - Extracted text content
 */
async function extractTextFromPDF(pdfPath, password = null) {
  try {
    // Check if file exists
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`PDF file not found: ${pdfPath}`);
    }

    // Read PDF file
    const pdfBuffer = fs.readFileSync(pdfPath);

    // Initialize parser with data and password (exactly like ITR2)
    const parser = new pdfParse({ 
      data: pdfBuffer, 
      password: password 
    });

    // Load the PDF document
    await parser.load();

    // Get document info (including total pages)
    const info = await parser.getInfo();
    console.log(`✓ PDF parsed successfully. Total pages: ${info.total}`);

    // Extract text from the document
    const textResult = await parser.getText();
    
    // Build content with header
    let content = '';
    content += `=== PDF CONTENT EXTRACTION ===\n`;
    content += `Total Pages: ${info.total}\n`;
    content += `Extraction Date: ${new Date().toLocaleString()}\n`;
    content += `${'='.repeat(50)}\n\n`;
    content += textResult.text;

    console.log(`✓ Extracted ${content.length} characters`);

    return content;

  } catch (error) {
    console.error('✗ Error extracting PDF:', error.message);
    
    // Handle specific PDF errors
    if (error.message && 
        (error.message.toLowerCase().includes('password') || 
         error.message.toLowerCase().includes('encrypted') ||
         error.message.toLowerCase().includes('no password given'))) {
      
      if (!password) {
        throw new Error('PDF is password protected. Please provide the password.');
      } else {
        throw new Error('Incorrect password. Please verify your password and try again.');
      }
    }
    
    if (error.message && error.message.includes('Invalid PDF')) {
      throw new Error('Invalid PDF file. Please upload a valid PDF document.');
    }
    
    throw new Error(`Failed to extract PDF: ${error.message}`);
  }
}

module.exports = {
  extractTextFromPDF
};
