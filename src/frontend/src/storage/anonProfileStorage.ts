export interface AnonProfile {
  id: string;
  nickname: string;
  color: string;
  avatar: string;
  createdAt: number;
}

const STORAGE_KEY = 'chugli_anon_profile';
const STORAGE_VERSION = 1;

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8',
  '#F7DC6F', '#BB8FCE', '#85C1E2', '#F8B739', '#52B788'
];

const AVATARS = ['🦊', '🐼', '🐨', '🦁', '🐯', '🐸', '🦄', '🐙', '🦋', '🐝'];

const ADJECTIVES = ['Happy', 'Clever', 'Swift', 'Bright', 'Cool', 'Chill', 'Funky', 'Witty', 'Jolly', 'Zesty'];
const NOUNS = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Phoenix', 'Dragon', 'Wolf', 'Falcon', 'Lynx', 'Otter'];

function generateRandomId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateRandomNickname(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

export function generateAnonProfile(): AnonProfile {
  return {
    id: generateRandomId(),
    nickname: generateRandomNickname(),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    avatar: AVATARS[Math.floor(Math.random() * AVATARS.length)],
    createdAt: Date.now(),
  };
}

export function loadAnonProfile(): AnonProfile | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const data = JSON.parse(stored);
    if (data.version !== STORAGE_VERSION) return null;
    return data.profile;
  } catch {
    return null;
  }
}

export function saveAnonProfile(profile: AnonProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: STORAGE_VERSION,
      profile,
    }));
  } catch (e) {
    console.error('Failed to save profile:', e);
  }
}
