# Design Document - CAS Data Extractor

## Overview

The CAS Data Extractor is a full-stack application built with React frontend and Node.js/Express backend. It processes Consolidated Account Statement (CAS) PDF files to extract mutual fund investment data and generate reports in multiple formats (Excel, JSON, Text). The system handles complex extraction scenarios including multi-line data fields, administrative transactions, and password-protected PDFs.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend (Port 3000)                │
│  - PDFUploader Component (file upload, options, progress)   │
│  - ProgressBar Component (visual feedback)                  │
│  - Dark Mode Support                                         │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP/REST API
                       │ (multipart/form-data)
┌──────────────────────▼──────────────────────────────────────┐
│              Express Backend (Port 5000)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Routes Layer (casRoutes.js)                          │  │
│  │  - POST /api/extract-cas                              │  │
│  │  - GET /health, /api/status                           │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Middleware Layer                                      │  │
│  │  - Multer (file upload)                               │  │
│  │  - CORS                                                │  │
│  │  - Error handling                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Extraction Pipeline                                   │  │
│  │  1. pdfExtractor.js → Extract text                    │  │
│  │  2. portfolioExtractor.js → Parse portfolio           │  │
│  │  3. transactionExtractor.js → Parse transactions      │  │
│  │  4. excelGenerator.js → Generate output               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 (UI framework)
- Axios (HTTP client)
- CSS3 (styling with animations)
- HTML5 Drag & Drop API

**Backend:**
- Node.js (runtime)
- Express (web framework)
- Multer (file upload)
- pdf-parse (PDF text extraction)
- ExcelJS (Excel generation)
- CORS (cross-origin support)

**Testing:**
- Jest (test runner)
- fast-check (property-based testing)

## Components and Interfaces

### Frontend Components

#### PDFUploader Component
```javascript
Props:
  - darkMode: boolean

State:
  - file: File | null
  - password: string
  - outputFormat: 'excel' | 'json' | 'text'
  - selectedSheets: { portfolio: boolean, transactions: boolean, holdings: boolean }
  - loading: boolean
  - progress: number (0-100)
  - status: string
  - error: string
  - summary: object | null

Methods:
  - handleFileSelection(file)
  - handleUpload()
  - handleSheetToggle(sheetName)
  - clearFile()
```

#### ProgressBar Component
```javascript
Props:
  - progress: number (0-100)

Renders:
  - Animated progress bar with shimmer effect
  - Percentage display
```

### Backend API

#### POST /api/extract-cas
```
Request:
  Content-Type: multipart/form-data
  Body:
    - pdf: File (required)
    - password: string (optional)
    - outputFormat: 'excel' | 'json' | 'text' (optional, default: 'excel')
    - sheets: JSON string array (optional, default: ['portfolio', 'transactions', 'holdings'])

Response:
  Success (200):
    - Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet | application/json | text/plain
    - Body: File blob
    - Headers: Content-Disposition with filename
  
  Error (400/500):
    - Content-Type: application/json
    - Body: { error: string, message: string, details?: string }
```

### Extraction Modules

#### pdfExtractor.js
```javascript
extractTextFromPDF(pdfPath, password?)
  Input: PDF file path, optional password
  Output: string (concatenated text from all pages)
  Errors: Password errors, parsing errors
```

#### portfolioExtractor.js
```javascript
extractPortfolioSummary(textContent)
  Input: string (PDF text)
  Output: {
    portfolioSummary: Array<{fundName, costValue, marketValue}>,
    fundCount: number
  }
  Logic:
    - Locate "Consolidated Portfolio Summary" section
    - Parse table rows
    - Extract fund names and numeric values
```

#### transactionExtractor.js
```javascript
extractFundTransactions(textContent, portfolioData)
  Input: string (PDF text), portfolioData object
  Output: {
    funds: Array<{fundName, folios: Array<FolioData>}>,
    totalFolios: number,
    totalFunds: number
  }
  
  Key Functions:
    - locateFundSections(): Find fund boundaries in text
    - parseFolios(): Extract folio-level data
    - extractISINInfo(): Multi-line scheme name extraction
    - parseTransactions(): Extract transaction details
    - classifyTransactionType(): Classify transaction types
    - validateTransaction(): Validate transaction structure
```

