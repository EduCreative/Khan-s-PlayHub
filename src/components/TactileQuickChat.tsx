import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { QuickChat, UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { Send, MessageSquare, Zap, Minimize2, Globe } from 'lucide-react';

interface TactileQuickChatProps {
  userProfile: UserProfile;
  isDarkMode: boolean;
}

const DEFAULT_EMOJIS = [
  "🧠", "🎮", "⚡", "🏆", "🔥", "🎯", "👑", "🚀", "👍", "🙌", "💖", "🎉", "🌟", "👾", "👀", "😎"
];

export const TactileQuickChat: React.FC<TactileQuickChatProps> = ({ userProfile, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [chats, setChats] = useState<QuickChat[]>([]);
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emojis, setEmojis] = useState<{ id: string, char: string }[]>([]);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const componentMountedTime = useRef<number>(Date.now());

  // Real-time listener for curated emojis from Firestore
  useEffect(() => {
    const q = query(collection(db, 'emojis'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbEmojis: { id: string, char: string }[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.char) {
          dbEmojis.push({ id: docSnap.id, char: data.char });
        }
      });
      if (dbEmojis.length > 0) {
        setEmojis(dbEmojis);
      } else {
        setEmojis(DEFAULT_EMOJIS.map((e, idx) => ({ id: `default-${idx}`, char: e })));
      }
    }, (error) => {
      console.warn("Operating with local default emojis fallback:", error);
      setEmojis(DEFAULT_EMOJIS.map((e, idx) => ({ id: `default-${idx}`, char: e })));
    });
    return () => unsubscribe();
  }, []);

  // System Custom listener for real-time live events (Milestones, Leaderboard updates)
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

        // Cache system notification in local state so it pops up in console
        setChats(prev => {
          const next = [...prev, newSysChat];
          return next.slice(-45);
        });

        if (!isOpen) {
          setUnreadCount(u => u + 1);
        }
        audioService.playClick();
      }
    };

    window.addEventListener('lobby-broadcast', handleLobbyMessage);
    return () => window.removeEventListener('lobby-broadcast', handleLobbyMessage);
  }, [isOpen]);

  // Listen to Firestore Realtime Messages (Strictly Online Live Server for absolute authenticity)
  useEffect(() => {
    const q = query(
      collection(db, 'quickchats'),
      orderBy('timestamp', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: QuickChat[] = [];
      snapshot.forEach((docSnap) => {
        messages.push(docSnap.data() as QuickChat);
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
      console.warn("Failed to subscribe to database live chats stream:", error);
      setIsOffline(true);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Handle message sending
  const sendQuickChat = async (text: string, type: 'preset' | 'emoji' | 'custom') => {
    if (!text.trim()) return;
    
    if (!auth.currentUser) {
      alert("Please Sign In using your Google Account first to send messages on the Live Server!");
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
      console.error("Error dispatching real chat message:", error);
      alert("Failed to send message: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSending(false);
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
            className="w-[calc(100vw-3rem)] sm:w-[380px] h-[480px] bg-slate-950/95 dark:bg-slate-950/98 backdrop-blur-2xl border-2 border-indigo-500/30 rounded-[2rem] shadow-[0_0_50px_rgba(99,102,241,0.25)] flex flex-col overflow-hidden mb-4 relative"
          >
            {/* Header */}
            <div className="p-5 border-b border-indigo-500/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/30 via-transparent to-transparent">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                    <Zap className="w-3.5 h-3.5 text-indigo-100" />
                  </div>
                  <h3 className="text-sm font-black uppercase italic text-white tracking-wide">
                    Live Chat Console
                  </h3>
                </div>
                
                {/* Connection status tag */}
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-indigo-500/10 border-indigo-500/30 text-indigo-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                    🌐 Live Server
                  </span>
                  {isOffline && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-lg border bg-rose-500/10 border-rose-500/30 text-rose-400">
                      Offline
                    </span>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button 
                onClick={toggleOpen}
                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer"
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
                    <MessageSquare className="w-8 h-8 opacity-20 mb-2" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/50">No signals logged yet</p>
                    <p className="text-[9px] mt-1 text-slate-400">Be the first to secure a live broadcast message!</p>
                  </div>
                ) : (
                  chats.map((chat) => (
                    <motion.div
                      key={chat.id}
                      initial={{ opacity: 0, x: -8, scale: 0.96 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      className="flex items-start gap-2.5"
                    >
                      {/* Avatar */}
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
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
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
              
              {/* Emojis Stream layout (Exactly 2 rows, no scrolling) */}
              <div className="flex flex-wrap gap-1.5 justify-start max-h-[74px] overflow-hidden">
                {emojis.slice(0, 16).map((emoji) => (
                  <button
                    key={emoji.id}
                    onClick={() => sendQuickChat(emoji.char, 'emoji')}
                    disabled={isSending || !auth.currentUser}
                    className="w-10 h-8 rounded-lg bg-white/5 hover:bg-indigo-600 disabled:hover:bg-white/5 hover:text-white transition-all text-base flex items-center justify-center shrink-0 active:scale-95 cursor-pointer border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {emoji.char}
                  </button>
                ))}
              </div>

              {/* Custom Classic Box Input */}
              <div className="pt-2 border-t border-indigo-500/10">
                {auth.currentUser ? (
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
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center transition-all active:scale-95 disabled:opacity-30 text-[10px] font-extrabold uppercase tracking-widest gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  </form>
                ) : (
                  <div className="text-center p-1 bg-indigo-500/5 rounded-xl border border-indigo-500/15">
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                      🔒 Sign In with Google to post messages
                    </p>
                  </div>
                )}
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
        className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-[0_0_25px_rgba(99,102,241,0.5)] cursor-pointer relative transition-colors duration-200 border-2 border-indigo-400 group"
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

        {/* Active connection dot indicator */}
        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-950 bg-indigo-500" />
      </motion.button>

    </div>
  );
};
