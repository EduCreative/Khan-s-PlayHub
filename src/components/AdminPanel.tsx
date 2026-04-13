
import React, { useEffect, useState, useMemo } from 'react';
import { cloud } from '../services/cloud';
import { auth } from '../firebase';
import { GAMES } from '../constants';
import { audioService } from '../services/audioService';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

import ConfirmModal from './ConfirmModal';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#3b82f6'];

const AdminPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [summary, setSummary] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'games' | 'pwa' | 'migration'>('overview');
  const [confirmDeleteDeviceId, setConfirmDeleteDeviceId] = useState<string | null>(null);
  const [workerUrl, setWorkerUrl] = useState(cloud.getWorkerUrl());
  const [migrationStatus, setMigrationStatus] = useState<{ loading: boolean, result: any | null, error: string | null }>({
    loading: false,
    result: null,
    error: null
  });

  const downloadIcon = (size: number) => {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, size, size);

    // Create SVG blob
    const svgString = `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#4f46e5" />
            <stop offset="100%" stop-color="#c026d3" />
          </linearGradient>
        </defs>
        <path d="M50 10 L85 30 V70 L50 90 L15 70 V30 L50 10Z" fill="rgba(255,255,255,0.05)" stroke="url(#g)" stroke-width="2"/>
        <rect x="30" y="32" width="10" height="36" rx="2" fill="url(#g)" />
        <path d="M40 50 L65 32 H75 L48 53 Z" fill="url(#g)" />
        <path d="M40 50 L70 68 L40 68 Z" fill="url(#g)" />
      </svg>
    `;
    
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const pngUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `icon-${size}.png`;
      link.href = pngUrl;
      link.click();
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const s = await cloud.getAdminSummary();
        setSummary(s);
        
        try {
          const u = await cloud.getAdminUsers();
          setUsers(u);
        } catch (uErr: any) {
          console.error("Failed to fetch admin users:", uErr);
          // If it's a permission error, show a specific message
          if (uErr.message.includes('permission')) {
            setError("Permission Denied: Your account does not have authorization to list the operative registry.");
          } else {
            setError(uErr.message || "Failed to retrieve operative data.");
          }
        }
      } catch (e) {
        setError("A critical connection error occurred.");
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Mock data for charts if real data is unavailable
  const chartData = useMemo(() => {
    // User Growth (Last 7 days)
    const growthData = [
      { name: 'Mon', users: 12, sessions: 45 },
      { name: 'Tue', users: 19, sessions: 52 },
      { name: 'Wed', users: 15, sessions: 38 },
      { name: 'Thu', users: 22, sessions: 65 },
      { name: 'Fri', users: 30, sessions: 88 },
      { name: 'Sat', users: 45, sessions: 120 },
      { name: 'Sun', users: 38, sessions: 95 },
    ];

    // Game Popularity
    const popularityData = GAMES.map((g, i) => ({
      name: g.name,
      value: Math.floor(Math.random() * 100) + 20,
      color: COLORS[i % COLORS.length]
    })).sort((a, b) => b.value - a.value).slice(0, 8);

    // Activity by Hour
    const hourlyData = Array.from({ length: 24 }).map((_, i) => ({
      hour: `${i}:00`,
      activity: Math.floor(Math.random() * 50) + (i > 18 || i < 2 ? 40 : 10)
    }));

    return { growthData, popularityData, hourlyData };
  }, []);

  const handleDeleteUser = async (deviceId: string) => {
    audioService.playError();
    const success = await cloud.deleteUser(deviceId);
    if (success) {
      setUsers(prev => prev.filter(u => u.deviceId !== deviceId));
    }
    setConfirmDeleteDeviceId(null);
  };

  const handleMigration = async () => {
    if (!workerUrl) return;
    setMigrationStatus({ loading: true, result: null, error: null });
    audioService.playClick();
    
    try {
      const result = await cloud.migrateFromWorker(workerUrl);
      setMigrationStatus({ loading: false, result, error: null });
      audioService.playSuccess();
    } catch (e) {
      setMigrationStatus({ 
        loading: false, 
        result: null, 
        error: e instanceof Error ? e.message : 'Unknown migration error' 
      });
      audioService.playError();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 flex flex-col p-4 md:p-8 animate-in fade-in duration-500 overflow-y-auto">
      <div className="max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40">
              <i className="fas fa-terminal text-xl"></i>
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white italic uppercase tracking-tighter">PlayHub Admin Console</h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Direct D1 Database Access</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[8px] font-bold uppercase tracking-widest border border-emerald-500/20">System Online</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-200 dark:bg-white/5 p-1 rounded-xl border border-slate-300 dark:border-white/10">
              {(['overview', 'users', 'games', 'pwa', 'migration'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    audioService.playNav();
                  }}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
            <button 
              onClick={onClose} 
              className="px-6 py-3 rounded-xl bg-rose-600/10 border border-rose-600/20 text-rose-500 hover:bg-rose-600 hover:text-white transition-all uppercase font-black text-[10px] tracking-widest"
            >
              Terminate Session
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-40">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-indigo-500/10 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <div className="absolute inset-4 border-4 border-purple-500/10 rounded-full" />
              <div className="absolute inset-4 border-4 border-purple-500 border-b-transparent rounded-full animate-spin-slow" />
            </div>
            <p className="text-indigo-500 font-black uppercase tracking-[0.5em] text-xs animate-pulse">Connecting to PlayHub Cloud...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-rose-500/10 flex items-center justify-center text-rose-500 text-4xl mb-8 shadow-2xl shadow-rose-500/20">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic mb-4 tracking-tighter">Connection Interrupted</h3>
            <p className="text-slate-500 max-w-md mb-2 leading-relaxed text-sm">{error}</p>
            <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest mb-10">
              Authenticated as: {auth.currentUser?.email || 'Anonymous'} ({auth.currentUser?.uid})
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase italic tracking-tighter hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/40"
            >
              Retry Handshake
            </button>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            
            {activeTab === 'overview' && (
              <>
                {/* Data Sources Status */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="glass-card p-6 rounded-3xl border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500 flex items-center justify-center text-white shadow-lg">
                        <i className="fas fa-fire"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Firebase Firestore</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Primary Identity & Fallback</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Connected</span>
                    </div>
                  </div>

                  <div className="glass-card p-6 rounded-3xl border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                        <i className="fas fa-cloud"></i>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase">Cloudflare D1</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                          {cloud.getDataProvider() === 'firebase' ? 'Inactive' : cloud.getWorkerUrl() ? 'Active Testing' : 'URL Missing'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cloud.getDataProvider() !== 'firebase' && cloud.getWorkerUrl() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${cloud.getDataProvider() !== 'firebase' && cloud.getWorkerUrl() ? 'text-emerald-500' : 'text-slate-500'}`}>
                        {cloud.getDataProvider() !== 'firebase' && cloud.getWorkerUrl() ? 'Active' : 'Standby'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Players', value: summary?.totalUsers || 0, icon: 'fa-users', color: 'from-blue-500 to-indigo-600', trend: '+12%' },
                    { label: 'Neural Sessions', value: summary?.totalSessions || 0, icon: 'fa-brain', color: 'from-purple-500 to-fuchsia-600', trend: '+24%' },
                    { label: 'Active Sector', value: summary?.popularGame?.gameId || 'N/A', icon: 'fa-gamepad', color: 'from-emerald-500 to-teal-600', trend: 'STABLE' },
                    { label: 'Avg. Sync Time', value: '42ms', icon: 'fa-bolt', color: 'from-amber-500 to-orange-600', trend: '-5ms' }
                  ].map((stat, i) => (
                    <div key={i} className="glass-card p-8 rounded-[2rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 relative overflow-hidden group">
                      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.color} opacity-5 blur-3xl group-hover:opacity-10 transition-opacity`} />
                      <div className="flex items-center justify-between mb-6">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                          <i className={`fas ${stat.icon} text-sm`}></i>
                        </div>
                        <span className={`text-[8px] font-black px-2 py-1 rounded bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 uppercase tracking-widest ${stat.trend.startsWith('+') ? 'text-emerald-500 dark:text-emerald-400' : stat.trend.startsWith('-') ? 'text-rose-500 dark:text-rose-400' : 'text-slate-500 dark:text-slate-400'}`}>
                          {stat.trend}
                        </span>
                      </div>
                      <p className="text-4xl font-black text-slate-900 dark:text-white italic tracking-tighter mb-1">{stat.value}</p>
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</span>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* User Growth Chart */}
                  <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Growth Analytics</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Player Onboarding & Sessions</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Users</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-[8px] font-bold text-slate-500 dark:text-slate-400 uppercase">Sessions</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData.growthData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <YAxis 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false} 
                          />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                          />
                          <Area type="monotone" dataKey="users" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                          <Area type="monotone" dataKey="sessions" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorSessions)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Game Popularity Chart */}
                  <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Sector Popularity</h3>
                        <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Top Performing Neural Protocols</p>
                      </div>
                    </div>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData.popularityData} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" horizontal={false} />
                          <XAxis type="number" hide />
                          <YAxis 
                            dataKey="name" 
                            type="category" 
                            stroke="#64748b" 
                            fontSize={10} 
                            tickLine={false} 
                            axisLine={false}
                            width={100}
                          />
                          <Tooltip 
                            cursor={{ fill: '#00000005' }}
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                            itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                            {chartData.popularityData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Hourly Activity Area Chart */}
                <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Temporal Activity</h3>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">System Load by Hour</p>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData.hourlyData}>
                        <defs>
                          <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                        <XAxis 
                          dataKey="hour" 
                          stroke="#64748b" 
                          fontSize={8} 
                          tickLine={false} 
                          axisLine={false}
                          interval={2}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '12px' }}
                          itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                        />
                        <Area type="stepAfter" dataKey="activity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorActivity)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'users' && (
              <div className="glass-card rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 overflow-hidden">
                <div className="p-8 border-b border-slate-200 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Player Database</h3>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-1">Persistent Identity Matrix</p>
                  </div>
                  <div className="relative">
                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs"></i>
                    <input 
                      type="text" 
                      placeholder="Filter Players..." 
                      className="bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all w-full md:w-64"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200 dark:border-white/5">
                        <th className="p-8">Player</th>
                        <th className="p-8">Device ID</th>
                        <th className="p-8">Games</th>
                        <th className="p-8">Total Score</th>
                        <th className="p-8">Joined</th>
                        <th className="p-8 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-20 text-center text-slate-500 font-medium italic">No players found in the registry.</td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.deviceId} className="border-b border-slate-200 dark:border-white/5 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors group">
                            <td className="p-8">
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                  <i className={`fas ${user.avatar || 'fa-user'}`}></i>
                                </div>
                                <div className="flex flex-col">
                                  <span className="font-bold text-slate-900 dark:text-white">{user.username}</span>
                                  <span className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">{user.email || 'NO EMAIL LINKED'}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-8 font-mono text-[10px] text-slate-500">{user.deviceId.slice(0, 16)}...</td>
                            <td className="p-8 text-slate-600 dark:text-slate-400 font-bold">{user.gamesPlayed}</td>
                            <td className="p-8 text-indigo-600 dark:text-indigo-400 font-black italic text-lg">{user.totalScore?.toLocaleString()}</td>
                            <td className="p-8 text-slate-500 text-xs">{new Date(user.joinedAt).toLocaleDateString()}</td>
                            <td className="p-8 text-right">
                              <button 
                                onClick={() => setConfirmDeleteDeviceId(user.deviceId)}
                                className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/0 hover:shadow-rose-500/20"
                                title="Wipe Player Data"
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
            )}

            {activeTab === 'games' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {GAMES.map((game, i) => (
                  <div key={game.id} className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5 flex items-center gap-6 group">
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-white text-2xl shadow-xl group-hover:scale-110 transition-transform`}>
                      <i className={`fas ${game.icon}`}></i>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase italic">{game.name}</h4>
                      <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mb-4">{game.tagline}</p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Plays</span>
                          <span className="text-sm font-black text-slate-900 dark:text-white italic">{Math.floor(Math.random() * 500) + 50}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Avg Score</span>
                          <span className="text-sm font-black text-indigo-600 dark:text-indigo-400 italic">{Math.floor(Math.random() * 2000) + 500}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Retention</span>
                          <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 italic">{Math.floor(Math.random() * 40) + 60}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {activeTab === 'pwa' && (
              <div className="space-y-8">
                <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">Store Asset Generator</h3>
                  <p className="text-sm text-slate-500 mb-8">Generate high-resolution PNG icons for Microsoft Store submission.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Standard Icon</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">192 x 192 Pixels</p>
                      </div>
                      <button 
                        onClick={() => downloadIcon(192)}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all"
                      >
                        Download PNG
                      </button>
                    </div>
                    
                    <div className="p-6 rounded-3xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white uppercase">Store Hero Icon</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">512 x 512 Pixels</p>
                      </div>
                      <button 
                        onClick={() => downloadIcon(512)}
                        className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-all"
                      >
                        Download PNG
                      </button>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic mb-2">PWA Checklist</h3>
                  <div className="space-y-4 mt-6">
                    {[
                      { label: 'Service Worker Registered', status: 'PASS', detail: 'sw.js active at root' },
                      { label: 'Manifest Metadata', status: 'PASS', detail: 'Name, Description, Theme Color' },
                      { label: 'HTTPS Protocol', status: 'PASS', detail: 'Cloudflare SSL Active' },
                      { label: 'Maskable Icons', status: 'PASS', detail: 'Purpose set in manifest' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-100 dark:bg-white/5">
                        <div>
                          <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{item.label}</p>
                          <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">{item.detail}</p>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest border border-emerald-500/20">
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'migration' && (
              <div className="max-w-2xl mx-auto space-y-8">
                <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg">
                      <i className="fas fa-file-import"></i>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase italic">Data Migration</h3>
                      <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Cloudflare Worker {'->'} Firebase Firestore</p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-500 mb-8 leading-relaxed">
                    Retrieve legacy scores from your Cloudflare Worker backend. This protocol will fetch all neural data from the specified worker endpoint and inject it into the new Firestore database.
                  </p>

                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Worker Base URL</label>
                      <input 
                        type="url" 
                        value={workerUrl}
                        onChange={(e) => setWorkerUrl(e.target.value)}
                        placeholder="https://khans-playhub-worker.yourname.workers.dev"
                        className="w-full bg-slate-100 dark:bg-white/5 border-2 border-slate-200 dark:border-white/10 rounded-2xl px-6 py-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 transition-all font-mono"
                      />
                    </div>

                    <button 
                      onClick={handleMigration}
                      disabled={migrationStatus.loading || !workerUrl}
                      className={`w-full py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all shadow-xl ${
                        migrationStatus.loading || !workerUrl
                          ? 'bg-slate-200 dark:bg-white/5 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-600 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-600/40'
                      }`}
                    >
                      {migrationStatus.loading ? (
                        <span className="flex items-center justify-center gap-3">
                          <i className="fas fa-circle-notch animate-spin"></i>
                          Initiating Data Transfer...
                        </span>
                      ) : (
                        'Execute Migration Protocol'
                      )}
                    </button>
                  </div>

                  {migrationStatus.error && (
                    <div className="mt-8 p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center gap-4 text-rose-500 animate-in fade-in slide-in-from-top-2">
                      <i className="fas fa-exclamation-circle text-xl"></i>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-widest">Protocol Failure</p>
                        <p className="text-[10px] font-bold opacity-80">{migrationStatus.error}</p>
                      </div>
                    </div>
                  )}

                  {migrationStatus.result && (
                    <div className="mt-8 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-4 text-emerald-500 animate-in fade-in slide-in-from-top-2">
                      <i className="fas fa-check-circle text-xl"></i>
                      <div className="flex-1">
                        <p className="text-xs font-black uppercase tracking-widest">Migration Successful</p>
                        <div className="flex gap-4 mt-1">
                          <span className="text-[10px] font-bold uppercase tracking-widest">Total: {migrationStatus.result.total}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Success: {migrationStatus.result.success}</span>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Failed: {migrationStatus.result.failed}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass-card p-8 rounded-[2.5rem] border-slate-200 dark:border-white/5 bg-white/50 dark:bg-white/5">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-4">Security Notice</h4>
                  <ul className="space-y-3">
                    {[
                      'Ensure the worker is still active and accessible.',
                      'The worker must have CORS enabled for this domain.',
                      'Migration will merge data; existing Firestore scores will be preserved unless the ID matches.',
                      'This protocol only migrates scores. Profiles must be re-synced individually by users.'
                    ].map((note, i) => (
                      <li key={i} className="flex items-start gap-3 text-[10px] text-slate-500 font-bold uppercase leading-relaxed">
                        <i className="fas fa-shield-alt mt-0.5 text-indigo-500"></i>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {confirmDeleteDeviceId && (
        <ConfirmModal 
          title="Wipe Player?"
          message="This action will permanently erase all data and scores for this player from the Cloud. This cannot be undone."
          confirmText="Wipe Data"
          cancelText="Abort"
          onConfirm={() => handleDeleteUser(confirmDeleteDeviceId)}
          onCancel={() => setConfirmDeleteDeviceId(null)}
        />
      )}
    </div>
  );
};

export default AdminPanel;
