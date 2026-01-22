
import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { Search, Filter, DollarSign, Clock, ArrowRightLeft } from 'lucide-react';

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
    <div className="p-6 h-full flex flex-col gap-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Mercado de Fichajes</h2>
          <p className="text-slate-400 text-sm">Jugadores transferibles y cedibles en todo el mundo.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-inner">
           {['ALL', 'TRANSFERABLE', 'LOANABLE'].map(f => (
              <button 
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className={`px-4 py-2 text-[10px] font-black rounded-md transition-all uppercase tracking-widest ${filter === f ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
              >
                 {f === 'ALL' ? 'Todos' : f === 'TRANSFERABLE' ? 'Transferibles' : 'Cedibles'}
              </button>
           ))}
        </div>
      </header>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
         <input 
            type="text" 
            placeholder="Buscar jugador..." 
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 shadow-2xl">
         <div className="overflow-y-auto max-h-full">
            <table className="w-full text-left">
               <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-700">
                  <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                     <th className="p-4">Jugador</th>
                     <th className="p-4">Club</th>
                     <th className="p-4">Estado</th>
                     <th className="p-4 text-center">Edad</th>
                     <th className="p-4 text-right">Valor</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-700/50">
                  {marketPlayers.map(p => (
                     <tr 
                        key={p.id} 
                        onClick={() => onSelectPlayer(p)}
                        className="hover:bg-slate-700/30 cursor-pointer transition-colors group"
                     >
                        <td className="p-4">
                           <p className="font-bold text-white group-hover:text-blue-400">{p.name}</p>
                           <p className="text-[10px] text-slate-500 uppercase">{p.positions[0]}</p>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">
                           {world.getClub(p.clubId)?.name}
                        </td>
                        <td className="p-4">
                           <span className={`px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest ${p.transferStatus === 'TRANSFERABLE' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                              {p.transferStatus === 'TRANSFERABLE' ? 'Transferible' : 'Cedible'}
                           </span>
                        </td>
                        <td className="p-4 text-center text-slate-500 font-mono">{p.age}</td>
                        <td className="p-4 text-right text-white font-black">
                           £{(p.value / 1000000).toFixed(1)}M
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {marketPlayers.length === 0 && (
               <div className="p-20 text-center text-slate-600 italic">No se han encontrado jugadores con estos criterios.</div>
            )}
         </div>
      </div>
    </div>
  );
};
