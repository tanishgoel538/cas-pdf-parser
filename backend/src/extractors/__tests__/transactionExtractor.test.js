/**
 * Unit tests for transactionExtractor.js
 * Testing enhanced multi-line extraction and administrative transaction tracking
 */

const { extractISINInfo, classifyTransactionType, parseNumericValue } = require('../transactionExtractor');

describe('extractISINInfo', () => {
  describe('Single-line scheme names (baseline)', () => {
    test('should extract scheme name from single line', () => {
      const folioText = `PAN: ANNPB9319H KYC: OK PAN: OK
G357-Bandhan Multi Cap Fund-Regular Plan-Growth (Non-Demat) - ISIN: INF194KB1CI6(Advisor: ARN-122530) Registrar : CAMS
Folio No: 2208952 / 87`;

      const result = extractISINInfo(folioText);

      expect(result.schemeName).toBe('Bandhan Multi Cap Fund-Regular Plan-Growth (Non-Demat)');
      expect(result.isin).toBe('INF194KB1CI6');
      expect(result.registrar).toBe('CAMS');
      expect(result.advisor).toBe('ARN-122530');
    });
  });

  describe('Multi-line scheme names', () => {
    test('should extract scheme name spanning 2 lines', () => {
      const folioText = `PAN: ANNPB9319H KYC: OK PAN: OK
G201-Bandhan Large & Mid Cap Fund-Regular Plan-Growth ( Formerly Known as Bandhan Core Equity Fund-Regular Plan-Growth) (Non
-Demat) - ISIN: INF194K01524(Advisor: ARN-111569)
Registrar : CAMS
Folio No: 2772992 / 35`;

      const result = extractISINInfo(folioText);

      expect(result.schemeName).not.toBeNull();
      expect(result.schemeName).toContain('Bandhan Large & Mid Cap Fund');
      expect(result.schemeName).toContain('Formerly Known as');
      expect(result.schemeName).toContain('Non -Demat');
      expect(result.isin).toBe('INF194K01524');
      expect(result.registrar).toBe('CAMS');
    });

    test('should extract scheme name spanning 3 lines', () => {
      const folioText = `PAN: AAEPB2171R KYC: OK PAN: OK
B205RG-Aditya Birla Sun Life Arbitrage Fund
- Growth-Regular Plan
(Non-Demat) - ISIN: INF209K01264(Advisor: ARN-111569) Registrar : CAMS
Folio No: 1044948557`;

      const result = extractISINInfo(folioText);

      expect(result.schemeName).not.toBeNull();
      expect(result.schemeName).toContain('Aditya Birla Sun Life Arbitrage Fund');
      expect(result.schemeName).toContain('Growth-Regular Plan');
      expect(result.isin).toBe('INF209K01264');
    });

    test('should handle scheme name with special characters across multiple lines', () => {
      const folioText = `PAN: TEST123456A KYC: OK
X123-Test Fund & Growth (Special)
- Regular Plan - Direct
(Non-Demat) - ISIN: INF123456789(Advisor: ARN-999999)
Registrar : TEST
Folio No: 123456`;

      const result = extractISINInfo(folioText);

      expect(result.schemeName).not.toBeNull();
      expect(result.schemeName).toContain('&');
      expect(result.schemeName).toContain('(Special)');
      expect(result.isin).toBe('INF123456789');
    });
  });

  describe('Specific test case: folio 2772992/35', () => {
    test('should correctly extract the Bandhan Large & Mid Cap Fund scheme name', () => {
      const folioText = `PAN: ANNPB9319H KYC: OK PAN: OK
G201-Bandhan Large & Mid Cap Fund-Regular Plan-Growth ( Formerly Known as Bandhan Core Equity Fund-Regular Plan-Growth) (Non
-Demat) - ISIN: INF194K01524(Advisor: ARN-111569)
Registrar : CAMS
Folio No: 2772992 / 35
Nidhi Bhasin`;

      const result = extractISINInfo(folioText);

      // The key assertion - scheme name should not be null
      expect(result.schemeName).not.toBeNull();
      
      // Should contain the full scheme name
      expect(result.schemeName).toContain('Bandhan Large & Mid Cap Fund-Regular Plan-Growth');
      expect(result.schemeName).toContain('Formerly Known as Bandhan Core Equity Fund-Regular Plan-Growth');
      expect(result.schemeName).toContain('(Non -Demat)');
      
      // Other fields should be extracted correctly
      expect(result.isin).toBe('INF194K01524');
      expect(result.registrar).toBe('CAMS');
      expect(result.advisor).toBe('ARN-111569');
      
      // isinLine should contain the complete information
      expect(result.isinLine).toContain('G201-');
      expect(result.isinLine).toContain('ISIN: INF194K01524');
      expect(result.isinLine).toContain('Registrar : CAMS');
    });
  });

  describe('Edge cases', () => {
    test('should handle missing ISIN marker', () => {
      const folioText = `PAN: TEST123456A KYC: OK
G123-Some Fund Name
Folio No: 123456`;

      const result = extractISINInfo(folioText);

      expect(result.isinLine).toBeNull();
      expect(result.schemeName).toBeNull();
      expect(result.isin).toBeNull();
    });

    test('should handle missing scheme code prefix', () => {
      const folioText = `PAN: TEST123456A KYC: OK
Some Fund Name - ISIN: INF123456789
Folio No: 123456`;

      const result = extractISINInfo(folioText);

      // Should still extract ISIN even if scheme name pattern doesn't match
      expect(result.isin).toBe('INF123456789');
    });

    test('should normalize whitespace (tabs, multiple spaces)', () => {
      const folioText = `PAN: TEST123456A KYC: OK
G123-Test    Fund   Name
  -  Regular   Plan
(Non-Demat)  -  ISIN:   INF123456789(Advisor:  ARN-111111)
Registrar  :  CAMS
Folio No: 123456`;

      const result = extractISINInfo(folioText);

      // Whitespace should be normalized to single spaces
      expect(result.isinLine).not.toMatch(/\s{2,}/);
      expect(result.schemeName).not.toMatch(/\s{2,}/);
      expect(result.isin).toBe('INF123456789');
    });

    test('should stop at Folio No: boundary', () => {
      const folioText = `PAN: TEST123456A KYC: OK
G123-Test Fund - ISIN: INF123456789
Registrar : CAMS
Folio No: 123456
This should not be included`;

      const result = extractISINInfo(folioText);

      expect(result.isinLine).not.toContain('This should not be included');
    });
  });

  describe('Whitespace normalization', () => {
    test('should replace multiple spaces with single space', () => {
      const folioText = `PAN: TEST KYC: OK
G123-Test    Fund    Name - ISIN: INF123
Folio No: 123`;

      const result = extractISINInfo(folioText);

      expect(result.isinLine).not.toMatch(/  +/);
    });

    test('should handle tabs and newlines', () => {
      const folioText = `PAN: TEST KYC: OK
G123-Test\tFund\tName
- ISIN: INF123
Folio No: 123`;

      const result = extractISINInfo(folioText);

      expect(result.isinLine).not.toContain('\t');
      expect(result.isinLine).not.toContain('\n');
    });
  });
});

