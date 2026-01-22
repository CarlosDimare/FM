
import React, { useState } from 'react';
import { Player, POSITION_ORDER } from '../types';

interface SquadViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

type SortField = 'POS' | 'NAME' | 'AGE' | 'FIT' | 'VAL' | 'SAL';

export const SquadView: React.FC<SquadViewProps> = ({ players, onSelectPlayer, onContextMenu }) => {
  const [sortField, setSortField] = useState<SortField>('VAL');
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else { setSortField(field); setSortDesc(true); }
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let res = 0;
    switch (sortField) {
      case 'POS': res = (POSITION_ORDER[a.positions[0]] || 99) - (POSITION_ORDER[b.positions[0]] || 99); break;
      case 'NAME': res = a.name.localeCompare(b.name); break;
      case 'AGE': res = a.age - b.age; break;
      case 'FIT': res = a.fitness - b.fitness; break;
      case 'VAL': res = a.value - b.value; break;
      case 'SAL': res = a.salary - b.salary; break;
    }
    return sortDesc ? -res : res;
  });

  const Th = ({ field, label, center, hideMobile }: { field: SortField, label: string, center?: boolean, hideMobile?: boolean }) => (
    <th 
      className={`p-3 sm:p-4 font-semibold cursor-pointer hover:bg-slate-800 transition-colors select-none ${center ? 'text-center' : 'text-left'} ${hideMobile ? 'hidden md:table-cell' : ''}`}
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {label}
        <span className="text-[8px] opacity-40">{sortField === field ? (sortDesc ? '↓' : '↑') : ''}</span>
      </span>
    </th>
  );

  return (
    <div className="p-4 md:p-6 h-full flex flex-col">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 md:mb-6 gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-white">Plantilla</h2>
          <p className="text-xs md:text-sm text-slate-400">Gestiona tus jugadores.</p>
        </div>
        <div className="text-[10px] md:text-sm text-slate-500 font-mono">
           {players.length} Jugadores
        </div>
      </header>

      <div className="bg-slate-800 rounded-lg shadow border border-slate-700 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto scrollbar-hide flex-1">
          <table className="w-full text-left border-collapse min-w-[320px]">
            <thead className="sticky top-0 bg-slate-900 z-10 shadow-sm">
              <tr className="text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="p-3 sm:p-4 text-center w-10 sm:w-16">Rol</th>
                <Th field="NAME" label="Nombre" />
                <Th field="POS" label="Pos" />
                <Th field="VAL" label="Valor" center />
                <Th field="AGE" label="Edad" center hideMobile />
                <Th field="SAL" label="Salario" center hideMobile />
                <Th field="FIT" label="Con" center />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedPlayers.map(player => (
                <tr 
                  key={player.id} 
                  onClick={() => onSelectPlayer(player)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className="hover:bg-slate-700/50 cursor-pointer transition-colors group"
                >
                   <td className="p-3 sm:p-4 text-center">
                      <div className={`text-[8px] sm:text-xs font-black px-1 rounded inline-block ${player.isStarter ? 'text-green-400 border border-green-500/30' : 'text-slate-500'}`}>
                        {player.isStarter ? 'TIT' : 'SUP'}
                      </div>
                   </td>
                   <td className="p-3 sm:p-4">
                      <div className="flex flex-col">
                        <span className="text-xs sm:text-sm font-medium text-blue-400 truncate max-w-[100px] sm:max-w-none">{player.name}</span>
                        {player.transferStatus !== 'NONE' && (
                          <span className={`text-[7px] uppercase font-bold ${player.transferStatus === 'TRANSFERABLE' ? 'text-green-500' : 'text-blue-500'}`}>
                            {player.transferStatus.substring(0,4)}
                          </span>
                        )}
                      </div>
                   </td>
                   <td className="p-3 sm:p-4 text-slate-300 text-[10px] sm:text-xs font-mono font-bold">
                      {player.positions[0]}
                   </td>
                   <td className="p-3 sm:p-4 text-center text-green-500 font-bold text-xs sm:text-sm">
                      £{(player.value / 1000000).toFixed(1)}M
                   </td>
                   <td className="p-3 sm:p-4 text-center text-slate-400 hidden md:table-cell text-xs sm:text-sm">{player.age}</td>
                   <td className="p-3 sm:p-4 text-center text-slate-400 font-mono hidden md:table-cell text-xs">
                      £{(player.salary / 1000).toFixed(0)}k
                   </td>
                   <td className="p-3 sm:p-4 text-center font-mono text-[10px] sm:text-xs">
                      <span className={player.fitness > 90 ? 'text-green-400' : 'text-yellow-400'}>{player.fitness}%</span>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
