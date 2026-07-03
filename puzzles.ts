/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Puzzle } from '../types';

export const CURATED_PUZZLES: Puzzle[] = [
  {
    id: 'puz-1',
    title: 'Double Trouble (3x3)',
    description: 'Find the winning spot that creates a double threat. Win in 2 moves.',
    size: 3,
    winCondition: 3,
    currentPlayer: 'X',
    movesToSolve: 2,
    difficulty: 'easy',
    specialCells: [],
    board: [
      ['X', null, null],
      [null, 'O', null],
      [null, null, null]
    ],
    solution: [
      { row: 0, col: 2 }, // Play corner to create a double diagonal/horizontal threat
      { row: 0, col: 1 }  // Win on next move
    ]
  },
  {
    id: 'puz-2',
    title: 'Defensive Wall (3x3)',
    description: 'Your opponent O is threatening to win. Block their move and secure your path to victory in 2 moves.',
    size: 3,
    winCondition: 3,
    currentPlayer: 'X',
    movesToSolve: 2,
    difficulty: 'easy',
    specialCells: [],
    board: [
      ['O', 'O', null],
      ['X', null, null],
      [null, null, null]
    ],
    solution: [
      { row: 0, col: 2 }, // Block O's win in row 0
      { row: 1, col: 1 }  // Take center to prepare diagonal threat
    ]
  },
  {
    id: 'puz-3',
    title: 'Gravity Cascade (4x4)',
    description: 'Gravity Mode: Play in the correct column to drop your piece and win immediately in 1 move.',
    size: 4,
    winCondition: 3,
    currentPlayer: 'X',
    movesToSolve: 1,
    difficulty: 'medium',
    specialCells: [],
    board: [
      [null, null, null, null],
      [null, null, null, null],
      ['X', 'O', null, null],
      ['X', 'O', 'O', null]
    ],
    solution: [
      { row: 1, col: 0 } // Drop in col 0 to form vertical 3-in-a-row
    ]
  },
  {
    id: 'puz-4',
    title: 'The Frozen Gate (4x4)',
    description: 'A cell is frozen! Find the workaround to bypass the frozen block and win in 2 moves.',
    size: 4,
    winCondition: 4,
    currentPlayer: 'X',
    movesToSolve: 2,
    difficulty: 'medium',
    specialCells: [
      { row: 1, col: 2, type: 'frozen' } // Frozen cell, cannot be played
    ],
    board: [
      ['X', 'X', 'X', null],
      [null, 'O', null, null],
      [null, null, 'O', null],
      [null, null, null, null]
    ],
    solution: [
      { row: 0, col: 3 }, // Win immediately in row 0 by completing the 4-in-a-row
    ]
  },
  {
    id: 'puz-5',
    title: 'Cosmic Portal (5x5)',
    description: 'Use the spatial geometry of a 5x5 board. Find the diagonal win-in-1 move before O blocks you.',
    size: 5,
    winCondition: 4,
    currentPlayer: 'X',
    movesToSolve: 1,
    difficulty: 'medium',
    specialCells: [],
    board: [
      [null, null, null, null, null],
      [null, 'X', null, null, null],
      [null, 'O', 'X', null, null],
      [null, null, null, 'X', null],
      ['O', 'O', null, null, null]
    ],
    solution: [
      { row: 4, col: 4 } // Play at bottom corner to finish diagonal: (1,1)-(2,2)-(3,3)-(4,4)
    ]
  },
  {
    id: 'puz-6',
    title: 'Bomb Disarming (5x5)',
    description: 'Bomb Mode: Avoid setting off the bomb at (2,2) while setting up a 4-in-a-row horizontal win in 2 moves.',
    size: 5,
    winCondition: 4,
    currentPlayer: 'X',
    movesToSolve: 2,
    difficulty: 'hard',
    specialCells: [
      { row: 2, col: 2, type: 'bomb' }
    ],
    board: [
      [null, null, null, null, null],
      ['X', 'X', null, 'X', null],
      [null, null, null, null, null],
      [null, 'O', 'O', 'O', null],
      [null, null, null, null, null]
    ],
    solution: [
      { row: 1, col: 2 }, // Complete 4-in-a-row in row 1, avoiding the bomb in row 2
    ]
  },
  {
    id: 'puz-7',
    title: 'Grandmaster Gambit (6x6)',
    description: 'A massive 6x6 board with a 5-in-a-row win condition. Find the optimal move that creates an unblockable win in 2 moves.',
    size: 6,
    winCondition: 5,
    currentPlayer: 'X',
    movesToSolve: 2,
    difficulty: 'hard',
    specialCells: [],
    board: [
      [null, null, null, null, null, null],
      [null, 'X', 'X', 'X', null, null],
      [null, 'O', 'O', 'O', 'O', null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null],
      [null, null, null, null, null, null]
    ],
    solution: [
      { row: 2, col: 5 }, // Block O from getting 5 in a row in row 2
      { row: 1, col: 4 }  // Proceed to setup own line
    ]
  }
];
