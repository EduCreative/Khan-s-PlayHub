import { Achievement } from './types';

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'tower_master',
    name: 'Tower Master',
    description: 'Reach Level 10 in Word Builder',
    icon: 'fa-chess-rook',
    color: 'indigo'
  },
  {
    id: 'speed_demon',
    name: 'Speed Demon',
    description: 'Achieve a reaction time under 200ms in Reaction Test',
    icon: 'fa-bolt',
    color: 'amber'
  },
  {
    id: 'math_wizard',
    name: 'Math Wizard',
    description: 'Score over 1000 points in Quick Math',
    icon: 'fa-calculator',
    color: 'emerald'
  },
  {
    id: 'zen_master',
    name: 'Zen Master',
    description: 'Complete a full 1-minute session of Resonance Breathing',
    icon: 'fa-lotus',
    color: 'purple'
  },
  {
    id: 'labyrinth_conqueror',
    name: 'Labyrinth Conqueror',
    description: 'Clear a Hard difficulty level in Labyrinth',
    icon: 'fa-dungeon',
    color: 'rose'
  },
  {
    id: 'sudoku_master',
    name: 'Sudoku Master',
    description: 'Complete a Hard difficulty Sudoku puzzle',
    icon: 'fa-table-cells',
    color: 'cyan'
  }
];
