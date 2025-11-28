/**
 * Transaction Extractor - Comprehensive CAS data extraction
 * Adapted from ITR2 with enhanced extraction patterns
 */

// Helper function to escape regex special characters
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Parse numeric values with commas and parentheses
function parseNumericValue(value) {
  if (!value || typeof value !== 'string') return null;
  
  value = value.trim();
  const isNegative = value.startsWith('(') && value.endsWith(')');
  if (isNegative) value = value.slice(1, -1);
  
  value = value.replace(/,/g, '');
  const parsed = parseFloat(value);
  
  return isNaN(parsed) ? null : (isNegative ? -parsed : parsed);
}

// Valid transaction types for validation
const VALID_TRANSACTION_TYPES = [
  'Administrative',
  'Stamp Duty',
  'STT Paid',
  'Systematic Investment',
  'Switch-Out',
  'Switch-In',
  'Redemption',
  'Dividend',
  'Purchase'
];

// Clean transaction type by removing unnecessary symbols
function cleanTransactionType(description) {
  if (!description || typeof description !== 'string') {
    return description;
  }
  
  // Remove *** markers from administrative transactions
  let cleaned = description.replace(/\*\*\*/g, '').trim();
  
  // Remove leading * from financial transactions
  cleaned = cleaned.replace(/^\*+/, '').trim();
  
  return cleaned;
}

// Classify transaction type
function classifyTransactionType(description) {
  if (!description || typeof description !== 'string') {
    console.warn('Invalid description provided to classifyTransactionType:', description);
    return { type: 'Purchase', isAdministrative: false };
  }
  
  const desc = description.toLowerCase();
  
  // FIRST CHECK: Administrative transactions marked with *** (Requirements 3.1, 3.2, 3.3)
  // This check must come first to ensure administrative transactions are never misclassified
  if (description.includes('***')) {
    // Most specific patterns first (Requirement 3.3)
    if (desc.includes('stamp duty')) return { type: 'Stamp Duty', isAdministrative: true };
    if (desc.includes('stt paid') || desc.includes('stt')) return { type: 'STT Paid', isAdministrative: true };
    return { type: 'Administrative', isAdministrative: true };
  }
  
  // SECOND CHECK: Keyword-based classification for financial transactions (Requirement 3.2)
  // Case-insensitive pattern matching (Requirement 3.5)
  // Check for patterns with * prefix (common in CAS statements)
  if (desc.includes('systematic investment') || desc.includes('sip') || desc.includes('*systematic investment')) {
    return { type: 'Systematic Investment', isAdministrative: false };
  }
  if (desc.includes('switch-out') || desc.includes('switchout') || desc.includes('*switch-out')) {
    return { type: 'Switch-Out', isAdministrative: false };
  }
  if (desc.includes('switch-in') || desc.includes('switchin') || desc.includes('*switch-in')) {
    return { type: 'Switch-In', isAdministrative: false };
  }
  if (desc.includes('redemption') || desc.includes('redeem') || desc.includes('*redemption')) {
    return { type: 'Redemption', isAdministrative: false };
  }
  if (desc.includes('dividend') || desc.includes('*dividend')) {
    return { type: 'Dividend', isAdministrative: false };
  }
  if (desc.includes('purchase') || desc.includes('*purchase')) {
    return { type: 'Purchase', isAdministrative: false };
  }
  
  // DEFAULT: When no pattern matches (Requirement 3.4)
  return { type: 'Purchase', isAdministrative: false };
}

// Validate transaction type
function validateTransactionType(transactionType) {
  if (!VALID_TRANSACTION_TYPES.includes(transactionType)) {
    console.warn(`Invalid transaction type detected: "${transactionType}". Defaulting to "Purchase".`);
    return 'Purchase';
  }
  return transactionType;
}

// Check if a transaction is administrative based on its flag
function isAdministrativeTransaction(transaction) {
  return transaction.isAdministrative === true;
}

