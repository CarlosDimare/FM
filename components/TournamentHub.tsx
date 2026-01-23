
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
  
  const competitionFixtures = useMemo(() => 
    fixtures.filter(f => f.competitionId === competition.id)
      .sort((a,b) => a.date.getTime() - b.date.getTime()), 
  [fixtures, competition.id]);

  const isCup = competition.type === 'CUP';

  return (
    <div className="p-4 md:p-6 h-full flex flex-col gap-4 overflow-hidden" style={{ backgroundColor: '#dcdcdc' }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4" style={{ borderBottom: '1px solid #999', paddingBottom: '1rem' }}>
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Trophy size={28} style={{ color: '#999' }} />
             <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter" style={{ color: '#333' }}>{competition.name}</h2>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: '#999' }}>{competition.country} • Nivel {competition.tier}</p>
        </div>

        <div className="flex p-1 rounded-xl w-full md:w-auto" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
          <button 
            onClick={() => setActiveTab('TABLE')}
            className="flex-1 md:px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: activeTab === 'TABLE' ? '#666' : 'transparent',
              color: activeTab === 'TABLE' ? '#fff' : '#666' 
            }}
          >
            <ListOrdered size={14} /> {isCup ? 'Cuadro' : 'Tabla'}
          </button>
          <button 
            onClick={() => setActiveTab('CALENDAR')}
            className="flex-1 md:px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: activeTab === 'CALENDAR' ? '#666' : 'transparent',
              color: activeTab === 'CALENDAR' ? '#fff' : '#666' 
            }}
          >
            <Calendar size={14} /> Partidos
          </button>
          <button 
            onClick={() => setActiveTab('STATS')}
            className="flex-1 md:px-6 py-2 text-[10px] font-black rounded-lg transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            style={{ 
              backgroundColor: activeTab === 'STATS' ? '#666' : 'transparent',
              color: activeTab === 'STATS' ? '#fff' : '#666' 
            }}
          >
            <Goal size={14} /> Estadísticas
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'TABLE' && (
           <div className="h-full">
              {isCup ? (
                 <div className="rounded-xl p-8 h-full flex flex-col items-center justify-center text-center" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
                    <Trophy size={64} className="mb-4" style={{ color: '#ccc' }} />
                    <h3 className="text-xl font-black uppercase tracking-tighter italic" style={{ color: '#999' }}>Formato Eliminatorio</h3>
                    <p className="text-sm mt-2 max-w-sm" style={{ color: '#999' }}>Esta es una competición de K.O. directo. Consulta la pestaña de "Partidos" para ver los cruces actuales.</p>
                 </div>
              ) : (
                <LeagueTable 
                   entries={world.getLeagueTable(competition.id, fixtures, 'SENIOR')} 
                   userClubId={userClubId}
                   currentLeagueId={competition.id}
                />
              )}
           </div>
        )}

        {activeTab === 'CALENDAR' && (
           <div className="rounded-xl h-full overflow-y-auto shadow-2xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
              {competitionFixtures.length === 0 ? (
                 <p className="p-20 text-center italic" style={{ color: '#999' }}>No hay partidos programados para este torneo.</p>
              ) : (
                 <div className="divide-y" style={{ borderColor: '#ccc' }}>
                    {competitionFixtures.map(f => {
                       const home = world.getClub(f.homeTeamId);
                       const away = world.getClub(f.awayTeamId);
                       return (
                          <div key={f.id} className="p-4 transition-colors flex flex-col md:flex-row items-center gap-4" style={{ backgroundColor: 'transparent' }}>
                             <div className="w-full md:w-32 font-mono text-[10px] text-center md:text-left" style={{ color: '#999' }}>
                                {f.date.toLocaleDateString()}
                                {f.stage !== 'REGULAR' && <span className="block font-black" style={{ color: '#666' }}>{f.stage}</span>}
                             </div>
                             <div className="flex-1 flex items-center justify-between gap-4 w-full">
                                <span className="flex-1 text-right font-bold text-xs sm:text-sm" style={{ color: f.homeTeamId === userClubId ? '#666' : '#999' }}>{home?.name}</span>
                                <div className="w-16 h-8 rounded flex items-center justify-center font-black text-xs" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999', color: '#333' }}>
                                   {f.played ? `${f.homeScore} - ${f.awayScore}` : 'VS'}
                                </div>
                                <span className="flex-1 text-left font-bold text-xs sm:text-sm" style={{ color: f.awayTeamId === userClubId ? '#666' : '#999' }}>{away?.name}</span>
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
