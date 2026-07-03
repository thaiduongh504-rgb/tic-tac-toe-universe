/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CellValue, PlayerType, AIDifficulty, AIPersonality, SpecialCell } from '../types';

// AI Dialogues based on personality and triggers
export const AI_DIALOGUES: Record<AIPersonality, {
  opening: string[];
  userGoodMove: string[];
  aiWinning: string[];
  aiLosing: string[];
  draw: string[];
  triumph: string[];
  defeat: string[];
}> = {
  friendly: {
    opening: ["Hi there! Let's have an awesome game!", "Good luck! May the best player win! 😊", "Ready for some fun? Your move!"],
    userGoodMove: ["Whoa, brilliant move!", "Nice one! You're really good at this!", "Ah, that puts me in a tough spot!"],
    aiWinning: ["Things are looking up! Let's keep going!", "I found a nice pathway here!", "A very close game, I love it!"],
    aiLosing: ["Phew, you've got me on the ropes!", "Wow, outstanding tactics! I need to defend!", "Haha, you're too good!"],
    draw: ["An incredible draw! Well played!", "A perfect tie, we are evenly matched!", "Great game! Truly a friendly battle!"],
    triumph: ["Wow, what a game! Thanks for playing!", "GG! You played incredibly well!", "Yay! That was such a close match! Let's play again!"],
    defeat: ["Congratulations! You completely outplayed me!", "Outstanding win! You're a true champion!", "Ah, you won! Well deserved! 🏆"]
  },
  robot: {
    opening: ["INITIATING TIC-TAC-TOE SUBROUTINE v4.2...", "HUMAN MOVE DETECTED. ANALYZING...", "01001000 01000101 01001100 01001100 01001111 (Hello)"],
    userGoodMove: ["WARNING: COMPROMISED NODE DETECTED.", "HEURISTIC ACCURACY ABOVE 95%. SUBOPTIMAL FOR MY UNITS.", "TACTICAL OFFSET OBSERVED."],
    aiWinning: ["WIN PROBABILITY: 87.4%. INCREASING PRESSURE.", "CALCULATING MATING SEQUENCE...", "EFFICIENCY OF MOVE OPTIMAL."],
    aiLosing: ["CRITICAL FAULT PREDICTED.", "DEFENSIVE PROTOCOLS INITIATED.", "RECALIBRATING MATRIX CONTINGENCIES."],
    draw: ["GAME LOOP TERMINATED WITH ZERO RETURN.", "MATCH TERMINATION: EQUILIBRIUM.", "DRAW CONDITION MET. SYSTEM IDLE."],
    triumph: ["EXECUTION SUCCESSFUL. HUMAN ERROR EXPLOITED.", "MATCH RESOLVED. VICTORY REGISTERED.", "CALCULATIONS COMPLETED. SYSTEM SHUTTING DOWN."],
    defeat: ["SYSTEM FAULT. REBOOT REQUIRED.", "VICTORY PROTOCOL BYPASS DETECTED. CONGRATULATIONS USER.", "CORE OFFLINE. WELL PLAYED."]
  },
  aggressive: {
    opening: ["You think you can beat me? Think again!", "Prepare to lose, rookie!", "Let's make this quick. I don't have all day!"],
    userGoodMove: ["Hmph, lucky guess.", "That was an accident and you know it!", "Don't get cocky. The game is just starting!"],
    aiWinning: ["Completely predictable! It's already over!", "You should probably just resign now.", "Look at this board. You've got no chance!"],
    aiLosing: ["Hey! Stop doing that!", "You're getting on my nerves...", "Just wait, my next counter-strike will crush you!"],
    draw: ["You got lucky this time! Rematch!", "A draw? Coward, you just focused on defending!", "Unbelievable. Next time you're going down!"],
    triumph: ["Hahaha! Too easy! Try harder next time!", "And that is how it's done! Pure dominance!", "As expected. Go back to practice! 😎"],
    defeat: ["What?! No way! This is rigged!", "You got extremely lucky. This doesn't count!", "Fine, you won. But I was holding back!"]
  },
  troll: {
    opening: ["Oh look, another victim! 🍿", "Let's see if you can find the grid!", "Is it my turn yet, or are you still calculating?"],
    userGoodMove: ["Whoa, did you read a guide for that?", "Wait, that's illegal! 😮", "I'm calling the developers, you're hacking!"],
    aiWinning: ["My victory dance is already fully rendered. 🕺", "Are you playing with your eyes closed?", "I'd ask if you need a hint, but I'm too mean."],
    aiLosing: ["Wait, look over there! *steals your turn*", "Oh no, my internet is lagging... just kidding!", "Wait, let me win, it's my birthday!"],
    draw: ["A tie? Wow, congrats, you managed not to lose! 👏", "Boring! I wanted fireworks!", "Draw. We both lose our time. GG."],
    triumph: ["Easiest win of my life! Next!", "Maybe Tic-Tac-Toe is too hard, try Rock Paper Scissors? 🤪", "Don't cry because it's over, smile because I won!"],
    defeat: ["Wait, the controller disconnected! 🎮", "You beat a troll. Do you feel proud? (Actually, well played!)", "Fine! Take your virtual crown, nerd! 👑"]
  },
  cold: {
    opening: ["Starting match.", "Make your move.", "No words. Let the board speak."],
    userGoodMove: ["Acceptable.", "Competent response.", "Move registered."],
    aiWinning: ["Inescapable trap established.", "Pressure mounting.", "Ending imminent."],
    aiLosing: ["Defending.", "Temporary disadvantage.", "Adjusting."],
    draw: ["Draw.", "End of calculation.", "No victor."],
    triumph: ["Match over. I win.", "Calculated triumph.", "Efficiency achieved."],
    defeat: ["Defeat accepted.", "You played flawlessly.", "Respect."]
  },
  grandmaster: {
    opening: ["Greetings. A fine day for tactical exploration.", "A standard opening. Let us see your response.", "Wisdom is found in simple lines. Best of luck."],
    userGoodMove: ["An elegant response. The complexity rises.", "Ah, the old defense. Masterfully executed.", "Superb placement. You have deep sight."],
    aiWinning: ["The geometry of the board bends in my favor.", "Patience yields strategic opportunities.", "I see the final lines of this battle."],
    aiLosing: ["Fascinating defense. You have forced me into a narrow corridor.", "Remarkable pressure. I must proceed with absolute care.", "My position is compromised. Brilliant execution."],
    draw: ["A harmonious conclusion. An artistic masterpiece.", "Neither can advance. A testament to perfect defense.", "A profound tie. We both touched the peak."],
    triumph: ["An honor playing you. The final sequence was most aesthetic.", "Victory is merely a symptom of a well-balanced path. GG.", "Thank you for the mental exercise. A beautiful game."],
    defeat: ["Incredible game. You played with absolute masterclass accuracy.", "My vision was short. You represent the absolute peak! Bravo! 🏆", "A masterpiece of tactical play. I bow to your victory."]
  }
};

