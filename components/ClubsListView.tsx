
import React, { useMemo, useState } from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { FMBox } from './FMUI';
import { ChevronRight, ChevronDown, Globe } from 'lucide-react';

interface ClubsListViewProps {
  onSelectClub: (club: Club) => void;
}

export const ClubsListView: React.FC<ClubsListViewProps> = ({ onSelectClub }) => {
  const [expandedCountries, setExpandedCountries] = useState<Record<string, boolean>>({
     "Argentina": true // Start with Argentina open by default
  });

  const groupedClubs = useMemo(() => {
    const groups: Record<string, Club[]> = {};
    
    world.clubs.forEach(club => {
       const league = world.competitions.find(c => c.id === club.leagueId);
       const country = league ? league.country : "Resto del Mundo";
       
       if (!groups[country]) groups[country] = [];
       groups[country].push(club);
    });
    
    return groups;
  }, []);

  const countries = Object.keys(groupedClubs).sort((a,b) => {
      if (a === "Argentina") return -1;
      if (b === "Argentina") return 1;
      return a.localeCompare(b);
  });

  const toggleCountry = (country: string) => {
    setExpandedCountries(prev => ({
        ...prev,
        [country]: !prev[country]
    }));
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
        <header className="border-b border-[#a0b0a0] pb-3 shrink-0">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Base de Datos de Clubes</h2>
          <p className="text-slate-600 font-bold text-[9px] md:text-[10px] uppercase tracking-widest italic">Explora todos los equipos del mundo.</p>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 pb-4">
            {countries.map(country => {
                const isOpen = expandedCountries[country];
                const clubCount = groupedClubs[country].length;

                return (
                    <div key={country} className="flex flex-col border border-[#a0b0a0] rounded-sm bg-[#e8ece8] shadow-sm overflow-hidden">
                        <button 
                            onClick={() => toggleCountry(country)}
                            className="w-full px-3 py-2 flex justify-between items-center transition-colors hover:bg-[#ccd9cc]"
                            style={{ background: isOpen ? 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' : 'linear-gradient(to bottom, #f0f4f0 0%, #d0d8d0 100%)' }}
                        >
                            <div className="flex items-center gap-2">
                                <Globe size={14} className="text-slate-600" />
                                <span className="text-slate-900 font-bold text-[11px] uppercase tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>
                                    {country}
                                </span>
                                <span className="text-[9px] bg-black/10 px-1.5 rounded-full text-slate-700 font-bold">
                                    {clubCount}
                                </span>
                            </div>
                            {isOpen ? <ChevronDown size={14} className="text-slate-700" /> : <ChevronRight size={14} className="text-slate-700" />}
                        </button>

                        {isOpen && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 p-1 bg-slate-200 animate-in slide-in-from-top-1 duration-200">
                                {groupedClubs[country].sort((a,b) => b.reputation - a.reputation).map(club => (
                                    <button 
                                        key={club.id}
                                        onClick={() => onSelectClub(club)}
                                        className="flex items-center gap-2.5 p-2 bg-white border border-slate-300 rounded-sm hover:bg-blue-50 hover:border-blue-400 transition-all text-left group shadow-sm"
                                    >
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[9px] text-white shadow-sm shrink-0 ${club.primaryColor} ${club.primaryColor === 'bg-white' ? 'text-slate-900 border border-slate-300' : 'border border-transparent'}`}>
                                            {club.shortName.substring(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-900 text-[10px] uppercase truncate group-hover:text-blue-800" style={{ fontFamily: 'Verdana, sans-serif' }}>{club.name}</h4>
                                            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-tight truncate">
                                                {world.competitions.find(c=>c.id===club.leagueId)?.name || 'Liga Internacional'}
                                            </p>
                                        </div>
                                        <ChevronRight size={12} className="text-slate-300 group-hover:text-blue-500 shrink-0" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
  );
};
