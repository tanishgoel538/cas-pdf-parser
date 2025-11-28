// Compiled regex patterns for better performance
const PORTFOLIO_SUMMARY_REGEX = /PORTFOLIO SUMMARY/;
const TRANSACTION_HEADER_REGEX = /Date.*Transaction/;
const TOTAL_ROW_REGEX = /^Total\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/;
const FUND_LINE_REGEX = /^(.*?Mutual Fund)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)$/;

/**
 * Extracts portfolio summary data from CAS text content (Optimized)
 * @param {string} textContent - Extracted text from PDF
 * @returns {Object} - Portfolio summary data
 */
function extractPortfolioSummary(textContent) {
  const portfolioSummary = [];
  let total = null;
  
  // Find portfolio section boundaries first
  const portfolioStart = textContent.indexOf('PORTFOLIO SUMMARY');
  if (portfolioStart === -1) {
    return { portfolioSummary: [], total: null, fundCount: 0 };
  }
  
  // Find end of portfolio section
  const transactionStart = textContent.indexOf('Date', portfolioStart);
  const portfolioEnd = transactionStart !== -1 ? transactionStart : textContent.length;
  
  // Extract only the portfolio section
  const portfolioSection = textContent.substring(portfolioStart, portfolioEnd);
  const lines = portfolioSection.split('\n');
  
  // Process lines (skip first line which is the header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check for Total row
    if (line.startsWith('Total ')) {
      const totalMatch = TOTAL_ROW_REGEX.exec(line);
      if (totalMatch) {
        total = {
          costValue: parseFloat(totalMatch[1].replace(/,/g, '')),
          marketValue: parseFloat(totalMatch[2].replace(/,/g, ''))
        };
      }
      continue;
    }
    
    // Parse mutual fund summary lines
    const fundNameMatch = FUND_LINE_REGEX.exec(line);
    if (fundNameMatch) {
      portfolioSummary.push({
        fundName: fundNameMatch[1].trim(),
        costValue: parseFloat(fundNameMatch[2].replace(/,/g, '')),
        marketValue: parseFloat(fundNameMatch[3].replace(/,/g, ''))
      });
    }
  }
  
  return {
    portfolioSummary,
    total,
    fundCount: portfolioSummary.length
  };
}

module.exports = {
  extractPortfolioSummary
};
