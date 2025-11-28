# Requirements Document

## Introduction

This feature enhances the CAS data extraction system to properly identify, classify, and handle administrative transactions in mutual fund statements. Administrative transactions are non-financial entries that record system events like nominee registration, address updates, bank mandate changes, and other administrative actions. Currently, the ITR_Complete project does not properly extract and categorize these transactions, while the ITR2 reference implementation demonstrates the correct approach.

## Glossary

- **Administrative Transaction**: A non-financial transaction entry in a CAS statement that records system events such as nominee registration, address updates, KYC updates, or bank mandate changes. These transactions typically have no NAV, units, or amount values.
- **CAS (Consolidated Account Statement)**: A comprehensive statement showing all mutual fund holdings and transactions across multiple fund houses.
- **Transaction Extractor**: The system component responsible for parsing and extracting transaction data from CAS text.
- **NAV (Net Asset Value)**: The price per unit of a mutual fund on a specific date.
- **Folio**: A unique account number assigned to an investor for a specific mutual fund scheme.
- **Transaction Type**: A classification label assigned to each transaction (e.g., Purchase, Redemption, SIP, Administrative, Stamp Duty, STT Paid).

## Requirements

### Requirement 1

**User Story:** As a mutual fund investor, I want administrative transactions to be properly extracted from my CAS statement, so that I have a complete record of all account activities including non-financial events.

#### Acceptance Criteria

1. WHEN the Transaction Extractor processes a CAS statement THEN the system SHALL identify all administrative transaction entries marked with triple asterisks (***).
2. WHEN an administrative transaction is identified THEN the system SHALL extract the transaction date and description text.
3. WHEN an administrative transaction is identified THEN the system SHALL set the transaction type to "Administrative".
4. WHEN an administrative transaction is identified THEN the system SHALL set amount, NAV, units, and unit balance fields to null.
5. WHEN the Transaction Extractor completes processing THEN the system SHALL include administrative transactions in the output alongside financial transactions in chronological order.

### Requirement 2

**User Story:** As a mutual fund investor, I want stamp duty and STT (Securities Transaction Tax) entries to be properly classified, so that I can distinguish tax-related transactions from other administrative entries.

#### Acceptance Criteria

1. WHEN the Transaction Extractor encounters a transaction description containing "Stamp Duty" THEN the system SHALL classify the transaction type as "Stamp Duty".
2. WHEN the Transaction Extractor encounters a transaction description containing "STT Paid" or "STT" THEN the system SHALL classify the transaction type as "STT Paid".
3. WHEN a Stamp Duty transaction is identified THEN the system SHALL extract the amount value if present.
4. WHEN an STT Paid transaction is identified THEN the system SHALL extract the amount value if present.
5. WHEN Stamp Duty or STT Paid transactions are extracted THEN the system SHALL set NAV, units, and unit balance fields to null.

### Requirement 3

**User Story:** As a developer, I want the transaction classification logic to follow a consistent pattern matching strategy, so that all transaction types are identified accurately and maintainably.

#### Acceptance Criteria

1. WHEN the Transaction Extractor classifies a transaction THEN the system SHALL first check for triple asterisk markers to identify administrative, stamp duty, and STT transactions.
2. WHEN a transaction does not contain triple asterisks THEN the system SHALL apply keyword-based classification for financial transaction types.
3. WHEN multiple classification patterns could match THEN the system SHALL apply the most specific pattern first.
4. WHEN no classification pattern matches THEN the system SHALL default to "Purchase" as the transaction type.
5. WHEN the classification function processes transaction descriptions THEN the system SHALL perform case-insensitive pattern matching.

### Requirement 4

**User Story:** As a data analyst, I want the JSON output to maintain consistent structure for all transaction types, so that I can programmatically process both financial and administrative transactions.

#### Acceptance Criteria

1. WHEN the system outputs transaction data to JSON THEN the system SHALL include all transactions in a single chronological array per folio.
2. WHEN an administrative transaction is included in JSON output THEN the system SHALL include all standard transaction fields with null values for non-applicable fields.
3. WHEN the JSON output is generated THEN the system SHALL preserve the original transaction description text for all transaction types.
4. WHEN the JSON output is generated THEN the system SHALL include the classified transaction type for all transactions.
5. WHEN the JSON output is generated THEN the system SHALL maintain the same field order and structure for all transaction objects regardless of type.

### Requirement 5

**User Story:** As a mutual fund investor, I want the Excel report to display administrative transactions, so that I can see the complete timeline of account activities in a readable format.

#### Acceptance Criteria

1. WHEN the Excel Generator creates the Transactions sheet THEN the system SHALL include rows for administrative transactions.
2. WHEN an administrative transaction row is created THEN the system SHALL display the transaction date and type.
3. WHEN an administrative transaction row is created THEN the system SHALL display the description text.
4. WHEN an administrative transaction row is created THEN the system SHALL leave amount, NAV, units, and unit balance cells empty or display as blank.
5. WHEN the Transactions sheet is generated THEN the system SHALL maintain chronological order including both financial and administrative transactions.

### Requirement 6

**User Story:** As a quality assurance engineer, I want the system to handle edge cases in administrative transaction parsing, so that extraction remains robust across different CAS formats.

#### Acceptance Criteria

1. WHEN an administrative transaction description spans multiple lines THEN the system SHALL extract the complete description text.
2. WHEN an administrative transaction contains special characters THEN the system SHALL preserve the characters in the description field.
3. WHEN consecutive administrative transactions appear THEN the system SHALL extract each transaction as a separate entry.
4. WHEN an administrative transaction appears between financial transactions THEN the system SHALL maintain the correct chronological sequence.
5. WHEN the CAS statement contains no administrative transactions THEN the system SHALL process financial transactions normally without errors.
