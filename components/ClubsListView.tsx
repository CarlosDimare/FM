
import React, { useMemo } from 'react';
import { Club } from '../types';
import { world } from '../services/worldManager';
import { FMBox } from './FMUI';
import { ChevronRight } from 'lucide-react';

interface ClubsListViewProps {
  onSelectClub: (club: Club) => void;
}

export const ClubsListView: React.FC<ClubsListViewProps> = ({ onSelectClub }) => {
  const groupedClubs = useMemo(() => {
    const groups: Record<string, Club[]> = {};
    
    world.clubs.forEach(club => {
       const league = world.competitions.find(c => c.id === club.leagueId);
       const country = league ? league.country : "Otro";
       
       if (!groups[country]) groups[country] = [];
       groups[country].push(club);
    });
    
    return groups;
  }, []);

  const countries = Object.keys(groupedClubs).sort();

  return (
    <div className="p-4 h-full flex flex-col gap-4 bg-slate-400 overflow-hidden">
        <header className="border-b-2 border-slate-600 pb-4">
          <h2 className="text-3xl font-black text-slate-950 uppercase italic tracking-tighter">Base de Datos de Clubes</h2>
          <p className="text-slate-800 font-black text-xs uppercase tracking-widest italic">Explora todos los equipos del mundo.</p>
        </header>

        <div className="flex-1 overflow-y-auto custom-scroll space-y-6 pr-2">
            {countries.map(country => (
                <FMBox key={country} title={country} noPadding>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1 p-2 bg-slate-200">
                        {groupedClubs[country].sort((a,b) => b.reputation - a.reputation).map(club => (
                            <button 
                                key={club.id}
                                onClick={() => onSelectClub(club)}
                                className="flex items-center gap-3 p-3 bg-white border border-slate-300 rounded-sm hover:bg-blue-50 hover:border-blue-400 transition-all text-left group shadow-sm"
                            >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] text-white shadow-sm ${club.primaryColor} ${club.primaryColor === 'bg-white' ? 'text-slate-900 border border-slate-400' : 'border border-transparent'}`}>
                                    {club.shortName.substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-900 text-xs uppercase truncate group-hover:text-blue-800">{club.name}</h4>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">{world.competitions.find(c=>c.id===club.leagueId)?.name || 'Liga Extranjera'}</p>
                                </div>
                                <ChevronRight size={14} className="text-slate-400 group-hover:text-blue-500" />
                            </button>
                        ))}
                    </div>
                </FMBox>
            ))}
        </div>
    </div>
  );
};
