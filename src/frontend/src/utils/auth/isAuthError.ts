/**
 * Detects authorization/authentication failures from backend error messages
 * by matching common patterns in trap messages.
 */
export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'string' 
    ? error 
    : String(error);

  const authPatterns = [
    'reserved to authenticated users',
    'visitor mode',
    'Please sign in',
    'Unauthorized',
    'Only users can',
    'Can only view your own profile',
    'permission',
    'not authorized',
    'authentication required',
    'login required',
    'anonymous caller',
    'currently using the app in visitor mode',
    'Only admins can',
  ];

  return authPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}

/**
 * Extracts a user-friendly error message from an error object,
 * safely truncating if needed for display.
 */
export function extractErrorMessage(error: unknown, maxLength: number = 200): string {
  if (!error) return 'An unknown error occurred';

  let message: string;
  
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  } else if (typeof error === 'object' && error !== null && 'message' in error) {
    message = String((error as { message: unknown }).message);
  } else {
    message = String(error);
  }

  // Truncate if too long
  if (message.length > maxLength) {
    return message.substring(0, maxLength) + '...';
  }

  return message;
}

/**
 * Appends actionable guidance when the error is authorization-related.
 */
export function getErrorWithGuidance(error: unknown): string {
  const message = extractErrorMessage(error);
  
  if (isAuthError(error)) {
    return `${message}\n\nPlease ensure you are logged in with an admin Internet Identity account.`;
  }
  
  return message;
}
