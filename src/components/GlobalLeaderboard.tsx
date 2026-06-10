import React, { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend as RechartsLegend,
  Tooltip as RechartsTooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Trophy, 
  Percent, 
  TrendingUp, 
  Search, 
  Award, 
  Brain, 
  Zap, 
  Activity, 
  ChevronRight, 
  HelpCircle,
  Eye,
  Info
} from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { Game, Category, UserProfile } from '../types';
import { audioService } from '../services/audioService';
import { cloud } from '../services/cloud';

interface GlobalLeaderboardProps {
  games: Game[];
  highScores: Record<string, number>;
  userProfile: UserProfile;
  isDarkMode: boolean;
  onBack?: () => void;
}

const CATEGORY_ICONS: Record<string, string> = {
  [Category.Puzzle]: 'fa-route',
  [Category.Math]: 'fa-calculator',
  [Category.Arcade]: 'fa-shapes',
  [Category.Educational]: 'fa-book',
  [Category.BrainTeaser]: 'fa-brain',
  [Category.Wellness]: 'fa-lungs'
};

const CATEGORY_COLORS: Record<string, string> = {
  [Category.Puzzle]: '#3b82f6', // blue
  [Category.Math]: '#8b5cf6', // purple
  [Category.Arcade]: '#ec4899', // pink
  [Category.Educational]: '#10b981', // emerald
  [Category.BrainTeaser]: '#f59e0b', // amber
  [Category.Wellness]: '#a855f7' // purple/indigo
};

