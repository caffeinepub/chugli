import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
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
  const { actor, isFetching: actorFetching } = useActor();

  // Check backend admin status (works for both authenticated and anonymous)
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
    enabled: !!actor && !actorFetching,
    retry: false,
  });

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
      reason: 'Verifying admin status...',
    };
  }

  // Backend says not admin
  if (!isBackendAdmin) {
    return {
      canPerformAdminOps: false,
      reason: 'Not authorized as admin',
      nextStep: 'The password unlocks the UI, but your principal does not have backend admin privileges. Contact the system administrator.',
    };
  }

  // All checks passed
  return {
    canPerformAdminOps: true,
  };
}
