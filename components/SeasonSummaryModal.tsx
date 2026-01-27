
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
      
      <div className="bg-[#d4dcd4] w-full max-w-5xl h-full md:h-auto md:max-h-[90vh] rounded-sm shadow-2xl border border-[#a0b0a0] flex flex-col overflow-hidden">
        <header className="p-3 border-b border-[#a0b0a0] flex justify-between items-center relative shrink-0"
                style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
          <div className="relative z-10">
             <h2 className="text-xl md:text-2xl font-black text-[#1a1a1a] italic tracking-tighter uppercase leading-none" style={{ fontFamily: 'Verdana, sans-serif' }}>Resumen de la Temporada</h2>
             <p className="text-slate-700 font-bold tracking-widest text-[9px] uppercase mt-1" style={{ fontFamily: 'Verdana, sans-serif' }}>Salón de la Fama 2008/09</p>
          </div>
          <button onClick={onClose} className="text-slate-700 hover:text-slate-950 z-10 transition-colors">
            <X size={24} />
          </button>
        </header>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
           {/* Sidebar Competition Selector */}
           <div className="w-full md:w-64 bg-[#bcc8bc] md:border-r border-b md:border-b-0 border-[#a0b0a0] overflow-x-auto md:overflow-y-auto shrink-0 flex md:flex-col custom-scroll">
              <div className="hidden md:block p-3 bg-black/10 text-[10px] font-black text-slate-700 uppercase tracking-widest border-b border-[#a0b0a0]" style={{ fontFamily: 'Verdana, sans-serif' }}>
                 Torneos Finalizados
              </div>
              {summary.map((s, idx) => (
                 <button 
                    key={s.compId}
                    onClick={() => setActiveIdx(idx)}
                    className={`flex-1 md:flex-none text-left p-3 md:p-4 border-r md:border-r-0 md:border-b border-[#a0b0a0]/50 transition-all flex flex-col md:flex-row items-center md:items-center justify-center md:justify-between gap-2 group min-w-[100px] md:min-w-0 ${activeIdx === idx ? 'bg-[#e8ece8] text-slate-950 font-black shadow-inner' : 'text-slate-700 hover:bg-[#ccd9cc] hover:text-slate-900'}`}
                 >
                    <div className="flex flex-col md:flex-row items-center gap-2 md:gap-3 text-center md:text-left">
                       <Trophy size={14} className={activeIdx === idx ? 'text-slate-950' : 'text-slate-600 group-hover:text-slate-800'} />
                       <span className="truncate max-w-[100px] md:max-w-[140px] text-[10px] md:text-[11px] font-bold uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>{s.compName}</span>
                    </div>
                    {s.compType === 'LEAGUE' ? 
                       <span className={`text-[8px] px-1.5 py-0.5 rounded hidden md:inline-block font-black ${activeIdx === idx ? 'bg-[#3a4a3a] text-white' : 'bg-black/10 text-slate-600'}`}>LIGA</span> : 
                       <span className={`text-[8px] px-1.5 py-0.5 rounded hidden md:inline-block font-black ${activeIdx === idx ? 'bg-amber-600 text-white' : 'bg-amber-600/20 text-amber-700'}`}>COPA</span>
                    }
                 </button>
              ))}
           </div>

           {/* Main Content */}
           <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#e8ece8] custom-scroll">
              {activeComp ? (
                 <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                    {/* Champion Section */}
                    <div className="text-center py-2 md:py-6 bg-white/40 border border-[#a0b0a0] rounded-sm p-6 shadow-sm">
                       <div className="inline-block p-4 md:p-6 bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border border-[#a0b0a0] rounded-full mb-4 shadow-xl relative">
                          <Trophy size={48} className="text-yellow-600 drop-shadow-sm md:w-16 md:h-16" />
                          <div className="absolute -bottom-2 -right-2 bg-[#3a4a3a] text-white text-[9px] font-black px-2 py-1 rounded shadow-lg border border-white/20">WINNER</div>
                       </div>
                       <h3 className="text-slate-600 uppercase font-black tracking-[0.2em] text-[10px] mb-2" style={{ fontFamily: 'Verdana, sans-serif' }}>
                          {activeComp.compType === 'LEAGUE' ? 'CAMPEÓN DE LIGA' : 'GANADOR DEL TORNEO'}
                       </h3>
                       <h4 className="text-3xl md:text-5xl font-black text-[#1a1a1a] uppercase tracking-tighter italic drop-shadow-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>
                          {activeComp.championName}
                       </h4>
                    </div>

                    {/* Awards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       {activeComp.topScorer.value > 0 && (
                          <AwardCard icon={<Goal className="text-green-700"/>} title="Goleador" player={activeComp.topScorer.name} club={activeComp.topScorer.club} value={`${activeComp.topScorer.value} Goles`} />
                       )}
                       {activeComp.topAssists.value > 0 && (
                          <AwardCard icon={<Zap className="text-blue-700"/>} title="Asistencias" player={activeComp.topAssists.name} club={activeComp.topAssists.club} value={`${activeComp.topAssists.value} Asist.`} />
                       )}
                       {activeComp.bestDF.name !== 'N/A' && (
                          <AwardCard icon={<ShieldCheck className="text-orange-700"/>} title="Mejor Defensor" player={activeComp.bestDF.name} club={activeComp.bestDF.club} value={activeComp.bestDF.value} />
                       )}
                       {activeComp.bestGK.name !== 'N/A' && (
                          <AwardCard icon={<UserCheck className="text-purple-700"/>} title="Mejor Portero" player={activeComp.bestGK.name} club={activeComp.bestGK.club} value={activeComp.bestGK.value} />
                       )}
                    </div>
                 </div>
              ) : (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-4">
                    <Info size={48} className="opacity-50" />
                    <p className="font-black uppercase tracking-widest text-sm">Sin Datos Disponibles</p>
                 </div>
              )}
           </div>
        </div>

        <footer className="p-4 bg-[#bcc8bc] border-t border-[#a0b0a0] flex justify-center shrink-0 shadow-inner">
           <FMButton variant="primary" onClick={onClose} className="px-12 py-3 text-xs w-full md:w-auto shadow-lg uppercase tracking-widest">
              ACEPTAR Y CONTINUAR
           </FMButton>
        </footer>
      </div>
    </div>
  );
};

const AwardCard = ({ icon, title, player, club, value }: { icon: React.ReactNode, title: string, player: string, club: string, value: string }) => (
   <div className="bg-white p-4 rounded-sm border border-[#a0b0a0] hover:border-[#3a4a3a] transition-all group shadow-sm flex items-center gap-4">
      <div className="p-3 bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] border border-[#a0b0a0] rounded-sm group-hover:scale-105 transition-transform shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
         <div className="flex justify-between items-start mb-1">
            <span className="text-slate-500 font-black uppercase text-[9px] tracking-widest" style={{ fontFamily: 'Verdana, sans-serif' }}>{title}</span>
            <span className="text-[#1a1a1a] font-black text-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>{value}</span>
         </div>
         <h5 className="text-sm font-black text-[#1a1a1a] truncate uppercase italic" style={{ fontFamily: 'Verdana, sans-serif' }}>{player}</h5>
         <p className="text-slate-500 text-[10px] font-bold truncate uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>{club}</p>
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
