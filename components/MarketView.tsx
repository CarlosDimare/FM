
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
    <div className="p-6 h-full flex flex-col gap-6" style={{ backgroundColor: '#dcdcdc' }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: '#333' }}>Mercado de Fichajes</h2>
          <p className="text-sm" style={{ color: '#999' }}>Jugadores transferibles y cedibles en todo el mundo.</p>
        </div>
        
        <div className="flex p-1 rounded-lg shadow-inner" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
           {['ALL', 'TRANSFERABLE', 'LOANABLE'].map(f => (
              <button 
                 key={f}
                 onClick={() => setFilter(f as any)}
                 className="px-4 py-2 text-[10px] font-black rounded-md transition-all uppercase tracking-widest"
                 style={{ 
                   backgroundColor: filter === f ? '#666' : 'transparent',
                   color: filter === f ? '#fff' : '#666' 
                 }}
              >
                 {f === 'ALL' ? 'Todos' : f === 'TRANSFERABLE' ? 'Transferibles' : 'Cedibles'}
              </button>
           ))}
        </div>
      </header>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#999' }} />
         <input 
            type="text" 
            placeholder="Buscar jugador..." 
            className="w-full rounded-xl pl-12 pr-6 py-4 outline-none font-bold"
            style={{ backgroundColor: '#e8e8e8', border: '1px solid #999', color: '#333' }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
         />
      </div>

      <div className="rounded-xl overflow-hidden flex-1 shadow-2xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
         <div className="overflow-y-auto max-h-full">
            <table className="w-full text-left">
               <thead className="sticky top-0 z-10 font-black uppercase text-[10px]" style={{ backgroundColor: '#e8e8e8', borderBottom: '1px solid #999', color: '#666' }}>
                  <tr className="tracking-[0.2em]">
                     <th className="p-4">Jugador</th>
                     <th className="p-4">Club</th>
                     <th className="p-4">Estado</th>
                     <th className="p-4 text-center">Edad</th>
                     <th className="p-4 text-right">Valor</th>
                  </tr>
               </thead>
               <tbody className="divide-y" style={{ borderColor: '#ccc' }}>
                  {marketPlayers.map(p => (
                     <tr 
                        key={p.id} 
                        onClick={() => onSelectPlayer(p)}
                        className="cursor-pointer transition-colors group"
                        style={{ backgroundColor: 'transparent' }}
                     >
                        <td className="p-4">
                           <p className="font-bold group-hover:text-600" style={{ color: '#333' }}>{p.name}</p>
                           <p className="text-[10px] uppercase" style={{ color: '#999' }}>{p.positions[0]}</p>
                        </td>
                        <td className="p-4 text-sm" style={{ color: '#999' }}>
                           {world.getClub(p.clubId)?.name}
                        </td>
                        <td className="p-4">
                           <span className="px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999', color: '#666' }}>
                              {p.transferStatus === 'TRANSFERABLE' ? 'Transferible' : 'Cedible'}
                           </span>
                        </td>
                        <td className="p-4 text-center font-mono" style={{ color: '#999' }}>{p.age}</td>
                        <td className="p-4 text-right font-black" style={{ color: '#333' }}>
                           £{(p.value / 1000000).toFixed(1)}M
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {marketPlayers.length === 0 && (
               <div className="p-20 text-center italic" style={{ color: '#999' }}>No se han encontrado jugadores con estos criterios.</div>
            )}
         </div>
      </div>
    </div>
  );
};
