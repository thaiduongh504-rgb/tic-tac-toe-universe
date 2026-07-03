/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Award, Zap, Flame, ShieldAlert, CheckCircle2, UserCheck, Star, Users } from 'lucide-react';
import { Achievement, DailyMission, GlobalLeaderboardEntry } from '../types';
import { sfx } from '../lib/audio';

interface LeaderboardAchievementsProps {
  achievements: Achievement[];
  dailyMissions: DailyMission[];
  currentElo: number;
}

export default function LeaderboardAchievements({
  achievements,
  dailyMissions,
  currentElo
}: LeaderboardAchievementsProps) {
  const [leaderboard, setLeaderboard] = useState<GlobalLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const res = await fetch('/api/leaderboard');
        if (res.ok) {
          const data = await res.json();
          setLeaderboard(data);
        }
      } catch (e) {
        console.error('Leaderboard fetch error:', e);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, []);

  // Determine League badge details depending on Elo level
  const getLeagueDetails = (elo: number) => {
    if (elo >= 2500) return { name: 'Grandmaster', style: 'text-violet-400 drop-shadow-[0_0_10px_rgba(139,92,246,0.6)]', bg: 'bg-violet-950/40 border-violet-800' };
    if (elo >= 1800) return { name: 'Master', style: 'text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]', bg: 'bg-amber-950/40 border-amber-800' };
    if (elo >= 1400) return { name: 'Platinum', style: 'text-teal-400 drop-shadow-[0_0_8px_rgba(45,212,191,0.5)]', bg: 'bg-teal-950/40 border-teal-800' };
    if (elo >= 1100) return { name: 'Gold', style: 'text-yellow-400', bg: 'bg-yellow-950/30 border-yellow-900/60' };
    if (elo >= 800) return { name: 'Silver', style: 'text-slate-300', bg: 'bg-slate-900/40 border-slate-800' };
    return { name: 'Bronze', style: 'text-amber-600', bg: 'bg-amber-950/20 border-amber-900/40' };
  };

  const league = getLeagueDetails(currentElo);

  return (
    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      
      {/* Side 1: Profile League & Daily Quests */}
      <div className="space-y-6">
        
        {/* League badge Card */}
        <div className={`p-5 rounded-2xl border backdrop-blur-xl flex flex-col items-center text-center ${league.bg} shadow-lg`}>
          <div className="p-4 bg-slate-950/80 rounded-full border border-slate-800 relative mb-3">
            <Trophy className={`w-8 h-8 ${league.style}`} />
            <span className="absolute bottom-0 right-0 bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase">
              League
            </span>
          </div>
          <h3 className={`text-lg font-black uppercase tracking-wider ${league.style}`}>{league.name}</h3>
          <p className="text-slate-400 text-xs font-bold mt-1">Current Rating: <strong className="text-slate-200">{currentElo} ELO</strong></p>
        </div>

        {/* Daily Quests/Missions */}
        <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Zap className="w-4 h-4 text-yellow-400" />
            <h3 className="font-black text-slate-100 text-xs uppercase tracking-wider">Daily Mission Protocols</h3>
          </div>

          <div className="space-y-3">
            {dailyMissions.map((m) => (
              <div key={m.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850/80 space-y-2">
                <div className="flex items-start justify-between gap-3 text-xs">
                  <span className="text-slate-300 font-bold leading-normal">{m.description}</span>
                  {m.completed ? (
                    <span className="text-[9px] bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex-shrink-0">
                      Done
                    </span>
                  ) : (
                    <span className="text-[9px] bg-yellow-950/40 text-yellow-400 border border-yellow-900/50 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold flex-shrink-0">
                      +{m.rewardElo} ELO
                    </span>
                  )}
                </div>

                <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-850">
                  <div
                    style={{ width: `${Math.min(100, (m.current / m.target) * 100)}%` }}
                    className={`h-full transition-all duration-500 ${m.completed ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                  />
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                  <span>Progress</span>
                  <span>{m.current} / {m.target}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Main 2: Global Leaderboards */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Trophy className="w-5 h-5 text-indigo-400" />
          <h2 className="font-black text-slate-100 text-sm uppercase tracking-wider">Universe Rankings</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-3 border-indigo-900/30 border-t-indigo-400 rounded-full animate-spin" />
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold">Summoning grandmasters...</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {leaderboard.map((entry, idx) => {
              const rankColor = idx === 0 ? 'text-yellow-400 bg-yellow-950/30 border-yellow-800' :
                                idx === 1 ? 'text-slate-300 bg-slate-900/50 border-slate-700' :
                                idx === 2 ? 'text-amber-600 bg-amber-950/30 border-amber-900/50' :
                                'text-slate-500 bg-slate-950 border-slate-900';

              return (
                <div
                  key={entry.username}
                  className="bg-slate-950 p-2.5 rounded-xl border border-slate-850/60 hover:border-slate-800 transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center border ${rankColor}`}>
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-black text-slate-200">{entry.username}</div>
                      <div className="text-[10px] text-slate-500 font-bold">Wins: {entry.wins} / Losses: {entry.losses}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-black text-indigo-400">{entry.elo} ELO</div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase font-black">{idx < 3 ? 'Challenger' : 'Diamond'}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Main 3: Achievements List */}
      <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Award className="w-5 h-5 text-indigo-400" />
          <h2 className="font-black text-slate-100 text-sm uppercase tracking-wider">Achievements & Badges</h2>
        </div>

        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-3 rounded-xl border transition-all ${
                ach.unlocked 
                  ? 'bg-violet-950/20 border-violet-900/50 text-violet-300' 
                  : 'bg-slate-950 border-slate-850 text-slate-500'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <div className={`p-1.5 rounded-lg border mt-0.5 ${
                  ach.unlocked ? 'bg-violet-950 border-violet-800' : 'bg-slate-900 border-slate-800'
                }`}>
                  <Star className={`w-3.5 h-3.5 ${ach.unlocked ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}`} />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className={`text-xs font-black uppercase tracking-wide ${ach.unlocked ? 'text-slate-200' : 'text-slate-500'}`}>
                    {ach.title}
                  </h4>
                  <p className="text-[10px] leading-relaxed text-slate-400">{ach.description}</p>
                  
                  {/* Progressive Bar */}
                  {!ach.unlocked && ach.target > 1 && (
                    <div className="space-y-1 pt-1">
                      <div className="w-full bg-slate-900 h-1 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${(ach.progress / ach.target) * 100}%` }}
                          className="bg-indigo-500 h-full"
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>Progress</span>
                        <span>{ach.progress} / {ach.target}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
