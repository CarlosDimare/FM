
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Club, Player, MatchState, MatchEvent, PlayerMatchStats, Position } from '../types';
import { MatchSimulator } from '../services/engine';
import { GAME_SPEED_MS } from '../constants';
import { Play, Pause, List, BarChart3, Users, Zap, AlertCircle, CheckCircle, Shield, Table } from 'lucide-react';
import { MatchStatsTable } from './MatchStatsTable';

// Reuse POS_MAP logic locally or import. Recreating for self-containment in this component.
const POS_MAP: Record<number, { top: string; left: string }> = {
   0: { top: "90%", left: "50%" }, // GK
   1: { top: "75%", left: "15%" }, // DR
   2: { top: "75%", left: "30%" }, // DCR
   3: { top: "75%", left: "50%" }, // DC
   4: { top: "75%", left: "70%" }, // DCL
   5: { top: "75%", left: "85%" }, // DR
   6: { top: "75%", left: "25%" }, // DLC
   7: { top: "75%", left: "75%" }, // DRC
   
   8: { top: "60%", left: "50%" }, // DMC
   9: { top: "60%", left: "30%" }, // DML
   10: { top: "60%", left: "70%" }, // DMR
   
   11: { top: "45%", left: "15%" }, // ML
   12: { top: "45%", left: "30%" }, // MCL
   13: { top: "45%", left: "50%" }, // MC
   14: { top: "45%", left: "70%" }, // MCR
   15: { top: "45%", left: "85%" }, // MR
   
   16: { top: "30%", left: "20%" }, // AML
   17: { top: "30%", left: "50%" }, // AMC
   18: { top: "30%", left: "80%" }, // AMR
   
   19: { top: "15%", left: "30%" }, // STL
   20: { top: "15%", left: "70%" }, // STR
   26: { top: "15%", left: "50%" }, // STC
   
   // Fallbacks for common preset indices
   27: { top: "15%", left: "35%" }, 
   28: { top: "15%", left: "65%" },
   29: { top: "15%", left: "50%" },
   30: { top: "15%", left: "50%" } 
};

// Heuristic fallback if tacticalPosition is missing (should mostly be there for starters)
const getPosStyle = (idx: number, pos: string) => {
   if (POS_MAP[idx]) return POS_MAP[idx];
   // Simple fallback based on string position
   if (pos.includes('GK')) return { top: "90%", left: "50%" };
   if (pos.includes('D')) return { top: "75%", left: "50%" };
   if (pos.includes('M')) return { top: "45%", left: "50%" };
   if (pos.includes('ST') || pos.includes('A')) return { top: "15%", left: "50%" };
   return { top: "50%", left: "50%" };
};

interface MatchViewProps {
  homeTeam: Club;
  awayTeam: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  onFinish: (homeScore: number, awayScore: number, matchStats: Record<string, PlayerMatchStats>) => void;
  currentDate: Date;
}

