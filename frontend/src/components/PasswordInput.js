import React from 'react';

const PasswordInput = ({ password, showPassword, loading, onPasswordChange, onToggleShow }) => {
  return (
    <div className="password-section">
      <label htmlFor="pdf-password">
        PDF Password (if protected):
      </label>
      <div className="password-input-container">
        <input
          type={showPassword ? "text" : "password"}
          id="pdf-password"
          value={password}
          onChange={onPasswordChange}
          placeholder="Enter password"
          disabled={loading}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={onToggleShow}
          disabled={loading}
        >
          {showPassword ? "👁️" : "👁️‍🗨️"}
        </button>
      </div>
    </div>
  );
};

export default PasswordInput;
