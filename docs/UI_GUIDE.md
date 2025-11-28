# User Interface Guide

## New Features UI

### 1. Output Format Selection

After uploading a PDF file, you'll see the output format options:

```
┌─────────────────────────────────────────────────────┐
│  Output Format:                                     │
│                                                     │
│  ○ 📊 Excel    ○ 📦 JSON    ○ 📝 Text             │
└─────────────────────────────────────────────────────┘
```

**How to use:**
- Click on any format option to select it
- Default is Excel format
- Selection is highlighted in blue

### 2. Excel Sheet Selection

When Excel format is selected, additional options appear:

```
┌─────────────────────────────────────────────────────┐
│  Select Sheets to Generate:                        │
│                                                     │
│  ☑ Portfolio Summary                               │
│  ☑ Transactions                                    │
│  ☑ MF Holdings                                     │
└─────────────────────────────────────────────────────┘
```

**How to use:**
- Check/uncheck boxes to select sheets
- All sheets are selected by default
- You can select any combination
- At least one sheet must be selected

### 3. Complete Upload Flow

```
Step 1: Upload PDF
┌─────────────────────────────────────────────────────┐
│                                                     │
│              📄                                     │
│         Drag & Drop PDF Here                       │
│                 or                                  │
│          [Browse Files]                            │
│                                                     │
│      Maximum file size: 10MB                       │
└─────────────────────────────────────────────────────┘

Step 2: Enter Password (if needed)
┌─────────────────────────────────────────────────────┐
│  PDF Password (if protected):                      │
│  [________________________] 👁️                     │
└─────────────────────────────────────────────────────┘

Step 3: Choose Output Format
┌─────────────────────────────────────────────────────┐
│  Output Format:                                     │
│  ● 📊 Excel    ○ 📦 JSON    ○ 📝 Text             │
└─────────────────────────────────────────────────────┘

Step 4: Select Sheets (Excel only)
┌─────────────────────────────────────────────────────┐
│  Select Sheets to Generate:                        │
│  ☑ Portfolio Summary                               │
│  ☑ Transactions                                    │
│  ☐ MF Holdings                                     │
└─────────────────────────────────────────────────────┘

Step 5: Extract
┌─────────────────────────────────────────────────────┐
│     🚀 Extract & Generate Excel                    │
└─────────────────────────────────────────────────────┘
```

## Format-Specific Buttons

The extract button text changes based on selected format:

- **Excel**: `🚀 Extract & Generate Excel`
- **JSON**: `🚀 Extract & Generate JSON`
- **Text**: `🚀 Extract & Generate Text`

## Progress Indicators

During extraction, you'll see:

```
┌─────────────────────────────────────────────────────┐
│  [████████████████░░░░░░░░░░] 60%                 │
│                                                     │
│  Extracting transactions...                        │
└─────────────────────────────────────────────────────┘
```

Progress stages:
1. Uploading PDF... (10%)
2. Extracting text from PDF... (30%)
3. Parsing portfolio data... (60%)
4. Extracting transactions... (80%)
5. Generating [format] report... (95%)
6. Complete! [format] file downloaded. (100%)

## Success Message

After successful extraction:

```
┌─────────────────────────────────────────────────────┐
│  ✅  Extraction completed successfully!            │
│                                                     │
│  File: CAS_Report_1234567890.xlsx                 │
│  Check your downloads folder                       │
└─────────────────────────────────────────────────────┘
```

## Error Messages

If something goes wrong:

```
┌─────────────────────────────────────────────────────┐
│  ⚠️  Invalid file or missing data.                 │
│      Please upload a valid CAS PDF.                │
└─────────────────────────────────────────────────────┘
```

## Dark Mode

All new features support dark mode:

**Light Mode:**
- White/light gray backgrounds
- Blue accents (#4472C4)
- Dark text

**Dark Mode:**
- Dark backgrounds (rgba(30, 30, 50, 0.95))
- Light blue accents (#7B9FFF)
- Light text

Toggle dark mode using the switch in the top-right corner.

## Responsive Design

### Desktop View
- Full-width options
- Side-by-side format selection
- Spacious layout

### Mobile View
- Stacked options
- Full-width buttons
- Touch-friendly checkboxes

## Keyboard Navigation

- **Tab**: Navigate between options
- **Space**: Toggle checkboxes
- **Enter**: Submit form
- **Arrow keys**: Navigate radio buttons

## Accessibility

- All options have proper labels
- Keyboard accessible
- Screen reader friendly
- High contrast in dark mode
- Focus indicators on all interactive elements

## Tips

1. **Quick Portfolio Review**: Select Excel format with only "Portfolio Summary" sheet
2. **Complete Analysis**: Select Excel format with all sheets
3. **Data Integration**: Select JSON format for programmatic access
4. **Debugging**: Select Text format to see raw extracted data
5. **Custom Reports**: Mix and match Excel sheets based on your needs

## Common Workflows

### Financial Advisor Workflow
1. Upload client's CAS PDF
2. Select Excel format
3. Select all sheets
4. Generate comprehensive report
5. Share Excel file with client

### Developer Workflow
1. Upload CAS PDF
2. Select JSON format
3. Extract data
4. Import JSON into your application

### Quick Review Workflow
1. Upload CAS PDF
2. Select Excel format
3. Select only "Portfolio Summary"
4. Quick generation and review

### Data Analysis Workflow
1. Upload CAS PDF
2. Select Excel format
3. Select "Transactions" sheet only
4. Import into analysis tool

---

**Note**: All selections are remembered during the session. If you upload a new file, you can keep your previous format and sheet selections.
