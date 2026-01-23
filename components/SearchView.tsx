
import React, { useState, useMemo } from 'react';
// Fix: Import world from services/worldManager instead of types
import { Player, Position } from '../types';
import { world } from '../services/worldManager';
import { Search, SlidersHorizontal, User } from 'lucide-react';

interface SearchViewProps {
  onSelectPlayer: (player: Player) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({ onSelectPlayer }) => {
  const [search, setSearch] = useState('');
  const [posFilter, setPosFilter] = useState<string>('ALL');
  const [minAge, setMinAge] = useState<number>(15);
  const [maxAge, setMaxAge] = useState<number>(45);

  const results = useMemo(() => {
    if (search.length < 3 && posFilter === 'ALL') return [];
    return world.players.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesPos = posFilter === 'ALL' || p.positions.some(pos => pos.includes(posFilter));
      const matchesAge = p.age >= minAge && p.age <= maxAge;
      return matchesSearch && matchesPos && matchesAge;
    }).sort((a,b) => b.currentAbility - a.currentAbility).slice(0, 50);
  }, [search, posFilter, minAge, maxAge]);

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header>
         <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Buscador de Jugadores</h2>
         <p className="text-slate-400 text-sm">Base de datos global de jugadores.</p>
      </header>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-6">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-1 lg:col-span-2">
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Nombre</label>
               <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500" 
                  placeholder="Min. 3 letras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Posición</label>
               <select 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none focus:border-blue-500"
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
               >
                  <option value="ALL">Cualquiera</option>
                  <option value="POR">Portero</option>
                  <option value="DF">Defensa</option>
                  <option value="MC">Centrocampista</option>
                  <option value="MP">Mediapunta</option>
                  <option value="DL">Delantero</option>
               </select>
            </div>
            <div className="flex gap-2">
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Edad Min</label>
                  <input type="number" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" />
               </div>
               <div className="flex-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Edad Max</label>
                  <input type="number" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white outline-none" />
               </div>
            </div>
         </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden flex-1 shadow-2xl">
         <div className="overflow-y-auto max-h-full">
            <table className="w-full text-left">
               <thead className="sticky top-0 bg-slate-900 z-10 border-b border-slate-700">
                  <tr className="text-slate-400 text-[10px] uppercase tracking-[0.2em] font-black">
                     <th className="p-4">Jugador</th>
                     <th className="p-4">Club</th>
                     <th className="p-4 text-center">Edad</th>
                     <th className="p-4 text-right">Calidad</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-slate-700/50">
                  {results.map(p => (
                     <tr key={p.id} onClick={() => onSelectPlayer(p)} className="hover:bg-slate-700/30 cursor-pointer transition-colors group">
                        <td className="p-4">
                           <p className="font-bold text-white group-hover:text-blue-400">{p.name}</p>
                           <p className="text-[10px] text-slate-500 uppercase">{p.positions[0]}</p>
                        </td>
                        <td className="p-4 text-slate-400 text-sm">{world.getClub(p.clubId)?.name}</td>
                        <td className="p-4 text-center text-slate-500 font-mono">{p.age}</td>
                        <td className="p-4 text-right">
                           <div className="flex justify-end gap-1">
                              {[...Array(5)].map((_, i) => (
                                 <div key={i} className={`w-1.5 h-4 rounded-full ${i < Math.round(p.currentAbility/40) ? 'bg-blue-500' : 'bg-slate-700'}`}></div>
                              ))}
                           </div>
                        </td>
                     </tr>
                  ))}
               </tbody>
            </table>
            {results.length === 0 && (
               <div className="p-20 text-center text-slate-600 italic">
                  {search.length < 3 && posFilter === 'ALL' ? 'Introduce al menos 3 caracteres para buscar.' : 'No se han encontrado resultados.'}
               </div>
            )}
         </div>
      </div>
    </div>
  );
};
