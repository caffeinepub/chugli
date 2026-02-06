import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useAuthControls } from './useAuthControls';
import { useAnonProfile } from './useAnonProfile';
import type { UserProfile } from '../backend';
import { isAuthError } from '../utils/auth/isAuthError';
import { useEffect, useRef } from 'react';

/**
 * Unified profile hook that manages both authenticated backend profiles
 * and anonymous local profiles based on authentication state.
 * 
 * When authenticated: loads/saves profile from backend (per-Principal), auto-creating if needed
 * When logged out: uses local anonymous profile from localStorage
 */
export function useUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const { isAuthenticated, identity } = useAuthControls();
  const anonProfile = useAnonProfile();
  const queryClient = useQueryClient();
  const isCreatingProfile = useRef(false);

  // Query for authenticated user profile from backend
  const backendProfileQuery = useQuery<UserProfile | null>({
    queryKey: ['userProfile', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      try {
        return await actor.getCallerUserProfile();
      } catch (error) {
        if (isAuthError(error)) {
          throw error; // Propagate auth errors
        }
        throw error;
      }
    },
    enabled: !!actor && !actorFetching && isAuthenticated,
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (isAuthError(error)) return false;
      return failureCount < 2;
    },
  });

  // Mutation to save authenticated user profile to backend
  const saveProfileMutation = useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error('Actor not available');
      await actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['userProfile', identity?.getPrincipal().toString()] 
      });
    },
  });

  // Auto-create default profile for authenticated users when backend returns null
  useEffect(() => {
    const shouldCreateProfile = 
      isAuthenticated && 
      !actorFetching && 
      backendProfileQuery.isFetched && 
      backendProfileQuery.data === null && 
      !backendProfileQuery.isError &&
      !isCreatingProfile.current &&
      !saveProfileMutation.isPending;

    if (shouldCreateProfile && actor) {
      isCreatingProfile.current = true;
      
      const defaultProfile: UserProfile = {
        username: `User${Date.now().toString().slice(-6)}`,
        avatarURL: '👤',
        bio: '',
        joinedTimestamp: BigInt(Date.now() * 1000000),
        lastUpdated: BigInt(Date.now() * 1000000),
      };

      saveProfileMutation.mutate(defaultProfile, {
        onSettled: () => {
          isCreatingProfile.current = false;
        },
      });
    }
  }, [
    isAuthenticated,
    actorFetching,
    backendProfileQuery.isFetched,
    backendProfileQuery.data,
    backendProfileQuery.isError,
    saveProfileMutation.isPending,
    actor,
  ]);

  // Return unified interface based on auth state
  if (isAuthenticated) {
    // Authenticated: use backend profile
    const backendProfile = backendProfileQuery.data;
    const isProfileLoading = actorFetching || backendProfileQuery.isLoading || saveProfileMutation.isPending || isCreatingProfile.current;
    const hasAuthError = backendProfileQuery.isError && isAuthError(backendProfileQuery.error);
    
    return {
      profile: backendProfile ? {
        nickname: backendProfile.username,
        avatar: backendProfile.avatarURL,
        color: '#FF6B6B', // Default color for backend profiles
      } : null,
      updateProfile: async (updates: { nickname?: string; avatar?: string; color?: string }) => {
        // If no profile exists yet, create one first
        if (!backendProfile) {
          const newProfile: UserProfile = {
            username: updates.nickname || `User${Date.now().toString().slice(-6)}`,
            avatarURL: updates.avatar || '👤',
            bio: '',
            joinedTimestamp: BigInt(Date.now() * 1000000),
            lastUpdated: BigInt(Date.now() * 1000000),
          };
          await saveProfileMutation.mutateAsync(newProfile);
        } else {
          const updatedProfile: UserProfile = {
            ...backendProfile,
            username: updates.nickname || backendProfile.username,
            avatarURL: updates.avatar || backendProfile.avatarURL,
          };
          await saveProfileMutation.mutateAsync(updatedProfile);
        }
      },
      createDefaultProfile: async () => {
        const defaultProfile: UserProfile = {
          username: `User${Date.now().toString().slice(-6)}`,
          avatarURL: '👤',
          bio: '',
          joinedTimestamp: BigInt(Date.now() * 1000000),
          lastUpdated: BigInt(Date.now() * 1000000),
        };
        await saveProfileMutation.mutateAsync(defaultProfile);
      },
      isLoading: isProfileLoading,
      isFetched: !!actor && backendProfileQuery.isFetched,
      isAuthenticated: true,
      isProfileReady: !!backendProfile && !isProfileLoading,
      hasError: backendProfileQuery.isError,
      hasAuthError,
      error: backendProfileQuery.error,
    };
  } else {
    // Not authenticated: use local anonymous profile
    return {
      profile: anonProfile.profile,
      updateProfile: (updates: { nickname?: string; avatar?: string; color?: string }) => {
        anonProfile.updateProfile(updates);
      },
      createDefaultProfile: async () => {
        // No-op for anonymous users
      },
      isLoading: false,
      isFetched: true,
      isAuthenticated: false,
      isProfileReady: true,
      hasError: false,
      hasAuthError: false,
      error: null,
    };
  }
}
