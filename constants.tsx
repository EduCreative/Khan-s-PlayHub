
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
    tagline: 'Daily AI-powered brain teasers.',
    category: Category.BrainTeaser,
    icon: 'fa-brain',
    color: 'from-amber-400 to-orange-600',
    description: 'Crack unique, AI-generated riddles every single day. Can you beat the machine?',
    instructions: [
      'Read the riddle carefully.',
      'Type your answer in the text field provided.',
      'If you get stuck, use the "Need a Hint?" button.',
      'Try to solve it in as few attempts as possible!'
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
      'Move your mouse or finger up and down to control the runner.',
      'Dodge the red incoming blocks to stay in the race.',
      'The longer you survive, the higher your score multiplier grows.',
      'One hit and the run is over—stay focused!'
    ],
    imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=400'
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
    description: 'Form words from falling letters to build your tower higher. Unlock diverse themes as you rise.',
    instructions: [
      'Select letters from the pool to form a valid English word.',
      'Words must be at least 3 letters long.',
      'Longer words build higher towers and grant more points.',
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
