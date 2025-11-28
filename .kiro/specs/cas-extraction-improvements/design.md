# Design Document: CAS Extraction Improvements

## Overview

This design enhances the CAS PDF extraction system to handle multi-line scheme names and ISIN information, and to properly identify and flag administrative transactions. The improvements focus on two key areas:

1. **Robust Multi-line Field Extraction**: Improving the `extractISINInfo` function to handle scheme names and ISIN data that span multiple lines
2. **Administrative Transaction Tracking**: Enhancing transaction classification to identify and flag administrative transactions with an `isAdministrative` boolean field

## Architecture

The solution involves modifications to existing extraction components without changing the overall architecture:

```
PDF File → PDF Extractor → Text Content
                ↓
        Transaction Extractor
                ↓
        ┌───────┴───────┐
        ↓               ↓
  extractISINInfo   parseTransactions
  (Enhanced)        (Enhanced)
        ↓               ↓
    Folio Data    Transaction Data
                  (with isAdministrative)
                ↓
        Excel Generator
        (Enhanced)
                ↓
        Excel Output
```

### Components Affected

1. **transactionExtractor.js**
   - `extractISINInfo()` - Enhanced multi-line parsing
   - `parseTransactions()` - Enhanced to set isAdministrative flag
   - `classifyTransactionType()` - Already identifies administrative transactions

2. **excelGenerator.js**
   - Enhanced to include "Is Administrative" column in transaction sheets

## Components and Interfaces

### Enhanced extractISINInfo Function

**Current Behavior:**
- Looks ahead only 3 lines from "ISIN:" marker
- Stops at "Folio No:" or after 3 lines
- Fails when scheme name spans more than expected lines

**Enhanced Behavior:**
```javascript
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
    return { isinLine: null, schemeName: null, isin: null, registrar: null, advisor: null };
  }
  
  // Look backward to find the start of the scheme name
  // Scheme names typically start with a code like "G201-" or similar pattern
  let schemeStartIndex = startIndex;
  for (let i = startIndex; i >= Math.max(0, startIndex - 5); i--) {
    const line = lines[i].trim();
    // Check if line starts with scheme code pattern (letter+digits+hyphen)
    if (/^[A-Z]\d+-/.test(line)) {
      schemeStartIndex = i;
      break;
    }
  }
  
  // Concatenate lines from scheme start to ISIN line
  for (let i = schemeStartIndex; i <= startIndex; i++) {
    isinLine += ' ' + lines[i].trim();
  }
  
  // Continue forward until we hit "Folio No:" or "Registrar"
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('Folio No:')) break;
    if (lines[i].includes('Registrar') && isinLine.includes('Registrar')) break;
    isinLine += ' ' + lines[i].trim();
  }
  
  // Normalize whitespace
  isinLine = isinLine.trim().replace(/\s+/g, ' ');
  
  // Extract components
  const isinMatch = isinLine.match(/ISIN:\s*([A-Z0-9]+)/);
  const schemeMatch = isinLine.match(/^[A-Z]\d+-(.+?)\s*(?:-\s*ISIN:|ISIN:)/);
  const registrarMatch = isinLine.match(/Registrar\s*:\s*(.+?)(?:\s+Folio|$)/);
  const advisorMatch = isinLine.match(/Advisor:\s*([A-Z]+-[\d]+)/);
  
  return {
    isinLine,
    schemeName: schemeMatch ? schemeMatch[1].trim() : null,
    isin: isinMatch ? isinMatch[1] : null,
    registrar: registrarMatch ? registrarMatch[1].trim() : null,
    advisor: advisorMatch ? advisorMatch[1].trim() : null
  };
}
```

**Key Improvements:**
- Looks backward from ISIN line to find scheme name start (identified by pattern like "G201-")
- Concatenates all lines from scheme start through ISIN line
- Continues forward until hitting "Folio No:" boundary
- Normalizes whitespace in the final concatenated string
- More robust pattern matching for scheme name extraction

### Enhanced Transaction Parsing

**Current Behavior:**
- `classifyTransactionType()` identifies administrative transactions
- Transaction objects don't include `isAdministrative` field
- Stamp duty transactions lose their description during parsing

