import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell, 
  PieChart, 
  Pie,
  Legend
} from 'recharts';
import { cloud } from '../services/cloud';
import { Game } from '../types';
import { audioService } from '../services/audioService';

interface VisualLeaderboardProps {
  games: Game[];
  globalRecords: Record<string, number>;
  isDarkMode: boolean;
  onBack?: () => void;
}

const COLORS = [
  '#6366f1', // indigo
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f43f5e', // rose
  '#f59e0b', // amber
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
];

const VisualLeaderboard: React.FC<VisualLeaderboardProps> = ({ 
  games, 
  globalRecords, 
  isDarkMode, 
  onBack 
}) => {
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [scores, setScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'ranking' | 'records'>('ranking');

  // Load scores whenever the selected game changes
  useEffect(() => {
    setLoading(true);
    cloud.getGlobalHighScores(selectedGameId).then(data => {
      // Sort and slice top 10 for clean visualization
      const sorted = [...(data || [])].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 10);
      setScores(sorted);
      setLoading(false);
    }).catch(err => {
      console.error('Error fetching global high scores for visual layout:', err);
      setLoading(false);
    });
  }, [selectedGameId]);

  // Transform globalRecords from Hub to a comparative chart data source
  const recordsChartData = games.map((game, idx) => ({
    name: game.name,
    record: globalRecords[game.id] || 0,
    color: COLORS[idx % COLORS.length],
    category: game.category
  })).sort((a, b) => b.record - a.record);

  // Compute stats for current game view
  const highestScore = scores.length > 0 ? Math.max(...scores.map(s => s.score || 0)) : 0;
  const averageScore = scores.length > 0 
    ? Math.round(scores.reduce((sum, s) => sum + (s.score || 0), 0) / scores.length) 
    : 0;
  const leadingPlayer = scores.length > 0 ? scores[0].username || 'Anonymous' : '---';

  const chartThemeColors = {
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    text: isDarkMode ? '#94a3b8' : '#475569',
    tooltipBg: isDarkMode ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
    barDefault: '#6366f1'
  };

  const selectedGameObj = games.find(g => g.id === selectedGameId);

  // Layout for top 3 visual podium placements
  const podiumData = scores.slice(0, 3);
  const podiumOrder = [1, 0, 2].filter(idx => idx < podiumData.length); // Silver (1), Gold (0), Bronze (2)

  // Pie chart data for scoring distributions
  const pieData = scores.slice(0, 5).map((s, idx) => ({
    name: s.username || `Player ${idx + 1}`,
    value: s.score || 0
  }));

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500">
      {/* Header and Controls */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 bg-white/40 dark:bg-slate-900/40 p-4 md:p-6 rounded-[2rem] border border-slate-200 dark:border-indigo-500/10 backdrop-blur-md">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {onBack && (
            <button 
              onClick={() => {
                audioService.playNav();
                onBack();
              }} 
              className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-all select-none shadow-sm cursor-pointer"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase italic text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              <i className="fas fa-chart-line text-indigo-500"></i>
              Visual Analytics
            </h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mt-1">
              Neural Telemetry & Record Comparison
            </p>
          </div>
        </div>

        {/* View Selection & Select dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          {/* Internal View Toggle */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-white/5">
            <button
              onClick={() => {
                setActiveTab('ranking');
                audioService.playClick();
              }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'ranking'
                  ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <i className="fas fa-trophy mr-1.5"></i> Ranking
            </button>
            <button
              onClick={() => {
                setActiveTab('records');
                audioService.playClick();
              }}
              className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === 'records'
                  ? 'bg-indigo-650 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <i className="fas fa-sparkles mr-1.5"></i> All Records
            </button>
          </div>

          {activeTab === 'ranking' && (
            <select 
              value={selectedGameId} 
              onChange={(e) => {
                setSelectedGameId(e.target.value);
                audioService.playClick();
              }}
              className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer h-11"
            >
              <option value="all">🧠 Accumulated (All Games)</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {activeTab === 'ranking' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          {/* Left / Middle: Visualizing Player rankings */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Quick telemetry metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450 block">LEADING SCORE</span>
                  <span className="text-2xl font-black text-indigo-650 dark:text-indigo-400 italic tabular-nums">
                    {highestScore.toLocaleString()}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-905/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <i className="fas fa-crown text-sm"></i>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450 block">AVG TOP SCORE</span>
                  <span className="text-2xl font-black text-purple-650 dark:text-purple-400 italic tabular-nums">
                    {averageScore.toLocaleString()}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-905/30 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <i className="fas fa-calculator text-sm"></i>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/5 shadow-md flex items-center justify-between">
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider text-slate-450 block">CHART LEADER</span>
                  <span className="text-lg font-black text-emerald-650 dark:text-emerald-400 uppercase truncate max-w-[140px] block">
                    {leadingPlayer}
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-905/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <i className="fas fa-trophy-star text-sm"></i>
                </div>
              </div>
            </div>

            {/* Recharts BarChart visualization card */}
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    {selectedGameId === 'all' ? 'Top Accumuluated Players' : `${selectedGameObj?.name} Leaderboard Chart`}
                  </h3>
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest mt-0.5">
                    Juice scores for top 10 neural nodes
                  </p>
                </div>
                {selectedGameObj?.color && (
                  <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${selectedGameObj.color} shadow-lg`} />
                )}
              </div>

              {loading ? (
                <div className="h-[320px] flex flex-col items-center justify-center gap-3">
                  <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Processing telemetry...</p>
                </div>
              ) : scores.length === 0 ? (
                <div className="h-[320px] flex flex-col items-center justify-center text-center">
                  <i className="fas fa-database-slash text-slate-300 dark:text-slate-800 text-3xl mb-3"></i>
                  <p className="text-slate-400 font-medium italic text-xs">No entries recorded in this sector yet.</p>
                </div>
              ) : (
                <div className="h-[320px] w-full" id="bar-chart-holder">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={scores}
                      margin={{ top: 10, right: 10, left: -25, bottom: 5 }}
                    >
                      <defs>
                        <linearGradient id="indigoGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity={0.9}/>
                          <stop offset="100%" stopColor="#4f46e5" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartThemeColors.grid} />
                      <XAxis 
                        dataKey="username" 
                        stroke={chartThemeColors.text} 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false}
                        tickFormatter={(value) => (value && value.length > 10 ? `${value.slice(0, 8)}...` : value || 'Anon')}
                      />
                      <YAxis 
                        stroke={chartThemeColors.text} 
                        fontSize={9} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(v) => v.toLocaleString()}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartThemeColors.tooltipBg, 
                          border: `2px solid ${chartThemeColors.tooltipBorder}`,
                          borderRadius: '16px',
                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '11px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)'
                        }}
                        cursor={{ fill: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)' }}
                        formatter={(value: any) => [value.toLocaleString(), 'Juice Score']}
                        labelFormatter={(label) => `Player: ${label}`}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[8, 8, 0, 0]}
                        animationDuration={1000}
                      >
                        {scores.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={index === 0 ? '#f59e0b' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'url(#indigoGradient)'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* Right: Digital Podium & Score distribution stats */}
          <div className="flex flex-col gap-6">
            {/* Elegant 3D Podium representation */}
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Neural Sector Podium</h3>
                <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest mt-0.5">Top 3 player ranking hierarchy</p>
              </div>

              {loading ? (
                <div className="h-[180px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : scores.length === 0 ? (
                <div className="h-[180px] flex items-center justify-center text-slate-400 italic text-xs">
                  Awaiting champions...
                </div>
              ) : (
                <div className="flex items-end justify-center gap-2 pt-6 pb-2 min-h-[190px]">
                  {podiumOrder.map((mappedIdx) => {
                    const pl = podiumData[mappedIdx];
                    if (!pl) return null;

                    // Placements style variables
                    const rank = mappedIdx + 1;
                    const isGold = rank === 1;
                    const isSilver = rank === 2;
                    const isBronze = rank === 3;

                    return (
                      <div 
                        key={pl.deviceId || rank} 
                        className={`flex flex-col items-center flex-1 transition-all duration-700 transform translate-y-0`}
                      >
                        {/* Avatar */}
                        <div className="relative group flex flex-col items-center">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md relative ${
                            isGold ? 'bg-amber-500 ring-4 ring-amber-400/30' :
                            isSilver ? 'bg-slate-400 ring-2 ring-slate-350/30' :
                            'bg-orange-600 ring-2 ring-orange-500/30'
                          }`}>
                            <i className={`fas ${pl.avatar || 'fa-user-ninja'} text-sm`}></i>
                            <span className={`absolute -top-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black z-10 text-white ${
                              isGold ? 'bg-amber-600' : isSilver ? 'bg-slate-500' : 'bg-orange-700'
                            }`}>
                              {rank}
                            </span>
                          </div>
                          
                          {/* Player name */}
                          <p className="text-[9px] font-black text-slate-800 dark:text-slate-200 mt-2 truncate w-20 text-center uppercase tracking-tighter">
                            {pl.username || 'Anonymous'}
                          </p>
                          <p className="text-[8px] font-bold text-slate-450 tabular-nums leading-none">
                            {pl.score?.toLocaleString()}
                          </p>
                        </div>

                        {/* Pedestal block */}
                        <div className={`w-full mt-3 rounded-t-xl transition-all ${
                          isGold ? 'bg-gradient-to-t from-amber-600/40 to-amber-500/20 border-t-2 border-amber-400 h-24' :
                          isSilver ? 'bg-gradient-to-t from-slate-500/40 to-slate-400/20 border-t-2 border-slate-300 h-16' :
                          'bg-gradient-to-t from-orange-600/40 to-orange-500/20 border-t-2 border-orange-500 h-11'
                        } flex items-center justify-center`}>
                          <i className={`fas ${
                            isGold ? 'fa-medal text-amber-500 text-lg' : 
                            isSilver ? 'fa-award text-slate-400 text-md' : 
                            'fa-certificate text-orange-500 text-xs'
                          } opacity-65`}></i>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Pie Chart / Top Share distribution card */}
            <div className="bg-white dark:bg-slate-900/60 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Top 5 Score Share</h3>
                <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest mt-0.5">Ratio distribution of leading profiles</p>
              </div>

              {loading ? (
                <div className="h-[150px] flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : scores.length === 0 ? (
                <div className="h-[150px] flex items-center justify-center text-slate-400 italic text-xs">
                  Insufficient data points...
                </div>
              ) : (
                <div className="h-[150px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={55}
                        paddingAngle={4}
                        dataKey="value"
                        animationDuration={1000}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: chartThemeColors.tooltipBg, 
                          border: `2px solid ${chartThemeColors.tooltipBorder}`,
                          borderRadius: '12px',
                          color: isDarkMode ? '#f8fafc' : '#0f172a',
                          fontFamily: 'Inter, sans-serif',
                          fontSize: '10px'
                        }}
                        formatter={(value: any) => [value.toLocaleString(), 'Juice']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  {/* Legend guide right overlay */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 max-w-[125px]">
                    {pieData.map((d, index) => (
                      <div key={d.name} className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate block max-w-[100px]">{d.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* TAB 2: 'records' -> Multi-Game global record board comparison chart */
        <div className="bg-white dark:bg-slate-900/60 p-6 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-6">
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              Sector Record Comparison telemetries
            </h3>
            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mt-1">
              Top recorded score comparisons across all 16 micro-games
            </p>
          </div>

          <div className="h-[430px] w-full" id="records-chart-holder">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={recordsChartData}
                layout="vertical"
                margin={{ top: 10, right: 10, left: 35, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={true} stroke={chartThemeColors.grid} />
                <XAxis 
                  type="number" 
                  stroke={chartThemeColors.text} 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => v.toLocaleString()}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke={chartThemeColors.text} 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  width={110}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: chartThemeColors.tooltipBg, 
                    border: `2px solid ${chartThemeColors.tooltipBorder}`,
                    borderRadius: '16px',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [value.toLocaleString(), 'Global Elite Record']}
                />
                <Bar 
                  dataKey="record" 
                  radius={[0, 6, 6, 0]}
                  animationDuration={1200}
                >
                  {recordsChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quick list table overview beneath the horizontal comparison barchart */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
            {recordsChartData.slice(0, 4).map((record, index) => (
              <div key={record.name} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-200 dark:border-white/5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-[12px] italic shadow-sm" style={{ backgroundColor: record.color, color: '#ffffff' }}>
                  #{index + 1}
                </div>
                <div>
                  <h4 className="text-[9px] font-black text-slate-800 dark:text-slate-200 uppercase truncate max-w-[130px] leading-tight">
                    {record.name}
                  </h4>
                  <p className="text-[8px] font-black text-slate-450 uppercase tracking-widest">{record.category}</p>
                  <p className="text-xs font-black text-indigo-500 tabular-nums mt-0.5">{record.record.toLocaleString()} Juice</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VisualLeaderboard;