export const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, homePlayers, awayPlayers, onFinish, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'LOG' | 'STATS' | 'PLANTILLA'>('LOG');
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
     // Log initial analysis on mount
     MatchSimulator.analyzeMatchup(homeTeam, awayTeam, homePlayers, awayPlayers);
  }, []);

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

  const renderControls = () => {
    const headerNode = document.getElementById('header-actions');
    if (!headerNode) return null;

    return createPortal(
      <div className="flex gap-1">
        {matchState.minute < 90 && (
            <>
                <button 
                    onClick={() => setMatchState(p => ({...p, isPlaying: !p.isPlaying}))} 
                    className={`h-8 px-3 rounded-sm shadow-md flex items-center justify-center transition-all border border-black/20 ${matchState.isPlaying ? 'bg-slate-300 text-slate-800 hover:bg-slate-400' : 'bg-green-600 text-white hover:bg-green-700'}`}
                    title={matchState.isPlaying ? "Pausar" : "Reanudar"}
                >
                    {matchState.isPlaying ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>}
                </button>
                <button 
                    onClick={handleInstantResult} 
                    className="h-8 px-3 bg-slate-800 text-yellow-400 rounded-sm shadow-md flex items-center justify-center hover:bg-black transition-all border border-black/20"
                    title="Resultado Instantáneo"
                >
                    <Zap size={14} fill="currentColor"/>
                </button>
            </>
        )}
        {matchState.minute >= 90 && (
            <button 
                onClick={() => onFinish(matchState.homeScore, matchState.awayScore, matchState.playerStats)} 
                className="h-8 px-3 bg-slate-950 text-white rounded-sm shadow-md flex items-center justify-center hover:bg-black animate-pulse border border-white/20"
                title="Finalizar Partido"
            >
                <CheckCircle size={16} />
            </button>
        )}
      </div>,
      headerNode
    );
  };

  const getIntensityStyles = (intensity: number, teamColorClass?: string) => {
    switch (intensity) {
      case 1: return "text-[10px] leading-tight font-medium opacity-80";
      case 2: return "text-[12px] leading-snug font-bold";
      case 3: return "text-[14px] leading-normal font-black";
      case 4: return "text-[16px] leading-tight font-black italic tracking-tight";
      case 5: return "text-[24px] rounded-sm uppercase tracking-tighter drop-shadow-sm font-black italic";
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

  const renderEventCard = (e: MatchEvent, i: number) => {
    const team = e.teamId === homeTeam.id ? homeTeam : e.teamId === awayTeam.id ? awayTeam : null;
    const isGoal = e.type === 'GOAL';
    
    const bgClass = team ? team.primaryColor : 'bg-slate-800';
    const textClass = team ? team.secondaryColor : 'text-slate-300';
    const borderClass = team ? team.primaryColor.replace('bg-', 'border-') : 'border-slate-600';

    return (
      <div 
         key={i} 
         className={`p-4 border-l-[8px] rounded-sm shadow-md flex items-start gap-4 transition-all animate-in slide-in-from-right-4 duration-500 ${bgClass} ${borderClass} ${isGoal ? 'ring-4 ring-yellow-500/50 ring-inset' : ''}`}
     >
         <span className={`font-mono font-black shrink-0 mt-1 opacity-70 ${textClass} text-xs`}>{e.minute}'</span>
         <div className="flex-1">
             <span className={`${getIntensityStyles(e.intensity)} ${textClass} block`}>{e.text}</span>
             {isGoal && <div className="mt-2 text-yellow-400 font-black text-[10px] uppercase tracking-widest animate-bounce">¡GOLAZO!</div>}
         </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-300 overflow-hidden font-sans">
      {renderControls()}
      
      {/* FM08-Style LED Scoreboard */}
      <div className="w-full flex h-14 md:h-20 shadow-xl z-20 relative bg-slate-800 border-b-2 border-slate-600">
        {/* HOME TEAM */}
        <div className={`flex-1 flex items-center justify-end pr-4 md:pr-8 relative overflow-hidden ${homeTeam.primaryColor}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/10"></div>
            {/* Background Shield for style */}
            <Shield className="absolute -left-6 top-1/2 -translate-y-1/2 w-32 h-32 text-black/10 rotate-12" strokeWidth={2} />
            
            <span className="relative z-10 font-black text-white text-lg md:text-3xl uppercase tracking-tight drop-shadow-md mr-2">
                {homeTeam.name}
            </span>
            <Shield className="relative z-10 w-10 h-10 md:w-14 md:h-14 text-white opacity-80 fill-white/10 hidden sm:block" strokeWidth={1.5} />
        </div>

        {/* LED BOARD */}
        <div className="shrink-0 bg-[#111] px-3 md:px-8 flex items-center gap-4 md:gap-8 border-x-4 border-yellow-500/80 relative"
             style={{
                 backgroundImage: 'radial-gradient(#333 1.5px, transparent 1.5px)',
                 backgroundSize: '4px 4px'
             }}
        >
           <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none"></div>
           
           {/* Home Score */}
           <span className="relative z-10 font-mono font-bold text-3xl md:text-5xl text-yellow-400 tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
              {matchState.homeScore}
           </span>

           {/* Time */}
           <div className="relative z-10 flex flex-col items-center justify-center">
              <span className="font-mono font-bold text-lg md:text-xl text-slate-200 tracking-widest tabular-nums">
                 {matchState.minute < 10 ? `0${matchState.minute}` : matchState.minute}:00
              </span>
              {matchState.isPlaying && <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse mt-1"></span>}
           </div>

           {/* Away Score */}
           <span className="relative z-10 font-mono font-bold text-3xl md:text-5xl text-yellow-400 tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
              {matchState.awayScore}
           </span>
        </div>

        {/* AWAY TEAM */}
        <div className={`flex-1 flex items-center justify-start pl-4 md:pl-8 relative overflow-hidden ${awayTeam.primaryColor}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/10"></div>
            {/* Background Shield for style */}
            <Shield className="absolute -right-6 top-1/2 -translate-y-1/2 w-32 h-32 text-black/10 -rotate-12" strokeWidth={2} />

            <Shield className="relative z-10 w-10 h-10 md:w-14 md:h-14 text-white opacity-80 fill-white/10 hidden sm:block" strokeWidth={1.5} />
            <span className="relative z-10 font-black text-white text-lg md:text-3xl uppercase tracking-tight drop-shadow-md ml-2">
                {awayTeam.name}
            </span>
        </div>
      </div>

      <div className="flex bg-slate-200 border-b border-slate-500 shrink-0 h-12">
        <button onClick={() => setActiveTab('LOG')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'LOG' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100' : 'text-slate-400 hover:text-slate-700'}`}>
            <List size={20} />
        </button>
        <button onClick={() => setActiveTab('STATS')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'STATS' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100' : 'text-slate-400 hover:text-slate-700'}`}>
            <BarChart3 size={20} />
        </button>
        <button onClick={() => setActiveTab('PLANTILLA')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'PLANTILLA' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100' : 'text-slate-400 hover:text-slate-700'}`}>
            <Table size={20} />
        </button>
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
            {matchState.events.map((e, i) => renderEventCard(e, i))}
          </div>
        )}
        {activeTab === 'STATS' && (
          <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto flex flex-col">
             <div className="space-y-8 flex-1">
                {renderStatsRow("Posesión %", matchState.homeStats.possession, matchState.awayStats.possession)}
                {renderStatsRow("Remates Totales", matchState.homeStats.shots, matchState.awayStats.shots)}
                {renderStatsRow("Tiros al Arco", matchState.homeStats.shotsOnTarget, matchState.awayStats.shotsOnTarget)}
                {renderStatsRow("Faltas Cometidas", matchState.homeStats.fouls, matchState.awayStats.fouls)}
                {renderStatsRow("Córners", matchState.homeStats.corners, matchState.awayStats.corners)}
             </div>

             <div className="mt-auto pt-4 border-t border-slate-400">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600 mb-2">Últimos Eventos</h4>
                <div className="space-y-2">
                    {matchState.events.slice(-3).reverse().map((e, i) => renderEventCard(e, i))}
                    {matchState.events.length === 0 && <span className="text-xs text-slate-500 italic">El partido está por comenzar...</span>}
                </div>
             </div>
          </div>
        )}
        {activeTab === 'PLANTILLA' && (
          <div className="flex-1 overflow-y-auto bg-slate-200 p-2 md:p-4">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                {/* Home Team Stats */}
                <div className="flex flex-col gap-2">
                   <h3 className={`text-sm font-black uppercase tracking-widest px-2 border-l-4 ${homeTeam.primaryColor.replace('bg-','border-')} text-slate-800`}>{homeTeam.name}</h3>
                   <MatchStatsTable players={homePlayers} stats={matchState.playerStats} club={homeTeam} />
                </div>
                
                {/* Away Team Stats */}
                <div className="flex flex-col gap-2">
                   <h3 className={`text-sm font-black uppercase tracking-widest px-2 border-l-4 ${awayTeam.primaryColor.replace('bg-','border-')} text-slate-800`}>{awayTeam.name}</h3>
                   <MatchStatsTable players={awayPlayers} stats={matchState.playerStats} club={awayTeam} />
                </div>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};