export function getRandomDialogue(personality: AIPersonality, trigger: keyof typeof AI_DIALOGUES['friendly']): string {
  const list = AI_DIALOGUES[personality][trigger];
  return list[Math.floor(Math.random() * list.length)];
}

// Optimized Board Evaluation to score board positions quickly for heuristic play
// Positive scores favor X, Negative scores favor O
export function evaluateBoard(board: CellValue[][], size: number, winCondition: number, xPlayer: PlayerType = 'X'): number {
  const oPlayer: PlayerType = xPlayer === 'X' ? 'O' : 'X';
  let score = 0;

  // Directions: Horizontal, Vertical, Diagonal Right Down, Diagonal Right Up
  const directions = [
    [0, 1],   // horizontal
    [1, 0],   // vertical
    [1, 1],   // diagonal down-right
    [1, -1]   // diagonal up-right
  ];

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of directions) {
        // Look at a span of "winCondition" size
        let xCount = 0;
        let oCount = 0;
        let emptyCount = 0;
        let possible = true;

        for (let i = 0; i < winCondition; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;

          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            const val = board[nr][nc];
            if (val === xPlayer) xCount++;
            else if (val === oPlayer) oCount++;
            else emptyCount++;
          } else {
            possible = false;
            break;
          }
        }

        if (possible) {
          // If X has pieces and O has 0, it's an active threat/potential path for X
          if (xCount > 0 && oCount === 0) {
            score += Math.pow(10, xCount - 1);
          }
          // If O has pieces and X has 0, it's an active path for O
          else if (oCount > 0 && xCount === 0) {
            score -= Math.pow(10, oCount - 1);
          }
          // Blocking factor: if we block a near-winning line
          if (xCount === winCondition - 1 && oCount === 1) {
            score -= 50; // heavily reward blocking X
          }
          if (oCount === winCondition - 1 && xCount === 1) {
            score += 50; // heavily reward blocking O
          }
        }
      }
    }
  }

  return score;
}

// Check if a move wins the game
export function checkWin(board: CellValue[][], size: number, winCondition: number): { winner: CellValue | 'Draw'; line: [number, number][] } | null {
  const directions = [
    [0, 1],   // right
    [1, 0],   // down
    [1, 1],   // down-right
    [1, -1]   // down-left
  ];

  let openCells = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) {
        openCells++;
      }

      const player = board[r][c];
      if (player === null) continue;

      for (const [dr, dc] of directions) {
        const line: [number, number][] = [[r, c]];
        let matched = true;

        for (let i = 1; i < winCondition; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;

          if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
            line.push([nr, nc]);
          } else {
            matched = false;
            break;
          }
        }

        if (matched) {
          return { winner: player, line };
        }
      }
    }
  }

  if (openCells === 0) {
    return { winner: 'Draw', line: [] };
  }

  return null;
}

