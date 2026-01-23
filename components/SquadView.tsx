import React, { useState } from 'react';
import { Player, POSITION_ORDER } from '../types';
import { FMBox, FMTable, FMTableCell } from './FMUI';

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

  return (
    <div className="p-2 h-full flex flex-col gap-2 bg-slate-300">
      <FMBox title={`PLANTILLA (${players.length})`} className="flex-1" noPadding>
        <FMTable 
            headers={['Estado', 'Nombre', 'Posición', 'Edad', 'Valor', 'Sueldo', 'Fis', 'Mor']}
            colWidths={['60px', 'auto', '60px', '40px', '80px', '70px', '40px', '40px']}
        >
            {sortedPlayers.map(player => (
                <tr 
                  key={player.id} 
                  onClick={() => onSelectPlayer(player)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className={`hover:bg-slate-100 cursor-pointer transition-colors border-l-4 ${player.isStarter ? 'border-l-slate-900' : 'border-l-transparent'} ${player.transferStatus !== 'NONE' ? 'bg-orange-50/50' : ''}`}
                >
                   <FMTableCell className="text-center">
                        {player.isStarter ? <span className="text-slate-950 font-black text-[9px] uppercase tracking-tighter">TIT</span> : <span className="text-slate-400 font-bold text-[9px] uppercase tracking-tighter">SUPL</span>}
                   </FMTableCell>
                   <FMTableCell className="font-black text-slate-950 uppercase italic tracking-tight truncate max-w-[120px] sm:max-w-none">
                      {player.name}
                      {player.transferStatus !== 'NONE' && <span className="text-[8px] ml-1 text-orange-700 font-black border border-orange-300 bg-orange-100 px-1 rounded-sm">TRN</span>}
                   </FMTableCell>
                   <FMTableCell className="font-mono font-bold text-slate-700 text-center">{player.positions[0]}</FMTableCell>
                   <FMTableCell className="text-center font-mono font-bold text-slate-900" isNumber>{player.age}</FMTableCell>
                   <FMTableCell className="text-right font-black hidden sm:table-cell" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                   <FMTableCell className="text-right font-bold text-slate-600 hidden md:table-cell" isNumber>£{(player.salary / 1000).toFixed(0)}k</FMTableCell>
                   <FMTableCell className="text-center" isNumber>
                      <span className={`${player.fitness < 70 ? 'text-red-700' : 'text-slate-950'} font-black`}>{player.fitness}%</span>
                   </FMTableCell>
                   <FMTableCell className="text-center" isNumber>
                      <span className={`${player.morale < 60 ? 'text-red-700' : 'text-slate-950'} font-black`}>{player.morale}%</span>
                   </FMTableCell>
                </tr>
            ))}
        </FMTable>
      </FMBox>
    </div>
  );
};
