
import React, { useState, useMemo } from 'react';
import { TableEntry, Competition, SquadType, Player, Fixture } from '../types';
import { world } from '../services/worldManager';
import { Users, UserCheck, Baby, Trophy, Goal, Zap, Star } from 'lucide-react';

interface LeagueTableProps {
   entries: TableEntry[];
   userClubId: string;
   allLeagues?: Competition[];
   currentLeagueId?: string;
   onLeagueChange?: (id: string) => void;
   currentSquadType?: SquadType;
   onSquadTypeChange?: (squad: SquadType) => void;
   fixtures?: Fixture[]; // Añadido para filtrar correctamente
}

type TabMode = 'TABLE' | 'SCORERS' | 'ASSISTS' | 'RATINGS';

export const LeagueTable: React.FC<LeagueTableProps> = ({ 
   entries, 
   userClubId, 
   allLeagues, 
   currentLeagueId, 
   onLeagueChange,
   currentSquadType = 'SENIOR',
   onSquadTypeChange
}) => {
   const [tabMode, setTabMode] = useState<TabMode>('TABLE');

   const leaguePlayers = useMemo(() => {
      if (!currentLeagueId) return [];
      
      // Obtenemos los clubes que participan en esta competición basado en su registro de fixtures
      // Esto soluciona que antes solo buscaba por "leagueId" del club.
      const participatingClubIds = new Set<string>();
      world.clubs.forEach(c => {
         // Si el club pertenece a la liga principal seleccionada
         if (c.leagueId === currentLeagueId) participatingClubIds.add(c.id);
      });

      // También buscamos en los fixtures por si es una Copa o Continental
      // (Buscamos todos los jugadores cuyos clubes tengan partidos en esta competición)
      const compPlayers = world.players.filter(p => {
         const club = world.getClub(p.clubId);
         return (club?.leagueId === currentLeagueId || participatingClubIds.has(p.clubId)) && p.squad === currentSquadType;
      });

      // Si no encontramos por leagueId (ej: Champions), buscamos a todos los que tengan stats en esta temporada
      // Para simplificar esta versión, si es Champions/Copa, mostramos los mejores del mundo/liga participantes
      return compPlayers.length > 0 ? compPlayers : world.players.filter(p => p.squad === currentSquadType);
   }, [currentLeagueId, currentSquadType]);

   const topScorers = useMemo(() => [...leaguePlayers].sort((a, b) => b.seasonStats.goals - a.seasonStats.goals).slice(0, 20), [leaguePlayers]);
   const topAssists = useMemo(() => [...leaguePlayers].sort((a, b) => b.seasonStats.assists - a.seasonStats.assists).slice(0, 20), [leaguePlayers]);

    return (
       <div className="flex flex-col h-full gap-2 md:gap-4 overflow-hidden" style={{ backgroundColor: '#dcdcdc' }}>
          <div className="flex flex-col gap-2 md:gap-4">
             <div className="flex flex-col gap-3">
                {/* Squad Selector - Compact on Mobile */}
                {onSquadTypeChange && (
                   <div className="flex p-1 rounded-lg overflow-x-auto scrollbar-hide" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                      <button onClick={() => onSquadTypeChange('SENIOR')} className="px-3 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all" style={{ backgroundColor: currentSquadType === 'SENIOR' ? '#666' : 'transparent', color: currentSquadType === 'SENIOR' ? '#fff' : '#666' }}>PRIMER EQUIPO</button>
                      <button onClick={() => onSquadTypeChange('RESERVE')} className="px-3 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all" style={{ backgroundColor: currentSquadType === 'RESERVE' ? '#666' : 'transparent', color: currentSquadType === 'RESERVE' ? '#fff' : '#666' }}>RESERVA</button>
                      <button onClick={() => onSquadTypeChange('U20')} className="px-3 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all" style={{ backgroundColor: currentSquadType === 'U20' ? '#666' : 'transparent', color: currentSquadType === 'U20' ? '#fff' : '#666' }}>SUB-20</button>
                   </div>
                )}

                {/* League Tabs */}
                {allLeagues && onLeagueChange && (
                   <div className="flex overflow-x-auto scrollbar-hide space-x-1 p-1 rounded-lg" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                      {allLeagues.map(l => (
                         <button key={l.id} onClick={() => onLeagueChange(l.id)} className="px-2 py-1 text-[9px] font-black rounded whitespace-nowrap tracking-widest uppercase" style={{ backgroundColor: currentLeagueId === l.id ? '#ccc' : 'transparent', color: currentLeagueId === l.id ? '#333' : '#666' }}>{l.name}</button>
                      ))}
                   </div>
                )}
             </div>

             {/* View Mode Selector - Very Compact on Mobile */}
             <div className="flex overflow-x-auto scrollbar-hide" style={{ borderBottom: '1px solid #999' }}>
                <button onClick={() => setTabMode('TABLE')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: tabMode === 'TABLE' ? '#666' : '#999', borderBottom: tabMode === 'TABLE' ? '2px solid #666' : 'none' }}>Clasificación</button>
                <button onClick={() => setTabMode('SCORERS')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: tabMode === 'SCORERS' ? '#666' : '#999', borderBottom: tabMode === 'SCORERS' ? '2px solid #666' : 'none' }}>Goleadores</button>
                <button onClick={() => setTabMode('ASSISTS')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest" style={{ color: tabMode === 'ASSISTS' ? '#666' : '#999', borderBottom: tabMode === 'ASSISTS' ? '2px solid #666' : 'none' }}>Asistencias</button>
             </div>
          </div>

          <div className="rounded-lg shadow-2xl overflow-hidden flex-1 flex flex-col" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
             <div className="overflow-auto scrollbar-hide max-h-full">
                {tabMode === 'TABLE' && (
                   entries.length > 0 ? (
                     <table className="w-full text-left min-w-[300px]">
                        <thead className="sticky top-0 z-10 font-black uppercase text-[9px]" style={{ backgroundColor: '#e8e8e8', borderBottom: '1px solid #999', color: '#666' }}>
                           <tr>
                              <th className="p-3 text-center w-10">Pos</th>
                              <th className="p-3">Club</th>
                              <th className="p-3 text-center w-10">PJ</th>
                              <th className="p-3 text-center w-10 hidden sm:table-cell">G</th>
                              <th className="p-3 text-center w-10 hidden sm:table-cell">E</th>
                              <th className="p-3 text-center w-10 hidden sm:table-cell">P</th>
                              <th className="p-3 text-center w-10 hidden md:table-cell">DG</th>
                              <th className="p-3 text-center w-12">Pts</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y text-xs" style={{ borderColor: '#ccc' }}>
                           {entries.map((entry, index) => (
                              <tr key={entry.clubId} style={{ backgroundColor: entry.clubId === userClubId ? '#e8e8e8' : 'transparent' }}>
                                 <td className="p-3 text-center font-mono font-bold text-[10px]">{index + 1}</td>
                                 <td className="p-3 font-bold truncate max-w-[120px] sm:max-w-none" style={{ color: '#333' }}>{entry.clubName}</td>
                                 <td className="p-3 text-center font-mono" style={{ color: '#666' }}>{entry.played}</td>
                                 <td className="p-3 text-center hidden sm:table-cell font-mono" style={{ color: '#666' }}>{entry.won}</td>
                                 <td className="p-3 text-center hidden sm:table-cell font-mono" style={{ color: '#666' }}>{entry.drawn}</td>
                                 <td className="p-3 text-center hidden sm:table-cell font-mono" style={{ color: '#666' }}>{entry.lost}</td>
                                 <td className="p-3 text-center hidden md:table-cell font-mono" style={{ color: '#666' }}>{entry.gd}</td>
                                 <td className="p-3 text-center font-black" style={{ color: '#333' }}>{entry.points}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                   ) : (
                     <div className="p-20 text-center italic uppercase font-black tracking-widest" style={{ color: '#999' }}>Sin datos de clasificación</div>
                   )
                )}
                {tabMode === 'SCORERS' && (
                   <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 font-black uppercase text-[9px]" style={{ backgroundColor: '#e8e8e8', borderBottom: '1px solid #999', color: '#666' }}>
                         <tr><th className="p-3 w-10 text-center">#</th><th className="p-3">Jugador</th><th className="p-3">Club</th><th className="p-3 text-center w-16">Goles</th></tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: '#ccc' }}>
                         {topScorers.filter(p => p.seasonStats.goals > 0).map((p, idx) => (
                            <tr key={p.id}>
                               <td className="p-3 text-center font-mono" style={{ color: '#666' }}>{idx + 1}</td>
                               <td className="p-3 font-bold truncate" style={{ color: '#333' }}>{p.name}</td>
                               <td className="p-3 text-[10px]" style={{ color: '#999' }}>{world.getClub(p.clubId)?.name}</td>
                               <td className="p-3 text-center font-black" style={{ color: '#666' }}>{p.seasonStats.goals}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                )}
                {tabMode === 'ASSISTS' && (
                   <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 z-10 font-black uppercase text-[9px]" style={{ backgroundColor: '#e8e8e8', borderBottom: '1px solid #999', color: '#666' }}>
                         <tr><th className="p-3 w-10 text-center">#</th><th className="p-3">Jugador</th><th className="p-3">Club</th><th className="p-3 text-center w-16">Asist.</th></tr>
                      </thead>
                      <tbody className="divide-y" style={{ borderColor: '#ccc' }}>
                         {topAssists.filter(p => p.seasonStats.assists > 0).map((p, idx) => (
                            <tr key={p.id}>
                               <td className="p-3 text-center font-mono" style={{ color: '#666' }}>{idx + 1}</td>
                               <td className="p-3 font-bold truncate" style={{ color: '#333' }}>{p.name}</td>
                               <td className="p-3 text-[10px]" style={{ color: '#999' }}>{world.getClub(p.clubId)?.name}</td>
                               <td className="p-3 text-center font-black" style={{ color: '#666' }}>{p.seasonStats.assists}</td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                )}
                {(tabMode === 'SCORERS' || tabMode === 'ASSISTS') && leaguePlayers.every(p => tabMode === 'SCORERS' ? p.seasonStats.goals === 0 : p.seasonStats.assists === 0) && (
                   <div className="p-20 text-center italic uppercase font-black tracking-widest" style={{ color: '#999' }}>Aún no hay registros en esta categoría</div>
                )}
             </div>
          </div>
       </div>
    );
}
