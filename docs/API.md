# API Documentation

## Base URL

```
http://localhost:5000/api
```

## Endpoints

### 1. Extract CAS Data

Extract data from CAS PDF and generate Excel report.

**Endpoint:** `POST /extract-cas`

**Content-Type:** `multipart/form-data`

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pdf | File | Yes | CAS PDF file (max 10MB) |
| password | String | No | PDF password if protected |

**Request Example:**

```javascript
const formData = new FormData();
formData.append('pdf', pdfFile);
formData.append('password', 'your-password'); // optional

const response = await fetch('http://localhost:5000/api/extract-cas', {
  method: 'POST',
  body: formData
});
```

**Success Response:**

- **Code:** 200 OK
- **Content-Type:** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- **Body:** Excel file (binary)
- **Headers:**
  - `Content-Disposition: attachment; filename="CAS_Report_[timestamp].xlsx"`

**Error Responses:**

**400 Bad Request**
```json
{
  "error": "No file uploaded",
  "message": "Please upload a PDF file"
}
```

**500 Internal Server Error**
```json
{
  "error": "Extraction failed",
  "message": "No portfolio data found. Please ensure this is a valid CAS PDF.",
  "details": "..." // Only in development mode
}
```

**Common Error Messages:**

| Message | Cause | Solution |
|---------|-------|----------|
| "No file uploaded" | Missing PDF file | Include PDF in request |
| "Only PDF files are allowed" | Wrong file type | Upload PDF file only |
| "PDF is password protected" | Missing password | Provide password parameter |
| "Incorrect password" | Wrong password | Check password and retry |
| "No portfolio data found" | Invalid CAS PDF | Ensure valid CAS document |
| "Extracted text is too short" | Empty/corrupted PDF | Check PDF file integrity |

---

### 2. Check Status

Check if the extraction service is ready.

**Endpoint:** `GET /status`

**Request Example:**

```javascript
const response = await fetch('http://localhost:5000/api/status');
const data = await response.json();
```

**Success Response:**

```json
{
  "status": "ready",
  "message": "CAS extraction service is ready",
  "timestamp": "2025-11-23T10:30:00.000Z"
}
```

---

### 3. Health Check

Check if the server is running.

**Endpoint:** `GET /health`

**Request Example:**

```javascript
const response = await fetch('http://localhost:5000/health');
const data = await response.json();
```

**Success Response:**

```json
{
  "status": "OK",
  "message": "ITR Complete Backend is running"
}
```

---

## Excel Report Structure

The generated Excel file contains 3 sheets:

### Sheet 1: Portfolio Summary

| Column | Type | Description |
|--------|------|-------------|
| Mutual Fund | String | Fund house name |
| Cost Value (INR) | Number | Total cost value |
| Market Value (INR) | Number | Current market value |

**Format:** Numbers with 2 decimal places, thousand separators

---

### Sheet 2: Transactions

| Column | Type | Description |
|--------|------|-------------|
| Folio Number | String | Folio identifier |
| Scheme Name | String | Mutual fund scheme name |
| ISIN | String | 12-character ISIN code |
| Date of Transaction | String | DD-MMM-YYYY format |
| Transaction Type | String | SIP, Purchase, Redemption, etc. |
| Amount of Transaction | Number | Transaction amount (2 decimals) |
| NAV (Price per Unit) | Number | NAV value (4 decimals) |
| Units Transacted | Number | Units bought/sold (4 decimals) |
| Unit Balance | Number | Running balance (4 decimals) |

**Transaction Types:**

Financial Transactions:
- Systematic Investment (SIP)
- Purchase
- Redemption
- Switch-In
- Switch-Out
- Dividend

Administrative Transactions:
- Stamp Duty
- STT Paid
- Address Updates
- Nominee Registration
- KYC Updates
- Bank Mandate Changes
- Other administrative entries

**Note:** Transaction types are automatically cleaned (symbols removed) for better readability. Original descriptions with symbols are preserved in the JSON output.

---

### Sheet 3: MF Holdings

