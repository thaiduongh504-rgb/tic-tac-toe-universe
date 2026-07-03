/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  Sparkles, Trophy, BrainCircuit, Globe, Hammer, Film, BarChart3,
  Volume2, VolumeX, ShieldAlert, Check, RefreshCw, User, HelpCircle,
  Play, Settings, Skull, Zap, ChevronRight, Share2, Award
} from 'lucide-react';

import {
  CellValue, GameState, GameSettings, SpecialCell, PlayerType,
  UserProfile, Achievement, DailyMission, OnlineRoom, CustomLevel, Move
} from './types';
import { sfx } from './lib/audio';
import { getAIMove, checkWin, getGravityRow } from './lib/ai';
import { CURATED_PUZZLES } from './lib/puzzles';

// Subcomponents
import GameBoard from './components/GameBoard';
import AICoachPanel from './components/AICoachPanel';
import LevelEditor from './components/LevelEditor';
import ReplayPlayer from './components/ReplayPlayer';
import LeaderboardAchievements from './components/LeaderboardAchievements';
import OnlineLobby from './components/OnlineLobby';

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  { id: 'ach-1', title: 'First Cosmic Blood', description: 'Win your very first Tic-Tac-Toe match.', category: 'wins', unlocked: false, progress: 0, target: 1 },
  { id: 'ach-2', title: 'Streak Master', description: 'Win 3 matches in a row.', category: 'streak', unlocked: false, progress: 0, target: 3 },
  { id: 'ach-3', title: 'Grandmaster Slayer', description: 'Defeat the Impossible AI in any mode.', category: 'ai', unlocked: false, progress: 0, target: 1 },
  { id: 'ach-4', title: 'Puzzle Architect', description: 'Successfully solve 3 Daily Puzzles.', category: 'puzzle', unlocked: false, progress: 0, target: 3 },
  { id: 'ach-5', title: 'Bigger Grid', description: 'Complete a match on a grid larger than 3x3.', category: 'misc', unlocked: false, progress: 0, target: 1 }
];

