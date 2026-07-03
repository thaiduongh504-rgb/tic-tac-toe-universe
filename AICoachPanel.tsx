/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Star, BarChart3, HelpCircle, AlertTriangle, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';
import { CoachAnalysis, Move } from '../types';

interface AICoachPanelProps {
  history: Move[];
  boardSize: number;
  winCondition: number;
  mode: string;
  winner: string;
  onClose?: () => void;
}

export default function AICoachPanel({
  history,
  boardSize,
  winCondition,
  mode,
  winner,
  onClose
}: AICoachPanelProps) {
  const [analysis, setAnalysis] = useState<CoachAnalysis | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCoachAnalysis() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/coach/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            history,
            size: boardSize,
            winCondition,
            mode,
            winner
          })
        });
        if (!response.ok) {
          throw new Error('Failed to retrieve grandmaster analysis');
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message || 'Error parsing coach evaluations.');
      } finally {
        setLoading(false);
      }
    }

    if (history.length > 0) {
      fetchCoachAnalysis();
    }
  }, [history, boardSize, winCondition, mode, winner]);

  // Fallback simple rendering of markdown text
  const renderMarkdown = (text: string) => {
    if (!text) return null;
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('###')) {
        return <h3 key={idx} className="text-base font-bold text-slate-100 mt-4 mb-2">{line.replace('###', '').trim()}</h3>;
      }
      if (line.startsWith('##')) {
        return <h2 key={idx} className="text-lg font-black text-violet-300 mt-5 mb-2.5 border-b border-violet-900/30 pb-1">{line.replace('##', '').trim()}</h2>;
      }
      if (line.startsWith('* **')) {
        const cleaned = line.replace('* **', '').split('**:');
        return (
          <div key={idx} className="flex items-start gap-2 text-sm text-slate-300 my-1">
            <span className="text-violet-400 font-bold">{cleaned[0]}:</span>
            <span>{cleaned[1]}</span>
          </div>
        );
      }
      if (line.startsWith('-') || line.startsWith('*')) {
        return <li key={idx} className="text-sm text-slate-300 ml-4 list-disc my-1">{line.substring(1).trim()}</li>;
      }
      return <p key={idx} className="text-sm text-slate-300 my-1.5 leading-relaxed">{line}</p>;
    });
  };

  return (
    <div className="w-full bg-slate-900/40 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl mt-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-950/60 rounded-xl border border-violet-800/50">
            <BrainCircuit className="w-5 h-5 text-violet-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
              AI Coach Feedback
              <span className="bg-violet-900/50 text-violet-300 border border-violet-800/60 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                Pro
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 font-medium">Grandmaster Tactical Evaluation Engine</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-xs text-slate-400 hover:text-slate-200">
            Dismiss
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-10 gap-3"
          >
            <div className="relative">
              <div className="w-10 h-10 border-4 border-violet-900/30 border-t-violet-400 rounded-full animate-spin" />
              <Sparkles className="w-4 h-4 text-amber-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            </div>
            <p className="text-xs text-slate-400 font-bold animate-pulse">Analyzing position sequences...</p>
          </motion.div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0 }}
            className="p-4 bg-rose-950/20 border border-rose-900/50 rounded-xl flex gap-3 text-rose-300 text-xs"
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            <div>
              <p className="font-bold">Coach is currently offline</p>
              <p className="opacity-80 mt-1">{error}</p>
            </div>
          </motion.div>
        ) : analysis ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Accuracy</span>
                <span className={`text-2xl font-black mt-1 ${
                  analysis.accuracy >= 85 ? 'text-emerald-400' : analysis.accuracy >= 70 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {analysis.accuracy}%
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Mistakes</span>
                <span className={`text-2xl font-black mt-1 ${analysis.mistakes > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  {analysis.mistakes}
                </span>
              </div>
              <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col items-center">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider">Blunders</span>
                <span className={`text-2xl font-black mt-1 ${analysis.blunders > 0 ? 'text-rose-500 font-black animate-pulse' : 'text-slate-400'}`}>
                  {analysis.blunders}
                </span>
              </div>
            </div>

            {/* Win Probability Graph */}
            {analysis.winProbability && analysis.winProbability.length > 0 && (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/60">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="text-slate-300 font-bold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5 text-violet-400" />
                    X Win Probability Timeline
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">{analysis.winProbability.length} Turns Analyzed</span>
                </div>
                
                {/* Visual Bar chart overlay */}
                <div className="flex items-end h-20 gap-1.5 border-b border-slate-800 pb-1 px-1">
                  {analysis.winProbability.map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-1 bg-slate-900 border border-slate-800 text-[9px] text-slate-200 px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap">
                        Turn {idx+1}: {Math.round(val)}%
                      </div>
                      <div 
                        style={{ height: `${val}%` }} 
                        className={`w-full rounded-t transition-all duration-500 ${
                          val >= 60 ? 'bg-blue-500 group-hover:bg-blue-400' : val <= 40 ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-slate-500 group-hover:bg-slate-400'
                        }`}
                      />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 mt-1.5">
                  <span>Start Match</span>
                  <span>End Match</span>
                </div>
              </div>
            )}

            {/* Best Move Recommendations */}
            {analysis.bestMoves && analysis.bestMoves.length > 0 && (
              <div className="bg-slate-950/30 p-3.5 rounded-xl border border-slate-800/50">
                <h4 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Key Move Recommendations
                </h4>
                <div className="space-y-1.5">
                  {analysis.bestMoves.map((rec, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Markdown Commentary Report */}
            <div className="prose prose-invert max-w-none text-xs border-t border-slate-800/80 pt-4">
              {renderMarkdown(analysis.summary)}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
