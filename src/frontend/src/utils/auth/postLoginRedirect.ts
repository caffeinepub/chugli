const REDIRECT_KEY = 'post_login_redirect';

/**
 * Store the path to redirect to after successful login
 */
export function setPostLoginRedirect(path: string): void {
  try {
    sessionStorage.setItem(REDIRECT_KEY, path);
  } catch (error) {
    console.warn('Failed to store post-login redirect:', error);
  }
}

/**
 * Get and clear the stored redirect path
 */
export function getAndClearPostLoginRedirect(): string | null {
  try {
    const path = sessionStorage.getItem(REDIRECT_KEY);
    if (path) {
      sessionStorage.removeItem(REDIRECT_KEY);
    }
    return path;
  } catch (error) {
    console.warn('Failed to retrieve post-login redirect:', error);
    return null;
  }
}

/**
 * Clear the stored redirect path without returning it
 */
export function clearPostLoginRedirect(): void {
  try {
    sessionStorage.removeItem(REDIRECT_KEY);
  } catch (error) {
    console.warn('Failed to clear post-login redirect:', error);
  }
}
