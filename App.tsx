
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
import { RefreshCw, Globe, Play, Sun, X, Menu, Mail, Clock, Trophy as CupIcon, Calendar as CalendarIcon } from 'lucide-react';

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
    const cupDate = new Date(startFrom); cupDate.setMonth(startFrom.getMonth() + 2);
    world.competitions.filter(c => c.type === 'CUP').forEach(cup => {
       const clubs = world.getClubsByLeague(`L_${cup.id.split('_')[1]}`);
       if (clubs.length > 0) allFixtures.push(...Scheduler.generateCupRound(cup.id, clubs, cupDate, 'ROUND_OF_16'));
    });
    const eliteCompetition = world.competitions.find(c => c.id === 'CONT_ELITE');
    if (eliteCompetition) {
       allFixtures.push(...Scheduler.generateContinentalGroups(eliteCompetition.id, world.clubs.filter(c => c.reputation > 7000), new Date(startFrom.getTime() + 864000000)));
    }
    setFixtures(allFixtures);
    if (userClub) updateNextFixture(allFixtures, startFrom, userClub.id);
  };

  const updateNextFixture = (allFixtures: Fixture[], date: Date, clubId: string) => {
     const next = allFixtures.find(f => !f.played && f.date.getTime() >= date.getTime() && (f.homeTeamId === clubId || f.awayTeamId === clubId) && f.squadType === 'SENIOR');
     setNextFixture(next || null);
  };

  const advanceTime = () => {
     if (currentDate >= seasonEndDate) { finishSeason(); return; }
     const nextDay = new Date(currentDate);
     nextDay.setDate(currentDate.getDate() + 1);
     setCurrentDate(nextDay);
     LifecycleManager.checkBirthdays(nextDay);
     world.checkRenewalTriggers(nextDay);
     world.processTransferDecisions(nextDay);
     simulateDay(nextDay);
     if (userClub) updateNextFixture(fixtures, nextDay, userClub.id);
     if (nextFixture && nextFixture.date.toDateString() === nextDay.toDateString()) setView('PRE_MATCH');
     setForceUpdate(v => v + 1);
  };

  const simulateDay = (day: Date) => {
    const dayFixtures = fixtures.filter(f => f.date.toDateString() === day.toDateString() && !f.played);
    dayFixtures.forEach(f => {
       f.played = true; f.homeScore = randomInt(0, 3); f.awayScore = randomInt(0, 3);
       const hEleven = world.getPlayersByClub(f.homeTeamId).filter(p => p.squad === f.squadType).slice(0, 11);
       const aEleven = world.getPlayersByClub(f.awayTeamId).filter(p => p.squad === f.squadType).slice(0, 11);
       const dummyStats: Record<string, any> = {};
       [...hEleven, ...aEleven].forEach(p => { dummyStats[p.id] = { rating: 6 + Math.random()*2, goals: 0, assists: 0 }; });
       MatchSimulator.finalizeSeasonStats(hEleven, aEleven, dummyStats, f.homeScore || 0, f.awayScore || 0);
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
      world.checkRenewalTriggers(tempDate);
      world.processTransferDecisions(tempDate);
      simulateDay(tempDate);
      if (tempDate >= seasonEndDate) { finishSeason(); break; }
      await new Promise(r => setTimeout(r, 20)); // Velocidad de simulación
    }
    if (userClub) updateNextFixture(fixtures, tempDate, userClub.id);
    setIsSimulating(false); setIsVacationModalOpen(false); setView('HOME');
    setForceUpdate(v => v + 1);
  };

  const finishSeason = () => {
     const summaries = LifecycleManager.processEndOfSeason(fixtures);
     setSeasonSummary(summaries);
     if (userClub) {
        const win = summaries.some(s => s.championId === userClub.id);
        setUserWonLeague(win);
     }
     const nextSeasonStart = new Date(currentDate.getFullYear(), 7, 1);
     setCurrentDate(nextSeasonStart); initSeasonFixtures(nextSeasonStart); setView('HOME');
  };

  const renderSchedule = (squadType: SquadType) => {
    const squadFixtures = fixtures.filter(f => (f.homeTeamId === userClub?.id || f.awayTeamId === userClub?.id) && f.squadType === squadType);
    return (
      <div className="p-4 md:p-6 h-full flex flex-col">
         <h2 className="text-xl md:text-2xl font-bold text-white mb-6 uppercase italic tracking-tighter">Calendario - {squadType}</h2>
         <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 overflow-y-auto shadow-2xl">
            {squadFixtures.length === 0 ? <p className="p-8 text-slate-500 text-center italic">No hay partidos programados.</p> : squadFixtures.map(f => {
              const home = world.getClub(f.homeTeamId); const away = world.getClub(f.awayTeamId);
              return (
                <div key={f.id} className={`flex flex-col sm:flex-row items-center p-4 border-b border-slate-700/50 last:border-0 hover:bg-slate-700/20 transition-colors`}>
                  <div className="w-full sm:w-32 text-slate-500 font-mono text-[10px] mb-2 sm:mb-0 text-center sm:text-left">{f.date.toLocaleDateString()}</div>
                  <div className="flex items-center w-full">
                    <div className="flex-1 text-right font-bold pr-4 text-slate-200 text-xs sm:text-sm">{home?.name}</div>
                     <div className={`w-14 text-center py-1 rounded font-black text-xs bg-slate-900 border border-slate-700 ${f.played ? 'text-600' : 'text-slate-500'}`}>{f.played ? `${f.homeScore} - ${f.awayScore}` : 'VS'}</div>
                    <div className="flex-1 text-left font-bold pl-4 text-slate-200 text-xs sm:text-sm">{away?.name}</div>
                  </div>
                </div>
              )
            })}
         </div>
      </div>
    );
  };

  const renderContent = () => {
    if (currentView === 'HOME') return (
      <div className="p-6 space-y-6">
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
             <div className="lg:col-span-2 p-8 rounded-xl border shadow-2xl relative overflow-hidden" style={{ background: 'linear-gradient(to bottom right, rgba(102, 102, 102, 0.2), #1e293b)', borderColor: '#999' }}>
                <div className="absolute top-0 right-0 p-4 opacity-10"><Globe size={120} style={{ color: '#999' }} /></div>
                <h3 className="font-black uppercase text-xs tracking-[0.2em] mb-4" style={{ color: '#666' }}>Próximo Encuentro</h3>
               {nextFixture ? (
                  <div className="flex items-center justify-center gap-12 py-4 relative z-10">
                     <div className="text-center"><div className={`w-20 h-20 rounded-full mx-auto mb-3 shadow-xl flex items-center justify-center text-white font-black text-2xl ${userClub!.primaryColor}`}>{userClub!.shortName}</div><p className="font-bold text-white text-sm">{userClub?.name}</p></div>
                     <div className="text-5xl font-black text-slate-700 italic">VS</div>
                     <div className="text-center"><div className={`w-20 h-20 rounded-full mx-auto mb-3 shadow-xl flex items-center justify-center text-white font-black text-2xl ${world.getClub(nextFixture.homeTeamId === userClub!.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.primaryColor}`}>{world.getClub(nextFixture.homeTeamId === userClub!.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.shortName}</div><p className="font-bold text-white text-sm">{world.getClub(nextFixture.homeTeamId === userClub!.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)?.name}</p></div>
                  </div>
               ) : <p className="text-center text-slate-500 italic py-10">No hay partidos próximos.</p>}
               <div className="mt-6 text-center text-slate-400 font-mono text-[10px] uppercase tracking-widest">{nextFixture?.date.toLocaleDateString()}</div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl flex flex-col cursor-pointer" onClick={() => setView('INBOX')}>
               <div className="flex items-center gap-2 text-slate-400 font-black text-xs uppercase mb-4"><Mail size={14}/> Buzón Reciente</div>
               <div className="space-y-3 overflow-y-auto scrollbar-hide">{world.inbox.slice(0, 3).map(m => <div key={m.id} className="p-3 bg-slate-900/50 rounded-lg border border-slate-700"><p className="text-[10px] font-black text-white truncate">{m.subject}</p><p className="text-[9px] text-slate-500 line-clamp-1">{m.body}</p></div>)}</div>
            </div>
         </div>
      </div>
    );
    if (currentView === 'INBOX') return <InboxView onUpdate={() => setForceUpdate(v => v + 1)} />;
    if (currentView === 'TABLE') return <div className="p-6 h-full flex flex-col"><h2 className="text-2xl font-bold text-white mb-4 uppercase italic tracking-tighter">Clasificación</h2><LeagueTable entries={world.getLeagueTable(viewLeagueId || userClub!.leagueId, fixtures, viewSquadType)} userClubId={userClub!.id} allLeagues={world.getLeagues()} currentLeagueId={viewLeagueId || userClub!.leagueId} onLeagueChange={setViewLeagueId} currentSquadType={viewSquadType} onSquadTypeChange={setViewSquadType} /></div>;
    if (currentView === 'PRE_MATCH' && nextFixture) return <PreMatchView club={userClub!} opponent={world.getClub(nextFixture.homeTeamId === userClub?.id ? nextFixture.awayTeamId : nextFixture.homeTeamId)!} starters={world.getPlayersByClub(userClub!.id).filter(p => p.isStarter && p.squad === 'SENIOR')} onStart={() => setView('MATCH')} onGoToTactics={() => setView('SENIOR_TACTICS')} />;
    if (currentView === 'MATCH' && nextFixture) return <MatchView homeTeam={nextFixture.homeTeamId === userClub?.id ? userClub! : world.getClub(nextFixture.homeTeamId)!} awayTeam={nextFixture.homeTeamId === userClub?.id ? world.getClub(nextFixture.awayTeamId)! : userClub!} homePlayers={world.getPlayersByClub(nextFixture.homeTeamId).filter(p => p.isStarter)} awayPlayers={world.getPlayersByClub(nextFixture.awayTeamId).filter(p => p.isStarter)} onFinish={(h,a) => { nextFixture.played = true; nextFixture.homeScore = h; nextFixture.awayScore = a; setView('HOME'); updateNextFixture(fixtures, currentDate, userClub!.id); setForceUpdate(v=>v+1); }} />;
    if (currentView === 'MARKET') return <MarketView userClubId={userClub!.id} onSelectPlayer={setSelectedPlayer} currentDate={currentDate} />;
    if (currentView === 'SEARCH') return <SearchView onSelectPlayer={setSelectedPlayer} />;
    if (currentView === 'NEGOTIATIONS') return <NegotiationsView userClubId={userClub!.id} onUpdate={() => setForceUpdate(v => v + 1)} currentDate={currentDate} />;
    if (currentView === 'ECONOMY') return <EconomyView club={userClub!} />;
    if (currentView === 'STAFF') return <StaffView staff={world.getStaffByClub(userClub!.id)} />;
    if (currentView === 'CLUB_REPORT') return <ClubReport club={userClub!} />;
    if (currentView.endsWith('_SQUAD')) return <SquadView players={world.getPlayersByClub(userClub!.id).filter(p => p.squad === currentView.split('_')[0] as SquadType)} onSelectPlayer={setSelectedPlayer} onContextMenu={handlePlayerContextMenu} />;
    if (currentView.endsWith('_TACTICS')) return <TacticsView club={userClub!} players={world.getPlayersByClub(userClub!.id).filter(p => p.squad === currentView.split('_')[0] as SquadType)} onUpdatePlayer={() => setForceUpdate(v => v + 1)} onContextMenu={handlePlayerContextMenu} />;
    if (currentView.endsWith('_SCHEDULE')) return renderSchedule(currentView.split('_')[0] as SquadType);
    if (currentView.startsWith('COMP_')) {
       const compId = currentView.replace('COMP_', '');
       const competition = world.competitions.find(c => c.id === compId);
       if (!competition) return null;
       return <TournamentHub competition={competition} fixtures={fixtures} userClubId={userClub!.id} />;
    }
    return null;
  };

  if (gameState === 'LOADING') return <div className="h-screen w-screen flex items-center justify-center" style={{ backgroundColor: '#dcdcdc', color: '#333' }}><div className="animate-pulse flex flex-col items-center"><RefreshCw className="w-10 h-10 animate-spin mb-4" style={{ color: '#0066cc' }} /><h1 className="text-2xl font-bold">OpenFM 2008</h1></div></div>;
  if (gameState === 'SETUP_LEAGUE') return <div className="h-screen w-screen flex items-center justify-center p-4" style={{ backgroundColor: '#dcdcdc', color: '#333' }}><div className="max-w-4xl w-full metallic-panel rounded-lg p-10 text-center shadow-2xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}><h1 className="text-4xl font-black mb-10 tracking-tighter italic" style={{ color: '#333' }}>OPEN<span style={{ color: '#0066cc' }}>FM</span></h1><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{world.getLeagues().map(l => <button key={l.id} onClick={() => { setSelectedLeague(l); setGameState('SETUP_TEAM'); }} className="p-8 rounded-xl text-left transition-all group shadow-lg border" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d0d0d0'; e.currentTarget.style.borderColor = '#666'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; e.currentTarget.style.borderColor = '#999'; }}><h3 className="text-xl font-bold mb-1 group-hover:scale-105 transition-transform" style={{ color: '#333' }}>{l.name}</h3><p className="text-xs font-bold" style={{ color: '#666' }}>{l.country}</p></button>)}</div></div></div>;
  if (gameState === 'SETUP_TEAM') return <div className="h-screen w-screen flex items-center justify-center p-4" style={{ backgroundColor: '#dcdcdc', color: '#333' }}><div className="max-w-6xl w-full metallic-panel rounded-lg p-10 shadow-2xl max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}><h1 className="text-2xl font-bold mb-8" style={{ color: '#333' }}>Elige tu Equipo</h1><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{world.getClubsByLeague(selectedLeague!.id).map(c => <button key={c.id} onClick={() => { setUserClub(c); initSeasonFixtures(currentDate); updateNextFixture(fixtures, currentDate, c.id); setGameState('PLAYING'); }} className="p-4 rounded-xl text-left transition-all shadow-md border" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#d0d0d0'; e.currentTarget.style.borderColor = '#666'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#e8e8e8'; e.currentTarget.style.borderColor = '#999'; }}><div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: c.primaryColor.replace('bg-', '') }}></div><p className="font-black truncate text-xs uppercase" style={{ color: '#333' }}>{c.name}</p></button>)}</div></div></div>;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans relative fm-compact" style={{ backgroundColor: '#dcdcdc', color: '#333', fontFamily: 'Verdana, Arial, sans-serif' }}>
      <header className="h-20 flex items-center justify-between px-6 sm:px-8 shadow-xl z-[110] shrink-0 relative fm-header" style={{ background: `linear-gradient(to right, ${userClub?.primaryColor || '#0066cc'}, #1a1a1a)`, borderBottom: `4px solid ${userClub?.secondaryColor || '#cc0000'}` }}>
        <div className="flex items-center gap-6">
           <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-white/90 hover:text-white transition-colors">
              <Menu size={28} />
           </button>
           <div className="flex flex-col">
              <h1 className="text-lg sm:text-2xl font-black text-white truncate drop-shadow-md tracking-tighter uppercase italic leading-none">
                {userClub?.name}
              </h1>
              <p className="text-[10px] text-white/80 font-bold uppercase tracking-[0.2em] italic mt-1">Mánager General</p>
           </div>
           <div className="hidden md:flex h-8 w-px bg-white/10 mx-2"></div>
           <div className="hidden md:flex flex-col">
              <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">Fecha Actual</span>
              <div className="text-sm font-mono text-white font-bold">{currentDate.toLocaleDateString()}</div>
           </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden lg:flex flex-col items-end text-right mr-2">
            <span className="text-[10px] text-white/60 font-black uppercase tracking-widest">OpenFM 2008 Browser</span>
            <span className="text-[9px] text-white/40 font-bold uppercase italic">Simulación Avanzada</span>
          </div>
          <button 
            onClick={advanceTime} 
            className="bg-white hover:bg-slate-100 text-slate-900 text-xs font-black px-6 sm:px-10 py-3 rounded-full shadow-2xl active:scale-95 flex items-center gap-2 tracking-[0.2em] transition-all border border-black/5"
          >
            <Play size={16} fill="currentColor" /> CONTINUAR
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentView={currentView} setView={(v) => { setView(v); setIsSidebarOpen(false); }} club={userClub!} onVacation={() => setIsVacationModalOpen(true)} />
        <main className="flex-1 flex flex-col min-w-0 relative overflow-y-auto" style={{ backgroundColor: '#e8e8e8' }}>
          {renderContent()}
        </main>
      </div>

      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[500] flex items-center justify-center p-6 backdrop-blur-sm">
          <div className="metallic-panel w-full max-w-md rounded-lg p-10 text-center shadow-2xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
            {isSimulating ? (
               <div className="space-y-8 animate-pulse">
                  <div className="relative w-24 h-24 mx-auto"><Sun size={96} className="text-orange-500 animate-spin" /><Clock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-black" size={24} /></div>
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase" style={{ color: '#333' }}>De Vacaciones</h2>
                  <p className="font-mono text-xl" style={{ color: '#666' }}>{currentDate.toLocaleDateString()}</p>
                  <div className="w-full h-2 rounded-full overflow-hidden border" style={{ backgroundColor: '#e0e0e0', borderColor: '#999' }}><div className="h-full animate-[loading_2s_infinite]" style={{ backgroundColor: '#ff9900', width: '100%' }}></div></div>
               </div>
            ) : (
               <>
                  <Sun size={64} className="text-orange-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-black mb-2 uppercase tracking-tighter italic" style={{ color: '#333' }}>Tomar Vacaciones</h2>
                  <p className="text-xs mb-8" style={{ color: '#666' }}>El asistente técnico se encargará de las alineaciones.</p>
                  <div className="space-y-4">
                     <div className="text-left"><label className="text-[10px] font-black uppercase block mb-2" style={{ color: '#666' }}>Regresar el día:</label><input type="date" className="w-full border rounded-xl px-4 py-3 font-bold" style={{ backgroundColor: '#e8e8e8', borderColor: '#999', color: '#333' }} value={vacationTargetDate} onChange={(e) => setVacationTargetDate(e.target.value)} /></div>
                     <button onClick={startVacation} className="w-full py-4 font-black rounded-xl shadow-xl uppercase tracking-widest text-xs" style={{ backgroundColor: '#ff9900', color: '#fff' }}>Iniciar Simulación</button>
                     <button onClick={() => setIsVacationModalOpen(false)} className="w-full py-2 font-black uppercase text-[10px] hover:underline" style={{ color: '#666' }}>Cancelar</button>
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
