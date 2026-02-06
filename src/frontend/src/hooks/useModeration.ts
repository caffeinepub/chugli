import { useEffect, useState } from 'react';
import type { Message } from '../backend';

interface ModerationState {
  muted: Set<string>;
  blocked: Set<string>;
}

const STORAGE_KEY = 'chugli_moderation';

function loadModeration(): ModerationState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return { muted: new Set(), blocked: new Set() };
    const data = JSON.parse(stored);
    return {
      muted: new Set(data.muted || []),
      blocked: new Set(data.blocked || []),
    };
  } catch {
    return { muted: new Set(), blocked: new Set() };
  }
}

function saveModeration(state: ModerationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      muted: Array.from(state.muted),
      blocked: Array.from(state.blocked),
    }));
  } catch (e) {
    console.error('Failed to save moderation state:', e);
  }
}

export function useModeration() {
  const [state, setState] = useState<ModerationState>(loadModeration);

  useEffect(() => {
    saveModeration(state);
  }, [state]);

  const muteUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      muted: new Set([...prev.muted, userId]),
    }));
  };

  const blockUser = (userId: string) => {
    setState(prev => ({
      ...prev,
      blocked: new Set([...prev.blocked, userId]),
    }));
  };

  const unmuteUser = (userId: string) => {
    setState(prev => {
      const muted = new Set(prev.muted);
      muted.delete(userId);
      return { ...prev, muted };
    });
  };

  const unblockUser = (userId: string) => {
    setState(prev => {
      const blocked = new Set(prev.blocked);
      blocked.delete(userId);
      return { ...prev, blocked };
    });
  };

  const filterMessages = (messages: Message[]): Message[] => {
    return messages.filter(msg => !state.muted.has(msg.sender) && !state.blocked.has(msg.sender));
  };

  return {
    muted: state.muted,
    blocked: state.blocked,
    muteUser,
    blockUser,
    unmuteUser,
    unblockUser,
    filterMessages,
  };
}
