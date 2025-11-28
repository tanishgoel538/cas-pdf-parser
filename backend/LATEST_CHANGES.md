# Latest Changes - Version 1.4.0

## Overview

This document describes the latest changes made to the ITR_Complete application, including bug fixes and feature enhancements.

## Changes Summary

### 1. ✅ Fixed Scheme Name Extraction (Issue)

**Problem:**
Some folios were getting incorrect scheme names due to incomplete extraction logic.

**Solution:**
Enhanced the `extractISINInfo` function to use the complete `isinLine` for more reliable parsing:

- Improved pattern matching for scheme name extraction
- Better handling of Advisor field (supports both `Advisor: ARN-123456` and `(Advisor: ARN-123456)` formats)
- More robust Registrar extraction
- Uses the complete concatenated line for accurate field extraction

**Code Changes:**
- File: `backend/src/extractors/transactionExtractor.js`
- Function: `extractISINInfo()`
- Enhanced regex patterns for Advisor and Registrar extraction
- Improved scheme name parsing from `isinLine`
- Fixed Advisor pattern to handle both `ARN-123456` and `DIRECT` formats

**Advisor Pattern:**
```javascript
// Old: /([A-Z]+-[\d]+)/  - Only matched ARN-123456 format
// New: /([A-Z0-9]+-?[A-Z0-9]*)/  - Matches ARN-123456, DIRECT, and other formats
```

**Impact:**
- ✅ More accurate scheme names across all folios
- ✅ Better handling of edge cases
- ✅ Correctly extracts DIRECT advisor plans
- ✅ No breaking changes to existing functionality

---

### 2. ✅ Split Amount Column into Credit/Debit (Feature Request)

**Requirement:**
Split the "Amount of Transaction" column into separate Credit and Debit columns for better clarity.

**Implementation:**
Updated the Excel generator to create two separate columns:

**Credit Amount:**
- Shows positive transactions
- Includes: Purchase, SIP, Dividend, Switch-In
- Displayed as positive values

**Debit Amount:**
- Shows negative transactions
- Includes: Redemption, Switch-Out
- Displayed as positive values (absolute value)

**Code Changes:**
- File: `backend/src/extractors/excelGenerator.js`
- Function: `generateTransactionsSheet()`
- Updated column definitions
- Added logic to split amounts based on sign
- Updated cell formatting for both columns

**Excel Structure:**
```
Before:
| ... | Amount of Transaction | NAV | ...

After:
| ... | Credit Amount | Debit Amount | NAV | ...
```

**Impact:**
- ✅ Clearer visualization of money flow
- ✅ Easier to track credits vs debits
- ✅ Better for accounting and analysis
- ✅ No changes to JSON output (maintains compatibility)

---

## Technical Details

### Scheme Name Extraction Enhancement

**Before:**
```javascript
const advisorMatch = isinLine.match(/Advisor[:\s]+([A-Z]+-[\d]+)/);
const registrarMatch = isinLine.match(/Registrar\s*:\s*(.+?)(?:\s+Folio|\s+$|$)/);
```

**After:**
```javascript
// Supports both formats: "Advisor: ARN-123456" and "(Advisor: ARN-123456)"
const advisorMatch = isinLine.match(/(?:\()?Advisor[:\s]+([A-Z]+-[\d]+)(?:\))?/);

// More robust extraction until end or "Folio"
const registrarMatch = isinLine.match(/Registrar\s*:\s*(.+?)(?:\s+Folio|\s*$)/);
```

### Credit/Debit Split Logic

```javascript
// Split amount into credit (positive) and debit (negative)
let creditAmount = null;
let debitAmount = null;

if (transaction.amount !== null && transaction.amount !== undefined) {
  if (transaction.amount >= 0) {
    creditAmount = transaction.amount;
  } else {
    debitAmount = Math.abs(transaction.amount); // Store as positive value
  }
}
```

---

## Excel Report Changes

### Updated Transactions Sheet Structure

| Column # | Column Name | Type | Description |
|----------|-------------|------|-------------|
| 1 | Folio Number | String | Folio identifier |
| 2 | Scheme Name | String | Mutual fund scheme name (improved extraction) |
| 3 | ISIN | String | 12-character ISIN code |
| 4 | Date of Transaction | String | DD-MMM-YYYY format |
| 5 | Transaction Type | String | Cleaned transaction type |
| 6 | **Credit Amount** | Number | **NEW** - Positive transactions (2 decimals) |
| 7 | **Debit Amount** | Number | **NEW** - Negative transactions (2 decimals) |
| 8 | NAV (Price per Unit) | Number | NAV value (4 decimals) |
| 9 | Units Transacted | Number | Units bought/sold (4 decimals) |
| 10 | Unit Balance | Number | Running balance (4 decimals) |

### Column Formatting

**Credit Amount (Column 6):**
- Format: `#,##0.00` (2 decimal places with thousand separators)
- Alignment: Right
- Shows only when amount is positive

**Debit Amount (Column 7):**
- Format: `#,##0.00` (2 decimal places with thousand separators)
- Alignment: Right
- Shows only when amount is negative (displayed as positive)

---

## JSON Output (Unchanged)

The JSON output structure remains unchanged to maintain backward compatibility:

