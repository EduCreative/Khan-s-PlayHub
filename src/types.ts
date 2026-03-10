
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
}

export interface AppSettings {
  sfxVolume: number;
  haptics: boolean;
  reducedMotion: boolean;
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
