export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export const FILE_CONSTRAINTS = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ACCEPTED_TYPE: 'application/pdf'
};

export const OUTPUT_FORMATS = {
  EXCEL: 'excel',
  JSON: 'json',
  TEXT: 'text'
};

export const SHEET_TYPES = {
  PORTFOLIO: 'portfolio',
  TRANSACTIONS: 'transactions',
  HOLDINGS: 'holdings'
};

export const DEFAULT_SHEETS = {
  [SHEET_TYPES.PORTFOLIO]: true,
  [SHEET_TYPES.TRANSACTIONS]: true,
  [SHEET_TYPES.HOLDINGS]: true
};

export const MIME_TYPES = {
  [OUTPUT_FORMATS.EXCEL]: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  [OUTPUT_FORMATS.JSON]: 'application/json',
  [OUTPUT_FORMATS.TEXT]: 'text/plain'
};

export const FILE_EXTENSIONS = {
  [OUTPUT_FORMATS.EXCEL]: '.xlsx',
  [OUTPUT_FORMATS.JSON]: '.json',
  [OUTPUT_FORMATS.TEXT]: '.txt'
};

export const PROGRESS_STEPS = {
  START: 10,
  UPLOAD_MIN: 10,
  UPLOAD_MAX: 30,
  PARSING: 60,
  TRANSACTIONS: 80,
  GENERATING: 95,
  COMPLETE: 100
};

export const MESSAGE_ROTATION_INTERVAL = 2000; // 2 seconds
export const AUTO_CLEAR_DELAY = 5000; // 5 seconds
