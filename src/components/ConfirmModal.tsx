
import React from 'react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  title, message, confirmText, cancelText, onConfirm, onCancel, variant = 'danger' 
}) => {
  const colorClass = variant === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-500/40' : 
                     variant === 'warning' ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/40' : 
                     'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/40';

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onCancel} />
      <div className="relative glass-card w-full max-w-sm p-8 rounded-[2.5rem] border-2 border-white/10 shadow-2xl scale-up-center text-center">
        <div className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-2xl mb-6 text-white ${colorClass}`}>
          <i className={`fas ${variant === 'danger' ? 'fa-trash-alt' : variant === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'}`}></i>
        </div>
        <h2 className="text-2xl font-black mb-2 italic tracking-tighter uppercase dark:text-white text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col gap-3">
          <button 
            onClick={onConfirm} 
            className={`w-full py-4 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl ${colorClass}`}
          >
            {confirmText}
          </button>
          <button 
            onClick={onCancel} 
            className="w-full py-4 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
