import React from 'react';
import { OUTPUT_FORMATS, SHEET_TYPES } from '../../constants/config';

const OutputOptions = ({ outputFormat, selectedSheets, onFormatChange, onSheetToggle }) => {
  return (
    <div className="options-section">
      <div className="format-selection">
        <label>Output Format:</label>
        <div className="format-options">
          <label className="format-option">
            <input
              type="radio"
              name="format"
              value={OUTPUT_FORMATS.EXCEL}
              checked={outputFormat === OUTPUT_FORMATS.EXCEL}
              onChange={(e) => onFormatChange(e.target.value)}
            />
            <span>📊 Excel</span>
          </label>
          <label className="format-option">
            <input
              type="radio"
              name="format"
              value={OUTPUT_FORMATS.JSON}
              checked={outputFormat === OUTPUT_FORMATS.JSON}
              onChange={(e) => onFormatChange(e.target.value)}
            />
            <span>📦 JSON</span>
          </label>
          <label className="format-option">
            <input
              type="radio"
              name="format"
              value={OUTPUT_FORMATS.TEXT}
              checked={outputFormat === OUTPUT_FORMATS.TEXT}
              onChange={(e) => onFormatChange(e.target.value)}
            />
            <span>📝 Text</span>
          </label>
        </div>
      </div>

      {outputFormat === OUTPUT_FORMATS.EXCEL && (
        <div className="sheet-selection">
          <label>Select Sheets to Generate:</label>
          <div className="sheet-options">
            <label className="sheet-option">
              <input
                type="checkbox"
                checked={selectedSheets[SHEET_TYPES.PORTFOLIO]}
                onChange={() => onSheetToggle(SHEET_TYPES.PORTFOLIO)}
              />
              <span>Portfolio Summary</span>
            </label>
            <label className="sheet-option">
              <input
                type="checkbox"
                checked={selectedSheets[SHEET_TYPES.TRANSACTIONS]}
                onChange={() => onSheetToggle(SHEET_TYPES.TRANSACTIONS)}
              />
              <span>Transactions</span>
            </label>
            <label className="sheet-option">
              <input
                type="checkbox"
                checked={selectedSheets[SHEET_TYPES.HOLDINGS]}
                onChange={() => onSheetToggle(SHEET_TYPES.HOLDINGS)}
              />
              <span>MF Holdings</span>
            </label>
            <label className="sheet-option">
              <input
                type="checkbox"
                checked={selectedSheets[SHEET_TYPES.RETURNS]}
                onChange={() => onSheetToggle(SHEET_TYPES.RETURNS)}
              />
              <span>Return Calculation</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputOptions;
