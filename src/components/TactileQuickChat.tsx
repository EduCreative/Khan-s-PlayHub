import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { QuickChat, UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { Send, MessageSquare, Zap, X, Wifi, WifiOff, Minimize2, Bot, Globe } from 'lucide-react';

interface TactileQuickChatProps {
  userProfile: UserProfile;
  isDarkMode: boolean;
}

const PRESET_EMOJIS = [
  "🧠", "🎮", "⚡", "🏆", "🔥", "🎯", "👑", "🚀", "👍", "🙌"
];

const SIMULATED_BOTS = [
  { username: 'STEALTH_VIPER', avatar: 'fa-user-ninja' },
  { username: 'PRO_GAMER_99', avatar: 'fa-gamepad' },
  { username: 'NEON_HISS', avatar: 'fa-skull' },
  { username: 'CHIP_CHAMP', avatar: 'fa-microchip' },
  { username: 'CRIMSON_FANG', avatar: 'fa-crown' },
  { username: 'COSMIC_RUNNER', avatar: 'fa-rocket' },
  { username: 'PIXEL_HEART', avatar: 'fa-heart' }
];

const BOT_PHRASES = [
  "Anyone playing Snake Arena on Hard mode? It's intense! 🐍",
  "Just smashed my personal best! Let's go! 🚀",
  "The neon theme in this hub is absolutely legendary. 🔥",
  "Those crimson stalkers in Snake are no joke, they literally chase your coordinates down!",
  "Who has the crown on the Leaderboard right now? 👑",
  "If you find the golden dot, grab it! It gives invincibility! ✨",
  "Loving the sound effects on this platform. Perfect retro vibe! 🎮",
  "Make sure to try the Labyrinth as well, super clean controls! 🧩",
  "Did everyone see the new powerups update in Snake Arena?",
  "That green speed boost is crazy fast! ⚡",
  "Who's up for a challenge score duel? Send the invite link! 🛰️",
  "Nice run on the game hub! 🙌",
  "Unlocking achievements feels so satisfying here. 🏆",
  "Is it just me, or are the cyberpunk soundscapes super cozy? 🎧"
];

const BOT_REPLIES_MAP = [
  { 
    keywords: ['hello', 'hi', 'hey', 'yo', 'welcome'], 
    replies: ["Yo! Welcome to the hub! 👋", "Hey there! Ready for some games? 🎮", "Welcome to the neon grid! ⚡", "What's up! Let's smash some high scores!"] 
  },
  { 
    keywords: ['snake', 'arena', 'slither', 'adversaries'], 
    replies: ["Snake Arena got so competitive with the hunter bots!", "Try hard difficulty if you dare, 4 crimson stalkers target you directly! 🐍", "A speed boost + invincibility combo is unstoppable! 🔥"] 
  },
  { 
    keywords: ['boost', 'speed', 'green'], 
    replies: ["Speed boost locks your length so you don't shrink while boosting! ⚡", "Super useful for trapping other snakes!", "That neon green dot is beautiful."] 
  },
  { 
    keywords: ['invincible', 'gold', 'yellow'], 
    replies: ["Invincibility gives you that awesome golden orbits shield! 🌟", "You can head-on crash other bots without dying!", "Golden yellow dot is a lifesaver!"] 
  },
  {
    keywords: ['🔥', '⚡', '🚀', '🧠', '👍', '🎮', '🏆', '🎯', '👑', '🙌'],
    replies: ["Hype! Let's go! 🔥", "⚡ Pure energy!", "🚀 To the moon!", "👍 Agreed!", "🎮 Game on!"]
  }
];

const BOT_GENERAL_REPLIES = [
  "Nice signal broadcast! 🙌",
  "That's high-tier play right there! 🏆",
  "Agreed! Khan's hub is the best! 🔥",
  "Let's see if anyone can beat that score! 👑",
  "Insane! ⚡",
  "Unstoppable! 🚀",
  "Awesome strategy! 🎯"
];

export const TactileQuickChat: React.FC<TactileQuickChatProps> = ({ userProfile, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<QuickChat[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Connection mode state ('simulated' utilizes dynamic local bots, 'online' syncs with Firestore backend)
  const [connectionMode, setConnectionMode] = useState<'simulated' | 'online'>(() => {
    try {
      const saved = localStorage.getItem('khans-playhub-chat-mode');
      return (saved as 'simulated' | 'online') || 'simulated';
    } catch {
      return 'simulated';
    }
  });
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const componentMountedTime = useRef<number>(Date.now());

  // Set up initial simulated preloaded chats so the chat is never empty on first open
  useEffect(() => {
    if (connectionMode === 'simulated') {
      try {
        const saved = localStorage.getItem('khans-playhub-sim-chats');
        if (saved) {
          setChats(JSON.parse(saved));
        } else {
          const initialMsgs: QuickChat[] = [
            {
              id: 'init-1',
              senderUid: 'bot-pro-gamer',
              senderUsername: 'PRO_GAMER_99',
              senderAvatar: 'fa-gamepad',
              message: "Yo, the new powerups in Snake Arena are so smooth! Speed boost green dot rules! ⚡",
              timestamp: Date.now() - 360000,
              type: 'preset'
            },
            {
              id: 'init-2',
              senderUid: 'bot-stealth-viper',
              senderUsername: 'STEALTH_VIPER',
              senderAvatar: 'fa-user-ninja',
              message: "Agreed! Crimson stalker bots are brutal on Hard difficulty though. 🐍",
              timestamp: Date.now() - 240000,
              type: 'custom'
            },
            {
              id: 'init-3',
              senderUid: 'bot-chip-champ',
              senderUsername: 'CHIP_CHAMP',
              senderAvatar: 'fa-microchip',
              message: "Who has the current crown on the Labyrinth Board? 👑",
              timestamp: Date.now() - 120000,
              type: 'custom'
            },
            {
              id: 'init-4',
              senderUid: 'bot-pixel-heart',
              senderUsername: 'PIXEL_HEART',
              senderAvatar: 'fa-heart',
              message: "Loving the new ambient soundscapes! Perfect retrowave. 🎹✨",
              timestamp: Date.now() - 30000,
              type: 'emoji'
            }
          ];
          setChats(initialMsgs);
          localStorage.setItem('khans-playhub-sim-chats', JSON.stringify(initialMsgs));
        }
      } catch {
        setChats([]);
      }
    }
  }, [connectionMode]);

  // Interval for periodic simulated bot chat messages to make the hub feel alive!
  useEffect(() => {
    const interval = setInterval(() => {
      if (connectionMode !== 'simulated') return;
      
      // 30% chance every 18 seconds to preserve attention
      if (Math.random() > 0.3) return;

      const randomBot = SIMULATED_BOTS[Math.floor(Math.random() * SIMULATED_BOTS.length)];
      const randomPhrase = BOT_PHRASES[Math.floor(Math.random() * BOT_PHRASES.length)];
      
      const newSimMsg: QuickChat = {
        id: `sim-${Date.now()}-${Math.random()}`,
        senderUid: `bot-${randomBot.username}`,
        senderUsername: randomBot.username,
        senderAvatar: randomBot.avatar,
        message: randomPhrase,
        timestamp: Date.now(),
        type: 'custom'
      };

      setChats(prev => {
        const next = [...prev, newSimMsg];
        const trimmed = next.slice(-35);
        localStorage.setItem('khans-playhub-sim-chats', JSON.stringify(trimmed));
        return trimmed;
      });

      // Show unread notification if drawer is closed
      if (!isOpen) {
        setUnreadCount(u => u + 1);
        audioService.playClick();
      }
    }, 18000);

    return () => clearInterval(interval);
  }, [connectionMode, isOpen]);

  // Custom listener for game events in the lobby channel
  useEffect(() => {
    const handleLobbyMessage = (event: Event) => {
      const customEvObj = event as CustomEvent;
      if (customEvObj?.detail) {
        const { sender, message, type } = customEvObj.detail;
        
        const newSysChat: QuickChat = {
          id: `sys-${Date.now()}-${Math.random()}`,
          senderUid: 'system',
          senderUsername: sender || '📢 SYSTEM',
          senderAvatar: 'fa-robot',
          message: message || '',
          timestamp: Date.now(),
          type: type || 'custom'
        };

        setChats(prev => {
          const next = [...prev, newSysChat];
          localStorage.setItem('khans-playhub-sim-chats', JSON.stringify(next.slice(-35)));
          return next.slice(-35);
        });

        if (!isOpen) {
          setUnreadCount(u => u + 1);
        }
        audioService.playClick();

        // High priority: trigger a random bot reaction after a system milestone
        if (message.includes('points') || message.includes('HighScore') || message.includes('Success') || message.includes('unlocked')) {
          setTimeout(() => {
            const bot = SIMULATED_BOTS[Math.floor(Math.random() * SIMULATED_BOTS.length)];
            const cheers = [
              "Whoa, absolutely legendary run! 👑",
              "That's high-tier play right there! 🙌",
              "Insane score, adding you to my favorites list! 🏆",
              "Congratulations! You crushed it! 🔥",
              "Gamer god level achieved! ⚡"
            ];
            const reactionMsg: QuickChat = {
              id: `sim-cheer-${Date.now()}-${Math.random()}`,
              senderUid: `bot-${bot.username}`,
              senderUsername: bot.username,
              senderAvatar: bot.avatar,
              message: cheers[Math.floor(Math.random() * cheers.length)],
              timestamp: Date.now(),
              type: 'preset'
            };

            setChats(prev => {
              const next = [...prev, reactionMsg];
              localStorage.setItem('khans-playhub-sim-chats', JSON.stringify(next.slice(-35)));
              return next.slice(-35);
            });

            if (!isOpen) {
              setUnreadCount(u => u + 1);
            }
            audioService.playClick();
          }, 1200);
        }
      }
    };

    window.addEventListener('lobby-broadcast', handleLobbyMessage);
    return () => window.removeEventListener('lobby-broadcast', handleLobbyMessage);
  }, [isOpen]);

  // Handle companion bot automatic responses
  const handleBotResponse = (userText: string) => {
    setTimeout(() => {
      const lower = userText.toLowerCase();
      let selectedReply = "";
      
      for (const group of BOT_REPLIES_MAP) {
        if (group.keywords.some(kw => lower.includes(kw))) {
          selectedReply = group.replies[Math.floor(Math.random() * group.replies.length)];
          break;
        }
      }
      
      if (!selectedReply) {
        selectedReply = BOT_GENERAL_REPLIES[Math.floor(Math.random() * BOT_GENERAL_REPLIES.length)];
      }

      const randomBot = SIMULATED_BOTS[Math.floor(Math.random() * SIMULATED_BOTS.length)];
      const newBotMsg: QuickChat = {
        id: `sim-resp-${Date.now()}-${Math.random()}`,
        senderUid: `bot-${randomBot.username}`,
        senderUsername: randomBot.username,
        senderAvatar: randomBot.avatar,
        message: selectedReply,
        timestamp: Date.now(),
        type: 'preset'
      };

      setChats(prev => {
        const next = [...prev, newBotMsg];
        localStorage.setItem('khans-playhub-sim-chats', JSON.stringify(next.slice(-35)));
        return next.slice(-35);
      });

      if (!isOpen) {
        setUnreadCount(u => u + 1);
      }
      audioService.playClick();
    }, 900 + Math.random() * 1100);
  };

  // Listen to Firestore Realtime Messages (Only in 'online' mode)
  useEffect(() => {
    if (connectionMode !== 'online') return;

    const q = query(
      collection(db, 'quickchats'),
      orderBy('timestamp', 'desc'),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: QuickChat[] = [];
      snapshot.forEach((doc) => {
        messages.push(doc.data() as QuickChat);
      });
      
      const chronological = messages.reverse();
      setChats(prev => {
        if (!isOpen && prev.length > 0 && chronological.length > prev.length) {
          const newCount = chronological.filter(m => !prev.some(p => p.id === m.id)).length;
          setUnreadCount(u => u + newCount);
        }
        return chronological;
      });
      setIsOffline(false);

      if (chronological.length > 0) {
        const latestMsg = chronological[chronological.length - 1];
        const isFromOtherUser = auth.currentUser ? latestMsg.senderUid !== auth.currentUser.uid : true;
        
        if (latestMsg.timestamp > componentMountedTime.current && isFromOtherUser) {
          audioService.playClick();
        }
      }
    }, (error) => {
      console.warn("Operating in local persistent cache mode", error);
      setIsOffline(true);
    });

    return () => unsubscribe();
  }, [isOpen, connectionMode]);

  // Handle message sending
  const sendQuickChat = async (text: string, type: 'preset' | 'emoji' | 'custom') => {
    if (!text.trim()) return;
    
    if (connectionMode === 'online') {
      if (!auth.currentUser) {
        alert("Please Sign In using Google first to broadcast chat signals on the Live Server, or switch to 'Cyber Mesh' mode to chat instantly for free as a guest!");
        return;
      }

      try {
        setIsSending(true);
        audioService.playNav();
        
        const chatRef = doc(collection(db, 'quickchats'));
        const newChat: QuickChat = {
          id: chatRef.id,
          senderUid: auth.currentUser.uid,
          senderUsername: userProfile.username || 'Anonymous Player',
          senderAvatar: userProfile.avatar || 'fa-user-astronaut',
          message: text.substring(0, 100),
          timestamp: Date.now(),
          type
        };

        await setDoc(chatRef, newChat);
        setCustomMessage('');
      } catch (error) {
        console.error("Local caching message dispatch error:", error);
        const fallbackChat: QuickChat = {
          id: `local-${Date.now()}`,
          senderUid: auth.currentUser?.uid || 'local',
          senderUsername: userProfile.username || 'You',
          senderAvatar: userProfile.avatar || 'fa-user-astronaut',
          message: text,
          timestamp: Date.now(),
          type
        };
        setChats(prev => [...prev.slice(1), fallbackChat]);
      } finally {
        setIsSending(false);
      }
    } else {
      // Free option: instant local delivery with zero latency
      setIsSending(true);
      audioService.playNav();

      const newSimChat: QuickChat = {
        id: `sim-user-${Date.now()}`,
        senderUid: auth.currentUser?.uid || 'guest-user',
        senderUsername: userProfile.username || 'Guest Player',
        senderAvatar: userProfile.avatar || 'fa-user-astronaut',
        message: text.substring(0, 100),
        timestamp: Date.now(),
        type
      };

      setChats(prev => {
        const next = [...prev, newSimChat];
        localStorage.setItem('khans-playhub-sim-chats', JSON.stringify(next.slice(-35)));
        return next.slice(-35);
      });

      setCustomMessage('');
      setIsSending(false);

      // Trigger realistic companion response with smart replies
      handleBotResponse(text);
    }
  };

  // Scroll to bottom when chats update or panel opens
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [chats, isOpen]);

  const toggleOpen = () => {
    audioService.playToggle(!isOpen);
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-[160] flex flex-col items-start font-sans">
      
      {/* Expanded Cyber Chat Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="w-[calc(100vw-3rem)] sm:w-[380px] h-[480px] bg-slate-950/95 dark:bg-slate-950/98 backdrop-blur-2xl border-2 border-indigo-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col overflow-hidden mb-4 relative animate-in fade-in zoom-in duration-150"
          >
            {/* Header */}
            <div className="p-5 border-b border-indigo-500/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/30 via-transparent to-transparent">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <Zap className="w-3.5 h-3.5 text-indigo-100 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic text-white tracking-wide">
                    Live Chat Console
                  </h3>
                </div>
                
                {/* Connection switcher button */}
                <div className="flex items-center gap-1.5 mt-2">
                  <button
                    onClick={() => {
                      const nextMode = connectionMode === 'simulated' ? 'online' : 'simulated';
                      setConnectionMode(nextMode);
                      localStorage.setItem('khans-playhub-chat-mode', nextMode);
                      audioService.playToggle(nextMode === 'online');
                    }}
                    className={`inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                      connectionMode === 'simulated'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                        : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 shadow-[0_0_10px_rgba(99,102,241,0.1)]'
                    }`}
                    title="Click to toggle Chat system (Free Simulated Chat vs Online Firebase Server)"
                  >
                    {connectionMode === 'simulated' ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        🤖 Cyber Mesh (Free fallback)
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                        🌐 Live Server
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Close / Minimize Button */}
              <button 
                onClick={toggleOpen}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Message Box */}
            <div className="flex-1 overflow-hidden flex flex-col p-4 bg-slate-900/30">
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 scrollbar-thin scrollbar-thumb-indigo-500/20"
              >
                {chats.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 p-6">
                    <MessageSquare className="w-8 h-8 opacity-20 mb-2 animate-bounce" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/50">No signals logged yet</p>
                    <p className="text-[9px] mt-1">Type a message or send an emoji to start chatting!</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -8, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="flex items-start gap-2.5"
                    >
                      {/* Tiny Tech Avatar Holder */}
                      <div className={`w-7 h-7 rounded-lg bg-indigo-500/10 border border-white/5 flex items-center justify-center shrink-0 ${
                        chat.senderUid === 'system' ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-indigo-400'
                      }`}>
                        <i className={`fas ${chat.senderAvatar || 'fa-user-astronaut'} text-[10px]`}></i>
                      </div>

                      {/* Bubble Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-[11px] font-extrabold italic truncate ${
                            chat.senderUid === 'system' ? 'text-rose-400' : 'text-slate-300'
                          }`}>
                            {chat.senderUsername}
                          </span>
                          <span className="text-[7px] font-bold text-slate-500 uppercase tabular-nums tracking-tighter shrink-0">
                            {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className={`mt-0.5 inline-block px-2.5 py-1 rounded-xl text-[11px] font-semibold border ${
                          chat.senderUid === 'system'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.1)]'
                            : chat.type === 'emoji' 
                            ? 'bg-amber-500/10 border-amber-500/10 text-base py-0.5'
                            : chat.type === 'preset'
                            ? 'bg-indigo-500/10 border-indigo-500/10 text-indigo-200'
                            : 'bg-white/5 border-white/5 text-slate-200'
                        }`}>
                          {chat.message}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Controls panel */}
            <div className="p-4 border-t border-indigo-500/10 bg-slate-950 flex flex-col gap-3.5">
              
              {/* Emojis Stream layout */}
              <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1 scrollbar-none">
                {PRESET_EMOJIS.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => sendQuickChat(emoji, 'emoji')}
                    disabled={isSending}
                    className="w-8 h-8 rounded-lg bg-white/5 hover:bg-indigo-600 hover:text-white transition-all text-sm flex items-center justify-center shrink-0 active:scale-90"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Custom Classic Box Input */}
              <div className="pt-2 border-t border-indigo-500/10">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendQuickChat(customMessage, 'custom');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    maxLength={40}
                    placeholder="[ > Enter custom burst... ]"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    disabled={isSending}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-white/10 text-[11px] font-medium text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !customMessage.trim()}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 text-[10px] font-extrabold uppercase tracking-widest gap-1"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </form>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Trigger Bubble (FAB) */}
      <motion.button
        onClick={toggleOpen}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className={`w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer relative transition-colors duration-200 border-2 border-indigo-400 group`}
      >
        <MessageSquare className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
        
        {/* Pulsing Neon Halo ring */}
        <span className="absolute inset-0 rounded-full border-2 border-indigo-500 animate-ping opacity-25 pointer-events-none" />

        {/* Unread Message Badge Indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-[10px] font-black italic rounded-full flex items-center justify-center border border-slate-900 animate-bounce">
            {unreadCount}
          </span>
        )}

        {/* Network status overlay mini-dot */}
        <span className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 flex items-center justify-center ${
          connectionMode === 'simulated' ? 'bg-emerald-500' : 'bg-indigo-500'
        }`} />
      </motion.button>

    </div>
  );
};
