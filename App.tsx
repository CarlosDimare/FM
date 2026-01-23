import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerModal } from './components/PlayerModal';
import { MatchView } from './components/MatchView';
import { TacticsView } from './components/TacticsView'; 
import { LeagueTable } from './components/LeagueTable';
import { SquadView } from './components/SquadView';
import { StaffView } from './components/StaffView';
import { ClubReport } from './components/ClubReport';
import { PreMatchView } from './components/PreMatchView';
import { MarketView } from './components/MarketView';
import { SearchView } from './components/SearchView';
import { EconomyView } from './components/EconomyView';
import { NegotiationsView } from './components/NegotiationsView';
import { InboxView } from './components/InboxView';
import { SeasonSummaryModal, CompetitionSummary } from './components/SeasonSummaryModal';
import { PlayerContextMenu } from './components/PlayerContextMenu';
import { TournamentHub } from './components/TournamentHub';
import { world } from './services/worldManager';
import { Scheduler } from './services/scheduler';
import { LifecycleManager } from './services/lifecycleManager'; 
import { Club, Player, Competition, Fixture, SquadType } from './types';
import { randomInt } from './services/utils';
import { MatchSimulator } from './services/engine';
import { RefreshCw, Globe, Play, Sun, Menu, Zap } from 'lucide-react';
import { FMButton } from './components/FMUI';

