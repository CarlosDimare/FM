
import React, { useState, useMemo } from 'react';
import { Competition, Fixture, Club, Player, SquadType } from '../types';
import { world } from '../services/worldManager';
import { LeagueTable } from './LeagueTable';
import { Calendar, ListOrdered, Goal, Trophy, ChevronRight, Zap, Star } from 'lucide-react';
import { FMBox, FMTable, FMTableCell } from './FMUI';

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
     // Get all players involved in clubs of this competition
     const clubIds = new Set<string>();
     const clubs = world.getClubsByCompetition(competition.id, fixtures);
     if (clubs.length === 0) {
        // Fallback for leagues not yet in fixture list but exist
        world.getClubsByLeague(competition.id).forEach(c => clubIds.add(c.id));
     } else {
        clubs.forEach(c => clubIds.add(c.id));
     }
     
     // IMPORTANT: Filter by who actually played in this specific competition
     return world.players.filter(p => clubIds.has(p.clubId) && (p.statsByCompetition[competition.id]?.appearances || 0) > 0);
  }, [competition.id, fixtures, world.players.length]);

  const topScorers = useMemo(() => [...statsPlayers].sort((a,b) => getCompStats(b).goals - getCompStats(a).goals).slice(0, 15), [statsPlayers]);
  const topAssisters = useMemo(() => [...statsPlayers].sort((a,b) => getCompStats(b).assists - getCompStats(a).assists).slice(0, 15), [statsPlayers]);
  const topRated = useMemo(() => [...statsPlayers].filter(p => getCompStats(p).appearances >= 2).sort((a,b) => (getCompStats(b).totalRating/getCompStats(b).appearances) - (getCompStats(a).totalRating/getCompStats(a).appearances)).slice(0, 15), [statsPlayers]);

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-4 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Trophy size={28} className="text-yellow-500" />
             <h2 className="text-2xl md:text-3xl font-black text-white uppercase italic tracking-tighter">{competition.name}</h2>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">{competition.country} • Nivel {competition.tier}</p>
        </div>

        <div className="flex bg-slate-800 p-1 rounded-sm border border-slate-700 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('TABLE')}
            className={`flex-1 md:px-6 py-2 rounded-sm transition-all flex items-center justify-center ${activeTab === 'TABLE' ? 'bg-slate-700 text-white shadow-lg border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
            title="Clasificación"
          >
            <ListOrdered size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex-1 md:px-6 py-2 rounded-sm transition-all flex items-center justify-center ${activeTab === 'CALENDAR' ? 'bg-slate-700 text-white shadow-lg border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
            title="Calendario"
          >
            <Calendar size={18} />
          </button>
          <button 
            onClick={() => setActiveTab('STATS')}
            className={`flex-1 md:px-6 py-2 rounded-sm transition-all flex items-center justify-center ${activeTab === 'STATS' ? 'bg-slate-700 text-white shadow-lg border border-slate-600' : 'text-slate-500 hover:text-slate-300'}`}
            title="Estadísticas"
          >
            <Goal size={18} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'TABLE' && (
           <div className="h-full flex flex-col gap-2">
              {isContinental && (
                 <div className="flex bg-slate-900 border border-slate-700 rounded p-1 overflow-x-auto scrollbar-hide shrink-0">
                    {[0,1,2,3,4,5,6,7].map(g => (
                       <button 
                          key={g}
                          onClick={() => setSelectedGroup(g)}
                          className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase ${selectedGroup === g ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                       >
                          Grupo {String.fromCharCode(65+g)}
                       </button>
                    ))}
                 </div>
              )}

              {isCup ? (
                 <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 h-full flex flex-col items-center justify-center text-center">
                    <Trophy size={64} className="text-slate-700 mb-4" />
                    <h3 className="text-xl font-black text-slate-500 uppercase tracking-tighter italic">Formato Eliminatorio</h3>
                    <p className="text-slate-400 text-sm mt-2 max-w-sm">Esta es una competición de K.O. directo. Consulta la pestaña de "Partidos" para ver los cruces actuales.</p>
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
           <div className="bg-slate-800 rounded-xl border border-slate-700 h-full overflow-y-auto shadow-2xl">
              {competitionFixtures.length === 0 ? (
                 <p className="p-20 text-slate-500 text-center italic">No hay partidos programados para este torneo.</p>
              ) : (
                 <div className="divide-y divide-slate-700/50">
                    {competitionFixtures.map(f => {
                       const home = world.getClub(f.homeTeamId);
                       const away = world.getClub(f.awayTeamId);
                       const isPenalty = f.penaltyHome !== undefined;
                       return (
                          <div key={f.id} className="p-4 hover:bg-slate-700/20 transition-colors flex flex-col md:flex-row items-center gap-4">
                             <div className="w-full md:w-32 text-slate-500 font-mono text-[10px] text-center md:text-left">
                                {f.date.toLocaleDateString()}
                                {f.stage !== 'REGULAR' && <span className="block text-blue-500 font-black">{f.stage}</span>}
                                {f.groupId !== undefined && <span className="block text-slate-600 font-bold">GR. {String.fromCharCode(65 + f.groupId)}</span>}
                             </div>
                             <div className="flex-1 flex items-center justify-between gap-4 w-full">
                                <span className={`flex-1 text-right font-bold text-xs sm:text-sm ${f.homeTeamId === userClubId ? 'text-blue-400' : 'text-slate-200'}`}>{home?.name}</span>
                                <div className="w-20 h-8 bg-slate-900 border border-slate-700 rounded flex items-center justify-center font-black text-xs">
                                   {f.played ? (
                                      isPenalty ? `${f.homeScore}-${f.awayScore} (P)` : `${f.homeScore} - ${f.awayScore}`
                                   ) : 'VS'}
                                </div>
                                <span className={`flex-1 text-left font-bold text-xs sm:text-sm ${f.awayTeamId === userClubId ? 'text-blue-400' : 'text-slate-200'}`}>{away?.name}</span>
                             </div>
                          </div>
                       );
                    })}
                 </div>
              )}
           </div>
        )}

        {activeTab === 'STATS' && (
           <div className="h-full overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              <FMBox title="Goleadores" noPadding className="h-full">
                 <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['30px', 'auto', '40px']}>
                    {topScorers.map((p, i) => (
                       <tr key={p.id} className="hover:bg-slate-700/50">
                          <FMTableCell className="text-center">{i+1}</FMTableCell>
                          <FMTableCell>
                             <div className="flex flex-col">
                                <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                <span className="text-[9px] text-slate-500 uppercase">{world.getClub(p.clubId)?.shortName}</span>
                             </div>
                          </FMTableCell>
                          <FMTableCell className="text-center font-black text-green-400" isNumber>{getCompStats(p).goals}</FMTableCell>
                       </tr>
                    ))}
                    {topScorers.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-500">Sin datos</td></tr>}
                 </FMTable>
              </FMBox>

              <FMBox title="Asistencias" noPadding className="h-full">
                 <FMTable headers={['#', 'Nombre', 'Asist']} colWidths={['30px', 'auto', '40px']}>
                    {topAssisters.map((p, i) => (
                       <tr key={p.id} className="hover:bg-slate-700/50">
                          <FMTableCell className="text-center">{i+1}</FMTableCell>
                          <FMTableCell>
                             <div className="flex flex-col">
                                <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                <span className="text-[9px] text-slate-500 uppercase">{world.getClub(p.clubId)?.shortName}</span>
                             </div>
                          </FMTableCell>
                          <FMTableCell className="text-center font-black text-blue-400" isNumber>{getCompStats(p).assists}</FMTableCell>
                       </tr>
                    ))}
                    {topAssisters.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-500">Sin datos</td></tr>}
                 </FMTable>
              </FMBox>

              <FMBox title="Calificación Media" noPadding className="h-full">
                 <FMTable headers={['#', 'Nombre', 'Media']} colWidths={['30px', 'auto', '40px']}>
                    {topRated.map((p, i) => {
                       const stats = getCompStats(p);
                       const avg = (stats.totalRating / stats.appearances).toFixed(2);
                       return (
                          <tr key={p.id} className="hover:bg-slate-700/50">
                             <FMTableCell className="text-center">{i+1}</FMTableCell>
                             <FMTableCell>
                                <div className="flex flex-col">
                                   <span className="font-bold truncate max-w-[120px]">{p.name}</span>
                                   <span className="text-[9px] text-slate-500 uppercase">{world.getClub(p.clubId)?.shortName}</span>
                                </div>
                             </FMTableCell>
                             <FMTableCell className="text-center font-black text-yellow-400" isNumber>{avg}</FMTableCell>
                          </tr>
                       );
                    })}
                    {topRated.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-slate-500">Sin datos</td></tr>}
                 </FMTable>
              </FMBox>
           </div>
        )}
      </div>
    </div>
  );
};
