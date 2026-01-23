import React from 'react';
import { Club } from '../types';
import { Trophy, Star, Building2, Wallet } from 'lucide-react';

interface ClubReportProps {
  club: Club;
}

 const KitVisual: React.FC<{ c1: string, c2: string }> = ({ c1, c2 }) => (
   <div className="relative w-20 h-24 mx-auto">
     <div className={`w-full h-full ${c1} rounded-t-lg relative flex items-center justify-center overflow-hidden`} style={{ border: '2px solid #999' }}>
         <div className={`absolute inset-x-0 top-0 h-4 ${c2} opacity-30`}></div>
         <div className={`absolute inset-y-0 left-0 w-2 ${c2} opacity-30`}></div>
         <div className={`absolute inset-y-0 right-0 w-2 ${c2} opacity-30`}></div>
     </div>
     <div className="flex justify-between -mt-1">
         <div className={`w-8 h-8 ${c1}`} style={{ border: '2px solid #999' }}></div>
         <div className={`w-8 h-8 ${c1}`} style={{ border: '2px solid #999' }}></div>
     </div>
   </div>
 );

export const ClubReport: React.FC<ClubReportProps> = ({ club }) => {
  const renderStars = (reputation: number) => {
    const stars = Math.round(reputation / 2000);
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star key={i} size={14} style={{ color: i < stars ? '#666' : '#ccc', fill: i < stars ? '#666' : 'transparent' }} />
        ))}
      </div>
    );
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto flex flex-col gap-8" style={{ backgroundColor: '#dcdcdc' }}>
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start rounded-2xl shadow-xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
        <div className="w-32 h-32 shadow-xl flex items-center justify-center rounded-2xl relative overflow-hidden shrink-0" style={{ backgroundColor: '#e8e8e8', border: '4px solid #ccc' }}>
          <div className={`absolute inset-0 opacity-40 ${club.primaryColor}`}></div>
          <span className="text-6xl font-black z-10" style={{ color: '#fff', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            {club.shortName.substring(0, 1)}
          </span>
        </div>
        
        <div className="text-center md:text-left flex-1">
          <div className="text-5xl font-black uppercase tracking-tighter italic mb-2" style={{ color: '#333' }}>
            {club.name}
          </div>
          <div className="text-sm font-bold flex flex-wrap justify-center md:justify-start gap-6 mt-1" style={{ color: '#999' }}>
            <span className="flex items-center gap-2"><Building2 size={16} /> Estadio: {club.stadium}</span>
            <span className="flex items-center gap-2">Reputación: {renderStars(club.reputation)}</span>
          </div>
          
          <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
            <div className="p-4 rounded-xl min-w-[140px] text-center shadow-inner" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
              <div className="text-[10px] uppercase tracking-widest font-black mb-1 flex items-center justify-center gap-2" style={{ color: '#999' }}>
                <Wallet size={12} /> Economía
              </div>
              <div className="font-black text-xl" style={{ color: '#666' }}>
                £{club.finances.balance.toLocaleString()}
              </div>
            </div>
            <div className="p-4 rounded-xl min-w-[140px] text-center shadow-inner" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
              <div className="text-[10px] uppercase tracking-widest font-black mb-1" style={{ color: '#999' }}>Manager</div>
              <div className="font-bold" style={{ color: '#666' }}>Tú</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Palmarés */}
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
          <div className="px-6 py-4 border-b flex items-center gap-3" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
            <Trophy size={18} style={{ color: '#999' }} />
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: '#333' }}>Palmarés</h3>
          </div>
          <div className="p-6 space-y-4">
            {club.honours.length > 0 ? (
              club.honours.map((h, i) => (
                <div key={i} className="flex justify-between items-center pb-3 last:pb-0" style={{ borderBottom: '1px solid #ccc' }}>
                  <span className="font-bold flex items-center gap-2" style={{ color: '#666' }}>🏆 {h.name}</span>
                  <span className="font-mono text-sm" style={{ color: '#999' }}>{h.year}</span>
                </div>
              ))
            ) : (
              <div className="italic text-center py-4" style={{ color: '#999' }}>Sin títulos recientes en las vitrinas.</div>
            )}
          </div>
        </div>

        {/* Camisetas */}
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
          <div className="px-6 py-4 border-b" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
            <h3 className="text-sm font-black uppercase tracking-widest" style={{ color: '#333' }}>Equipación</h3>
          </div>
          <div className="p-8 flex justify-around">
            <div className="text-center group">
              <KitVisual c1={club.primaryColor} c2={club.secondaryColor} />
              <div className="mt-4 text-xs font-black uppercase tracking-widest transition-colors" style={{ color: '#999' }}>Titular</div>
            </div>
            <div className="text-center group">
              <KitVisual c1={club.secondaryColor} c2={club.primaryColor} />
              <div className="mt-4 text-xs font-black uppercase tracking-widest transition-colors" style={{ color: '#999' }}>Visitante</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};