import React, { useState, useEffect, useRef } from 'react';
import { Club, Player, MatchState, MatchEvent, PlayerMatchStats } from '../types';
import { MatchSimulator } from '../services/engine';
import { GAME_SPEED_MS } from '../constants';
import { Play, Pause, List, BarChart3, Users, X, Info, Star, ChevronDown, ChevronUp, Zap, AlertCircle } from 'lucide-react';

interface MatchViewProps {
  homeTeam: Club;
  awayTeam: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  onFinish: (homeScore: number, awayScore: number, matchStats: Record<string, PlayerMatchStats>) => void;
}

export const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, homePlayers, awayPlayers, onFinish }) => {
  const [activeTab, setActiveTab] = useState<'LOG' | 'STATS' | 'RATINGS'>('LOG');
  const [matchState, setMatchState] = useState<MatchState & { manOfTheMatchId?: string }>(() => ({
    isPlaying: false,
    minute: 0,
    homeScore: 0,
    awayScore: 0,
    events: [],
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeStats: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0 },
    awayStats: { possession: 50, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0 },
    playerStats: MatchSimulator.initMatchStats([...homePlayers, ...awayPlayers])
  }));

  const [tickDuration, setTickDuration] = useState(GAME_SPEED_MS);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [matchState.events, activeTab]);

  useEffect(() => {
    let timeoutId: any;
    const gameLoop = () => {
      if (!matchState.isPlaying || matchState.minute >= 90) return;
      setMatchState(prev => {
        const nextMinute = prev.minute + 1;
        const { event, teamStats, slowMotion } = MatchSimulator.simulateMinute(
          nextMinute, homeTeam, awayTeam, homePlayers, awayPlayers, prev.playerStats
        );
        let newEvents = prev.events;
        let newHomeScore = prev.homeScore;
        let newAwayScore = prev.awayScore;
        if (event) {
          newEvents = [...prev.events, event];
          if (event.type === 'GOAL') {
            if (event.teamId === homeTeam.id) newHomeScore++; else newAwayScore++;
          }
        }
        if (nextMinute === 90) newEvents.push({ minute: 90, type: 'WHISTLE', text: 'Final del partido.', importance: 'HIGH', intensity: 4 });
        setTickDuration(slowMotion ? 1200 : GAME_SPEED_MS);
        return { ...prev, minute: nextMinute, events: newEvents, homeScore: newHomeScore, awayScore: newAwayScore, isPlaying: nextMinute < 90, homeStats: teamStats.home, awayStats: teamStats.away };
      });
      timeoutId = setTimeout(gameLoop, tickDuration);
    };
    if (matchState.isPlaying) timeoutId = setTimeout(gameLoop, tickDuration);
    return () => clearTimeout(timeoutId);
  }, [matchState.isPlaying, matchState.minute, tickDuration]); 

  const handleInstantResult = () => {
    setMatchState(prev => {
      let currentMinute = prev.minute;
      let currentEvents = [...prev.events];
      let currentHomeScore = prev.homeScore;
      let currentAwayScore = prev.awayScore;
      let currentPlayerStats = { ...prev.playerStats };
      let currentTeamStats = { home: prev.homeStats, away: prev.awayStats };
      while (currentMinute < 90) {
        currentMinute++;
        const { event, teamStats } = MatchSimulator.simulateMinute(currentMinute, homeTeam, awayTeam, homePlayers, awayPlayers, currentPlayerStats);
        if (event) {
          currentEvents.push(event);
          if (event.type === 'GOAL') {
            if (event.teamId === homeTeam.id) currentHomeScore++; else currentAwayScore++;
          }
        }
        currentTeamStats = teamStats;
      }
      currentEvents.push({ minute: 90, type: 'WHISTLE', text: 'Final del partido.', importance: 'HIGH', intensity: 4 });
      return { ...prev, isPlaying: false, minute: 90, events: currentEvents, homeScore: currentHomeScore, awayScore: currentAwayScore, homeStats: currentTeamStats.home, awayStats: currentTeamStats.away, playerStats: currentPlayerStats };
    });
  };

  const getIntensityStyles = (intensity: number) => {
    switch (intensity) {
      case 1: return "text-[10px] leading-tight text-slate-500 opacity-80 font-medium";
      case 2: return "text-[12px] leading-snug text-slate-800 font-medium";
      case 3: return "text-[14px] leading-normal text-slate-900 font-bold";
      case 4: return "text-[18px] leading-tight text-white font-black italic tracking-tight";
      case 5: return "text-[32px] leading-[1.1] text-white font-black italic uppercase tracking-tighter drop-shadow-lg";
      default: return "text-[14px]";
    }
  };

  const renderStatsRow = (label: string, home: number, away: number) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-600 uppercase font-black"><span>{home}</span><span>{label}</span><span>{away}</span></div>
      <div className="h-2 bg-slate-300 rounded-full flex overflow-hidden border border-slate-500">
        <div className={`${homeTeam.primaryColor}`} style={{ width: `${(home/(home+away+0.1))*100}%` }}></div>
        <div className={`${awayTeam.primaryColor}`} style={{ width: `${(away/(home+away+0.1))*100}%` }}></div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-300 overflow-hidden font-sans">
      {/* Marcador Profesional */}
      <div className="bg-slate-100 p-6 border-b border-slate-500 shadow-sm flex justify-between items-center z-20">
        <div className="flex-1 text-center">
            <h2 className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">{homeTeam.name}</h2>
            <div className="text-6xl font-black text-slate-950 tabular-nums drop-shadow-sm">{matchState.homeScore}</div>
        </div>
        <div className="flex flex-col items-center px-10 border-x border-slate-300">
          <div className="bg-slate-950 text-white font-mono text-2xl px-5 py-1.5 rounded-sm mb-1 shadow-inner">{matchState.minute}'</div>
          <div className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] animate-pulse">EN VIVO</div>
        </div>
        <div className="flex-1 text-center">
            <h2 className="text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest">{awayTeam.name}</h2>
            <div className="text-6xl font-black text-slate-950 tabular-nums drop-shadow-sm">{matchState.awayScore}</div>
        </div>
      </div>

      <div className="flex bg-slate-200 border-b border-slate-500 shrink-0">
        <button onClick={() => setActiveTab('LOG')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'LOG' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100 shadow-inner' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-300/50'}`}>EVENTOS</button>
        <button onClick={() => setActiveTab('STATS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'STATS' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100 shadow-inner' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-300/50'}`}>ESTADÍSTICAS</button>
        <button onClick={() => setActiveTab('RATINGS')} className={`flex-1 py-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'RATINGS' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100 shadow-inner' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-300/50'}`}>CALIFICACIONES</button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-slate-400/20 shadow-inner">
        {activeTab === 'LOG' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll bg-[#cbd5e1]/50" ref={scrollRef}>
            {matchState.events.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40">
                    <AlertCircle size={48} className="mb-2" />
                    <p className="font-black uppercase text-xs tracking-widest">Esperando el inicio...</p>
                </div>
            )}
            {matchState.events.map((e, i) => {
               const team = e.teamId === homeTeam.id ? homeTeam : e.teamId === awayTeam.id ? awayTeam : null;
               const isSpecial = e.intensity >= 4;
               const isGoal = e.type === 'GOAL';
               
               const borderColorClass = team?.primaryColor.replace('bg-', 'border-') || 'border-slate-500';
               const textStyle = getIntensityStyles(e.intensity);
               
               return (
                 <div 
                    key={i} 
                    className={`p-4 border-l-[12px] rounded-sm shadow-md flex items-start gap-5 transition-all animate-in slide-in-from-right-4 duration-500 ${
                        isSpecial 
                        ? `bg-slate-900 border-double ${borderColorClass}` 
                        : 'bg-slate-200/80 border-slate-400'
                    } ${isGoal ? 'ring-4 ring-yellow-500/20 ring-inset' : ''}`}
                >
                    <span className={`font-mono font-black shrink-0 mt-1 ${isSpecial ? 'text-slate-500 text-sm' : 'text-slate-400 text-xs'}`}>{e.minute}'</span>
                    <div className="flex-1">
                        {isSpecial && team && (
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`inline-block px-2 py-0.5 rounded-sm text-[10px] font-black uppercase ${team.primaryColor} ${team.primaryColor === 'bg-white' ? 'text-slate-950 border border-slate-300' : 'text-white'}`}>
                                    {team.shortName}
                                </span>
                                {isGoal && <span className="text-yellow-500 font-black text-[10px] uppercase tracking-widest animate-bounce">¡GOLAZO!</span>}
                            </div>
                        )}
                        <span className={`${textStyle}`}>{e.text}</span>
                    </div>
                 </div>
               );
            })}
          </div>
        )}
        {activeTab === 'STATS' && (
          <div className="flex-1 p-10 space-y-10 overflow-y-auto">
             {renderStatsRow("Posesión %", matchState.homeStats.possession, matchState.awayStats.possession)}
             {renderStatsRow("Remates Totales", matchState.homeStats.shots, matchState.awayStats.shots)}
             {renderStatsRow("Tiros al Arco", matchState.homeStats.shotsOnTarget, matchState.awayStats.shotsOnTarget)}
             {renderStatsRow("Faltas Cometidas", matchState.homeStats.fouls, matchState.awayStats.fouls)}
             {renderStatsRow("Córners", matchState.homeStats.corners, matchState.awayStats.corners)}
          </div>
        )}
        {activeTab === 'RATINGS' && (
          <div className="flex-1 p-6 space-y-8 overflow-y-auto">
             <RatingSection team={homeTeam} players={homePlayers} stats={matchState.playerStats} />
             <div className="h-px bg-slate-300"></div>
             <RatingSection team={awayTeam} players={awayPlayers} stats={matchState.playerStats} />
          </div>
        )}
      </div>

      <div className="p-4 border-t border-slate-500 bg-slate-300 flex gap-3 shadow-lg z-30">
        {matchState.minute < 90 && (
          <button 
            onClick={() => setMatchState(p => ({...p, isPlaying: !p.isPlaying}))} 
            className={`flex-1 py-4 rounded-sm font-black text-xs uppercase tracking-[0.3em] shadow-md transition-all active:scale-95 ${matchState.isPlaying ? 'bg-slate-700 text-slate-200 hover:bg-slate-800' : 'bg-slate-950 text-white hover:bg-black'}`}
          >
            {matchState.isPlaying ? "PAUSA" : "REANUDAR"}
          </button>
        )}
        {matchState.minute < 90 && (
          <button 
            onClick={handleInstantResult} 
            className="px-8 py-4 border-2 border-slate-950 text-slate-950 hover:bg-slate-950 hover:text-white transition-all rounded-sm font-black text-xs uppercase tracking-widest shadow-md flex items-center gap-2"
            title="Resultado Instantáneo"
          >
            <Zap size={14} fill="currentColor" />
          </button>
        )}
        {matchState.minute >= 90 && (
          <button 
            onClick={() => onFinish(matchState.homeScore, matchState.awayScore, matchState.playerStats)} 
            className="flex-1 py-4 bg-slate-950 text-white hover:bg-black rounded-sm font-black text-xs uppercase tracking-[0.4em] shadow-xl animate-pulse"
          >
            FINALIZAR PARTIDO
          </button>
        )}
      </div>
    </div>
  );
};

