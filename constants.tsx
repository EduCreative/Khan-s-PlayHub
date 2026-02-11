
import { Game, Category } from './types';

export const GAMES: Game[] = [
  {
    id: 'fruit-vortex',
    name: 'Fruit Vortex',
    tagline: 'Match fresh fruits & blast juice combos!',
    category: Category.Puzzle,
    icon: 'fa-apple-whole',
    color: 'from-orange-500 to-red-600',
    description: 'A fast-paced match-3 game with explosive fruity chain reactions and juicy blasts.',
    instructions: [
      'Swap adjacent fruits to match 3 or more of the same type.',
      'Match 4 or more to create explosive Special Fruits.',
      'Special fruits can clear entire rows, columns, or groups.',
      'Keep matching to extend your time and build huge combos!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'quick-math',
    name: 'Quick Math',
    tagline: 'Hyper-speed mental arithmetic.',
    category: Category.Educational,
    icon: 'fa-calculator',
    color: 'from-blue-600 to-indigo-700',
    description: 'Solve as many arithmetic problems as possible in 60 seconds. Accuracy and speed are key!',
    instructions: [
      'An equation will appear on screen.',
      'Type or select the correct answer as fast as possible.',
      'Correct answers add time and points.',
      'Wrong answers subtract time. Keep your streak alive!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'pattern-finder',
    name: 'Pattern Finder',
    tagline: 'Identify the missing sequence.',
    category: Category.BrainTeaser,
    icon: 'fa-shapes',
    color: 'from-amber-400 to-orange-500',
    description: 'Analyze the sequence of symbols and find the logic to predict the next one.',
    instructions: [
      'Observe the row of shapes or numbers.',
      'Identify the underlying pattern (addition, rotation, color shift).',
      'Select the correct missing piece from the options.',
      'Higher levels introduce multi-layered patterns.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'grammar-guardian',
    name: 'Grammar Guardian',
    tagline: 'Master the art of language.',
    category: Category.Educational,
    icon: 'fa-book-open',
    color: 'from-emerald-500 to-teal-600',
    description: 'Identify and fix common grammatical errors in this fast-paced language challenge.',
    instructions: [
      'A sentence with a missing or wrong word will appear.',
      'Choose the grammatically correct option.',
      'Focus on subject-verb agreement and punctuation.',
      'Level up to unlock more complex linguistic puzzles.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'sudoku-lite',
    name: 'Sudoku Lite',
    tagline: 'Mini 4x4 Sudoku puzzles.',
    category: Category.BrainTeaser,
    icon: 'fa-table-cells',
    color: 'from-slate-600 to-slate-900',
    description: 'Perfect for quick brain training sessions. Fill the 4x4 grid without repeating digits.',
    instructions: [
      'Each row, column, and 2x2 square must contain digits 1-4.',
      'Click an empty cell and select a number.',
      'Solve the grid as fast as possible for bonus points.',
      'Mistakes will flash red—be careful!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'number-ninja',
    name: 'Number Ninja',
    tagline: 'Slice the correct answers!',
    category: Category.Math,
    icon: 'fa-user-ninja',
    color: 'from-blue-500 to-cyan-500',
    description: 'Test your mental math speed! Slice flying numbers to solve equations before time runs out.',
    instructions: [
      'Look at the equation in the center of the screen.',
      'Three numbers will appear in the grid below.',
      'Click/Tap the correct answer to gain points and time.',
      'Incorrect answers will penalize your remaining time!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1605870445919-838d190e8e1b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'riddle-rift',
    name: 'Riddle Rift',
    tagline: 'Break the code, solve the rift.',
    category: Category.BrainTeaser,
    icon: 'fa-brain',
    color: 'from-purple-500 to-indigo-600',
    description: 'A logic challenge using a mix of classic riddles and AI-generated enigmas.',
    instructions: [
      'Read the riddle presented in the rift.',
      'Type your answer and analyze it.',
      'Use hints if the enigma is too complex.',
      'Build a streak to prove your neural dominance.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'blitz-runner',
    name: 'Blitz Runner',
    tagline: 'Dodge, dash, and collect!',
    category: Category.Arcade,
    icon: 'fa-bolt',
    color: 'from-green-400 to-emerald-600',
    description: 'High-speed endless runner. Navigate through neon obstacles and set the record distance.',
    instructions: [
      'Move your mouse or finger left and right to control the runner.',
      'Dodge the red incoming walls to stay in the race.',
      'The longer you survive, the higher your score multiplier grows.',
      'One hit and the run is over—stay focused!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1519750157634-b6d493a0f77c?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'bubble-fury',
    name: 'Bubble Fury',
    tagline: 'Pop the bubble clusters.',
    category: Category.Arcade,
    icon: 'fa-soap',
    color: 'from-red-400 to-rose-600',
    description: 'Physics-based bubble shooter. Aim true, pop big chains, and clear the stage.',
    instructions: [
      'Move your mouse/finger to aim the cannon.',
      'Click/Tap to fire a bubble of the current color.',
      'Match 3 or more of the same color to pop the cluster.',
      'Detached bubbles will fall for bonus points!',
      'Don\'t let the bubbles reach the bottom of the screen.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'word-builder',
    name: 'Word Builder Quest',
    tagline: 'Construct towers of vocabulary.',
    category: Category.Educational,
    icon: 'fa-font',
    color: 'from-violet-500 to-fuchsia-600',
    description: 'Form words from falling letters to build your tower higher. Form Bounty answers for Mega Blocks.',
    instructions: [
      'Select letters from the pool to form a valid English word.',
      'Words must be at least 3 letters long.',
      'Solve the "Mega Riddle Bounty" for massive bonus height.',
      'Complete the height target to level up and change the theme.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'sum-surge',
    name: 'Sum Surge',
    tagline: 'Merge tiles to reach infinity.',
    category: Category.Math,
    icon: 'fa-plus-minus',
    color: 'from-sky-400 to-indigo-600',
    description: 'A classic 2048-inspired puzzle with a neon twist and special multiplier tiles.',
    instructions: [
      'Swipe or use arrow keys to move all tiles in a direction.',
      'When two tiles with the same number touch, they merge into one.',
      'New tiles appear with every move.',
      'Try to reach the highest possible value before the grid fills up!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'memory-matrix',
    name: 'Memory Matrix',
    tagline: 'Find the matching pairs fast.',
    category: Category.Puzzle,
    icon: 'fa-th-large',
    color: 'from-teal-400 to-green-500',
    description: 'Sharpen your memory! Match neon patterns in record time to climb the ranks.',
    instructions: [
      'Click cards to reveal the icon beneath.',
      'Flip two cards to try and find a matching pair.',
      'If they match, they stay revealed. If not, they flip back.',
      'Find all pairs in as few moves as possible for the max score.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'labyrinth',
    name: 'Labyrinth',
    tagline: 'Escape the rotating maze.',
    category: Category.Puzzle,
    icon: 'fa-route',
    color: 'from-orange-400 to-red-500',
    description: 'A challenging tilt-and-slide maze game with shifting walls and hidden shortcuts.',
    instructions: [
      'Use Arrow Keys or the On-screen controls to move the player.',
      'Navigate through the walls to find the exit.',
      'The Green Portal marks the end of the current maze.',
      'Each level presents a new, procedurally generated challenge!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1533236897111-3e94666b2edf?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'color-clash',
    name: 'Color Clash',
    tagline: 'Match colors at hyper speed.',
    category: Category.Arcade,
    icon: 'fa-palette',
    color: 'from-pink-400 to-rose-500',
    description: 'A reflex-testing color matching experience. How long can you survive the clash?',
    instructions: [
      'Read the name of the color displayed in the center.',
      'Ignore the text color—focus only on what the word SAYS.',
      'Click the matching colored button at the bottom.',
      'Be quick! The timer accelerates with every correct answer.'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=400'
  }
];