// Validate transaction object structure
function validateTransaction(transaction) {
  const errors = [];
  
  // Check required fields
  if (!transaction.date) {
    errors.push('Missing required field: date');
  }
  
  if (transaction.transactionType === undefined || transaction.transactionType === null) {
    errors.push('Missing required field: transactionType');
  }
  
  if (transaction.description === undefined || transaction.description === null) {
    errors.push('Missing required field: description');
  }
  
  // Validate that null values are explicitly null (not undefined)
  const nullableFields = ['amount', 'nav', 'units', 'unitBalance'];
  for (const field of nullableFields) {
    if (transaction[field] === undefined) {
      console.warn(`Transaction field "${field}" is undefined, should be explicitly null`);
      transaction[field] = null;
    }
  }
  
  // Note: We no longer validate transaction type against a predefined list
  // since transactionType now contains the actual description from the CAS statement
  
  if (errors.length > 0) {
    console.warn('Transaction validation errors:', errors.join(', '));
    return false;
  }
  
  return true;
}

// Extract PAN and KYC
function extractPANAndKYC(folioText) {
  const panMatch = folioText.match(/PAN:\s*([A-Z0-9]+)/);
  const kycMatch = folioText.match(/KYC:\s*([A-Z]+)/);
  
  return {
    pan: panMatch ? panMatch[1] : null,
    kycStatus: kycMatch ? kycMatch[1] : null
  };
}

// Extract ISIN information - Enhanced for multi-line extraction
function extractISINInfo(folioText) {
  const lines = folioText.split('\n');
  let isinLine = '';
  let startIndex = -1;
  
  // Find the line containing ISIN
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('ISIN:')) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) {
    console.warn('ISIN marker not found in folio text');
    return { isinLine: null, schemeName: null, isin: null, registrar: null, advisor: null };
  }
  
  // Look backward to find the start of the scheme name
  // Scheme names typically start with a code like "G201-" or "B205RG-" or similar pattern
  let schemeStartIndex = startIndex;
  for (let i = startIndex; i >= Math.max(0, startIndex - 5); i--) {
    const line = lines[i].trim();
    // Check if line starts with scheme code pattern (letter+digits+hyphen or letters+digits+letters+hyphen)
    if (/^[A-Z]+\d+[A-Z]*-/.test(line)) {
      schemeStartIndex = i;
      break;
    }
  }
  
  // Concatenate lines from scheme start to ISIN line
  for (let i = schemeStartIndex; i <= startIndex; i++) {
    isinLine += ' ' + lines[i].trim();
  }
  
  // Continue forward until we hit "Folio No:" or "Registrar" (if not already in isinLine)
  // Use a maximum of 10 lines as fallback
  const maxLines = Math.min(startIndex + 10, lines.length);
  for (let i = startIndex + 1; i < maxLines; i++) {
    if (lines[i].includes('Folio No:')) {
      break;
    }
    if (lines[i].includes('Registrar') && isinLine.includes('Registrar')) {
      break;
    }
    isinLine += ' ' + lines[i].trim();
  }
  
  // Normalize whitespace - replace multiple spaces/tabs/newlines with single space
  isinLine = isinLine.trim().replace(/\s+/g, ' ');
  
  // Extract components with improved patterns using the complete isinLine
  // Pattern: SchemeCode-SchemeName - ISIN: ISINCode (Advisor: AdvisorCode) Registrar : RegistrarName
  
  // Extract ISIN
  const isinMatch = isinLine.match(/ISIN:\s*([A-Z0-9]+)/);
  
  // Extract Scheme Name: from after scheme code until " - ISIN:" or "- ISIN:"
  // This ensures we get the complete scheme name from the concatenated isinLine
  let schemeName = null;
  const schemeMatch = isinLine.match(/^(.+?)\s*-\s*ISIN:/);
  if (schemeMatch) {
    let fullName = schemeMatch[1].trim();
    // Remove scheme code prefix (e.g., "G357-", "B205RG-", etc.)
    // Pattern: letters+digits+optional letters followed by hyphen at the start
    const withoutPrefix = fullName.replace(/^[A-Z]+\d+[A-Z]*-/, '');
    schemeName = withoutPrefix.trim();
  }
  
  // Extract Advisor: between "Advisor" and "Registrar" or end
  // Pattern: Advisor: ARN-123456 or (Advisor: ARN-123456) or Advisor: DIRECT
  // Matches: ARN-123456, DIRECT, or any alphanumeric code
  const advisorMatch = isinLine.match(/(?:\()?Advisor[:\s]+([A-Z0-9]+-?[A-Z0-9]*)(?:\))?/);
  
  // Extract Registrar: after "Registrar :" until end or "Folio"
  const registrarMatch = isinLine.match(/Registrar\s*:\s*(.+?)(?:\s+Folio|\s*$)/);

  
  return {
    isinLine,
    schemeName,
    isin: isinMatch ? isinMatch[1] : null,
    registrar: registrarMatch ? registrarMatch[1].trim() : null,
    advisor: advisorMatch ? advisorMatch[1].trim() : null
  };
}

