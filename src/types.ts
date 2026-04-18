
export enum Category {
  Puzzle = 'Puzzle',
  Math = 'Math & Logic',
  Arcade = 'Arcade',
  Educational = 'Educational',
  BrainTeaser = 'Brain Teasers',
  Wellness = 'Wellness'
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlockedAt?: number;
}

export interface UserProfile {
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  favorites: string[];
  joinedAt: number;
  achievements: string[]; // IDs of unlocked achievements
  role?: 'admin' | 'user';
  playTime?: number; // Total seconds on platform
  gameStats?: Record<string, {
    timeSpent: number;
    sessions: number;
    lastPlayed: number;
    highScore: number;
  }>;
}

export interface AppSettings {
  sfxVolume: number;
  haptics: boolean;
  reducedMotion: boolean;
  dataProvider: 'firebase' | 'cloudflare' | 'hybrid';
  workerUrl: string;
}

export interface Game {
  id: string;
  name: string;
  tagline: string;
  category: Category;
  icon: string;
  color: string;
  description: string;
  instructions: string[];
}

export interface Score {
  gameId: string;
  score: number;
  timestamp: number;
}