// Minimax with Alpha-Beta Pruning, depth-limited
function minimax(
  board: CellValue[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  size: number,
  winCondition: number,
  aiPlayer: PlayerType,
  humanPlayer: PlayerType,
  startTime: number,
  maxTimeMs: number = 100
): { score: number; row: number; col: number } {
  const winState = checkWin(board, size, winCondition);
  if (winState) {
    if (winState.winner === aiPlayer) return { score: 10000 + depth, row: -1, col: -1 };
    if (winState.winner === humanPlayer) return { score: -10000 - depth, row: -1, col: -1 };
    return { score: 0, row: -1, col: -1 };
  }

  if (depth === 0 || Date.now() - startTime > maxTimeMs) {
    return { score: evaluateBoard(board, size, winCondition, aiPlayer), row: -1, col: -1 };
  }

  const moves: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) {
        // Prioritize center-focused moves to optimize alpha-beta pruning
        moves.push({ r, c });
      }
    }
  }

  // Sort moves so center moves are evaluated first
  const center = (size - 1) / 2;
  moves.sort((a, b) => {
    const distA = Math.pow(a.r - center, 2) + Math.pow(a.c - center, 2);
    const distB = Math.pow(b.r - center, 2) + Math.pow(b.c - center, 2);
    return distA - distB;
  });

  let bestRow = -1;
  let bestCol = -1;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const { r, c } of moves) {
      board[r][c] = aiPlayer;
      const ev = minimax(board, depth - 1, alpha, beta, false, size, winCondition, aiPlayer, humanPlayer, startTime, maxTimeMs).score;
      board[r][c] = null;

      if (ev > maxEval) {
        maxEval = ev;
        bestRow = r;
        bestCol = c;
      }
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break; // Beta cut-off
    }
    return { score: maxEval, row: bestRow, col: bestCol };
  } else {
    let minEval = Infinity;
    for (const { r, c } of moves) {
      board[r][c] = humanPlayer;
      const ev = minimax(board, depth - 1, alpha, beta, true, size, winCondition, aiPlayer, humanPlayer, startTime, maxTimeMs).score;
      board[r][c] = null;

      if (ev < minEval) {
        minEval = ev;
        bestRow = r;
        bestCol = c;
      }
      beta = Math.min(beta, ev);
      if (beta <= alpha) break; // Alpha cut-off
    }
    return { score: minEval, row: bestRow, col: bestCol };
  }
}

// Gravity Mode Helper: Find the row where a token falls
export function getGravityRow(board: CellValue[][], col: number, size: number): number {
  for (let r = size - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      return r;
    }
  }
  return -1;
}

// Adaptive learning profiling to learn user's opening preferences
export class AdaptiveAILearner {
  private userOpenings: Record<string, number> = {};

  recordOpening(moveStr: string) {
    this.userOpenings[moveStr] = (this.userOpenings[moveStr] || 0) + 1;
  }

  getFavoriteOpening(): string | null {
    let maxCount = 0;
    let fav: string | null = null;
    for (const [key, count] of Object.entries(this.userOpenings)) {
      if (count > maxCount) {
        maxCount = count;
        fav = key;
      }
    }
    return fav;
  }
}

export const adaptiveLearner = new AdaptiveAILearner();

