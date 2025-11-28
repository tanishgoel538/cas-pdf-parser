# Application Workflow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                            │
│                    http://localhost:3000                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP Request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REACT FRONTEND                             │
│                   (Port 3000 - Dev Mode)                        │
│                                                                 │
│  Components:                                                    │
│  ├── App.js (Main container)                                    │
│  ├── PDFUploader.js (Upload & options UI)                       │
│  └── ProgressBar.js (Progress indicator)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Call (axios)
                              │ POST /api/extract-cas
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS BACKEND                            │
│                    (Port 5000 - API Server)                     │
│                                                                 │
│  Entry Point: server.js                                         │
│  ├── Middleware: upload.js (multer)                             │
│  └── Routes: casRoutes.js                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Process Request
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTRACTION PIPELINE                          │
│                                                                 │
│  1. pdfExtractor.js → Extract text from PDF                     │
│  2. portfolioExtractor.js → Parse portfolio data                │
│  3. transactionExtractor.js → Parse transactions                │
│  4. excelGenerator.js → Generate output file                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Return File
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER DOWNLOADS                             │
│              (Excel / JSON / Text file)                         │
└─────────────────────────────────────────────────────────────────┘
```

## Detailed Execution Flow

### 1. Frontend Initialization

**File: `frontend/src/index.js`**
```
Application Start
    ↓
Render React App
    ↓
Load App.js
```

**File: `frontend/src/App.js`**
```
Initialize App Component
    ↓
Set up dark mode state
    ↓
Render PDFUploader component
```

**File: `frontend/src/components/PDFUploader.js`**
```
Initialize Component State:
├── file: null
├── password: ''
├── outputFormat: 'excel'
├── selectedSheets: {portfolio: true, transactions: true, holdings: true}
├── loading: false
├── progress: 0
└── error: ''
    ↓
Render Upload UI
```

### 2. User Interaction Flow

```
User Action: Upload PDF
    ↓
handleFileSelection()
    ├── Validate file type (must be PDF)
    ├── Validate file size (max 10MB)
    └── Set file state
    ↓
User Action: Enter password (optional)
    ↓
setPassword()
    ↓
User Action: Select output format
    ↓
setOutputFormat('excel' | 'json' | 'text')
    ↓
User Action: Select sheets (if Excel)
    ↓
handleSheetToggle()
    ├── Toggle portfolio
    ├── Toggle transactions
    └── Toggle holdings
    ↓
User Action: Click "Extract & Generate"
    ↓
handleUpload()
```

### 3. Upload & Extraction Flow

**File: `frontend/src/components/PDFUploader.js` → `handleUpload()`**

```javascript
handleUpload() {
    // Step 1: Prepare FormData
    Create FormData
        ├── Append PDF file
        ├── Append password (if provided)
        ├── Append outputFormat
        └── Append sheets (if Excel format)
    
    // Step 2: Send to Backend
    axios.post('/api/extract-cas', formData)
        ├── Set progress: 10% - "Uploading PDF..."
        ├── Set progress: 30% - "Extracting text from PDF..."
        ├── Set progress: 60% - "Parsing portfolio data..."
        ├── Set progress: 80% - "Extracting transactions..."
        └── Set progress: 95% - "Generating report..."
    
    // Step 3: Handle Response
    Receive blob response
        ├── Create download link
        ├── Trigger download
        └── Set progress: 100% - "Complete!"
}
```

### 4. Backend Processing Flow

**File: `backend/server.js`**
```
Express Server Start (Port 5000)
    ↓
Configure Middleware:
    ├── CORS (allow frontend)
    ├── Body Parser (JSON)
    └── Static files
    ↓
Register Routes:
    └── /api → casRoutes.js
    ↓
