/**
 * Extracts portfolio summary data from CAS text content
 * @param {string} textContent - Extracted text from PDF
 * @returns {Object} - Portfolio summary data
 */
function extractPortfolioSummary(textContent) {
  const portfolioSummary = [];
  const lines = textContent.split('\n');
  let isPortfolioSection = false;
  let total = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for PORTFOLIO SUMMARY section
    if (line.includes('PORTFOLIO SUMMARY')) {
      isPortfolioSection = true;
      continue;
    }
    
    // Stop when we reach transaction sections
    if (line.includes('Date') && line.includes('Transaction')) {
      isPortfolioSection = false;
      break;
    }
    
    if (isPortfolioSection) {
      // Check for Total row
      if (line.startsWith('Total ')) {
        const totalMatch = line.match(/Total\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})/);
        if (totalMatch) {
          total = {
            costValue: parseFloat(totalMatch[1].replace(/,/g, '')),
            marketValue: parseFloat(totalMatch[2].replace(/,/g, ''))
          };
        }
        continue;
      }
      
      // Parse mutual fund summary lines
      const fundNameMatch = line.match(/^(.*?Mutual Fund)\s+([\d,]+\.?\d*)\s+([\d,]+\.?\d*)$/);
      if (fundNameMatch) {
        const [, fundName, costValue, marketValue] = fundNameMatch;
        portfolioSummary.push({
          fundName: fundName.trim(),
          costValue: parseFloat(costValue.replace(/,/g, '')),
          marketValue: parseFloat(marketValue.replace(/,/g, ''))
        });
      }
    }
  }
  
  console.log(`✓ Extracted ${portfolioSummary.length} funds from portfolio summary`);
  
  return {
    portfolioSummary,
    total,
    fundCount: portfolioSummary.length
  };
}

module.exports = {
  extractPortfolioSummary
};
