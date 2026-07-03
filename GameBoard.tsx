/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bomb, Snowflake, ShieldAlert, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { CellValue, GameState, GameSettings, SpecialCell, PlayerType } from '../types';
import { sfx } from '../lib/audio';

interface GameBoardProps {
  gameState: GameState;
  skin: string;
  onCellClick: (row: number, col: number) => void;
  isOnlineMode?: boolean;
  myRole?: 'X' | 'O' | 'spec';
}

export default function GameBoard({
  gameState,
  skin,
  onCellClick,
  isOnlineMode = false,
  myRole
}: GameBoardProps) {
  const { board, currentPlayer, winner, winningLine, settings, specialCells } = gameState;
  const size = settings.size;

  // Track hover coordinate
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  // Render skin-specific shapes with rich custom colors
  const renderMarker = (val: CellValue, winning: boolean) => {
    if (!val) return null;

    const baseTransition = { type: 'spring', stiffness: 260, damping: 20 };
    
    // Choose custom class combinations depending on skin
    let xStyle = 'text-blue-500 shadow-blue-500/30';
    let oStyle = 'text-rose-500 shadow-rose-500/30';
    let customXElement = null;
    let customOElement = null;

    switch (skin) {
      case 'fire':
        xStyle = 'text-orange-600 drop-shadow-[0_0_10px_rgba(234,88,12,0.8)] font-black';
        oStyle = 'text-amber-500 drop-shadow-[0_0_10px_rgba(245,158,11,0.8)] font-black';
        break;
      case 'ice':
        xStyle = 'text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.7)] font-medium';
        oStyle = 'text-sky-300 drop-shadow-[0_0_12px_rgba(125,211,252,0.7)] font-medium';
        break;
      case 'neon':
        xStyle = 'text-pink-500 drop-shadow-[0_0_15px_rgba(236,72,153,0.9)] font-extrabold';
        oStyle = 'text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.9)] font-extrabold';
        break;
      case 'lightning':
        xStyle = 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)] font-black';
        oStyle = 'text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)] font-black';
        break;
      case 'retro':
        xStyle = 'text-green-500 font-mono font-bold tracking-widest uppercase';
        oStyle = 'text-yellow-500 font-mono font-bold tracking-widest uppercase';
        break;
      case 'emoji':
        customXElement = <span className="text-3xl md:text-4xl">⭐</span>;
        customOElement = <span className="text-3xl md:text-4xl">❤️</span>;
        break;
    }

    if (val === 'X') {
      return (
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={baseTransition}
          className={`flex items-center justify-center font-sans select-none text-4xl md:text-5xl ${xStyle} ${winning ? 'animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]' : ''}`}
        >
          {customXElement || '✕'}
        </motion.div>
      );
    } else {
      return (
        <motion.div
          initial={{ scale: 0, rotate: 45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={baseTransition}
          className={`flex items-center justify-center font-sans select-none text-4xl md:text-5xl ${oStyle} ${winning ? 'animate-bounce drop-shadow-[0_0_20px_rgba(255,255,255,0.9)]' : ''}`}
        >
          {customOElement || '◯'}
        </motion.div>
      );
    }
  };

  // Check if cell is part of winning line to trigger glows
  const isWinningCell = (row: number, col: number) => {
    return winningLine.some(([r, c]) => r === row && c === col);
  };

  // Check special cell statuses
  const getSpecialType = (row: number, col: number) => {
    return specialCells.find(s => s.row === row && s.col === col);
  };

  // Responsive dynamic columns grid setting
  const gridTemplateCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8'
  }[size] || 'grid-cols-3';

  // Fog of war check (only reveals cell if it's near or already has markers)
  const isFogged = (row: number, col: number) => {
    if (settings.mode !== 'fog' || winner) return false;
    // Check neighbors within radius of 1 for placed markers
    for (let r = Math.max(0, row - 1); r <= Math.min(size - 1, row + 1); r++) {
      for (let c = Math.max(0, col - 1); c <= Math.min(size - 1, col + 1); c++) {
        if (board[r][c] !== null) return false;
      }
    }
    return true;
  };

  return (
    <div className="relative w-full max-w-lg mx-auto bg-slate-900/60 backdrop-blur-xl rounded-3xl p-4 md:p-6 shadow-2xl border border-slate-800">
      
      {/* Game Rules Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 px-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span>Rules: <strong className="text-violet-300 capitalize">{settings.mode}</strong> ({settings.winCondition} in a row)</span>
        </div>
        
        {isOnlineMode && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300 font-medium">
              Role: <strong className="text-emerald-400 uppercase">{myRole || 'Spectator'}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Grid Container */}
      <div className={`grid ${gridTemplateCols} gap-2.5 bg-slate-950/80 p-3 rounded-2xl overflow-hidden shadow-inner border border-slate-800/80`}>
        {Array(size).fill(null).map((_, r) => (
          <React.Fragment key={r}>
            {Array(size).fill(null).map((_, c) => {
              const val = board[r][c];
              const isWinning = isWinningCell(r, c);
              const special = getSpecialType(r, c);
              const fog = isFogged(r, c);
              const isCellInteractive = !winner && !val && (!isOnlineMode || (myRole === currentPlayer));

              // Find fall row for Gravity hover feedback
              let targetGravityRow = -1;
              if (settings.mode === 'gravity' && hoveredCell?.col === c) {
                // Determine lowest empty row
                for (let rowIdx = size - 1; rowIdx >= 0; rowIdx--) {
                  if (board[rowIdx][c] === null) {
                    targetGravityRow = rowIdx;
                    break;
                  }
                }
              }

              const isGravityHovered = settings.mode === 'gravity' && targetGravityRow === r;

              return (
                <button
                  id={`cell-${r}-${c}`}
                  key={`${r}-${c}`}
                  onClick={() => isCellInteractive && onCellClick(r, c)}
                  onMouseEnter={() => setHoveredCell({ row: r, col: c })}
                  onMouseLeave={() => setHoveredCell(null)}
                  disabled={!isCellInteractive}
                  className={`
                    relative aspect-square rounded-xl transition-all duration-300 flex items-center justify-center group
                    ${fog 
                      ? 'bg-slate-950/95 cursor-not-allowed border border-slate-900 shadow-none' 
                      : isWinning 
                        ? 'bg-violet-950/40 border-2 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.3)] animate-pulse'
                        : val 
                          ? 'bg-slate-900/40 border border-slate-800' 
                          : isGravityHovered
                            ? 'bg-emerald-950/30 border border-emerald-500/50 cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                            : 'bg-slate-900/10 hover:bg-slate-800/30 border border-slate-800/50 cursor-pointer hover:border-slate-700'
                    }
                  `}
                >
                  {/* Fog overlay */}
                  {fog && !winner && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 rounded-xl">
                      <div className="w-1.5 h-1.5 bg-slate-800 rounded-full" />
                    </div>
                  )}

                  {/* Marker representation */}
                  {!fog && renderMarker(val, isWinning)}

                  {/* Special obstacle/cell markers */}
                  {!fog && !val && special && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-1 bg-slate-900/50 rounded-xl select-none">
                      {special.type === 'bomb' && (
                        <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <Bomb className="w-5 h-5 text-amber-500" />
                        </motion.div>
                      )}
                      {special.type === 'frozen' && (
                        <Snowflake className="w-5 h-5 text-sky-400 animate-spin-slow" />
                      )}
                      {special.type === 'wall' && (
                        <ShieldAlert className="w-5 h-5 text-rose-500" />
                      )}
                      {special.type === 'locked' && (
                        <AlertCircle className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  )}

                  {/* Ghost Hover guides */}
                  {!fog && !val && isCellInteractive && hoveredCell?.row === r && hoveredCell?.col === c && settings.mode !== 'gravity' && (
                    <span className="text-xl md:text-2xl text-slate-600/40 font-bold uppercase select-none transition-all duration-200">
                      {currentPlayer}
                    </span>
                  )}

                  {/* Gravity Hover guides */}
                  {!fog && !val && isCellInteractive && isGravityHovered && (
                    <span className="text-xl md:text-2xl text-emerald-500/20 font-bold uppercase select-none transition-all duration-200 animate-bounce">
                      {currentPlayer}
                    </span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Footer Turn State Overlay */}
      <div className="mt-4 flex items-center justify-between text-sm px-2">
        <div className="text-slate-400 font-medium">
          {winner ? (
            <span className="text-emerald-400 font-bold text-base flex items-center gap-1.5">
              <Sparkles className="w-5 h-5 animate-pulse text-amber-400" />
              {winner === 'Draw' ? "It's a perfect tie!" : `Player ${winner} claims victory!`}
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Current turn: 
              <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                currentPlayer === 'X' 
                  ? 'bg-blue-950 text-blue-400 border border-blue-800' 
                  : 'bg-rose-950 text-rose-400 border border-rose-800'
              }`}>
                Player {currentPlayer}
              </span>
            </span>
          )}
        </div>

        {winner && !isOnlineMode && (
          <div className="text-xs text-violet-400 font-bold flex items-center gap-1">
            <span>Analyzing match logs...</span>
          </div>
        )}
      </div>
    </div>
  );
}