export const GlobalLeaderboard: React.FC<GlobalLeaderboardProps> = ({
  games,
  highScores,
  userProfile,
  isDarkMode,
  onBack
}) => {
  const [allScores, setAllScores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGameId, setSelectedGameId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

  // Fetch all scores across all players
  useEffect(() => {
    const fetchScores = async () => {
      setLoading(true);
      try {
        let scoresList: any[] = [];
        const provider = cloud.getDataProvider();
        const workerUrl = cloud.getWorkerUrl();

        if (provider === 'cloudflare' && workerUrl) {
          try {
            const baseUrl = workerUrl.endsWith('/') ? workerUrl.slice(0, -1) : workerUrl;
            const res = await fetch(`${baseUrl}/admin/all-scores`);
            if (res.ok) scoresList = await res.json();
          } catch (e) {
            console.error('Cloudflare fetch failed, falling back to Firebase:', e);
          }
        }

        if (scoresList.length === 0) {
          const snapshot = await getDocs(collection(db, 'scores'));
          scoresList = snapshot.docs.map(doc => doc.data());
        }

        setAllScores(scoresList);
      } catch (err) {
        console.error('Error loading global scores inside GlobalLeaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchScores();
  }, []);

  // Compute stats grouped by user
  const playerLeaderboard = useMemo(() => {
    const scoresByUser: Record<string, { username: string; avatar: string; score: number; deviceId: string; gamesPlayed: number; details: Record<string, number> }> = {};
    
    allScores.forEach(s => {
      const uid = s.deviceId || 'anonymous';
      if (!scoresByUser[uid]) {
        scoresByUser[uid] = {
          username: s.username || 'Anonymous',
          avatar: s.avatar || 'fa-user-ninja',
          score: 0,
          deviceId: uid,
          gamesPlayed: 0,
          details: {}
        };
      }
      scoresByUser[uid].score += (s.score || 0);
      scoresByUser[uid].gamesPlayed += 1;
      scoresByUser[uid].details[s.gameId] = s.score || 0;
    });

    // Sort users by total Mind Gross Score
    return Object.values(scoresByUser)
      .filter(p => p.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [allScores]);

  // Current user overall stats
  const curUserId = auth.currentUser?.uid || 'current_local';
  const currentUserOverallStats = useMemo(() => {
    const totalUserScoreList = Object.values(highScores).reduce((sum, s) => sum + s, 0);
    const index = playerLeaderboard.findIndex(p => p.deviceId === curUserId || p.username === userProfile.username);
    const rank = index !== -1 ? index + 1 : playerLeaderboard.length + 1;
    const totalPlayers = Math.max(playerLeaderboard.length, 1);
    
    // Percentile = ((Total Players - Rank) / Total Players) * 100
    const percentile = Math.max(1, Math.min(100, Math.round(((totalPlayers - (rank - 1)) / totalPlayers) * 100)));

    return {
      rank,
      totalPlayers,
      percentile,
      totalScore: totalUserScoreList
    };
  }, [playerLeaderboard, highScores, curUserId, userProfile.username]);

  // Compute maximum score and average score per game globally
  const gameStatsDb = useMemo(() => {
    const stats: Record<string, { average: number; max: number; allScores: number[] }> = {};
    
    games.forEach(g => {
      stats[g.id] = { average: 0, max: 0, allScores: [] };
    });

    allScores.forEach(s => {
      if (stats[s.gameId]) {
        stats[s.gameId].allScores.push(s.score || 0);
      }
    });

    games.forEach(g => {
      const arr = stats[g.id].allScores.sort((a, b) => a - b);
      const sum = arr.reduce((u, v) => u + v, 0);
      stats[g.id].average = arr.length > 0 ? Math.round(sum / arr.length) : 0;
      stats[g.id].max = arr.length > 0 ? arr[arr.length - 1] : 100; // avoid 0 divisor
    });

    return stats;
  }, [allScores, games]);

  // Radar chart cognitive categories normalizer
  const radarChartData = useMemo(() => {
    const categoriesList = Object.values(Category);
    
    return categoriesList.map(cat => {
      const catGames = games.filter(g => g.category === cat);
      let userCategorySum = 0;
      let globalAvgSum = 0;
      let globalMaxSum = 0;

      catGames.forEach(g => {
        const userScore = highScores[g.id] || 0;
        const gStats = gameStatsDb[g.id] || { average: 0, max: 100 };
        
        // Normalize against the global max record to fit cleanly between 0% and 100%
        const normalizedUser = gStats.max > 0 ? (userScore / gStats.max) * 100 : 0;
        const normalizedAvg = gStats.max > 0 ? (gStats.average / gStats.max) * 100 : 0;

        userCategorySum += normalizedUser;
        globalAvgSum += normalizedAvg;
        globalMaxSum += 100; // normalized max is always 100%
      });

      const count = catGames.length || 1;
      return {
        category: cat,
        'YOUR RATING': Math.round(userCategorySum / count),
        'GLOBAL AVERAGE': Math.round(globalAvgSum / count),
        'ELITE MAXIMUM': 100
      };
    });
  }, [games, highScores, gameStatsDb]);

  // Calculate the user's strongest sector dynamically
  const strongestSector = useMemo(() => {
    let bestOffset = -999;
    let strongest = 'None';
    
    radarChartData.forEach(item => {
      const offset = item['YOUR RATING'] - item['GLOBAL AVERAGE'];
      if (offset > bestOffset && item['YOUR RATING'] > 0) {
        bestOffset = offset;
        strongest = item.category;
      }
    });

    return strongest;
  }, [radarChartData]);

  // Selected game stats: Bell curve score distribution calculation
  const distributionData = useMemo(() => {
    if (selectedGameId === 'all') {
      // Use overall aggregate user scores
      const totalScoresList = playerLeaderboard.map(p => p.score);
      if (totalScoresList.length === 0) return [];
      
      const maxScore = Math.max(...totalScoresList, 1000);
      const minScore = Math.min(...totalScoresList, 0);
      const step = (maxScore - minScore) / 6;

      const bins = Array.from({ length: 6 }, (_, i) => {
        const start = minScore + i * step;
        const end = start + step;
        const label = `${Math.round(start).toLocaleString()} - ${Math.round(end).toLocaleString()}`;
        const count = totalScoresList.filter(s => s >= start && s <= end).length;
        
        return {
          binLabel: label,
          'Player Concentration': count,
          minVal: start,
          maxVal: end
        };
      });
      return bins;
    } else {
      // Use selected game score distribution
      const gameScores = allScores.filter(s => s.gameId === selectedGameId).map(s => s.score || 0);
      if (gameScores.length === 0) return [];

      const maxScore = Math.max(...gameScores, 100);
      const minScore = 0;
      const step = maxScore / 6;

      const bins = Array.from({ length: 6 }, (_, i) => {
        const start = i * step;
        const end = start + step;
        const label = `${Math.round(start).toLocaleString()} - ${Math.round(end).toLocaleString()}`;
        const count = gameScores.filter(s => s >= start && s <= end).length;

        return {
          binLabel: label,
          'Player Concentration': count,
          minVal: start,
          maxVal: end
        };
      });
      return bins;
    }
  }, [selectedGameId, allScores, playerLeaderboard]);

  // User position index in distribution bins
  const userScoreForSelectedGame = useMemo(() => {
    if (selectedGameId === 'all') {
      return currentUserOverallStats.totalScore;
    } else {
      return highScores[selectedGameId] || 0;
    }
  }, [selectedGameId, currentUserOverallStats.totalScore, highScores]);

  // Comparative trend score chart: Top player progression trend for selected game
  const progressionTrendData = useMemo(() => {
    if (selectedGameId === 'all') {
      return playerLeaderboard.slice(0, 10).map((p, idx) => ({
        name: `Rank ${idx + 1}`,
        username: p.username,
        'Mind Score': p.score,
        'YOUR SCORE': currentUserOverallStats.totalScore
      }));
    } else {
      const topScores = allScores
        .filter(s => s.gameId === selectedGameId)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);

      return topScores.map((s, idx) => ({
        name: `Rank ${idx + 1}`,
        username: s.username || 'Anonymous',
        'Record Score': s.score || 0,
        'YOUR SCORE': highScores[selectedGameId] || 0
      }));
    }
  }, [selectedGameId, allScores, playerLeaderboard, highScores, currentUserOverallStats.totalScore]);

  // Search filtered players
  const filteredPlayers = useMemo(() => {
    if (!searchQuery) return playerLeaderboard.slice(0, 50);
    const query = searchQuery.toLowerCase();
    return playerLeaderboard.filter(p => p.username.toLowerCase().includes(query) || p.deviceId.includes(query)).slice(0, 50);
  }, [playerLeaderboard, searchQuery]);

  // Dynamic colors depending on theme
  const colors = useMemo(() => ({
    grid: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.05)',
    axis: isDarkMode ? '#94a3b8' : '#475569',
    tooltipBg: isDarkMode ? '#1e293b' : '#ffffff',
    tooltipBorder: isDarkMode ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.15)',
    userLine: '#ef4444', // red reference index
    radarUser: '#6366f1',
    radarAvg: '#10b981',
    radarMax: '#94a3b8'
  }), [isDarkMode]);

  const selectedGameDetails = useMemo(() => {
    if (selectedGameId === 'all') return { name: 'Mind Score (All Games)', color: 'from-indigo-500 to-purple-600' };
    return games.find(g => g.id === selectedGameId) || { name: 'Unknown', color: 'from-slate-400 to-slate-600' };
  }, [selectedGameId, games]);

  return (
    <div className="flex flex-col gap-6 md:gap-8 animate-in fade-in duration-500 pb-12">
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 bg-white/40 dark:bg-slate-900/40 p-5 md:p-8 rounded-[2.5rem] border border-slate-200 dark:border-indigo-500/10 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-4 w-full lg:w-auto">
          {onBack && (
            <button
              onClick={() => {
                audioService.playNav();
                onBack();
              }}
              className="w-11 h-11 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-500 dark:text-slate-300 hover:text-indigo-500 hover:border-indigo-500/30 transition-all select-none shadow-sm cursor-pointer shrink-0"
              id="global-lb-back-btn"
            >
              <i className="fas fa-arrow-left"></i>
            </button>
          )}
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <Trophy className="w-8 h-8 text-amber-500 animate-pulse" />
              Global Leaderboard
            </h2>
            <p className="text-[10px] md:text-xs font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest leading-none mt-1">
              Neural Telemetry Analytics & Distribution Model
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-stretch lg:self-auto w-full lg:w-auto justify-end">
          <button
            onClick={() => {
              setShowExplanation(!showExplanation);
              audioService.playClick();
            }}
            className="flex items-center gap-2 h-11 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
            id="global-lb-info-btn"
          >
            <Info className="w-4 h-4" />
            <span>How rank is measured</span>
          </button>
        </div>
      </div>

      {showExplanation && (
        <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 p-6 md:p-8 rounded-[2.5rem] border border-indigo-500/20 text-slate-700 dark:text-slate-300 animate-in slide-in-from-top duration-300 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg uppercase italic text-slate-900 dark:text-white">Rank Calculation System</h3>
            <button 
              onClick={() => setShowExplanation(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
            >
              Close
            </button>
          </div>
          <p className="text-xs leading-relaxed">
            Your overall global position is derived from your <strong>Summed Aggregate High Scores</strong> across all 17 focus micro-games. 
            We pull live records from our secure databases to calculate the average density curves and percentile groups. 
            Your Sector Silhouette utilizes a <strong>Normalized Progression Scale</strong> where the absolute world record for each micro-game constitutes 100%, 
            allowing you to evaluate real cognitive imbalances against our complete global athlete base.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
            <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5">
              <span className="font-extrabold text-xs block text-slate-900 dark:text-white">COGNITIVE RADAR</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Compares average normalized performance indicators across core sectors (Puzzle, Math, Arcade, Wellness, Educational, Brain Teasers).</span>
            </div>
            <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5">
              <span className="font-extrabold text-xs block text-slate-900 dark:text-white">BELL CURVE DENSITY</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Maps absolute player count frequencies to pinpoint exactly what score clusters are common, and how close you are to elite cohorts.</span>
            </div>
            <div className="p-4 bg-white/40 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5">
              <span className="font-extrabold text-xs block text-slate-900 dark:text-white">RELATIVE PROGRESSION</span>
              <span className="text-[10px] text-slate-500 mt-1 block">Traces the exact variance offset between first-tier records down to tenth place, indicating the elite slope steepness.</span>
            </div>
          </div>
        </div>
      )}

      {/* Stats Quick Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {/* Card 1: Overall Rank */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 transition-all shadow-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">YOUR NATIONAL RANK</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white mt-1 italic tabular-nums">
              #{currentUserOverallStats.rank} <span className="text-[11px] font-bold text-slate-450 normal-case italic">/ {currentUserOverallStats.totalPlayers} Players</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Percentile Standings */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 transition-all shadow-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">ELITE STANDING PERCENTILE</span>
            <span className="text-3xl font-black text-rose-600 dark:text-rose-400 mt-1 italic tabular-nums">
              {currentUserOverallStats.percentile}% <span className="text-[10px] font-extrabold tracking-widest text-slate-500 dark:text-slate-400 uppercase">TOP TIER</span>
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Strongest Mind Sector */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 transition-all shadow-md flex items-center justify-between">
          <div className="flex flex-col overflow-hidden">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">DOMINANT COGNITIVE SECTOR</span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-2 uppercase truncate max-w-[190px]">
              {strongestSector}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Total Accumulated Score */}
        <div className="bg-white dark:bg-slate-900/60 p-6 rounded-3xl border border-slate-200 dark:border-white/5 hover:border-indigo-500/20 transition-all shadow-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-450">ACCUMULATED NET JUICE</span>
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 italic tabular-nums">
              {currentUserOverallStats.totalScore.toLocaleString()}
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Primary Analytics Section: Category Radar & Bell Curve Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left Column (2-spans): Radar Cognitive Sectors Shape */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 p-5 md:p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-5">
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">Sector Silhouettes</h3>
            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mt-0.5">
              Normalised sector capacities comparing profiles (0-100%)
            </p>
          </div>

          <div className="h-[280px] w-full mt-2 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarChartData}>
                <PolarGrid stroke={colors.grid} />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fill: colors.axis, fontSize: 8, fontWeight: 900 }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: colors.axis, fontSize: 8 }} 
                  axisLine={false}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `2px solid ${colors.tooltipBorder}`,
                    borderRadius: '16px',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value: any) => [`${value}%`]}
                />
                <Radar 
                  name="YOUR RATING" 
                  dataKey="YOUR RATING" 
                  stroke={colors.radarUser} 
                  fill={colors.radarUser} 
                  fillOpacity={0.25} 
                />
                <Radar 
                  name="GLOBAL AVERAGE" 
                  dataKey="GLOBAL AVERAGE" 
                  stroke={colors.radarAvg} 
                  fill={colors.radarAvg} 
                  fillOpacity={0.15} 
                />
                <RechartsLegend 
                  wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} 
                  iconSize={10}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            {radarChartData.map(item => {
              const icon = CATEGORY_ICONS[item.category] || 'fa-brain';
              const color = CATEGORY_COLORS[item.category] || '#6366f1';
              return (
                <div key={item.category} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-250/20 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: color }}>
                      <i className={`fas ${icon} text-[10px]`}></i>
                    </div>
                    <div className="truncate flex flex-col">
                      <span className="text-[9px] font-black uppercase tracking-tight text-slate-800 dark:text-slate-200 block truncate">{item.category}</span>
                      <span className="text-[8px] font-bold text-slate-450 block uppercase">Sector Average: {item['GLOBAL AVERAGE']}%</span>
                    </div>
                  </div>
                  <span className={`text-xs font-black tabular-nums transition-colors shrink-0 pl-1 ${item['YOUR RATING'] >= item['GLOBAL AVERAGE'] ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {item['YOUR RATING']}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (3-spans): Bell Curve Score Distribution */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/60 p-5 md:p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-505" />
                Score Concentration Curve
              </h3>
              <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mt-0.5">
                Frequency curves highlighting player clusters
              </p>
            </div>

            {/* Selector drop-down */}
            <select
              value={selectedGameId}
              onChange={(e) => {
                setSelectedGameId(e.target.value);
                audioService.playClick();
              }}
              className="bg-slate-50 dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 border-2 border-slate-200 dark:border-white/10 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500 transition-all cursor-pointer h-10 w-full sm:w-56"
            >
              <option value="all">🧠 SUM AGGREGATE SCORES</option>
              {games.map(g => (
                <option key={g.id} value={g.id}>{g.name.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="h-[260px] flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-slate-450 uppercase tracking-widest">Compiling curves...</p>
            </div>
          ) : distributionData.length === 0 ? (
            <div className="h-[260px] flex flex-col items-center justify-center text-slate-400 italic text-xs">
              Waiting for neural scores...
            </div>
          ) : (
            <div className="h-[260px] w-full pt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                  <XAxis 
                    dataKey="binLabel" 
                    stroke={colors.axis} 
                    fontSize={8} 
                    tickLine={false}
                    axisLine={false}
                    fontWeight="bold"
                  />
                  <YAxis 
                    stroke={colors.axis} 
                    fontSize={8} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `${v} pl`}
                    fontWeight="bold"
                  />
                  <RechartsTooltip
                    contentStyle={{
                      backgroundColor: colors.tooltipBg,
                      border: `2px solid ${colors.tooltipBorder}`,
                      borderRadius: '16px',
                      color: isDarkMode ? '#f8fafc' : '#0f172a',
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '11px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                    }}
                    separator=": "
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Player Concentration" 
                    stroke="#6366f1" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#areaGrad)" 
                    animationDuration={1000}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* User Score overlay label */}
          <div className="p-4 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <i className={`fas ${userProfile.avatar || 'fa-user-ninja'} text-sm`}></i>
              </div>
              <div className="text-center sm:text-left">
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">YOUR SCORE</span>
                  <span className="text-[8px] bg-indigo-650 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">SECURED</span>
                </div>
                <p className="text-[10px] text-slate-550 max-w-[280px] leading-tight mt-0.5">
                  Your current score for <span className="font-black italic text-indigo-500">{selectedGameDetails.name}</span>
                </p>
              </div>
            </div>
            
            <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter tabular-nums italic">
              {userScoreForSelectedGame.toLocaleString()} <span className="text-[10px] font-extrabold tracking-widest text-[#a1a1aa] normal-case">JUICE</span>
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Global Elite Slope & Full Ranking Lookup Search */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 md:gap-8">
        {/* Left Column (3-spans): Top Player Rank Variance (Line Chart) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900/60 p-5 md:p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              Elite Progression Tiers
            </h3>
            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mt-0.5">
              Score variance slope trace between rank #1 and #10 players
            </p>
          </div>

          <div className="h-[280px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={progressionTrendData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} />
                <XAxis 
                  dataKey="name" 
                  stroke={colors.axis} 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  fontWeight="bold"
                />
                <YAxis 
                  stroke={colors.axis} 
                  fontSize={8} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(v) => v.toLocaleString()}
                  fontWeight="bold"
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: colors.tooltipBg,
                    border: `2px solid ${colors.tooltipBorder}`,
                    borderRadius: '16px',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '11px',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }}
                  labelFormatter={(idx) => `Rank Node: ${idx}`}
                />
                <Line 
                  type="monotone" 
                  dataKey={selectedGameId === 'all' ? 'Mind Score' : 'Record Score'} 
                  stroke="#a855f7" 
                  strokeWidth={3} 
                  dot={{ r: 4, stroke: "#a855f7", strokeWidth: 2, fill: colors.tooltipBg }}
                  activeDot={{ r: 6 }}
                  animationDuration={1200}
                />
                <Line 
                  type="monotone" 
                  dataKey="YOUR SCORE" 
                  stroke={colors.userLine} 
                  strokeWidth={2} 
                  strokeDasharray="4 4"
                  dot={false}
                  activeDot={false}
                  animationDuration={800}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="text-[10px] uppercase font-bold text-center text-slate-400 border-t border-slate-200/40 dark:border-white/5 pt-3 leading-tight flex items-center justify-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <span>Top Tier Players Score Trend</span>
            <div className="w-4 h-0.5 border-t border-dashed border-red-500 ml-4 shrink-0" />
            <span>Your Personal Position Reference</span>
          </div>
        </div>

        {/* Right Column (2-spans): Player Ranks Grid with real-time Search */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900/60 p-5 md:p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col gap-4">
          <div className="flex flex-col">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-slate-200">
              Player Registry Lookup
            </h3>
            <p className="text-[9px] font-black text-slate-450 uppercase tracking-widest mt-0.5">
              Instant keyword filter across active mind-nodes
            </p>
          </div>

          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="SEARCH PLAYER USERNAME..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-950/80 focus:bg-white dark:focus:bg-slate-950 border-2 border-slate-200 dark:border-white/5 focus:border-indigo-500 rounded-xl py-2.5 pl-10 pr-4 text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white transition-all outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[200px] pr-1 flex flex-col gap-2 hover:scrollbar-thin">
            {filteredPlayers.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs italic">
                No matching active mind-node found.
              </div>
            ) : (
              filteredPlayers.map((p, idx) => {
                const rank = playerLeaderboard.findIndex(pX => pX.deviceId === p.deviceId) + 1;
                const isCurrentUser = p.deviceId === curUserId || p.username === userProfile.username;
                
                return (
                  <div 
                    key={p.deviceId} 
                    className={`p-3 rounded-2xl flex items-center justify-between border transition-all ${
                      isCurrentUser 
                        ? 'bg-indigo-500/10 dark:bg-indigo-500/20 border-indigo-500/30' 
                        : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Rank tag */}
                      <span className={`w-5 text-[10px] font-black text-center shrink-0 italic ${
                        rank === 1 ? 'text-amber-500' : rank === 2 ? 'text-slate-400' : rank === 3 ? 'text-orange-500' : 'text-slate-450'
                      }`}>
                        #{rank}
                      </span>

                      {/* Avatar container */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-indigo-500 shrink-0 ${
                        isCurrentUser ? 'bg-indigo-500/20 ring-2 ring-indigo-500/40' : 'bg-indigo-500/10'
                      }`}>
                        <i className={`fas ${p.avatar || 'fa-user-ninja'} text-xs`}></i>
                      </div>

                      {/* Username */}
                      <div className="flex flex-col truncate pl-0.5">
                        <span className={`text-xs font-black uppercase italic ${isCurrentUser ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {p.username || 'Anonymous'}
                        </span>
                        <span className="text-[8px] font-bold text-slate-450 uppercase leading-none mt-0.5">
                          {p.gamesPlayed} GAMES PLAYED
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 pl-1">
                      {isCurrentUser && (
                        <span className="text-[7px] bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-1.5 py-0.5 rounded-[5px] font-extrabold tracking-widest uppercase leading-none">
                          YOU
                        </span>
                      )}
                      <span className={`text-sm font-black tabular-nums ${isCurrentUser ? 'text-indigo-650 dark:text-indigo-300' : 'text-indigo-550 dark:text-slate-200'}`}>
                        {p.score.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalLeaderboard;
