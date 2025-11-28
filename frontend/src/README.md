# Frontend Code Structure

## 📁 Folder Organization

```
src/
├── api/                    # API calls and data fetching
│   └── casApi.js          # CAS extraction API functions
├── components/            # Reusable UI components
│   ├── FileUploadArea.js  # File drag & drop upload area
│   ├── PasswordInput.js   # Password input field
│   ├── OutputOptions.js   # Format and sheet selection
│   ├── LoadingProgress.js # Progress bar with messages
│   ├── StatusMessages.js  # Error and success messages
│   ├── FeaturesList.js    # Features panel component
│   ├── ProgressBar.js     # Progress bar component
│   └── PDFUploader.js     # Main uploader container
├── constants/             # Configuration and constants
│   ├── config.js          # App configuration
│   └── messages.js        # UI messages and text
├── hooks/                 # Custom React hooks
│   ├── useFileUpload.js   # File upload logic
│   └── useUploadProgress.js # Progress tracking logic
├── App.js                 # Main app component
├── App.css                # Main app styles
└── index.js               # App entry point
```

## 🧩 Component Breakdown

### Main Components

**PDFUploader.js**
- Main container component
- Orchestrates all sub-components
- Handles upload workflow

**FeaturesList.js**
- Displays "What You'll Get" features
- Reusable feature items

### Sub-Components

**FileUploadArea.js**
- Drag & drop functionality
- File selection UI
- File display with details

**PasswordInput.js**
- Password input field
- Show/hide password toggle

**OutputOptions.js**
- Format selection (Excel/JSON/Text)
- Sheet selection for Excel

**LoadingProgress.js**
- Progress bar display
- Status messages
- Fun messages and facts

**StatusMessages.js**
- ErrorMessage component
- SuccessMessage component

## 🎣 Custom Hooks

**useFileUpload.js**
- File selection and validation
- Drag & drop handlers
- File state management
- Sheet selection logic

**useUploadProgress.js**
- Progress tracking
- Loading state management
- Fun message rotation
- Cleanup on unmount

## 🔧 API Layer

**casApi.js**
- `extractCASData()` - Upload and extract CAS data
- `downloadFile()` - Download generated file
- `extractFilenameFromHeaders()` - Parse filename from response
- `getOutputFilename()` - Generate output filename

## 📋 Constants

**config.js**
- API_BASE_URL
- FILE_CONSTRAINTS (max size, accepted types)
- OUTPUT_FORMATS (excel, json, text)
- SHEET_TYPES (portfolio, transactions, holdings)
- MIME_TYPES
- FILE_EXTENSIONS
- PROGRESS_STEPS
- Timing constants

**messages.js**
- FUN_MESSAGES - Rotating loading messages
- FUN_FACTS - Educational facts
- ERROR_MESSAGES - Error text
- SUCCESS_MESSAGES - Success text
- STATUS_MESSAGES - Status updates

## 🔄 Data Flow

1. **User uploads file** → `FileUploadArea` → `useFileUpload` hook
2. **User clicks extract** → `PDFUploader` → `casApi.extractCASData()`
3. **Progress updates** → `useUploadProgress` → `LoadingProgress`
4. **Download complete** → `casApi.downloadFile()` → `SuccessMessage`

## 🎨 Benefits of This Structure

✅ **Modular** - Each component has a single responsibility
✅ **Reusable** - Components can be used independently
✅ **Maintainable** - Easy to find and update code
✅ **Testable** - Each piece can be tested in isolation
✅ **Scalable** - Easy to add new features
✅ **Clean** - Separation of concerns (UI, logic, data, constants)

## 🚀 Usage Example

```javascript
import PDFUploader from './components/PDFUploader';

function App() {
  return <PDFUploader darkMode={false} />;
}
```

## 📝 Adding New Features

1. **New component** → Add to `components/`
2. **New API call** → Add to `api/casApi.js`
3. **New constant** → Add to `constants/config.js` or `messages.js`
4. **New logic** → Create custom hook in `hooks/`
