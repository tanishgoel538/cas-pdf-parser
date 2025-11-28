# Requirements Document - CAS Data Extractor

## Introduction

The CAS Data Extractor is a full-stack web application designed to extract, parse, and generate comprehensive reports from Consolidated Account Statement (CAS) PDF files issued by mutual fund registrars (CAMS, Karvy). The system provides multiple output formats and handles complex extraction scenarios including multi-line data, administrative transactions, and password-protected PDFs.

## Glossary

- **CAS**: Consolidated Account Statement - A comprehensive statement showing all mutual fund investments across fund houses
- **System**: The CAS Data Extractor application (frontend + backend)
- **User**: Individual uploading and extracting data from CAS PDFs
- **Folio**: A unique account number assigned to an investor for a specific mutual fund scheme
- **NAV**: Net Asset Value - The price per unit of a mutual fund
- **ISIN**: International Securities Identification Number - A 12-character alphanumeric code uniquely identifying securities
- **PAN**: Permanent Account Number - A 10-character alphanumeric identifier for Indian taxpayers
- **Administrative Transaction**: Non-financial transactions like KYC updates, address changes, nominee registrations
- **Financial Transaction**: Transactions involving money or units (purchases, redemptions, dividends)
- **Registrar**: Entity maintaining investor records (e.g., CAMS, Karvy)
- **Advisor**: Mutual fund distributor identified by ARN code

## Requirements

### Requirement 1: PDF Upload and Processing

**User Story:** As a user, I want to upload my CAS PDF file to the system, so that I can extract and analyze my mutual fund investment data.

#### Acceptance Criteria

1. WHEN a user uploads a PDF file THEN the System SHALL validate the file type is PDF
2. WHEN a user uploads a file exceeding 10MB THEN the System SHALL reject the upload and display an error message
3. WHEN a user uploads a password-protected PDF THEN the System SHALL accept a password parameter and decrypt the PDF
4. WHEN a user provides an incorrect password THEN the System SHALL return an error message indicating incorrect password
5. WHEN a user uploads a valid CAS PDF THEN the System SHALL extract all text content from the PDF

### Requirement 2: Multi-Format Output Generation

**User Story:** As a user, I want to choose different output formats for my extracted data, so that I can use the data in various applications and workflows.

#### Acceptance Criteria

1. WHEN a user selects Excel format THEN the System SHALL generate an XLSX file with formatted sheets
2. WHEN a user selects JSON format THEN the System SHALL generate a JSON file with complete structured data and metadata
3. WHEN a user selects Text format THEN the System SHALL generate a TXT file with raw extracted text
4. WHEN generating any output format THEN the System SHALL include a timestamp in the filename
5. WHEN output generation completes THEN the System SHALL automatically trigger file download in the browser

### Requirement 3: Customizable Excel Sheet Generation

**User Story:** As a user, I want to select which Excel sheets to generate, so that I can create focused reports containing only the data I need.

#### Acceptance Criteria

1. WHEN using Excel format THEN the System SHALL provide options to select Portfolio Summary, Transactions, and MF Holdings sheets
2. WHEN a user selects specific sheets THEN the System SHALL generate only the selected sheets in the Excel file
3. WHEN a user selects no sheets THEN the System SHALL default to generating all three sheets
4. WHEN generating Portfolio Summary sheet THEN the System SHALL include fund name, cost value, and market value columns
5. WHEN generating Transactions sheet THEN the System SHALL include folio, scheme, ISIN, date, type, amount, NAV, units, and unit balance columns
6. WHEN generating MF Holdings sheet THEN the System SHALL include folio, scheme, ISIN, opening balance, closing balance, NAV, cost value, market value, advisor, and PAN columns

### Requirement 4: Portfolio Data Extraction

**User Story:** As a user, I want the system to extract portfolio summary data, so that I can see an overview of my investments by fund house.

#### Acceptance Criteria

1. WHEN the System parses CAS text THEN the System SHALL locate the "Consolidated Portfolio Summary" section
2. WHEN portfolio data is found THEN the System SHALL extract fund house names, cost values, and market values
3. WHEN parsing numeric values THEN the System SHALL handle comma separators and convert to numeric format
4. WHEN portfolio extraction completes THEN the System SHALL return the count of funds extracted
5. WHEN no portfolio data is found THEN the System SHALL return an error indicating invalid CAS PDF

### Requirement 5: Multi-Line Scheme Name Extraction

**User Story:** As a user, I want scheme names to be extracted completely even when they span multiple lines, so that I have accurate fund identification.

#### Acceptance Criteria

1. WHEN a scheme name spans multiple lines in the CAS text THEN the System SHALL concatenate all lines from scheme code to ISIN marker
2. WHEN extracting multi-line text THEN the System SHALL normalize consecutive whitespace characters to single spaces
3. WHEN a scheme name contains a code prefix THEN the System SHALL remove the prefix from the final scheme name
4. WHEN scheme name extraction completes THEN the System SHALL ensure no truncation of scheme name text
5. WHEN ISIN is present THEN the System SHALL extract the complete 12-character ISIN code

### Requirement 6: Administrative Transaction Handling

**User Story:** As a user, I want administrative transactions (KYC updates, address changes) to be correctly identified and classified, so that I can distinguish them from financial transactions.

#### Acceptance Criteria

