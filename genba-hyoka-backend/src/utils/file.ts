/**
 * Sanitizes a filename by removing spaces and special characters.
 * Replaces spaces with underscores and removes any character that is not a letter, number, dot, or underscore.
 */
export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove special characters except . _ -
};

/**
 * Generates a timestamped filename.
 * Format: YYYYMMDD_HHMMSS_original_filename
 */
export const generateTimestampedFilename = (originalFilename: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  const timestamp = `${year}${month}${day}_${hours}${minutes}${seconds}`;
  const sanitized = sanitizeFilename(originalFilename);
  
  return `${timestamp}_${sanitized}`;
};