**Enhanced Behavior:**
```javascript
function parseTransactions(folioText) {
  // ... existing parsing logic ...
  
  for (let i = transactionStartIndex; i < transactionEndIndex; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const dateMatch = line.match(datePattern);
    if (!dateMatch) continue;
    
    const date = dateMatch[1];
    let restOfLine = line.substring(date.length).trim();
    
    // Check if this is an administrative transaction line
    // These often appear as standalone lines with *** markers
    const isAdminLine = restOfLine.includes('***');
    
    let amount = null, nav = null, units = null, unitBalance = null, description = '';
    
    // ... existing parsing logic ...
    
    const transactionType = classifyTransactionType(description);
    const isAdministrative = transactionType === 'Stamp Duty' || 
                            transactionType === 'STT Paid' || 
                            transactionType === 'Administrative' ||
                            isAdminLine;
    
    if (amount !== null || nav !== null || units !== null || description) {
      transactions.push({
        date,
        amount,
        nav,
        units,
        transactionType,
        unitBalance,
        description: description.trim(),
        isAdministrative  // NEW FIELD
      });
    }
  }
  
  return transactions;
}
```

**Key Improvements:**
- Adds `isAdministrative` boolean field to every transaction
- Detects administrative transactions by checking transaction type
- Also checks for "***" markers in the line content
- Preserves administrative transaction descriptions

### Enhanced classifyTransactionType Function

The existing function already handles most cases, but we'll ensure it's comprehensive:

```javascript
function classifyTransactionType(description) {
  const desc = description.toLowerCase();
  
  // Administrative transactions
  if (description.includes('***')) {
    if (desc.includes('stamp duty')) return 'Stamp Duty';
    if (desc.includes('stt paid') || desc.includes('stt')) return 'STT Paid';
    if (desc.includes('address updated')) return 'Administrative';
    if (desc.includes('registration of nominee')) return 'Administrative';
    if (desc.includes('can data updation')) return 'Administrative';
    if (desc.includes('bank mandate')) return 'Administrative';
    return 'Administrative';
  }
  
  // Investment transactions
  if (desc.includes('systematic investment') || desc.includes('sip')) return 'Systematic Investment';
  if (desc.includes('switch-out') || desc.includes('switchout')) return 'Switch-Out';
  if (desc.includes('switch-in') || desc.includes('switchin')) return 'Switch-In';
  if (desc.includes('redemption') || desc.includes('redeem')) return 'Redemption';
  if (desc.includes('dividend')) return 'Dividend';
  if (desc.includes('purchase')) return 'Purchase';
  
  return 'Purchase';
}
```

### Enhanced Excel Generator

**Current Behavior:**
- Generates transaction sheets without administrative transaction tracking

**Enhanced Behavior:**
```javascript
// In the transaction sheet generation section
// No separate "Is Administrative" column needed
// Administrative transactions are identified by their Transaction Type
worksheet.columns = [
  { header: 'Folio Number', key: 'folioNumber', width: 15 },
  { header: 'Scheme Name', key: 'schemeName', width: 50 },
  { header: 'ISIN', key: 'isin', width: 15 },
  { header: 'Date of Transaction', key: 'date', width: 20 },
  { header: 'Transaction Type', key: 'transactionType', width: 20 },  // Shows "Stamp Duty", "STT Paid", "Administrative", etc.
  { header: 'Amount of Transaction', key: 'amount', width: 25 },
  { header: 'NAV (Price per Unit)', key: 'nav', width: 20 },
  { header: 'Units Transacted', key: 'units', width: 18 },
  { header: 'Unit Balance', key: 'unitBalance', width: 18 }
];

// When adding rows - no changes needed, transaction type already shows administrative classification
worksheet.addRow({
  folioNumber: folio.folioNumber,
  schemeName: folio.schemeName,
  isin: folio.isin,
  date: transaction.date,
  transactionType: transaction.transactionType,  // Will show "Stamp Duty", "STT Paid", "Administrative", etc.
  amount: transaction.amount,
  nav: transaction.nav,
  units: transaction.units,
  unitBalance: transaction.unitBalance
});
```