// Extract folio and investor details
function extractFolioAndInvestorDetails(folioText) {
  const lines = folioText.split('\n');
  const folioMatch = folioText.match(/Folio No:\s*([\d\/\s]+)/);
  const folioNumber = folioMatch ? folioMatch[1].trim() : null;
  
  let investorName = null;
  let folioLineIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Folio No:')) {
      folioLineIndex = i;
      break;
    }
  }
  
  if (folioLineIndex >= 0 && folioLineIndex + 1 < lines.length) {
    investorName = lines[folioLineIndex + 1].trim();
  }
  
  const nominees = [];
  for (const line of lines) {
    if (line.includes('Nominee')) {
      const nomineeMatches = line.matchAll(/Nominee\s+\d+:\s*([A-Z][A-Z\s]+?)(?=\s+Nominee\s+\d+:|$)/g);
      for (const match of nomineeMatches) {
        const nomineeName = match[1].trim();
        if (nomineeName && !nomineeName.endsWith(':')) {
          nominees.push(nomineeName);
        }
      }
      break;
    }
  }
  
  return { folioNumber, investorName, nominees };
}

// Extract balance and value information
function extractBalanceAndValue(folioText) {
  const openingMatch = folioText.match(/Opening Unit Balance:\s*([\d,]+\.?\d*)/);
  const closingMatch = folioText.match(/Closing Unit Balance:\s*([\d,]+\.?\d*)/);
  const costMatch = folioText.match(/Total Cost Value:\s*([\d,]+\.?\d*)/);
  const marketMatch = folioText.match(/Market Value on.*?INR\s*([\d,]+\.?\d*)/);
  const navMatch = folioText.match(/NAV on.*?INR\s*([\d,]+\.?\d*)/);
  
  return {
    openingUnitBalance: openingMatch ? parseNumericValue(openingMatch[1]) : null,
    closingUnitBalance: closingMatch ? parseNumericValue(closingMatch[1]) : null,
    totalCostValue: costMatch ? parseNumericValue(costMatch[1]) : null,
    marketValue: marketMatch ? parseNumericValue(marketMatch[1]) : null,
    navOnDate: navMatch ? parseNumericValue(navMatch[1]) : null
  };
}

