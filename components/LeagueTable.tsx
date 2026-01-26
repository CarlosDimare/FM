
import React, { useState, useMemo } from 'react';
import { TableEntry, Competition, SquadType, Player, Fixture } from '../types';
import { world } from '../services/worldManager';
import { FMBox, FMButton, FMTable, FMTableCell } from './FMUI';

interface LeagueTableProps {
   entries: TableEntry[];
   userClubId: string;
   allLeagues?: Competition[];
   currentLeagueId?: string;
   onLeagueChange?: (id: string) => void;
   currentSquadType?: SquadType;
   onSquadTypeChange?: (squad: SquadType) => void;
   fixtures?: Fixture[];
}

export const LeagueTable: React.FC<LeagueTableProps> = ({ 
   entries, userClubId, allLeagues, currentLeagueId, onLeagueChange, currentSquadType = 'SENIOR', onSquadTypeChange
}) => {
   
   const leaguePlayers = useMemo(() => {
      if (!currentLeagueId) return [];
      const participatingClubIds = new Set<string>();
      world.clubs.forEach(c => { if (c.leagueId === currentLeagueId) participatingClubIds.add(c.id); });
      const compPlayers = world.players.filter(p => {
         const club = world.getClub(p.clubId);
         return (club?.leagueId === currentLeagueId || participatingClubIds.has(p.clubId)) && p.squad === currentSquadType;
      });
      return compPlayers.length > 0 ? compPlayers : world.players.filter(p => p.squad === currentSquadType);
   }, [currentLeagueId, currentSquadType]);

   const getCompGoals = (p: Player) => {
      if (!currentLeagueId || !p.statsByCompetition[currentLeagueId]) return 0;
      return p.statsByCompetition[currentLeagueId].goals;
   };

   const topScorers = useMemo(() => {
      return [...leaguePlayers].sort((a, b) => getCompGoals(b) - getCompGoals(a)).slice(0, 20);
   }, [leaguePlayers, currentLeagueId]);

   const getRowClass = (index: number) => {
      // Logic for indicators
      if (currentLeagueId === 'L_ARG_1') {
         if (index < 5) return 'border-l-4 border-l-green-500'; // Libertadores
         if (index >= 5 && index < 10) return 'border-l-4 border-l-blue-500'; // Sudamericana
         if (entries.length > 2 && index >= entries.length - 2) return 'border-l-4 border-l-red-500'; // Relegation
      } else if (currentLeagueId === 'L_ARG_2') {
         if (index < 2) return 'border-l-4 border-l-green-500'; // Promotion
      }
      return 'border-l-4 border-l-transparent';
   };

   const getStatusLabel = (index: number) => {
      if (currentLeagueId === 'L_ARG_1') {
         if (index < 5) return <span className="text-[7px] bg-green-900 text-green-100 px-1 rounded uppercase tracking-tighter">Lib</span>;
         if (index >= 5 && index < 10) return <span className="text-[7px] bg-blue-900 text-blue-100 px-1 rounded uppercase tracking-tighter">Sud</span>;
         if (entries.length > 2 && index >= entries.length - 2) return <span className="text-[7px] bg-red-900 text-red-100 px-1 rounded uppercase tracking-tighter">Des</span>;
      } else if (currentLeagueId === 'L_ARG_2') {
         if (index < 2) return <span className="text-[7px] bg-green-900 text-green-100 px-1 rounded uppercase tracking-tighter">Asc</span>;
      }
      return null;
   };

   return (
      <div className="flex flex-col h-full gap-2 p-2 overflow-hidden">
         {/* Controls */}
         <div className="flex gap-2 mb-2 overflow-x-auto scrollbar-hide shrink-0">
             {onSquadTypeChange && (
                 <div className="flex bg-slate-800 rounded-sm p-0.5 gap-1 shrink-0">
                     {['SENIOR', 'RESERVE', 'U20'].map(t => (
                         <button key={t} onClick={() => onSquadTypeChange(t as any)} className={`px-2 py-0.5 text-[9px] font-bold ${currentSquadType === t ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{t}</button>
                     ))}
                 </div>
             )}
             {allLeagues && onLeagueChange && (
                 <div className="flex bg-slate-800 rounded-sm p-0.5 gap-1 overflow-x-auto scrollbar-hide">
                     {allLeagues.map(l => (
                         <button key={l.id} onClick={() => onLeagueChange(l.id)} className={`px-2 py-0.5 text-[9px] font-bold whitespace-nowrap ${currentLeagueId === l.id ? 'bg-slate-600 text-white' : 'text-slate-500'}`}>{l.name}</button>
                     ))}
                 </div>
             )}
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-2 flex-1 min-h-0 overflow-hidden">
             <div className="md:col-span-2 h-full flex flex-col min-h-0">
                 <FMBox title="Clasificación" className="h-full flex flex-col overflow-hidden" noPadding>
                    <div className="flex-1 overflow-y-auto custom-scroll">
                        <FMTable headers={['Pos', 'Club', 'PJ', 'G', 'E', 'P', 'DG', 'Pts']} colWidths={['40px', 'auto', '30px', '30px', '30px', '30px', '30px', '40px']}>
                            {entries.length > 0 ? entries.map((e, i) => (
                                <tr key={e.clubId} className={`${e.clubId === userClubId ? 'bg-blue-900/40 text-white' : ''} hover:bg-slate-700/50 ${getRowClass(i)}`}>
                                    <FMTableCell className="text-center bg-slate-800/50">
                                    <div className="flex items-center justify-center gap-1">
                                        {i + 1} {getStatusLabel(i)}
                                    </div>
                                    </FMTableCell>
                                    <FMTableCell className="font-bold truncate max-w-[120px]">{e.clubName}</FMTableCell>
                                    <FMTableCell className="text-center" isNumber>{e.played}</FMTableCell>
                                    <FMTableCell className="text-center text-green-400/70" isNumber>{e.won}</FMTableCell>
                                    <FMTableCell className="text-center text-slate-500" isNumber>{e.drawn}</FMTableCell>
                                    <FMTableCell className="text-center text-red-400/70" isNumber>{e.lost}</FMTableCell>
                                    <FMTableCell className="text-center" isNumber>{e.gd}</FMTableCell>
                                    <FMTableCell className="text-center font-bold text-white bg-slate-800/50" isNumber>{e.points}</FMTableCell>
                                </tr>
                            )) : (
                                <tr><td colSpan={8} className="p-4 text-center text-slate-500 italic">Sin datos</td></tr>
                            )}
                        </FMTable>
                    </div>
                 </FMBox>
             </div>

             <div className="h-full flex flex-col min-h-0">
                 <FMBox title="Goleadores del Torneo" className="h-full flex flex-col overflow-hidden" noPadding>
                     <div className="flex-1 overflow-y-auto custom-scroll">
                        <FMTable headers={['#', 'Nombre', 'Goles']} colWidths={['30px', 'auto', '40px']}>
                            {topScorers.filter(p => getCompGoals(p) > 0).map((p, i) => (
                                <tr key={p.id} className="hover:bg-slate-700/50">
                                    <FMTableCell className="text-center">{i + 1}</FMTableCell>
                                    <FMTableCell className="truncate max-w-[100px]">{p.name}</FMTableCell>
                                    <FMTableCell className="text-center font-bold text-green-400" isNumber>{getCompGoals(p)}</FMTableCell>
                                </tr>
                            ))}
                            {topScorers.every(p => getCompGoals(p) === 0) && (
                                <tr><td colSpan={3} className="p-4 text-center text-slate-500 italic">Sin goles registrados</td></tr>
                            )}
                        </FMTable>
                     </div>
                 </FMBox>
             </div>
         </div>
      </div>
   );
}
