
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
    ]
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
    ]
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
    ]
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
      'A sentence with a missing or word will appear.',
      'Choose the grammatically correct option.',
      'Focus on subject-verb agreement and punctuation.',
      'Level up to unlock more complex linguistic puzzles.'
    ]
  },
  {
    id: 'sudoku-lite',
    name: 'Sudoku',
    tagline: 'The ultimate 9x9 logic challenge.',
    category: Category.BrainTeaser,
    icon: 'fa-table-cells',
    color: 'from-slate-600 to-slate-900',
    description: 'A full 9x9 Sudoku experience with multiple difficulty levels. Sharpen your logic with classic placement puzzles.',
    instructions: [
      'Each row, column, and 3x3 box must contain digits 1-9.',
      'Select a difficulty to begin: Easy, Medium, or Hard.',
      'Click a cell and choose a number to fill the grid.',
      'Solve it correctly to win!'
    ]
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
    ]
  },
  {
    id: 'riddle-rift',
    name: 'Riddle Rift',
    tagline: 'Break the code, solve the rift.',
    category: Category.BrainTeaser,
    icon: 'fa-brain',
    color: 'from-purple-500 to-indigo-600',
    description: 'A logic challenge using an expansive library of classic and cryptic riddles.',
    instructions: [
      'Read the riddle presented in the rift.',
      'Type your answer and analyze it.',
      'Use hints if the enigma is too complex.',
      'Build a streak to prove your neural dominance.'
    ]
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
    ]
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
      'Don\'t let the bubbles reach the bottom of the screen.',
      'Choose Easy, Medium, or Hard to set the pace!'
    ]
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
    ]
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
    ]
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
    ]
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
    ]
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
    ]
  },
  {
    id: 'neon-snake',
    name: 'Neon Snake',
    tagline: 'Classic arcade evolution.',
    category: Category.Arcade,
    icon: 'fa-worm',
    color: 'from-green-500 to-emerald-700',
    description: 'Guide the glowing snake through the grid. Collect energy cores to grow, but avoid the walls and your own tail!',
    instructions: [
      'Use Arrow Keys or Swipe to change direction.',
      'Collect green energy cores to increase your length and score.',
      'Hitting the boundaries or your own body terminates the session.',
      'The speed increases as you grow longer!'
    ]
  },
  {
    id: 'bit-master',
    name: 'Bit Master',
    tagline: 'Binary decryption speedrun.',
    category: Category.Math,
    icon: 'fa-microchip',
    color: 'from-blue-600 to-cyan-500',
    description: 'Decrypt binary sequences into decimal values. Test your speed and digital literacy in this high-frequency challenge.',
    instructions: [
      'A 4-bit binary sequence will appear (e.g., 1010).',
      'Select the correct decimal equivalent from the options.',
      'Correct answers add time and points.',
      'Speed is critical—the timer is always ticking down!'
    ]
  },
  {
    id: 'reflex-node',
    name: 'Reflex Node',
    tagline: 'Neural network tap training.',
    category: Category.Arcade,
    icon: 'fa-circle-dot',
    color: 'from-yellow-400 to-orange-600',
    description: 'Hyper-reflex training. Intercept incoming neural nodes before they destabilize and terminate the link.',
    instructions: [
      'Neon nodes will pulse onto the screen at random locations.',
      'Tap each node before its outer ring reaches the center.',
      'Missing a node or letting it fade ends the game.',
      'The frequency of node appearances increases over time.'
    ]
  },
  {
    id: 'pulse-wave',
    name: 'Pulse Wave',
    tagline: 'Catch the rhythm of the nexus.',
    category: Category.Arcade,
    icon: 'fa-wave-square',
    color: 'from-pink-600 to-purple-600',
    description: 'A high-energy rhythm challenge. Tap the markers as they align with the pulse wave to keep the data flowing.',
    instructions: [
      'A wave moves across the screen repeatedly.',
      'Tap the nodes exactly when the wave passes over them.',
      'Perfect timing yields max points and multiplier.',
      'Too many misses will cause a network desync!'
    ]
  },
  {
    id: 'binary-dash',
    name: 'Binary Dash',
    tagline: 'Filter the stream in real-time.',
    category: Category.Math,
    icon: 'fa-code-branch',
    color: 'from-teal-600 to-sky-700',
    description: 'Sort incoming bits into their correct registers. A true test of binary logic and extreme reflexes.',
    instructions: [
      'Numbers fly toward the center of the screen.',
      'Sort them left or right based on whether they are EVEN or ODD.',
      'Correct sorting increases your streak and speed.',
      'Incorrect sorting depletes your system integrity.'
    ]
  },
  {
    id: 'cyber-defense',
    name: 'Cyber Defense',
    tagline: 'Protect the core at all costs.',
    category: Category.Arcade,
    icon: 'fa-shield-halved',
    color: 'from-violet-600 to-indigo-800',
    description: 'An orbital defense simulator. Rotate your shield to intercept incoming virus nodes and protect the central core.',
    instructions: [
      'Rotate your shield around the central core using your finger or mouse.',
      'Intercept the incoming red virus nodes to destroy them.',
      'Collect green data nodes for core upgrades and repairs.',
      'The core can only take a few hits before complete failure!'
    ]
  }
];
