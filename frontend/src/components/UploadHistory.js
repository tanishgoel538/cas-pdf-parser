import React, { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  Box,
  Chip,
  IconButton,
  Divider,
  Button
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import HistoryIcon from '@mui/icons-material/History';
import './UploadHistory.css';

const UploadHistory = ({ history, onClearHistory, onRemoveItem, darkMode }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every minute to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (isoString) => {
    const date = new Date(isoString);
    const now = currentTime; // Use state-based current time for auto-updates
    const diffMs = now - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffSecs < 10) return 'Just now';
    if (diffSecs < 60) return `${diffSecs} sec${diffSecs > 1 ? 's' : ''} ago`;
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date(now).getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (success) => {
    return success ? (
      <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 20 }} />
    ) : (
      <ErrorIcon sx={{ color: '#f44336', fontSize: 20 }} />
    );
  };

  const getFormatColor = (format) => {
    switch (format) {
      case 'excel':
        return '#2e7d32';
      case 'json':
        return '#1976d2';
      case 'text':
        return '#ed6c02';
      default:
        return '#757575';
    }
  };

  return (
    <div className={`upload-history ${darkMode ? 'dark-mode' : ''}`}>
      <Accordion
        defaultExpanded={false}
        sx={{
          backgroundColor: darkMode ? 'rgba(26, 26, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '15px !important',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          '&:before': { display: 'none' },
          marginTop: '1rem'
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon sx={{ color: darkMode ? '#a8b9ff' : '#667eea' }} />}
          sx={{
            '& .MuiAccordionSummary-content': {
              alignItems: 'center',
              gap: 1
            }
          }}
        >
          <HistoryIcon sx={{ color: darkMode ? '#a8b9ff' : '#667eea', mr: 1 }} />
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              background: darkMode
                ? 'linear-gradient(135deg, #a8b9ff 0%, #c084fc 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            Upload History
          </Typography>
          <Chip
            label={history.length}
            size="small"
            sx={{
              ml: 1,
              backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.2)' : 'rgba(102, 126, 234, 0.2)',
              color: darkMode ? '#a8b9ff' : '#667eea',
              fontWeight: 600
            }}
          />
        </AccordionSummary>
        <AccordionDetails sx={{ pt: 0 }}>
          {history.length > 0 ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<ClearAllIcon />}
                  onClick={onClearHistory}
                  sx={{
                    color: darkMode ? '#ff6b6b' : '#f44336',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                >
                  Clear All
                </Button>
              </Box>
              <Divider sx={{ mb: 2, borderColor: darkMode ? '#444' : '#eee' }} />
              <Box sx={{ maxHeight: '400px', overflowY: 'auto' }}>
                {history.map((item, index) => (
              <Box
                key={item.id}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  marginBottom: index < history.length - 1 ? '0.5rem' : 0,
                  backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.05)' : 'rgba(102, 126, 234, 0.05)',
                  borderRadius: '8px',
                  border: `1px solid ${darkMode ? 'rgba(168, 185, 255, 0.1)' : 'rgba(102, 126, 234, 0.1)'}`
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
                  {getStatusIcon(item.success)}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      sx={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: darkMode ? '#fff' : '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {item.filename}
                      {item.fileCount && item.fileCount > 1 && (
                        <Chip
                          label={`${item.fileCount} files`}
                          size="small"
                          sx={{
                            ml: 1,
                            height: '18px',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: darkMode ? 'rgba(168, 185, 255, 0.2)' : 'rgba(102, 126, 234, 0.2)',
                            color: darkMode ? '#a8b9ff' : '#667eea'
                          }}
                        />
                      )}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <Typography
                        sx={{
                          fontSize: '0.75rem',
                          color: darkMode ? '#aaa' : '#666'
                        }}
                      >
                        {formatTimestamp(item.timestamp)}
                      </Typography>
                      <Chip
                        label={item.format.toUpperCase()}
                        size="small"
                        sx={{
                          height: '18px',
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          backgroundColor: getFormatColor(item.format),
                          color: 'white'
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => onRemoveItem(item.id)}
                  sx={{
                    color: darkMode ? '#ff6b6b' : '#f44336',
                    '&:hover': {
                      backgroundColor: darkMode ? 'rgba(255, 107, 107, 0.1)' : 'rgba(244, 67, 54, 0.1)'
                    }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
              </Box>
            </>
          ) : (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '3rem 2rem',
                textAlign: 'center'
              }}
            >
              <HistoryIcon
                sx={{
                  fontSize: 60,
                  color: darkMode ? 'rgba(168, 185, 255, 0.3)' : 'rgba(102, 126, 234, 0.3)',
                  mb: 2
                }}
              />
              <Typography
                sx={{
                  fontSize: '1rem',
                  color: darkMode ? '#888' : '#999',
                  fontWeight: 500
                }}
              >
                No items yet
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.85rem',
                  color: darkMode ? '#666' : '#aaa',
                  mt: 0.5
                }}
              >
                Your upload history will appear here
              </Typography>
            </Box>
          )}
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default UploadHistory;
