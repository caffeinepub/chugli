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
  ];

  return authPatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase())
  );
}
