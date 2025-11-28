export const FUN_MESSAGES = [
  "Hold on a sec... ⏳",
  "Crunching the numbers... 🔢",
  "Reading your portfolio... 📊",
  "Almost there... 🚀",
  "Extracting data magic... ✨",
  "Parsing transactions... 💰",
  "Organizing your funds... 📈",
  "Just a moment... ⌛",
  "Working on it... 🔧",
  "Processing your data... 💼",
  "Analyzing holdings... 📋",
  "Generating your report... 📄",
  "Hang tight... 🎯",
  "Making it perfect... 💎",
  "Nearly done... 🏁"
];

export const FUN_FACTS = [
  "💡 Did you know? Mutual funds were invented in 1924!",
  "💡 Fun fact: India has over 40 million mutual fund investors!",
  "💡 Tip: Diversification helps reduce investment risk.",
  "💡 Did you know? SIP stands for Systematic Investment Plan.",
  "💡 Fun fact: The first index fund was created in 1975.",
  "💡 Tip: Long-term investing often beats short-term trading.",
  "💡 Did you know? NAV is calculated at the end of each trading day.",
  "💡 Fun fact: Equity funds invest primarily in stocks.",
  "💡 Tip: Review your portfolio at least once a year.",
  "💡 Did you know? SEBI regulates mutual funds in India.",
  "💡 Fun fact: Debt funds are generally less risky than equity funds.",
  "💡 Tip: Start investing early to benefit from compounding.",
  "💡 Did you know? ELSS funds offer tax benefits under Section 80C.",
  "💡 Fun fact: Mutual funds pool money from multiple investors.",
  "💡 Tip: Always read the scheme document before investing."
];

export const ERROR_MESSAGES = {
  INVALID_FILE: 'Please upload a valid PDF file.',
  FILE_TOO_LARGE: 'File size must be less than 10MB.',
  NO_FILE_SELECTED: 'Please select a PDF file first.',
  EXTRACTION_FAILED: 'Failed to extract CAS data. Please try again.',
  INVALID_DATA: 'Invalid file or missing data. Please upload a valid CAS PDF.',
  SERVER_ERROR: 'Cannot connect to server. Please ensure the backend is running.'
};

export const SUCCESS_MESSAGES = {
  EXTRACTION_COMPLETE: 'Extraction completed successfully!',
  EXCEL_DOWNLOADED: 'Complete! Excel file downloaded.',
  JSON_DOWNLOADED: 'Complete! JSON file downloaded.',
  TEXT_DOWNLOADED: 'Complete! Text file downloaded.'
};

export const STATUS_STATES = {
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  FAILED: 'Failed'
};

export const STATUS_MESSAGES = {
  UPLOADING: 'Uploading PDF...',
  EXTRACTING: 'Extracting text from PDF...',
  PARSING: 'Parsing portfolio data...',
  TRANSACTIONS: 'Extracting transactions...',
  GENERATING_EXCEL: 'Generating Excel report...',
  GENERATING_JSON: 'Generating JSON file...',
  GENERATING_TEXT: 'Generating text file...'
};