Listen on Port 5000
```

**File: `backend/src/routes/casRoutes.js` → POST `/api/extract-cas`**

```javascript
POST /api/extract-cas {
    // Step 1: Receive & Validate
    Multer Middleware (upload.single('pdf'))
        ├── Save PDF to uploads/ folder
        └── Validate file exists
    
    Extract Request Parameters:
        ├── uploadedFilePath = req.file.path
        ├── password = req.body.password
        ├── outputFormat = req.body.outputFormat || 'excel'
        └── selectedSheets = JSON.parse(req.body.sheets)
    
    // Step 2: Extract Text from PDF
    Call: extractTextFromPDF(uploadedFilePath, password)
        ↓
    Returns: textContent (string)
    
    // Step 3: Extract Portfolio Data
    Call: extractPortfolioSummary(textContent)
        ↓
    Returns: portfolioData {
        portfolioSummary: [...],
        fundCount: number
    }
    
    // Step 4: Extract Transaction Data
    Call: extractFundTransactions(textContent, portfolioData)
        ↓
    Returns: transactionData {
        funds: [...],
        totalFolios: number
    }
    
    // Step 5: Generate Output File
    IF outputFormat === 'excel':
        Call: generateExcelReport(portfolioData, transactionData, outputPath, selectedSheets)
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileName = '{name}_CAS_Report_{timestamp}.xlsx'
    
    ELSE IF outputFormat === 'json':
        Create JSON object with metadata, portfolioData, transactionData, rawText
        Write to file
        contentType = 'application/json'
        fileName = '{name}_CAS_Data_{timestamp}.json'
    
    ELSE IF outputFormat === 'text':
        Write textContent to file
        contentType = 'text/plain'
        fileName = '{name}_CAS_Extracted_{timestamp}.txt'
    
    // Step 6: Send Response
    Set Headers:
        ├── Content-Type: contentType
        └── Content-Disposition: attachment; filename="{fileName}"
    
    res.download(outputFilePath, fileName)
    
    // Step 7: Cleanup
    Delete uploaded PDF
    Schedule deletion of output file (5 minutes)
}
```

### 5. PDF Extraction Details

**File: `backend/src/extractors/pdfExtractor.js`**

```javascript
extractTextFromPDF(pdfPath, password) {
    Load PDF file
        ↓
    IF password provided:
        Use PDFParse with password
    ELSE:
        Use PDFParse without password
        ↓
    Extract text from all pages
        ↓
    Return concatenated text
}
```

### 6. Portfolio Extraction Details

**File: `backend/src/extractors/portfolioExtractor.js`**

```javascript
extractPortfolioSummary(textContent) {
    Find "Consolidated Portfolio Summary" section
        ↓
    Extract table data:
        ├── Fund Name
        ├── Cost Value
        └── Market Value
        ↓
    Parse each row:
        ├── Clean fund name
        ├── Parse numeric values
        └── Handle special cases
        ↓
    Return {
        portfolioSummary: [
            {fundName, costValue, marketValue}
        ],
        fundCount: number
    }
}
```

### 7. Transaction Extraction Details

**File: `backend/src/extractors/transactionExtractor.js`**

```javascript
extractFundTransactions(textContent, portfolioData) {
    For each fund in portfolioData:
        Find fund section in text
            ↓
        Extract folios:
            ├── Folio Number
            ├── Scheme Name
            ├── ISIN
            ├── PAN
            └── Advisor
            ↓
        For each folio:
            Extract transactions:
                ├── Date
                ├── Transaction Type
                ├── Amount
                ├── NAV
                ├── Units
                └── Unit Balance
            ↓
            Calculate:
                ├── Opening Unit Balance
                ├── Closing Unit Balance
                ├── Total Cost Value
                └── Market Value
        ↓
    Return {
        funds: [
            {
                fundName,
                folios: [
                    {
                        folioNumber,
                        schemeName,
                        transactions: [...]
                    }
                ]
            }
        ],
        totalFolios: number
    }
}
```

### 8. Excel Generation Details

**File: `backend/src/extractors/excelGenerator.js`**

```javascript
generateExcelReport(portfolioData, transactionData, outputPath, sheets) {
    Create ExcelJS Workbook
        ↓
    IF 'portfolio' in sheets:
        generatePortfolioSummarySheet()
            ├── Add columns: Fund Name, Cost Value, Market Value
            ├── Add data rows
            ├── Format headers (blue background, white text)
            ├── Format numbers (currency format)
            └── Freeze header row
        ↓
    IF 'transactions' in sheets:
        generateTransactionsSheet()
            ├── Add columns: Folio, Scheme, ISIN, Date, Type, Amount, NAV, Units, Balance
            ├── Add data rows
            ├── Format headers
            ├── Format numbers (4 decimal precision)
            └── Freeze header row
        ↓
    IF 'holdings' in sheets:
        generateMFHoldingsSheet()
            ├── Add columns: Folio, Scheme, ISIN, Opening, Closing, NAV, Cost, Market, Advisor, PAN
            ├── Add data rows
            ├── Format headers
            ├── Format numbers
            └── Freeze header row
        ↓
    Save workbook to outputPath
        ↓
    Return outputPath
}
```

## Data Flow Diagram

```
┌──────────────┐
│   PDF File   │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│  pdfExtractor.js     │
│  Extract Raw Text    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────────────────────────┐
│           Raw Text Content               │
│  (All pages concatenated)                │
└──────┬───────────────────────────────────┘
       │
       ├─────────────────────────┐
       │                         │
       ▼                         ▼
