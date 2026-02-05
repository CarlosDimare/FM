
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Club, Player, MatchState, MatchEvent, PlayerMatchStats, Position, TacticalReport, Tactic } from '../types';
import { MatchSimulator } from '../services/engine';
import { GAME_SPEED_MS } from '../constants';
import { world } from '../services/worldManager';
import { Play, Pause, List, BarChart3, Users, Zap, AlertCircle, CheckCircle, Shield, Table, BrainCircuit, X } from 'lucide-react';
import { MatchStatsTable } from './MatchStatsTable';
import { FMBox } from './FMUI';

interface MatchViewProps {
  homeTeam: Club;
  awayTeam: Club;
  homePlayers: Player[];
  awayPlayers: Player[];
  onFinish: (homeScore: number, awayScore: number, matchStats: Record<string, PlayerMatchStats>) => void;
  currentDate: Date;
  userClubId: string;
}

export const MatchView: React.FC<MatchViewProps> = ({ homeTeam, awayTeam, homePlayers, awayPlayers, onFinish, currentDate, userClubId }) => {
  const [activeTab, setActiveTab] = useState<'LOG' | 'STATS' | 'PLANTILLA'>('LOG');
  
  // Fetch active tactics for both teams
  const homeTactic = useMemo(() => world.getTactics()[0].settings, []);
  const awayTactic = useMemo(() => world.getTactics()[0].settings, []);

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
    playerStats: MatchSimulator.initMatchStats([...homePlayers, ...awayPlayers]),
    halftimeTriggered: false
  }));

  const [tickDuration, setTickDuration] = useState(GAME_SPEED_MS);
  const [tacticalReport, setTacticalReport] = useState<TacticalReport | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- Scoreboard Color Logic ---
  const { hCol, aCol } = useMemo(() => {
    let hBg = homeTeam.primaryColor;
    let hTx = homeTeam.secondaryColor;
    let aBg = awayTeam.primaryColor;
    let aTx = awayTeam.secondaryColor;

    // Detect clash (identical or very similar backgrounds)
    if (hBg === aBg) {
      // Invert Away Team colors to avoid confusion
      aBg = awayTeam.secondaryColor.replace('text-', 'bg-');
      aTx = awayTeam.primaryColor.replace('bg-', 'text-');
    }

    return {
      hCol: { bg: hBg, text: hTx },
      aCol: { bg: aBg, text: aTx }
    };
  }, [homeTeam, awayTeam]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [matchState.events, activeTab]);

  useEffect(() => {
    let timeoutId: any;
    const gameLoop = () => {
      if (!matchState.isPlaying || matchState.minute >= 90) return;
      
      setMatchState(prev => {
        const nextMinute = prev.minute + 1;
        
        if (nextMinute === 46 && world.matchSettings.pauseAtHalftime && !prev.halftimeTriggered) {
            return { ...prev, isPlaying: false, minute: 45, halftimeTriggered: true };
        }

        const { event, teamStats, slowMotion } = MatchSimulator.simulateMinute(
          nextMinute, homeTeam, awayTeam, homePlayers, awayPlayers, prev.playerStats, homeTactic, awayTactic
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
        
        if (nextMinute === 90) {
            newEvents = [...newEvents, { minute: 90, type: 'WHISTLE', text: 'Final del partido.', importance: 'HIGH', intensity: 4 }];
            setTimeout(() => {
               generateReport({ ...prev, minute: 90, homeScore: newHomeScore, awayScore: newAwayScore, playerStats: prev.playerStats, events: newEvents, homeStats: teamStats.home, awayStats: teamStats.away } as MatchState, 90, false);
            }, 0);
        }

        setTickDuration(slowMotion ? 1200 : GAME_SPEED_MS);
        return { ...prev, minute: nextMinute, events: newEvents, homeScore: newHomeScore, awayScore: newAwayScore, isPlaying: nextMinute < 90, homeStats: teamStats.home, awayStats: teamStats.away };
      });
      timeoutId = setTimeout(gameLoop, tickDuration);
    };
    if (matchState.isPlaying) timeoutId = setTimeout(gameLoop, tickDuration);
    return () => clearTimeout(timeoutId);
  }, [matchState.isPlaying, matchState.minute, tickDuration, homeTactic, awayTactic]); 

  const generateReport = (state: MatchState, minute: number, openModal: boolean = false) => {
      const userIsHome = state.homeTeamId === userClubId;
      const activePlayers = userIsHome ? homePlayers.filter(p=>p.isStarter) : awayPlayers.filter(p=>p.isStarter);
      const myTeam = userIsHome ? homeTeam : awayTeam;
      const oppTeam = userIsHome ? awayTeam : homeTeam;
      const myScore = userIsHome ? state.homeScore : state.awayScore;
      const oppScore = userIsHome ? state.awayScore : state.homeScore;

      const report = MatchSimulator.generateTacticalAnalysis(
          myTeam, oppTeam, 
          activePlayers, 
          state.playerStats, 
          myScore, 
          oppScore,
          minute
      );
      setTacticalReport(report);
      if (openModal) setShowReportModal(true);
  };

  const handleInstantResult = () => {
    setMatchState(prev => {
      let currentMinute = prev.minute;
      let currentEvents = [...prev.events];
      let currentHomeScore = prev.homeScore;
      let currentAwayScore = prev.awayScore;
      let currentPlayerStats = { ...prev.playerStats };
      let currentTeamStats = { home: prev.homeStats, away: prev.awayStats };
      
      let stoppedAtHalftime = false;

      while (currentMinute < 90) {
        if (currentMinute === 45 && world.matchSettings.pauseAtHalftime && !prev.halftimeTriggered) {
            stoppedAtHalftime = true;
            break;
        }

        currentMinute++;
        const { event, teamStats } = MatchSimulator.simulateMinute(currentMinute, homeTeam, awayTeam, homePlayers, awayPlayers, currentPlayerStats, homeTactic, awayTactic);
        if (event) {
          currentEvents.push(event);
          if (event.type === 'GOAL') {
            if (event.teamId === homeTeam.id) currentHomeScore++; else currentAwayScore++;
          }
        }
        currentTeamStats = teamStats;
      }

      if (stoppedAtHalftime) {
          return { 
              ...prev, 
              isPlaying: false, 
              minute: 45, 
              halftimeTriggered: true,
              events: currentEvents, 
              homeScore: currentHomeScore, 
              awayScore: currentAwayScore, 
              homeStats: currentTeamStats.home, 
              awayStats: currentTeamStats.away, 
              playerStats: currentPlayerStats 
          };
      }

      currentEvents.push({ minute: 90, type: 'WHISTLE', text: 'Final del partido.', importance: 'HIGH', intensity: 4 });
      
      setTimeout(() => {
          generateReport({ ...prev, minute: 90, homeScore: currentHomeScore, awayScore: currentAwayScore, playerStats: currentPlayerStats, events: currentEvents, homeStats: currentTeamStats.home, awayStats: currentTeamStats.away } as MatchState, 90, false);
      }, 0);

      return { ...prev, isPlaying: false, minute: 90, events: currentEvents, homeScore: currentHomeScore, awayScore: currentAwayScore, homeStats: currentTeamStats.home, awayStats: currentTeamStats.away, playerStats: currentPlayerStats };
    });
  };

  const getScorers = (teamId: string) => {
    return matchState.events
        .filter(e => e.type === 'GOAL' && e.teamId === teamId)
        .map(e => {
            const p = [...homePlayers, ...awayPlayers].find(pl => pl.id === e.playerId);
            const lastName = p ? p.name.split(' ').slice(-1)[0] : 'Desconocido';
            return `${lastName} ${e.minute}'`;
        })
        .join(', ');
  };

  const getIntensityStyles = (intensity: number) => {
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
    <div className="flex flex-col h-full bg-slate-300 overflow-hidden font-sans relative">
      {/* FM08-Style LED Scoreboard as Header */}
      <div className="w-full flex h-14 md:h-20 shadow-xl z-20 relative bg-slate-800 border-b-2 border-slate-600">
        {/* HOME TEAM HALF */}
        <div className={`flex-1 flex items-center justify-end pr-4 md:pr-8 relative overflow-hidden transition-colors ${hCol.bg}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]"></div>
            
            <div className="relative z-10 flex flex-col items-end mr-3">
               <span className={`font-black text-lg md:text-3xl uppercase tracking-tight drop-shadow-sm text-right leading-none ${hCol.text}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
                  <span className="md:hidden">{homeTeam.shortName}</span>
                  <span className="hidden md:block truncate">{homeTeam.name}</span>
               </span>
               <span className={`text-[9px] md:text-[10px] font-bold text-right mt-1 max-w-[150px] leading-tight tracking-wide drop-shadow-sm opacity-80 ${hCol.text}`}>
                  {getScorers(homeTeam.id)}
               </span>
            </div>
            
            <Shield className={`relative z-10 w-10 h-10 md:w-14 md:h-14 opacity-40 fill-current hidden sm:block ${hCol.text}`} strokeWidth={1.5} />
        </div>

        {/* LED BOARD CENTER */}
        <div className="shrink-0 bg-[#111] px-3 md:px-8 flex items-center gap-4 md:gap-8 border-x-4 border-yellow-500/80 relative"
             style={{
                 backgroundImage: 'radial-gradient(#333 1.5px, transparent 1.5px)',
                 backgroundSize: '4px 4px'
             }}
        >
           <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,1)] pointer-events-none"></div>
           
           <span className="relative z-10 font-mono font-bold text-3xl md:text-5xl text-yellow-400 tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
              {matchState.homeScore}
           </span>

           <div className="relative z-10 flex flex-col items-center justify-center min-w-[60px]">
              <span className="font-mono font-bold text-lg md:text-xl text-slate-200 tracking-widest tabular-nums">
                 {matchState.minute < 10 ? `0${matchState.minute}` : matchState.minute}:00
              </span>
              {matchState.isPlaying && <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse mt-1"></span>}
           </div>

           <span className="relative z-10 font-mono font-bold text-3xl md:text-5xl text-yellow-400 tracking-widest drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
              {matchState.awayScore}
           </span>
        </div>

        {/* AWAY TEAM HALF */}
        <div className={`flex-1 flex items-center justify-start pl-4 md:pl-8 relative overflow-hidden transition-colors ${aCol.bg}`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/10"></div>
            <div className="absolute inset-0 shadow-[inset_0_0_15px_rgba(0,0,0,0.1)]"></div>

            <Shield className={`relative z-10 w-10 h-10 md:w-14 md:h-14 opacity-40 fill-current hidden sm:block ${aCol.text}`} strokeWidth={1.5} />
            
            <div className="relative z-10 flex flex-col items-start ml-3">
               <span className={`font-black text-lg md:text-3xl uppercase tracking-tight drop-shadow-sm text-left leading-none ${aCol.text}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
                  <span className="md:hidden">{awayTeam.shortName}</span>
                  <span className="hidden md:block truncate">{awayTeam.name}</span>
               </span>
               <span className={`text-[9px] md:text-[10px] font-bold text-left mt-1 max-w-[150px] leading-tight tracking-wide drop-shadow-sm opacity-80 ${aCol.text}`}>
                  {getScorers(awayTeam.id)}
               </span>
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
                <div className="flex justify-between items-center mb-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-600">Últimos Eventos</h4>
                    <button onClick={() => generateReport(matchState, matchState.minute, true)} className="text-[9px] font-bold text-blue-700 hover:underline uppercase flex items-center gap-1">
                        <BrainCircuit size={12}/> Ver Análisis Táctico
                    </button>
                </div>
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
                <div className="flex flex-col gap-2">
                   <h3 className={`text-sm font-black uppercase tracking-widest px-2 border-l-4 ${hCol.bg.replace('bg-','border-')} text-slate-800`}>{homeTeam.name}</h3>
                   <MatchStatsTable players={homePlayers} stats={matchState.playerStats} club={homeTeam} />
                </div>
                
                <div className="flex flex-col gap-2">
                   <h3 className={`text-sm font-black uppercase tracking-widest px-2 border-l-4 ${aCol.bg.replace('bg-','border-')} text-slate-800`}>{awayTeam.name}</h3>
                   <MatchStatsTable players={awayPlayers} stats={matchState.playerStats} club={awayTeam} />
                </div>
             </div>
          </div>
        )}
      </div>

      {/* FOOTER CONTROLS */}
      <footer className="bg-slate-900 border-t border-slate-700 p-3 md:p-4 flex items-center justify-center gap-4 shrink-0 z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        {matchState.minute < 90 ? (
          <>
            <button 
                onClick={() => setMatchState(p => ({...p, isPlaying: !p.isPlaying}))} 
                className={`flex-1 max-w-[200px] h-12 rounded-sm shadow-md flex items-center justify-center gap-2 transition-all border font-black uppercase tracking-widest text-xs ${matchState.isPlaying ? 'bg-slate-300 text-slate-800 border-slate-400 hover:bg-slate-400' : 'bg-green-600 text-white border-green-700 hover:bg-green-700'}`}
            >
                {matchState.isPlaying ? <><Pause size={18} fill="currentColor"/> PAUSAR</> : <><Play size={18} fill="currentColor"/> JUGAR</>}
            </button>
            <button 
                onClick={handleInstantResult} 
                className="flex-1 max-w-[200px] h-12 bg-slate-800 text-yellow-400 rounded-sm shadow-md flex items-center justify-center gap-2 hover:bg-black transition-all border border-slate-700 font-black uppercase tracking-widest text-xs"
            >
                <Zap size={18} fill="currentColor"/> INSTANTÁNEO
            </button>
          </>
        ) : (
          <button 
              onClick={() => onFinish(matchState.homeScore, matchState.awayScore, matchState.playerStats)} 
              className="w-full max-w-sm h-12 bg-blue-700 text-white rounded-sm shadow-md flex items-center justify-center gap-2 hover:bg-blue-800 animate-pulse border border-blue-600 font-black uppercase tracking-widest text-xs"
          >
              <CheckCircle size={18} /> SALIR DEL PARTIDO
          </button>
        )}
      </footer>

      {/* Tactical Report Modal */}
      {showReportModal && tacticalReport && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
              <FMBox className="w-full max-w-sm shadow-2xl border-2 border-slate-400" title={
                  <div className="flex justify-between items-center w-full">
                      <span>Análisis Táctico - {matchState.minute >= 90 ? 'FINAL' : 'ENTRETIEMPO'}</span>
                      <button onClick={() => setShowReportModal(false)} className="text-slate-700 hover:text-black"><X size={16}/></button>
                  </div>
              } noPadding>
                  <div className="p-6 bg-slate-100 flex flex-col gap-4">
                      <div className="flex items-center gap-3 border-b border-slate-300 pb-3">
                          <BrainCircuit className="text-blue-700" size={28} />
                          <div>
                              <h3 className="text-lg font-black text-slate-900 uppercase italic leading-none">{tacticalReport.title}</h3>
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Informe del Asistente</p>
                          </div>
                      </div>
                      
                      <div className="space-y-3">
                          <p className="text-sm font-bold text-slate-800 leading-relaxed italic">"{tacticalReport.summary}"</p>
                          
                          {tacticalReport.keyStrength && (
                              <div className="bg-green-100 border-l-4 border-green-500 p-3 rounded-r-sm">
                                  <p className="text-[9px] font-black text-green-800 uppercase tracking-widest mb-1">Punto Fuerte</p>
                                  <p className="text-xs font-bold text-green-900">{tacticalReport.keyStrength}</p>
                              </div>
                          )}
                          
                          {tacticalReport.keyWeakness && (
                              <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded-r-sm">
                                  <p className="text-[9px] font-black text-red-800 uppercase tracking-widest mb-1">Punto Débil</p>
                                  <p className="text-xs font-bold text-red-900">{tacticalReport.keyWeakness}</p>
                              </div>
                          )}

                          <div className="bg-slate-200 border border-slate-300 p-3 rounded-sm flex gap-3 items-start">
                              <Zap size={16} className="text-yellow-600 mt-0.5" />
                              <div>
                                  <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-1">Sugerencia</p>
                                  <p className="text-xs font-bold text-slate-800">{tacticalReport.suggestion}</p>
                              </div>
                          </div>
                      </div>

                      <button onClick={() => setShowReportModal(false)} className="w-full bg-slate-800 text-white font-black uppercase text-xs py-3 rounded-sm hover:bg-slate-900 mt-2">
                          Entendido
                      </button>
                  </div>
              </FMBox>
          </div>
      )}
    </div>
  );
};
