
import React, { useEffect, useState } from 'react';
import { X, Trophy, Goal, Zap, Star, ShieldCheck, UserCheck, Calendar, Info } from 'lucide-react';
import { CompetitionType } from '../types';
import { FMButton } from './FMUI';

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
    <div className="fixed inset-0 bg-slate-900/80 z-[300] flex items-center justify-center p-4 backdrop-blur-md">
      {userWonLeague && <ConfettiOverlay />}
      
      <div className="bg-slate-200 w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden">
        <header className="p-4 bg-slate-300 border-b border-slate-500 flex justify-between items-center relative shrink-0">
          <div className="relative z-10">
             <h2 className="text-xl md:text-2xl font-black text-slate-950 italic tracking-tighter uppercase">Resumen de la Temporada</h2>
             <p className="text-slate-600 font-bold tracking-widest text-[10px] uppercase">Salón de la Fama 2008/09</p>
          </div>
          <button onClick={onClose} className="text-slate-600 hover:text-slate-950 z-10 transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
           {/* Sidebar Competition Selector */}
           <div className="w-full md:w-64 bg-slate-300 md:border-r border-b md:border-b-0 border-slate-500 overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col custom-scroll">
              <div className="hidden md:block p-3 bg-slate-400/20 text-[10px] font-black text-slate-600 uppercase tracking-widest border-b border-slate-500">
                 Torneos Finalizados
              </div>
              {summary.map((s, idx) => (
                 <button 
                    key={s.compId}
                    onClick={() => setActiveIdx(idx)}
                    className={`flex-1 md:flex-none text-left p-3 md:p-4 border-r md:border-r-0 md:border-b border-slate-400/50 transition-all flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between gap-2 group min-w-[100px] md:min-w-0 ${activeIdx === idx ? 'bg-slate-100 text-slate-950 font-black shadow-inner' : 'text-slate-600 hover:bg-slate-300/50 hover:text-slate-900'}`}
                 >
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                       <Trophy size={14} className={activeIdx === idx ? 'text-slate-950' : 'text-slate-500 group-hover:text-slate-800'} />
                       <span className="truncate max-w-[100px] md:max-w-[140px] text-[10px] md:text-xs uppercase">{s.compName}</span>
                    </div>
                    {s.compType === 'LEAGUE' ? 
                       <span className={`text-[8px] px-1.5 py-0.5 rounded hidden md:inline-block ${activeIdx === idx ? 'bg-slate-800 text-white' : 'bg-slate-400/30 text-slate-600'}`}>LIGA</span> : 
                       <span className={`text-[8px] px-1.5 py-0.5 rounded hidden md:inline-block ${activeIdx === idx ? 'bg-yellow-500 text-white' : 'bg-yellow-500/20 text-yellow-700'}`}>COPA</span>
                    }
                 </button>
              ))}
           </div>

           {/* Main Content */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-100 custom-scroll">
              {activeComp ? (
                 <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                    {/* Champion Section */}
                    <div className="text-center py-2 md:py-6">
                       <div className="inline-block p-4 md:p-6 bg-slate-200 rounded-full mb-4 border-4 border-slate-300 shadow-xl relative">
                          <Trophy size={48} className="text-yellow-500 drop-shadow-sm md:w-16 md:h-16" />
                          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg border border-white">WINNER</div>
                       </div>
                       <h3 className="text-slate-500 uppercase font-black tracking-[0.3em] text-[10px] mb-2">
                          {activeComp.compType === 'LEAGUE' ? 'CAMPEÓN DE LIGA' : 'GANADOR DEL TORNEO'}
                       </h3>
                       <h4 className="text-3xl md:text-5xl font-black text-slate-950 uppercase tracking-tighter italic drop-shadow-sm">
                          {activeComp.championName}
                       </h4>
                    </div>

                    {/* Awards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {activeComp.topScorer.value > 0 && (
                          <AwardCard icon={<Goal className="text-green-600"/>} title="Pichichi" player={activeComp.topScorer.name} club={activeComp.topScorer.club} value={`${activeComp.topScorer.value} Goles`} />
                       )}
                       {activeComp.topAssists.value > 0 && (
                          <AwardCard icon={<Zap className="text-blue-600"/>} title="Asistencias" player={activeComp.topAssists.name} club={activeComp.topAssists.club} value={`${activeComp.topAssists.value} Asist.`} />
                       )}
                       {activeComp.bestDF.name !== 'N/A' && (
                          <AwardCard icon={<ShieldCheck className="text-orange-600"/>} title="Mejor Defensor" player={activeComp.bestDF.name} club={activeComp.bestDF.club} value={activeComp.bestDF.value} />
                       )}
                       {activeComp.bestGK.name !== 'N/A' && (
                          <AwardCard icon={<UserCheck className="text-purple-600"/>} title="Mejor Portero" player={activeComp.bestGK.name} club={activeComp.bestGK.club} value={activeComp.bestGK.value} />
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                    <Info size={48} className="opacity-50" />
                    <p className="font-black uppercase tracking-widest text-sm">Sin Datos Disponibles</p>
                 </div>
              )}
           </div>
        </div>

        <footer className="p-4 bg-slate-300 border-t border-slate-500 flex justify-center shrink-0">
           <FMButton variant="primary" onClick={onClose} className="px-12 py-3 text-xs w-full md:w-auto shadow-lg">
              ACEPTAR Y CONTINUAR
           </FMButton>
        </footer>
      </div>
    </div>
  );
};

const AwardCard = ({ icon, title, player, club, value }: { icon: React.ReactNode, title: string, player: string, club: string, value: string }) => (
   <div className="bg-white p-4 rounded-sm border border-slate-300 hover:border-slate-500 transition-all group shadow-sm flex items-center gap-4">
      <div className="p-3 bg-slate-100 border border-slate-200 rounded-sm group-hover:scale-105 transition-transform shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
         <div className="flex justify-between items-start mb-1">
            <span className="text-slate-500 font-black uppercase text-[9px] tracking-widest">{title}</span>
            <span className="text-slate-900 font-black text-sm">{value}</span>
         </div>
         <h5 className="text-sm font-black text-slate-950 truncate uppercase italic">{player}</h5>
         <p className="text-slate-500 text-[10px] font-bold truncate uppercase">{club}</p>
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
