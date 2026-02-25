
import React, { useEffect, useState } from 'react';
import { cloud } from '../services/cloud';

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [s, u] = await Promise.all([
          cloud.getAdminSummary(),
          cloud.getAdminUsers()
        ]);
        
        if (!s) {
          setError("Failed to connect to Nexus Cloud. Check Worker logs or D1 bindings.");
        } else {
          setSummary(s);
          setUsers(u);
        }
      } catch (e) {
        setError("A critical connection error occurred.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleDeleteUser = async (deviceId: string) => {
    if (confirm('Are you sure you want to wipe this operative\'s data?')) {
      const success = await cloud.deleteUser(deviceId);
      if (success) {
        setUsers(prev => prev.filter(u => u.deviceId !== deviceId));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
              <i className="fas fa-terminal"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Nexus Admin Console</h2>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Direct D1 Database Access</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all uppercase font-black text-[10px] tracking-widest"
          >
            Terminate Session
          </button>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
            <p className="text-indigo-500 font-black uppercase tracking-widest text-xs">Decrypting Database...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-rose-500/10 flex items-center justify-center text-rose-500 text-3xl mb-6">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-xl font-black text-white uppercase italic mb-2 tracking-tighter">Connection Interrupted</h3>
            <p className="text-slate-500 max-w-md mb-8 leading-relaxed">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 transition-all"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Operatives', value: summary?.totalUsers || 0, icon: 'fa-users', color: 'text-blue-400' },
                { label: 'Neural Sessions', value: summary?.totalSessions || 0, icon: 'fa-brain', color: 'text-purple-400' },
                { label: 'Active Sector', value: summary?.popularGame?.gameId || 'N/A', icon: 'fa-gamepad', color: 'text-emerald-400' },
                { label: 'Nexus Status', value: summary?.dbStatus || 'OFFLINE', icon: 'fa-signal', color: 'text-cyan-400' }
              ].map((stat, i) => (
                <div key={i} className="glass-card p-6 rounded-3xl border-white/5 bg-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <i className={`fas ${stat.icon} ${stat.color} opacity-50`}></i>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-black text-white italic tracking-tighter">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div className="glass-card rounded-[2.5rem] border-white/5 bg-white/5 overflow-hidden">
              <div className="p-6 border-b border-white/5 bg-white/5">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Operative Registry</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                      <th className="p-6">Operative</th>
                      <th className="p-6">Device ID</th>
                      <th className="p-6">Games</th>
                      <th className="p-6">Total Score</th>
                      <th className="p-6">Joined</th>
                      <th className="p-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-20 text-center text-slate-500 font-medium">No operatives found in the Nexus registry.</td>
                      </tr>
                    ) : (
                      users.map((user) => (
                        <tr key={user.deviceId} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                                <i className={`fas ${user.avatar || 'fa-user'}`}></i>
                              </div>
                              <span className="font-bold text-white">{user.username}</span>
                            </div>
                          </td>
                          <td className="p-6 font-mono text-[10px] text-slate-500">{user.deviceId.slice(0, 12)}...</td>
                          <td className="p-6 text-slate-400 font-bold">{user.gamesPlayed}</td>
                          <td className="p-6 text-indigo-400 font-black italic">{user.totalScore?.toLocaleString()}</td>
                          <td className="p-6 text-slate-500 text-xs">{new Date(user.joinedAt).toLocaleDateString()}</td>
                          <td className="p-6 text-right">
                            <button 
                              onClick={() => handleDeleteUser(user.deviceId)}
                              className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                              title="Wipe Operative Data"
                            >
                              <i className="fas fa-trash-alt text-xs"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