**Key Points:**
- Administrative transactions are identified by their `transactionType` value ("Stamp Duty", "STT Paid", "Administrative")
- No separate column needed - users can filter/identify administrative transactions by the Transaction Type column
- The `isAdministrative` boolean field remains in the data model for programmatic access but is not displayed as a separate column

## Data Models

### Transaction Object (Enhanced)

```javascript
{
  date: string,              // "DD-MMM-YYYY"
  amount: number | null,     // Transaction amount
  nav: number | null,        // Net Asset Value
  units: number | null,      // Units transacted
  transactionType: string,   // Classification
  unitBalance: number | null,// Balance after transaction
  description: string,       // Transaction description
  isAdministrative: boolean  // NEW: True if administrative transaction
}
```

### Folio Object (Enhanced)

```javascript
{
  pan: string,
  kycStatus: string,
  isinLine: string,          // ENHANCED: Complete multi-line ISIN info
  schemeName: string | null, // ENHANCED: Properly extracted from multi-line
  isin: string,
  folioNumber: string,
  investorName: string,
  nominees: string[],
  registrar: string,
  advisor: string,
  openingUnitBalance: number,
  closingUnitBalance: number,
  totalCostValue: number,
  marketValue: number,
  navOnDate: number,
  transactions: Transaction[] // With isAdministrative field
}
```

## Correctness Properties


*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Multi-line scheme name completeness
*For any* scheme name that spans multiple lines in the CAS text, the extracted `schemeName` field should contain all text from the scheme code prefix through the ISIN marker without truncation
**Validates: Requirements 1.1, 1.3**

### Property 2: ISIN line continuation
*For any* ISIN information that spans multiple lines, the extracted `isinLine` field should contain all text from the scheme name start through the Registrar information
**Validates: Requirements 1.2**

### Property 3: Special character preservation
*For any* scheme name containing special characters (hyphens, parentheses, ampersands), the extracted `schemeName` should preserve these characters exactly as they appear in the source
**Validates: Requirements 1.4**

### Property 4: Administrative transaction classification
*For any* transaction description containing "***" markers, the transaction's `isAdministrative` field should be set to true
**Validates: Requirements 2.2**

### Property 5: Stamp duty and STT classification
*For any* transaction with description containing "stamp duty" or "STT", the transaction's `isAdministrative` field should be set to true
**Validates: Requirements 2.3**

### Property 6: Transaction administrative field presence
*For any* transaction object in the extracted data, the `isAdministrative` field should be present and set to either true or false
**Validates: Requirements 2.1, 2.4**

### Property 7: Field boundary detection
*For any* multi-line field extraction, the system should stop reading lines when it encounters the next field boundary marker (e.g., "Folio No:", "Registrar") regardless of line count
**Validates: Requirements 3.2**

### Property 8: Whitespace normalization
*For any* extracted multi-line field, consecutive whitespace characters (spaces, tabs, newlines) should be normalized to single spaces in the final output
**Validates: Requirements 3.3**

### Property 9: Required field validation
*For any* successfully extracted folio, all required fields (pan, isin, folioNumber, schemeName) should be non-null
**Validates: Requirements 3.5**

## Error Handling

### Multi-line Extraction Errors

**Scenario**: Scheme name or ISIN cannot be found
- **Handling**: Return null for schemeName, log warning with folio context
- **Recovery**: Continue processing other folios

**Scenario**: Field boundary markers not found
- **Handling**: Use fallback line limit (10 lines maximum)
- **Recovery**: Log warning, attempt extraction with available data

### Transaction Classification Errors

**Scenario**: Transaction description is empty or malformed
- **Handling**: Default to `isAdministrative: false`, classify as "Purchase"
- **Recovery**: Log warning with transaction date and folio number

**Scenario**: Unable to parse transaction line
- **Handling**: Skip transaction, log detailed error
- **Recovery**: Continue with next transaction

### Excel Generation Errors

