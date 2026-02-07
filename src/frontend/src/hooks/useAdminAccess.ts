import { useState, useEffect } from 'react';

const ADMIN_PASSWORD = 'ilovemk2116'; // Simple password for demo purposes
const STORAGE_KEY = 'chugli_admin_unlocked';

export function useAdminAccess() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load unlocked state from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  // Listen for admin access changes from other components
  useEffect(() => {
    const handleAdminAccessChange = (event: CustomEvent<{ isUnlocked: boolean }>) => {
      setIsUnlocked(event.detail.isUnlocked);
    };

    window.addEventListener('admin-access-changed', handleAdminAccessChange as EventListener);
    return () => {
      window.removeEventListener('admin-access-changed', handleAdminAccessChange as EventListener);
    };
  }, []);

  const unlock = (password: string): boolean => {
    setError(null);
    
    if (password === ADMIN_PASSWORD) {
      setIsUnlocked(true);
      sessionStorage.setItem(STORAGE_KEY, 'true');
      // Dispatch event to notify all components
      window.dispatchEvent(new CustomEvent('admin-access-changed', { detail: { isUnlocked: true } }));
      return true;
    } else {
      setError('Incorrect password. Please try again.');
      return false;
    }
  };

  const lock = () => {
    setIsUnlocked(false);
    sessionStorage.removeItem(STORAGE_KEY);
    setError(null);
    // Dispatch event to notify all components
    window.dispatchEvent(new CustomEvent('admin-access-changed', { detail: { isUnlocked: false } }));
  };

  return {
    isUnlocked,
    unlock,
    lock,
    error,
  };
}