type GameState = 'LOADING' | 'SETUP_LEAGUE' | 'SETUP_TEAM' | 'PLAYING';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('LOADING');
  const [currentView, setView] = useState('HOME');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [contextMenu, setContextMenu] = useState<{ player: Player, x: number, y: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedLeague, setSelectedLeague] = useState<Competition | null>(null);
  const [userClub, setUserClub] = useState<Club | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); 

  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationTargetDate, setVacationTargetDate] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);

  const [seasonSummary, setSeasonSummary] = useState<CompetitionSummary[] | null>(null);
  const [userWonLeague, setUserWonLeague] = useState(false);

  const [viewLeagueId, setViewLeagueId] = useState<string | null>(null);
  const [viewSquadType, setViewSquadType] = useState<SquadType>('SENIOR');

  const [currentDate, setCurrentDate] = useState(new Date(2008, 7, 16)); 
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [nextFixture, setNextFixture] = useState<Fixture | null>(null);
  const [seasonEndDate, setSeasonEndDate] = useState(new Date(2009, 5, 1));

  useEffect(() => {
    setTimeout(() => { setGameState('SETUP_LEAGUE'); }, 800);
  }, []);

  const handleGlobalClick = useCallback(() => {
    if (contextMenu) setContextMenu(null);
  }, [contextMenu]);

  useEffect(() => {
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, [handleGlobalClick]);

  const handlePlayerContextMenu = (e: React.MouseEvent, player: Player) => {
    e.preventDefault();
    setContextMenu({ player, x: e.clientX, y: e.clientY });
  };

  const initSeasonFixtures = (startFrom: Date) => {
    const allFixtures: Fixture[] = [];
    world.competitions.filter(c => c.type === 'LEAGUE').forEach(l => {
       const clubs = world.getClubsByLeague(l.id);
       ['SENIOR', 'RESERVE', 'U20'].forEach((st: any) => {
          allFixtures.push(...Scheduler.generateSeasonFixtures(l.id, clubs, startFrom, st));
       });
    });
    const cupDate = new Date(startFrom); cupDate.setMonth(startFrom.getMonth() + 1);
    while(cupDate.getDay() !== 3) cupDate.setDate(cupDate.getDate() + 1);

    const copaArg = world.competitions.find(c => c.id === 'C_ARG');
    if (copaArg) {
       const clubs = world.getClubsByLeague('L_ARG_1').concat(world.getClubsByLeague('L_ARG_2'));
       const top32 = clubs.sort(() => Math.random() - 0.5).slice(0, 32);
       allFixtures.push(...Scheduler.generateCupRound(copaArg.id, top32, cupDate, 'ROUND_OF_32'));
    }

    const libertadores = world.competitions.find(c => c.id === 'CONT_LIB');
    if (libertadores) {
       const argTeams = world.getClubsByLeague('L_ARG_1').sort((a,b) => b.reputation - a.reputation).slice(0, 5);
       const contTeams = world.getClubsByLeague('L_SAM_OTHER'); 
       const pool = [...argTeams, ...contTeams].slice(0, 32);
       if (pool.length >= 32) {
          allFixtures.push(...Scheduler.generateContinentalGroups(libertadores.id, pool, new Date(startFrom.getTime() + 1000 * 60 * 60 * 24 * 180))); 
       }
    }
    
    const cwc = world.competitions.find(c => c.id === 'W_CLUB');
    if (cwc) {
       const decDate = new Date(startFrom.getFullYear(), 11, 15);
       const bossTeams = world.getClubsByLeague('L_EUR_ELITE').slice(0, 1);
       const libTeams = world.getClubsByLeague('L_ARG_1').slice(0, 1);
       const others = world.getClubsByLeague('L_SAM_OTHER').slice(0, 2);
       const cwcPool = [...bossTeams, ...libTeams, ...others];
       allFixtures.push(...Scheduler.generateCupRound(cwc.id, cwcPool, decDate, 'SEMI_FINAL'));
    }

    setFixtures(allFixtures);
    if (userClub) updateNextFixture(allFixtures, startFrom, userClub.id);
  };

  const updateNextFixture = (allFixtures: Fixture[], date: Date, clubId: string) => {
     const next = allFixtures.find(f => !f.played && f.date.getTime() >= date.getTime() && (f.homeTeamId === clubId || f.awayTeamId === clubId) && f.squadType === 'SENIOR');
     setNextFixture(next || null);
  };

  const handleStartMatch = () => {
    if (nextFixture) setView('MATCH');
  };

  const advanceTime = () => {
     // If we are in PreMatch, the button should start the match, not skip time
     if (currentView === 'PRE_MATCH') {
        handleStartMatch();
        return;
     }

     if (currentDate >= seasonEndDate) { finishSeason(); return; }
     
     if (userClub) {
        const skippedMatch = fixtures.find(f => 
           !f.played && 
           f.date.toDateString() === currentDate.toDateString() && 
           (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)
        );
        if (skippedMatch) {
           simulateDay(currentDate); 
        }
     }

     const nextDay = new Date(currentDate);
     nextDay.setDate(currentDate.getDate() + 1);
     
     let userMatchTomorrow = null;
     if (userClub) {
        userMatchTomorrow = fixtures.find(f => 
           !f.played && 
           f.date.toDateString() === nextDay.toDateString() && 
           (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)
        );
     }

     setCurrentDate(nextDay);
     LifecycleManager.checkBirthdays(nextDay);
     LifecycleManager.recoverDailyFitness(); 
     world.checkRenewalTriggers(nextDay);
     world.processTransferDecisions(nextDay);
     world.processAIActivity(nextDay); 
     simulateDay(nextDay, userClub?.id);
     
     const newCupFixtures = LifecycleManager.processCompetitionProgress(fixtures, nextDay);
     let updatedFixtures = fixtures;
     if (newCupFixtures.length > 0) {
        updatedFixtures = [...fixtures, ...newCupFixtures];
        setFixtures(prev => [...prev, ...newCupFixtures]);
        if (userClub && !userMatchTomorrow) {
           userMatchTomorrow = newCupFixtures.find(f => 
              f.date.toDateString() === nextDay.toDateString() && 
              (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id)
           );
        }
     }

     if (userClub) updateNextFixture(updatedFixtures, nextDay, userClub.id);
     if (userMatchTomorrow) setView('PRE_MATCH');
     else if (nextFixture && nextFixture.date.toDateString() === nextDay.toDateString()) setView('PRE_MATCH');
     setForceUpdate(v => v + 1);
  };

  const simulateDay = (day: Date, excludeClubId?: string) => {
    const dayFixtures = fixtures.filter(f => 
        f.date.toDateString() === day.toDateString() && 
        !f.played && 
        (!excludeClubId || (f.homeTeamId !== excludeClubId && f.awayTeamId !== excludeClubId))
    );
    dayFixtures.forEach(f => {
       const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
       f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
       const hEleven = world.selectBestEleven(f.homeTeamId, f.squadType);
       const aEleven = world.selectBestEleven(f.awayTeamId, f.squadType);
       MatchSimulator.finalizeSeasonStats(hEleven, aEleven, stats, homeScore, awayScore);
    });
  };

  const startVacation = async () => {
    if (!vacationTargetDate) return;
    const target = new Date(vacationTargetDate);
    if (target <= currentDate) return;
    setIsSimulating(true);
    let tempDate = new Date(currentDate);
    while (tempDate < target) {
      tempDate.setDate(tempDate.getDate() + 1);
      setCurrentDate(new Date(tempDate));
      LifecycleManager.checkBirthdays(tempDate);
      LifecycleManager.recoverDailyFitness();
      world.checkRenewalTriggers(tempDate);
      world.processTransferDecisions(tempDate);
      world.processAIActivity(tempDate);
      simulateDay(tempDate);
      const newCupFixtures = LifecycleManager.processCompetitionProgress(fixtures, tempDate);
      if (newCupFixtures.length > 0) {
         setFixtures(prev => [...prev, ...newCupFixtures]); 
         fixtures.push(...newCupFixtures); 
      }
      if (tempDate >= seasonEndDate) { finishSeason(); break; }
      await new Promise(r => setTimeout(r, 20)); 
    }
    if (userClub) updateNextFixture(fixtures, tempDate, userClub.id);
    setIsSimulating(false); setIsVacationModalOpen(false); setView('HOME');
    setForceUpdate(v => v + 1);
  };

  const finishSeason = () => {
     const summaries = LifecycleManager.processEndOfSeason(fixtures);
     setSeasonSummary(summaries);
     if (userClub) setUserWonLeague(summaries.some(s => s.championId === userClub.id));
     const nextSeasonStart = new Date(currentDate.getFullYear(), 7, 1);
     setCurrentDate(nextSeasonStart); initSeasonFixtures(nextSeasonStart); setView('HOME');
  };

  const renderCurrentView = () => {
    if (!userClub) return null;

    const staticViews: Record<string, React.ReactNode> = {
        'HOME': (
            <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-slate-200 p-6 rounded-sm border border-slate-500 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-slate-900"><Globe size={120} /></div>
                        <h3 className="text-slate-950 font-black uppercase text-[11px] tracking-wider mb-4 border-b border-slate-400 pb-1">Próximo Encuentro</h3>
                        {nextFixture ? (
                            <div className="flex items-center justify-center gap-8 py-4 relative z-10">
                                <div className="text-center"><div className={`w-16 h-16 rounded-full mx-auto mb-2 shadow-md flex items-center justify-center text-white font-black text-xl ${userClub.primaryColor} ${userClub.primaryColor === 'bg-white' ? 'text-slate-950 border border-slate-400' : 'text-white'}`}>{userClub.shortName}</div><p className="font-black text-slate-950 text-xs">{userClub.name}</p></div>
                                <div className="text-4xl font-black text-slate-400 italic">VS</div>
                                <div className="text-center"><div className={`w-16 h-16 rounded-full mx-auto mb-2 shadow-md flex items-center justify-center font-black text-xl ${world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor} ${world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor === 'bg-white' ? 'text-slate-950 border border-slate-400' : 'text-white'}`}>{world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.shortName}</div><p className="font-black text-slate-950 text-xs">{world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.name}</p></div>
                            </div>
                        ) : <p className="text-center text-slate-500 italic py-10">No hay partidos próximos.</p>}
                        <div className="mt-4 text-center text-slate-600 font-mono text-[10px] uppercase tracking-widest">{nextFixture?.date.toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
        ),
        'INBOX': <InboxView onUpdate={() => setForceUpdate(v => v + 1)} />,
        'TABLE': <div className="p-2 h-full flex flex-col"><LeagueTable entries={world.getLeagueTable(viewLeagueId || userClub.leagueId, fixtures, viewSquadType)} userClubId={userClub.id} allLeagues={world.getLeagues()} currentLeagueId={viewLeagueId || userClub.leagueId} onLeagueChange={setViewLeagueId} currentSquadType={viewSquadType} onSquadTypeChange={setViewSquadType} /></div>,
        'PRE_MATCH': nextFixture ? <PreMatchView club={userClub} opponent={world.getClub(nextFixture.homeTeamId === userClub.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)!} starters={world.getPlayersByClub(userClub.id).filter(p => p.isStarter && p.squad === 'SENIOR')} onStart={handleStartMatch} onGoToTactics={() => setView('SENIOR_TACTICS')} /> : <div>Error</div>,
        'MATCH': nextFixture ? <MatchView homeTeam={nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId)!} awayTeam={nextFixture.homeTeamId === userClub.id ? world.getClub(nextFixture.awayTeamId)! : userClub} homePlayers={world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.isStarter)} awayPlayers={world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.isStarter)} onFinish={(h,a,stats) => { nextFixture.played = true; nextFixture.homeScore = h; nextFixture.awayScore = a; MatchSimulator.finalizeSeasonStats(world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.isStarter), world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.isStarter), stats, h, a); setView('HOME'); updateNextFixture(fixtures, currentDate, userClub.id); setForceUpdate(v=>v+1); }} /> : <div>Error</div>,
        'MARKET': <MarketView userClubId={userClub.id} onSelectPlayer={setSelectedPlayer} currentDate={currentDate} />,
        'SEARCH': <SearchView onSelectPlayer={setSelectedPlayer} />,
        'NEGOTIATIONS': <NegotiationsView userClubId={userClub.id} onUpdate={() => setForceUpdate(v => v + 1)} currentDate={currentDate} />,
        'ECONOMY': <EconomyView club={userClub} />,
        'STAFF': <StaffView staff={world.getStaffByClub(userClub.id)} />,
        'CLUB_REPORT': <ClubReport club={userClub} />
    };

    if (staticViews[currentView]) return staticViews[currentView];

    if (currentView.endsWith('_SQUAD')) {
        const type = currentView.split('_')[0] as SquadType;
        return <SquadView players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onSelectPlayer={setSelectedPlayer} onContextMenu={handlePlayerContextMenu} />;
    }
    if (currentView.endsWith('_TACTICS')) {
        const type = currentView.split('_')[0] as SquadType;
        return <TacticsView club={userClub} players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onUpdatePlayer={() => setForceUpdate(v => v + 1)} onContextMenu={handlePlayerContextMenu} />;
    }
    if (currentView.endsWith('_SCHEDULE')) {
        const type = currentView.split('_')[0] as SquadType;
        const squadFixtures = fixtures.filter(f => (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) && f.squadType === type);
        return (
            <div className="p-4 h-full flex flex-col">
                <h2 className="text-xl font-black text-slate-950 mb-4 uppercase tracking-tighter border-b border-slate-500 pb-2 italic">Calendario - {type}</h2>
                <div className="bg-slate-200 rounded-sm border border-slate-500 overflow-y-auto shadow-md flex-1 p-2">
                    {squadFixtures.map(f => {
                        const home = world.getClub(f.homeTeamId); const away = world.getClub(f.awayTeamId);
                        const isPenalty = f.penaltyHome !== undefined;
                        return (
                            <div key={f.id} className="flex items-center p-2 border-b border-slate-400 text-[11px] hover:bg-slate-300">
                                <div className="w-20 text-slate-700 font-mono font-bold">{f.date.toLocaleDateString()}</div>
                                <div className="flex-1 text-right font-black text-slate-900 pr-2 uppercase">{home?.name}</div>
                                <div className={`w-20 text-center font-black bg-slate-300 rounded px-1 border border-slate-500 ${f.played ? 'text-slate-950' : 'text-slate-500'}`}>
                                   {f.played ? (isPenalty ? `${f.homeScore}-${f.awayScore} (p)` : `${f.homeScore}-${f.awayScore}`) : 'v'}
                                </div>
                                <div className="flex-1 text-left font-black text-slate-900 pl-2 uppercase">{away?.name}</div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }
    if (currentView.startsWith('COMP_')) {
       const competition = world.competitions.find(c => c.id === currentView.replace('COMP_', ''));
       return competition ? <TournamentHub competition={competition} fixtures={fixtures} userClubId={userClub.id} /> : null;
    }
    return null;
  };

  if (gameState === 'LOADING') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center text-slate-950"><div className="animate-pulse flex flex-col items-center"><RefreshCw className="w-10 h-10 animate-spin mb-4 text-slate-900" /><h1 className="text-2xl font-black italic tracking-widest uppercase">FULBO MANASHER</h1></div></div>;
  
  if (gameState === 'SETUP_LEAGUE') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4"><div className="max-w-4xl w-full bg-slate-200 rounded-sm p-10 border border-slate-600 text-center shadow-2xl"><h1 className="text-5xl font-black text-slate-950 mb-10 tracking-tighter italic uppercase">FULBO<span className="text-slate-500">MANASHER</span></h1><button onClick={() => { setSelectedLeague(world.competitions[0]); setGameState('SETUP_TEAM'); }} className="p-8 bg-slate-300 border border-slate-500 hover:bg-slate-400 rounded-sm text-left transition-all group shadow-md flex flex-col items-center text-center"><h3 className="text-2xl font-black text-slate-950 mb-1 italic uppercase">Liga Argentina</h3><p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Primera y Segunda División</p></button></div></div>;
  
  if (gameState === 'SETUP_TEAM') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4"><div className="max-w-6xl w-full bg-slate-200 rounded-sm p-10 border border-slate-600 shadow-2xl max-h-[90vh] overflow-y-auto"><h1 className="text-3xl font-black text-slate-950 mb-8 italic uppercase border-b-4 border-slate-950 pb-2">Elige tu Equipo</h1><div className="space-y-8"><div><h3 className="text-slate-950 font-black mb-4 uppercase text-[12px] tracking-widest bg-slate-300 p-2 rounded-sm border-l-8 border-slate-950">Liga Profesional</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{world.getClubsByLeague('L_ARG_1').map(c => <button key={c.id} onClick={() => { setUserClub(c); initSeasonFixtures(currentDate); updateNextFixture(fixtures, currentDate, c.id); setGameState('PLAYING'); }} className="p-4 bg-slate-100 hover:bg-slate-300 border border-slate-500 rounded-sm text-left transition-all shadow-sm group border-l-4 hover:border-l-blue-600"><div className={`w-3 h-3 rounded-full mb-3 ${c.primaryColor} border border-slate-500`}></div><p className="font-black text-slate-950 truncate text-[11px] uppercase group-hover:text-blue-700">{c.name}</p></button>)}</div></div><div><h3 className="text-slate-950 font-black mb-4 uppercase text-[12px] tracking-widest bg-slate-300 p-2 rounded-sm border-l-8 border-slate-950">Primera Nacional</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{world.getClubsByLeague('L_ARG_2').map(c => <button key={c.id} onClick={() => { setUserClub(c); initSeasonFixtures(currentDate); updateNextFixture(fixtures, currentDate, c.id); setGameState('PLAYING'); }} className="p-4 bg-slate-100 hover:bg-slate-300 border border-slate-500 rounded-sm text-left transition-all shadow-sm group border-l-4 hover:border-l-blue-600"><div className={`w-3 h-3 rounded-full mb-3 ${c.primaryColor} border border-slate-500`}></div><p className="font-black text-slate-950 truncate text-[11px] uppercase group-hover:text-blue-700">{c.name}</p></button>)}</div></div></div></div></div>;

  const isMatchView = currentView === 'MATCH';
  const isPreMatchView = currentView === 'PRE_MATCH';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-400 text-slate-950 overflow-hidden font-sans relative text-sm">
      <div className={`h-1 w-full ${userClub?.primaryColor || 'bg-slate-800'}`}></div>
      <header className="h-12 bg-gradient-to-b from-slate-200 to-slate-300 border-b border-slate-600 flex items-center justify-between px-4 shadow-sm z-[110] shrink-0">
        <div className="flex items-center gap-4">
           {!isMatchView && (
             <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-slate-900 hover:opacity-80 transition-opacity">
                <Menu size={20} />
             </button>
           )}
           <div className="flex items-center gap-3">
              <div className={`w-1.5 h-8 ${userClub?.primaryColor || 'bg-slate-800'} border-x border-black/10`}></div>
              <h1 className="text-sm font-black text-slate-950 uppercase tracking-tight italic drop-shadow-sm truncate max-w-[120px] sm:max-w-none">{userClub?.name}</h1>
           </div>
           <div className="hidden sm:block w-px h-6 bg-slate-500 mx-2"></div>
           <div className="hidden sm:block font-mono text-[11px] text-slate-700 font-black uppercase tracking-widest">{currentDate.toLocaleDateString()}</div>
        </div>

        {!isMatchView && (
          <FMButton 
            variant={isPreMatchView ? "primary" : "primary"} 
            onClick={advanceTime}
            className={isPreMatchView ? "bg-slate-950 text-white animate-pulse" : ""}
          >
              {isPreMatchView ? (
                <> <Zap size={10} fill="currentColor" /> Jugar Partido </>
              ) : (
                <> <Play size={10} fill="currentColor" /> Continuar </>
              )}
          </FMButton>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentView={currentView} setView={(v) => { setView(v); setIsSidebarOpen(false); }} club={userClub!} onVacation={() => setIsVacationModalOpen(true)} />
        <main className="flex-1 flex flex-col min-w-0 bg-[#94a3b8] relative overflow-hidden">
          {renderCurrentView()}
        </main>
      </div>

      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-slate-200 w-full max-w-sm rounded-sm border border-slate-600 p-8 text-center shadow-2xl">
            {isSimulating ? (
               <div className="space-y-6">
                  <RefreshCw size={48} className="text-slate-950 animate-spin mx-auto" />
                  <h2 className="text-xl font-black text-slate-950 uppercase italic">Simulando...</h2>
                  <p className="text-slate-600 font-mono font-bold text-lg">{currentDate.toLocaleDateString()}</p>
               </div>
            ) : (
               <>
                  <Sun size={48} className="text-orange-600 mx-auto mb-4" />
                  <h2 className="text-lg font-black text-slate-950 mb-6 uppercase italic tracking-widest border-b-2 border-slate-400 pb-2">Planificar Vacaciones</h2>
                  <div className="space-y-4">
                     <div className="text-left"><label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Fecha de Regreso:</label><input type="date" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-3 py-2 text-slate-950 font-bold text-sm" value={vacationTargetDate} onChange={(e) => setVacationTargetDate(e.target.value)} /></div>
                     <FMButton variant="vacation" onClick={startVacation} className="w-full py-4 text-xs">Iniciar Simulación</FMButton>
                     <FMButton variant="secondary" onClick={() => setIsVacationModalOpen(false)} className="w-full">Cancelar</FMButton>
                  </div>
               </>
            )}
          </div>
        </div>
      )}

      {selectedPlayer && <PlayerModal player={selectedPlayer} userClubId={userClub!.id} onClose={() => setSelectedPlayer(null)} currentDate={currentDate} />}
      {contextMenu && <PlayerContextMenu player={contextMenu.player} x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onUpdate={() => setForceUpdate(v => v + 1)} />}
      {seasonSummary && <SeasonSummaryModal summary={seasonSummary} userWonLeague={userWonLeague} onClose={() => { setSeasonSummary(null); setUserWonLeague(false); }} />}
    </div>
  );
};
export default App;