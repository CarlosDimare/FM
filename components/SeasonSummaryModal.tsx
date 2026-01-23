
import React, { useEffect, useState } from 'react';
import { X, Trophy, Goal, Zap, Star, ShieldCheck, UserCheck, Calendar, Info } from 'lucide-react';
import { CompetitionType } from '../types';

export interface CompetitionSummary {
   compId: string;
   compName: string;
   compType: CompetitionType;
   championId: string;
   championName: string;
   topScorer: { name: string; club: string; value: number };
   topAssists: { name: string; club: string; value: number };
   bestGK: { name: string; club: string; value: string };
   bestDF: { name: string; club: string; value: string };
}

interface SeasonSummaryModalProps {
  summary: CompetitionSummary[];
  userWonLeague: boolean;
  onClose: () => void;
}

export const SeasonSummaryModal: React.FC<SeasonSummaryModalProps> = ({ summary, userWonLeague, onClose }) => {
  const [activeIdx, setActiveIdx] = useState(0);

  const activeComp = summary[activeIdx];

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-xl" style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}>
      {userWonLeague && <ConfettiOverlay />}
      
      <div className="w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
        <header className="p-6 border-b flex justify-between items-center relative overflow-hidden" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
          {userWonLeague && (
             <div className="absolute inset-0 animate-pulse pointer-events-none" style={{ backgroundColor: 'rgba(102, 102, 102, 0.1)' }}></div>
          )}
          <div className="relative z-10">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase" style={{ color: '#333' }}>Resumen de la Temporada</h2>
             <p className="font-bold tracking-widest text-xs uppercase" style={{ color: '#666' }}>Salón de la Fama 2008/09</p>
          </div>
          <button onClick={onClose} className="z-10 transition-colors" style={{ color: '#999' }}>
            <X size={32} />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar Competition Selector */}
           <div className="w-72 overflow-y-auto shrink-0" style={{ backgroundColor: '#1e293b', borderRight: '1px solid #999' }}>
              <div className="p-3 text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: '#0f172a', borderBottom: '1px solid #999', color: '#999' }}>
                 Torneos Finalizados
              </div>
              {summary.map((s, idx) => (
                 <button 
                    key={s.compId}
                    onClick={() => setActiveIdx(idx)}
                    className="w-full text-left p-4 border-b transition-all flex items-center justify-between group"
                    style={{ 
                      backgroundColor: activeIdx === idx ? '#666' : 'transparent',
                      borderBottom: '1px solid #999',
                      color: activeIdx === idx ? '#fff' : '#999'
                    }}
                 >
                    <div className="flex items-center gap-3">
                       <Trophy size={14} style={{ color: activeIdx === idx ? '#fff' : '#ccc' }} />
                       <span className="truncate max-w-[160px]">{s.compName}</span>
                    </div>
                    {s.compType === 'LEAGUE' ? 
                       <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: '#1e293b', color: '#999' }}>LIGA</span> : 
                       <span className="text-[8px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'rgba(204, 153, 0, 0.3)', color: '#cc9900' }}>COPA</span>
                    }
                 </button>
              ))}
           </div>

           {/* Main Content */}
           <div className="flex-1 overflow-y-auto p-8" style={{ backgroundColor: 'rgba(232, 232, 232, 0.5)' }}>
              {activeComp ? (
                 <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                    {/* Champion Section */}
                    <div className="text-center">
                       <div className="inline-block p-6 rounded-full mb-6 border shadow-2xl relative" style={{ backgroundColor: 'rgba(204, 153, 0, 0.1)', borderColor: 'rgba(204, 153, 0, 0.2)' }}>
                          <Trophy size={80} style={{ color: '#cc9900' }} />
                          <div className="absolute -bottom-2 -right-2 text-[10px] font-black px-2 py-1 rounded-lg shadow-lg" style={{ backgroundColor: '#666', color: '#fff' }}>WINNER</div>
                       </div>
                       <h3 className="uppercase font-black tracking-[0.3em] text-xs mb-2" style={{ color: '#999' }}>
                          {activeComp.compType === 'LEAGUE' ? 'CAMPEÓN DE LIGA' : 'GANADOR DEL TORNEO'}
                       </h3>
                       <h4 className="text-5xl font-black uppercase tracking-tighter italic" style={{ color: '#333' }}>
                          {activeComp.championName}
                       </h4>
                    </div>

                    {/* Awards Grid - Only show if values exist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {activeComp.topScorer.value > 0 && (
                          <AwardCard icon={<Goal style={{ color: '#666' }}/>} title="Pichichi" player={activeComp.topScorer.name} club={activeComp.topScorer.club} value={`${activeComp.topScorer.value} Goles`} />
                       )}
                       {activeComp.topAssists.value > 0 && (
                          <AwardCard icon={<Zap style={{ color: '#666' }}/>} title="Máximo Asistente" player={activeComp.topAssists.name} club={activeComp.topAssists.club} value={`${activeComp.topAssists.value} Asist.`} />
                       )}
                       {activeComp.bestDF.name !== 'N/A' && (
                          <AwardCard icon={<ShieldCheck style={{ color: '#cc9900' }}/>} title="Mejor Defensor" player={activeComp.bestDF.name} club={activeComp.bestDF.club} value={activeComp.bestDF.value} />
                       )}
                       {activeComp.bestGK.name !== 'N/A' && (
                          <AwardCard icon={<UserCheck style={{ color: '#999' }}/>} title="Mejor Portero" player={activeComp.bestGK.name} club={activeComp.bestGK.club} value={activeComp.bestGK.value} />
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center gap-4" style={{ color: '#999' }}>
                    <Info size={64} style={{ opacity: 0.2 }} />
                    <p className="font-black uppercase tracking-widest text-xl">Sin Datos Disponibles</p>
                 </div>
              )}
           </div>
        </div>

        <footer className="p-6 border-t flex justify-center" style={{ backgroundColor: '#1e293b', borderColor: '#999' }}>
           <button 
              onClick={onClose}
              className="font-black px-12 py-3 rounded-full shadow-2xl transition-all uppercase tracking-widest text-sm active:scale-95"
              style={{ backgroundColor: '#666', color: '#fff' }}
           >
              Aceptar y Continuar
           </button>
        </footer>
      </div>
    </div>
  );
};

const AwardCard = ({ icon, title, player, club, value }: { icon: React.ReactNode, title: string, player: string, club: string, value: string }) => (
   <div className="p-6 rounded-xl transition-all group" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
      <div className="flex items-center gap-4 mb-4">
         <div className="p-2 rounded-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: '#1e293b' }}>{icon}</div>
         <span className="font-black uppercase text-[10px] tracking-widest" style={{ color: '#999' }}>{title}</span>
      </div>
      <h5 className="text-xl font-bold mb-1 truncate" style={{ color: '#333' }}>{player}</h5>
      <div className="flex justify-between items-end">
         <p className="text-xs font-bold truncate max-w-[120px]" style={{ color: '#999' }}>{club}</p>
         <span className="font-black text-lg" style={{ color: '#666' }}>{value}</span>
      </div>
   </div>
);

const ConfettiOverlay = () => {
   return (
      <div className="fixed inset-0 pointer-events-none z-[400] overflow-hidden">
         {[...Array(60)].map((_, i) => (
            <div 
               key={i} 
               className="confetti-piece"
               style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#3b82f6', '#fbbf24', '#ef4444', '#10b981', '#ffffff', '#a855f7'][Math.floor(Math.random() * 6)],
                  animationDelay: `${Math.random() * 4}s`,
                  animationDuration: `${2 + Math.random() * 3}s`
               }}
            ></div>
         ))}
         <style>{`
            .confetti-piece {
               position: absolute;
               width: 10px;
               height: 18px;
               top: -20px;
               opacity: 0.8;
               animation: fall linear infinite;
               transform-origin: center;
            }
            @keyframes fall {
               0% { transform: translateY(0) rotate(0deg) skewX(0deg); }
               25% { transform: translateY(25vh) rotate(180deg) skewX(10deg); }
               50% { transform: translateY(50vh) rotate(360deg) skewX(-10deg); }
               75% { transform: translateY(75vh) rotate(540deg) skewX(5deg); }
               100% { transform: translateY(110vh) rotate(720deg) skewX(0deg); }
            }
         `}</style>
      </div>
   );
}
