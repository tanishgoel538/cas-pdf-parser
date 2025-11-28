# Implementation Plan

- [x] 1. Enhance extractISINInfo function for multi-line extraction


  - Modify `backend/src/extractors/transactionExtractor.js`
  - Implement backward search to find scheme name start (pattern: /^[A-Z]\d+-/)
  - Implement forward search until "Folio No:" boundary
  - Add whitespace normalization
  - Improve regex patterns for scheme name extraction
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.2, 3.3_

- [x] 1.1 Write unit tests for extractISINInfo


  - Test single-line scheme names (baseline)
  - Test multi-line scheme names (2-5 lines)
  - Test scheme names with special characters
  - Test the specific case of folio 2772992/35
  - Test missing ISIN marker edge case
  - Test whitespace normalization
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.2 Write property test for multi-line completeness


  - **Property 1: Multi-line scheme name completeness**
  - **Validates: Requirements 1.1, 1.3**

- [x] 1.3 Write property test for whitespace normalization

  - **Property 8: Whitespace normalization**
  - **Validates: Requirements 3.3**

- [x] 2. Add isAdministrative field to transaction objects







  - Modify `parseTransactions` function in `backend/src/extractors/transactionExtractor.js`
  - Add `isAdministrative` boolean field to each transaction
  - Detect administrative transactions by checking transaction type
  - Detect administrative transactions by checking for "***" markers
  - Ensure field is always present (true or false, never undefined)
  - _Requirements: 2.1, 2.4_

- [x] 2.1 Write unit tests for transaction parsing with isAdministrative



  - Test stamp duty transactions (should be administrative)
  - Test STT paid transactions (should be administrative)
  - Test address update transactions (should be administrative)
  - Test purchase transactions (should not be administrative)
  - Test redemption transactions (should not be administrative)
  - Verify field is always present
  - _Requirements: 2.1, 2.4_

- [x] 2.2 Write property test for administrative field presence


  - **Property 6: Transaction administrative field presence**
  - **Validates: Requirements 2.1, 2.4**
-

- [x] 3. Enhance classifyTransactionType function






  - Modify `classifyTransactionType` in `backend/src/extractors/transactionExtractor.js`
  - Ensure all "***" marker transactions return appropriate types
  - Add specific handling for stamp duty
  - Add specific handling for STT paid
  - Add handling for other administrative types (address update, nominee registration, etc.)
  - _Requirements: 2.2, 2.3_

- [x] 3.1 Write unit tests for classifyTransactionType


  - Test stamp duty classification
  - Test STT paid classification
  - Test various administrative transaction types
  - Test investment transaction types
  - Test edge cases (empty description, mixed case)
  - _Requirements: 2.2, 2.3_

- [x] 3.2 Write property test for administrative classification


  - **Property 4: Administrative transaction classification**
  - **Validates: Requirements 2.2**

- [x] 3.3 Write property test for stamp duty and STT classification



  - **Property 5: Stamp duty and STT classification**
  - **Validates: Requirements 2.3**

- [x] 4. Update Excel output to properly display administrative transactions




  - Modify `backend/src/extractors/excelGenerator.js`
  - Remove the separate "Is Administrative" column
  - Ensure Transaction Type column properly shows administrative transaction types ("Stamp Duty", "STT Paid", "Administrative")
  - Administrative transactions are identified by their Transaction Type value, not a separate column
  - _Requirements: 2.5_

- [x] 4.1 Write unit tests for Excel generator

  - Verify no separate "Is Administrative" column exists
  - Verify Transaction Type shows "Stamp Duty" for stamp duty transactions
  - Verify Transaction Type shows "STT Paid" for STT transactions
  - Verify Transaction Type shows "Administrative" for other administrative transactions
  - _Requirements: 2.5_

- [x] 5. Add error handling and logging

  - Add detailed logging to extractISINInfo for debugging
  - Add error handling for missing field boundaries
  - Add fallback logic (10 line maximum)
  - Add logging for transaction classification
  - Add warning logs for missing isAdministrative field
  - _Requirements: 3.4_

- [x] 6. Integration testing checkpoint



  - Test with the actual CAS file containing folio 2772992/35
  - Verify scheme name "Bandhan Large & Mid Cap Fund..." is extracted correctly
  - Verify stamp duty transactions (0.25 amounts) are flagged as administrative
  - Verify Excel output shows administrative transactions with proper Transaction Type values
  - Compare output format with ITR2 for consistency
  - Ensure all tests pass, ask the user if questions arise
  - _Requirements: All_

- [x] 6.1 Write property test for required field validation

  - **Property 9: Required field validation**
  - **Validates: Requirements 3.5**