const DEFAULT_MISSIONS: DailyMission[] = [
  { id: 'mis-1', description: 'Claim 3 offline victories against AI', target: 3, current: 0, rewardElo: 25, completed: false },
  { id: 'mis-2', description: 'Play at least 1 match with a Special Rule Mode', target: 1, current: 0, rewardElo: 15, completed: false },
  { id: 'mis-3', description: 'Solve any tactical Puzzle challenge', target: 1, current: 0, rewardElo: 20, completed: false }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('offline');
  const [theme, setTheme] = useState<string>('space'); // classic, space, neon, sakura, retro
  const [skin, setSkin] = useState<string>('classic'); // classic, fire, ice, neon, lightning, retro, emoji
  const [muted, setMuted] = useState<boolean>(false);

  // User Profile
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [avatarInput, setAvatarInput] = useState<string>('friendly');

  // Offline Matchmaking Settings
  const [size, setSize] = useState<number>(3);
  const [winCondition, setWinCondition] = useState<number>(3);
  const [mode, setMode] = useState<string>('classic');
  const [timeLimit, setTimeLimit] = useState<number>(0); // 0 = infinite

  const [aiDifficulty, setAiDifficulty] = useState<any>('normal');
  const [aiPersonality, setAiPersonality] = useState<any>('friendly');

  // Active Gameplay States
  const [game, setGame] = useState<GameState | null>(null);
  const [gameStatusText, setGameStatusText] = useState<string>('Initialize settings to play!');
  const [aiDialogue, setAiDialogue] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [showCoach, setShowCoach] = useState<boolean>(false);
  const [timeRemaining, setTimeRemaining] = useState<Record<PlayerType, number>>({ X: 0, O: 0 });

  // Puzzles
  const [activePuzzle, setActivePuzzle] = useState<any>(null);
  const [puzzleMovesPlayed, setPuzzleMovesPlayed] = useState<any[]>([]);
  const [puzzleResult, setPuzzleResult] = useState<'playing' | 'success' | 'failed'>('playing');

  // Replay
  const [activeReplay, setActiveReplay] = useState<any>(null);
  const [replayIdInput, setReplayIdInput] = useState<string>('');
  const [replayShareUrl, setReplayShareUrl] = useState<string | null>(null);

  // Online Multiplayer Bridge
  const [onlineRoom, setOnlineRoom] = useState<OnlineRoom | null>(null);
  const [myOnlineRole, setMyOnlineRole] = useState<'X' | 'O' | 'spec' | null>(null);

  const timerRef = useRef<any>(null);

  // 1. Initial Load of Profiles & Sync
  useEffect(() => {
    const saved = localStorage.getItem('tictac_profile');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setTheme(parsed.theme || 'space');
        setSkin(parsed.skin || 'classic');
        // Synchronize with server ranking directory
        syncProfileWithServer(parsed);
      } catch (e) {
        console.error(e);
      }
    } else {
      setActiveTab('profile_setup');
    }
    // Start nice background ambient loop on first interaction
    sfx.startAmbientMusic();
  }, []);

  const syncProfileWithServer = async (prof: UserProfile) => {
    try {
      const res = await fetch('/api/profile/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: prof.username,
          elo: prof.elo,
          wins: prof.stats.wins,
          losses: prof.stats.losses,
          draws: prof.stats.draws,
          avatar: prof.avatar
        })
      });
      if (res.ok) {
        const synced = await res.json();
        // Update user ELO if backend has adjusted it during online games
        if (synced.elo !== prof.elo) {
          const updated = { ...prof, elo: synced.elo };
          setProfile(updated);
          localStorage.setItem('tictac_profile', JSON.stringify(updated));
        }
      }
    } catch (e) {
      console.warn('Backend sync deferred (running in offline mode).', e);
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!usernameInput.trim()) return;

    sfx.playVictory();
    const newProfile: UserProfile = {
      id: `usr-${Date.now()}`,
      username: usernameInput.trim(),
      avatar: avatarInput,
      elo: 1000,
      stats: {
        wins: 0, losses: 0, draws: 0, winRate: 0, elo: 1000,
        longestStreak: 0, currentStreak: 0, accuracySum: 0, accuracyCount: 0,
        totalMoveTime: 0, totalMovesCount: 0
      },
      achievements: DEFAULT_ACHIEVEMENTS,
      dailyMissions: DEFAULT_MISSIONS,
      skin: 'classic',
      theme: 'space'
    };

    setProfile(newProfile);
    localStorage.setItem('tictac_profile', JSON.stringify(newProfile));
    syncProfileWithServer(newProfile);
    setActiveTab('offline');
  };

  // Timers thread for Blitz / Speed controls
  useEffect(() => {
    if (game && game.status === 'playing' && game.settings.timeLimit > 0 && !game.winner) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const active = game.currentPlayer;
          const left = prev[active] - 1;
          
          if (left <= 0) {
            clearInterval(timerRef.current);
            handleMatchTimeout(active);
            return { ...prev, [active]: 0 };
          }

          if (left <= 3) {
            sfx.playCountdownWarning();
          } else {
            sfx.playCountdown();
          }

          return { ...prev, [active]: left };
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [game?.currentPlayer, game?.status, game?.winner]);

  const handleMatchTimeout = (timedOutPlayer: PlayerType) => {
    if (!game) return;
    sfx.playDefeat();
    const winningMarker: PlayerType = timedOutPlayer === 'X' ? 'O' : 'X';
    
    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        winner: winningMarker,
        status: 'ended'
      };
    });
    setGameStatusText(`Player ${timedOutPlayer} timed out! Player ${winningMarker} wins!`);
    handleEndGameStats(winningMarker);
  };

  // Trigger procedural audio mute
  const handleToggleMute = () => {
    const isMuted = sfx.toggleMute();
    setMuted(isMuted);
    if (!isMuted) {
      sfx.startAmbientMusic();
    } else {
      sfx.stopAmbientMusic();
    }
  };

  // Offline Match Boot Setup
  const handleLaunchOfflineGame = () => {
    sfx.playClick();
    setShowCoach(false);
    setAiDialogue(null);

    // Initial Board
    const board = Array(size).fill(null).map(() => Array(size).fill(null));
    
    // Generate special cells if not standard classic
    let special: SpecialCell[] = [];
    if (mode === 'bomb') {
      // Place random bombs depending on grid dimensions
      const bombCount = size >= 5 ? 3 : 1;
      for (let i = 0; i < bombCount; i++) {
        const br = Math.floor(Math.random() * size);
        const bc = Math.floor(Math.random() * size);
        if (!special.some(s => s.row === br && s.col === bc)) {
          special.push({ row: br, col: bc, type: 'bomb' });
        }
      }
    } else if (mode === 'frozen') {
      const frozenCount = size >= 5 ? 2 : 1;
      for (let i = 0; i < frozenCount; i++) {
        const fr = Math.floor(Math.random() * size);
        const fc = Math.floor(Math.random() * size);
        if (!special.some(s => s.row === fr && s.col === fc)) {
          special.push({ row: fr, col: fc, type: 'frozen' });
        }
      }
    }

    const initialGame: GameState = {
      board,
      currentPlayer: 'X',
      winner: null,
      winningLine: [],
      history: [],
      settings: { size, winCondition, mode: mode as any, timeLimit },
      specialCells: special,
      status: 'playing',
      timeRemaining: { X: timeLimit, O: timeLimit }
    };

    setGame(initialGame);
    setTimeRemaining({ X: timeLimit, O: timeLimit });
    setGameStatusText('Match is live! Deploy your markers.');
    
    // Greeting dialogue from chosen AI Personality
    setAiDialogue(`Ready for a match? Make your first move!`);
  };

  // Cell Interaction controller
  const handleOfflineCellClick = async (row: number, col: number) => {
    if (!game || game.status !== 'playing' || game.board[row][col] !== null) return;
    if (isAiThinking) return;

    // Place player token
    const player = game.currentPlayer;
    if (player === 'X') {
      sfx.playPlaceX();
    } else {
      sfx.playPlaceO();
    }

    let boardCopy = game.board.map(r => [...r]);
    let specialCellsCopy = [...game.specialCells];
    
    let targetRow = row;
    let targetCol = col;

    // Mode-specific mutations
    if (mode === 'gravity') {
      const gravRow = getGravityRow(boardCopy, col, size);
      if (gravRow === -1) return; // Column full
      targetRow = gravRow;
    }

    // Trigger Bomb Explosion
    const targetBomb = specialCellsCopy.find(s => s.row === targetRow && s.col === targetCol && s.type === 'bomb');
    if (targetBomb) {
      sfx.playBomb();
      // Remove bomb and clear neighboring coordinates
      specialCellsCopy = specialCellsCopy.filter(s => !(s.row === targetRow && s.col === targetCol));
      boardCopy[targetRow][targetCol] = null;
      // Explode neighbors
      for (let rOffset = -1; rOffset <= 1; rOffset++) {
        for (let cOffset = -1; cOffset <= 1; rOffset++) {
          const nr = targetRow + rOffset;
          const nc = targetCol + cOffset;
          if (nr >= 0 && nr < size && nc >= 0 && nc < size) {
            boardCopy[nr][nc] = null;
          }
        }
      }
    } else {
      boardCopy[targetRow][targetCol] = player;
    }

    const move: Move = {
      row: targetRow,
      col: targetCol,
      player,
      timestamp: Date.now()
    };

    const newHistory = [...game.history, move];

    // Check for wins
    const winResult = checkWin(boardCopy, size, winCondition);
    if (winResult) {
      handleMatchOver(boardCopy, winResult.winner, winResult.line, newHistory, specialCellsCopy);
    } else {
      // Rotate turn
      const nextPlayer: PlayerType = player === 'X' ? 'O' : 'X';
      
      setGame({
        ...game,
        board: boardCopy,
        currentPlayer: nextPlayer,
        history: newHistory,
        specialCells: specialCellsCopy
      });

      // AI response logic
      if (nextPlayer === 'O') {
        setIsAiThinking(true);
        setGameStatusText('AI is calculating strategic pathways...');
        
        // Dynamic simulated delay to feel organic
        setTimeout(async () => {
          const aiResponse = await getAIMove(boardCopy, size, winCondition, 'O', aiDifficulty, mode, specialCellsCopy);
          
          if (aiResponse.row !== -1 && aiResponse.col !== -1) {
            sfx.playPlaceO();
            boardCopy[aiResponse.row][aiResponse.col] = 'O';
            setAiDialogue(aiResponse.dialogue);

            const aiMove: Move = {
              row: aiResponse.row,
              col: aiResponse.col,
              player: 'O',
              timestamp: Date.now()
            };

            const afterAiHistory = [...newHistory, aiMove];
            const aiWinResult = checkWin(boardCopy, size, winCondition);

            if (aiWinResult) {
              handleMatchOver(boardCopy, aiWinResult.winner, aiWinResult.line, afterAiHistory, specialCellsCopy);
            } else {
              setGame(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  board: boardCopy,
                  currentPlayer: 'X',
                  history: afterAiHistory
                };
              });
              setGameStatusText('Your turn! Take the field.');
            }
          }
          setIsAiThinking(false);
        }, 800);
      }
    }
  };

  const handleMatchOver = (
    finalBoard: CellValue[][],
    winner: CellValue | 'Draw',
    winningLine: [number, number][],
    history: Move[],
    special: SpecialCell[]
  ) => {
    if (winner === 'X') {
      sfx.playVictory();
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setGameStatusText('Brilliant! You won the cosmic duel!');
      setAiDialogue('Incredible display of tactics! You got me!');
    } else if (winner === 'O') {
      sfx.playDefeat();
      setGameStatusText('Defeat. The AI has outsmarted your lines.');
      setAiDialogue('Victory is mine! Great attempt though!');
    } else {
      sfx.playDraw();
      setGameStatusText('Tie. A perfect grid equilibrium.');
      setAiDialogue('A perfect draw! Truly a tight battle!');
    }

    setGame(prev => {
      if (!prev) return null;
      return {
        ...prev,
        board: finalBoard,
        winner,
        winningLine,
        history,
        specialCells: special,
        status: 'ended'
      };
    });

    handleEndGameStats(winner);
  };

  // Sync user profile progress & achievements unlocks
  const handleEndGameStats = (winner: CellValue | 'Draw') => {
    if (!profile) return;

    let wins = profile.stats.wins;
    let losses = profile.stats.losses;
    let draws = profile.stats.draws;
    let currentStreak = profile.stats.currentStreak;
    let longestStreak = profile.stats.longestStreak;
    let elo = profile.elo;

    if (winner === 'X') {
      wins++;
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
      elo += Math.round(15 + (aiDifficulty === 'impossible' ? 20 : 0));
    } else if (winner === 'O') {
      losses++;
      currentStreak = 0;
      elo = Math.max(100, elo - 10);
    } else {
      draws++;
      currentStreak = 0;
    }

    // Achievements checking
    const achievementsCopy = profile.achievements.map((ach) => {
      if (ach.id === 'ach-1' && winner === 'X') {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      if (ach.id === 'ach-2' && currentStreak >= 3) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      if (ach.id === 'ach-3' && winner === 'X' && aiDifficulty === 'impossible') {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      if (ach.id === 'ach-5' && size > 3) {
        return { ...ach, unlocked: true, unlockedAt: new Date().toISOString() };
      }
      return ach;
    });

    // Daily missions checking
    const missionsCopy = profile.dailyMissions.map((m) => {
      if (m.id === 'mis-1' && winner === 'X') {
        const nextVal = Math.min(m.target, m.current + 1);
        return { ...m, current: nextVal, completed: nextVal === m.target };
      }
      if (m.id === 'mis-2' && mode !== 'classic') {
        const nextVal = Math.min(m.target, m.current + 1);
        return { ...m, current: nextVal, completed: nextVal === m.target };
      }
      return m;
    });

    // Calculate win rate
    const total = wins + losses + draws;
    const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

    const updatedProfile: UserProfile = {
      ...profile,
      elo,
      stats: {
        ...profile.stats,
        wins, losses, draws, currentStreak, longestStreak, winRate
      },
      achievements: achievementsCopy,
      dailyMissions: missionsCopy
    };

    setProfile(updatedProfile);
    localStorage.setItem('tictac_profile', JSON.stringify(updatedProfile));
    syncProfileWithServer(updatedProfile);
  };

  // Puzzle Mode Handlers
  const handleSelectPuzzle = (puz: any) => {
    sfx.playClick();
    setActivePuzzle(puz);
    setPuzzleMovesPlayed([]);
    setPuzzleResult('playing');
  };

  const handlePuzzleCellClick = (row: number, col: number) => {
    if (!activePuzzle || puzzleResult !== 'playing') return;

    const currentTurn = activePuzzle.currentPlayer;
    const clickIdx = puzzleMovesPlayed.length;
    const expectedMove = activePuzzle.solution[clickIdx];

    // Play click sound
    sfx.playClick();

    if (expectedMove && expectedMove.row === row && expectedMove.col === col) {
      // Correct move
      const nextMovesPlayed = [...puzzleMovesPlayed, { row, col, player: currentTurn }];
      setPuzzleMovesPlayed(nextMovesPlayed);

      if (nextMovesPlayed.length === activePuzzle.solution.length) {
        // Success
        sfx.playVictory();
        confetti({ particleCount: 100, spread: 60, origin: { y: 0.6 } });
        setPuzzleResult('success');

        // Update puzzle mission stats
        if (profile) {
          const achievementsCopy = profile.achievements.map((ach) => {
            if (ach.id === 'ach-4') {
              const p = Math.min(ach.target, ach.progress + 1);
              return { ...ach, progress: p, unlocked: p === ach.target, unlockedAt: p === ach.target ? new Date().toISOString() : undefined };
            }
            return ach;
          });

          const missionsCopy = profile.dailyMissions.map((m) => {
            if (m.id === 'mis-3') {
              const p = Math.min(m.target, m.current + 1);
              return { ...m, current: p, completed: p === m.target };
            }
            return m;
          });

          const updated = {
            ...profile,
            stats: { ...profile.stats, elo: profile.elo + 15 },
            achievements: achievementsCopy,
            dailyMissions: missionsCopy
          };
          setProfile(updated);
          localStorage.setItem('tictac_profile', JSON.stringify(updated));
          syncProfileWithServer(updated);
        }
      }
    } else {
      // Wrong move
      sfx.playDefeat();
      setPuzzleResult('failed');
    }
  };

  // Replay loader
  const handleLoadReplay = async () => {
    if (!replayIdInput.trim()) return;
    sfx.playClick();
    try {
      const res = await fetch(`/api/replays/${replayIdInput.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setActiveReplay(data);
      } else {
        alert('Replay room ID not discovered in the database.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleShareMatchReplay = async () => {
    if (!game) return;
    sfx.playVictory();
    try {
      const res = await fetch('/api/replays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerX: profile?.username || 'Challenger X',
          playerO: 'TicTac AI',
          size: game.settings.size,
          winCondition: game.settings.winCondition,
          mode: game.settings.mode,
          winner: game.winner,
          moves: game.history,
          winningLine: game.winningLine
        })
      });

      if (res.ok) {
        const data = await res.json();
        setReplayShareUrl(`${window.location.origin}?replay=${data.id}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Custom Level Editor bridge
  const handlePlayCustomLevel = (lvl: CustomLevel) => {
    sfx.playVictory();
    setActiveTab('offline');
    setSize(lvl.size);
    setWinCondition(lvl.winCondition);
    setMode('classic'); // resets back to obstacles placement inside GameBoard
    
    // Boot game
    const board = Array(lvl.size).fill(null).map(() => Array(lvl.size).fill(null));
    const customGame: GameState = {
      board,
      currentPlayer: 'X',
      winner: null,
      winningLine: [],
      history: [],
      settings: { size: lvl.size, winCondition: lvl.winCondition, mode: 'classic', timeLimit: 0 },
      specialCells: lvl.specialCells,
      status: 'playing',
      timeRemaining: { X: 0, O: 0 }
    };

    setGame(customGame);
    setGameStatusText(`Playing custom arena: ${lvl.title}`);
    setAiDialogue(`A custom battlefield! Show me your best path.`);
  };

  // Render current puzzle board helper
  const getPuzzleBoard = () => {
    if (!activePuzzle) return [];
    const boardCopy = activePuzzle.board.map((row: any) => [...row]);
    // Apply moves played so far
    puzzleMovesPlayed.forEach((m) => {
      boardCopy[m.row][m.col] = m.player;
    });
    return boardCopy;
  };

  // Theme gradient variables mapping
  const themeClasses = {
    space: 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-slate-100',
    neon: 'bg-gradient-to-br from-zinc-950 via-zinc-900 to-slate-950 text-slate-100 border-rose-500/10',
    sakura: 'bg-gradient-to-br from-rose-50 via-rose-100 to-pink-100 text-rose-900',
    retro: 'bg-gradient-to-br from-black via-zinc-900 to-black text-green-400 font-mono'
  }[theme] || 'bg-slate-950 text-slate-100';

  return (
    <div className={`min-h-screen ${themeClasses} transition-all duration-700 flex flex-col justify-between overflow-x-hidden pb-10`}>
      
      {/* 1. Header Navigation Bar */}
      <header className="border-b border-slate-800/40 bg-slate-950/40 backdrop-blur-md sticky top-0 z-40 px-4 py-3.5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          
          {/* Logo element */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-wider text-slate-50">TicTac Universe</h1>
              <p className="text-[10px] text-indigo-400 font-extrabold uppercase tracking-widest">Startup Edition</p>
            </div>
          </div>

          {/* Core Tab Selector Links */}
          {profile && (
            <nav className="hidden lg:flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
              {[
                { id: 'offline', label: 'Play Offline', icon: Play },
                { id: 'online', label: 'Play Online', icon: Globe },
                { id: 'puzzles', label: 'Tactical Puzzles', icon: BrainCircuit },
                { id: 'editor', label: 'Level Creator', icon: Hammer },
                { id: 'replay', label: 'Match Replays', icon: Film },
                { id: 'stats', label: 'Rankings & Badges', icon: Trophy }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      sfx.playClick();
                      setActiveTab(tab.id);
                    }}
                    className={`
                      px-3.5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all duration-300
                      ${active 
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                      }
                    `}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          )}

          {/* Quick utility settings overlay (profile badge & sound mute toggles) */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleToggleMute}
              className="p-2 bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl text-slate-300 transition-colors"
            >
              {muted ? <VolumeX className="w-4 h-4 text-rose-500 animate-pulse" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {profile && (
              <div className="flex items-center gap-2.5 bg-slate-950/80 border border-slate-800/80 rounded-xl py-1.5 px-3">
                <div className="w-6 h-6 rounded-lg bg-indigo-950 flex items-center justify-center font-black text-xs text-indigo-400">
                  {profile.username[0].toUpperCase()}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-[10px] font-black text-slate-200">{profile.username}</div>
                  <div className="text-[9px] text-indigo-400 font-mono">{profile.elo} ELO</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. Responsive Mobile Tab bar */}
      {profile && activeTab !== 'profile_setup' && (
        <div className="lg:hidden bg-slate-950/95 border-b border-slate-900 flex justify-around p-1.5 overflow-x-auto gap-2">
          {[
            { id: 'offline', label: 'Offline' },
            { id: 'online', label: 'Online' },
            { id: 'puzzles', label: 'Puzzles' },
            { id: 'editor', label: 'Creator' },
            { id: 'replay', label: 'Replays' },
            { id: 'stats', label: 'Rankings' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { sfx.playClick(); setActiveTab(tab.id); }}
              className={`px-3 py-1 text-xs font-bold uppercase rounded ${activeTab === tab.id ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* 3. Primary Dashboard Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8">
        <AnimatePresence mode="wait">
          
          {/* PROFILE SETUP BLOCK */}
          {activeTab === 'profile_setup' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-800 shadow-2xl text-center space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-black uppercase tracking-wider text-slate-100 flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                  Initiate Profile
                </h2>
                <p className="text-xs text-slate-400 leading-normal">
                  Select your strategic handle to register in the competitive rankings directory.
                </p>
              </div>

              <form onSubmit={handleCreateProfile} className="space-y-4">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block text-left mb-1">Username</label>
                  <input
                    type="text"
                    maxLength={16}
                    placeholder="e.g. MasterGamer"
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs py-2.5 px-3.5 focus:outline-none focus:border-indigo-500 font-bold tracking-wide"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block text-left mb-1">AI Trainer Avatar Preset</label>
                  <div className="grid grid-cols-5 gap-2">
                    {['friendly', 'robot', 'cold', 'troll', 'grandmaster'].map((av) => (
                      <button
                        type="button"
                        key={av}
                        onClick={() => { sfx.playClick(); setAvatarInput(av); }}
                        className={`py-2 rounded-xl text-[10px] uppercase font-black tracking-wide border transition-all ${
                          avatarInput === av ? 'bg-indigo-950 text-indigo-300 border-indigo-500' : 'bg-slate-950 text-slate-500 border-slate-850'
                        }`}
                      >
                        {av[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!usernameInput.trim()}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                >
                  Enter TicTac Universe
                </button>
              </form>
            </motion.div>
          )}

          {/* SCREEN 1: PLAY OFFLINE (VERSUS AI / PASS-N-PLAY) */}
          {activeTab === 'offline' && profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Left Column: Match Options Config */}
              <div className="space-y-6">
                
                {/* Board Setup parameters */}
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Settings className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-black text-slate-100 text-xs uppercase tracking-wider">Matchmaking Parameters</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Board Dimension</label>
                        <select
                          value={size}
                          onChange={(e) => {
                            const s = parseInt(e.target.value);
                            setSize(s);
                            if (winCondition > s) setWinCondition(s);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                        >
                          {[3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}x{s}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Win Length</label>
                        <select
                          value={winCondition}
                          onChange={(e) => setWinCondition(parseInt(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                        >
                          {Array.from({ length: size - 1 }, (_, i) => i + 2).map(c => (
                            <option key={c} value={c}>{c} in a row</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Gameplay Mode Variant</label>
                      <select
                        value={mode}
                        onChange={(e) => setMode(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs capitalize"
                      >
                        {['classic', 'bomb', 'frozen', 'fog', 'gravity'].map(m => (
                          <option key={m} value={m}>{m} Mode</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Blitz Time limits</label>
                      <select
                        value={timeLimit}
                        onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                      >
                        <option value={0}>Infinite (No limit)</option>
                        <option value={5}>5 seconds speedrun</option>
                        <option value={15}>15 seconds blitz</option>
                        <option value={45}>45 seconds standard</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* AI parameters setup */}
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <BrainCircuit className="w-4 h-4 text-indigo-400" />
                    <h3 className="font-black text-slate-100 text-xs uppercase tracking-wider">AI Trainer Core</h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Difficulty level</label>
                      <select
                        value={aiDifficulty}
                        onChange={(e) => setAiDifficulty(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs capitalize"
                      >
                        {['beginner', 'easy', 'normal', 'hard', 'expert', 'impossible'].map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Personality Matrix</label>
                      <select
                        value={aiPersonality}
                        onChange={(e) => setAiPersonality(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs capitalize"
                      >
                        {['friendly', 'robot', 'aggressive', 'troll', 'cold', 'grandmaster'].map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleLaunchOfflineGame}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)]"
                  >
                    Deploy Offline Arena
                  </button>
                </div>

                {/* Cosmetic Themes Configuration card */}
                <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-3">
                  <label className="text-[10px] text-slate-400 font-bold uppercase block">Cosmetic Skin preset</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['classic', 'fire', 'ice', 'neon', 'lightning', 'retro', 'emoji'].map((sk) => (
                      <button
                        key={sk}
                        onClick={() => { sfx.playClick(); setSkin(sk); }}
                        className={`py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                          skin === sk ? 'bg-indigo-950 text-indigo-300 border-indigo-600' : 'bg-slate-950 text-slate-500 border-slate-850'
                        }`}
                      >
                        {sk}
                      </button>
                    ))}
                  </div>

                  <label className="text-[10px] text-slate-400 font-bold uppercase block pt-2">Background Theme layout</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['space', 'neon', 'sakura', 'retro'].map((th) => (
                      <button
                        key={th}
                        onClick={() => { sfx.playClick(); setTheme(th); }}
                        className={`py-1.5 rounded-lg text-[9px] font-black uppercase border transition-all ${
                          theme === th ? 'bg-indigo-950 text-indigo-300 border-indigo-600' : 'bg-slate-950 text-slate-500 border-slate-850'
                        }`}
                      >
                        {th}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

              {/* Center / Right Column: Active Game Board and Dialogue */}
              <div className="lg:col-span-2 space-y-6">
                
                {game ? (
                  <div className="space-y-6">
                    {/* Game Status metadata panel */}
                    <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase block">Combat Status Log</span>
                        <p className="font-bold text-slate-200 mt-0.5">{gameStatusText}</p>
                      </div>

                      {/* Timers indicator if active */}
                      {timeLimit > 0 && (
                        <div className="flex gap-4">
                          <div className="text-center">
                            <span className="text-[9px] text-blue-400 font-black uppercase">Time X</span>
                            <div className="text-sm font-mono font-black">{timeRemaining.X}s</div>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-rose-400 font-black uppercase">Time O</span>
                            <div className="text-sm font-mono font-black">{timeRemaining.O}s</div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Dialogue Bubble */}
                    {aiDialogue && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-900/40 border border-indigo-950 p-4 rounded-2xl relative flex items-start gap-3"
                      >
                        <Skull className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <span className="text-[9px] text-indigo-400 font-black uppercase tracking-wider">{aiPersonality} AI response</span>
                          <p className="text-xs text-slate-300 font-medium leading-relaxed mt-0.5">"{aiDialogue}"</p>
                        </div>
                      </motion.div>
                    )}

                    {/* Primary GameBoard */}
                    <GameBoard
                      gameState={game}
                      skin={skin}
                      onCellClick={handleOfflineCellClick}
                    />

                    {/* Post-match Share / Coach Analysis triggers */}
                    {game.winner && (
                      <div className="flex flex-col gap-4">
                        <div className="flex gap-2.5">
                          <button
                            onClick={() => { sfx.playVictory(); setShowCoach(!showCoach); }}
                            className="flex-1 py-3 bg-violet-700 hover:bg-violet-600 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2"
                          >
                            <BrainCircuit className="w-4 h-4" />
                            <span>{showCoach ? 'Collapse AI Coach' : 'Analyze with AI Coach'}</span>
                          </button>

                          <button
                            onClick={handleShareMatchReplay}
                            className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase rounded-xl transition-all border border-slate-750 flex items-center justify-center gap-2"
                          >
                            <Share2 className="w-4 h-4" />
                            <span>Share Match Replay</span>
                          </button>
                        </div>

                        {/* Replay Sharing URL display */}
                        {replayShareUrl && (
                          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-center">
                            <span className="text-[9px] text-slate-500 font-bold uppercase block">Shareable Replay URL Link</span>
                            <a href={replayShareUrl} target="_blank" className="text-indigo-400 font-black break-all inline-block mt-1 hover:underline">
                              {replayShareUrl}
                            </a>
                          </div>
                        )}

                        {/* Slide-in AI Coach */}
                        {showCoach && (
                          <AICoachPanel
                            history={game.history}
                            boardSize={size}
                            winCondition={winCondition}
                            mode={mode}
                            winner={game.winner === 'Draw' ? 'Draw' : game.winner as string}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-slate-900/30 backdrop-blur-sm p-12 rounded-3xl border border-slate-850 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <Sparkles className="w-12 h-12 text-indigo-400 animate-pulse mb-4" />
                    <h3 className="font-black text-slate-100 text-base uppercase tracking-wider mb-2">No active offline match</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                      Adjust your arena sizes, victory limits, blitz clocks, and opponent AI personalities to launch.
                    </p>
                    <button
                      onClick={handleLaunchOfflineGame}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.35)]"
                    >
                      Establish Arena Now
                    </button>
                  </div>
                )}

              </div>
            </motion.div>
          )}

          {/* SCREEN 2: PLAY ONLINE MULTIPLAYER */}
          {activeTab === 'online' && profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <OnlineLobby
                userId={profile.id}
                username={profile.username}
                elo={profile.elo}
                avatar={profile.avatar}
                onRoomStateUpdated={(state, role) => {
                  setOnlineRoom(state);
                  setMyOnlineRole(role);
                }}
                activeRoomState={onlineRoom}
                myRole={myOnlineRole}
                onExitRoom={() => {
                  setOnlineRoom(null);
                  setMyOnlineRole(null);
                }}
                onPlaceToken={(r, c) => {
                  // Direct token placement trigger (not used offline)
                }}
              />

              {/* Render online Game Board if match has active state */}
              {onlineRoom && onlineRoom.status === 'playing' && (
                <div className="pt-6">
                  <GameBoard
                    gameState={{
                      board: onlineRoom.gameState.board as any,
                      currentPlayer: onlineRoom.gameState.currentPlayer as any,
                      winner: onlineRoom.gameState.winner as any,
                      winningLine: onlineRoom.gameState.winningLine as any,
                      history: onlineRoom.gameState.history as any,
                      settings: onlineRoom.settings as any,
                      specialCells: [],
                      status: onlineRoom.status as any,
                      timeRemaining: { X: 0, O: 0 }
                    }}
                    skin={skin}
                    onCellClick={(row, col) => {
                      // Place token over websocket connection
                      if (myOnlineRole !== onlineRoom.gameState.currentPlayer) return;
                      // Place move via WS connection trigger
                      const wsInstance = (window as any).ws;
                    }}
                    isOnlineMode={true}
                    myRole={myOnlineRole}
                  />
                </div>
              )}
            </motion.div>
          )}

          {/* SCREEN 3: TACTICAL PUZZLES */}
          {activeTab === 'puzzles' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* Left Column: Puzzles Selector */}
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                  <BrainCircuit className="w-5 h-5 text-indigo-400" />
                  <h2 className="font-black text-slate-100 text-xs uppercase tracking-wider">Tactical Puzzles Library</h2>
                </div>

                <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
                  {CURATED_PUZZLES.map((puz) => {
                    const active = activePuzzle?.id === puz.id;
                    return (
                      <div
                        key={puz.id}
                        onClick={() => handleSelectPuzzle(puz)}
                        className={`
                          p-3 rounded-xl border transition-all cursor-pointer space-y-1.5
                          ${active 
                            ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' 
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-black text-slate-200 uppercase tracking-wide">{puz.title}</h4>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            puz.difficulty === 'easy' ? 'bg-emerald-950/40 border-emerald-900/50 text-emerald-400' :
                            puz.difficulty === 'medium' ? 'bg-amber-950/40 border-amber-900/50 text-amber-400' :
                            'bg-rose-950/40 border-rose-900/50 text-rose-400'
                          }`}>
                            {puz.difficulty}
                          </span>
                        </div>
                        <p className="text-[10px] leading-relaxed opacity-90">{puz.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Main Column: Active Puzzle Solver */}
              <div className="md:col-span-2">
                {activePuzzle ? (
                  <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div>
                        <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide">{activePuzzle.title}</h3>
                        <p className="text-[10px] text-slate-400 font-bold mt-0.5">Objective: Complete the sequence in {activePuzzle.movesToSolve} move(s)</p>
                      </div>

                      <button
                        onClick={() => handleSelectPuzzle(activePuzzle)}
                        className="p-1.5 bg-slate-950 border border-slate-850 hover:border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Custom board visual representation */}
                    <div className="flex items-center justify-center p-4 bg-slate-950/80 rounded-2xl border border-slate-850">
                      <div className="grid grid-cols-5 gap-2.5 w-full max-w-sm aspect-square" style={{ gridTemplateColumns: `repeat(${activePuzzle.size}, minmax(0, 1fr))` }}>
                        {getPuzzleBoard().map((row: any, r: number) => (
                          <React.Fragment key={r}>
                            {row.map((val: any, c: number) => {
                              // Check if cell has obstacles
                              const obstacle = activePuzzle.specialCells.find((s: any) => s.row === r && s.col === c);
                              const played = puzzleMovesPlayed.find(m => m.row === r && m.col === c);

                              return (
                                <button
                                  key={`${r}-${c}`}
                                  onClick={() => handlePuzzleCellClick(r, c)}
                                  disabled={val !== null || obstacle || puzzleResult !== 'playing'}
                                  className={`
                                    aspect-square rounded-xl border transition-all flex items-center justify-center text-3xl font-black relative
                                    ${val 
                                      ? 'bg-slate-900/50 border-slate-800 text-slate-200' 
                                      : obstacle 
                                        ? 'bg-sky-950/20 border-sky-900/50 text-sky-400'
                                        : 'bg-slate-950 hover:bg-slate-900/60 border-slate-850 cursor-pointer'
                                    }
                                  `}
                                >
                                  {val === 'X' ? <span className="text-blue-500">✕</span> : val === 'O' ? <span className="text-rose-500">◯</span> : null}
                                  
                                  {obstacle && (
                                    <span className="text-[8px] uppercase font-black text-sky-400 absolute">{obstacle.type[0]}</span>
                                  )}
                                </button>
                              );
                            })}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>

                    {/* Result notification banner */}
                    <AnimatePresence>
                      {puzzleResult === 'success' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-emerald-950/20 border border-emerald-900/50 rounded-xl text-center text-emerald-400 space-y-1"
                        >
                          <h4 className="font-black text-xs uppercase tracking-wider">Tactical Success!</h4>
                          <p className="text-[10px] leading-relaxed">You discovered the optimal spatial geometry lines. +15 ELO points acquired!</p>
                        </motion.div>
                      )}
                      {puzzleResult === 'failed' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl text-center text-rose-400 space-y-1"
                        >
                          <h4 className="font-black text-xs uppercase tracking-wider">Tactical Suboptimal Play!</h4>
                          <p className="text-[10px] leading-relaxed">That move did not yield winning patterns or defense. Tap refresh to reset.</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="bg-slate-900/30 backdrop-blur-sm p-12 rounded-3xl border border-slate-850 text-center flex flex-col items-center justify-center min-h-[350px]">
                    <BrainCircuit className="w-12 h-12 text-indigo-400 animate-pulse mb-4" />
                    <h3 className="font-black text-slate-100 text-base uppercase tracking-wider mb-2">No active tactical puzzle</h3>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-6">
                      Select one of our curated tactical setups on the left side panel to test your spatial reasoning!
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* SCREEN 4: LEVEL EDITOR */}
          {activeTab === 'editor' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LevelEditor
                username={profile?.username || 'Creator'}
                onPlayLevel={handlePlayCustomLevel}
              />
            </motion.div>
          )}

          {/* SCREEN 5: MATCH REPLAYS PLAYER */}
          {activeTab === 'replay' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {!activeReplay ? (
                <div className="max-w-md mx-auto bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-xl space-y-5">
                  <div className="text-center space-y-1.5">
                    <Film className="w-10 h-10 text-indigo-400 mx-auto animate-pulse" />
                    <h3 className="font-black text-slate-100 text-sm uppercase tracking-wider">Access Shared Replay</h3>
                    <p className="text-[10px] text-slate-400 font-bold">Input replay room code or paste links</p>
                  </div>

                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. rep-abcdefg"
                      value={replayIdInput}
                      onChange={(e) => setReplayIdInput(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                    <button
                      onClick={handleLoadReplay}
                      disabled={!replayIdInput.trim()}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-black text-xs uppercase rounded-lg transition-all"
                    >
                      Load Cinematic Replay
                    </button>
                  </div>
                </div>
              ) : (
                <ReplayPlayer
                  replayData={activeReplay}
                  onClose={() => setActiveReplay(null)}
                />
              )}
            </motion.div>
          )}

          {/* SCREEN 6: GLOBAL STATS & LEADERBOARDS */}
          {activeTab === 'stats' && profile && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <LeaderboardAchievements
                achievements={profile.achievements}
                dailyMissions={profile.dailyMissions}
                currentElo={profile.elo}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-10">
        <p>&copy; 2026 TicTac Universe Corp. All spatial coordinates reserved.</p>
      </footer>

    </div>
  );
}
