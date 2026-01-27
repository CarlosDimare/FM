
import React, { useState, useMemo } from 'react';
import { Player, Position } from '../types';
import { world } from '../services/worldManager';
import { Search, SlidersHorizontal, User } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';

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
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
      <header className="shrink-0">
         <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Buscador de Jugadores</h2>
         <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest">Base de datos global de jugadores.</p>
      </header>

      <FMBox title="Filtros de Búsqueda" className="shrink-0 shadow-sm">
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-1">
            <div className="col-span-1 lg:col-span-2">
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Nombre del Jugador</label>
               <input 
                  type="text" 
                  className="w-full bg-white border border-[#a0b0a0] rounded-sm px-3 py-1.5 text-[11px] font-bold text-slate-900 outline-none focus:border-[#3a4a3a]" 
                  placeholder="Introduce al menos 3 letras..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
               />
            </div>
            <div>
               <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Posición</label>
               <select 
                  className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none cursor-pointer"
                  value={posFilter}
                  onChange={(e) => setPosFilter(e.target.value)}
               >
                  <option value="ALL">Cualquiera</option>
                  <option value="GK">Portero</option>
                  <option value="DC">Defensa Central</option>
                  <option value="MC">Centrocampista</option>
                  <option value="AM">Mediapunta</option>
                  <option value="ST">Delantero</option>
               </select>
            </div>
            <div className="flex gap-2">
               <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Edad Min</label>
                  <input type="number" value={minAge} onChange={(e) => setMinAge(Number(e.target.value))} className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none" />
               </div>
               <div className="flex-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Edad Max</label>
                  <input type="number" value={maxAge} onChange={(e) => setMaxAge(Number(e.target.value))} className="w-full bg-white border border-[#a0b0a0] rounded-sm px-2 py-1.5 text-[11px] font-bold text-slate-900 outline-none" />
               </div>
            </div>
         </div>
      </FMBox>

      <FMBox title={`Resultados de Búsqueda (${results.length})`} className="flex-1" noPadding>
         <FMTable headers={['Jugador', 'Club', 'Edad', 'Valor']} colWidths={['auto', 'auto', '40px', '80px']}>
            {results.map((p, idx) => (
                <tr 
                  key={p.id} 
                  onClick={() => onSelectPlayer(p)} 
                  className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'} hover:bg-[#ccd9cc]`}
                >
                  <FMTableCell>
                     <div className="flex flex-col">
                        <span className="font-bold text-slate-900 text-[11px]">{p.name}</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">{p.positions[0]}</span>
                     </div>
                  </FMTableCell>
                  <FMTableCell className="text-slate-700 text-[10px] italic truncate max-w-[120px]">
                     {world.getClub(p.clubId)?.name || 'Agente Libre'}
                  </FMTableCell>
                  <FMTableCell className="text-center font-bold" isNumber>{p.age}</FMTableCell>
                  <FMTableCell className="text-right font-bold text-slate-900" isNumber>
                     £{(p.value / 1000000).toFixed(1)}M
                  </FMTableCell>
                </tr>
            ))}
         </FMTable>
         {results.length === 0 && (
            <div className="p-20 text-center text-slate-400 italic text-[10px] font-bold uppercase tracking-widest">
               {search.length < 3 && posFilter === 'ALL' ? 'Introduce al menos 3 caracteres para buscar.' : 'No se han encontrado resultados.'}
            </div>
         )}
      </FMBox>
    </div>
  );
};
