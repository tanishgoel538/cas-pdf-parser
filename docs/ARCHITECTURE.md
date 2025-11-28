# Architecture Overview

## System Architecture

ITR Complete follows a **client-server architecture** with a React frontend and Node.js backend.

```
┌─────────────────────────────────────────────────────────────┐
│                         User Browser                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              React Frontend (Port 3000)                │  │
│  │  - PDF Upload UI                                       │  │
│  │  - Progress Tracking                                   │  │
│  │  - File Download                                       │  │
│  └───────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTP/REST API
                           │ (multipart/form-data)
┌──────────────────────────▼──────────────────────────────────┐
│              Node.js Backend (Port 5000)                     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                  Express Server                        │  │
│  │  - File Upload (Multer)                               │  │
│  │  - CORS Middleware                                     │  │
│  │  - Error Handling                                      │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │              Extraction Pipeline                       │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  1. PDF Extractor (pdf-parse)                   │  │  │
│  │  │     - Text extraction                            │  │  │
│  │  │     - Password handling                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  2. Portfolio Extractor                         │  │  │
│  │  │     - Fund summary parsing                       │  │  │
│  │  │     - Cost/Market values                         │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  3. Transaction Extractor (Enhanced)            │  │  │
│  │  │     - Multi-pattern extraction                   │  │  │
│  │  │     - Multi-line description support             │  │  │
│  │  │     - Administrative transaction handling        │  │  │
│  │  │     - Transaction type cleaning                  │  │  │
│  │  │     - Folio parsing                              │  │  │
│  │  │     - PAN/ISIN/Advisor extraction               │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  4. Excel Generator (ExcelJS)                   │  │  │
│  │  │     - 3 sheets creation                          │  │  │
│  │  │     - Formatting & styling                       │  │  │
│  │  │     - Number precision                           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌───────────────────────▼───────────────────────────────┐  │
│  │              File System                               │  │
│  │  - uploads/ (temporary PDF storage)                   │  │
│  │  - output/ (generated Excel files)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **React 18** - UI framework
- **Axios** - HTTP client
- **CSS3** - Styling with gradients and animations
- **HTML5** - Drag & drop file API

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **Multer** - File upload middleware
- **pdf-parse** - PDF text extraction
- **ExcelJS** - Excel file generation
- **CORS** - Cross-origin resource sharing

---

## Data Flow

### 1. Upload Phase
```
User → Select PDF → Frontend validates → Upload to backend
```

**Validation:**
- File type: Must be PDF
- File size: Max 10MB
- Optional: Password for protected PDFs

### 2. Extraction Phase
```
Backend receives PDF → Extract text → Parse data → Generate Excel
```

**Steps:**
1. **Text Extraction** - Convert PDF to plain text
2. **Portfolio Parsing** - Extract fund summary
3. **Transaction Parsing** - Extract detailed transactions
4. **Excel Generation** - Create formatted workbook

### 3. Download Phase
```
Excel generated → Stream to frontend → Browser downloads file
```

**Cleanup:**
- Uploaded PDF deleted immediately
- Excel file deleted after 5 minutes

---

## Component Details

### Frontend Components

#### App.js
- Main application container
- Dark mode state management
- Header and footer layout

#### PDFUploader.js
- File upload interface
- Drag & drop functionality
- Password input
- Progress tracking
- Error/success messaging
- Feature showcase

#### ProgressBar.js
- Visual progress indicator
- Animated shimmer effect
- Percentage display

### Backend Modules

#### server.js
- Express server setup
- Middleware configuration
- Route mounting
- Error handling
- Directory initialization

#### Middleware

**upload.js**
- Multer configuration
- File storage setup
- File type filtering
- Size limits

#### Extractors

**pdfExtractor.js**
- PDF text extraction
- Password handling
- Error management

**portfolioExtractor.js**
- Portfolio summary parsing
- Fund name extraction
- Cost/Market value parsing

**transactionExtractor.js** (ITR2 Logic)
- Fund section location
- Folio parsing
- Transaction parsing
- Multi-pattern extraction
- Data classification
- Scheme name extraction from ISIN line
- Administrative transaction detection

**excelGenerator.js**
- Workbook creation
- Sheet generation
- Cell formatting
- Number precision
- Header styling

#### Routes

**casRoutes.js**
- POST /extract-cas - Main extraction endpoint
- GET /status - Service status check
- File cleanup logic
- Error handling

---

## Extraction Algorithm

### ITR2 Enhanced Extraction

The transaction extractor uses sophisticated pattern matching:

#### 1. Fund Section Location
```javascript
// Locate each fund by name
fundNames.forEach(fundName => {
  // Find fund header in text
  // Determine section boundaries
  // Extract section text
});
```

#### 2. Folio Parsing
```javascript
// For each fund section
// Find PAN markers (AAAAA9999A format)
// Extract folio blocks
// Parse folio-level data:
//   - PAN, KYC Status
//   - ISIN (12-char validation)
//   - Scheme Name (extracted from ISIN line)
//     Pattern: Everything before " - ISIN:"
//     Example: "128AFGPG-Axis Focused Fund - Regular Growth - ISIN: INF846K01CH7"
//              → "128AFGPG-Axis Focused Fund - Regular Growth"
//   - Registrar, Advisor
//   - Opening/Closing Balance
//   - Cost/Market Values
```

#### 3. Transaction Parsing
```javascript
// For each folio
// Find transaction section
// Parse each transaction line:
//   - Date (DD-MMM-YYYY)
//   - Amount (with comma/parentheses)
//   - NAV (4 decimal precision)
//   - Units (4 decimal precision)
//   - Unit Balance (running total)
//   - Description
//   - Type classification
//   - Administrative flag (isAdministrative)
//     Identifies: Stamp Duty, STT Paid, and *** marked transactions
```

#### 4. Transaction Classification
```javascript
classifyTransactionType(description) {
  // Check for keywords:
  // - "***" markers → Administrative
  //   - "stamp duty" → Stamp Duty
  //   - "stt paid" → STT Paid
  //   - Other *** → Administrative
  // - "systematic investment" → SIP
  // - "redemption" → Redemption
  // - "switch-in/out" → Switch
  // - "dividend" → Dividend
  // - Default → Purchase
}

