
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
  currentDate: Date; // Added prop
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
    if (trend === 'RISING') return <TrendingUp size={14} className="text-green-600 mx-auto" />;
    if (trend === 'DECLINING') return <TrendingDown size={14} className="text-red-600 mx-auto" />;
    return <Minus size={14} className="text-slate-400 mx-auto" />;
  };

  const getStatusIcons = (player: Player) => {
     const icons = [];
     
     if (player.injury) {
        icons.push(
           <div key="inj" className="flex items-center gap-1 bg-white border border-red-500 rounded px-1 h-5 shadow-sm" title={`Lesionado: ${player.injury.type}`}>
              <Plus size={10} className="text-red-600 stroke-[4px]" />
              <span className="text-[8px] text-red-600 font-black">{player.injury.daysLeft}d</span>
           </div>
        );
     }
     
     if (player.suspension && player.suspension.matchesLeft > 0) {
        icons.push(
           <div key="susp" className="flex items-center gap-1 bg-white border border-red-500 rounded px-1 h-5 shadow-sm" title="Sancionado">
              <Square size={10} className="fill-red-600 text-red-600 rounded-[1px]" />
              <span className="text-[8px] text-red-600 font-black">{player.suspension.matchesLeft}p</span>
           </div>
        );
     }

     if (DialogueSystem.checkPlayerMotives(player, currentDate)) {
        icons.push(
           <div key="unhappy" className="flex items-center justify-center bg-orange-600 rounded px-1 h-5 shadow-sm border border-orange-700" title="Descontento">
              <AlertCircle size={10} className="text-white" />
           </div>
        );
     }

     return icons.length > 0 ? <div className="flex gap-1 items-center">{icons}</div> : null;
  };

  return (
    <div className="p-2 h-full flex flex-col gap-2 bg-slate-300">
      <FMBox title={customTitle || `PLANTILLA (${players.length})`} className="flex-1" noPadding>
        <FMTable 
            headers={['Pos', 'Nombre', 'Edad', 'Prog', 'Sueldo', 'Fis', 'Mor', 'Valor']}
            colWidths={['50px', 'auto', '40px', '40px', '70px', '40px', '40px', '80px']}
            onHeaderClick={handleHeaderClick}
        >
            {sortedPlayers.map(player => (
                <tr 
                  key={player.id} 
                  onClick={() => onSelectPlayer(player)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className={`hover:bg-slate-100 cursor-pointer transition-colors border-l-[6px] ${player.isStarter ? 'border-l-slate-900 bg-white' : 'border-l-transparent'} ${player.transferStatus !== 'NONE' ? 'bg-orange-50/50' : ''} ${player.injury || (player.suspension?.matchesLeft || 0) > 0 ? 'bg-red-50/50' : ''}`}
                >
                   {/* 1. POSITION */}
                   <FMTableCell className="font-mono font-bold text-slate-700 text-center">{player.positions[0]}</FMTableCell>

                   {/* 2. NAME */}
                   <FMTableCell className="font-black text-slate-950 italic tracking-tight truncate max-w-[120px] sm:max-w-none flex items-center gap-2">
                      <img 
                        src={getFlagUrl(player.nationality)} 
                        alt={player.nationality} 
                        className="w-4 h-3 object-cover shadow-sm rounded-[1px]" 
                        title={player.nationality} 
                      />
                      <span className="truncate">{player.name}</span>
                      {player.transferStatus !== 'NONE' && <span className="text-[8px] text-orange-700 font-black border border-orange-300 bg-orange-100 px-1 rounded-sm">TRN</span>}
                      {getStatusIcons(player)}
                   </FMTableCell>

                   {/* 3. AGE */}
                   <FMTableCell className="text-center font-mono font-bold text-slate-900" isNumber>{player.age}</FMTableCell>

                   {/* 4. TREND */}
                   <FMTableCell className="text-center" title={player.developmentTrend || 'Estable'}>
                      {renderTrend(player.developmentTrend)}
                   </FMTableCell>

                   {/* 5. SALARY */}
                   <FMTableCell className="text-right font-bold text-slate-600 hidden md:table-cell" isNumber>£{(player.salary / 1000).toFixed(0)}k</FMTableCell>

                   {/* 6. FITNESS */}
                   <FMTableCell className="text-center" isNumber>
                      <span className={`${player.fitness < 70 ? 'text-red-700' : 'text-slate-950'} font-black`}>{Math.round(player.fitness)}%</span>
                   </FMTableCell>

                   {/* 7. MORALE */}
                   <FMTableCell className="text-center" isNumber>
                      <span className={`${player.morale < 60 ? 'text-red-700' : 'text-slate-950'} font-black`}>{Math.round(player.morale)}%</span>
                   </FMTableCell>

                   {/* 8. VALUE */}
                   <FMTableCell className="text-right font-black hidden sm:table-cell" isNumber>£{(player.value / 1000000).toFixed(1)}M</FMTableCell>
                </tr>
            ))}
        </FMTable>
      </FMBox>
    </div>
  );
};
