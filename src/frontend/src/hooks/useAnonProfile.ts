import { useEffect, useState } from 'react';
import { loadAnonProfile, saveAnonProfile, generateAnonProfile, type AnonProfile } from '../storage/anonProfileStorage';

export function useAnonProfile() {
  const [profile, setProfile] = useState<AnonProfile | null>(null);

  useEffect(() => {
    let existing = loadAnonProfile();
    if (!existing) {
      existing = generateAnonProfile();
      saveAnonProfile(existing);
    }
    setProfile(existing);
  }, []);

  const updateProfile = (updates: Partial<AnonProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    saveAnonProfile(updated);
    setProfile(updated);
  };

  return { profile, updateProfile };
}
