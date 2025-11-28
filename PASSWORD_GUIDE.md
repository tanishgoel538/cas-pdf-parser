# Password Guide for Multiple Files Upload

## ✅ Fixed Issues

1. **Password fields now work properly** - You can type in individual password fields
2. **Passwords are tracked correctly** - Each file's password is stored and sent to backend
3. **Better error messages** - Clear indication when passwords are required

## 🔐 How to Use Passwords

### Option 1: Individual Passwords

1. Upload multiple files
2. For each password-protected file, type the password in its row
3. Leave blank for files without passwords
4. Click "Extract All & Download ZIP"

**Example:**
```
File 1: Jan_2024.pdf     → Password: [abc123]
File 2: Feb_2024.pdf     → Password: [      ] (no password)
File 3: Mar_2024.pdf     → Password: [xyz789]
```

### Option 2: Same Password for All

1. Upload multiple files
2. Check ☑️ "Use same password for all files"
3. Enter password in the global field
4. All files will use this password
5. Click "Extract All & Download ZIP"

**Example:**
```
☑️ Use same password for all files
Global Password: [mypassword123]

All files will use: mypassword123
```

## 🔍 What Happens

### Backend Processing:
1. Receives all files and passwords
2. Processes each file with its password
3. If a file needs a password but none provided → File fails (but others continue)
4. If wrong password → File fails (but others continue)
5. Creates ZIP with successful files
6. Includes `batch_results.json` showing which files succeeded/failed

### Example `batch_results.json`:
```json
[
  {
    "filename": "Jan_2024.pdf",
    "success": true,
    "outputFile": "Jan_2024_CAS_Report.xlsx"
  },
  {
    "filename": "Feb_2024.pdf",
    "success": false,
    "error": "Password required or incorrect for Feb_2024.pdf"
  },
  {
    "filename": "Mar_2024.pdf",
    "success": true,
    "outputFile": "Mar_2024_CAS_Report.xlsx"
  }
]
```

## ⚠️ Important Notes

1. **Partial Success is OK**: If 8 out of 10 files succeed, you still get a ZIP with those 8 files
2. **Check batch_results.json**: Always check this file in the ZIP to see which files failed
3. **Retry Failed Files**: You can retry failed files individually in Single File mode
4. **Password Errors**: If you see "password required" error, enter passwords and try again

## 🎯 Best Practices

### For Password-Protected Files:
1. ✅ Enter password before uploading
2. ✅ Double-check password spelling
3. ✅ Use "same password for all" if all files have same password
4. ✅ Check batch_results.json after download

### For Mixed Files (Some with passwords, some without):
1. ✅ Use individual password fields
2. ✅ Leave blank for files without passwords
3. ✅ Only enter passwords for protected files

## 🐛 Troubleshooting

### Error: "Failed to process batch"
**Cause**: One or more files need passwords
**Solution**: 
1. Check which files are password-protected
2. Enter passwords in the table
3. Try again

### Error: "Password required or incorrect"
**Cause**: Wrong password or missing password
**Solution**:
1. Verify the password is correct
2. Make sure you entered it for the right file
3. Try uploading that file individually first to test

### Some files succeeded, some failed
**Cause**: Normal behavior - failed files had issues
**Solution**:
1. Download the ZIP (contains successful files)
2. Check `batch_results.json` to see which failed
3. Retry failed files individually with correct passwords

## 📝 Example Workflow

### Scenario: 10 files, 3 need passwords

1. **Upload 10 files**
   ```
   File 1: Jan.pdf (no password)
   File 2: Feb.pdf (password: abc123)
   File 3: Mar.pdf (no password)
   File 4: Apr.pdf (password: xyz789)
   File 5: May.pdf (no password)
   File 6: Jun.pdf (password: def456)
   File 7: Jul.pdf (no password)
   File 8: Aug.pdf (no password)
   File 9: Sep.pdf (no password)
   File 10: Oct.pdf (no password)
   ```

2. **Enter passwords in table**
   - Row 2 (Feb.pdf): Type "abc123"
   - Row 4 (Apr.pdf): Type "xyz789"
   - Row 6 (Jun.pdf): Type "def456"
   - Leave others blank

3. **Click "Extract All & Download ZIP"**

4. **Result**: ZIP file with all 10 processed files

## ✨ Tips

- **Test passwords first**: If unsure, test one file in Single File mode first
- **Use global password**: If all files have same password, use the checkbox
- **Check results**: Always open batch_results.json to verify
- **Retry individually**: Failed files can be retried in Single File mode
