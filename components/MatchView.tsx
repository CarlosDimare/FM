
import React, { useState, useEffect, useRef } from 'react';
import { Club, Player, MatchState, MatchEvent } from '../types';
import { MatchSimulator } from '../services/engine';
import { GAME_SPEED_MS } from '../constants';
import { Play, Pause, List, BarChart3, Users, X, Info, Star, ChevronDown, ChevronUp, Zap } from 'lucide-react';

interface MatchViewProps {
  homeTeam: Club;
  awayTeam: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  onFinish: (homeScore: number, awayScore: number) => void;
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
  
  // State for expanding player details in Ratings tab
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

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
            if (event.teamId === homeTeam.id) newHomeScore++;
            else newAwayScore++;
          }
        }
        
        // Calculate Man of the Match logic
        let bestPlayerId = undefined;
        let bestScore = -1;
        [...homePlayers, ...awayPlayers].forEach(p => {
           const s = prev.playerStats[p.id];
           if (s) {
              const score = s.rating + (s.goals * 2) + s.assists;
              if (score > bestScore) {
                 bestScore = score;
                 bestPlayerId = p.id;
              }
           }
        });

        if (nextMinute === 90) newEvents.push({ minute: 90, type: 'WHISTLE', text: 'Final del partido.', importance: 'HIGH', intensity: 4 });
        
        const nextSpeed = slowMotion ? 1200 : GAME_SPEED_MS;
        setTickDuration(nextSpeed);

        return { 
           ...prev, 
           minute: nextMinute, 
           events: newEvents, 
           homeScore: newHomeScore, 
           awayScore: newAwayScore, 
           isPlaying: nextMinute < 90, 
           homeStats: teamStats.home, 
           awayStats: teamStats.away,
           manOfTheMatchId: bestPlayerId
        };
      });

      timeoutId = setTimeout(gameLoop, tickDuration);
    };

    if (matchState.isPlaying) {
       timeoutId = setTimeout(gameLoop, tickDuration);
    }

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

      // Stop current normal playback
      const isActuallyPlaying = false;

      while (currentMinute < 90) {
        currentMinute++;
        const { event, teamStats } = MatchSimulator.simulateMinute(
          currentMinute, homeTeam, awayTeam, homePlayers, awayPlayers, currentPlayerStats
        );
        
        if (event) {
          currentEvents.push(event);
          if (event.type === 'GOAL') {
            if (event.teamId === homeTeam.id) currentHomeScore++;
            else currentAwayScore++;
          }
        }
        currentTeamStats = teamStats;
      }

      currentEvents.push({ minute: 90, type: 'WHISTLE', text: 'Final del partido (Simulación Instantánea).', importance: 'HIGH', intensity: 4 });

      // Calculate Man of the Match
      let bestPlayerId = undefined;
      let bestScore = -1;
      [...homePlayers, ...awayPlayers].forEach(p => {
         const s = currentPlayerStats[p.id];
         if (s) {
            const score = s.rating + (s.goals * 2) + s.assists;
            if (score > bestScore) {
               bestScore = score;
               bestPlayerId = p.id;
            }
         }
      });

      return {
        ...prev,
        isPlaying: isActuallyPlaying,
        minute: 90,
        events: currentEvents,
        homeScore: currentHomeScore,
        awayScore: currentAwayScore,
        homeStats: currentTeamStats.home,
        awayStats: currentTeamStats.away,
        manOfTheMatchId: bestPlayerId
      };
    });
  };

  const renderStatsRow = (label: string, home: number, away: number) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] text-slate-400 uppercase font-bold"><span>{home}</span><span>{label}</span><span>{away}</span></div>
      <div className="h-1.5 bg-slate-700 rounded-full flex overflow-hidden">
        <div className={`${homeTeam.primaryColor}`} style={{ width: `${(home/(home+away+0.1))*100}%` }}></div>
        <div className={`${awayTeam.primaryColor}`} style={{ width: `${(away/(home+away+0.1))*100}%` }}></div>
      </div>
    </div>
  );

  const getEventTeam = (teamId?: string) => {
     if (teamId === homeTeam.id) return homeTeam;
     if (teamId === awayTeam.id) return awayTeam;
     return null;
  };

  const getEventStyle = (event: MatchEvent) => {
     let sizeClass = "text-xs py-2";
     let animationClass = "";
     const baseClass = `border-l-4 rounded-r px-4 transition-all duration-300`;

     switch (event.intensity) {
        case 1: sizeClass = "text-[10px] py-1 opacity-80"; break; 
        case 2: sizeClass = "text-xs py-2"; break;
        case 3: sizeClass = "text-base font-bold py-3"; animationClass="animate-in fade-in slide-in-from-right-2"; break;
        case 4: sizeClass = "text-xl font-black py-4 shadow-lg"; animationClass="animate-pulse"; break;
        case 5: sizeClass = "text-4xl font-black py-6 uppercase tracking-tight shadow-2xl"; animationClass="animate-bounce"; break;
     }

     return { className: `${baseClass} ${sizeClass} ${animationClass}` };
  };

  const renderEvent = (e: MatchEvent, i: number) => {
      const team = getEventTeam(e.teamId);
      const styleProps = getEventStyle(e);
      const isSpecial = e.intensity && e.intensity >= 3;
      
      const teamBgColor = team ? team.primaryColor : 'bg-slate-700';
      const teamBorderColor = team ? team.primaryColor.replace('bg-', 'border-') : 'border-slate-600';
      const teamTextColor = team ? team.secondaryColor : 'text-slate-300';
      
      let classes = `${styleProps.className} `;
      
      if (isSpecial) {
         classes += `${teamBgColor} ${teamTextColor} ${teamBorderColor}`;
      } else {
         classes += `bg-slate-800/50 ${teamTextColor} ${teamBorderColor}`;
      }

      return (
        <div 
           key={i} 
           className={classes}
        >
          <div className="flex items-center gap-3">
             <span className={`font-mono font-bold opacity-60`}>{e.minute}'</span>
             <span className="leading-tight">{e.text}</span>
          </div>
        </div>
      );
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 overflow-hidden relative">
      {/* Scoreboard */}
      <div className="bg-slate-800 p-4 md:p-6 border-b border-slate-700 shadow-xl flex justify-between items-center z-20">
        <div className="flex-1 text-center truncate">
          <h2 className="text-sm md:text-xl font-bold text-white truncate">{homeTeam.shortName}</h2>
          <div className="text-3xl md:text-5xl font-black text-white">{matchState.homeScore}</div>
        </div>
        <div className="flex flex-col items-center px-4 shrink-0">
          <div className="bg-slate-900 text-yellow-500 font-mono text-lg md:text-xl px-2 py-1 rounded border border-slate-700 mb-1">{matchState.minute}'</div>
          <div className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">LIVE</div>
        </div>
        <div className="flex-1 text-center truncate">
          <h2 className="text-sm md:text-xl font-bold text-white truncate">{awayTeam.shortName}</h2>
          <div className="text-3xl md:text-5xl font-black text-white">{matchState.awayScore}</div>
        </div>
      </div>

      <div className="flex border-b overflow-x-auto scrollbar-hide" style={{ backgroundColor: '#1e293b', borderColor: '#999' }}>
        <button onClick={() => setActiveTab('LOG')} className="flex-1 p-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: activeTab === 'LOG' ? '#666' : '#64748b', borderBottom: activeTab === 'LOG' ? '2px solid #666' : 'none' }}>Relato</button>
        <button onClick={() => setActiveTab('STATS')} className="flex-1 p-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: activeTab === 'STATS' ? '#666' : '#64748b', borderBottom: activeTab === 'STATS' ? '2px solid #666' : 'none' }}>Estadísticas</button>
        <button onClick={() => setActiveTab('RATINGS')} className="flex-1 p-3 text-[10px] font-bold uppercase tracking-wider" style={{ color: activeTab === 'RATINGS' ? '#666' : '#64748b', borderBottom: activeTab === 'RATINGS' ? '2px solid #666' : 'none' }}>Puntos</button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'LOG' && (
          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-slate-950 scrollbar-hide" ref={scrollRef}>
            {matchState.events.map((e, i) => renderEvent(e, i))}
          </div>
        )}
        {activeTab === 'STATS' && (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-900 flex flex-col gap-6">
             <div className="space-y-6">
                {renderStatsRow("Posesión %", matchState.homeStats.possession, matchState.awayStats.possession)}
                {renderStatsRow("Remates", matchState.homeStats.shots, matchState.awayStats.shots)}
                {renderStatsRow("Al Arco", matchState.homeStats.shotsOnTarget, matchState.awayStats.shotsOnTarget)}
             </div>
             
             {/* Last 3 Events Section */}
             <div className="mt-auto border-t border-slate-800 pt-4">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Últimas Incidencias</h4>
                <div className="space-y-1">
                   {matchState.events.slice(-3).map((e, i) => renderEvent(e, i + 9999))}
                </div>
             </div>
          </div>
        )}
        {activeTab === 'RATINGS' && (
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-900 space-y-4">
            <div className="space-y-1.5">
               <h3 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 flex justify-between">
                  <span>{homeTeam.shortName}</span>
                  <span>RTG</span>
               </h3>
               {homePlayers.slice(0,11).map(p => 
                  <RatingRow 
                     key={p.id} 
                     player={p} 
                     stats={matchState.playerStats[p.id]} 
                     isMOTM={matchState.manOfTheMatchId === p.id} 
                     isExpanded={expandedPlayerId === p.id}
                     onToggle={() => setExpandedPlayerId(expandedPlayerId === p.id ? null : p.id)}
                  />
               )}
            </div>
            <div className="h-px bg-slate-800 my-4"></div>
            <div className="space-y-1.5">
               <h3 className="text-[10px] font-bold text-slate-500 uppercase px-2 mb-2 flex justify-between">
                  <span>{awayTeam.shortName}</span>
                  <span>RTG</span>
               </h3>
               {awayPlayers.slice(0,11).map(p => 
                  <RatingRow 
                     key={p.id} 
                     player={p} 
                     stats={matchState.playerStats[p.id]} 
                     isMOTM={matchState.manOfTheMatchId === p.id} 
                     isExpanded={expandedPlayerId === p.id}
                     onToggle={() => setExpandedPlayerId(expandedPlayerId === p.id ? null : p.id)}
                  />
               )}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-slate-800 border-t border-slate-700 flex justify-center gap-2">
        {matchState.minute < 90 && (
          <button 
            onClick={() => setMatchState(p => ({...p, isPlaying: !p.isPlaying}))} 
            className="flex-1 py-3 rounded font-black text-xs uppercase tracking-widest"
            style={{ backgroundColor: '#666', color: '#fff' }}
          >
            {matchState.isPlaying ? "PAUSA" : "JUGAR"}
          </button>
        )}
        
        {matchState.minute < 90 && (
          <button 
            onClick={handleInstantResult}
            className="px-4 py-3 bg-yellow-600 text-white rounded font-black text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Zap size={14} /> <span className="hidden sm:inline">INSTANTÁNEO</span>
          </button>
        )}

        {matchState.minute >= 90 && (
          <button 
            onClick={() => onFinish(matchState.homeScore, matchState.awayScore)} 
            className="flex-1 py-3 bg-slate-700 text-white rounded font-black text-xs uppercase tracking-widest"
          >
            FINALIZAR
          </button>
        )}
      </div>
    </div>
  );
};

