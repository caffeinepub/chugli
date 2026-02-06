import { useInternetIdentity } from './useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * Composed authentication hook that wraps useInternetIdentity
 * and provides additional helpers for auth state and logout with cache clearing.
 */
export function useAuthControls() {
  const { login, clear, loginStatus, identity, loginError } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const isLoggingIn = loginStatus === 'logging-in';
  const isLoginError = loginStatus === 'loginError';

  /**
   * Safe login helper that handles the "User is already authenticated" edge case
   */
  const safeLogin = useCallback(async () => {
    try {
      login();
    } catch (error: any) {
      if (error.message === 'User is already authenticated') {
        // Clear and retry
        await clear();
        setTimeout(() => login(), 300);
      } else {
        throw error;
      }
    }
  }, [login, clear]);

  /**
   * Logout helper that clears React Query cache
   */
  const logout = useCallback(async () => {
    await clear();
    queryClient.clear();
  }, [clear, queryClient]);

  return {
    isAuthenticated,
    login: safeLogin,
    logout,
    loginStatus,
    isLoggingIn,
    isLoginError,
    loginError,
    identity,
  };
}
