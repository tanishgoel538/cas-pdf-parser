# Multiple Files Upload Feature - Implementation Guide

## ✅ Completed Backend

### 1. Installed Dependencies
```bash
cd backend
yarn add archiver
```

### 2. Created Backend Route
- **File**: `backend/src/routes/batchCasRoutes.js`
- **Endpoint**: `POST /api/extract-cas-batch`
- **Features**:
  - Accepts up to 50 PDF files
  - Individual password support per file
  - Processes all files in batch
  - Returns ZIP file with all outputs
  - Includes `batch_results.json` with success/failure status

### 3. Updated Server
- Added batch routes to `backend/server.js`

## 🚧 Frontend Implementation Needed

### Components Created:
1. **MultipleFileUpload.js** - Table view for managing multiple files
2. **MultipleFileUpload.css** - Styling

### API Function Added:
- `extractCASDataBatch()` in `frontend/src/api/casApi.js`

### What Still Needs to be Done:

#### 1. Update PDFUploader Component
Add mode switching between single and multiple file upload:

```javascript
// Add state for mode
const [uploadMode, setUploadMode] = useState('single'); // 'single' or 'multiple'
const [multipleFiles, setMultipleFiles] = useState([]);
const [filePasswords, setFilePasswords] = useState({});

// Add mode toggle buttons
<Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
  <Button
    variant={uploadMode === 'single' ? 'contained' : 'outlined'}
    onClick={() => setUploadMode('single')}
  >
    Single File
  </Button>
  <Button
    variant={uploadMode === 'multiple' ? 'contained' : 'outlined'}
    onClick={() => setUploadMode('multiple')}
  >
    Multiple Files
  </Button>
</Box>

// Handle multiple file selection
const handleMultipleFileSelection = (selectedFiles) => {
  const filesArray = Array.from(selectedFiles);
  const validFiles = filesArray.filter(file => {
    if (file.type !== 'application/pdf') return false;
    if (file.size > 10 * 1024 * 1024) return false;
    return true;
  });
  
  const filesWithPassword = validFiles.map(file => ({
    ...file,
    password: ''
  }));
  
  setMultipleFiles(filesWithPassword);
};

// Handle batch upload
const handleBatchUpload = async () => {
  const formData = new FormData();
  
  multipleFiles.forEach(file => {
    formData.append('pdfs', file);
  });
  
  formData.append('outputFormat', outputFormat);
  formData.append('passwords', JSON.stringify(filePasswords));
  
  if (outputFormat === 'excel') {
    const sheets = Object.keys(selectedSheets).filter(key => selectedSheets[key]);
    formData.append('sheets', JSON.stringify(sheets));
  }
  
  const response = await extractCASDataBatch(formData, onUploadProgress);
  
  // Download ZIP file
  const zipFilename = `CAS_Batch_${Date.now()}.zip`;
  downloadFile(response.data, zipFilename, 'application/zip');
  
  // Add to history
  addHistoryItem({
    filename: `Batch Upload (${multipleFiles.length} files)`,
    originalFilename: zipFilename,
    format: 'zip',
    success: true,
    fileCount: multipleFiles.length
  });
};
```

#### 2. Update FileUploadArea Component
Add support for multiple file selection:

```javascript
<input
  ref={fileInputRef}
  type="file"
  accept=".pdf"
  multiple={uploadMode === 'multiple'}
  onChange={onFileChange}
  style={{ display: 'none' }}
/>
```

#### 3. Update Upload History
Show file count for batch uploads:

```javascript
<Typography>
  {item.fileCount ? `${item.filename} (${item.fileCount} files)` : item.filename}
</Typography>
```

#### 4. Update Button Text
```javascript
{uploadMode === 'single' ? (
  <button className="upload-button" onClick={handleUpload}>
    🚀 Extract & Generate {formatName}
  </button>
) : (
  <button className="upload-button" onClick={handleBatchUpload}>
    🚀 Extract All & Download ZIP
  </button>
)}
```

## 📋 Features Summary

### Single File Mode (Current):
- Upload one PDF
- Optional password
- Choose format (Excel/JSON/Text)
- Download single file

### Multiple Files Mode (New):
- Upload multiple PDFs (up to 50)
- Table view with:
  - File name
  - File size
  - Individual password field
  - Delete button
- Checkbox: "Use same password for all"
- Same format options
- Download ZIP file containing all outputs
- Single history entry showing file count

## 🎨 UI Flow

1. User sees two buttons: "Single File" | "Multiple Files"
2. In Multiple mode:
   - Browse/drag-drop multiple files
   - Files appear in table
   - Can set individual passwords or use same for all
   - Select output format
   - Click "Extract All & Download ZIP"
3. Progress shows batch processing
4. ZIP file downloads with all results
5. History shows one entry: "Batch Upload (5 files)"

## 🔧 Testing

1. Test single file upload (existing functionality)
2. Test multiple file upload (2-5 files)
3. Test with password-protected PDFs
4. Test "same password for all" checkbox
5. Test different output formats
6. Verify ZIP file contains all outputs
7. Check history entry shows file count

## 📝 Notes

- Backend supports up to 50 files per batch
- Each file is processed independently
- Failed files don't stop the batch
- `batch_results.json` included in ZIP shows success/failure per file
- ZIP file auto-deletes after 5 minutes (like single files)