// Administrative Transaction Detection
isAdministrative = (
  transactionType === 'Stamp Duty' || 
  transactionType === 'STT Paid' || 
  transactionType === 'Administrative' ||
  description.includes('***')
);
```

### Pattern Matching Features

**Multi-Pattern Extraction:**
- Primary pattern with fallbacks
- Handles variations in CAS formats
- Robust to text extraction quirks

**Numeric Parsing:**
- Comma removal (1,234.56 → 1234.56)
- Parentheses for negatives ((100) → -100)
- Null handling for missing values

**ISIN Validation:**
- 12-character format
- Starts with "INF"
- 4th character numeric
- Last character numeric

---

## Excel Report Structure

### Sheet 1: Portfolio Summary
```
┌─────────────────────┬──────────────────┬──────────────────┐
│ Mutual Fund         │ Cost Value (INR) │ Market Value     │
├─────────────────────┼──────────────────┼──────────────────┤
│ HDFC Mutual Fund    │ 1,234,567.89     │ 1,456,789.12     │
│ ICICI Mutual Fund   │ 987,654.32       │ 1,098,765.43     │
└─────────────────────┴──────────────────┴──────────────────┘
```

### Sheet 2: Transactions
```
┌────────┬─────────────┬──────┬──────┬──────┬────────┬─────────┬───────┬─────────┐
│ Folio  │ Scheme      │ ISIN │ Date │ Type │ Amount │ NAV     │ Units │ Balance │
├────────┼─────────────┼──────┼──────┼──────┼────────┼─────────┼───────┼─────────┤
│ 12345  │ HDFC Equity │ INF..│ Date │ SIP  │ 5000.00│ 39.8400 │125.50 │ 1250.75 │
└────────┴─────────────┴──────┴──────┴──────┴────────┴─────────┴───────┴─────────┘
```

### Sheet 3: MF Holdings
```
┌────────┬─────────────┬──────┬─────────┬─────────┬─────────┬──────┬────────┬─────────┬─────┐
│ Folio  │ Scheme      │ ISIN │ Opening │ Closing │ NAV     │ Cost │ Market │ Advisor │ PAN │
├────────┼─────────────┼──────┼─────────┼─────────┼─────────┼──────┼────────┼─────────┼─────┤
│ 12345  │ HDFC Equity │ INF..│ 1000.00 │ 1250.75 │ 39.8400 │50000 │ 49800  │ ARN-... │ ... │
└────────┴─────────────┴──────┴─────────┴─────────┴─────────┴──────┴────────┴─────────┴─────┘
```

---

## Security Considerations

### Current Implementation
- File type validation (PDF only)
- File size limits (10MB)
- Temporary file storage
- Automatic cleanup
- CORS enabled (development)

### Production Recommendations
1. **Authentication** - Add JWT or session-based auth
2. **Rate Limiting** - Prevent abuse (e.g., 10 requests/15min)
3. **HTTPS** - Use SSL/TLS certificates
4. **Input Sanitization** - Validate all inputs
5. **File Scanning** - Scan for malware
6. **CORS Restriction** - Limit to specific domains
7. **Logging** - Implement audit logs
8. **Encryption** - Encrypt sensitive data

---

## Performance Optimization

### Current Performance
- **Small PDFs (<1MB):** 5-10 seconds
- **Medium PDFs (1-5MB):** 10-20 seconds
- **Large PDFs (5-10MB):** 20-40 seconds

### Optimization Strategies

**Backend:**
- Stream processing for large files
- Worker threads for CPU-intensive tasks
- Caching for repeated extractions
- Database for persistent storage

**Frontend:**
- Code splitting
- Lazy loading
- Service workers for offline support
- Progressive web app (PWA)

---

## Scalability

### Horizontal Scaling
```
Load Balancer
    ↓
