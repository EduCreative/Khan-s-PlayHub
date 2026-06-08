import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Game, UserProfile } from '../types';
import { cloud } from '../services/cloud';
import { audioService } from '../services/audioService';

interface ChallengeModalProps {
  game: Game | null;
  highScore: number;
  userProfile: UserProfile;
  isOpen: boolean;
  onClose: () => void;
}

const ChallengeModal: React.FC<ChallengeModalProps> = ({ game, highScore, userProfile, isOpen, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!game) return null;

  const handleGenerate = async () => {
    setLoading(true);
    audioService.playClick();
    try {
      const id = await cloud.createChallenge(game.id, highScore, userProfile);
      setChallengeId(id);
      audioService.playSuccess();
    } catch (e) {
      console.error('Failed to create challenge:', e);
      // Fallback: generates a local pseudo-ID if database has transient errors or offline
      const genericId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setChallengeId(genericId);
    } finally {
      setLoading(false);
    }
  };

  const constructShareUrl = () => {
    if (!challengeId) return '';
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?challengeId=${challengeId}&gameId=${game.id}&targetScore=${highScore}&by=${encodeURIComponent(userProfile.username)}&avatar=${encodeURIComponent(userProfile.avatar)}`;
  };

  const handleCopy = async () => {
    const url = constructShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      audioService.playSuccess();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const shareUrl = constructShareUrl();

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="challenge-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 150 }}
            className="relative w-full max-w-lg glass-card border-2 border-indigo-500/30 dark:bg-slate-900/90 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-2xl overflow-hidden z-10"
          >
            {/* Ambient glows */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${game.color} rounded-full filter blur-[50px] opacity-20 pointer-events-none`} />

            {/* Close Button */}
            <button
              onClick={() => {
                onClose();
                audioService.playNav();
              }}
              className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-colors flex items-center justify-center"
            >
              <i className="fas fa-times"></i>
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl text-white shadow-xl`}>
                <i className={`fas ${game.icon}`}></i>
              </div>
              <div>
                <span className="text-[9px] font-black tracking-widest text-indigo-500 dark:text-indigo-400 uppercase">Create Score Duel</span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter leading-none mt-1">
                  Friend Challenge
                </h3>
              </div>
            </div>

            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-6 font-medium">
              Create an interactive challenge link to send to your friends. They can play directly from the link as guests or signed-in users and try to beat your score!
            </p>

            {/* High Score Detail Indicator */}
            <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/5 mb-6 text-center">
              <span className="text-[9px] font-black text-slate-500 tracking-[0.2em] uppercase leading-none block mb-1">Your Target score in {game.name}</span>
              <span className="text-4xl font-black text-indigo-600 dark:text-indigo-400 italic tabular-nums leading-none block my-2">
                {highScore.toLocaleString()}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 leading-none block">
                Friend must achieve a higher score to beat this duel
              </span>
            </div>

            {!challengeId ? (
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-103 active:scale-97 disabled:opacity-50 text-white rounded-2xl font-black text-base transition-all shadow-lg uppercase italic tracking-widest flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner animate-spin"></i>
                    ENGRAVING RECORD...
                  </>
                ) : (
                  <>
                    <i className="fas fa-swords"></i>
                    GENERATE CHALLENGE LINK
                  </>
                )}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/5 items-center">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="bg-transparent text-xs font-mono text-slate-500 dark:text-slate-400 outline-none flex-1 overflow-x-auto whitespace-nowrap scrollbar-none select-all"
                  />
                  <button
                    onClick={handleCopy}
                    className={`px-4 py-2 rounded-xl font-bold text-xs select-none transition-all flex items-center gap-1.5 shrink-0 ${copied ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                  >
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(`🔥 I bet you can't beat my score of ${highScore} in ${game.name}! Play here: ${shareUrl}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white font-black text-xs uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <i className="fab fa-whatsapp text-lg"></i>
                    WhatsApp
                  </a>
                  <a
                    href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`🔥 Can you beat my score of ${highScore} in ${game.name}? Try now!`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 bg-[#0088cc] hover:bg-[#0074ad] text-white font-black text-xs uppercase tracking-widest rounded-xl text-center flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <i className="fab fa-telegram-plane text-lg"></i>
                    Telegram
                  </a>
                </div>

                <div className="pt-2 text-center">
                  <button
                    onClick={onClose}
                    className="text-[10px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors tracking-widest"
                  >
                    Back to Hub list
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChallengeModal;
