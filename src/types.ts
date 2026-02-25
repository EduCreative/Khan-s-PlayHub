
export enum Category {
  Puzzle = 'Puzzle',
  Math = 'Math & Logic',
  Arcade = 'Arcade',
  Educational = 'Educational',
  BrainTeaser = 'Brain Teasers',
  Wellness = 'Wellness'
}

export interface UserProfile {
  username: string;
  email?: string;
  avatar: string;
  bio: string;
  favorites: string[];
  joinedAt: number;
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
