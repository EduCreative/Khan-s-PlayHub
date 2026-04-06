
import React from 'react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 animate-in fade-in duration-300">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-slate-200 dark:border-indigo-500/20 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500"
      >
        <div className="p-6 md:p-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
          <div>
            <h2 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">Privacy Policy</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Last Updated: March 2026</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          <section>
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white mb-2">1. Information We Collect</h3>
            <p>
              Khan's PlayHub is designed to be a privacy-first gaming experience. We collect minimal data to provide core features:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li><strong>Device Identifier:</strong> A unique, anonymous ID generated locally on your device to sync your scores.</li>
              <li><strong>Game Data:</strong> Your high scores, achievements, and favorite games.</li>
              <li><strong>Profile Info:</strong> Your chosen username, avatar, and optional email address.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white mb-2">2. How We Use Data</h3>
            <p>
              Your data is used exclusively for:
            </p>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Maintaining global leaderboards.</li>
              <li>Syncing your progress across different sessions or devices.</li>
              <li>Providing a personalized gaming experience.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white mb-2">3. Data Storage</h3>
            <p>
              We use <strong>Local Storage</strong> on your device for immediate access and a secure <strong>Cloudflare Worker</strong> backend for global syncing. We do not sell or share your data with third-party advertisers.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white mb-2">4. Your Rights</h3>
            <p>
              You can clear your local data at any time by clearing your browser's cache or using the "Reset Data" option in settings. For account deletion or data requests, please contact the developer.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-black uppercase italic text-slate-900 dark:text-white mb-2">5. Contact</h3>
            <p>
              If you have any questions about this policy, please reach out to:
              <br />
              <span className="text-indigo-500 font-bold">kmasroor50@gmail.com</span>
            </p>
          </section>
        </div>

        <div className="p-6 bg-slate-50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/20"
          >
            Got it, Thanks!
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
