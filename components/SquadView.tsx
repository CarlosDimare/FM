
import React from 'react';
import { useState } from 'react';
import { Player, POSITION_ORDER } from '../types';
import { FMBox, FMTable, FMTableCell } from './FMUI';
import { TrendingUp, TrendingDown, Minus, Plus, Square, AlertCircle } from 'lucide-react';
import { getFlagUrl } from '../data/static';
import { DialogueSystem } from '../services/dialogueSystem';

interface SquadViewProps {
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onContextMenu?: (e: React.MouseEvent, player: Player) => void;
  customTitle?: string;
  currentDate: Date;
}

type SortField = 'STATUS' | 'POS' | 'NAME' | 'AGE' | 'TREND' | 'SAL' | 'FIT' | 'MOR' | 'VAL';

export const SquadView: React.FC<SquadViewProps> = ({ players, onSelectPlayer, onContextMenu, customTitle, currentDate }) => {
  const [sortField, setSortField] = useState<SortField>('VAL');
  const [sortDesc, setSortDesc] = useState(true);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortDesc(!sortDesc);
    else { setSortField(field); setSortDesc(true); }
  };

  const handleHeaderClick = (index: number) => {
      const fields: SortField[] = ['POS', 'NAME', 'AGE', 'TREND', 'SAL', 'FIT', 'MOR', 'VAL'];
      if (fields[index]) handleSort(fields[index]);
  };

  const sortedPlayers = [...players].sort((a, b) => {
    let res = 0;
    switch (sortField) {
      case 'STATUS': 
          res = (Number(b.isStarter) - Number(a.isStarter)); 
          break;
      case 'POS': res = (POSITION_ORDER[a.positions[0]] || 99) - (POSITION_ORDER[b.positions[0]] || 99); break;
      case 'NAME': res = a.name.localeCompare(b.name); break;
      case 'AGE': res = a.age - b.age; break;
      case 'TREND': 
          const getTrendVal = (t?: string) => t === 'RISING' ? 2 : t === 'DECLINING' ? 0 : 1;
          res = getTrendVal(a.developmentTrend) - getTrendVal(b.developmentTrend); 
          break;
      case 'SAL': res = a.salary - b.salary; break;
      case 'FIT': res = a.fitness - b.fitness; break;
      case 'MOR': res = a.morale - b.morale; break;
      case 'VAL': res = a.value - b.value; break;
    }
    return sortDesc ? -res : res;
  });

  const renderTrend = (trend: string | undefined) => {
    if (trend === 'RISING') return <TrendingUp size={12} className="text-green-600 mx-auto" />;
    if (trend === 'DECLINING') return <TrendingDown size={12} className="text-red-600 mx-auto" />;
    return <Minus size={12} className="text-slate-300 mx-auto" />;
  };

  const getStatusIcons = (player: Player) => {
     const icons = [];
     
     if (player.transferStatus !== 'NONE') {
        icons.push(
           <span key="trn" className="text-[9px] text-orange-700 font-bold bg-orange-100 border border-orange-300 px-1 rounded-[1px]">TRN</span>
        );
     }

     if (player.injury) {
        icons.push(
           <span key="inj" className="text-[9px] text-white font-bold bg-red-600 px-1 rounded-[1px]">LES</span>
        );
     }
     
     if (player.suspension && player.suspension.matchesLeft > 0) {
        icons.push(
           <span key="sus" className="text-[9px] text-white font-bold bg-red-600 px-1 rounded-[1px]">SUS</span>
        );
     }

     if (DialogueSystem.checkPlayerMotives(player, currentDate)) {
        icons.push(
           <span key="unh" className="text-[9px] text-white font-bold bg-amber-600 px-1 rounded-[1px]">DFT</span>
        );
     }

     return icons.length > 0 ? <div className="flex gap-1 items-center ml-2">{icons}</div> : null;
  };

  return (
    <div className="p-2 h-full flex flex-col gap-2 bg-[#d4dcd4]">
      <FMBox title={customTitle || `Plantilla (${players.length})`} className="flex-1" noPadding>
        <FMTable 
            headers={['Pos', 'Nombre', 'Edad', 'Prog', 'Sueldo', 'Fis', 'Mor', 'Valor']}
            colWidths={['50px', 'auto', '40px', '40px', '70px', '40px', '40px', '80px']}
            onHeaderClick={handleHeaderClick}
        >
            {sortedPlayers.map((player, idx) => (
                <tr 
                  key={player.id} 
                  onClick={() => onSelectPlayer(player)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className={`
                    cursor-pointer transition-colors
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                    hover:bg-[#ccd9cc]
                    ${player.isStarter ? 'font-bold' : ''}
                  `}
                >
                   <FMTableCell className="text-center text-slate-700">{player.positions[0]}</FMTableCell>

                   <FMTableCell className="text-slate-900">
                      <div className="flex items-center">
                        <img 
                          src={getFlagUrl(player.nationality)} 
                          alt={player.nationality} 
                          className="w-4 h-3 object-cover shadow-sm rounded-[1px] mr-2 shrink-0" 
                          title={player.nationality} 
                        />
                        <span className="truncate max-w-[80px] sm:max-w-none">{player.name}</span>
                        {getStatusIcons(player)}
                      </div>
                   </FMTableCell>

                   <FMTableCell className="text-center" isNumber>{player.age}</FMTableCell>

                   <FMTableCell className="text-center hidden sm:table-cell" title={player.developmentTrend || 'Estable'}>
                      {renderTrend(player.developmentTrend)}
                   </FMTableCell>

                   <FMTableCell className="text-right hidden lg:table-cell" isNumber>£{(player.salary / 1000).toFixed(0)}k</FMTableCell>

                   <FMTableCell className="text-center" isNumber>
                      {Math.round(player.fitness)}%
                   </FMTableCell>

                   <FMTableCell className="text-center hidden md:table-cell" isNumber>
                      {Math.round(player.morale)}%
                   </FMTableCell>

                   <FMTableCell className="text-right" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                </tr>
            ))}
        </FMTable>
      </FMBox>
    </div>
  );
};