const RatingSection = ({ team, players, stats }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3 mb-4">
        <div className={`w-1.5 h-6 ${team.primaryColor} border border-slate-400/20`}></div>
        <h3 className="text-xs font-black text-slate-600 uppercase tracking-widest">{team.name}</h3>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {players.map((p: any) => {
        const s = stats[p.id];
        if (!s) return null;
        return (
            <div key={p.id} className="flex justify-between items-center p-3 bg-slate-200 border border-slate-400 rounded-sm text-[11px] group hover:border-slate-800 transition-colors">
                <div className="flex items-center gap-2">
                    <span className="font-black text-slate-950 uppercase italic tracking-tight">{p.name}</span>
                    {s.goals > 0 && <span className="text-green-700 font-black border border-green-300 bg-green-50 px-1 rounded-sm text-[9px]">{s.goals} G</span>}
                    {s.assists > 0 && <span className="text-blue-700 font-black border border-blue-300 bg-blue-50 px-1 rounded-sm text-[9px]">{s.assists} A</span>}
                </div>
                <span className={`font-mono font-black text-sm px-2 py-0.5 rounded shadow-inner ${s.rating >= 7.5 ? 'bg-green-100 text-green-800' : s.rating < 6 ? 'bg-red-100 text-red-800' : 'bg-slate-300 text-slate-900'}`}>
                    {s.rating.toFixed(1)}
                </span>
            </div>
        );
        })}
    </div>
  </div>
);