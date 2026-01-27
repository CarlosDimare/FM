
import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { Search, Filter, DollarSign, Clock, ArrowRightLeft } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';

interface MarketViewProps {
  onSelectPlayer: (player: Player) => void;
  userClubId: string;
  currentDate: Date;
}

export const MarketView: React.FC<MarketViewProps> = ({ onSelectPlayer, userClubId, currentDate }) => {
  const [filter, setFilter] = useState<'ALL' | 'TRANSFERABLE' | 'LOANABLE'>('ALL');
  const [search, setSearch] = useState('');

  const marketPlayers = useMemo(() => {
    return world.players.filter(p => {
      const isListed = p.transferStatus !== 'NONE';
      const matchesFilter = filter === 'ALL' || p.transferStatus === filter;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      return isListed && matchesFilter && matchesSearch;
    }).sort((a,b) => b.currentAbility - a.currentAbility);
  }, [filter, search]);

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-3 bg-[#d4dcd4] overflow-hidden">
      <header className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2">
           <div>
              <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Mercado Mundial</h2>
              <p className="text-slate-600 font-bold text-[9px] md:text-[10px] uppercase tracking-widest italic">Buscando el próximo refuerzo estrella.</p>
           </div>
           
           <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm w-full md:w-auto">
              {[
                { id: 'ALL', label: 'Todos' },
                { id: 'TRANSFERABLE', label: 'Transf.' },
                { id: 'LOANABLE', label: 'Cedibles' }
              ].map(f => (
                 <button 
                    key={f.id}
                    onClick={() => setFilter(f.id as any)}
                    className={`flex-1 md:px-6 py-1.5 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest ${filter === f.id ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
                 >
                    {f.label}
                 </button>
              ))}
           </div>
        </div>

        <div className="relative">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
           <input 
              type="text" 
              placeholder="Introduce nombre del jugador..." 
              className="w-full bg-white border border-[#a0b0a0] rounded-sm pl-9 pr-4 py-2 text-slate-950 focus:border-[#3a4a3a] outline-none font-bold text-[11px] tracking-wide placeholder:text-slate-400 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </header>

      <FMBox title={`Resultados del Mercado (${marketPlayers.length})`} className="flex-1" noPadding>
         <FMTable 
            headers={['Jugador', 'Club', 'Estado', 'Valor']}
            colWidths={['auto', 'auto', '80px', '80px']}
         >
            {marketPlayers.map((p, idx) => (
               <tr 
                  key={p.id} 
                  onClick={() => onSelectPlayer(p)}
                  className={`
                    cursor-pointer transition-colors
                    ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}
                    hover:bg-[#ccd9cc]
                  `}
               >
                  <FMTableCell>
                     <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-[11px]">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{p.positions[0]}</span>
                     </div>
                  </FMTableCell>
                  <FMTableCell className="text-slate-700 text-[10px] italic">
                     {world.getClub(p.clubId)?.name}
                  </FMTableCell>
                  <FMTableCell className="text-center">
                     <span className={`px-1.5 py-0.5 rounded-[1px] text-[8px] font-bold uppercase tracking-tighter border ${p.transferStatus === 'TRANSFERABLE' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                        {p.transferStatus === 'TRANSFERABLE' ? 'TRN' : 'CED'}
                     </span>
                  </FMTableCell>
                  <FMTableCell className="text-right font-bold text-slate-900" isNumber>
                     £{(p.value / 1000000).toFixed(1)}M
                  </FMTableCell>
               </tr>
            ))}
         </FMTable>
         {marketPlayers.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic uppercase font-bold tracking-widest text-[10px]">No se encontraron registros activos</div>
         )}
      </FMBox>
    </div>
  );
};
