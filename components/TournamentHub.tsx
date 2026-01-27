
import React, { useState, useMemo } from 'react';
import { Competition, Fixture, Club, Player, SquadType } from '../types';
import { world } from '../services/worldManager';
import { LeagueTable } from './LeagueTable';
import { Calendar, ListOrdered, Goal, Trophy, ChevronRight, Zap, Star, LayoutGrid } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';

interface TournamentHubProps {
  competition: Competition;
  fixtures: Fixture[];
  userClubId: string;
}

export const TournamentHub: React.FC<TournamentHubProps> = ({ competition, fixtures, userClubId }) => {
  const [activeTab, setActiveTab] = useState<'TABLE' | 'CALENDAR' | 'STATS'>('TABLE');
  const [selectedGroup, setSelectedGroup] = useState(0);
  
  const competitionFixtures = useMemo(() => 
    fixtures.filter(f => f.competitionId === competition.id)
      .sort((a,b) => a.date.getTime() - b.date.getTime()), 
  [fixtures, competition.id]);

  const isCup = competition.type === 'CUP';
  const isContinental = competition.type.startsWith('CONTINENTAL');

  // Stats Logic
  const getCompStats = (p: Player) => p.statsByCompetition[competition.id] || { goals: 0, assists: 0, totalRating: 0, appearances: 0 };
  
  const statsPlayers = useMemo(() => {
     const clubIds = new Set<string>();
     const clubs = world.getClubsByCompetition(competition.id, fixtures);
     if (clubs.length === 0) {
        world.getClubsByLeague(competition.id).forEach(c => clubIds.add(c.id));
     } else {
        clubs.forEach(c => clubIds.add(c.id));
     }
     return world.players.filter(p => clubIds.has(p.clubId) && (p.statsByCompetition[competition.id]?.appearances || 0) > 0);
  }, [competition.id, fixtures, world.players.length]);

  const topScorers = useMemo(() => [...statsPlayers].sort((a,b) => getCompStats(b).goals - getCompStats(a).goals).slice(0, 15), [statsPlayers]);
  const topAssisters = useMemo(() => [...statsPlayers].sort((a,b) => getCompStats(b).assists - getCompStats(a).assists).slice(0, 15), [statsPlayers]);
  const topRated = useMemo(() => [...statsPlayers].filter(p => getCompStats(p).appearances >= 2).sort((a,b) => (getCompStats(b).totalRating/getCompStats(b).appearances) - (getCompStats(a).totalRating/getCompStats(a).appearances)).slice(0, 15), [statsPlayers]);

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-3 bg-[#d4dcd4] overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0 bg-[#e8ece8] border border-[#a0b0a0] p-3 rounded-sm shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border border-[#a0b0a0] rounded-sm flex items-center justify-center shadow-inner">
             <Trophy size={20} className="text-[#1a2a1a]" />
          </div>
          <div>
             <h2 className="text-xl md:text-2xl font-black text-[#1a1a1a] uppercase italic tracking-tighter leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>{competition.name}</h2>
             <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mt-1" style={{ fontFamily: 'Verdana, sans-serif' }}>{competition.country} • Nivel {competition.tier}</p>
          </div>
        </div>

        <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] w-full md:w-auto shadow-sm">
          {[
            { id: 'TABLE', icon: ListOrdered, label: 'Tabla' },
            { id: 'CALENDAR', icon: Calendar, label: 'Partidos' },
            { id: 'STATS', icon: Star, label: 'Estad.' }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 md:px-6 py-1.5 rounded-[1px] transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight ${activeTab === tab.id ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-[#1a2a1a] hover:bg-[#ccd9cc]'}`}
              style={{ fontFamily: 'Verdana, sans-serif' }}
            >
              <tab.icon size={14} /> <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'TABLE' && (
           <div className="h-full flex flex-col gap-2">
              {isContinental && (
                 <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] overflow-x-auto scrollbar-hide shrink-0 shadow-sm">
                    {[0,1,2,3,4,5,6,7].map(g => (
                       <button 
                          key={g}
                          onClick={() => setSelectedGroup(g)}
                          className={`px-3 py-1.5 rounded-[1px] text-[9px] font-bold uppercase whitespace-nowrap transition-colors ${selectedGroup === g ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
                          style={{ fontFamily: 'Verdana, sans-serif' }}
                       >
                          Grupo {String.fromCharCode(65+g)}
                       </button>
                    ))}
                 </div>
              )}

              {isCup ? (
                 <div className="bg-[#e8ece8] rounded-sm border border-[#a0b0a0] p-12 h-full flex flex-col items-center justify-center text-center shadow-md">
                    <Trophy size={64} className="text-[#a0b0a0] mb-4 opacity-50" />
                    <h3 className="text-xl font-black text-slate-700 uppercase tracking-tighter italic" style={{ fontFamily: 'Verdana, sans-serif' }}>Formato Eliminatorio</h3>
                    <p className="text-slate-500 text-[10px] uppercase font-bold mt-2 max-w-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>Esta es una competición de K.O. directo. Consulta la pestaña de "Partidos" para ver los cruces actuales.</p>
                 </div>
              ) : (
                <LeagueTable 
                   entries={world.getLeagueTable(competition.id, fixtures, 'SENIOR', isContinental ? selectedGroup : undefined)} 
                   userClubId={userClubId}
                   currentLeagueId={competition.id}
                />
              )}
           </div>
        )}

        {activeTab === 'CALENDAR' && (
           <FMBox title="Resultados y Calendario" className="h-full" noPadding>
              <div className="h-full overflow-y-auto custom-scroll bg-white">
                {competitionFixtures.length === 0 ? (
                   <div className="p-20 text-slate-400 text-center italic text-[10px] uppercase font-bold tracking-widest">No hay partidos programados para este torneo.</div>
                ) : (
                   <table className="w-full border-collapse">
                      <tbody className="text-[11px] text-[#1a1a1a]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                        {competitionFixtures.map((f, idx) => {
                           const home = world.getClub(f.homeTeamId);
                           const away = world.getClub(f.awayTeamId);
                           const isPenalty = f.penaltyHome !== undefined;
                           const isUserMatch = f.homeTeamId === userClubId || f.awayTeamId === userClubId;
                           
                           return (
                              <tr key={f.id} className={`border-b border-[#e0e0e0] ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                                 <FMTableCell className="w-20 md:w-32 text-slate-500 font-mono text-[10px]">
                                    <div className="flex flex-col">
                                       <span>{f.date.toLocaleDateString()}</span>
                                       {f.stage !== 'REGULAR' && <span className="text-blue-700 font-black text-[8px] uppercase tracking-tighter">{f.stage}</span>}
                                       {f.groupId !== undefined && <span className="text-slate-600 font-bold text-[8px] uppercase">Gr. {String.fromCharCode(65 + f.groupId)}</span>}
                                    </div>
                                 </FMTableCell>
                                 
                                 <FMTableCell className="text-right">
                                    <span className={`font-bold truncate max-w-[80px] md:max-w-none inline-block ${f.homeTeamId === userClubId ? 'text-blue-800' : ''}`}>{home?.name}</span>
                                 </FMTableCell>
                                 
                                 <FMTableCell className="w-16 md:w-20 text-center">
                                    <div className="bg-[#bcc8bc] border border-[#a0b0a0] rounded-sm py-1 font-black text-[10px] shadow-inner text-[#1a1a1a]">
                                       {f.played ? (
                                          isPenalty ? `${f.homeScore}-${f.awayScore}*` : `${f.homeScore} - ${f.awayScore}`
                                       ) : 'VS'}
                                    </div>
                                 </FMTableCell>
                                 
                                 <FMTableCell className="text-left">
                                    <span className={`font-bold truncate max-w-[80px] md:max-w-none inline-block ${f.awayTeamId === userClubId ? 'text-blue-800' : ''}`}>{away?.name}</span>
                                 </FMTableCell>
                              </tr>
                           );
                        })}
                      </tbody>
                   </table>
                )}
              </div>
           </FMBox>
        )}

        {activeTab === 'STATS' && (
           <div className="h-full overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-3 custom-scroll">
              <FMBox title="Goleadores" noPadding>
                 <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['30px', 'auto', '40px']}>
                    {topScorers.map((p, i) => (
                       <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                          <FMTableCell className="text-center font-bold text-slate-400">{i+1}</FMTableCell>
                          <FMTableCell>
                             <div className="flex flex-col">
                                <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                             </div>
                          </FMTableCell>
                          <FMTableCell className="text-center font-black text-green-700" isNumber>{getCompStats(p).goals}</FMTableCell>
                       </tr>
                    ))}
                    {topScorers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
                 </FMTable>
              </FMBox>

              <FMBox title="Asistencias" noPadding>
                 <FMTable headers={['#', 'Nombre', 'Asist']} colWidths={['30px', 'auto', '40px']}>
                    {topAssisters.map((p, i) => (
                       <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                          <FMTableCell className="text-center font-bold text-slate-400">{i+1}</FMTableCell>
                          <FMTableCell>
                             <div className="flex flex-col">
                                <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                             </div>
                          </FMTableCell>
                          <FMTableCell className="text-center font-black text-blue-700" isNumber>{getCompStats(p).assists}</FMTableCell>
                       </tr>
                    ))}
                    {topAssisters.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
                 </FMTable>
              </FMBox>

              <FMBox title="Calificación Media" noPadding>
                 <FMTable headers={['#', 'Nombre', 'Media']} colWidths={['30px', 'auto', '40px']}>
                    {topRated.map((p, i) => {
                       const stats = getCompStats(p);
                       const avg = (stats.totalRating / stats.appearances).toFixed(2);
                       return (
                          <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc] transition-colors`}>
                             <FMTableCell className="text-center font-bold text-slate-400">{i+1}</FMTableCell>
                             <FMTableCell>
                                <div className="flex flex-col">
                                   <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                   <span className="text-[9px] text-slate-500 font-bold uppercase">{world.getClub(p.clubId)?.shortName}</span>
                                </div>
                             </FMTableCell>
                             <FMTableCell className="text-center font-black text-amber-700" isNumber>{avg}</FMTableCell>
                          </tr>
                       );
                    })}
                    {topRated.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px] uppercase font-bold">Sin datos</td></tr>}
                 </FMTable>
              </FMBox>
           </div>
        )}
      </div>
    </div>
  );
};