#### excelGenerator.js
```javascript
generateExcelReport(portfolioData, transactionData, outputPath, selectedSheets)
  Input: Portfolio data, transaction data, output path, sheet selection
  Output: string (path to generated Excel file)
  
  Sheets:
    - Portfolio Summary: Fund name, cost value, market value
    - Transactions: Folio, scheme, ISIN, date, type, amount, NAV, units, balance
    - MF Holdings: Folio, scheme, ISIN, balances, values, advisor, PAN
  
  Formatting:
    - Header row: Blue background, white text, bold
    - Numbers: Appropriate decimal precision (2 for currency, 4 for NAV/units)
    - Frozen header rows
    - Auto-sized columns
```

## Data Models

### Portfolio Summary
```typescript
interface PortfolioSummary {
  fundName: string;
  costValue: number;
  marketValue: number;
}
```

### Folio Data
```typescript
interface FolioData {
  pan: string | null;
  kycStatus: string | null;
  isinLine: string | null;
  schemeName: string | null;
  isin: string | null;
  folioNumber: string | null;
  investorName: string | null;
  nominees: string[];
  registrar: string | null;
  advisor: string | null;
  openingUnitBalance: number | null;
  closingUnitBalance: number | null;
  totalCostValue: number | null;
  marketValue: number | null;
  navOnDate: number | null;
  transactions: Transaction[];
}
```