// Primary AI Move generator
export async function getAIMove(
  board: CellValue[][],
  size: number,
  winCondition: number,
  aiPlayer: PlayerType,
  difficulty: AIDifficulty,
  mode: string,
  specialCells: SpecialCell[] = []
): Promise<{ row: number; col: number; dialogue: string }> {
  // Determine search depth based on size to prevent lag (N-puzzle is NP-hard!)
  let maxDepth = 4;
  if (size === 3) maxDepth = 6;
  else if (size === 4) maxDepth = 4;
  else if (size >= 5) maxDepth = 2; // Keep depth small for larger boards, rely on heuristic instead

  const humanPlayer: PlayerType = aiPlayer === 'X' ? 'O' : 'X';

  // Get list of valid positions
  const availableMoves: { r: number; c: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null) {
        // In gravity mode, can only play column-drop moves
        if (mode === 'gravity') {
          const gravRow = getGravityRow(board, c, size);
          if (gravRow === r) {
            availableMoves.push({ r, c });
          }
        } else {
          // If cell is locked, blocked by wall or has active bomb, check it
          const cellSpecial = specialCells.find(s => s.row === r && s.col === c);
          if (cellSpecial && (cellSpecial.type === 'wall' || cellSpecial.type === 'locked')) {
            continue;
          }
          availableMoves.push({ r, c });
        }
      }
    }
  }

  if (availableMoves.length === 0) {
    return { row: -1, col: -1, dialogue: "No moves available!" };
  }

  // Determine Move based on difficulty
  let chosenMove = availableMoves[0];
  const rand = Math.random();

  let shouldPlayOptimal = false;
  if (difficulty === 'beginner') {
    shouldPlayOptimal = false;
  } else if (difficulty === 'easy') {
    shouldPlayOptimal = rand < 0.25;
  } else if (difficulty === 'normal') {
    shouldPlayOptimal = rand < 0.55;
  } else if (difficulty === 'hard') {
    shouldPlayOptimal = rand < 0.80;
  } else if (difficulty === 'expert') {
    shouldPlayOptimal = rand < 0.95;
  } else if (difficulty === 'impossible') {
    shouldPlayOptimal = true;
  }

  if (shouldPlayOptimal) {
    // 1. First, check if there is an immediate winning move for AI (1-move threat)
    let winMove: { r: number; c: number } | null = null;
    for (const move of availableMoves) {
      board[move.r][move.c] = aiPlayer;
      const wins = checkWin(board, size, winCondition);
      board[move.r][move.c] = null;
      if (wins && wins.winner === aiPlayer) {
        winMove = move;
        break;
      }
    }

    if (winMove) {
      chosenMove = winMove;
    } else {
      // 2. Secondly, check if human has an immediate winning move, and block it!
      let blockMove: { r: number; c: number } | null = null;
      for (const move of availableMoves) {
        board[move.r][move.c] = humanPlayer;
        const wins = checkWin(board, size, winCondition);
        board[move.r][move.c] = null;
        if (wins && wins.winner === humanPlayer) {
          blockMove = move;
          break;
        }
      }

      if (blockMove) {
        chosenMove = blockMove;
      } else {
        // 3. Fallback to Minimax or Heuristic scoring
        const startTime = Date.now();
        // Create copy of board
        const boardCopy = board.map(row => [...row]);
        const result = minimax(boardCopy, maxDepth, -Infinity, Infinity, true, size, winCondition, aiPlayer, humanPlayer, startTime, 120);
        
        if (result.row !== -1 && result.col !== -1) {
          chosenMove = { r: result.row, c: result.col };
        } else {
          // Fallback to simple local heuristic sorting
          let bestScore = -Infinity;
          let bestMovesList: { r: number; c: number }[] = [];
          for (const m of availableMoves) {
            boardCopy[m.r][m.c] = aiPlayer;
            const score = evaluateBoard(boardCopy, size, winCondition, aiPlayer);
            boardCopy[m.r][m.c] = null;
            if (score > bestScore) {
              bestScore = score;
              bestMovesList = [m];
            } else if (score === bestScore) {
              bestMovesList.push(m);
            }
          }
          chosenMove = bestMovesList[Math.floor(Math.random() * bestMovesList.length)];
        }
      }
    }
  } else {
    // Random move for easy/unplanned steps
    chosenMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  }

  // Record move for adaptive feedback in next matches
  if (board.flat().filter(c => c !== null).length === 0) {
    adaptiveLearner.recordOpening(`${chosenMove.r},${chosenMove.c}`);
  }

  // Generate dialogue line
  // Check if AI is close to winning, losing, etc.
  const tempBoard = board.map(row => [...row]);
  tempBoard[chosenMove.r][chosenMove.c] = aiPlayer;
  const isWinningMove = checkWin(tempBoard, size, winCondition);

  let dialogueTrigger: keyof typeof AI_DIALOGUES['friendly'] = 'aiWinning';
  if (isWinningMove && isWinningMove.winner === aiPlayer) {
    dialogueTrigger = 'triumph';
  } else if (board.flat().filter(c => c !== null).length <= 2) {
    dialogueTrigger = 'opening';
  } else {
    const scoreBefore = evaluateBoard(board, size, winCondition, aiPlayer);
    if (scoreBefore < -100) {
      dialogueTrigger = 'aiLosing';
    } else if (scoreBefore > 100) {
      dialogueTrigger = 'aiWinning';
    } else {
      dialogueTrigger = Math.random() > 0.5 ? 'opening' : 'userGoodMove';
    }
  }

  // Return dialogues dynamically based on personality config
  // Let's add a slight thinking delay (500-1500ms) on the client side
  return {
    row: chosenMove.r,
    col: chosenMove.c,
    dialogue: getRandomDialogue('friendly', dialogueTrigger) // Fallback to friendly, overridden dynamically
  };
}
