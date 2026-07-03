/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Users, Send, Smile, Plus, UserPlus, Sparkles, LogOut, ArrowRight, ShieldAlert, Wifi, Volume2, Gamepad2, VolumeX } from 'lucide-react';
import { OnlineRoom, ChatMessage, GameSettings } from '../types';
import { sfx } from '../lib/audio';

interface OnlineLobbyProps {
  userId: string;
  username: string;
  elo: number;
  avatar: string;
  onRoomStateUpdated: (roomState: OnlineRoom | null, myRole: 'X' | 'O' | 'spec' | null) => void;
  activeRoomState: OnlineRoom | null;
  myRole: 'X' | 'O' | 'spec' | null;
  onPlaceToken: (row: number, col: number) => void;
  onExitRoom: () => void;
}

export default function OnlineLobby({
  userId,
  username,
  elo,
  avatar,
  onRoomStateUpdated,
  activeRoomState,
  myRole,
  onPlaceToken,
  onExitRoom
}: OnlineLobbyProps) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [queueing, setQueueing] = useState<boolean>(false);
  const [roomCodeInput, setRoomCodeInput] = useState<string>('');
  
  // Custom Room Settings form
  const [customSize, setCustomSize] = useState<number>(3);
  const [customWin, setCustomWin] = useState<number>(3);
  const [customMode, setCustomMode] = useState<string>('classic');

  const [chatMessage, setChatMessage] = useState<string>('');
  const [floatingEmojis, setFloatingEmojis] = useState<Array<{ id: number; emoji: string; x: number }>>([]);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize unified WebSockets connect
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const socketUrl = `${protocol}//${window.location.host}`;
    const socket = new WebSocket(socketUrl);

    socket.onopen = () => {
      setWsConnected(true);
      setWs(socket);
      // Join lobby protocol
      socket.send(JSON.stringify({
        type: 'join_lobby',
        payload: { userId, username, elo, avatar }
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { type, payload } = data;

        switch (type) {
          case 'matchmake_queued':
            setQueueing(true);
            break;
          case 'matchmake_cancelled':
            setQueueing(false);
            break;
          case 'match_found':
            sfx.playVictory();
            setQueueing(false);
            // Request room details
            socket.send(JSON.stringify({
              type: 'join_room',
              payload: { roomId: payload.roomId, userId, username, elo, avatar }
            }));
            break;
          case 'room_created':
          case 'room_updated': {
            const role = payload.role || (payload.roomState.players.X?.name === username ? 'X' : payload.roomState.players.O?.name === username ? 'O' : 'spec');
            onRoomStateUpdated(payload.roomState, role);
            break;
          }
          case 'chat_broadcast': {
            if (activeRoomState) {
              const updatedChat = [...activeRoomState.chat, payload];
              onRoomStateUpdated({ ...activeRoomState, chat: updatedChat }, myRole);
            }
            break;
          }
          case 'emoji_broadcast': {
            triggerFloatingEmoji(payload.emoji);
            break;
          }
          case 'opponent_disconnected': {
            // Display alert/chat logs
            sfx.playDefeat();
            break;
          }
          case 'error': {
            alert(payload.message || 'Multiplayer lobby connection error');
            break;
          }
        }
      } catch (e) {
        console.error('WS client parse error:', e);
      }
    };

    socket.onclose = () => {
      setWsConnected(false);
      setWs(null);
    };

    return () => {
      socket.close();
    };
  }, [userId, activeRoomState, myRole]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeRoomState?.chat]);

  const handleStartMatchmaking = () => {
    if (!ws || !wsConnected) return;
    sfx.playClick();
    ws.send(JSON.stringify({
      type: 'matchmake',
      payload: { userId, username, elo, avatar }
    }));
  };

  const handleCancelMatchmaking = () => {
    if (!ws) return;
    sfx.playClick();
    ws.send(JSON.stringify({
      type: 'cancel_matchmake',
      payload: { userId }
    }));
  };

  const handleCreateRoom = () => {
    if (!ws) return;
    sfx.playClick();
    ws.send(JSON.stringify({
      type: 'create_room',
      payload: {
        userId,
        username,
        elo,
        avatar,
        settings: { size: customSize, winCondition: customWin, mode: customMode }
      }
    }));
  };

  const handleJoinRoom = () => {
    if (!ws || !roomCodeInput.trim()) return;
    sfx.playClick();
    ws.send(JSON.stringify({
      type: 'join_room',
      payload: {
        roomId: roomCodeInput.trim(),
        userId,
        username,
        elo,
        avatar
      }
    }));
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ws || !chatMessage.trim() || !activeRoomState) return;
    sfx.playClick();
    ws.send(JSON.stringify({
      type: 'chat_message',
      payload: {
        roomId: activeRoomState.id,
        senderId: userId,
        senderName: username,
        text: chatMessage.trim()
      }
    }));
    setChatMessage('');
  };

  const triggerFloatingEmoji = (emoji: string) => {
    const id = Date.now() + Math.random();
    const x = Math.random() * 80 + 10; // offset inside chat panel
    setFloatingEmojis(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setFloatingEmojis(prev => prev.filter(e => e.id !== id));
    }, 2000);
  };

  const handleSendEmoji = (emoji: string) => {
    if (!ws || !activeRoomState) return;
    sfx.playClick();
    ws.send(JSON.stringify({
      type: 'emoji_trigger',
      payload: {
        roomId: activeRoomState.id,
        userId,
        emoji
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto">
      
      <AnimatePresence mode="wait">
        {!activeRoomState ? (
          
          /* Screen A: Lobbing / Queue options */
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            
            {/* Box 1: Quick Match Matchmaking */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-950/60 rounded-xl border border-indigo-800/40">
                      <Gamepad2 className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-100 text-sm uppercase tracking-wider">Casual Matchmaking</h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Standard 3x3 Arena</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Wifi className={`w-3.5 h-3.5 ${wsConnected ? 'text-emerald-400' : 'text-slate-600 animate-pulse'}`} />
                    <span>{wsConnected ? 'Connected' : 'Offline'}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  Queue up to match against other online players worldwide. This mode is competitive and adjusts your Elo rating.
                </p>
              </div>

              <div className="pt-4 text-center">
                {queueing ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center justify-center py-4 gap-2">
                      <div className="relative">
                        <div className="w-10 h-10 border-4 border-indigo-900/30 border-t-indigo-400 rounded-full animate-spin" />
                        <Users className="w-4 h-4 text-indigo-400 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                      </div>
                      <p className="text-xs text-indigo-300 font-bold animate-pulse">Searching for rivals...</p>
                    </div>
                    <button
                      onClick={handleCancelMatchmaking}
                      className="px-6 py-2 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-bold text-xs rounded-lg transition-colors border border-rose-900/30"
                    >
                      Cancel Search
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleStartMatchmaking}
                    disabled={!wsConnected}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center justify-center gap-2"
                  >
                    <span>Quick Match Ranked</span>
                  </button>
                )}
              </div>
            </div>

            {/* Box 2: Private Custom Rooms creation */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3">
                <Plus className="w-5 h-5 text-indigo-400" />
                <h3 className="font-black text-slate-100 text-sm uppercase tracking-wider">Custom Combat Chamber</h3>
              </div>

              {/* Form Custom Rules */}
              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Arena Grid Size</label>
                  <select
                    value={customSize}
                    onChange={(e) => {
                      const s = parseInt(e.target.value);
                      setCustomSize(s);
                      if (customWin > s) setCustomWin(s);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                  >
                    {[3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>{s}x{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Win Length</label>
                  <select
                    value={customWin}
                    onChange={(e) => setCustomWin(parseInt(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs"
                  >
                    {Array.from({ length: customSize - 1 }, (_, i) => i + 2).map(c => (
                      <option key={c} value={c}>{c} in a row</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Gameplay Mode</label>
                <select
                  value={customMode}
                  onChange={(e) => setCustomMode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 py-1.5 px-2.5 rounded-lg text-xs capitalize"
                >
                  {['classic', 'bomb', 'frozen', 'fog', 'gravity'].map(m => (
                    <option key={m} value={m}>{m} Mode</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleCreateRoom}
                disabled={!wsConnected}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 font-black text-xs rounded-lg transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4 text-indigo-400" />
                <span>Establish Arena</span>
              </button>

              {/* Join via code inputs */}
              <div className="border-t border-slate-800/80 pt-4 mt-2 space-y-2">
                <label className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Join via Arena Code</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. room-abcd"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleJoinRoom}
                    disabled={!roomCodeInput.trim() || !wsConnected}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/40 text-white rounded-lg transition-colors"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        ) : (
          
          /* Screen B: Active Private Lobby, Chatting and Game sync elements */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            
            {/* Arena Board column and details */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-wide">Multiplayer Arena Code</h3>
                  <span className="text-lg font-mono font-black text-slate-100 tracking-wider bg-slate-950 px-3.5 py-1 rounded-lg border border-slate-800 inline-block mt-1">
                    {activeRoomState.id}
                  </span>
                </div>
                
                <button
                  onClick={onExitRoom}
                  className="px-3.5 py-2 bg-rose-950/20 hover:bg-rose-900/30 text-rose-300 font-bold text-xs rounded-lg transition-colors border border-rose-900/30 flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Exit Arena</span>
                </button>
              </div>

              {/* Lobby Players and rating stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex flex-col items-center text-center">
                  <span className="text-[9px] text-blue-400 font-black uppercase tracking-wider">Player X</span>
                  <div className="font-black text-sm text-slate-100 mt-1">{activeRoomState.players.X?.name || 'Searching...'}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">{activeRoomState.players.X?.elo} ELO</div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850/80 flex flex-col items-center text-center">
                  <span className="text-[9px] text-rose-400 font-black uppercase tracking-wider">Player O</span>
                  <div className="font-black text-sm text-slate-100 mt-1">{activeRoomState.players.O?.name || 'Searching...'}</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">{activeRoomState.players.O?.elo} ELO</div>
                </div>
              </div>
            </div>

            {/* Chat and Emoji board */}
            <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-800 shadow-xl flex flex-col h-full justify-between min-h-[400px] relative overflow-hidden">
              
              {/* Floating Emojis elements */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {floatingEmojis.map((e) => (
                  <motion.div
                    key={e.id}
                    initial={{ y: 350, opacity: 1, scale: 0.8 }}
                    animate={{ y: -50, opacity: 0, scale: 1.5 }}
                    transition={{ duration: 2, ease: 'easeOut' }}
                    style={{ left: `${e.x}%` }}
                    className="absolute text-3xl"
                  >
                    {e.emoji}
                  </motion.div>
                ))}
              </div>

              <div className="space-y-4 flex-1 flex flex-col justify-between">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="font-black text-slate-200 text-xs uppercase tracking-wide">Chamber Chat</span>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 overflow-y-auto max-h-72 space-y-2 pr-1 my-2 min-h-[180px]">
                  {activeRoomState.chat.map((msg: ChatMessage) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-xl text-xs ${
                        msg.isSystem
                          ? 'bg-slate-950/40 text-violet-300 font-bold border border-violet-950 text-center text-[10px]'
                          : msg.senderId === userId
                            ? 'bg-indigo-950/30 text-indigo-200 border border-indigo-900/40 ml-4'
                            : 'bg-slate-950 text-slate-300 border border-slate-900 mr-4'
                      }`}
                    >
                      {!msg.isSystem && (
                        <div className="font-black text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{msg.senderName}</div>
                      )}
                      <div>{msg.text}</div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
              </div>

              {/* Chat Input form */}
              <div className="space-y-3.5 pt-3 border-t border-slate-800/80">
                
                {/* Emoji tap choices */}
                <div className="flex justify-between px-1">
                  {['😂', '😮', '🔥', '👍', '🧠', '👑'].map((em) => (
                    <button
                      key={em}
                      onClick={() => handleSendEmoji(em)}
                      className="hover:scale-125 transition-transform text-lg"
                    >
                      {em}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter chat message..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-850 text-slate-200 rounded-lg text-xs py-2 px-3 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
