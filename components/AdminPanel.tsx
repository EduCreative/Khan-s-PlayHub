
import React, { useState, useEffect } from 'react';
import { cloud } from '../services/cloud';
import Logo from './Logo';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'system'>('stats');
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshData = async () => {
    setLoading(true);
    const [s, u] = await Promise.all([
      cloud.getAdminSummary(),
      cloud.getAdminUsers()
    ]);
    setSummary(s);
    setUsers(u);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleDeleteUser = async (deviceId: string) => {
    if (confirm('Permanently terminate this operative? This cannot be undone.')) {
      await cloud.deleteUser(deviceId);
      refreshData();
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex flex-col bg-slate-950 text-white animate-in fade-in duration-500 overflow-hidden font-mono">
      {/* Header */}
      <header className="flex items-center justify-between p-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
           <Logo size={40} />
           <div>
              <h1 className="text-xl font-black italic tracking-tighter uppercase text-indigo-400">Admin Nexus</h1>
              <p className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">System Control Unit v3.0</p>
           </div>
        </div>
        <div className="flex items-center gap-6">
           <div className="hidden md:flex gap-4">
              <button onClick={() => setActiveTab('stats')} className={`text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>Analytics</button>
              <button onClick={() => setActiveTab('users')} className={`text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'users' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>Operatives</button>
              <button onClick={() => setActiveTab('system')} className={`text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'system' ? 'text-indigo-400' : 'text-slate-500 hover:text-white'}`}>Core</button>
           </div>
           <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-rose-500/20 hover:text-rose-500 transition-all">
              <i className="fas fa-times"></i>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12">
        {loading ? (
          <div className="h-full flex items-center justify-center">
             <div className="text-center">
                <i className="fas fa-circle-notch fa-spin text-4xl text-indigo-500 mb-4"></i>
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-indigo-400 animate-pulse">Syncing Nexus Data...</p>
             </div>
          </div>
        ) : (
          <>
            {activeTab === 'stats' && (
              <div className="space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { label: 'Active Operatives', value: summary?.totalUsers || 0, icon: 'fa-users', color: 'text-cyan-400' },
                    { label: 'Logged Sessions', value: summary?.totalSessions || 0, icon: 'fa-gamepad', color: 'text-indigo-400' },
                    { label: 'Network Health', value: summary?.dbStatus || '100%', icon: 'fa-heartbeat', color: 'text-emerald-400' },
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-900/40 relative overflow-hidden group">
                       <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all" />
                       <i className={`fas ${stat.icon} ${stat.color} text-2xl mb-4`}></i>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                       <p className="text-4xl font-black italic">{stat.value}</p>
                    </div>
                  ))}
                </div>

                {/* Engagement Chart (Custom Bar Chart) */}
                <div className="glass-card p-8 rounded-[3rem] border-white/5 bg-slate-900/20">
                   <h3 className="text-sm font-black uppercase tracking-widest mb-8 text-indigo-400 flex items-center gap-3">
                      <i className="fas fa-chart-bar"></i> Sector Engagement Matrix
                   </h3>
                   <div className="space-y-4">
                      {users.length > 0 ? (
                        ['Fruit Vortex', 'Sudoku', 'Cyber Defense', 'Riddle Rift', 'Sum Surge'].map((game, i) => {
                          const width = Math.max(10, Math.random() * 90); // Simulating relative volume for visualization
                          return (
                            <div key={i} className="space-y-1">
                               <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  <span>{game}</span>
                                  <span>{Math.floor(width)}% Load</span>
                               </div>
                               <div className="w-full h-4 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                  <div className={`h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full transition-all duration-1000 delay-${i * 100}`} style={{ width: `${width}%` }}>
                                     <div className="w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.2)_50%,transparent_100%)] animate-shine" />
                                  </div>
                               </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-slate-600 italic">No engagement data recorded yet.</p>
                      )}
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'users' && (
              <div className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="glass-card rounded-[2.5rem] border-white/5 bg-slate-900/40 overflow-hidden shadow-2xl">
                   <div className="p-6 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Operative Directory</h3>
                      <span className="px-3 py-1 rounded-full bg-white/5 text-[9px] font-black uppercase">{users.length} Registries</span>
                   </div>
                   <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[10px] font-black uppercase text-slate-500 tracking-widest bg-white/5">
                            <th className="px-6 py-4">Operative</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Net Score</th>
                            <th className="px-6 py-4">Registry ID</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-bold text-slate-300">
                          {users.map((u, i) => (
                            <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                                    <i className={`fas ${u.avatar || 'fa-user'}`}></i>
                                 </div>
                                 <span className="uppercase text-indigo-100 italic">{u.username || 'Anonymous'}</span>
                              </td>
                              <td className="px-6 py-4">
                                 <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] uppercase tracking-widest border border-emerald-500/20">Authorized</span>
                              </td>
                              <td className="px-6 py-4 tabular-nums text-white">{(u.totalScore || 0).toLocaleString()}</td>
                              <td className="px-6 py-4 font-mono text-[9px] text-slate-500">{u.deviceId.slice(0, 8)}...</td>
                              <td className="px-6 py-4 text-right">
                                 <button onClick={() => handleDeleteUser(u.deviceId)} className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all">
                                    <i className="fas fa-trash-alt text-[10px]"></i>
                                 </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                   </div>
                </div>
              </div>
            )}

            {activeTab === 'system' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                 <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-900/40">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-indigo-400">Database Core</h3>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">Provider</span>
                          <span className="text-xs font-bold text-white uppercase italic">Cloudflare D1</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">Tier</span>
                          <span className="text-xs font-bold text-emerald-400 uppercase italic">Free Tier Optimized</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">Encryption</span>
                          <span className="text-xs font-bold text-white uppercase italic">SHA-256 Vector</span>
                       </div>
                       <button onClick={() => refreshData()} className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20">
                          Force Resynchronization
                       </button>
                    </div>
                 </div>

                 <div className="glass-card p-8 rounded-[2.5rem] border-white/5 bg-slate-900/40">
                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 text-cyan-400">Worker Node</h3>
                    <div className="space-y-6">
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">Latency</span>
                          <span className="text-xs font-bold text-emerald-400 uppercase italic">12ms (Optimal)</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">Regions</span>
                          <span className="text-xs font-bold text-white uppercase italic">Global Edge</span>
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-[10px] uppercase font-black text-slate-500">Uptime</span>
                          <span className="text-xs font-bold text-white uppercase italic">99.999%</span>
                       </div>
                       <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                          <p className="text-[9px] font-bold text-slate-400 italic">"Nexus protocol is currently monitoring 5 concurrent sectors for logic rifts."</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer Info */}
      <footer className="p-6 border-t border-white/10 bg-slate-950 flex justify-between items-center">
         <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Global Administrative Access Granted • Terminal Secure</p>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Sync Active</span>
         </div>
      </footer>
    </div>
  );
};

export default AdminPanel;
