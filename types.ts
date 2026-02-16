
export enum Category {
  Puzzle = 'Puzzle',
  Math = 'Math & Logic',
  Arcade = 'Arcade',
  Educational = 'Educational',
  BrainTeaser = 'Brain Teasers'
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