const RatingRow = ({ player, stats, isMOTM, isExpanded, onToggle }: any) => {
  if (!stats) return null;
  
  return (
    <div className="bg-slate-800/50 rounded overflow-hidden transition-all border border-transparent hover:border-slate-600">
      <div 
         className="p-2 flex justify-between items-center text-[11px] cursor-pointer"
         onClick={onToggle}
      >
         <div className="flex items-center gap-2 overflow-hidden">
            {isMOTM && <Star size={12} className="text-yellow-500 fill-yellow-500 shrink-0 animate-pulse" />}
            <span className="text-white font-bold truncate">{player.name}</span>
            {stats.goals > 0 && <span className="bg-green-500/20 text-green-400 text-[9px] px-1 rounded font-black">{stats.goals}G</span>}
         </div>
         <div className="flex items-center gap-3">
            <span className={`px-2 py-0.5 rounded font-bold ${stats.rating >= 8 ? 'text-green-400' : stats.rating >= 6 ? 'text-white' : 'text-red-400'}`}>
               {stats.rating.toFixed(1)}
            </span>
            {isExpanded ? <ChevronUp size={12} className="text-slate-500" /> : <ChevronDown size={12} className="text-slate-500" />}
         </div>
      </div>
      
      {isExpanded && (
         <div className="p-3 border-t animate-in slide-in-from-top-1 duration-200" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)', borderColor: 'rgba(51, 65, 85, 0.5)' }}>
            <p className="text-[10px] italic mb-3 font-medium" style={{ color: '#ccc' }}>
               "{stats.participationPhrase}"
            </p>
            <div className="grid grid-cols-4 gap-2 text-[9px] text-slate-400 text-center">
               <div className="bg-slate-800 p-1 rounded">
                  <span className="block font-bold text-white">{stats.passesCompleted}/{stats.passesAttempted}</span>
                  <span className="text-[8px] uppercase">Pases</span>
               </div>
               <div className="bg-slate-800 p-1 rounded">
                  <span className="block font-bold text-white">{stats.tacklesCompleted}/{stats.tacklesAttempted}</span>
                  <span className="text-[8px] uppercase">Entradas</span>
               </div>
               <div className="bg-slate-800 p-1 rounded">
                  <span className="block font-bold text-white">{stats.dribblesCompleted}</span>
                  <span className="text-[8px] uppercase">Regates</span>
               </div>
               <div className="bg-slate-800 p-1 rounded">
                  <span className="block font-bold text-white">{stats.shotsOnTarget}</span>
                  <span className="text-[8px] uppercase">Tiros</span>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}
