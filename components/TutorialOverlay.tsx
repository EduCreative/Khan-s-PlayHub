
import React, { useState, useEffect } from 'react';

interface TutorialStep {
  title: string;
  description: string;
  targetId: string | null;
  position: 'center' | 'top' | 'bottom' | 'middle';
  icon: string;
}

const STEPS: TutorialStep[] = [
  {
    title: "Welcome to the Nexus",
    description: "Welcome operative. This is Khan's PlayHub, the ultimate micro-gaming nexus. Let's initialize your neural link.",
    targetId: null,
    position: 'center',
    icon: 'fa-rocket'
  },
  {
    title: "Operational Status",
    description: "Your session score and global rank are managed from the command center. Track your progress across all sectors.",
    targetId: 'hub-header',
    position: 'bottom',
    icon: 'fa-dashboard'
  },
  {
    title: "Sector Navigation",
    description: "Filter through Puzzle, Math, Arcade, and Educational sectors to find your target mission.",
    targetId: 'category-filters',
    position: 'bottom',
    icon: 'fa-filter'
  },
  {
    title: "Game Engagement",
    description: "Select any mission card to view detailed instructions and start your gaming session. Your Elite Score is recorded locally.",
    targetId: 'games-grid',
    position: 'middle',
    icon: 'fa-gamepad'
  },
  {
    title: "Environment Tuning",
    description: "Toggle the hub's luminosity based on your current operational environment. Optimized for both Day and Night cycles.",
    targetId: 'theme-toggle',
    position: 'bottom',
    icon: 'fa-sun'
  },
  {
    title: "Session Authorized",
    description: "Tutorial complete. You are now cleared for engagement. Good luck, operative.",
    targetId: null,
    position: 'center',
    icon: 'fa-check-double'
  }
];

interface TutorialOverlayProps {
  onComplete: () => void;
  isDarkMode: boolean;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onComplete, isDarkMode }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const step = STEPS[currentStep];
    if (step.targetId) {
      const el = document.getElementById(step.targetId);
      if (el) {
        setHighlightRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setHighlightRect(null);
      }
    } else {
      setHighlightRect(null);
    }
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const step = STEPS[currentStep];

  return (
    <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">
      {/* Dimmed Background with Spotlight */}
      <div 
        className="absolute inset-0 bg-slate-950/80 transition-all duration-500 pointer-events-auto"
        style={{
          clipPath: highlightRect ? `polygon(
            0% 0%, 
            0% 100%, 
            ${highlightRect.left}px 100%, 
            ${highlightRect.left}px ${highlightRect.top}px, 
            ${highlightRect.right}px ${highlightRect.top}px, 
            ${highlightRect.right}px ${highlightRect.bottom}px, 
            ${highlightRect.left}px ${highlightRect.bottom}px, 
            ${highlightRect.left}px 100%, 
            100% 100%, 
            100% 0%
          )` : 'none'
        }}
      />

      {/* Tutorial Tooltip */}
      <div 
        className={`absolute pointer-events-auto transition-all duration-500 ease-fluid w-full max-w-sm px-6
          ${step.position === 'center' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
          ${step.position === 'bottom' ? 'bottom-20 left-1/2 -translate-x-1/2' : ''}
          ${step.position === 'top' ? 'top-20 left-1/2 -translate-x-1/2' : ''}
          ${step.position === 'middle' ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' : ''}
        `}
      >
        <div className="glass-card p-8 rounded-[2.5rem] border-indigo-500/40 shadow-[0_0_50px_rgba(79,70,229,0.3)] bg-slate-900/90 backdrop-blur-2xl">
          <div className="flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-xl mb-6 shadow-2xl shadow-indigo-500/20 text-white animate-bounce">
              <i className={`fas ${step.icon}`}></i>
            </div>
            
            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-3 text-white">
              {step.title}
            </h3>
            <p className="text-slate-300 text-sm font-medium leading-relaxed mb-8">
              {step.description}
            </p>

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={handleNext}
                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                {currentStep === STEPS.length - 1 ? 'TERMINATE TUTORIAL' : 'NEXT PROTOCOL'}
              </button>
              
              {currentStep < STEPS.length - 1 && (
                <button 
                  onClick={handleSkip}
                  className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold uppercase text-[10px] tracking-widest transition-colors"
                >
                  SKIP INITIALIZATION
                </button>
              )}
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mt-8">
              {STEPS.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-1 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-6 bg-indigo-500' : 'w-2 bg-slate-700'}`} 
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative Highlights */}
      {highlightRect && (
        <div 
          className="absolute border-2 border-indigo-500/50 rounded-2xl pointer-events-none animate-pulse-gentle transition-all duration-500"
          style={{
            left: highlightRect.left - 4,
            top: highlightRect.top - 4,
            width: highlightRect.width + 8,
            height: highlightRect.height + 8,
            boxShadow: '0 0 20px rgba(79,70,229,0.5), inset 0 0 10px rgba(79,70,229,0.3)'
          }}
        />
      )}
    </div>
  );
};

export default TutorialOverlay;
