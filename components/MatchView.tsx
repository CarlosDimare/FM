import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Club, Player, MatchState, MatchEvent, PlayerMatchStats, Position, Tactic } from '../types';
import { MatchSimulator } from '../services/engine';
import { GAME_SPEED_MS } from '../constants';
import { world } from '../services/worldManager';
import { Play, Pause, List, BarChart3, Users, Zap, Table, FastForward, SkipForward, Copy, Terminal, Check } from 'lucide-react';
import { MatchStatsTable } from './MatchStatsTable';
import { FMBox, FMButton } from './FMUI';

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
  const [activeTab, setActiveTab] = useState<'LOG' | 'STATS' | 'PLANTILLA' | 'TECH'>('LOG');
  const [copied, setCopied] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  
  const homeTactic = useMemo(() => world.getTactics()[0].settings, []);
  const awayTactic = useMemo(() => world.getTactics()[0].settings, []);

  const [matchState, setMatchState] = useState<MatchState>(() => ({
    isPlaying: false,
    minute: 0,
    second: 0,
    homeScore: 0,
    awayScore: 0,
    events: [],
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    homeStats: { possession: 50, possessionTime: 0, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0 },
    awayStats: { possession: 50, possessionTime: 0, shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0 },
    playerStats: MatchSimulator.initMatchStats([...homePlayers, ...awayPlayers]),
    halftimeTriggered: false,
    ballState: 'KICKOFF',
    ballPosition: { x: 500, y: 500 }
  }));

  const [tickDuration, setTickDuration] = useState(GAME_SPEED_MS / 8); 
  const scrollRef = useRef<HTMLDivElement>(null);
  const techScrollRef = useRef<HTMLDivElement>(null);

  const { hCol, aCol } = useMemo(() => {
    let hBg = homeTeam.primaryColor;
    let hTx = homeTeam.secondaryColor;
    let aBg = awayTeam.primaryColor;
    let aTx = awayTeam.secondaryColor;
    if (hBg === aBg) {
      aBg = awayTeam.secondaryColor.replace('text-', 'bg-');
      aTx = awayTeam.primaryColor.replace('bg-', 'text-');
    }
    return { hCol: { bg: hBg, text: hTx }, aCol: { bg: aBg, text: aTx } };
  }, [homeTeam, awayTeam]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    if (techScrollRef.current) techScrollRef.current.scrollTop = techScrollRef.current.scrollHeight;
  }, [matchState.events, activeTab]);

  useEffect(() => {
    let timeoutId: any;
    const gameLoop = () => {
      if (!matchState.isPlaying || matchState.minute >= 90) return;
      
      setMatchState(prev => {
        // Fix: Removed homeTactic and awayTactic arguments as MatchSimulator.simulateStep expects only 5 arguments
        const { nextState, slowMotion } = MatchSimulator.simulateStep(
            prev, homeTeam, awayTeam, homePlayers, awayPlayers
        );
        setTickDuration(slowMotion ? 900 : GAME_SPEED_MS / 10);
        return nextState;
      });
      timeoutId = setTimeout(gameLoop, tickDuration);
    };
    if (matchState.isPlaying) timeoutId = setTimeout(gameLoop, tickDuration);
    return () => clearTimeout(timeoutId);
    // Fix: Added missing dependencies to ensure the game loop uses updated props
  }, [matchState.isPlaying, tickDuration, homeTeam, awayTeam, homePlayers, awayPlayers]);

  const skipToTime = (targetMin: number) => {
    setMatchState(prev => {
      let current = { ...prev };
      while (current.minute < targetMin && current.minute < 90) {
        // Fix: Removed homeTactic and awayTactic arguments to match the 5-parameter signature of simulateStep
        const { nextState } = MatchSimulator.simulateStep(
          current, homeTeam, awayTeam, homePlayers, awayPlayers
        );
        current = nextState;
      }
      current.isPlaying = false;
      return current;
    });
  };

  const copyTechLog = () => {
    const logData = "analiza el log\nrefina el motor\n\n" + matchState.events.map(e => {
        const sec = (e.second ?? 0).toString().padStart(2, '0');
        return `[${e.minute}:${sec}] ${e.text}`;
    }).join('\n');

    // Robust copy method
    try {
        const textArea = document.createElement("textarea");
        textArea.value = logData;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    } catch (err) {
        console.error('Fallback copy failed', err);
        // Secondary attempt with modern API
        if (navigator.clipboard) {
            navigator.clipboard.writeText(logData).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    }
  };

  const getScorers = (teamId: string) => {
    return matchState.events
        .filter(e => e.type === 'GOAL' && e.teamId === teamId)
        .map(e => {
            const p = [...homePlayers, ...awayPlayers].find(pl => pl.id === e.playerId);
            return `${p ? p.name.split(' ').pop() : '???'} ${e.minute}'`;
        })
        .join(', ');
  };

  const getAssistantAnalysis = () => {
      const h = matchState.homeStats;
      const a = matchState.awayStats;
      const scoreDiff = matchState.homeScore - matchState.awayScore;
      const isHome = userClubId === homeTeam.id;
      
      const myStats = isHome ? h : a;
      const oppStats = isHome ? a : h;
      const myScoreDiff = isHome ? scoreDiff : -scoreDiff;

      let analysis = "";
      
      if (myStats.possession > 55) {
          analysis += "Estamos controlando el balón claramente. ";
          if (myScoreDiff <= 0) analysis += "Sin embargo, nos falta profundidad para transformar la posesión en goles. ";
          else analysis += "El dominio se está traduciendo en el marcador. ";
      } else if (oppStats.possession > 55) {
          analysis += "El rival nos está quitando la pelota. ";
          if (myScoreDiff >= 0) analysis += "Pero estamos siendo letales a la contra. ";
          else analysis += "Nos está costando mucho recuperar y salir. ";
      } else {
          analysis += "El partido está muy disputado en el medio campo. ";
      }

      if (myStats.shots > oppStats.shots + 4) analysis += "Estamos generando muchas más ocasiones. ";
      else if (oppStats.shots > myStats.shots + 4) analysis += "Nos están llegando con demasiada facilidad. ";

      return analysis || "Partido muy táctico y cerrado. Pocas conclusiones claras por ahora.";
  };

  const renderEvent = (e: MatchEvent, i: number) => {
    const isHome = e.teamId === homeTeam.id;
    const isAway = e.teamId === awayTeam.id;
    const team = isHome ? homeTeam : isAway ? awayTeam : null;
    
    let sizeClass = "text-[11px]";
    let fontClass = "font-bold";
    let containerClass = "bg-white border-[#a0b0a0]";
    let textStyle = { color: '#333' };

    if (team) {
       containerClass = `${team.primaryColor} border-black/20 shadow-md`;
       textStyle = { color: team.secondaryColor.replace('text-', '').replace('bg-', '') };
    }

    if (e.importance === 'HIGH') { 
        sizeClass = "text-base md:text-2xl"; 
        fontClass = "font-black italic uppercase tracking-tighter"; 
    } else if (e.importance === 'MEDIUM') { 
        sizeClass = "text-sm md:text-base"; 
        fontClass = "font-black uppercase"; 
    }

    return (
      <div key={i} className={`w-full max-w-4xl flex gap-3 p-3 rounded-sm border shadow-sm animate-in fade-in slide-in-from-left-4 duration-500 ${containerClass}`}>
        <span className="font-mono font-black shrink-0 border-r border-black/10 pr-3 min-w-[60px] text-center flex items-center justify-center opacity-70" style={textStyle}>
            {e.minute}:{(e.second ?? 0).toString().padStart(2, '0')}'
        </span>
        <span className={`flex-1 flex items-center ${sizeClass} ${fontClass}`} style={textStyle}>
            {e.text}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#cbd5e1] overflow-hidden relative">
      <div className="w-full flex h-16 md:h-20 shadow-xl z-20 relative bg-slate-800 border-b-2 border-slate-600 shrink-0">
        <div className={`flex-1 flex items-center justify-end pr-4 md:pr-10 relative overflow-hidden transition-colors ${hCol.bg}`}>
            <div className="relative z-10 flex flex-col items-end">
               <span className={`font-black text-xl md:text-4xl uppercase tracking-tighter text-right leading-none ${hCol.text}`}>{homeTeam.shortName}</span>
               <span className={`text-[10px] font-bold text-right mt-1 opacity-90 truncate max-w-[150px] ${hCol.text}`}>{getScorers(homeTeam.id)}</span>
            </div>
        </div>

        <div className="shrink-0 bg-[#111] px-4 md:px-10 flex items-center gap-4 border-x-4 border-yellow-500/80">
           <span className="font-mono font-bold text-4xl md:text-6xl text-yellow-400">{matchState.homeScore}</span>
           <div className="flex flex-col items-center min-w-[80px]">
              <span className="font-mono font-bold text-xl md:text-2xl text-slate-200 tracking-widest tabular-nums">
                 {matchState.minute < 10 ? `0${matchState.minute}` : matchState.minute}:{matchState.second < 10 ? `0${matchState.second}` : matchState.second}
              </span>
           </div>
           <span className="font-mono font-bold text-4xl md:text-6xl text-yellow-400">{matchState.awayScore}</span>
        </div>

        <div className={`flex-1 flex items-center justify-start pl-4 md:pl-10 relative overflow-hidden transition-colors ${aCol.bg}`}>
            <div className="relative z-10 flex flex-col items-start">
               <span className={`font-black text-xl md:text-4xl uppercase tracking-tighter text-left leading-none ${aCol.text}`}>{awayTeam.shortName}</span>
               <span className={`text-[10px] font-bold text-left mt-1 opacity-90 truncate max-w-[150px] ${aCol.text}`}>{getScorers(awayTeam.id)}</span>
            </div>
        </div>
      </div>

      <div className="flex bg-[#bcc8bc] border-b border-[#a0b0a0] shrink-0 h-12 shadow-inner z-10">
        <button onClick={() => setActiveTab('LOG')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'LOG' ? 'bg-[#dbe6db] text-slate-950 border-b-4 border-slate-950' : 'text-slate-500 hover:bg-[#ccd9cc]'}`}><List size={20} /></button>
        <button onClick={() => setActiveTab('TECH')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'TECH' ? 'bg-[#dbe6db] text-slate-950 border-b-4 border-slate-950' : 'text-slate-500 hover:bg-[#ccd9cc]'}`}><Terminal size={20} /></button>
        <button onClick={() => setActiveTab('STATS')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'STATS' ? 'bg-[#dbe6db] text-slate-950 border-b-4 border-slate-950' : 'text-slate-500 hover:bg-[#ccd9cc]'}`}><BarChart3 size={20} /></button>
        <button onClick={() => setActiveTab('PLANTILLA')} className={`flex-1 flex items-center justify-center transition-all ${activeTab === 'PLANTILLA' ? 'bg-[#dbe6db] text-slate-950 border-b-4 border-slate-950' : 'text-slate-500 hover:bg-[#ccd9cc]'}`}><Table size={20} /></button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col bg-[#cbd5e1]/50">
        {activeTab === 'LOG' && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scroll flex flex-col items-center" ref={scrollRef}>
            {matchState.events.filter(e => !e.isTechnical).map((e, i) => renderEvent(e, i))}
            {matchState.events.length === 0 && (
                <div className="p-20 text-center text-slate-400 italic font-black uppercase text-[12px] tracking-[0.3em]">Esperando el pitido inicial...</div>
            )}
          </div>
        )}
        
        {activeTab === 'TECH' && (
            <div className="flex-1 flex flex-col p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest flex items-center gap-2">
                        <Terminal size={14} /> Log Técnico Total (Análisis de Motor)
                    </span>
                    <button 
                        onClick={copyTechLog} 
                        className={`flex items-center gap-1 border border-[#a0b0a0] px-3 py-1 text-[9px] font-black uppercase rounded shadow-sm transition-all ${copied ? 'bg-green-600 text-white border-green-700' : 'bg-white hover:bg-slate-50'}`}
                    >
                        {copied ? <Check size={12} /> : <Copy size={12} />}
                        {copied ? '¡Copiado!' : 'Copiar Todo'}
                    </button>
                </div>
                <div className="flex-1 bg-black/90 rounded border border-slate-700 p-4 font-mono text-[10px] text-green-400 overflow-y-auto custom-scroll shadow-inner" ref={techScrollRef}>
                    <div className="mb-4 opacity-100 text-yellow-500 border-b border-yellow-500/30 pb-2">
                        analiza el log<br/>refina el motor
                    </div>
                    {matchState.events.map((e, i) => (
                        <div key={i} className="mb-1 opacity-80 border-b border-white/5 pb-1 flex gap-2">
                            <span className="text-blue-400 shrink-0">[{e.minute}:{(e.second ?? 0).toString().padStart(2, '0')}]</span> 
                            <span className={e.importance === 'HIGH' ? 'text-yellow-400 font-bold underline' : e.isTechnical ? 'text-slate-400' : 'text-white'}>
                                {e.text}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'STATS' && (
          <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-white/30">
                <FMBox title="Estadísticas de Equipo">
                   <div className="space-y-6 p-4">
                      {renderStatsRow("Posesión", matchState.homeStats.possession, matchState.awayStats.possession, true)}
                      {renderStatsRow("Remates", matchState.homeStats.shots, matchState.awayStats.shots)}
                      {renderStatsRow("Tiros al Arco", matchState.homeStats.shotsOnTarget, matchState.awayStats.shotsOnTarget)}
                   </div>
                </FMBox>

                <div className="bg-slate-800 text-white p-4 rounded-sm border border-slate-600 shadow-md">
                    <h4 className="text-[10px] font-black uppercase tracking-widest mb-3 text-slate-400 border-b border-slate-600 pb-1">Relato en Vivo</h4>
                    <div className="space-y-1.5 font-mono text-xs">
                        {matchState.events.filter(e => !e.isTechnical).slice(-3).reverse().map((e, i) => (
                            <div key={i} className="flex gap-3 opacity-90 border-b border-slate-700 pb-1 last:border-0">
                                <span className="text-green-400 font-bold w-10 text-right shrink-0">{e.minute}'</span>
                                <span className="text-slate-200">{e.text}</span>
                            </div>
                        ))}
                        {matchState.events.filter(e => !e.isTechnical).length === 0 && <span className="text-slate-500 italic">Esperando inicio...</span>}
                    </div>
                </div>

                <FMBox title="Análisis Táctico">
                    <div className="p-4 bg-white/50">
                        {showAnalysis ? (
                            <div className="animate-in fade-in slide-in-from-top-2">
                                <div className="flex items-start gap-4 mb-4">
                                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center border-2 border-slate-300 shrink-0">
                                        <Users size={24} className="text-slate-600" />
                                    </div>
                                    <div className="flex-1 bg-white p-3 rounded-sm border border-slate-300 shadow-sm relative">
                                        <div className="absolute top-3 -left-1.5 w-3 h-3 bg-white border-l border-t border-slate-300 transform -rotate-45"></div>
                                        <p className="text-sm italic font-bold text-slate-800">"{getAssistantAnalysis()}"</p>
                                    </div>
                                </div>
                                <FMButton variant="secondary" onClick={() => setShowAnalysis(false)} className="w-full">Ocultar Informe</FMButton>
                            </div>
                        ) : (
                            <FMButton onClick={() => setShowAnalysis(true)} className="w-full py-4 flex items-center justify-center gap-2">
                                <Zap size={16} /> SOLICITAR INFORME DEL ASISTENTE
                            </FMButton>
                        )}
                    </div>
                </FMBox>
          </div>
        )}
        {activeTab === 'PLANTILLA' && (
          <div className="flex-1 overflow-y-auto bg-[#d4dcd4] p-2 md:p-4">
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <MatchStatsTable players={homePlayers} stats={matchState.playerStats} club={homeTeam} />
                <MatchStatsTable players={awayPlayers} stats={matchState.playerStats} club={awayTeam} />
             </div>
          </div>
        )}
      </div>

      <footer className="bg-slate-900 p-3 md:p-4 flex items-center justify-center gap-4 shrink-0 border-t border-slate-700">
        {matchState.minute < 90 ? (
          <div className="flex gap-4">
            <button 
                onClick={() => setMatchState(p => ({...p, isPlaying: !p.isPlaying}))} 
                className={`w-16 h-12 rounded-sm transition-all active:scale-95 shadow-lg border-b-4 flex items-center justify-center ${matchState.isPlaying ? 'bg-slate-300 text-slate-800 border-slate-500' : 'bg-green-600 text-white border-green-800 hover:bg-green-500'}`}
                title={matchState.isPlaying ? "Pausar" : "Reanudar"}
            >
                {matchState.isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" />}
            </button>
            
            {!matchState.isPlaying && (
                <>
                    {matchState.minute < 45 && (
                        <button 
                            onClick={() => skipToTime(45)}
                            className="w-16 h-12 bg-gradient-to-b from-blue-700 to-blue-900 hover:brightness-110 text-white rounded-sm flex items-center justify-center border-b-4 border-blue-950 transition-all active:scale-95"
                            title="Ir al Descanso"
                        >
                            <FastForward size={24} fill="currentColor" />
                        </button>
                    )}
                    <button 
                        onClick={() => skipToTime(90)}
                        className="w-16 h-12 bg-gradient-to-b from-slate-600 to-slate-800 hover:brightness-110 text-white rounded-sm flex items-center justify-center border-b-4 border-slate-950 transition-all active:scale-95"
                        title="Ir al Final"
                    >
                        <SkipForward size={24} fill="currentColor" />
                    </button>
                </>
            )}
          </div>
        ) : (
          <button onClick={() => onFinish(matchState.homeScore, matchState.awayScore, matchState.playerStats)} className="w-full max-w-sm h-12 bg-blue-700 hover:bg-blue-600 text-white rounded-sm font-black uppercase text-xs shadow-xl border-b-4 border-blue-900 transition-all active:scale-95">SALIR DEL PARTIDO</button>
        )}
      </footer>
    </div>
  );

  function renderStatsRow(label: string, home: number, away: number, isPercent = false) {
    return (
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-700 uppercase font-black">
              <span>{home}{isPercent ? '%' : ''}</span>
              <span>{label}</span>
              <span>{away}{isPercent ? '%' : ''}</span>
          </div>
          <div className="h-3 bg-slate-300 rounded-full flex overflow-hidden border border-slate-400 shadow-inner">
            <div className={`${homeTeam.primaryColor}`} style={{ width: `${(home/(home+away+0.001))*100}%` }}></div>
            <div className={`${awayTeam.primaryColor}`} style={{ width: `${(away/(home+away+0.001))*100}%` }}></div>
          </div>
        </div>
    );
  }
};
