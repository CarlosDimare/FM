
import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { PlayerModal } from './components/PlayerModal';
import { MatchView } from './components/MatchView';
import { TacticsView } from './components/TacticsView'; 
import { LeagueTable } from './components/LeagueTable';
import { SquadView } from './components/SquadView';
import { StaffView } from './components/StaffView';
import { TrainingView } from './components/TrainingView';
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
import { ClubsListView } from './components/ClubsListView';
import { world } from './services/worldManager';
import { Scheduler } from './services/scheduler';
import { LifecycleManager } from './services/lifecycleManager'; 
import { Club, Player, Competition, Fixture, SquadType, InboxMessage } from './types';
import { randomInt, saveGame, loadGame, checkSaveExists, listSaves, SaveMetadata, deleteSave, generateUUID } from './services/utils';
import { MatchSimulator } from './services/engine';
import { RefreshCw, Globe, Play, Sun, Menu, Zap, Mail, Trophy, ChevronRight, User, ArrowLeft, Save, HardDrive, Trash2, X, Plus } from 'lucide-react';
import { FMButton, FMBox } from './components/FMUI';

type GameState = 'LOADING' | 'SETUP_USER' | 'SETUP_LEAGUE' | 'SETUP_TEAM' | 'PLAYING';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>('LOADING');
  const [currentView, setView] = useState('HOME');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [contextMenu, setContextMenu] = useState<{ player: Player, x: number, y: number } | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // User Profile State
  const [userName, setUserName] = useState("Manager");
  const [userSurname, setUserSurname] = useState("Novato");

  const [selectedLeague, setSelectedLeague] = useState<Competition | null>(null);
  const [userClub, setUserClub] = useState<Club | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0); 

  const [viewExternalClub, setViewExternalClub] = useState<Club | null>(null);

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
  const [seasonEndDate, setSeasonEndDate] = useState(new Date(2009, 6, 10));

  const [hasSave, setHasSave] = useState(false);
  
  // Save/Load Modals
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveNameInput, setSaveNameInput] = useState("");
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [availableSaves, setAvailableSaves] = useState<SaveMetadata[]>([]);

  useEffect(() => {
    checkSaveExists().then(exists => setHasSave(exists));
    setTimeout(() => { setGameState('SETUP_USER'); }, 800);
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

  const initSeasonFixtures = (startFrom: Date, clubId?: string): Fixture[] => {
    const allFixtures: Fixture[] = [];
    
    // Generate Leagues
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

    // CONTINENTAL COMPETITIONS
    const libertadores = world.competitions.find(c => c.id === 'CONT_LIB');
    const sudamericana = world.competitions.find(c => c.id === 'CONT_SUD');

    let libArg = world.clubs.filter(c => c.qualifiedFor === 'CONT_LIB');
    let sudArg = world.clubs.filter(c => c.qualifiedFor === 'CONT_SUD');

    if (libArg.length === 0 && sudArg.length === 0) {
        const allArgTeams = world.getClubsByLeague('L_ARG_1').sort((a,b) => b.reputation - a.reputation);
        libArg = allArgTeams.slice(0, 6);
        sudArg = allArgTeams.slice(6, 12);
    }

    const allContTeams = world.getClubsByLeague('L_SAM_OTHER').sort((a,b) => b.reputation - a.reputation);
    const allArgTeams = world.getClubsByLeague('L_ARG_1').sort((a,b) => b.reputation - a.reputation);

    const targetSize = 32;

    let libPool = [...libArg];
    if (libPool.length < targetSize) {
        const needed = targetSize - libPool.length;
        const fromCont = allContTeams.slice(0, needed);
        libPool = [...libPool, ...fromCont];
        
        if (libPool.length < targetSize) {
            const moreNeeded = targetSize - libPool.length;
            const moreArg = allArgTeams.filter(c => !libPool.includes(c)).slice(0, moreNeeded);
            libPool = [...libPool, ...moreArg];
        }
    }

    let sudPool = [...sudArg];
    const usedIds = new Set(libPool.map(c => c.id));
    const availableCont = allContTeams.filter(c => !usedIds.has(c.id));
    
    if (sudPool.length < targetSize) {
        const needed = targetSize - sudPool.length;
        const fromCont = availableCont.slice(0, needed);
        sudPool = [...sudPool, ...fromCont];

         if (sudPool.length < targetSize) {
            const moreNeeded = targetSize - sudPool.length;
            const moreArg = allArgTeams.filter(c => !usedIds.has(c.id) && !sudPool.includes(c)).slice(0, moreNeeded);
            sudPool = [...sudPool, ...moreArg];
        }
    }

    if (libertadores && libPool.length >= 32) {
       const finalLibPool = libPool.slice(0, 32);
       const groupStageStart = new Date(startFrom.getTime() + 1000 * 60 * 60 * 24 * 150); 
       allFixtures.push(...Scheduler.generateContinentalGroups(libertadores.id, finalLibPool, groupStageStart)); 
    }

    if (sudamericana && sudPool.length >= 32) {
       const finalSudPool = sudPool.slice(0, 32); 
       const groupStageStart = new Date(startFrom.getTime() + 1000 * 60 * 60 * 24 * 157); 
       allFixtures.push(...Scheduler.generateContinentalGroups(sudamericana.id, finalSudPool, groupStageStart));
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
    if (clubId) updateNextFixture(allFixtures, startFrom, clubId);
    return allFixtures;
  };

  const updateNextFixture = (allFixtures: Fixture[], date: Date, clubId: string) => {
     const next = allFixtures.find(f => !f.played && f.date.getTime() >= date.getTime() && (f.homeTeamId === clubId || f.awayTeamId === clubId) && f.squadType === 'SENIOR');
     setNextFixture(next || null);
  };

  const advanceTime = () => {
     if (currentView === 'PRE_MATCH') {
        handleStartMatch();
        return;
     }

     if (currentDate >= seasonEndDate) { finishSeason(); return; }
     
     // CRITICAL: only block time advance if there's a manual SENIOR match for the user.
     if (userClub) {
        const hasUserSeniorMatchToday = fixtures.some(f => 
            !f.played && 
            f.date.toDateString() === currentDate.toDateString() && 
            (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
            f.squadType === 'SENIOR'
        );
        if (hasUserSeniorMatchToday) {
           setView('PRE_MATCH');
           return;
        }

        // Simulate everything else for today (including user club's Reserve/U20 matches)
        simulateDay(currentDate); 
     }

     const nextDay = new Date(currentDate);
     nextDay.setDate(currentDate.getDate() + 1);
     
     let userMatchTomorrow = null;
     if (userClub) {
        userMatchTomorrow = fixtures.find(f => 
           !f.played && 
           f.date.toDateString() === nextDay.toDateString() && 
           (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
           f.squadType === 'SENIOR'
        );
     }

     setCurrentDate(nextDay);
     LifecycleManager.checkBirthdays(nextDay);
     LifecycleManager.recoverDailyFitness(); 
     world.checkRenewalTriggers(nextDay, userClub?.id);
     world.processTransferDecisions(nextDay);
     world.processAIActivity(nextDay); 
     world.processDailyContracts(nextDay, userClub?.id);
     
     const newCupFixtures = LifecycleManager.processCompetitionProgress(fixtures, nextDay);
     if (newCupFixtures.length > 0) {
        setFixtures(prev => [...prev, ...newCupFixtures]);
        if (userClub && !userMatchTomorrow) {
           userMatchTomorrow = newCupFixtures.find(f => 
              f.date.toDateString() === nextDay.toDateString() && 
              (f.homeTeamId === userClub.id || f.awayTeamId === userClub.id) &&
              f.squadType === 'SENIOR'
           );
        }
     }

     if (userClub) updateNextFixture([...fixtures, ...newCupFixtures], nextDay, userClub.id);
     if (userMatchTomorrow) setView('PRE_MATCH');
     else if (nextFixture && nextFixture.date.toDateString() === nextDay.toDateString()) setView('PRE_MATCH');
     setForceUpdate(v => v + 1);
  };

  const simulateDay = (day: Date) => {
    // Find all unplayed matches for the day.
    // Note: User's manual SENIOR matches are already checked and blocked in advanceTime, 
    // so we can safely simulate anything that is still !played here.
    const dayFixtures = fixtures.filter(f => 
        f.date.toDateString() === day.toDateString() && 
        !f.played
    );
    
    if (dayFixtures.length === 0) return;

    dayFixtures.forEach(f => {
       const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
       f.played = true; 
       f.homeScore = homeScore; 
       f.awayScore = awayScore;
       const hSquad = world.getPlayersByClub(f.homeTeamId).filter(p => p.squad === f.squadType);
       const aSquad = world.getPlayersByClub(f.awayTeamId).filter(p => p.squad === f.squadType);
       MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
       LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId);
    });

    // Commit changes to state
    setFixtures([...fixtures]);
  };

  const startVacation = async (targetOverride?: Date) => {
    let target = targetOverride;
    if (!target) {
       if (!vacationTargetDate) return;
       target = new Date(vacationTargetDate);
    }
    
    if (target <= currentDate) return;
    setIsSimulating(true);
    
    let tempDate = new Date(currentDate);
    let localFixtures = [...fixtures];

    while (tempDate < target) {
      tempDate.setDate(tempDate.getDate() + 1);
      setCurrentDate(new Date(tempDate));
      LifecycleManager.checkBirthdays(tempDate);
      LifecycleManager.recoverDailyFitness();
      world.checkRenewalTriggers(tempDate, userClub?.id);
      world.processTransferDecisions(tempDate);
      world.processAIActivity(tempDate);
      world.processDailyContracts(tempDate, userClub?.id);
      
      const dayFixtures = localFixtures.filter(f => 
        f.date.toDateString() === tempDate.toDateString() && 
        !f.played
      );
      dayFixtures.forEach(f => {
         const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, f.squadType);
         f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
         const hSquad = world.getPlayersByClub(f.homeTeamId).filter(p => p.squad === f.squadType);
         const aSquad = world.getPlayersByClub(f.awayTeamId).filter(p => p.squad === f.squadType);
         MatchSimulator.finalizeSeasonStats(hSquad, aSquad, stats, homeScore, awayScore, f.competitionId);
         LifecycleManager.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId);
      });

      const newCupFixtures = LifecycleManager.processCompetitionProgress(localFixtures, tempDate);
      if (newCupFixtures.length > 0) {
         localFixtures = [...localFixtures, ...newCupFixtures];
      }
      
      if (tempDate >= seasonEndDate) { 
          setFixtures(localFixtures);
          finishSeason(tempDate); 
          setIsSimulating(false);
          setIsVacationModalOpen(false);
          return;
      }
      await new Promise(r => setTimeout(r, 20)); 
    }
    
    if (tempDate < seasonEndDate) {
        setFixtures(localFixtures);
        if (userClub) updateNextFixture(localFixtures, tempDate, userClub.id);
        setIsSimulating(false); setIsVacationModalOpen(false); setView('HOME');
        setForceUpdate(v => v + 1);
    }
  };

  const finishSeason = (dateOverride?: Date) => {
     const refDate = dateOverride || currentDate;
     const summaries = LifecycleManager.processEndOfSeason(fixtures, userClub?.id, refDate);
     setSeasonSummary(summaries);
     if (userClub) setUserWonLeague(summaries.some(s => s.championId === userClub.id));
     
     const currentYear = refDate.getFullYear();
     const nextSeasonStart = new Date(currentYear, 6, 20); 
     const nextSeasonEnd = new Date(currentYear + 1, 6, 10); 

     setSeasonEndDate(nextSeasonEnd); 
     setCurrentDate(nextSeasonStart); 
     
     initSeasonFixtures(nextSeasonStart, userClub?.id); 
     setView('HOME');
  };

  const handleOpenSaveModal = () => {
     setSaveNameInput(`${userClub?.shortName} - ${currentDate.toLocaleDateString()}`);
     setIsSaveModalOpen(true);
  };

  const confirmSaveGame = async () => {
    if (!userClub || !saveNameInput.trim()) return;
    try {
        const id = generateUUID();
        const saveData = {
            id,
            label: saveNameInput,
            lastPlayed: new Date(),
            metaTeamName: userClub.name,
            metaManagerName: `${userName} ${userSurname}`,
            gameState: {
                currentDate,
                userName,
                userSurname,
                userClubId: userClub.id,
                fixtures,
                seasonEndDate
            },
            worldState: {
                players: world.players,
                clubs: world.clubs,
                competitions: world.competitions,
                staff: world.staff,
                tactics: world.tactics,
                offers: world.offers,
                inbox: world.inbox
            }
        };
        await saveGame(saveData);
        setHasSave(true);
        setIsSaveModalOpen(false);
        alert("Partida guardada correctamente.");
    } catch (e) {
        console.error(e);
        alert("Error al guardar la partida.");
    }
  };

  const handleOpenLoadModal = async () => {
     const saves = await listSaves();
     setAvailableSaves(saves);
     setIsLoadModalOpen(true);
  };

  const confirmLoadGame = async (id: string) => {
    try {
        const data = await loadGame(id);
        if (!data) { alert("No se pudo cargar la partida."); return; }
        
        world.players = data.worldState.players;
        world.clubs = data.worldState.clubs;
        world.competitions = data.worldState.competitions;
        world.staff = data.worldState.staff;
        world.tactics = data.worldState.tactics;
        world.offers = data.worldState.offers;
        world.inbox = data.worldState.inbox;
        
        setCurrentDate(data.gameState.currentDate);
        setUserName(data.gameState.userName);
        setUserSurname(data.gameState.userSurname);
        
        const club = world.getClub(data.gameState.userClubId);
        setUserClub(club || null);
        
        setFixtures(data.gameState.fixtures);
        setSeasonEndDate(data.gameState.seasonEndDate);
        
        if (club) {
            updateNextFixture(data.gameState.fixtures, data.gameState.currentDate, club.id);
        }
        
        setIsLoadModalOpen(false);
        setGameState('PLAYING');
        setView('HOME');
        setForceUpdate(v => v + 1);
        
    } catch (e) {
        console.error(e);
        alert("Error al cargar la partida.");
    }
  };

  const handleDeleteSave = async (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     if(confirm("¿Estás seguro de borrar esta partida?")) {
        await deleteSave(id);
        const saves = await listSaves();
        setAvailableSaves(saves);
        if(saves.length === 0) setHasSave(false);
     }
  }

  const handleStartMatch = () => {
    if (nextFixture) setView('MATCH');
  };

  const getMatchSquad = (clubId: string) => {
    const clubPlayers = world.getPlayersByClub(clubId);
    let starters = clubPlayers.filter(p => p.isStarter && p.tacticalPosition !== undefined)
                       .sort((a,b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0));
    
    if (starters.length < 11) {
       world.selectBestEleven(clubId, 'SENIOR');
       starters = world.getPlayersByClub(clubId)
          .filter(p => p.isStarter && p.tacticalPosition !== undefined)
          .sort((a,b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0));
    }

    const bench = clubPlayers
                    .filter(p => !p.isStarter && !p.injury && (!p.suspension || p.suspension.matchesLeft === 0))
                    .sort((a,b) => b.currentAbility - a.currentAbility)
                    .slice(0, 9); 

    return [...starters, ...bench];
  };

  const renderCurrentView = () => {
    if (!userClub) return null;

    const staticViews: Record<string, React.ReactNode> = {
        'HOME': (
            <div className="p-4 space-y-4 overflow-y-auto">
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

                    <div className="bg-slate-200 p-4 rounded-sm border border-slate-500 shadow-sm flex flex-col">
                        <h3 className="text-slate-950 font-black uppercase text-[11px] tracking-wider mb-2 border-b border-slate-400 pb-1 flex items-center gap-2">
                           <Trophy size={14} /> Competiciones
                        </h3>
                        <div className="flex-1 space-y-2 overflow-y-auto">
                           {world.competitions.filter(c => {
                              if (c.id === userClub.leagueId) return true;
                              if (c.type !== 'LEAGUE') {
                                 const compFixtures = fixtures.filter(f => f.competitionId === c.id);
                                 return compFixtures.some(f => f.homeTeamId === userClub.id || f.awayTeamId === userClub.id);
                              }
                              return false;
                           }).map(comp => {
                              let statusText = "";
                              if (comp.type === 'LEAGUE') {
                                 const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
                                 const rank = table.findIndex(e => e.clubId === userClub.id) + 1;
                                 statusText = rank > 0 ? `${rank}º Clasificado` : '-';
                              } else {
                                 statusText = "En curso"; 
                              }
                              return (
                                 <div key={comp.id} className="flex justify-between items-center p-2 bg-slate-300/50 rounded-sm border-l-4 border-slate-500">
                                    <span className="text-[10px] font-black text-slate-700 uppercase truncate max-w-[100px]">{comp.name}</span>
                                    <span className="text-[10px] font-bold text-slate-950 uppercase">{statusText}</span>
                                 </div>
                              );
                           })}
                        </div>
                    </div>
                </div>

                <div className="bg-slate-100 p-4 rounded-sm border border-slate-300 shadow-sm">
                   <h3 className="text-slate-950 font-black uppercase text-[11px] tracking-wider mb-4 border-b border-slate-300 pb-1 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Mail size={14} /> Últimas Noticias</div>
                      <button onClick={() => setView('INBOX')} className="text-[9px] text-blue-600 hover:underline flex items-center">Ver todo <ChevronRight size={10} /></button>
                   </h3>
                   <div className="space-y-2">
                      {world.inbox.slice(0, 3).map((msg, i) => (
                         <div key={msg.id} className="p-3 bg-slate-200 border-l-4 border-slate-400 hover:bg-slate-300 transition-colors cursor-pointer" onClick={() => setView('INBOX')}>
                            <div className="flex justify-between items-center mb-1">
                               <span className={`text-[9px] font-black px-1.5 py-0.5 rounded text-white ${msg.category === 'MARKET' ? 'bg-blue-600' : msg.category === 'SQUAD' ? 'bg-green-600' : 'bg-slate-600'}`}>{msg.category}</span>
                               <span className="text-[9px] text-slate-500 font-mono">{msg.date.toLocaleDateString()}</span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 uppercase truncate">{msg.subject}</h4>
                            <p className="text-[10px] text-slate-600 truncate italic">{msg.body}</p>
                         </div>
                      ))}
                      {world.inbox.length === 0 && <p className="text-center text-slate-400 italic text-xs py-4">No hay noticias recientes.</p>}
                   </div>
                </div>
            </div>
        ),
        'INBOX': <InboxView setView={setView} onUpdate={() => setForceUpdate(v => v + 1)} />,
        'TABLE': <div className="p-2 h-full flex flex-col"><LeagueTable entries={world.getLeagueTable(viewLeagueId || userClub.leagueId, fixtures, viewSquadType)} userClubId={userClub.id} allLeagues={world.getLeagues()} currentLeagueId={viewLeagueId || userClub.leagueId} onLeagueChange={setViewLeagueId} currentSquadType={viewSquadType} onSquadTypeChange={setViewSquadType} /></div>,
        'MARKET': <MarketView userClubId={userClub.id} onSelectPlayer={setSelectedPlayer} currentDate={currentDate} />,
        'SEARCH': <SearchView onSelectPlayer={setSelectedPlayer} />,
        'NEGOTIATIONS': <NegotiationsView userClubId={userClub.id} onUpdate={() => setForceUpdate(v => v + 1)} currentDate={currentDate} />,
        'ECONOMY': <EconomyView club={userClub} />,
        'STAFF': <StaffView staff={world.getStaffByClub(userClub.id)} />,
        'TRAINING': <TrainingView club={userClub} players={world.getPlayersByClub(userClub.id)} staff={world.getStaffByClub(userClub.id)} onUpdate={() => setForceUpdate(v => v + 1)} />,
        'CLUB_REPORT': <ClubReport club={userClub} />
    };

    if (staticViews[currentView]) return staticViews[currentView];

    let homeClub: Club | undefined;
    let awayClub: Club | undefined;
    if (nextFixture) {
       homeClub = nextFixture.homeTeamId === userClub.id ? userClub : world.getClub(nextFixture.homeTeamId);
       awayClub = nextFixture.awayTeamId === userClub.id ? userClub : world.getClub(nextFixture.awayTeamId);
    }

    if (currentView === 'CLUBS_LIST') {
        return <ClubsListView onSelectClub={(c) => { setViewExternalClub(c); setView('EXTERNAL_CLUB'); }} />;
    }

    if (currentView === 'EXTERNAL_CLUB' && viewExternalClub) {
        return (
            <div className="flex flex-col h-full bg-slate-300">
                <div className="p-2 bg-slate-200 border-b border-slate-400 flex justify-between items-center shadow-sm">
                    <h3 className="font-black uppercase text-slate-800 text-xs flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-full ${viewExternalClub.primaryColor} ${viewExternalClub.primaryColor === 'bg-white' ? 'border border-slate-400' : 'border border-transparent'} flex items-center justify-center text-[8px] text-white shadow-sm`}>
                           {viewExternalClub.shortName.substring(0, 2)}
                        </div> 
                        {viewExternalClub.name} - PLANTILLA
                    </h3>
                    <button onClick={() => setView('CLUBS_LIST')} className="text-[10px] font-bold uppercase bg-white border border-slate-400 px-3 py-1 rounded-sm hover:bg-slate-50 flex items-center gap-1 shadow-sm">
                        <ArrowLeft size={10} /> Volver
                    </button>
                </div>
                <div className="flex-1 overflow-hidden">
                    <SquadView 
                        players={world.getPlayersByClub(viewExternalClub.id).filter(p => p.squad === 'SENIOR')} 
                        onSelectPlayer={setSelectedPlayer} 
                        customTitle={`PLANTILLA - ${viewExternalClub.name}`}
                        currentDate={currentDate}
                    />
                </div>
            </div>
        );
    }

    if (currentView === 'PRE_MATCH') {
        if (nextFixture && homeClub && awayClub) {
            return <PreMatchView club={userClub} opponent={homeClub.id === userClub.id ? awayClub : homeClub} starters={world.getPlayersByClub(userClub.id).filter(p => p.isStarter && p.squad === 'SENIOR')} onStart={handleStartMatch} onGoToTactics={() => setView('SENIOR_TACTICS')} />;
        }
        return <div className="p-8 text-center text-slate-500 font-black uppercase">Error: Datos de partido no disponibles</div>;
    }

    if (currentView === 'MATCH') {
        if (nextFixture && homeClub && awayClub) {
            return <MatchView userClubId={userClub.id} currentDate={currentDate} homeTeam={homeClub} awayTeam={awayClub} homePlayers={getMatchSquad(nextFixture.homeTeamId)} awayPlayers={getMatchSquad(nextFixture.awayTeamId)} onFinish={(h,a,stats) => { nextFixture!.played = true; nextFixture!.homeScore = h; nextFixture!.awayScore = a; MatchSimulator.finalizeSeasonStats(world.getPlayersByClub(nextFixture!.homeTeamId).filter(p => p.squad === 'SENIOR'), world.getPlayersByClub(nextFixture!.awayTeamId).filter(p => p.squad === 'SENIOR'), stats, h, a, nextFixture!.competitionId); LifecycleManager.processPostMatchSuspensions(nextFixture!.homeTeamId, nextFixture!.awayTeamId); setView('HOME'); updateNextFixture(fixtures, currentDate, userClub.id); setForceUpdate(v=>v+1); }} />;
        }
        return <div className="p-8 text-center text-slate-500 font-black uppercase">Error: Datos de partido no disponibles</div>;
    }

    if (currentView.endsWith('_SQUAD')) {
        const type = currentView.split('_')[0] as SquadType;
        return <SquadView players={world.getPlayersByClub(userClub.id).filter(p => p.squad === type)} onSelectPlayer={setSelectedPlayer} onContextMenu={handlePlayerContextMenu} currentDate={currentDate} />;
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
                        const comp = world.competitions.find(c => c.id === f.competitionId);
                        return (
                            <div key={f.id} className="flex flex-col p-2 border-b border-slate-400 hover:bg-slate-300">
                                <div className="flex items-center text-[11px]">
                                    <div className="w-20 text-slate-700 font-mono font-bold">{f.date.toLocaleDateString()}</div>
                                    <div className="flex-1 text-right font-black text-slate-900 pr-2 uppercase">{home?.name}</div>
                                    <div className={`w-20 text-center font-black bg-slate-300 rounded px-1 border border-slate-500 ${f.played ? 'text-slate-950' : 'text-slate-500'}`}>
                                       {f.played ? (isPenalty ? `${f.homeScore}-${f.awayScore} (p)` : `${f.homeScore}-${f.awayScore}`) : 'v'}
                                    </div>
                                    <div className="flex-1 text-left font-black text-slate-900 pl-2 uppercase">{away?.name}</div>
                                </div>
                                <div className="ml-20 text-[9px] font-black uppercase text-slate-500 italic tracking-widest mt-1">
                                    {comp?.name || 'Amistoso'}
                                </div>
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

  if (gameState === 'LOADING') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center text-slate-950"><div className="animate-pulse flex flex-col items-center"><RefreshCw className="w-10 h-10 animate-spin mb-4 text-slate-900" /><h1 className="text-2xl font-black italic tracking-widest uppercase">FM Argentina</h1></div></div>;
  
  if (gameState === 'SETUP_USER') return (
    <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200 via-slate-400 to-slate-500 opacity-50 pointer-events-none"></div>
      
      {isLoadModalOpen && (
         <div className="fixed inset-0 z-[200] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-200 w-full max-lg rounded-sm border-2 border-slate-500 shadow-2xl p-6 flex flex-col max-h-[80vh]">
               <div className="flex justify-between items-center mb-6 border-b border-slate-400 pb-2">
                  <h2 className="text-xl font-black text-slate-900 uppercase italic">Cargar Partida</h2>
                  <button onClick={() => setIsLoadModalOpen(false)}><X size={20} className="text-slate-600 hover:text-red-600"/></button>
               </div>
               <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scroll">
                  {availableSaves.length === 0 ? (
                     <p className="text-center text-slate-500 italic py-10 font-bold uppercase text-xs">No hay partidas guardadas.</p>
                  ) : (
                     availableSaves.map(save => (
                        <div key={save.id} className="bg-white border border-slate-300 p-3 rounded-sm hover:border-blue-500 hover:shadow-md transition-all group flex justify-between items-center cursor-pointer" onClick={() => confirmLoadGame(save.id)}>
                           <div className="flex-1 min-w-0">
                              <h4 className="font-black text-slate-900 uppercase text-xs truncate group-hover:text-blue-700">{save.label}</h4>
                              <div className="flex gap-3 mt-1 text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                                 <span>{save.teamName}</span>
                                 <span>•</span>
                                 <span>{new Date(save.date).toLocaleDateString()}</span>
                              </div>
                           </div>
                           <button onClick={(e) => handleDeleteSave(save.id, e)} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Borrar Partida"><Trash2 size={16} /></button>
                        </div>
                     ))
                  )}
               </div>
            </div>
         </div>
      )}

      <div className="max-w-md w-full bg-slate-200 rounded-sm p-8 border border-slate-600 shadow-2xl z-10">
        <h1 className="text-3xl font-black text-slate-950 mb-6 italic uppercase border-b-4 border-slate-950 pb-2">Perfil del Manager</h1>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Nombre</label>
            <input type="text" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userName} onChange={(e) => setUserName(e.target.value)} />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase block mb-1 tracking-widest">Apellido</label>
            <input type="text" className="w-full bg-slate-100 border border-slate-500 rounded-sm px-4 py-3 text-slate-950 font-bold text-sm outline-none focus:border-slate-800" value={userSurname} onChange={(e) => setUserSurname(e.target.value)} />
          </div>
          <FMButton onClick={() => setGameState('SETUP_LEAGUE')} className="w-full py-4 mt-4">
            NUEVA PARTIDA <ChevronRight size={14} />
          </FMButton>
          {hasSave && (
             <FMButton onClick={handleOpenLoadModal} variant="secondary" className="w-full py-3 mt-2 text-xs border-2 border-slate-400">
                <HardDrive size={14} /> CARGAR PARTIDA
             </FMButton>
          )}
        </div>
      </div>
    </div>
  );

  if (gameState === 'SETUP_LEAGUE') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4"><div className="max-w-4xl w-full bg-slate-200 rounded-sm p-10 border border-slate-600 text-center shadow-2xl"><h1 className="text-5xl font-black text-slate-950 mb-10 tracking-tighter italic uppercase">FM</h1><button onClick={() => { setSelectedLeague(world.competitions[0]); setGameState('SETUP_TEAM'); }} className="p-8 bg-slate-300 border border-slate-500 hover:bg-slate-400 rounded-sm text-left transition-all group shadow-md flex flex-col items-center text-center"><h3 className="text-2xl font-black text-slate-950 mb-1 italic uppercase">Liga Argentina</h3><p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.3em]">Primera y Segunda División</p></button></div></div>;
  
  if (gameState === 'SETUP_TEAM') return <div className="h-screen w-screen bg-slate-400 flex items-center justify-center p-4"><div className="max-w-6xl w-full bg-slate-200 rounded-sm p-10 border border-slate-600 shadow-2xl max-h-[90vh] overflow-y-auto"><h1 className="text-3xl font-black text-slate-950 mb-8 italic uppercase border-b-4 border-slate-950 pb-2">Elige tu Equipo</h1><div className="space-y-8"><div><h3 className="text-slate-950 font-black mb-4 uppercase text-[12px] tracking-widest bg-slate-300 p-2 rounded-sm border-l-8 border-slate-950">Liga Profesional</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{world.getClubsByLeague('L_ARG_1').map(c => <button key={c.id} onClick={() => { setUserClub(c); world.createHumanManager(c.id, `${userName} ${userSurname}`); const allFix = initSeasonFixtures(currentDate, c.id); updateNextFixture(allFix, currentDate, c.id); setGameState('PLAYING'); }} className="p-4 bg-slate-100 hover:bg-slate-300 border border-slate-500 rounded-sm text-left transition-all shadow-sm group border-l-4 hover:border-l-blue-600"><div className={`w-3 h-3 rounded-full mb-3 ${c.primaryColor} border border-slate-500`}></div><p className="font-black text-slate-950 truncate text-[11px] uppercase group-hover:text-blue-700">{c.name}</p></button>)}</div></div><div><h3 className="text-slate-950 font-black mb-4 uppercase text-[12px] tracking-widest bg-slate-300 p-2 rounded-sm border-l-8 border-slate-950">Primera Nacional</h3><div className="grid grid-cols-2 md:grid-cols-5 gap-4">{world.getClubsByLeague('L_ARG_2').map(c => <button key={c.id} onClick={() => { setUserClub(c); world.createHumanManager(c.id, `${userName} ${userSurname}`); const allFix = initSeasonFixtures(currentDate, c.id); updateNextFixture(allFix, currentDate, c.id); setGameState('PLAYING'); }} className="p-4 bg-slate-100 hover:bg-slate-300 border border-slate-500 rounded-sm text-left transition-all shadow-sm group border-l-4 hover:border-l-blue-600"><div className={`w-3 h-3 rounded-full mb-3 ${c.primaryColor} border border-slate-500`}></div><p className="font-black text-slate-950 truncate text-[11px] uppercase group-hover:text-blue-700">{c.name}</p></button>)}</div></div></div></div></div>;

  const isMatchView = currentView === 'MATCH';
  const isPreMatchView = currentView === 'PRE_MATCH';

  // Dynamic header date colors
  const dateBg = userClub ? userClub.secondaryColor.replace('text-', 'bg-') : 'bg-white';
  const dateText = userClub ? userClub.primaryColor.replace('bg-', 'text-') : 'text-slate-700';

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-400 text-slate-950 overflow-hidden font-sans relative text-sm">
      <div className={`h-1 w-full ${userClub ? userClub.secondaryColor.replace('text-','bg-') : 'bg-slate-800'}`}></div>
      
      {isSaveModalOpen && (
         <div className="fixed inset-0 z-[500] bg-slate-900/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-slate-200 w-full max-sm rounded-sm border-2 border-slate-500 shadow-2xl p-6">
               <h3 className="text-lg font-black text-slate-900 uppercase italic mb-4 border-b border-slate-400 pb-2">Guardar Partida</h3>
               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-black text-slate-600 uppercase block mb-1">Nombre del Archivo</label>
                     <input 
                        type="text" 
                        autoFocus
                        className="w-full bg-white border border-slate-400 rounded-sm px-3 py-2 text-slate-900 font-bold text-sm focus:border-slate-800 outline-none"
                        value={saveNameInput}
                        onChange={(e) => setSaveNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && confirmSaveGame()}
                     />
                  </div>
                  <div className="flex gap-2">
                     <FMButton variant="secondary" onClick={() => setIsSaveModalOpen(false)} className="flex-1">Cancelar</FMButton>
                     <FMButton variant="primary" onClick={confirmSaveGame} className="flex-1">Guardar</FMButton>
                  </div>
               </div>
            </div>
         </div>
      )}

      {!isMatchView && (
        <header className={`h-12 border-b flex items-center justify-between px-4 shadow-sm z-[110] shrink-0 transition-colors duration-300 ${
            userClub 
              ? `${userClub.primaryColor} ${userClub.secondaryColor} border-black/20` 
              : 'bg-gradient-to-b from-slate-200 to-slate-300 border-slate-600'
        }`}>
          <div className="flex items-center gap-4">
             <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden hover:opacity-80 transition-opacity ${userClub ? 'text-current' : 'text-slate-900'}`}>
                <Menu size={20} />
             </button>
             <div className="flex items-center gap-3">
                <div className={`w-1.5 h-8 ${userClub ? userClub.secondaryColor.replace('text-', 'bg-') : 'bg-slate-800'} border-x border-black/10 opacity-80`}></div>
                <h1 className={`text-sm font-black uppercase tracking-tight italic drop-shadow-sm truncate max-w-[150px] sm:max-w-none ${userClub ? '' : 'text-slate-950'}`}>
                  {userClub?.name || "FM"}
                </h1>
             </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
             <div className={`font-mono text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-2 py-1 rounded-sm shadow-inner border border-black/20 ${dateBg} ${dateText}`}>
               {currentDate.toLocaleDateString()}
             </div>
             <div id="header-actions" className="flex items-center gap-2">
               <FMButton 
                 variant={isPreMatchView ? "primary" : "primary"} 
                 onClick={advanceTime}
                 className={userClub ? (isPreMatchView ? "bg-slate-950 text-white animate-pulse border-white/40" : "bg-slate-900 text-white border-white/30 shadow-lg") : ""}
               >
                   {isPreMatchView ? (
                     <> <Zap size={10} fill="currentColor" /> Jugar Partido </>
                   ) : (
                     <> <Play size={10} fill="currentColor" /> Continuar </>
                   )}
               </FMButton>
             </div>
          </div>
        </header>
      )}

      <div className="flex flex-1 overflow-hidden relative">
        {userClub && !isMatchView && (
            <Sidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} currentView={currentView} setView={(v) => { setView(v); setIsSidebarOpen(false); }} club={userClub} onVacation={() => setIsVacationModalOpen(true)} onSave={handleOpenSaveModal} />
        )}
        <main className="flex-1 flex flex-col min-w-0 bg-[#94a3b8] relative overflow-hidden">
          {renderCurrentView()}
        </main>
      </div>

      {isVacationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 z-[500] flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-slate-200 w-full max-sm rounded-sm border border-slate-600 p-8 text-center shadow-2xl">
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
                     <FMButton variant="vacation" onClick={() => startVacation()} className="w-full py-4 text-xs">Iniciar Simulación</FMButton>
                     <FMButton variant="primary" onClick={() => startVacation(seasonEndDate)} className="w-full py-4 text-xs">Simular Temporada</FMButton>
                     <FMButton variant="secondary" onClick={() => setIsVacationModalOpen(false)} className="w-full">Cancelar</FMButton>
                  </div>
               </>
            )}
          </div>
        </div>
      )}

      {selectedPlayer && userClub && <PlayerModal player={selectedPlayer} userClubId={userClub.id} onClose={() => setSelectedPlayer(null)} currentDate={currentDate} />}
      {contextMenu && <PlayerContextMenu player={contextMenu.player} x={contextMenu.x} y={contextMenu.y} onClose={() => setContextMenu(null)} onUpdate={() => setForceUpdate(v => v + 1)} currentDate={currentDate} />}
      {seasonSummary && <SeasonSummaryModal summary={seasonSummary} userWonLeague={userWonLeague} onClose={() => { setSeasonSummary(null); setUserWonLeague(false); }} />}
    </div>
  );
};
export default App;