describe('classifyTransactionType', () => {
  describe('Administrative transactions', () => {
    test('should classify stamp duty as Stamp Duty', () => {
      expect(classifyTransactionType('*** Stamp Duty ***')).toEqual({ type: 'Stamp Duty', isAdministrative: true });
      expect(classifyTransactionType('*** stamp duty ***')).toEqual({ type: 'Stamp Duty', isAdministrative: true });
    });

    test('should classify STT paid as STT Paid', () => {
      expect(classifyTransactionType('*** STT Paid ***')).toEqual({ type: 'STT Paid', isAdministrative: true });
      expect(classifyTransactionType('*** stt paid ***')).toEqual({ type: 'STT Paid', isAdministrative: true });
      expect(classifyTransactionType('*** STT ***')).toEqual({ type: 'STT Paid', isAdministrative: true });
    });

    test('should classify other *** transactions as Administrative', () => {
      expect(classifyTransactionType('***Address Updated from KRA Data***')).toEqual({ type: 'Administrative', isAdministrative: true });
      expect(classifyTransactionType('***Registration of Nominee***')).toEqual({ type: 'Administrative', isAdministrative: true });
      expect(classifyTransactionType('***CAN Data Updation***')).toEqual({ type: 'Administrative', isAdministrative: true });
      expect(classifyTransactionType('***NCT Change of Default Bank Mandate***')).toEqual({ type: 'Administrative', isAdministrative: true });
    });
  });

  describe('Investment transactions', () => {
    test('should classify systematic investment', () => {
      expect(classifyTransactionType('Systematic Investment (1)')).toEqual({ type: 'Systematic Investment', isAdministrative: false });
      expect(classifyTransactionType('SIP Purchase')).toEqual({ type: 'Systematic Investment', isAdministrative: false });
    });

    test('should classify switch transactions', () => {
      expect(classifyTransactionType('Switch-Out - To ABSL Small Cap Fund')).toEqual({ type: 'Switch-Out', isAdministrative: false });
      expect(classifyTransactionType('Switchout to another fund')).toEqual({ type: 'Switch-Out', isAdministrative: false });
      expect(classifyTransactionType('Switch-In - From ABSL Arbitrage Fund')).toEqual({ type: 'Switch-In', isAdministrative: false });
      expect(classifyTransactionType('Switchin from another fund')).toEqual({ type: 'Switch-In', isAdministrative: false });
    });

    test('should classify redemption', () => {
      expect(classifyTransactionType('Redemption less TDS, STT')).toEqual({ type: 'Redemption', isAdministrative: false });
      expect(classifyTransactionType('Redeem units')).toEqual({ type: 'Redemption', isAdministrative: false });
    });

    test('should classify dividend', () => {
      expect(classifyTransactionType('Dividend Payout')).toEqual({ type: 'Dividend', isAdministrative: false });
    });

    test('should classify purchase', () => {
      expect(classifyTransactionType('Purchase')).toEqual({ type: 'Purchase', isAdministrative: false });
      expect(classifyTransactionType('Systematic Purchase')).toEqual({ type: 'Purchase', isAdministrative: false });
    });
  });

  describe('Edge cases', () => {
    test('should default to Purchase for empty description', () => {
      expect(classifyTransactionType('')).toEqual({ type: 'Purchase', isAdministrative: false });
    });

    test('should handle mixed case', () => {
      expect(classifyTransactionType('SYSTEMATIC INVESTMENT')).toEqual({ type: 'Systematic Investment', isAdministrative: false });
      expect(classifyTransactionType('RedemPTion')).toEqual({ type: 'Redemption', isAdministrative: false });
    });
  });
});