// Parse transactions from folio text
function parseTransactions(folioText) {
  const transactions = [];
  const lines = folioText.split('\n');
  
  let transactionStartIndex = -1;
  let transactionEndIndex = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Opening Unit Balance:')) transactionStartIndex = i + 1;
    if (lines[i].includes('Closing Unit Balance:') || lines[i].includes('NAV on')) {
      transactionEndIndex = i;
      break;
    }
  }
  
  if (transactionStartIndex === -1 || transactionEndIndex === -1) return transactions;
  
  const datePattern = /^(\d{2}-[A-Za-z]{3}-\d{4})/;
  
  for (let i = transactionStartIndex; i < transactionEndIndex; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Check if this line contains *** marker (administrative transaction)
    // Requirements 1.1, 2.1, 2.2: Detect administrative transactions by *** markers
    if (line.includes('***')) {
      // This is an administrative transaction description line
      // Look for the date in the previous line
      let date = null;
      let amount = null;
      
      // Check previous line for date (and possibly amount)
      if (i > transactionStartIndex) {
        const prevLine = lines[i - 1].trim();
        const dateMatch = prevLine.match(datePattern);
        
        if (dateMatch) {
          date = dateMatch[1];
          // Check if there's an amount after the date (for Stamp Duty/STT)
          const restOfPrevLine = prevLine.substring(date.length).trim();
          if (restOfPrevLine) {
            const amountMatch = restOfPrevLine.match(/^([\d,\.]+)/);
            if (amountMatch) {
              amount = parseNumericValue(amountMatch[1]);
            }
          }
        } else {
          // Error handling: Missing date for administrative transaction
          console.warn(`Warning: Administrative transaction found without valid date on previous line. Line ${i}: "${line}"`);
        }
      } else {
        // Error handling: Administrative transaction at start with no previous line
        console.warn(`Warning: Administrative transaction found at start of transaction section without date. Line ${i}: "${line}"`);
      }
      
      // Extract description and validate
      let description = line.trim();
      
      // Error handling: Empty description (only asterisks)
      if (!description || description === '***' || description === '******') {
        console.warn(`Warning: Empty administrative transaction description found. Line ${i}. Using default description.`);
        description = '***Administrative Entry***';
      }
      
      // If we found a date, create the administrative transaction
      if (date) {
        // Classify the transaction to determine if it's administrative
        const classification = classifyTransactionType(description);
        
        // For administrative transactions:
        // - Transaction Type: Use cleaned description (remove *** markers)
        // - Description: Preserve the original text from CAS statement
        const finalTransactionType = cleanTransactionType(description);  // Clean the transaction type
        const finalDescription = description;  // Preserve original description text
        
        // Requirements 1.4, 2.5: Set NAV, units, and unitBalance to null for administrative transactions
        // Requirement 4.2, 4.3, 4.4, 4.5: Maintain consistent structure with explicit null values
        const transaction = {
          date,                    // Requirement 1.2: Extract date
          amount,                  // May be null or have a value for Stamp Duty/STT (Requirements 2.3, 2.4)
          nav: null,              // Requirement 1.4, 2.5: Explicitly null (not undefined)
          units: null,            // Requirement 1.4, 2.5: Explicitly null (not undefined)
          transactionType: finalTransactionType,  // Use description as transaction type
          unitBalance: null,      // Requirement 1.4, 2.5: Explicitly null (not undefined)
          description: finalDescription,  // Requirement 1.2, 4.3: Preserve original description
          isAdministrative: true  // Flag to indicate this is an administrative transaction
        };
        
        // Validate transaction before adding
        if (validateTransaction(transaction)) {
          transactions.push(transaction);
        } else {
          console.warn(`Warning: Invalid administrative transaction skipped. Line ${i}: "${line}"`);
        }
        
        // Skip the previous line in next iteration since we've processed it
        continue;
      } else {
        // Error handling: Malformed administrative transaction (no date found)
        console.warn(`Warning: Malformed administrative transaction skipped (no date found). Line ${i}: "${line}"`);
      }
    }
    
    // Regular financial transaction parsing
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    // Check if the next line contains *** (administrative transaction)
    // If so, skip this line as it will be processed with the *** line
    if (i + 1 < transactionEndIndex && lines[i + 1].trim().includes('***')) {
      continue;
    }
    
    const date = dateMatch[1];
    let restOfLine = line.substring(date.length).trim();
    
    // Skip lines that look like date ranges (e.g., "01-Apr-2014 To 19-Jul-2025")
    // These are PDF headers/footers, not actual transactions
    if (restOfLine.match(/^To\s+\d{2}-[A-Za-z]{3}-\d{4}/i)) {
      continue;
    }
    
    let amount = null, nav = null, units = null, unitBalance = null, description = '';
    
    // Try to extract numeric fields and description more carefully
    // Pattern: DATE AMOUNT NAV UNITS [UNITBALANCE] DESCRIPTION
    // Where AMOUNT and UNITS can be negative (in parentheses)
    // Note: Description might be on the next line
    
    // Split by whitespace but keep track of positions
    const parts = restOfLine.split(/[\s\t]+/);
    let partIndex = 0;
    
    // Try to parse amount (first numeric field, can be negative)
    if (partIndex < parts.length && /^[\(\d,\.\)]+$/.test(parts[partIndex])) {
      amount = parseNumericValue(parts[partIndex]);
      partIndex++;
      
      // Try to parse NAV (second numeric field, always positive)
      if (partIndex < parts.length && /^[\d,\.]+$/.test(parts[partIndex]) && !parts[partIndex].includes('(')) {
        nav = parseNumericValue(parts[partIndex]);
        partIndex++;
        
        // Try to parse units (third numeric field, can be negative)
        if (partIndex < parts.length && /^[\(\d,\.\)]+$/.test(parts[partIndex])) {
          units = parseNumericValue(parts[partIndex]);
          partIndex++;
          
          // Everything remaining is description, except possibly the last number (unit balance)
          const remaining = parts.slice(partIndex);
          
          if (remaining.length > 0) {
            // Check if the last part is a unit balance (positive number at the end)
            const lastPart = remaining[remaining.length - 1];
            if (/^[\d,\.]+$/.test(lastPart) && !lastPart.includes('(') && remaining.length > 1) {
              // Last part looks like a unit balance
              unitBalance = parseNumericValue(lastPart);
              description = remaining.slice(0, -1).join(' ');
            } else {
              // No unit balance, everything is description
              description = remaining.join(' ');
            }
          }
          
          // If description is empty and we have numeric fields, check next line for description
          if (!description && i + 1 < transactionEndIndex) {
            const nextLine = lines[i + 1].trim();
            // Check if next line is not a date line and not empty
            if (nextLine && !datePattern.test(nextLine) && !nextLine.includes('***')) {
              description = nextLine;
              // If the description line ends with a number, it might be the unit balance
              const descParts = description.split(/[\s\t]+/);
              const lastDescPart = descParts[descParts.length - 1];
              if (/^[\d,\.]+$/.test(lastDescPart) && descParts.length > 1) {
                unitBalance = parseNumericValue(lastDescPart);
                description = descParts.slice(0, -1).join(' ');
              }
              // Skip the next line since we've consumed it as description
              i++;
            }
          }
        } else {
          // No units field, rest is description
          description = parts.slice(partIndex).join(' ');
        }
      } else {
        // No NAV field, rest is description
        description = parts.slice(partIndex).join(' ');
      }
    } else {
      // No amount field, everything is description
      description = restOfLine;
    }
    
    // Classify transaction type based on the extracted description
    const classification = classifyTransactionType(description);
    
    // Ensure description is never empty - use transaction type as fallback
    const finalDescription = description.trim() || classification.type;
    
    // Clean the transaction type by removing unnecessary symbols
    const finalTransactionType = cleanTransactionType(finalDescription);
    
    // Requirement 4.2, 4.3, 4.4, 4.5: Ensure consistent structure for all transaction types
    // All transactions must have the same fields in the same order
    if (amount !== null || nav !== null || units !== null || finalDescription) {
      const transaction = {
        date,                          // Always present (Requirement 4.3)
        amount,                        // May be null for administrative transactions (Requirement 4.2)
        nav,                           // May be null for administrative transactions (Requirement 4.2)
        units,                         // May be null for administrative transactions (Requirement 4.2)
        transactionType: finalTransactionType,  // Use cleaned description as transaction type
        unitBalance,                   // May be null for administrative transactions (Requirement 4.2)
        description: finalDescription,  // Always present, preserved exactly (Requirement 4.3)
        isAdministrative: classification.isAdministrative  // Flag to indicate if transaction is administrative
      };
      
      // Validate transaction before adding
      if (validateTransaction(transaction)) {
        transactions.push(transaction);
      } else {
        console.warn(`Warning: Invalid transaction skipped. Date: ${date}, Description: "${description}"`);
      }
    }
  }
  
  return transactions;
}