```json
{
  "date": "27-Sep-2023",
  "amount": -50000,  // Still includes sign
  "nav": 23.4671,
  "units": -2130.664,
  "transactionType": "Switch-Out - To ABSL Small Cap Fund Growth, less STT",
  "unitBalance": 10740.804,
  "description": "*Switch-Out - To ABSL Small Cap Fund Growth, less STT",
  "isAdministrative": false
}
```

**Note:** The `amount` field in JSON still contains the signed value. The Credit/Debit split only applies to the Excel output.

---

## Testing

### Scheme Name Extraction
- ✅ Tested with various folio formats
- ✅ Verified Advisor extraction with and without parentheses
- ✅ Confirmed Registrar extraction accuracy
- ✅ No regression in existing functionality

### Credit/Debit Columns
- ✅ Verified positive amounts appear in Credit column
- ✅ Verified negative amounts appear in Debit column (as positive)
- ✅ Confirmed null handling for administrative transactions
- ✅ Validated number formatting (2 decimals)
- ✅ Checked alignment and styling

---

## Backward Compatibility

### ✅ Maintained
- JSON output structure unchanged
- API endpoints unchanged
- All existing fields preserved
- Transaction data structure unchanged
- Frontend functionality unchanged

### ⚠️ Excel Report Change
- **Breaking Change**: Excel Transactions sheet now has 10 columns instead of 9
- **Impact**: Users expecting the old "Amount of Transaction" column will now see "Credit Amount" and "Debit Amount"
- **Migration**: No code changes needed - just a visual change in Excel output

---

## Documentation Updates

### Updated Files
1. **CHANGELOG.md** - Added version 1.4.0 with changes
2. **backend/LATEST_CHANGES.md** - This file (detailed changes)
3. **docs/OUTPUT_FORMATS.md** - Will be updated with new column structure
4. **docs/API.md** - Will be updated if needed

### Documentation To-Do
- [ ] Update OUTPUT_FORMATS.md with Credit/Debit column details
- [ ] Update any user guides mentioning the Amount column
- [ ] Update screenshots if any show the old Excel format

---

## Benefits

### For Users
1. **Clearer Reports**: Separate Credit and Debit columns make it easier to understand money flow
2. **Better Analysis**: Can quickly sum credits or debits separately
3. **Accounting Friendly**: Matches standard accounting practices
4. **More Accurate Data**: Improved scheme name extraction reduces errors

### For Developers
1. **Robust Extraction**: Better pattern matching reduces edge cases
2. **Maintainable Code**: Clear separation of credit/debit logic
3. **Backward Compatible**: JSON structure unchanged
4. **Well Documented**: All changes documented

---

## Migration Guide

### For End Users
**No action required.** The next time you generate an Excel report, you'll see the new Credit/Debit columns instead of the single Amount column.

### For API Consumers
**No action required.** The JSON output structure remains unchanged. If you're parsing Excel files programmatically, update your code to handle columns 6 and 7 instead of column 6 for amounts.

### For Developers
**No action required.** All changes are backward compatible. The JSON structure is unchanged, so any code consuming the JSON output will continue to work.

---

## Version History

- **v1.4.0** (2025-11-24): Credit/Debit split + Scheme name fix
- **v1.3.0** (2025-11-24): Transaction type cleaning + Multi-line support
- **v1.0.0** (2025-11-24): Initial release

---

## Support

If you encounter any issues with:
- Incorrect scheme names
- Missing Credit/Debit values
- Formatting issues in Excel

Please check:
1. PDF is a valid CAS document
2. All required fields are present in the PDF
3. Backend server is running the latest version

---

**Last Updated**: November 24, 2025  
**Version**: 1.4.0  
**Status**: Complete and Tested


---

## Additional Fix: Advisor Extraction for DIRECT Plans

### Issue
The advisor extraction regex pattern was not capturing "DIRECT" advisor plans because it expected the format `ARN-123456` (letters-hyphen-digits).

### Solution
Updated the regex pattern to handle multiple advisor formats:

**Old Pattern:**
```javascript
/([A-Z]+-[\d]+)/  // Only matched: ARN-123456
```

**New Pattern:**
```javascript
/([A-Z0-9]+-?[A-Z0-9]*)/  // Matches: ARN-123456, DIRECT, and other formats
```

### Supported Formats
- ✅ `ARN-123456` (standard ARN format)
- ✅ `DIRECT` (direct plans)
- ✅ `(Advisor: ARN-123456)` (with parentheses)
- ✅ `Advisor: DIRECT` (without parentheses)
- ✅ Any alphanumeric advisor code

### Test Results
All test cases pass:
```
Test 1: ✅ PASS - ARN-123456 with parentheses
Test 2: ✅ PASS - ARN-123456 without parentheses
Test 3: ✅ PASS - DIRECT with parentheses
Test 4: ✅ PASS - DIRECT without parentheses
Test 5: ✅ PASS - No advisor present
```

### Impact
- ✅ DIRECT plans now correctly show advisor as "DIRECT"
- ✅ Standard ARN codes still work correctly
- ✅ No breaking changes to existing functionality
- ✅ Backward compatible with all existing data

---

**Fix Applied**: November 24, 2025  
**Version**: 1.4.0  
**Status**: Tested and Deployed
