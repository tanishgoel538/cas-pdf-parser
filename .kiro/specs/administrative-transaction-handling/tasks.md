# Implementation Plan

- [x] 1. Enhance transaction classification logic

  - Update the `classifyTransactionType()` function in `transactionExtractor.js` to detect and classify administrative transactions
  - Add *** marker detection as the first classification check
  - Implement specific classification for Stamp Duty and STT Paid transactions
  - Ensure case-insensitive pattern matching for all transaction types
  - _Requirements: 1.3, 2.1, 2.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 1.1 Write property test for classification precedence


  - **Property 3: Classification precedence**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 1.2 Write property test for case-insensitive classification


  - **Property 4: Case-insensitive classification**
  - **Validates: Requirements 3.5**

- [x] 2. Implement administrative transaction parsing

  - Modify the `parseTransactions()` function in `transactionExtractor.js` to detect *** markers in transaction lines
  - Extract date from the line before the *** marker
  - Extract description from the *** line
  - Handle amount extraction for Stamp Duty and STT transactions
  - Set NAV, units, and unitBalance to null for administrative transactions
  - Maintain chronological order when mixing financial and administrative transactions
  - _Requirements: 1.1, 1.2, 1.4, 2.3, 2.4, 2.5, 6.1, 6.2, 6.3, 6.4_

- [x] 2.1 Write property test for administrative transaction identification

  - **Property 1: Administrative transaction identification**
  - **Validates: Requirements 1.1, 2.1, 2.2**

- [x] 2.2 Write property test for administrative transaction field extraction

  - **Property 2: Administrative transaction field extraction**
  - **Validates: Requirements 1.2, 1.3, 1.4, 2.3, 2.4, 2.5**

- [x] 2.3 Write property test for consecutive administrative transactions

  - **Property 9: Consecutive administrative transactions**
  - **Validates: Requirements 6.3**

- [x] 3. Ensure JSON output consistency

  - Verify that transaction objects maintain consistent structure for all transaction types
  - Ensure null values are explicitly set (not undefined) for administrative transaction fields
  - Validate that description text is preserved exactly as extracted
  - Confirm that all transactions include the transactionType field
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_


- [x] 3.1 Write property test for JSON structure consistency

  - **Property 6: JSON structure consistency**
  - **Validates: Requirements 4.2, 4.3, 4.4, 4.5**

- [x] 3.2 Write property test for description text preservation

  - **Property 10: Description text preservation**
  - **Validates: Requirements 4.3**

- [x] 3.3 Write property test for chronological ordering

  - **Property 5: Chronological ordering preservation**
  - **Validates: Requirements 1.5, 4.1, 5.5, 6.4**



- [x] 4. Update Excel generation for administrative transactions

  - Modify the Transactions sheet generation in `excelGenerator.js` to handle null values
  - Ensure null numeric fields render as empty cells (not "null" or "0")
  - Verify that administrative transactions appear with date, type, and description
  - Apply number formatting only to non-null numeric cells
  - Maintain chronological order in the Excel output
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 4.1 Write property test for Excel null value rendering

  - **Property 7: Excel null value rendering**
  - **Validates: Requirements 5.4**


- [x] 4.2 Write property test for Excel administrative transaction inclusion

  - **Property 8: Excel administrative transaction inclusion**

  - **Validates: Requirements 5.1, 5.2, 5.3**

-

- [x] 5. Add error handling and validation

  - Implement error handling for malformed administrative transaction entries
  - Add validation for null values in transaction objects
  - Add logging for parsing warnings (missing dates, empty descriptions)
  - Validate transaction type values against the defined set

 - _Requirements: All (error handling support)_




- [x] 5.1 Write unit tests for error handling

  - Test malformed *** markers


  - Test missing dates
  - Test empty descriptions

  - Test invalid transaction types
-

-

- [x] 6. Integration testing and validation

  - Test with sample CAS PDF containing administrative transactions
  - Verify Excel file opens correctly and displays administrative transactions
  - Validate JSON structure matches expected format
  - Test edge cases: no administrative transactions, consecutive administrative transactions, mixed transactions
  - _Requirements: All (integration validation)_


- [x] 6.1 Write integration tests

  - Test full extraction pipeline with administrative transactions
  - Test Excel output format and content
  - Test JSON output structure
  - Test edge cases

-

- [x] 7. Checkpoint - Ensure all tests pass



- [x] 7.1 Run unit tests for transaction extractor






  - Execute unit tests for transactionExtractor.js
  - Verify all classification and parsing tests pass
  - _Requirements: All_

- [ ] 7.2 Run property-based tests















  - Execute all property-based tests (Properties 1-10)
  - Verify properties hold across generated test cases
  - _Requirements: All_

- [x] 7.3 Run integration tests






  - Execute integration tests for full extraction pipeline
  - Verify Excel and JSON output tests pass
  - _Requirements: All_

- [x] 7.4 Run route tests






  - Execute API route tests for transaction endpoints
  - Verify Excel export endpoint tests pass
  - _Requirements: All_

- [ ] 7.5 Fix any failing tests






  - Address any test failures identified in previous sub-tasks
  - Update implementation or tests as needed
  - Re-run tests to confirm fixes
  - _Requirements: All_
