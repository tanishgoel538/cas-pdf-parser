# Requirements Document

## Introduction

This document specifies improvements to the CAS (Consolidated Account Statement) PDF extraction system to handle multi-line scheme names and ISIN information, and to properly track administrative transactions for ITR filing purposes.

## Glossary

- **CAS**: Consolidated Account Statement - A document containing mutual fund portfolio and transaction information
- **ISIN**: International Securities Identification Number - A unique identifier for securities
- **Scheme Name**: The name of a mutual fund scheme
- **Folio**: An account number assigned to an investor for a specific mutual fund scheme
- **Administrative Transaction**: A transaction that does not involve actual purchase or redemption of units (e.g., stamp duty, STT paid)
- **PDF Extractor**: The system component that extracts structured data from CAS PDF files
- **Transaction Classifier**: The component that categorizes transaction types

## Requirements

### Requirement 1

**User Story:** As a user processing CAS statements, I want the system to correctly extract scheme names and ISIN information that span multiple lines, so that all folio data is accurately captured regardless of formatting.

#### Acceptance Criteria

1. WHEN the system encounters a scheme name that spans multiple lines THEN the PDF Extractor SHALL concatenate all lines until the ISIN field is found
2. WHEN the system encounters an ISIN line that continues beyond the initial line THEN the PDF Extractor SHALL continue reading subsequent lines until the Folio Number field is encountered
3. WHEN extracting multi-line scheme information THEN the PDF Extractor SHALL preserve the complete scheme name without truncation
4. WHEN the scheme name contains special characters or hyphens THEN the PDF Extractor SHALL maintain the exact formatting
5. WHERE a folio number matches the pattern "2772992/35" or similar formats THEN the PDF Extractor SHALL correctly extract the associated multi-line scheme name and ISIN

### Requirement 2

**User Story:** As a user preparing ITR filings, I want the system to identify and flag administrative transactions separately from investment transactions, so that I can properly categorize transactions for tax reporting.

#### Acceptance Criteria

1. WHEN the system processes a transaction THEN the Transaction Classifier SHALL determine whether the transaction is administrative or investment-related
2. WHEN a transaction description contains "***" markers THEN the Transaction Classifier SHALL classify it as administrative
3. WHEN a transaction involves stamp duty or STT payments THEN the Transaction Classifier SHALL mark it as administrative
4. WHEN the system exports transaction data THEN the PDF Extractor SHALL include an "isAdministrative" boolean field for each transaction
5. WHEN generating Excel output THEN the Excel Generator SHALL map administrative transactions using the Transaction Type column without adding a separate administrative indicator column

### Requirement 3

**User Story:** As a developer maintaining the extraction system, I want robust pattern matching for multi-line content, so that the system handles various CAS formatting variations reliably.

#### Acceptance Criteria

1. WHEN parsing multi-line content THEN the PDF Extractor SHALL use flexible line continuation logic that adapts to different formatting patterns
2. WHEN a line break occurs within a field THEN the PDF Extractor SHALL detect the continuation based on field boundaries rather than fixed line counts
3. WHEN the system encounters unexpected whitespace or formatting THEN the PDF Extractor SHALL normalize the extracted data
4. WHEN extraction fails for a specific folio THEN the PDF Extractor SHALL log detailed error information including the problematic text segment
5. WHEN the system successfully extracts multi-line data THEN the PDF Extractor SHALL validate that all expected fields are present
