
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
    <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-4 backdrop-blur-xl">
      {userWonLeague && <ConfettiOverlay />}
      
      <div className="bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        <header className="p-6 bg-slate-900 border-b border-slate-700 flex justify-between items-center relative overflow-hidden">
          {userWonLeague && (
             <div className="absolute inset-0 bg-blue-600/10 animate-pulse pointer-events-none"></div>
          )}
          <div className="relative z-10">
             <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Resumen de la Temporada</h2>
             <p className="text-blue-400 font-bold tracking-widest text-xs uppercase">Salón de la Fama 2008/09</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white z-10 transition-colors">
            <X size={32} />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
           {/* Sidebar Competition Selector */}
           <div className="w-72 bg-slate-900 border-r border-slate-700 overflow-y-auto shrink-0">
              <div className="p-3 bg-slate-950/50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                 Torneos Finalizados
              </div>
              {summary.map((s, idx) => (
                 <button 
                    key={s.compId}
                    onClick={() => setActiveIdx(idx)}
                    className={`w-full text-left p-4 border-b border-slate-800 transition-all flex items-center justify-between group ${activeIdx === idx ? 'bg-blue-600 text-white font-black' : 'text-slate-500 hover:bg-slate-800'}`}
                 >
                    <div className="flex items-center gap-3">
                       <Trophy size={14} className={activeIdx === idx ? 'text-white' : 'text-slate-600 group-hover:text-blue-400'} />
                       <span className="truncate max-w-[160px]">{s.compName}</span>
                    </div>
                    {s.compType === 'LEAGUE' ? 
                       <span className="text-[8px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">LIGA</span> : 
                       <span className="text-[8px] bg-yellow-900/30 text-yellow-500 px-1.5 py-0.5 rounded">COPA</span>
                    }
                 </button>
              ))}
           </div>

           {/* Main Content */}
           <div className="flex-1 overflow-y-auto p-8 bg-slate-800/50">
              {activeComp ? (
                 <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                    {/* Champion Section */}
                    <div className="text-center">
                       <div className="inline-block p-6 bg-yellow-500/10 rounded-full mb-6 border border-yellow-500/20 shadow-2xl relative">
                          <Trophy size={80} className="text-yellow-500" />
                          <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg">WINNER</div>
                       </div>
                       <h3 className="text-slate-400 uppercase font-black tracking-[0.3em] text-xs mb-2">
                          {activeComp.compType === 'LEAGUE' ? 'CAMPEÓN DE LIGA' : 'GANADOR DEL TORNEO'}
                       </h3>
                       <h4 className="text-5xl font-black text-white uppercase tracking-tighter italic drop-shadow-2xl">
                          {activeComp.championName}
                       </h4>
                    </div>

                    {/* Awards Grid - Only show if values exist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       {activeComp.topScorer.value > 0 && (
                          <AwardCard icon={<Goal className="text-green-400"/>} title="Pichichi" player={activeComp.topScorer.name} club={activeComp.topScorer.club} value={`${activeComp.topScorer.value} Goles`} />
                       )}
                       {activeComp.topAssists.value > 0 && (
                          <AwardCard icon={<Zap className="text-blue-400"/>} title="Máximo Asistente" player={activeComp.topAssists.name} club={activeComp.topAssists.club} value={`${activeComp.topAssists.value} Asist.`} />
                       )}
                       {activeComp.bestDF.name !== 'N/A' && (
                          <AwardCard icon={<ShieldCheck className="text-yellow-400"/>} title="Mejor Defensor" player={activeComp.bestDF.name} club={activeComp.bestDF.club} value={activeComp.bestDF.value} />
                       )}
                       {activeComp.bestGK.name !== 'N/A' && (
                          <AwardCard icon={<UserCheck className="text-purple-400"/>} title="Mejor Portero" player={activeComp.bestGK.name} club={activeComp.bestGK.club} value={activeComp.bestGK.value} />
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                    <Info size={64} className="opacity-20" />
                    <p className="font-black uppercase tracking-widest text-xl">Sin Datos Disponibles</p>
                 </div>
              )}
           </div>
        </div>

        <footer className="p-6 bg-slate-900 border-t border-slate-700 flex justify-center">
           <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white font-black px-12 py-3 rounded-full shadow-2xl transition-all uppercase tracking-widest text-sm active:scale-95"
           >
              Aceptar y Continuar
           </button>
        </footer>
      </div>
    </div>
  );
};

const AwardCard = ({ icon, title, player, club, value }: { icon: React.ReactNode, title: string, player: string, club: string, value: string }) => (
   <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 hover:border-slate-500 transition-all group">
      <div className="flex items-center gap-4 mb-4">
         <div className="p-2 bg-slate-800 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
         <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">{title}</span>
      </div>
      <h5 className="text-xl font-bold text-white mb-1 truncate">{player}</h5>
      <div className="flex justify-between items-end">
         <p className="text-slate-400 text-xs font-bold truncate max-w-[120px]">{club}</p>
         <span className="text-blue-400 font-black text-lg">{value}</span>
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
