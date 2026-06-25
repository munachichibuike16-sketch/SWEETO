/**
 * Translates raw database/unique constraint errors into a clean, user-friendly error message.
 * If the record already exists, it displays 'already exist'.
 */
export const formatDbError = (err, defaultMsg = 'An error occurred.') => {
  if (!err) return defaultMsg;
  
  const errMsg = typeof err === 'string' ? err : (err.message || '');
  const lowercaseMsg = errMsg.toLowerCase();
  
  // Check for unique constraint / duplicate key violations
  if (
    lowercaseMsg.includes('duplicate key') || 
    lowercaseMsg.includes('unique constraint') ||
    lowercaseMsg.includes('already exists') ||
    lowercaseMsg.includes('code: 23505') || 
    err.code === '23505' ||
    err.code === 19 // SQLite constraint violation code
  ) {
    return 'already exist';
  }
  
  return errMsg || defaultMsg;
};