┌──────────────────┐    ┌──────────────────────┐
│ portfolioExtractor│    │ transactionExtractor │
│ Parse Portfolio   │    │ Parse Transactions   │
└──────┬───────────┘    └──────┬───────────────┘
       │                        │
       ▼                        ▼
┌──────────────────┐    ┌──────────────────────┐
│ portfolioData    │    │ transactionData      │
│ - Summary        │    │ - Funds              │
│ - Fund Count     │    │ - Folios             │
└──────┬───────────┘    │ - Transactions       │
       │                │ - Total Folios       │
       │                └──────┬───────────────┘
       │                       │
       └───────────┬───────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Output Format?     │
         └─────────┬───────────┘
                   │
       ┌───────────┼───────────┐
       │           │           │
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│  Excel   │ │   JSON   │ │   Text   │
│Generator │ │Generator │ │Generator │
└────┬─────┘ └────┬─────┘ └────┬─────┘
     │            │            │
     ▼            ▼            ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│.xlsx file│ │.json file│ │.txt file │
└──────────┘ └──────────┘ └──────────┘
```

## File Dependencies

```
frontend/src/index.js
    └── App.js
        └── PDFUploader.js
            ├── PDFUploader.css
            ├── ProgressBar.js
            └── axios (HTTP client)

backend/server.js
    └── routes/casRoutes.js
        ├── middleware/upload.js (multer)
        └── extractors/
            ├── pdfExtractor.js
            │   └── pdf-parse library
            ├── portfolioExtractor.js
            ├── transactionExtractor.js
            └── excelGenerator.js
                └── exceljs library
```

## State Management Flow

### Frontend State (PDFUploader.js)

```javascript
Initial State:
{
    file: null,
    password: '',
    showPassword: false,
    isDragOver: false,
    loading: false,
    progress: 0,
    status: '',
    error: '',
    summary: null,
    outputFormat: 'excel',
    selectedSheets: {
        portfolio: true,
        transactions: true,
        holdings: true
    }
}

State Transitions:
1. File Upload → file: File object
2. Password Entry → password: string
3. Format Selection → outputFormat: 'excel'|'json'|'text'
4. Sheet Toggle → selectedSheets: {...}
5. Upload Start → loading: true, progress: 10
6. Extraction Progress → progress: 30, 60, 80, 95
7. Upload Complete → loading: false, progress: 100, summary: {...}
8. Error → error: string, loading: false
9. Clear → Reset to initial state
```

## Error Handling Flow

```
Error Occurs
    ↓
Backend catches error
    ↓
Log error to console
    ↓
Clean up temporary files
    ↓
Send error response:
    {
        error: 'Error type',
        message: 'User-friendly message',
        details: 'Stack trace (dev only)'
    }
    ↓
Frontend receives error
    ↓
Display error message to user
    ↓
Reset loading state
```

## Performance Optimizations

1. **File Cleanup**: Automatic deletion of temporary files after 5 minutes
2. **Selective Sheet Generation**: Only generate requested Excel sheets
3. **Progress Updates**: Real-time feedback to user
4. **Blob Handling**: Efficient binary data transfer
5. **Memory Management**: Stream-based file operations

## Security Measures

1. **File Type Validation**: Only PDF files accepted
2. **File Size Limit**: Maximum 10MB
3. **Password Protection**: Support for encrypted PDFs
4. **Temporary Storage**: Files deleted after processing
5. **CORS Configuration**: Restricted to frontend origin
6. **Input Sanitization**: Validation of all user inputs

---

**Last Updated**: November 23, 2025
