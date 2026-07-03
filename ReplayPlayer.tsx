/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, RotateCcw, SkipBack, SkipForward, FastForward, Film, Copy, Check } from 'lucide-react';
import { CellValue, GameState, GameSettings, SpecialCell, Move } from '../types';
import { sfx } from '../lib/audio';

interface ReplayPlayerProps {
  replayData: {
    id: string;
    playerX: string;
    playerO: string;
    size: number;
    winCondition: number;
    mode: string;
    winner: string;
    moves: Move[];
    winningLine: [number, number][];
    timestamp: number;
  };
  onClose?: () => void;
}

export default function ReplayPlayer({ replayData, onClose }: ReplayPlayerProps) {
  const { playerX, playerO, size, winCondition, mode, winner, moves, winningLine } = replayData;

  const [currentStep, setCurrentStep] = useState<number>(moves.length);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1); // 0.5, 1, 2, 4
  const [copied, setCopied] = useState<boolean>(false);

  const playbackTimer = useRef<any>(null);

  // Derive board state at the current step
  const getBoardAtStep = (step: number) => {
    const grid = Array(size).fill(null).map(() => Array(size).fill(null));
    for (let i = 0; i < step; i++) {
      const m = moves[i];
      if (m && m.row >= 0 && m.row < size && m.col >= 0 && m.col < size) {
        grid[m.row][m.col] = m.player;
      }
    }
    return grid;
  };

  const currentBoard = getBoardAtStep(currentStep);

  useEffect(() => {
    if (isPlaying) {
      const intervalMs = 1500 / speed;
      playbackTimer.current = setInterval(() => {
        setCurrentStep((prev) => {
          if (prev >= moves.length) {
            setIsPlaying(false);
            return prev;
          }
          sfx.playClick();
          return prev + 1;
        });
      }, intervalMs);
    } else {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    }

    return () => {
      if (playbackTimer.current) {
        clearInterval(playbackTimer.current);
      }
    };
  }, [isPlaying, speed, moves.length]);

  const handleStepForward = () => {
    sfx.playClick();
    setCurrentStep((prev) => Math.min(moves.length, prev + 1));
  };

  const handleStepBackward = () => {
    sfx.playClick();
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleRestart = () => {
    sfx.playClick();
    setCurrentStep(0);
    setIsPlaying(false);
  };

  const handleCopyLink = () => {
    sfx.playVictory();
    const shareUrl = `${window.location.origin}?replay=${replayData.id}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  // Check if grid coordinates are in winning lines (only highlight at final steps)
  const isWinnerCell = (r: number, c: number) => {
    if (currentStep < moves.length || winner === 'Draw') return false;
    return winningLine.some(([wr, wc]) => wr === r && wc === c);
  };

  const gridTemplateCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8'
  }[size] || 'grid-cols-3';

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Visual Board panel */}
      <div className="md:col-span-2 bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Film className="w-5 h-5 text-indigo-400" />
            <h2 className="font-black text-slate-100 text-sm uppercase tracking-wider">Cinematic Replay</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-[10px] text-slate-300 font-bold hover:border-slate-700 flex items-center gap-1.5 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Share Replay'}</span>
            </button>
            {onClose && (
              <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200">
                Exit
              </button>
            )}
          </div>
        </div>

        {/* Players metadata header */}
        <div className="flex items-center justify-between bg-slate-950/60 py-2.5 px-4 rounded-xl border border-slate-800/80">
          <div className="text-center">
            <div className="text-[10px] text-blue-400 font-bold uppercase">Player X</div>
            <div className="text-xs font-black text-slate-200">{playerX}</div>
          </div>
          <div className="text-xs text-slate-500 font-black">VS</div>
          <div className="text-center">
            <div className="text-[10px] text-rose-400 font-bold uppercase">Player O</div>
            <div className="text-xs font-black text-slate-200">{playerO}</div>
          </div>
        </div>

        {/* Board View */}
        <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-850 flex items-center justify-center">
          <div className={`grid ${gridTemplateCols} gap-2 w-full max-w-sm aspect-square`}>
            {currentBoard.map((row, r) => (
              <React.Fragment key={r}>
                {row.map((val, c) => {
                  const win = isWinnerCell(r, c);
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`
                        aspect-square rounded-xl border transition-all duration-300 flex items-center justify-center font-black text-3xl
                        ${win 
                          ? 'bg-violet-950/40 border-violet-500 shadow-[0_0_15px_rgba(139,92,246,0.25)] text-violet-400 animate-bounce' 
                          : val 
                            ? 'bg-slate-900/40 border-slate-800 text-slate-200' 
                            : 'bg-slate-950 border-slate-900'
                        }
                      `}
                    >
                      {val === 'X' ? (
                        <span className="text-blue-500">✕</span>
                      ) : val === 'O' ? (
                        <span className="text-rose-500">◯</span>
                      ) : null}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Timeline Sliders & Timeline Buttons */}
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-slate-400 font-bold font-mono">Move 0</span>
            <input
              type="range"
              min="0"
              max={moves.length}
              value={currentStep}
              onChange={(e) => {
                sfx.playClick();
                setCurrentStep(parseInt(e.target.value));
              }}
              className="flex-1 accent-indigo-500 bg-slate-950 h-1.5 rounded-lg appearance-none cursor-pointer border border-slate-850"
            />
            <span className="text-[10px] text-slate-400 font-bold font-mono">Move {moves.length}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {([0.5, 1, 2, 4] as number[]).map((sp) => (
                <button
                  key={sp}
                  onClick={() => setSpeed(sp)}
                  className={`
                    px-2.5 py-1 rounded text-[10px] font-black border transition-all
                    ${speed === sp
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-600'
                      : 'bg-slate-950 text-slate-500 border-slate-850 hover:border-slate-700'
                    }
                  `}
                >
                  {sp}x
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={handleStepBackward}
                disabled={currentStep === 0}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-colors disabled:opacity-30"
              >
                <SkipBack className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all shadow-[0_0_10px_rgba(99,102,241,0.3)]"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              <button
                onClick={handleStepForward}
                disabled={currentStep === moves.length}
                className="p-2 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-lg transition-colors disabled:opacity-30"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Replay Details sidebar */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col h-full justify-between">
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <h2 className="font-black text-slate-100 text-xs uppercase tracking-wider">Move Index logs</h2>
          </div>

          <div className="space-y-2 overflow-y-auto max-h-96 pr-1">
            {moves.map((m, idx) => {
              const active = idx < currentStep;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    sfx.playClick();
                    setCurrentStep(idx + 1);
                  }}
                  className={`
                    p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between text-xs
                    ${idx === currentStep - 1
                      ? 'bg-indigo-950/40 border-indigo-600 text-indigo-300'
                      : active
                        ? 'bg-slate-950 border-slate-850 text-slate-300'
                        : 'bg-slate-950/20 border-slate-950/50 text-slate-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${m.player === 'X' ? 'bg-blue-500' : 'bg-rose-500'}`} />
                    <span className="font-bold">Move {idx + 1}: Player {m.player}</span>
                  </div>
                  <span className="font-mono font-medium opacity-80">R{m.row} C{m.col}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t border-slate-850 pt-4 mt-6 text-center">
          <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Outcome Status</span>
          <span className={`inline-flex px-3 py-1 rounded-full text-xs font-black uppercase border tracking-wider ${
            winner === 'Draw'
              ? 'bg-slate-950 text-slate-400 border-slate-850'
              : winner === 'X'
                ? 'bg-blue-950 text-blue-400 border-blue-900'
                : 'bg-rose-950 text-rose-400 border-rose-900'
          }`}>
            {winner === 'Draw' ? 'Equilibrium (Draw)' : `Player ${winner} Triumphant`}
          </span>
        </div>
      </div>

    </div>
  );
}