**Scenario**: Transaction missing isAdministrative field
- **Handling**: Default to "No" in Excel output
- **Recovery**: Log warning about missing field

## Testing Strategy

### Unit Testing

**extractISINInfo Function Tests:**
1. Single-line scheme name (baseline)
2. Two-line scheme name
3. Three-line scheme name with special characters
4. Scheme name with parentheses and "Formerly Known as" text
5. Missing ISIN marker
6. Missing scheme code prefix
7. Whitespace variations (tabs, multiple spaces)

**classifyTransactionType Function Tests:**
1. Stamp duty transaction
2. STT paid transaction
3. Administrative transactions (address update, nominee registration)
4. Investment transactions (purchase, redemption, switch)
5. Empty description
6. Description with mixed case

**parseTransactions Function Tests:**
1. Transaction with isAdministrative true
2. Transaction with isAdministrative false
3. Stamp duty transaction (0.25 amount)
4. Mixed administrative and investment transactions

**Excel Generator Tests:**
1. Verify Transaction Type column shows "Stamp Duty" for stamp duty transactions
2. Verify Transaction Type column shows "STT Paid" for STT transactions
3. Verify Transaction Type column shows "Administrative" for other administrative transactions
4. Verify no separate "Is Administrative" column exists

### Integration Testing

1. **End-to-end test with sample CAS**:
   - Use the actual CAS file with folio 2772992/35
   - Verify scheme name is extracted correctly
   - Verify stamp duty transactions are flagged as administrative
   - Verify Excel output includes administrative column

2. **Multi-folio test**:
   - Process CAS with multiple folios having multi-line scheme names
   - Verify all scheme names extracted correctly
   - Verify no cross-contamination between folios

3. **Administrative transaction test**:
   - Process CAS with various administrative transaction types
   - Verify all are correctly flagged
   - Verify Excel output is correct

### Property-Based Testing

We will use a property-based testing library appropriate for JavaScript (such as fast-check) to verify the correctness properties. Each property test should run a minimum of 100 iterations.

**Property Test 1: Multi-line scheme name completeness**
- Generate random scheme names split across 1-5 lines
- Verify extracted scheme name contains all original text
- **Feature: cas-extraction-improvements, Property 1**

**Property Test 2: Administrative flag consistency**
- Generate random transaction descriptions with/without *** markers
- Verify isAdministrative matches presence of *** markers
- **Feature: cas-extraction-improvements, Property 4**

**Property Test 3: Whitespace normalization**
- Generate text with random whitespace patterns
- Verify output has normalized single spaces
- **Feature: cas-extraction-improvements, Property 8**

**Property Test 4: Required fields validation**
- Generate random folio data
- Verify all required fields are present when extraction succeeds
- **Feature: cas-extraction-improvements, Property 9**

### Manual Testing

1. Upload the problematic CAS file with folio 2772992/35
2. Verify the extracted JSON has correct scheme name
3. Verify the Excel output has "Is Administrative" column
4. Verify stamp duty transactions show "Yes" in administrative column
5. Compare with ITR2 output format for consistency

## Implementation Notes

### Backward Compatibility

- The `isAdministrative` field is additive - existing code will continue to work
- Existing Excel files won't have the new column, but new exports will
- The enhanced `extractISINInfo` should handle both single-line and multi-line cases

### Performance Considerations

- Looking backward/forward through lines adds minimal overhead
- Maximum lookback is 5 lines, maximum lookahead until field boundary
- No significant performance impact expected

### Logging Enhancements

Add detailed logging for debugging:
```javascript
console.log(`Extracting ISIN info: found ISIN at line ${startIndex}`);
console.log(`Scheme starts at line ${schemeStartIndex}`);
console.log(`Extracted scheme name: ${schemeName}`);
console.log(`Classified transaction as administrative: ${isAdministrative}`);
```

## Future Enhancements

1. **Machine Learning Classification**: Use ML to classify transaction types based on patterns
2. **Configurable Administrative Rules**: Allow users to define custom administrative transaction patterns
3. **Validation Dashboard**: UI to review and correct misclassified transactions
4. **Historical Comparison**: Compare administrative transaction counts across periods