### Transaction
```typescript
interface Transaction {
  date: string;                    // DD-MMM-YYYY format
  amount: number | null;           // 2 decimal places
  nav: number | null;              // 4 decimal places
  units: number | null;            // 4 decimal places
  transactionType: TransactionType;
  unitBalance: number | null;      // 4 decimal places
  description: string;
}

type TransactionType = 
  | 'Systematic Investment'
  | 'Purchase'
  | 'Redemption'
  | 'Switch-In'
  | 'Switch-Out'
  | 'Dividend'
  | 'Administrative'
  | 'Stamp Duty'
  | 'STT Paid';
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Multi-line scheme name completeness
*For any* scheme name that spans multiple lines in the CAS text, the extracted schemeName field should contain all text from the scheme code prefix through the ISIN marker without truncation.
**Validates: Requirements 5.1, 5.3, 5.4**

### Property 2: Whitespace normalization consistency
*For any* extracted multi-line field, consecutive whitespace characters (spaces, tabs, newlines) should be normalized to single spaces in the final output.
**Validates: Requirements 5.2**

### Property 3: Administrative transaction precedence
*For any* transaction description containing "***" markers, the system should check for *** markers before applying keyword-based classification, ensuring administrative transactions are never misclassified as financial transactions.
**Validates: Requirements 6.1, 6.2**

### Property 4: Administrative transaction classification accuracy
*For any* transaction description containing "***" markers, the transaction's transactionType should be one of: Administrative, Stamp Duty, or STT Paid.
**Validates: Requirements 6.2, 6.3, 6.4, 6.5**

### Property 5: Administrative transaction field nullability
*For any* administrative transaction (excluding Stamp Duty and STT with amounts), the NAV, units, and unitBalance fields should be explicitly null (not undefined).
**Validates: Requirements 6.6, 6.7, 6.8**

### Property 6: Transaction type field presence
*For any* transaction object in the extracted data, the transactionType field should be present and set to a valid string value from the defined TransactionType enum.
**Validates: Requirements 7.4, 9.1, 9.2**

### Property 7: Numeric precision consistency
*For any* extracted numeric value, the system should maintain consistent decimal precision: 2 decimals for amounts, 4 decimals for NAV and units.
**Validates: Requirements 7.6, 7.7, 7.8**

### Property 8: Required field validation
*For any* successfully extracted folio, all required fields (pan, isin, folioNumber, schemeName) should be non-null when extraction succeeds.
**Validates: Requirements 8.2, 8.4, 9.1**

### Property 9: Transaction structure consistency
*For any* transaction (financial or administrative), the transaction object should have the same field structure with fields in consistent order: date, amount, nav, units, transactionType, unitBalance, description.
**Validates: Requirements 6.6, 7.1, 9.1**

### Property 10: Consecutive administrative transaction separation
*For any* sequence of consecutive administrative transactions in the CAS text, each should be extracted as a separate transaction entry with correct date association.
**Validates: Requirements 6.1, 7.1**

## Error Handling

### Frontend Error Handling
- File validation errors (type, size)
- Network errors (connection failures)
- Server errors (extraction failures)
- User-friendly error messages
- Error state management

### Backend Error Handling
- PDF parsing errors (invalid PDF, password errors)
- Extraction errors (no data found, malformed data)
- File system errors (upload/write failures)
- Validation errors (invalid transaction structure)
- Comprehensive logging with stack traces

### Error Recovery Strategies
- Skip invalid transactions and continue processing
- Default to safe values (e.g., "Purchase" for unknown transaction types)
- Log warnings for non-critical issues
- Clean up temporary files on errors
- Return partial results when possible

## Testing Strategy

### Unit Testing
- Test individual extraction functions with specific examples
- Test edge cases (empty inputs, malformed data)
- Test validation logic
- Test numeric parsing with various formats
- Test transaction classification with known descriptions

### Property-Based Testing
The system uses fast-check library for property-based testing with minimum 100 iterations per property.

**Property Tests:**
1. Multi-line scheme name extraction across random inputs
2. Whitespace normalization across various whitespace patterns
3. Administrative transaction classification with random *** descriptions
4. Transaction type precedence with mixed markers and keywords
5. Field nullability for administrative transactions
6. Transaction structure consistency across all transaction types
7. Consecutive administrative transaction handling
8. Numeric precision across random numeric values

**Test Configuration:**
- Minimum 100 runs per property test
- Random input generation using fast-check arbitraries
- Validation of invariants across all generated inputs

### Integration Testing
- End-to-end PDF upload and extraction
- Multi-format output generation
- Sheet selection functionality
- Password-protected PDF handling
- Error scenarios and recovery

### Manual Testing
- Various CAS formats (CAMS, Karvy)
- Different fund houses and schemes
- Edge cases (empty folios, missing data)
- UI responsiveness and feedback
- Dark mode functionality

## Performance Considerations

### Current Performance
- Small PDFs (<1MB): 5-10 seconds
- Medium PDFs (1-5MB): 10-20 seconds
- Large PDFs (5-10MB): 20-40 seconds

### Optimization Strategies
- Stream processing for large files
- Caching for repeated extractions
- Parallel processing for multiple folios
- Efficient regex patterns
- Minimal DOM manipulations in frontend

## Security Considerations

### Current Implementation
- File type validation (PDF only)
- File size limits (10MB)
- Temporary file storage with automatic cleanup
- CORS enabled for development
- Password support for encrypted PDFs

### Production Recommendations
1. HTTPS/TLS encryption
2. Authentication and authorization
3. Rate limiting (e.g., 10 requests per 15 minutes)
4. Input sanitization and validation
5. File scanning for malware
6. Restricted CORS to specific domains
7. Audit logging
8. Environment variable configuration

## Deployment Architecture

### Development
- Frontend: React dev server (port 3000)
- Backend: Express server (port 5000)
- Hot reload for both frontend and backend

### Production Options

**Option 1: Separate Deployment**
- Frontend: Static hosting (Netlify, Vercel)
- Backend: Node.js hosting (Heroku, AWS, DigitalOcean)

**Option 2: Combined Deployment**
- Build frontend to static files
- Serve frontend from Express backend
- Single server deployment

**Option 3: Containerized**
- Docker multi-stage build
- Frontend build stage
- Backend runtime stage
- Container orchestration (Kubernetes)

## Future Enhancements

### Features
- Batch processing (multiple PDFs)
- Historical data comparison
- Data visualization (charts, graphs)
- CSV export format
- Email report delivery
- Scheduled extractions
- Data persistence (database)

### Technical
- Database integration (PostgreSQL/MongoDB)
- Caching layer (Redis)
- Message queue for async processing (RabbitMQ)
- Microservices architecture
- WebSocket for real-time progress
- Progressive Web App (PWA)
- Offline support

---

**Version:** 1.0.0  
**Last Updated:** November 24, 2025
