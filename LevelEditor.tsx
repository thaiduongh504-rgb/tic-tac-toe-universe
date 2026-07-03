/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Map, Hammer, Plus, Play, Save, Trash, Globe, Heart, ChevronRight, Check } from 'lucide-react';
import { CustomLevel, SpecialCell, BoardSize } from '../types';
import { sfx } from '../lib/audio';

interface LevelEditorProps {
  onPlayLevel: (level: CustomLevel) => void;
  username: string;
}

type ToolType = 'wall' | 'bomb' | 'frozen' | 'locked' | 'clear';

export default function LevelEditor({ onPlayLevel, username }: LevelEditorProps) {
  const [size, setSize] = useState<number>(5);
  const [winCondition, setWinCondition] = useState<number>(4);
  const [title, setTitle] = useState<string>('');
  const [creator, setCreator] = useState<string>(username || 'Creator');
  const [selectedTool, setSelectedTool] = useState<ToolType>('wall');
  
  // Grid layout
  const [specialCells, setSpecialCells] = useState<SpecialCell[]>([]);
  const [communityLevels, setCommunityLevels] = useState<CustomLevel[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Fetch community levels
  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/levels');
      if (res.ok) {
        const data = await res.json();
        setCommunityLevels(data);
      }
    } catch (e) {
      console.error('Error fetching levels:', e);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  const handleCellClick = (row: number, col: number) => {
    sfx.playClick();
    if (selectedTool === 'clear') {
      setSpecialCells(specialCells.filter(c => !(c.row === row && c.col === col)));
    } else {
      // Remove any existing setting for this cell first
      const cleared = specialCells.filter(c => !(c.row === row && c.col === col));
      setSpecialCells([...cleared, { row, col, type: selectedTool as any }]);
    }
  };

  const getCellSpecialType = (row: number, col: number) => {
    return specialCells.find(c => c.row === row && c.col === col)?.type;
  };

  const handleReset = () => {
    sfx.playPlaceO();
    setSpecialCells([]);
    setTitle('');
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    setSuccessMsg(null);
    try {
      const res = await fetch('/api/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          creator: creator || 'Anonymous Designer',
          size,
          winCondition,
          specialCells,
          board: Array(size).fill(null).map(() => Array(size).fill(null))
        })
      });

      if (res.ok) {
        sfx.playVictory();
        setTitle('');
        setSpecialCells([]);
        setSuccessMsg('Your custom level was successfully published to the Universe!');
        fetchLevels();
        setTimeout(() => setSuccessMsg(null), 5000);
      }
    } catch (e) {
      console.error('Publish error:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLikeLevel = async (levelId: string) => {
    sfx.playPlaceX();
    try {
      const res = await fetch(`/api/levels/${levelId}/like`, { method: 'POST' });
      if (res.ok) {
        setCommunityLevels(communityLevels.map(l => {
          if (l.id === levelId) return { ...l, likes: l.likes + 1 };
          return l;
        }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const gridTemplateCols = {
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
    7: 'grid-cols-7',
    8: 'grid-cols-8'
  }[size] || 'grid-cols-5';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Upper Designer section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Editor Workbench Grid */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Hammer className="w-5 h-5 text-indigo-400" />
            <h2 className="font-black text-slate-100 text-sm uppercase tracking-wider">Level Designer Workbench</h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Board Size ({size}x{size})</label>
              <select
                value={size}
                onChange={(e) => {
                  const s = parseInt(e.target.value);
                  setSize(s);
                  // Ensure win condition doesn't exceed board size
                  if (winCondition > s) setWinCondition(s);
                  setSpecialCells([]);
                }}
                className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
              >
                {[3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}x{s}</option>)}
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Win Condition</label>
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

          {/* Designer toolset selections */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Select Tool Block</span>
            <div className="grid grid-cols-5 gap-1.5">
              {(['wall', 'bomb', 'frozen', 'locked', 'clear'] as ToolType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedTool(t)}
                  className={`
                    py-2 rounded-lg text-[10px] font-black uppercase border transition-all text-center flex flex-col items-center justify-center gap-1
                    ${selectedTool === t
                      ? 'bg-indigo-950 text-indigo-300 border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]'
                      : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:border-slate-700'
                    }
                  `}
                >
                  <span className={`w-2.5 h-2.5 rounded-sm ${
                    t === 'wall' ? 'bg-rose-500' :
                    t === 'bomb' ? 'bg-amber-500' :
                    t === 'frozen' ? 'bg-sky-400' :
                    t === 'locked' ? 'bg-slate-500' : 'bg-transparent border border-dashed border-slate-600'
                  }`} />
                  <span>{t}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Interactive grid */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 flex items-center justify-center">
            <div className={`grid ${gridTemplateCols} gap-2 w-full max-w-xs aspect-square`}>
              {Array(size).fill(null).map((_, r) => (
                <React.Fragment key={r}>
                  {Array(size).fill(null).map((_, c) => {
                    const cellType = getCellSpecialType(r, c);
                    return (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleCellClick(r, c)}
                        className={`
                          aspect-square rounded-lg border transition-all flex items-center justify-center relative
                          ${cellType === 'wall' ? 'bg-rose-950/40 border-rose-600' :
                            cellType === 'bomb' ? 'bg-amber-950/40 border-amber-500' :
                            cellType === 'frozen' ? 'bg-sky-950/40 border-sky-400' :
                            cellType === 'locked' ? 'bg-slate-900 border-slate-500' :
                            'bg-slate-900/40 border-slate-800/60 hover:bg-slate-800/40'
                          }
                        `}
                      >
                        {cellType && (
                          <span className="text-[8px] font-black uppercase text-slate-300 pointer-events-none">
                            {cellType[0]}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-500 text-center leading-relaxed font-medium">
            💡 Click on grid cells above to draw obstacles. When finished, fill out details below to publish your creations.
          </p>
        </div>

        {/* Publish / Test form */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Globe className="w-5 h-5 text-indigo-400" />
              <h2 className="font-black text-slate-100 text-sm uppercase tracking-wider">Publish Map Details</h2>
            </div>

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Level Name</label>
                <input
                  type="text"
                  placeholder="e.g. Spiral of Silence"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Creator Tag</label>
                <input
                  type="text"
                  value={creator}
                  onChange={(e) => setCreator(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-400 rounded-lg text-xs py-2 px-3 focus:outline-none cursor-not-allowed"
                  disabled
                />
              </div>

              <AnimatePresence>
                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="p-3 bg-emerald-950/20 border border-emerald-900/50 rounded-lg flex gap-2 text-emerald-400 text-xs"
                  >
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg transition-colors border border-slate-700"
                >
                  Reset Map
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !title.trim()}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] flex items-center justify-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Publishing...' : 'Publish World'}</span>
                </button>
              </div>
            </form>
          </div>

          <div className="border-t border-slate-800/80 pt-4 mt-6">
            <button
              type="button"
              onClick={() => onPlayLevel({
                id: 'local-test',
                title: title || 'Custom Arena Test',
                creator: creator || 'Designer',
                size,
                winCondition,
                board: Array(size).fill(null).map(() => Array(size).fill(null)),
                specialCells,
                likes: 0,
                plays: 0,
                createdAt: new Date().toISOString()
              })}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] flex items-center justify-center gap-1.5"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Test Map Layout (vs AI)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Community levels list */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Globe className="w-5 h-5 text-indigo-400" />
          <h2 className="font-black text-slate-100 text-sm uppercase tracking-wider">Shared Community Map Universes</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-96 overflow-y-auto pr-1">
          {communityLevels.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-slate-500 text-xs font-bold">
              No shared custom arenas discovered yet. Be the first to build!
            </div>
          ) : (
            communityLevels.map((lvl) => (
              <div
                key={lvl.id}
                className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/60 hover:border-slate-700/80 transition-all flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1">
                  <h3 className="text-xs font-black text-slate-200 group-hover:text-indigo-400 transition-colors uppercase tracking-wide">
                    {lvl.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold">
                    <span>by <strong className="text-slate-300 font-medium">{lvl.creator}</strong></span>
                    <span className="w-1 h-1 rounded-full bg-slate-700" />
                    <span>Size: {lvl.size}x{lvl.size} ({lvl.winCondition} in a row)</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleLikeLevel(lvl.id)}
                    className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-rose-500 font-bold px-2 py-1 bg-slate-900 rounded-lg border border-slate-800"
                  >
                    <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                    <span>{lvl.likes}</span>
                  </button>

                  <button
                    onClick={async () => {
                      sfx.playVictory();
                      try {
                        await fetch(`/api/levels/${lvl.id}/play`, { method: 'POST' });
                      } catch (e) {}
                      onPlayLevel(lvl);
                    }}
                    className="p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