describe('parseNumericValue', () => {
  test('should parse positive numbers', () => {
    expect(parseNumericValue('1000')).toBe(1000);
    expect(parseNumericValue('1,000')).toBe(1000);
    expect(parseNumericValue('1,000.50')).toBe(1000.50);
  });

  test('should parse negative numbers in parentheses', () => {
    expect(parseNumericValue('(1000)')).toBe(-1000);
    expect(parseNumericValue('(1,000.50)')).toBe(-1000.50);
  });

  test('should handle null and invalid inputs', () => {
    expect(parseNumericValue(null)).toBeNull();
    expect(parseNumericValue('')).toBeNull();
    expect(parseNumericValue('abc')).toBeNull();
  });

  test('should handle whitespace', () => {
    expect(parseNumericValue('  1000  ')).toBe(1000);
    expect(parseNumericValue('  (1000)  ')).toBe(-1000);
  });
});


describe('parseTransactions with transaction type classification', () => {
  const { parseTransactions } = require('../transactionExtractor');

  describe('Administrative transactions', () => {
    test('should classify stamp duty transactions correctly', () => {
      const folioText = `Opening Unit Balance: 0.000
18-Aug-2023 299,985.00 23.3062	12,871.468	Purchase 12,871.468
18-Aug-2023 15.00	*** Stamp Duty ***
Closing Unit Balance: 12,871.468`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBeGreaterThan(0);
      
      // Find the stamp duty transaction (description contains ***)
      const stampDutyTx = transactions.find(tx => tx.description.includes('***'));
      expect(stampDutyTx).toBeDefined();
      expect(stampDutyTx.transactionType).toBe('Stamp Duty');
    });

    test('should classify STT paid transactions correctly', () => {
      const folioText = `Opening Unit Balance: 1000.000
27-Sep-2023 (50,000.00) 23.4671	(2,130.664)	Switch-Out 10,740.804
27-Sep-2023 0.50	*** STT Paid ***
Closing Unit Balance: 10,740.804`;

      const transactions = parseTransactions(folioText);

      const sttTx = transactions.find(tx => tx.description.includes('***'));
      expect(sttTx).toBeDefined();
      expect(sttTx.transactionType).toBe('STT Paid');
    });

    test('should classify address update transactions as administrative', () => {
      const folioText = `Opening Unit Balance: 0.000
19-Aug-2023	***Address Updated from KRA Data***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      const addressTx = transactions.find(tx => tx.description.includes('***'));
      expect(addressTx).toBeDefined();
      expect(addressTx.transactionType).toBe('Administrative');
    });
  });

  describe('Non-administrative transactions', () => {
    test('should classify purchase transactions correctly', () => {
      const folioText = `Opening Unit Balance: 0.000
20-Mar-2019 3,000.00 26.82	111.857	Systematic Investment (1) 111.857
Closing Unit Balance: 111.857`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBe(1);
      expect(transactions[0].transactionType).toBe('Systematic Investment');
      expect(transactions[0].transactionType).not.toBe('Administrative');
    });

    test('should classify redemption transactions correctly', () => {
      const folioText = `Opening Unit Balance: 1000.000
09-Aug-2023 (199,072.29) 42.17	(4,720.756)	Redemption less TDS, STT 0.000
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBe(1);
      expect(transactions[0].transactionType).toBe('Redemption');
      expect(transactions[0].transactionType).not.toBe('Administrative');
    });

    test('should classify switch transactions correctly', () => {
      const folioText = `Opening Unit Balance: 1000.000
03-Oct-2023 49,997.50 66.8448	747.964	Switchin - From ABSL Arbitrage Fund - Gr 747.964
Closing Unit Balance: 747.964`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBe(1);
      expect(transactions[0].transactionType).toBe('Switch-In');
      expect(transactions[0].transactionType).not.toBe('Administrative');
    });
  });

  describe('Field presence', () => {
    test('should always include transactionType field', () => {
      const folioText = `Opening Unit Balance: 0.000
20-Mar-2019 3,000.00 26.82	111.857	Systematic Investment (1) 111.857
18-Aug-2023 15.00	
*** Stamp Duty ***
09-Aug-2023 (199,072.29) 42.17	(4,720.756)	Redemption less TDS, STT 0.000
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBeGreaterThan(0);
      
      // Every transaction should have transactionType field
      transactions.forEach(tx => {
        expect(tx).toHaveProperty('transactionType');
        expect(typeof tx.transactionType).toBe('string');
      });
    });
  });

  describe('Mixed transactions', () => {
    test('should correctly classify mixed administrative and investment transactions', () => {
      const folioText = `Opening Unit Balance: 0.000
07-Jan-2020 5,000.00 45.360	110.229	Systematic Purchase 110.229
08-Jan-2020	***Address Updated from KRA Data***
08-Jan-2020	***Registration of Nominee***
07-Feb-2020 5,000.00 47.570	105.108	Systematic Purchase 215.337
07-Jul-2020 4,999.75 39.470	126.672	Systematic Purchase 894.593
07-Jul-2020 0.25	*** Stamp Duty ***
Closing Unit Balance: 894.593`;

      const transactions = parseTransactions(folioText);

      // Count administrative vs non-administrative
      const adminCount = transactions.filter(tx => 
        tx.transactionType === 'Administrative' || 
        tx.transactionType === 'Stamp Duty' || 
        tx.transactionType === 'STT Paid'
      ).length;
      const nonAdminCount = transactions.filter(tx => 
        tx.transactionType !== 'Administrative' && 
        tx.transactionType !== 'Stamp Duty' && 
        tx.transactionType !== 'STT Paid'
      ).length;

      expect(adminCount).toBeGreaterThan(0);
      expect(nonAdminCount).toBeGreaterThan(0);
      
      // Verify specific transactions
      const purchases = transactions.filter(tx => tx.description.includes('Systematic Purchase'));
      purchases.forEach(tx => {
        expect(tx.transactionType).not.toBe('Administrative');
        expect(tx.transactionType).not.toBe('Stamp Duty');
        expect(tx.transactionType).not.toBe('STT Paid');
      });

      const adminTxs = transactions.filter(tx => tx.description.includes('***'));
      adminTxs.forEach(tx => {
        expect(['Administrative', 'Stamp Duty', 'STT Paid']).toContain(tx.transactionType);
      });
    });
  });
});


describe('Error handling and validation', () => {
  const { 
    validateTransactionType, 
    validateTransaction, 
    VALID_TRANSACTION_TYPES,
    parseTransactions 
  } = require('../transactionExtractor');

  describe('validateTransactionType', () => {
    test('should accept valid transaction types', () => {
      VALID_TRANSACTION_TYPES.forEach(type => {
        expect(validateTransactionType(type)).toBe(type);
      });
    });

    test('should default invalid transaction types to Purchase', () => {
      expect(validateTransactionType('Invalid Type')).toBe('Purchase');
      expect(validateTransactionType('Unknown')).toBe('Purchase');
      expect(validateTransactionType('Random')).toBe('Purchase');
    });

    test('should handle null and undefined', () => {
      expect(validateTransactionType(null)).toBe('Purchase');
      expect(validateTransactionType(undefined)).toBe('Purchase');
    });
  });

  describe('validateTransaction', () => {
    test('should validate a complete transaction', () => {
      const transaction = {
        date: '18-Aug-2023',
        amount: 299985,
        nav: 23.3062,
        units: 12871.468,
        transactionType: 'Purchase',
        unitBalance: 12871.468,
        description: 'Purchase'
      };

      expect(validateTransaction(transaction)).toBe(true);
    });

    test('should validate administrative transaction with null values', () => {
      const transaction = {
        date: '19-Aug-2023',
        amount: null,
        nav: null,
        units: null,
        transactionType: 'Administrative',
        unitBalance: null,
        description: '***Registration of Nominee***'
      };

      expect(validateTransaction(transaction)).toBe(true);
    });

    test('should convert undefined to null for nullable fields', () => {
      const transaction = {
        date: '18-Aug-2023',
        amount: undefined,
        nav: undefined,
        units: undefined,
        transactionType: 'Administrative',
        unitBalance: undefined,
        description: '***Test***'
      };

      validateTransaction(transaction);

      expect(transaction.amount).toBe(null);
      expect(transaction.nav).toBe(null);
      expect(transaction.units).toBe(null);
      expect(transaction.unitBalance).toBe(null);
    });

    test('should return false for missing required fields', () => {
      const transactionNoDate = {
        amount: 1000,
        transactionType: 'Purchase',
        description: 'Test'
      };

      expect(validateTransaction(transactionNoDate)).toBe(false);

      const transactionNoType = {
        date: '18-Aug-2023',
        amount: 1000,
        description: 'Test'
      };

      expect(validateTransaction(transactionNoType)).toBe(false);

      const transactionNoDescription = {
        date: '18-Aug-2023',
        amount: 1000,
        transactionType: 'Purchase'
      };

      expect(validateTransaction(transactionNoDescription)).toBe(false);
    });

    test('should validate and correct invalid transaction types', () => {
      const transaction = {
        date: '18-Aug-2023',
        amount: 1000,
        nav: 10,
        units: 100,
        transactionType: 'InvalidType',
        unitBalance: 100,
        description: 'Test'
      };

      validateTransaction(transaction);

      expect(transaction.transactionType).toBe('Purchase');
    });
  });

  describe('Error handling for malformed administrative transactions', () => {
    test('should handle missing date for administrative transaction', () => {
      const folioText = `Opening Unit Balance: 0.000
***Registration of Nominee***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      // Transaction should be skipped due to missing date
      expect(transactions.length).toBe(0);
    });

    test('should handle empty description (only asterisks)', () => {
      const folioText = `Opening Unit Balance: 0.000
19-Aug-2023
***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      // Should create transaction with default description
      expect(transactions.length).toBe(1);
      expect(transactions[0].description).toBe('***Administrative Entry***');
      expect(transactions[0].transactionType).toBe('Administrative');
    });

    test('should handle empty description (six asterisks)', () => {
      const folioText = `Opening Unit Balance: 0.000
19-Aug-2023
******
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      // Should create transaction with default description
      expect(transactions.length).toBe(1);
      expect(transactions[0].description).toBe('***Administrative Entry***');
    });

    test('should handle malformed *** marker at start of transaction section', () => {
      const folioText = `Opening Unit Balance: 0.000
***Registration of Nominee***
20-Mar-2019 3,000.00 26.82	111.857	Systematic Investment (1) 111.857
Closing Unit Balance: 111.857`;

      const transactions = parseTransactions(folioText);

      // First transaction should be skipped (no date), second should be parsed
      expect(transactions.length).toBe(1);
      expect(transactions[0].transactionType).toBe('Systematic Investment');
    });

    test('should handle administrative transaction with invalid date format', () => {
      const folioText = `Opening Unit Balance: 0.000
Invalid-Date-Format
***Registration of Nominee***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      // Transaction should be skipped due to invalid date
      expect(transactions.length).toBe(0);
    });

    test('should handle consecutive administrative transactions', () => {
      const folioText = `Opening Unit Balance: 0.000
19-Aug-2023
***Registration of Nominee***
20-Aug-2023
***Address Updated from KRA Data***
21-Aug-2023
***CAN Data Updation***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      // All three administrative transactions should be parsed
      expect(transactions.length).toBe(3);
      transactions.forEach(tx => {
        expect(tx.transactionType).toBe('Administrative');
      });
    });

    test('should handle administrative transaction with amount but no date', () => {
      const folioText = `Opening Unit Balance: 0.000
15.00
*** Stamp Duty ***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      // Transaction should be skipped (no valid date)
      expect(transactions.length).toBe(0);
    });
  });

  describe('Validation of transaction structure', () => {
    test('should ensure all transactions have consistent fields', () => {
      const folioText = `Opening Unit Balance: 0.000
18-Aug-2023 299,985.00 23.3062	12,871.468	Purchase 12,871.468
19-Aug-2023
***Registration of Nominee***
20-Aug-2023 15.00
*** Stamp Duty ***
Closing Unit Balance: 12,871.468`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBe(3);

      // All transactions should have the same fields
      const requiredFields = ['date', 'amount', 'nav', 'units', 'transactionType', 'unitBalance', 'description'];
      
      transactions.forEach(tx => {
        requiredFields.forEach(field => {
          expect(tx).toHaveProperty(field);
        });
      });
    });

    test('should ensure null values are explicitly null, not undefined', () => {
      const folioText = `Opening Unit Balance: 0.000
19-Aug-2023
***Registration of Nominee***
Closing Unit Balance: 0.000`;

      const transactions = parseTransactions(folioText);

      expect(transactions.length).toBe(1);
      
      const tx = transactions[0];
      expect(tx.amount).toBe(null);
      expect(tx.nav).toBe(null);
      expect(tx.units).toBe(null);
      expect(tx.unitBalance).toBe(null);
      
      // Ensure they're not undefined
      expect(tx.amount).not.toBe(undefined);
      expect(tx.nav).not.toBe(undefined);
      expect(tx.units).not.toBe(undefined);
      expect(tx.unitBalance).not.toBe(undefined);
    });
  });
});
