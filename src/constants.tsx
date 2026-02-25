
import { Game, Category } from './types';

export const GAMES: Game[] = [
  {
    id: 'fruit-vortex',
    name: 'Fruit Vortex',
    tagline: 'Juicy Match-3 Action',
    category: Category.Arcade,
    icon: 'fa-apple-whole',
    color: 'from-orange-400 to-rose-500',
    description: 'A fast-paced fruit matching game with explosive combos.',
    instructions: ['Match 3 or more fruits', 'Use power-ups for big scores', 'Beat the clock']
  },
  {
    id: 'word-builder',
    name: 'Word Builder',
    tagline: 'Lexical Tower Defense',
    category: Category.BrainTeaser,
    icon: 'fa-font',
    color: 'from-emerald-400 to-teal-600',
    description: 'Construct words to build your tower and defend the nexus.',
    instructions: ['Select letters to form words', 'Submit to build blocks', 'Reach the target height']
  },
  {
    id: 'sudoku-lite',
    name: 'Sudoku',
    tagline: 'Neural Logic Grid',
    category: Category.Puzzle,
    icon: 'fa-table-cells',
    color: 'from-indigo-400 to-blue-600',
    description: 'Classic Sudoku with neural mapping assistance.',
    instructions: ['Fill the grid with numbers 1-9', 'Each row, column, and block must have unique numbers', 'Use logic to solve']
  },
  {
    id: 'memory-matrix',
    name: 'Memory Matrix',
    tagline: 'Neural Pattern Recall',
    category: Category.BrainTeaser,
    icon: 'fa-brain',
    color: 'from-teal-400 to-emerald-600',
    description: 'Test your short-term memory by recalling patterns in the matrix.',
    instructions: ['Memorize the pattern', 'Wait for the flip', 'Recall the positions']
  },
  {
    id: 'labyrinth',
    name: 'Labyrinth',
    tagline: 'Spatial Navigation',
    category: Category.Puzzle,
    icon: 'fa-route',
    color: 'from-orange-500 to-amber-700',
    description: 'Navigate through complex mazes to reach the exit portal.',
    instructions: ['Use arrows to move', 'Find the green exit', 'Avoid dead ends']
  },
  {
    id: 'color-clash',
    name: 'Color Clash',
    tagline: 'Stroop Effect Protocol',
    category: Category.BrainTeaser,
    icon: 'fa-palette',
    color: 'from-rose-400 to-pink-600',
    description: 'A clinical Stroop Effect challenge. Read the word, ignore the color. Calibrate your cognitive focus.',
    instructions: ['Read the text of the word', 'Ignore the actual color of the text', 'Select the button that matches the WORD']
  },
  {
    id: 'resonance-breathing',
    name: 'Resonance Breathing',
    tagline: 'Coherent Nervous System Sync',
    category: Category.Wellness,
    icon: 'fa-lotus',
    color: 'from-indigo-400 to-purple-500',
    description: 'Practice coherent breathing at the scientifically optimal rate of 6 breaths per minute.',
    instructions: ['Inhale as the lotus expands', 'Exhale as the lotus shrinks', 'Maintain rhythm for 5 minutes']
  },
  {
    id: 'reaction-test',
    name: 'Reaction Time',
    tagline: 'Neural Response Velocity',
    category: Category.Wellness,
    icon: 'fa-bolt',
    color: 'from-amber-400 to-orange-600',
    description: 'Test your neural response speed with this precision reaction protocol.',
    instructions: ['Wait for the screen to turn green', 'Click as fast as you can', 'Complete 5 attempts for an average']
  },
  {
    id: 'binary-dash',
    name: 'Binary Dash',
    tagline: 'Data Stream Sorting',
    category: Category.Arcade,
    icon: 'fa-code-branch',
    color: 'from-cyan-400 to-blue-600',
    description: 'Sort incoming data packets into Even and Odd streams.',
    instructions: ['Check the number', 'Sort left for Even', 'Sort right for Odd']
  },
  {
    id: 'bit-master',
    name: 'Bit Master',
    tagline: 'Binary Decryption',
    category: Category.BrainTeaser,
    icon: 'fa-microchip',
    color: 'from-cyan-500 to-indigo-700',
    description: 'Convert 4-bit binary signals to decimal values quickly.',
    instructions: ['Read the binary', 'Convert to decimal', 'Select the correct option']
  },
  {
    id: 'quick-math',
    name: 'Quick Math',
    tagline: 'Arithmetic Reflexes',
    category: Category.BrainTeaser,
    icon: 'fa-calculator',
    color: 'from-indigo-500 to-purple-700',
    description: 'Solve arithmetic problems as fast as you can.',
    instructions: ['Read the equation', 'Calculate the answer', 'Select the correct option']
  },
  {
    id: 'pattern-finder',
    name: 'Pattern Finder',
    tagline: 'Logical Sequence Prediction',
    category: Category.Puzzle,
    icon: 'fa-shapes',
    color: 'from-amber-400 to-orange-600',
    description: 'Identify the logic in a sequence and predict the next element.',
    instructions: ['Analyze the sequence', 'Find the rule', 'Select the next item']
  },
  {
    id: 'grammar-guardian',
    name: 'Grammar Guardian',
    tagline: 'Syntax Repair Protocol',
    category: Category.BrainTeaser,
    icon: 'fa-book',
    color: 'from-emerald-500 to-teal-700',
    description: 'Repair broken sentences by selecting the correct grammatical form.',
    instructions: ['Read the sentence', 'Identify the error', 'Select the correct word']
  }
];