| Column | Type | Description |
|--------|------|-------------|
| Folio Number | String | Folio identifier |
| Scheme Name | String | Mutual fund scheme name |
| ISIN | String | 12-character ISIN code |
| Opening Unit Balance | Number | Opening balance (3 decimals) |
| Closing Unit Balance | Number | Closing balance (3 decimals) |
| NAV | Number | Current NAV (4 decimals) |
| Total Cost Value | Number | Total cost (2 decimals) |
| Market Value | Number | Current value (2 decimals) |
| Advisor | String | Advisor ARN code |
| PAN | String | Investor PAN |

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider adding rate limiting middleware.

---

## CORS Configuration

CORS is enabled for all origins in development. For production, configure specific origins in `backend/server.js`:

```javascript
app.use(cors({
  origin: 'https://your-frontend-domain.com'
}));
```

---

## File Size Limits

- **Maximum PDF size:** 10MB
- **Upload timeout:** 30 seconds (default)

To change limits, modify `backend/src/middleware/upload.js`:

```javascript
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB
  }
});
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error category",
  "message": "Human-readable error message",
  "details": "Stack trace (development only)"
}
```

**Error Categories:**
- `No file uploaded` - Missing file
- `Extraction failed` - Processing error
- `Download failed` - File transfer error
- `Internal Server Error` - Unexpected error

---

## Example Usage (JavaScript)

### Using Fetch API

```javascript
async function extractCAS(pdfFile, password = null) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  if (password) {
    formData.append('password', password);
  }

  try {
    const response = await fetch('http://localhost:5000/api/extract-cas', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message);
    }

    // Download file
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CAS_Report.xlsx';
    link.click();
    
    return { success: true };
  } catch (error) {
    console.error('Extraction failed:', error);
    return { success: false, error: error.message };
  }
}
```

### Using Axios

```javascript
import axios from 'axios';

async function extractCAS(pdfFile, password = null) {
  const formData = new FormData();
  formData.append('pdf', pdfFile);
  if (password) {
    formData.append('password', password);
  }

  try {
    const response = await axios.post(
      'http://localhost:5000/api/extract-cas',
      formData,
      {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      }
    );

    // Download file
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'CAS_Report.xlsx';
    link.click();
    
    return { success: true };
  } catch (error) {
    console.error('Extraction failed:', error);
    return { success: false, error: error.message };
  }
}
```

---

## Testing the API

### Using cURL

```bash
# Test health check
curl http://localhost:5000/health

# Test status
curl http://localhost:5000/api/status

# Extract CAS (without password)
curl -X POST \
  -F "pdf=@/path/to/cas.pdf" \
  http://localhost:5000/api/extract-cas \
  --output report.xlsx

# Extract CAS (with password)
curl -X POST \
  -F "pdf=@/path/to/cas.pdf" \
  -F "password=123456" \
  http://localhost:5000/api/extract-cas \
  --output report.xlsx
```

### Using Postman

1. Create new POST request to `http://localhost:5000/api/extract-cas`
2. Go to Body tab → form-data
3. Add key `pdf` with type `File`, select your PDF
4. (Optional) Add key `password` with type `Text`, enter password
5. Click Send
6. Save response as `.xlsx` file

---

## Security Considerations

### Production Deployment

1. **Enable HTTPS** - Use SSL/TLS certificates
2. **Add Authentication** - Implement JWT or session-based auth
3. **Rate Limiting** - Prevent abuse
4. **Input Validation** - Validate all inputs
5. **File Scanning** - Scan uploaded files for malware
6. **CORS Configuration** - Restrict to specific domains
7. **Environment Variables** - Use .env for sensitive config

### Example Security Middleware

```javascript
// Rate limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});
app.use('/api/extract-cas', limiter);

// File type validation
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files allowed'), false);
  }
};
```

---

For more information, see the [README.md](../README.md) and [ARCHITECTURE.md](ARCHITECTURE.md).


---

## JSON Data Structure

When using JSON output format, the response includes detailed transaction data with the following structure:

