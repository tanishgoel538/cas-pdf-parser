import axios from 'axios';
import { API_BASE_URL } from '../constants/config';

export const extractCASData = async (formData, onUploadProgress) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/extract-cas`, formData, {
      responseType: 'blob',
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress
    });
    return response;
  } catch (error) {
    throw error;
  }
};

export const downloadFile = (blob, filename, mimeType) => {
  const blobWithType = new Blob([blob], { type: mimeType });
  const url = window.URL.createObjectURL(blobWithType);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();

  // Cleanup
  setTimeout(() => {
    link.remove();
    window.URL.revokeObjectURL(url);
  }, 100);
};

export const extractFilenameFromHeaders = (headers, defaultFilename) => {
  const contentDisposition = headers['content-disposition'];
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      return filenameMatch[1].replace(/['"]/g, '');
    }
  }
  return defaultFilename;
};

export const getOutputFilename = (originalFilename, format, fileExtensions) => {
  const baseFilename = originalFilename.replace(/\.pdf$/i, '');
  return `${baseFilename}${fileExtensions[format]}`;
};