// Parse folios from fund section
function parseFolios(fundSectionText) {
  const folios = [];
  const panPattern = /^PAN:\s*([A-Z]{5}[0-9]{4}[A-Z])/gm;
  const panMatches = [];
  let match;
  
  while ((match = panPattern.exec(fundSectionText)) !== null) {
    panMatches.push(match.index);
  }
  
  if (panMatches.length === 0) return folios;
  
  for (let i = 0; i < panMatches.length; i++) {
    const startIndex = panMatches[i];
    const endIndex = i < panMatches.length - 1 ? panMatches[i + 1] : fundSectionText.length;
    const folioText = fundSectionText.substring(startIndex, endIndex);
    
    const { pan, kycStatus } = extractPANAndKYC(folioText);
    const { isinLine, schemeName, isin, registrar, advisor } = extractISINInfo(folioText);
    const { folioNumber, investorName, nominees } = extractFolioAndInvestorDetails(folioText);
    const { openingUnitBalance, closingUnitBalance, totalCostValue, marketValue, navOnDate } = extractBalanceAndValue(folioText);
    const transactions = parseTransactions(folioText);
    
    folios.push({
      pan, kycStatus, isinLine, schemeName, isin, folioNumber,
      investorName, nominees, registrar, advisor,
      openingUnitBalance, closingUnitBalance, totalCostValue, marketValue, navOnDate,
      transactions
    });
  }
  
  return folios;
}

