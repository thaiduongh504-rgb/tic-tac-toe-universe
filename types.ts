/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BoardSize = 3 | 4 | 5 | 6 | 7 | 8;
export type GameMode = 'classic' | 'ultimate' | 'infinite' | 'bomb' | 'frozen' | 'fog' | 'gravity';
export type PlayerType = 'X' | 'O';
export type CellValue = PlayerType | null;

export interface SpecialCell {
  row: number;
  col: number;
  type: 'bomb' | 'frozen' | 'locked' | 'wall' | 'portal';
  turnsRemaining?: number;
  portalTarget?: { row: number; col: number };
}

export interface Move {
  row: number;
  col: number;
  player: PlayerType;
  timestamp: number;
  accuracy?: 'best' | 'good' | 'mistake' | 'blunder';
  commentary?: string;
  gridIndex?: number; // For Ultimate TicTacToe (0-8)
}

export interface GameSettings {
  size: number;
  winCondition: number; // e.g., 3, 4, 5 in a row
  mode: GameMode;
  timeLimit: number; // in seconds (0 for infinite)
}

export interface GameState {
  board: CellValue[][];
  currentPlayer: PlayerType;
  winner: CellValue | 'Draw';
  winningLine: [number, number][]; // Coordinates of the winning line
  history: Move[];
  settings: GameSettings;
  specialCells: SpecialCell[];
  status: 'setup' | 'playing' | 'ended';
  timeRemaining: Record<PlayerType, number>;
}

// AI Personality & Dialogue
export type AIPersonality = 'friendly' | 'robot' | 'aggressive' | 'troll' | 'cold' | 'grandmaster';
export type AIDifficulty = 'beginner' | 'easy' | 'normal' | 'hard' | 'expert' | 'impossible';

export interface AISettings {
  difficulty: AIDifficulty;
  personality: AIPersonality;
  algorithm: 'random' | 'heuristic' | 'minimax';
}

// AI Coach Analysis Response
export interface CoachAnalysis {
  accuracy: number; // accuracy percentage (e.g., 85)
  winProbability: number[]; // relative win probability at each step
  mistakes: number;
  blunders: number;
  bestMoves: string[]; // Descriptions of best alternative moves at critical junctures
  summary: string; // Markdown summary evaluation from Gemini Coach
}

// Puzzles
export interface Puzzle {
  id: string;
  title: string;
  description: string;
  size: number;
  winCondition: number;
  board: CellValue[][];
  specialCells: SpecialCell[];
  currentPlayer: PlayerType;
  movesToSolve: number; // e.g., win in 1, win in 2
  solution: { row: number; col: number }[]; // Correct moves sequence
  difficulty: 'easy' | 'medium' | 'hard';
}

// Custom Levels
export interface CustomLevel {
  id: string;
  title: string;
  creator: string;
  size: number;
  winCondition: number;
  board: CellValue[][];
  specialCells: SpecialCell[];
  likes: number;
  plays: number;
  createdAt: string;
}

// User Profile & Statistics
export interface UserStats {
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  elo: number;
  longestStreak: number;
  currentStreak: number;
  accuracySum: number;
  accuracyCount: number;
  totalMoveTime: number;
  totalMovesCount: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'wins' | 'streak' | 'ai' | 'online' | 'puzzle' | 'misc';
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  target: number;
}

export interface DailyMission {
  id: string;
  description: string;
  target: number;
  current: number;
  rewardElo: number;
  completed: boolean;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string; // SVG or preset names
  elo: number;
  stats: UserStats;
  achievements: Achievement[];
  dailyMissions: DailyMission[];
  skin: string;
  theme: string;
}

// Multiplayer Rooms
export interface OnlineRoom {
  id: string;
  hostId: string;
  hostName: string;
  players: {
    X: { id: string; name: string; elo: number; avatar: string; ready: boolean } | null;
    O: { id: string; name: string; elo: number; avatar: string; ready: boolean } | null;
  };
  spectators: { id: string; name: string }[];
  status: 'waiting' | 'playing' | 'ended';
  gameState: GameState;
  settings: GameSettings;
  chat: ChatMessage[];
  isPrivate: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export interface GlobalLeaderboardEntry {
  username: string;
  elo: number;
  wins: number;
  losses: number;
  avatar: string;
  rank: number;
}
