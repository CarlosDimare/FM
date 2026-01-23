import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { Search, Filter, DollarSign, Clock, ArrowRightLeft } from 'lucide-react';
import { FMBox, FMTable, FMTableCell } from './FMUI';

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
    <div className="p-4 h-full flex flex-col gap-4 bg-slate-400 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-slate-600 pb-4">
        <div>
          <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter">Mercado Mundial</h2>
          <p className="text-slate-800 font-black text-xs uppercase tracking-widest italic">Buscando el próximo refuerzo estrella.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-sm border border-slate-600 shadow-inner">
           {[
             { id: 'ALL', label: 'Todos' },
             { id: 'TRANSFERABLE', label: 'Transferibles' },
             { id: 'LOANABLE', label: 'Cedibles' }
           ].map(f => (
              <button 
                 key={f.id}
                 onClick={() => setFilter(f.id as any)}
                 className={`px-6 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest ${filter === f.id ? 'bg-slate-950 text-white shadow-md' : 'text-slate-600 hover:text-slate-950'}`}
              >
                 {f.label}
              </button>
           ))}
        </div>
      </header>

      <div className="relative shrink-0">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
         <input 
            type="text" 
            placeholder="Introduce nombre del jugador..." 
            className="w-full bg-slate-100 border border-slate-600 rounded-sm pl-12 pr-6 py-4 text-slate-950 focus:ring-2 focus:ring-slate-900 outline-none font-black uppercase text-xs tracking-wider placeholder:text-slate-400 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
      </div>

      <FMBox title="Resultados del Mercado" className="flex-1" noPadding>
         <FMTable 
            headers={['Jugador', 'Club', 'Estado', 'Edad', 'Valor']}
            colWidths={['auto', 'auto', '120px', '50px', '100px']}
         >
            {marketPlayers.map(p => (
               <tr 
                  key={p.id} 
                  onClick={() => onSelectPlayer(p)}
                  className="hover:bg-slate-300 cursor-pointer transition-colors group"
               >
                  <FMTableCell>
                     <p className="font-black text-slate-950 group-hover:text-blue-900 italic uppercase tracking-tighter">{p.name}</p>
                     <p className="text-[9px] text-slate-600 font-black uppercase font-mono">{p.positions[0]}</p>
                  </FMTableCell>
                  <FMTableCell className="text-slate-700 italic font-black uppercase text-[10px]">
                     {world.getClub(p.clubId)?.name}
                  </FMTableCell>
                  <FMTableCell>
                     <span className={`px-2 py-0.5 rounded-sm text-[9px] font-black uppercase tracking-widest border ${p.transferStatus === 'TRANSFERABLE' ? 'bg-green-200 text-green-900 border-green-500' : 'bg-blue-200 text-blue-900 border-blue-500'}`}>
                        {p.transferStatus === 'TRANSFERABLE' ? 'Transferible' : 'Cedible'}
                     </span>
                  </FMTableCell>
                  <FMTableCell className="text-center font-mono font-black" isNumber>{p.age}</FMTableCell>
                  <FMTableCell className="text-right font-black" isNumber>
                     £{(p.value / 1000000).toFixed(1)}M
                  </FMTableCell>
               </tr>
            ))}
         </FMTable>
         {marketPlayers.length === 0 && (
            <div className="p-20 text-center text-slate-600 italic uppercase font-black tracking-widest text-[10px]">No se encontraron registros activos</div>
         )}
      </FMBox>
    </div>
  );
};