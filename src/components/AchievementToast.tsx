import React, { useEffect, useState } from 'react';
import { Achievement } from '../types';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const AchievementToast: React.FC<AchievementToastProps> = ({ achievement, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(true); // Keep visible for exit animation
        setTimeout(() => {
          setVisible(false);
          onClose();
        }, 500);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  if (!achievement || !visible) return null;

  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] w-full max-w-sm animate-in slide-in-from-bottom-20 duration-500"
    >
      <div className="glass-card p-4 rounded-[2rem] border-2 border-amber-500/50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl shadow-[0_0_50px_rgba(245,158,11,0.3)] flex items-center gap-4 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 animate-pulse" />
            
            <div className={`w-14 h-14 rounded-2xl bg-${achievement.color}-500/20 flex items-center justify-center text-2xl text-amber-500 shadow-inner`}>
              <i className={`fas ${achievement.icon}`}></i>
            </div>
            
            <div className="flex-1">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Achievement Unlocked</p>
              <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic leading-tight">{achievement.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{achievement.description}</p>
            </div>

            <div className="absolute -right-4 -bottom-4 opacity-10 text-6xl text-amber-500 rotate-12">
              <i className={`fas ${achievement.icon}`}></i>
            </div>
          </div>
    </div>
  );
};

export default AchievementToast;