### Transaction Object

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
| `nav` | Number/null | Net Asset Value at transaction time (4 decimals) |
| `units` | Number/null | Units transacted (negative for redemptions, 4 decimals) |
| `transactionType` | String | Cleaned transaction type (symbols removed) |
| `unitBalance` | Number/null | Running unit balance after transaction (4 decimals) |
| `description` | String | Original description from CAS (preserves all symbols) |
| `isAdministrative` | Boolean | `true` for administrative, `false` for financial |

### Transaction Type Cleaning

The `transactionType` field is automatically cleaned for better readability:

**Administrative Transactions:**
- Input: `***STT Paid***`
- Output: `STT Paid`

**Financial Transactions:**
- Input: `*Switch-Out - To ABSL Small Cap Fund`
- Output: `Switch-Out - To ABSL Small Cap Fund`

The original text with symbols is preserved in the `description` field.

### Administrative vs Financial Transactions

Use the `isAdministrative` field to distinguish transaction types:

**Financial Transactions** (`isAdministrative: false`):
- Have amount, NAV, and units values
- Affect portfolio holdings
- Examples: Purchase, Redemption, Switch-In, Switch-Out, SIP, Dividend

**Administrative Transactions** (`isAdministrative: true`):
- Have `null` for NAV, units, and unitBalance
- May have amount (Stamp Duty, STT) or `null` (other admin entries)
- Do not affect portfolio holdings
- Examples: Stamp Duty, STT Paid, Address Updates, KYC Updates, Nominee Registration

### Example: Complete Folio Data

```json
{
  "pan": "AAEPB2171R",
  "kycStatus": "OK",
  "schemeName": "Aditya Birla Sun Life Arbitrage Fund - Growth-Regular Plan",
  "isin": "INF209K01264",
  "folioNumber": "1044948557",
  "investorName": "Suman Bhasin",
  "openingUnitBalance": 0,
  "closingUnitBalance": 10740.804,
  "transactions": [
    {
      "date": "18-Aug-2023",
      "amount": 299985,
      "nav": 23.3062,
      "units": 12871.468,
      "transactionType": "Purchase",
      "unitBalance": 12871.468,
      "description": "Purchase",
      "isAdministrative": false
    },
    {
      "date": "18-Aug-2023",
      "amount": 15,
      "nav": null,
      "units": null,
      "transactionType": "Stamp Duty",
      "unitBalance": null,
      "description": "*** Stamp Duty ***",
      "isAdministrative": true
    },
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
  ]
}
```

---

## Best Practices

### Error Handling

Always handle errors appropriately:

```javascript
try {
  const response = await fetch('http://localhost:5000/api/extract-cas', {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Extraction failed:', error.message);
    return;
  }
  
  // Handle success
  const blob = await response.blob();
  // Download file...
} catch (error) {
  console.error('Network error:', error);
}
```

### File Validation

Validate files before uploading:

```javascript
function validatePDF(file) {
  // Check file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }
  
  // Check file size (10MB max)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }
  
  return true;
}
```

### Transaction Filtering

Filter transactions by type:

```javascript
// Get only financial transactions
const financialTransactions = transactions.filter(tx => !tx.isAdministrative);

// Get only administrative transactions
const adminTransactions = transactions.filter(tx => tx.isAdministrative);

// Get specific transaction types
const purchases = transactions.filter(tx => 
  tx.transactionType.includes('Purchase') && !tx.isAdministrative
);
```

---

## Security Considerations

### Production Deployment

For production use, implement the following security measures:

1. **Rate Limiting**: Limit requests per IP
2. **File Size Validation**: Enforce strict file size limits
3. **File Type Validation**: Verify PDF magic numbers
4. **CORS Configuration**: Restrict to specific origins
5. **HTTPS**: Use SSL/TLS encryption
6. **Input Sanitization**: Validate all user inputs
7. **Error Messages**: Don't expose sensitive information

### Example Rate Limiting

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10 // limit each IP to 10 requests per windowMs
});

app.use('/api/extract-cas', limiter);
```

---

## Support

For issues or questions:
- Check the troubleshooting section in README.md
- Review error messages carefully
- Ensure PDF is a valid CAS document
- Verify file is not corrupted