1. WHEN a transaction description contains triple asterisks (***) THEN the System SHALL classify it as an administrative transaction type
2. WHEN classifying transactions THEN the System SHALL check for *** markers before applying keyword-based classification
3. WHEN a *** transaction contains "stamp duty" THEN the System SHALL classify it as Stamp Duty type
4. WHEN a *** transaction contains "STT" or "stt paid" THEN the System SHALL classify it as STT Paid type
5. WHEN a *** transaction contains neither stamp duty nor STT THEN the System SHALL classify it as Administrative type
6. WHEN extracting administrative transactions THEN the System SHALL set NAV, units, and unitBalance fields to null
7. WHEN extracting Stamp Duty or STT transactions THEN the System SHALL extract amount if present on the date line
8. WHEN administrative transaction has no amount THEN the System SHALL set amount field to null

### Requirement 7: Financial Transaction Extraction

**User Story:** As a user, I want all my financial transactions to be extracted with complete details, so that I can track my investment history accurately.

#### Acceptance Criteria

1. WHEN the System parses folio text THEN the System SHALL extract all transactions between opening and closing balance markers
2. WHEN parsing transaction lines THEN the System SHALL extract date in DD-MMM-YYYY format
3. WHEN parsing transaction lines THEN the System SHALL extract amount, NAV, units, and unit balance with appropriate decimal precision
4. WHEN classifying financial transactions THEN the System SHALL identify Systematic Investment, Purchase, Redemption, Switch-In, Switch-Out, and Dividend types
5. WHEN transaction description is empty THEN the System SHALL use transaction type as description
6. WHEN NAV is present THEN the System SHALL format it with 4 decimal places
7. WHEN units are present THEN the System SHALL format them with 4 decimal places
8. WHEN amount is present THEN the System SHALL format it with 2 decimal places

### Requirement 8: Folio Information Extraction

**User Story:** As a user, I want complete folio-level information extracted, so that I have all details about my investment accounts.

#### Acceptance Criteria

1. WHEN the System parses fund sections THEN the System SHALL identify folios by PAN markers
2. WHEN extracting folio data THEN the System SHALL extract PAN, KYC status, ISIN, folio number, scheme name, registrar, and advisor
3. WHEN extracting balance information THEN the System SHALL extract opening unit balance, closing unit balance, total cost value, and market value
4. WHEN ISIN validation is performed THEN the System SHALL verify 12-character format starting with "INF"
5. WHEN investor details are present THEN the System SHALL extract investor name and nominee information

### Requirement 9: Data Validation and Quality

**User Story:** As a user, I want the system to validate extracted data, so that I can trust the accuracy of the generated reports.

#### Acceptance Criteria

1. WHEN extracting transactions THEN the System SHALL validate that all transactions have required fields (date, transactionType, description)
2. WHEN transaction type is invalid THEN the System SHALL default to "Purchase" and log a warning
3. WHEN numeric parsing fails THEN the System SHALL set the field to null and continue processing
4. WHEN validation errors occur THEN the System SHALL log warnings with specific error details
5. WHEN extraction completes THEN the System SHALL return summary statistics (total funds, folios, transactions)

### Requirement 10: User Interface and Experience

**User Story:** As a user, I want an intuitive interface with real-time feedback, so that I can easily upload files and track extraction progress.

#### Acceptance Criteria

1. WHEN the user interface loads THEN the System SHALL display a drag-and-drop upload area
2. WHEN a user drags a file over the upload area THEN the System SHALL provide visual feedback
3. WHEN extraction is in progress THEN the System SHALL display a progress bar with percentage and status messages
4. WHEN an error occurs THEN the System SHALL display a user-friendly error message
5. WHEN extraction completes successfully THEN the System SHALL display a success message with filename
6. WHEN the user interface is in dark mode THEN the System SHALL apply dark theme styling to all components

### Requirement 11: Error Handling and Logging

**User Story:** As a developer, I want comprehensive error handling and logging, so that I can diagnose and fix issues quickly.

#### Acceptance Criteria

1. WHEN any extraction error occurs THEN the System SHALL log the error with stack trace to console
2. WHEN file upload fails THEN the System SHALL return appropriate HTTP status code and error message
3. WHEN PDF parsing fails THEN the System SHALL clean up temporary files and return error response
4. WHEN extraction warnings occur THEN the System SHALL log warnings without stopping the extraction process
5. WHEN the System encounters malformed data THEN the System SHALL skip the invalid entry and continue processing

### Requirement 12: File Management and Cleanup

**User Story:** As a system administrator, I want automatic file cleanup, so that the server doesn't accumulate temporary files.

#### Acceptance Criteria

1. WHEN a PDF is uploaded THEN the System SHALL store it temporarily in the uploads directory
2. WHEN extraction completes THEN the System SHALL delete the uploaded PDF immediately
3. WHEN output file is generated THEN the System SHALL schedule deletion after 5 minutes
4. WHEN the server starts THEN the System SHALL create uploads and output directories if they don't exist
5. WHEN file operations fail THEN the System SHALL log errors and continue operation

### Requirement 13: Property-Based Testing

**User Story:** As a developer, I want property-based tests to verify correctness across many inputs, so that I can ensure the system handles edge cases correctly.

#### Acceptance Criteria

1. WHEN testing multi-line extraction THEN the System SHALL verify scheme names are complete across 100+ random inputs
2. WHEN testing administrative transactions THEN the System SHALL verify *** markers are checked before keyword classification across 100+ random inputs
3. WHEN testing transaction classification THEN the System SHALL verify all transaction types are correctly assigned across 100+ random inputs
4. WHEN testing whitespace normalization THEN the System SHALL verify consecutive spaces are normalized across 100+ random inputs
5. WHEN property tests run THEN the System SHALL execute minimum 100 iterations per property
