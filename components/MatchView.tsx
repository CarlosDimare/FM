
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Club, Player, MatchState, MatchEvent, PlayerMatchStats, Position } from '../types';
import { MatchSimulator } from '../services/engine';
import { GAME_SPEED_MS } from '../constants';
import { Play, Pause, List, BarChart3, Users, Zap, AlertCircle, CheckCircle } from 'lucide-react';

// Reuse POS_MAP logic locally or import. Recreating for self-containment in this component.
const POS_MAP: Record<number, { top: string; left: string }> = {
   0: { top: "90%", left: "50%" }, // GK
   1: { top: "75%", left: "15%" }, // DR
   2: { top: "75%", left: "30%" }, // DCR
   3: { top: "75%", left: "50%" }, // DC
   4: { top: "75%", left: "70%" }, // DCL
   5: { top: "75%", left: "85%" }, // DL
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
      case 5: return "text-[24px] leading-[1.1] font-black italic uppercase tracking-tighter drop-shadow-sm";
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
      {renderControls()}
      
      {/* Marcador Profesional */}
      <div className="bg-slate-100 p-4 border-b border-slate-500 shadow-sm flex items-center z-20 relative">
        <div className="flex-1 flex items-center justify-between">
            <div className="text-center w-1/3">
                <h2 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest truncate">{homeTeam.name}</h2>
                <div className="text-4xl md:text-6xl font-black text-slate-950 tabular-nums drop-shadow-sm">{matchState.homeScore}</div>
            </div>
            
            <div className="flex flex-col items-center px-2">
                <div className="bg-slate-950 text-white font-mono text-xl md:text-2xl px-4 py-1 rounded-sm mb-1 shadow-inner min-w-[3.5rem] text-center">{matchState.minute}'</div>
                <div className="text-[8px] md:text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] animate-pulse">EN VIVO</div>
            </div>
            
            <div className="text-center w-1/3">
                <h2 className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase mb-1 tracking-widest truncate">{awayTeam.name}</h2>
                <div className="text-4xl md:text-6xl font-black text-slate-950 tabular-nums drop-shadow-sm">{matchState.awayScore}</div>
            </div>
        </div>
      </div>

      <div className="flex bg-slate-200 border-b border-slate-500 shrink-0 h-12">
        <button onClick={() => setActiveTab('LOG')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'LOG' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100' : 'text-slate-400 hover:text-slate-700'}`}>
            <List size={20} />
        </button>
        <button onClick={() => setActiveTab('STATS')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'STATS' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100' : 'text-slate-400 hover:text-slate-700'}`}>
            <BarChart3 size={20} />
        </button>
        <button onClick={() => setActiveTab('RATINGS')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'RATINGS' ? 'text-slate-950 border-b-4 border-slate-950 bg-slate-100' : 'text-slate-400 hover:text-slate-700'}`}>
            <Users size={20} />
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
            {matchState.events.map((e, i) => {
               const team = e.teamId === homeTeam.id ? homeTeam : e.teamId === awayTeam.id ? awayTeam : null;
               const isSpecial = e.intensity >= 4;
               const isGoal = e.type === 'GOAL';
               
               // Use team colors for background and text
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
            })}
          </div>
        )}
        {activeTab === 'STATS' && (
          <div className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto">
             {renderStatsRow("Posesión %", matchState.homeStats.possession, matchState.awayStats.possession)}
             {renderStatsRow("Remates Totales", matchState.homeStats.shots, matchState.awayStats.shots)}
             {renderStatsRow("Tiros al Arco", matchState.homeStats.shotsOnTarget, matchState.awayStats.shotsOnTarget)}
             {renderStatsRow("Faltas Cometidas", matchState.homeStats.fouls, matchState.awayStats.fouls)}
             {renderStatsRow("Córners", matchState.homeStats.corners, matchState.awayStats.corners)}
          </div>
        )}
        {activeTab === 'RATINGS' && (
          <div className="flex-1 overflow-y-auto bg-slate-200">
             <PitchRatingView team={homeTeam} players={homePlayers} stats={matchState.playerStats} />
             <div className="h-4 bg-slate-300 border-y border-slate-400"></div>
             <PitchRatingView team={awayTeam} players={awayPlayers} stats={matchState.playerStats} isAway />
          </div>
        )}
      </div>
    </div>
  );
};

const PitchRatingView = ({ team, players, stats, isAway }: { team: Club, players: Player[], stats: Record<string, PlayerMatchStats>, isAway?: boolean }) => {
   // Identify starters and subs who played (subs have stats or were subbed in)
   // For simulation simplicity, we rely on 'tacticalPosition' being present for starters.
   // Subs that entered the game are usually swapped in the engine array, but here we passed initial arrays.
   // Actually engine updates the arrays in place.
   
   const starters = players.filter(p => p.tacticalPosition !== undefined).sort((a,b) => (a.tacticalPosition||0) - (b.tacticalPosition||0));
   const subs = players.filter(p => p.tacticalPosition === undefined && stats[p.id] && stats[p.id].participationPhrase); // Crude way to detect participation if stats exist

   return (
      <div className="p-4 bg-slate-200">
         <div className={`p-2 mb-4 border-l-4 ${isAway ? 'border-red-500' : 'border-blue-500'} bg-slate-100 flex items-center justify-between`}>
            <span className="font-black text-slate-900 uppercase tracking-widest">{team.name}</span>
            <div className={`w-3 h-3 rounded-full ${team.primaryColor}`}></div>
         </div>

         <div className="flex flex-col items-center">
            {/* Pitch Container */}
            <div className="relative w-full max-w-[300px] aspect-[68/105] bg-[#1e3a29] border-4 border-white shadow-xl rounded-sm mb-4">
               {/* SVG Pitch Lines */}
               <svg width="100%" height="100%" viewBox="0 0 68 105" className="absolute inset-0 w-full h-full opacity-60">
                  <rect width="100%" height="100%" fill="none" />
                  <g fill="none" stroke="white" strokeWidth="1">
                     <rect x="2" y="2" width="64" height="101" />
                     <line x1="2" y1="52.5" x2="66" y2="52.5" />
                     <circle cx="34" cy="52.5" r="9" />
                     <rect x="19" y="2" width="30" height="16" />
                     <rect x="19" y="87" width="30" height="16" />
                  </g>
               </svg>

               {starters.map(p => {
                  const s = stats[p.id];
                  const coords = getPosStyle(p.tacticalPosition || 0, p.positions[0]);
                  const rating = s ? s.rating.toFixed(1) : '-';
                  const ratingColor = s && s.rating >= 7.5 ? 'bg-green-500' : s && s.rating < 6 ? 'bg-red-500' : 'bg-slate-800';
                  
                  return (
                     <div 
                        key={p.id}
                        className="absolute flex flex-col items-center -translate-x-1/2 -translate-y-1/2 transition-all"
                        style={{ top: coords.top, left: coords.left }}
                     >
                        <div className={`w-8 h-8 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[9px] font-black text-white ${team.primaryColor}`}>
                           {p.positions[0].substring(0, 2)}
                        </div>
                        <div className={`mt-0.5 px-1 rounded-sm text-[8px] font-black text-white ${ratingColor} shadow border border-white/20`}>
                           {rating}
                        </div>
                        <span className="text-[7px] font-bold text-white uppercase drop-shadow-md truncate max-w-[60px] bg-black/40 px-1 rounded mt-0.5">{p.name.split(' ').pop()}</span>
                     </div>
                  );
               })}
            </div>

            {/* Substitutes List */}
            {subs.length > 0 && (
               <div className="w-full max-w-[300px] bg-slate-100 p-2 rounded-sm border border-slate-300">
                  <h4 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-300 pb-1">Suplentes Ingresados</h4>
                  <div className="space-y-1">
                     {subs.map(p => {
                        const s = stats[p.id];
                        const rating = s ? s.rating.toFixed(1) : '-';
                        const ratingColor = s && s.rating >= 7.5 ? 'text-green-600' : s && s.rating < 6 ? 'text-red-600' : 'text-slate-600';
                        return (
                           <div key={p.id} className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-slate-900 uppercase">{p.name}</span>
                              <span className={`font-mono font-black ${ratingColor}`}>{rating}</span>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}
         </div>
      </div>
   );
};
