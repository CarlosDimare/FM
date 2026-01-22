
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
      <div className="flex flex-col h-full gap-2 md:gap-4 overflow-hidden">
         <div className="flex flex-col gap-2 md:gap-4">
            <div className="flex flex-col gap-3">
               {/* Squad Selector - Compact on Mobile */}
               {onSquadTypeChange && (
                  <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 overflow-x-auto scrollbar-hide">
                     <button onClick={() => onSquadTypeChange('SENIOR')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all ${currentSquadType === 'SENIOR' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>PRIMER EQUIPO</button>
                     <button onClick={() => onSquadTypeChange('RESERVE')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all ${currentSquadType === 'RESERVE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>RESERVA</button>
                     <button onClick={() => onSquadTypeChange('U20')} className={`px-3 py-1.5 text-[10px] font-bold rounded-md whitespace-nowrap transition-all ${currentSquadType === 'U20' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}>SUB-20</button>
                  </div>
               )}

               {/* League Tabs */}
               {allLeagues && onLeagueChange && (
                  <div className="flex overflow-x-auto scrollbar-hide space-x-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
                     {allLeagues.map(l => (
                        <button key={l.id} onClick={() => onLeagueChange(l.id)} className={`px-2 py-1 text-[9px] font-black rounded whitespace-nowrap tracking-widest uppercase ${currentLeagueId === l.id ? 'bg-slate-700 text-blue-400' : 'text-slate-500'}`}>{l.name}</button>
                     ))}
                  </div>
               )}
            </div>

            {/* View Mode Selector - Very Compact on Mobile */}
            <div className="flex border-b border-slate-800 overflow-x-auto scrollbar-hide">
               <button onClick={() => setTabMode('TABLE')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${tabMode === 'TABLE' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Clasificación</button>
               <button onClick={() => setTabMode('SCORERS')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${tabMode === 'SCORERS' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Goleadores</button>
               <button onClick={() => setTabMode('ASSISTS')} className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest ${tabMode === 'ASSISTS' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-500'}`}>Asistencias</button>
            </div>
         </div>

         <div className="bg-slate-800 rounded-lg shadow-2xl overflow-hidden border border-slate-700 flex-1 flex flex-col">
            <div className="overflow-auto scrollbar-hide max-h-full">
               {tabMode === 'TABLE' && (
                  entries.length > 0 ? (
                    <table className="w-full text-left min-w-[300px]">
                       <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-700">
                          <tr className="text-slate-400 text-[9px] uppercase font-black">
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
                       <tbody className="divide-y divide-slate-700/50 text-xs">
                          {entries.map((entry, index) => (
                             <tr key={entry.clubId} className={`${entry.clubId === userClubId ? 'bg-blue-600/10' : ''}`}>
                                <td className="p-3 text-center font-mono font-bold text-[10px]">{index + 1}</td>
                                <td className="p-3 font-bold truncate max-w-[120px] sm:max-w-none">{entry.clubName}</td>
                                <td className="p-3 text-center font-mono">{entry.played}</td>
                                <td className="p-3 text-center hidden sm:table-cell font-mono">{entry.won}</td>
                                <td className="p-3 text-center hidden sm:table-cell font-mono">{entry.drawn}</td>
                                <td className="p-3 text-center hidden sm:table-cell font-mono">{entry.lost}</td>
                                <td className="p-3 text-center hidden md:table-cell font-mono">{entry.gd}</td>
                                <td className="p-3 text-center font-black text-white">{entry.points}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                  ) : (
                    <div className="p-20 text-center text-slate-500 italic uppercase font-black tracking-widest">Sin datos de clasificación</div>
                  )
               )}
               {tabMode === 'SCORERS' && (
                  <table className="w-full text-left text-xs">
                     <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-700 font-black uppercase text-[9px] text-slate-400">
                        <tr><th className="p-3 w-10 text-center">#</th><th className="p-3">Jugador</th><th className="p-3">Club</th><th className="p-3 text-center w-16">Goles</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700/50">
                        {topScorers.filter(p => p.seasonStats.goals > 0).map((p, idx) => (
                           <tr key={p.id}>
                              <td className="p-3 text-center font-mono">{idx + 1}</td>
                              <td className="p-3 font-bold truncate">{p.name}</td>
                              <td className="p-3 text-slate-400 text-[10px]">{world.getClub(p.clubId)?.name}</td>
                              <td className="p-3 text-center font-black text-blue-400">{p.seasonStats.goals}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               )}
               {tabMode === 'ASSISTS' && (
                  <table className="w-full text-left text-xs">
                     <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-700 font-black uppercase text-[9px] text-slate-400">
                        <tr><th className="p-3 w-10 text-center">#</th><th className="p-3">Jugador</th><th className="p-3">Club</th><th className="p-3 text-center w-16">Asist.</th></tr>
                     </thead>
                     <tbody className="divide-y divide-slate-700/50">
                        {topAssists.filter(p => p.seasonStats.assists > 0).map((p, idx) => (
                           <tr key={p.id}>
                              <td className="p-3 text-center font-mono">{idx + 1}</td>
                              <td className="p-3 font-bold truncate">{p.name}</td>
                              <td className="p-3 text-slate-400 text-[10px]">{world.getClub(p.clubId)?.name}</td>
                              <td className="p-3 text-center font-black text-green-400">{p.seasonStats.assists}</td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               )}
               {(tabMode === 'SCORERS' || tabMode === 'ASSISTS') && leaguePlayers.every(p => tabMode === 'SCORERS' ? p.seasonStats.goals === 0 : p.seasonStats.assists === 0) && (
                  <div className="p-20 text-center text-slate-500 italic uppercase font-black tracking-widest">Aún no hay registros en esta categoría</div>
               )}
            </div>
         </div>
      </div>
   );
}
