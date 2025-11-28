# Output Formats Guide

The CAS PDF Extractor now supports multiple output formats and customizable Excel sheet generation.

## Output Formats

### 1. Excel Format (Default)
- **File Extension**: `.xlsx`
- **Content**: Formatted spreadsheet with selected sheets
- **Use Case**: Best for data analysis, reporting, and sharing with stakeholders
- **Features**:
  - Professional formatting with headers
  - Number formatting (currency, decimals)
  - Frozen header rows
  - Color-coded headers

### 2. JSON Format
- **File Extension**: `.json`
- **Content**: Complete structured data including metadata
- **Use Case**: Best for programmatic access, APIs, and data integration
- **Structure**:
  ```json
  {
    "metadata": {
      "extractedAt": "ISO timestamp",
      "sourceFile": "original filename",
      "summary": {
        "totalFunds": number,
        "totalFolios": number,
        "totalTransactions": number
      }
    },
    "portfolioData": { ... },
    "transactionData": { ... },
    "rawText": "extracted PDF text"
  }
  ```

### 3. Text Format
- **File Extension**: `.txt`
- **Content**: Raw extracted text from PDF
- **Use Case**: Best for debugging, text analysis, or custom parsing
- **Features**: Plain text with all content extracted from the PDF

## Excel Sheet Selection

When using Excel format, you can choose which sheets to generate:

### Available Sheets

1. **Portfolio Summary**
   - Fund-wise summary
   - Cost value and market value
   - Aggregated by fund house

2. **Transactions**
   - Complete transaction history
   - Folio number, scheme name, ISIN
   - Date, type, amount, NAV, units
   - Running unit balance
   - Administrative transaction handling
   - Multi-line description support

3. **MF Holdings**
   - Current holdings by folio
   - Opening and closing unit balances
   - NAV, cost value, market value
   - Advisor and PAN details

### Selection Options

- **All Sheets** (Default): Generate complete report with all three sheets
- **Custom Selection**: Choose specific sheets based on your needs
  - Select only Portfolio Summary for quick overview
  - Select Transactions for detailed history
  - Select Holdings for current positions

## API Usage

### Request Parameters

```javascript
POST /api/extract-cas

FormData:
- pdf: File (required)
- password: String (optional)
- outputFormat: String (optional) - 'excel' | 'json' | 'text'
- sheets: JSON String (optional) - ['portfolio', 'transactions', 'holdings']
```

### Example: Excel with Selected Sheets

```javascript
const formData = new FormData();
formData.append('pdf', file);
formData.append('outputFormat', 'excel');
formData.append('sheets', JSON.stringify(['portfolio', 'holdings']));
```

### Example: JSON Output

```javascript
const formData = new FormData();
formData.append('pdf', file);
formData.append('outputFormat', 'json');
```

### Example: Text Output

```javascript
const formData = new FormData();
formData.append('pdf', file);
formData.append('outputFormat', 'text');
```

## Response

All formats return a downloadable file with appropriate:
- Content-Type header
- Content-Disposition header with filename
- Proper file extension

## File Naming Convention

- **Excel**: `{original_name}_CAS_Report_{timestamp}.xlsx`
- **JSON**: `{original_name}_CAS_Data_{timestamp}.json`
- **Text**: `{original_name}_CAS_Extracted_{timestamp}.txt`

## Use Cases

### For Financial Advisors
- Use **Excel** with all sheets for comprehensive client reports
- Professional formatting ready for presentations

### For Developers
- Use **JSON** for integrating with other systems
- Complete data structure for custom processing

### For Data Analysis
- Use **Text** for custom parsing or NLP analysis
- Raw data without any formatting

### For Quick Review
- Use **Excel** with only Portfolio Summary sheet
- Fast generation for quick portfolio overview

## Transaction Data Structure

### Transaction Fields

Each transaction in the JSON output contains the following fields:

```json
{
  "date": "27-Sep-2023",
  "amount": -50000,
  "nav": 23.4671,
  "units": -2130.664,
  "transactionType": "Switch-Out - To ABSL Small Cap Fund Growth, less STT",
  "unitBalance": 10740.804,
  "description": "*Switch-Out - To ABSL Small Cap Fund Growth, less STT",
  "isAdministrative": false
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `date` | String | Transaction date in DD-MMM-YYYY format |
| `amount` | Number/null | Transaction amount (negative for redemptions/switches) |
| `nav` | Number/null | Net Asset Value at transaction time |
| `units` | Number/null | Units transacted (negative for redemptions) |
| `transactionType` | String | Cleaned transaction type (symbols removed) |
| `unitBalance` | Number/null | Running unit balance after transaction |
| `description` | String | Original description from CAS (preserves symbols) |
| `isAdministrative` | Boolean | `true` for administrative transactions, `false` for financial |

### Transaction Types

**Financial Transactions** (`isAdministrative: false`):
- Purchase
- Redemption
- Switch-In
- Switch-Out
- Systematic Investment
- Dividend

**Administrative Transactions** (`isAdministrative: true`):
- Stamp Duty
- STT Paid
- Address Updates
- Nominee Registration
- KYC Updates
- Bank Mandate Changes
- Other administrative entries

### Key Features

1. **Clean Transaction Types**: The `transactionType` field has symbols removed for easy display
   - `***STT Paid***` → `STT Paid`
   - `*Switch-Out - To Fund` → `Switch-Out - To Fund`

2. **Original Description Preserved**: The `description` field keeps the original text with all symbols

3. **Administrative Flag**: Use `isAdministrative` to filter or categorize transactions

4. **Multi-line Support**: Descriptions spanning multiple lines in the PDF are correctly extracted

5. **Null Handling**: Administrative transactions have `null` for NAV, units, and unitBalance (except Stamp Duty/STT which may have amounts)

## Notes

- All formats contain the same underlying data
- Excel format provides the best visual presentation
- JSON format provides the most flexibility for processing
- Text format provides the raw extracted content
- Sheet selection only applies to Excel format
- At least one sheet must be selected for Excel format
- Transaction types are automatically cleaned for better readability
- Administrative transactions are properly identified and flagged
