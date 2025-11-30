/**
 * Extracts date range from CAS PDF text content
 * @param {string} textContent - Extracted text from PDF
 * @returns {Object} - Date range information
 */
function extractDateRange(textContent) {
  try {
    // Pattern to match: "Consolidated Account Statement","01-Jan-2014 To 17-Nov-2025"
    // or variations like "01-Jan-2014 to 17-Nov-2025"
    const dateRangePattern = /Consolidated Account Statement[",\s]+(\d{2}-[A-Za-z]{3}-\d{4})\s+[Tt]o\s+(\d{2}-[A-Za-z]{3}-\d{4})/i;
    
    const match = textContent.match(dateRangePattern);
    
    if (match) {
      return {
        openingDateRange: match[1],
        closingDateRange: match[2],
        fullDateRange: `${match[1]} To ${match[2]}`
      };
    }
    
    // If not found, return null values
    console.log('⚠️  Date range not found in PDF');
    return {
      openingDateRange: null,
      closingDateRange: null,
      fullDateRange: null
    };
    
  } catch (error) {
    console.error('Error extracting date range:', error.message);
    return {
      openingDateRange: null,
      closingDateRange: null,
      fullDateRange: null
    };
  }
}

module.exports = {
  extractDateRange
};