// Locate fund sections in text
function locateFundSections(fileContent, fundNames) {
  const fundSections = [];
  
  for (let i = 0; i < fundNames.length; i++) {
    const fundName = fundNames[i];
    const fundNamePattern = new RegExp(`^${escapeRegex(fundName)}$`, 'gm');
    
    const matches = [];
    let match;
    while ((match = fundNamePattern.exec(fileContent)) !== null) {
      matches.push(match.index);
    }
    
    if (matches.length === 0) {
      console.warn(`Warning: Fund "${fundName}" not found`);
      continue;
    }
    
    const startIndex = matches[0];
    let endIndex = fileContent.length;
    
    for (let j = 0; j < fundNames.length; j++) {
      if (i === j) continue;
      const nextFundPattern = new RegExp(`^${escapeRegex(fundNames[j])}$`, 'gm');
      let nextMatch;
      while ((nextMatch = nextFundPattern.exec(fileContent)) !== null) {
        if (nextMatch.index > startIndex && nextMatch.index < endIndex) {
          endIndex = nextMatch.index;
        }
      }
    }
    
    fundSections.push({
      fundName,
      startIndex,
      endIndex,
      sectionText: fileContent.substring(startIndex, endIndex)
    });
  }
  
  fundSections.sort((a, b) => a.startIndex - b.startIndex);
  return fundSections;
}

// Main extraction function
function extractFundTransactions(textContent, portfolioData) {
  try {
    console.log('Starting fund transaction extraction...');
    
    const fundNames = portfolioData.portfolioSummary.map(fund => fund.fundName);
    console.log(`✓ Found ${fundNames.length} funds from portfolio`);
    
    const fundSections = locateFundSections(textContent, fundNames);
    console.log(`✓ Located ${fundSections.length} fund sections`);
    
    let totalFolios = 0;
    fundSections.forEach(section => {
      section.folios = parseFolios(section.sectionText);
      totalFolios += section.folios.length;
      console.log(`  - ${section.fundName}: ${section.folios.length} folios`);
    });
    
    console.log(`✓ Parsed ${totalFolios} folios across all funds`);
    
    const funds = fundSections.map(section => ({
      fundName: section.fundName,
      folios: section.folios
    }));
    
    return {
      funds,
      totalFolios,
      totalFunds: funds.length
    };
    
  } catch (error) {
    console.error('Error during fund transaction extraction:', error.message);
    throw error;
  }
}

module.exports = {
  extractFundTransactions,
  parseNumericValue,
  classifyTransactionType,
  validateTransactionType,
  validateTransaction,
  isAdministrativeTransaction,  // Export for checking administrative transactions
  extractISINInfo,  // Export for testing
  parseTransactions,  // Export for testing
  VALID_TRANSACTION_TYPES  // Export for testing
};
