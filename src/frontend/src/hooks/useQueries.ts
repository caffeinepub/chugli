import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { ALL_AREAS_ID } from '../storage/areaSelectionStorage';
import type { Room, Message } from '../backend';
import type { Principal } from '@icp-sdk/core/principal';

export function useGetRoomsByLocation(location: string | null) {
  const { actor, isFetching } = useActor();

  // Normalize location: convert ALL_AREAS_ID sentinel to null for backend
  const normalizedLocation = location === ALL_AREAS_ID ? null : location;

  return useQuery<Room[]>({
    queryKey: ['rooms', normalizedLocation],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRoomsByLocation(normalizedLocation);
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useRoomsByLocation = useGetRoomsByLocation;

export function useGetRoom(roomId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Room | null>({
    queryKey: ['room', roomId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getRoom(roomId);
    },
    enabled: !!actor && !isFetching && !!roomId,
  });
}

export function useGetMessages(roomId: string) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getMessagesForRoom(roomId);
      return result || [];
    },
    enabled: !!actor && !isFetching && !!roomId,
    refetchInterval: 3000,
  });
}

// Alias for backward compatibility with polling parameter
export function useRoomMessages(roomId: string, enablePolling: boolean = false) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ['messages', roomId],
    queryFn: async () => {
      if (!actor) return [];
      const result = await actor.getMessagesForRoom(roomId);
      return result || [];
    },
    enabled: !!actor && !isFetching && !!roomId,
    refetchInterval: enablePolling ? 3000 : false,
  });
}

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, location }: { name: string; location: string | null }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.createRoom(name, location);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rooms', variables.location] });
      queryClient.invalidateQueries({ queryKey: ['rooms', null] });
    },
    onError: (error) => {
      throw error;
    },
  });
}

export function useSendMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, sender, content }: { roomId: string; sender: string; content: string }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.sendMessage(roomId, sender, content);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.roomId] });
    },
    onError: (error) => {
      throw error;
    },
  });
}

export function useMuteUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (targetUser: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.muteUser(targetUser);
    },
  });
}

export function useBlockUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (targetUser: string) => {
      if (!actor) throw new Error('Actor not available');
      return actor.blockUser(targetUser);
    },
  });
}

export function useReportContent() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      reportedUser,
      reportedMessage,
      room,
      reason,
    }: {
      reportedUser: string | null;
      reportedMessage: string | null;
      room: string;
      reason: string;
    }) => {
      if (!actor) throw new Error('Actor not available');
      return actor.reportContent(reportedUser, reportedMessage, room, reason);
    },
  });
}

// Admin moderation hooks

export function useAdminDeleteRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId }: { roomId: string; providedPassword: string }) => {
      if (!actor) throw new Error('Actor not available');
      // Backend deleteRoom only takes roomId, password validation happens in UI
      const result = await actor.deleteRoom(roomId);
      if (!result) {
        throw new Error('Failed to delete room - operation returned false');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      // Invalidate all room queries
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomId] });
      queryClient.invalidateQueries({ queryKey: ['messages', variables.roomId] });
    },
  });
}

export function useAdminDeleteMessage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, messageId }: { roomId: string; messageId: string }) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.deleteMessage(roomId, messageId);
      if (!result) {
        throw new Error('Failed to delete message - operation returned false');
      }
      return result;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['messages', variables.roomId] });
    },
  });
}

export function useAdminBanUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.banUser(userPrincipal);
      if (!result) {
        throw new Error('Failed to ban user - operation returned false');
      }
      return result;
    },
  });
}

export function useAdminUnbanUser() {
  const { actor } = useActor();

  return useMutation({
    mutationFn: async (userPrincipal: Principal) => {
      if (!actor) throw new Error('Actor not available');
      const result = await actor.unbanUser(userPrincipal);
      if (!result) {
        throw new Error('Failed to unban user - operation returned false');
      }
      return result;
    },
  });
}
