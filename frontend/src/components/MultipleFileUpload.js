import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Checkbox,
  FormControlLabel,
  Typography,
  Box,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import './MultipleFileUpload.css';

const MultipleFileUpload = ({ files, passwords, validationStatus, onRemoveFile, onPasswordChange, darkMode }) => {
  const [samePasswordForAll, setSamePasswordForAll] = useState(false);
  const [globalPassword, setGlobalPassword] = useState('');

  const handleGlobalPasswordChange = (e) => {
    const password = e.target.value;
    setGlobalPassword(password);
    
    if (samePasswordForAll) {
      files.forEach(file => {
        onPasswordChange(file.name, password);
      });
    }
  };

  const handleSamePasswordToggle = (e) => {
    const checked = e.target.checked;
    setSamePasswordForAll(checked);
    
    if (checked) {
      // Apply global password to all files
      files.forEach(file => {
        onPasswordChange(file.name, globalPassword);
      });
    }
  };

  const handleIndividualPasswordChange = (filename, password) => {
    if (!samePasswordForAll) {
      onPasswordChange(filename, password);
    }
  };

  const getPasswordForFile = (filename) => {
    return passwords[filename] || '';
  };

  const getValidationStatus = (filename) => {
    return validationStatus?.[filename] || null;
  };

  const hasError = (filename) => {
    const status = getValidationStatus(filename);
    return status && !status.isValid && !status.isPending;
  };

  const isPending = (filename) => {
    const status = getValidationStatus(filename);
    return status && status.isPending;
  };

  const getErrorMessage = (filename) => {
    const status = getValidationStatus(filename);
    return status?.error || '';
  };

  const getRowColor = (filename) => {
    if (hasError(filename)) {
      return {
        bg: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 235, 238, 0.8)',
        bgHover: darkMode ? 'rgba(244, 67, 54, 0.15)' : 'rgba(255, 235, 238, 1)',
        border: '#f44336'
      };
    }
    if (isPending(filename)) {
      return {
        bg: darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 243, 224, 0.8)',
        bgHover: darkMode ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 243, 224, 1)',
        border: '#ff9800'
      };
    }
    return {
      bg: 'transparent',
      bgHover: darkMode ? 'rgba(168, 185, 255, 0.05)' : 'rgba(102, 126, 234, 0.05)',
      border: 'transparent'
    };
  };

  const getIcon = (filename) => {
    if (hasError(filename)) return '⚠️';
    if (isPending(filename)) return '⏳';
    return '📄';
  };

  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2);
  };

  return (
    <div className={`multiple-file-upload ${darkMode ? 'dark-mode' : ''}`}>
      <Box sx={{ mb: 2 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            fontSize: '1.1rem',
            background: darkMode
              ? 'linear-gradient(135deg, #a8b9ff 0%, #c084fc 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            mb: 1
          }}
        >
          Selected Files ({files.length})
        </Typography>
        
        <FormControlLabel
          control={
            <Checkbox
              checked={samePasswordForAll}
              onChange={handleSamePasswordToggle}
              sx={{
                color: darkMode ? '#a8b9ff' : '#667eea',
                '&.Mui-checked': {
                  color: darkMode ? '#a8b9ff' : '#667eea'
                }
              }}
            />
          }
          label={
            <Typography sx={{ fontSize: '0.9rem', color: darkMode ? '#b8b8d1' : '#555' }}>
              Use same password for all files
            </Typography>
          }
        />
        
        {samePasswordForAll && (
          <TextField
            fullWidth
            size="small"
            type="password"
            placeholder="Enter password for all files"
            value={globalPassword}
            onChange={handleGlobalPasswordChange}
            sx={{
              mt: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                '& fieldset': {
                  borderColor: darkMode ? '#555' : '#ddd'
                },
                '&:hover fieldset': {
                  borderColor: darkMode ? '#a8b9ff' : '#667eea'
                },
                '&.Mui-focused fieldset': {
                  borderColor: darkMode ? '#a8b9ff' : '#667eea'
                }
              },
              '& .MuiInputBase-input': {
                color: darkMode ? '#fff' : '#333'
              }
            }}
          />
        )}
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          borderRadius: '12px',
          maxHeight: '400px'
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell
                sx={{
                  backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                  color: darkMode ? '#a8b9ff' : '#667eea',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                File Name
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                  color: darkMode ? '#a8b9ff' : '#667eea',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Size (MB)
              </TableCell>
              <TableCell
                sx={{
                  backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                  color: darkMode ? '#a8b9ff' : '#667eea',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Password (if protected)
              </TableCell>
              <TableCell
                align="center"
                sx={{
                  backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)',
                  color: darkMode ? '#a8b9ff' : '#667eea',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {files.map((file, index) => (
              <TableRow
                key={index}
                sx={{
                  backgroundColor: getRowColor(file.name).bg,
                  borderLeft: (hasError(file.name) || isPending(file.name)) 
                    ? `4px solid ${getRowColor(file.name).border}` 
                    : 'none',
                  '&:hover': {
                    backgroundColor: getRowColor(file.name).bgHover
                  }
                }}
              >
                <TableCell sx={{ color: darkMode ? '#fff' : '#333', fontSize: '0.85rem' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getIcon(file.name)}
                      <Typography sx={{ 
                        fontSize: '0.85rem', 
                        fontWeight: (hasError(file.name) || isPending(file.name)) ? 600 : 400 
                      }}>
                        {file.name}
                      </Typography>
                    </Box>
                    {(hasError(file.name) || isPending(file.name)) && (
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: hasError(file.name) ? '#f44336' : '#ff9800',
                          fontWeight: 600,
                          ml: 3
                        }}
                      >
                        {getErrorMessage(file.name)}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ color: darkMode ? '#b8b8d1' : '#666', fontSize: '0.85rem' }}>
                  <Chip
                    label={formatFileSize(file.size)}
                    size="small"
                    sx={{
                      backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.2)' : 'rgba(102, 126, 234, 0.2)',
                      color: darkMode ? '#a8b9ff' : '#667eea',
                      fontWeight: 600,
                      fontSize: '0.75rem'
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    size="small"
                    type="password"
                    placeholder={hasError(file.name) ? "Required" : "Optional"}
                    value={getPasswordForFile(file.name)}
                    onChange={(e) => handleIndividualPasswordChange(file.name, e.target.value)}
                    disabled={samePasswordForAll}
                    error={hasError(file.name) || isPending(file.name)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'white',
                        '& fieldset': {
                          borderColor: hasError(file.name) ? '#f44336' : 
                                      isPending(file.name) ? '#ff9800' : 
                                      darkMode ? '#555' : '#ddd',
                          borderWidth: (hasError(file.name) || isPending(file.name)) ? '2px' : '1px'
                        },
                        '&:hover fieldset': {
                          borderColor: hasError(file.name) ? '#f44336' : 
                                      isPending(file.name) ? '#ff9800' : 
                                      darkMode ? '#a8b9ff' : '#667eea'
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: hasError(file.name) ? '#f44336' : 
                                      isPending(file.name) ? '#ff9800' : 
                                      darkMode ? '#a8b9ff' : '#667eea'
                        },
                        '&.Mui-disabled': {
                          backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'
                        }
                      },
                      '& .MuiInputBase-input': {
                        color: darkMode ? '#fff' : '#333',
                        fontSize: '0.85rem'
                      }
                    }}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    size="small"
                    onClick={() => onRemoveFile(file.name)}
                    sx={{
                      color: darkMode ? '#ff6b6b' : '#f44336',
                      '&:hover': {
                        backgroundColor: darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Show summary of validation errors */}
      {validationStatus && Object.keys(validationStatus).length > 0 && (
        <Box sx={{ mt: 1 }}>
          {(() => {
            const errorCount = files.filter(f => hasError(f.name)).length;
            const pendingCount = files.filter(f => isPending(f.name)).length;
            const validCount = files.filter(f => {
              const status = validationStatus[f.name];
              return status && status.isValid;
            }).length;
            
            if (errorCount > 0) {
              return (
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: '#f44336',
                    fontWeight: 600,
                    textAlign: 'center',
                    padding: '0.5rem',
                    backgroundColor: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(255, 235, 238, 0.8)',
                    borderRadius: '8px'
                  }}
                >
                  ⚠️ {errorCount} file{errorCount > 1 ? 's' : ''} need{errorCount === 1 ? 's' : ''} attention. Please provide password{errorCount > 1 ? 's' : ''} for highlighted file{errorCount > 1 ? 's' : ''}.
                </Typography>
              );
            } else if (pendingCount > 0) {
              return (
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: '#ff9800',
                    fontWeight: 600,
                    textAlign: 'center',
                    padding: '0.5rem',
                    backgroundColor: darkMode ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 243, 224, 0.8)',
                    borderRadius: '8px'
                  }}
                >
                  ⏳ {pendingCount} file{pendingCount > 1 ? 's' : ''} pending validation. Click Extract to validate.
                </Typography>
              );
            } else if (validCount === files.length) {
              return (
                <Typography
                  sx={{
                    fontSize: '0.85rem',
                    color: '#4caf50',
                    fontWeight: 600,
                    textAlign: 'center',
                    padding: '0.5rem',
                    backgroundColor: darkMode ? 'rgba(76, 175, 80, 0.1)' : 'rgba(232, 245, 233, 0.8)',
                    borderRadius: '8px'
                  }}
                >
                  ✅ All files are valid and ready to upload!
                </Typography>
              );
            }
            return null;
          })()}
        </Box>
      )}
    </div>
  );
};

export default MultipleFileUpload;
