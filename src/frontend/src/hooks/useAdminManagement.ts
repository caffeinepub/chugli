import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';
import { useAdminAccess } from './useAdminAccess';

export interface AdminCapability {
  canPerformAdminOps: boolean;
  reason?: string;
  nextStep?: string;
}

/**
 * Hook that combines UI unlock state with backend admin verification
 * to determine if the user can actually perform admin operations.
 */
export function useAdminCapability(): AdminCapability {
  const { isUnlocked } = useAdminAccess();
  const { identity } = useInternetIdentity();
  const { actor, isFetching: actorFetching } = useActor();

  const { data: isBackendAdmin, isLoading: adminCheckLoading } = useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      try {
        return await actor.isCallerAdmin();
      } catch (error) {
        console.error('Failed to check admin status:', error);
        return false;
      }
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  // Not logged in
  if (!identity) {
    return {
      canPerformAdminOps: false,
      reason: 'Not authenticated',
      nextStep: 'Please log in with your admin Internet Identity account',
    };
  }

  // UI not unlocked
  if (!isUnlocked) {
    return {
      canPerformAdminOps: false,
      reason: 'Admin controls locked',
      nextStep: 'Enter the admin password to unlock controls',
    };
  }

  // Still checking backend admin status
  if (adminCheckLoading || actorFetching) {
    return {
      canPerformAdminOps: false,
      reason: 'Checking admin status...',
    };
  }

  // Backend says not admin
  if (!isBackendAdmin) {
    return {
      canPerformAdminOps: false,
      reason: 'Not authorized as admin',
      nextStep: 'You must be logged in with an admin Internet Identity account. The current account does not have admin privileges.',
    };
  }

  // All checks passed
  return {
    canPerformAdminOps: true,
  };
}