┌─────────┬─────────┬─────────┐
│ Server1 │ Server2 │ Server3 │
└─────────┴─────────┴─────────┘
    ↓
Shared File Storage (S3/NFS)
```

### Vertical Scaling
- Increase server resources
- Optimize extraction algorithms
- Use faster PDF parsing libraries

### Queue-Based Processing
```
Frontend → Queue (Redis/RabbitMQ) → Workers → Storage
```

---

## Error Handling

### Frontend
- File validation errors
- Network errors
- Server errors
- User-friendly messages

### Backend
- PDF parsing errors
- Password errors
- Extraction errors
- File system errors
- Detailed logging

---

## Testing Strategy

### Unit Tests
- Extractor functions
- Validation logic
- Utility functions

### Integration Tests
- API endpoints
- File upload/download
- End-to-end extraction

### Manual Testing
- Various CAS formats
- Password-protected PDFs
- Edge cases
- Error scenarios

---

## Future Enhancements

### Features
- Batch processing (multiple PDFs)
- Historical data comparison
- Data visualization (charts/graphs)
- Export to other formats (CSV, JSON)
- Email reports
- Scheduled extractions

### Technical
- Database integration (PostgreSQL/MongoDB)
- Caching layer (Redis)
- Message queue (RabbitMQ)
- Microservices architecture
- Docker containerization
- Kubernetes orchestration

---

## Deployment

### Development
```bash
# Backend
cd backend && npm start

# Frontend
cd frontend && npm start
```

### Production

**Option 1: Separate Deployment**
- Frontend: Netlify/Vercel
- Backend: Heroku/AWS/DigitalOcean

**Option 2: Combined Deployment**
- Build frontend: `npm run build`
- Serve from backend: `express.static('build')`
- Deploy to single server

**Option 3: Docker**
```dockerfile
# Multi-stage build
FROM node:18 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM node:18
WORKDIR /app
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./
COPY --from=frontend /app/frontend/build ./public
CMD ["node", "server.js"]
```

---

For more information, see [README.md](../README.md) and [API.md](API.md).
