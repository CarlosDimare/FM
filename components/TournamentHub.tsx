
import React, { useState, useMemo } from 'react';
import { Competition, Fixture, Club, Player, SquadType } from '../types';
import { world } from '../services/worldManager';
import { LeagueTable } from './LeagueTable';
import { Calendar, ListOrdered, Goal, Trophy, ChevronRight } from 'lucide-react';

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

        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 w-full md:w-auto">
          <button 
            onClick={() => setActiveTab('TABLE')}
            className={`flex-1 md:px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'TABLE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <ListOrdered size={14} /> {isCup ? 'Cuadro' : 'Tabla'}
          </button>
          <button 
            onClick={() => setActiveTab('CALENDAR')}
            className={`flex-1 md:px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'CALENDAR' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Calendar size={14} /> Partidos
          </button>
          <button 
            onClick={() => setActiveTab('STATS')}
            className={`flex-1 md:px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'STATS' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <Goal size={14} /> Estadísticas
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
           <div className="h-full">
             <LeagueTable 
                entries={[]} 
                userClubId={userClubId}
                currentLeagueId={competition.id}
                currentSquadType='SENIOR'
             />
           </div>
        )}
      </div>
    </div>
  );
};
