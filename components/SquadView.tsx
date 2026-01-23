
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

  const getStatusTag = (player: Player) => {
    if (player.injury) return <span className="status-les text-[9px] ml-2">LES</span>;
    if (player.transferStatus === 'TRANSFERABLE') return <span className="status-trn text-[9px] ml-2">TRN</span>;
    if (player.transferStatus === 'LOANABLE') return <span className="status-trn text-[9px] ml-2">TRN</span>;
    return null;
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col fm-compact">
      <header className="flex flex-col sm:flex-row justify-between sm:items-end mb-4 md:mb-6 gap-2">
        <div>
          <h2 className="text-xl md:text-2xl font-bold uppercase tracking-tighter italic" style={{ color: '#333' }}>Plantilla</h2>
          <p className="text-xs md:text-sm" style={{ color: '#666' }}>Gestiona tus jugadores.</p>
        </div>
        <div className="text-[10px] md:text-sm font-mono" style={{ color: '#666' }}>
           {players.length} Jugadores
        </div>
      </header>

      <div className="metallic-panel rounded-lg shadow overflow-hidden flex-1 flex flex-col" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
        <div className="overflow-x-auto scrollbar-hide flex-1">
          <table className="w-full text-left border-collapse min-w-[320px]" style={{ fontSize: '11px', fontFamily: 'Verdana, Arial, sans-serif' }}>
            <thead className="sticky top-0 shadow-sm" style={{ backgroundColor: '#e0e0e0', borderBottom: '1px solid #999' }}>
              <tr className="uppercase tracking-wider font-black" style={{ color: '#666', fontSize: '10px' }}>
                <th className="p-3 sm:p-4 text-center w-10 sm:w-16">Rol</th>
                <Th field="NAME" label="Nombre" />
                <Th field="POS" label="Pos" />
                <Th field="VAL" label="Valor" center />
                <Th field="AGE" label="Edad" center hideMobile />
                <Th field="SAL" label="Salario" center hideMobile />
                <Th field="FIT" label="Con" center />
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: '#e0e0e0' }}>
              {sortedPlayers.map(player => (
                <tr 
                  key={player.id} 
                  onClick={() => onSelectPlayer(player)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className="cursor-pointer transition-colors group hover:bg-white"
                  style={{ fontSize: '11px' }}
                >
                   <td className="p-3 sm:p-4 text-center">
                      <div className="text-[8px] sm:text-xs font-black px-1 rounded inline-block border" style={{ 
                        color: player.isStarter ? '#006600' : '#666',
                        borderColor: player.isStarter ? '#006600' : '#999',
                        backgroundColor: player.isStarter ? '#e8ffe8' : '#f0f0f0'
                      }}>
                        {player.isStarter ? 'TIT' : 'SUP'}
                      </div>
                   </td>
                   <td className="p-3 sm:p-4">
                      <div className="flex flex-col">
                        <span className="fm-link text-xs sm:text-sm font-medium truncate max-w-[100px] sm:max-w-none" style={{ color: '#0066cc' }}>
                          {player.name}
                        </span>
                        {getStatusTag(player)}
                      </div>
                   </td>
                   <td className="p-3 sm:p-4 font-mono font-bold" style={{ color: '#333', fontSize: '10px' }}>
                      {player.positions[0]}
                   </td>
                   <td className="p-3 sm:p-4 text-center font-bold text-xs sm:text-sm" style={{ color: '#006600' }}>
                      £{(player.value / 1000000).toFixed(1)}M
                   </td>
                   <td className="p-3 sm:p-4 text-center hidden md:table-cell text-xs sm:text-sm" style={{ color: '#333' }}>{player.age}</td>
                   <td className="p-3 sm:p-4 text-center font-mono hidden md:table-cell text-xs" style={{ color: '#666' }}>
                      £{(player.salary / 1000).toFixed(0)}k
                   </td>
                   <td className="p-3 sm:p-4 text-center font-mono text-[10px] sm:text-xs">
                      <span style={{ color: player.fitness > 90 ? '#006600' : '#ff9900' }}>{player.fitness}%</span>
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
