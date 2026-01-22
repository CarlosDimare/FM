
import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { X, DollarSign, Calendar, ChevronRight, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';

interface ContractNegotiationModalProps {
  player: Player;
  userClubId: string;
  currentDate: Date;
  onClose: () => void;
  onRenewed: () => void;
}

export const ContractNegotiationModal: React.FC<ContractNegotiationModalProps> = ({ player, userClubId, currentDate, onClose, onRenewed }) => {
  const userClub = world.getClub(userClubId);
  const requestedSalary = useMemo(() => player.requestedSalary || world.getRequestedSalary(player, userClub!), [player.id]);
  
  const [proposedSalary, setProposedSalary] = useState(requestedSalary);
  const [years, setYears] = useState(3);
  const [feedback, setFeedback] = useState<{ text: string, type: 'SUCCESS' | 'ERROR' | 'NEUTRAL' } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = () => {
    if (!userClub) return;
    
    // Check if club can afford wage budget
    const currentSalaries = world.getPlayersByClub(userClubId).reduce((s, p) => s + p.salary, 0);
    const potentialSalaries = currentSalaries - player.salary + proposedSalary;
    
    if (potentialSalaries > userClub.finances.wageBudget) {
       setFeedback({ text: "Superas el presupuesto salarial del club.", type: 'ERROR' });
       return;
    }

    const result = world.submitContractOffer(player, proposedSalary, years, currentDate);

    if (result === 'ACCEPTED') {
       setFeedback({ text: "¡El jugador ha aceptado los términos!", type: 'SUCCESS' });
       setIsLocked(true);
       setTimeout(() => {
          onRenewed();
       }, 2000);
    } else if (result === 'BROKEN') {
       setFeedback({ text: "Negociaciones rotas. El jugador se retira de la mesa.", type: 'ERROR' });
       setIsLocked(true);
       setTimeout(() => {
          onClose();
       }, 2000);
    } else {
       const reactions = [
          "Esa oferta es insuficiente para un jugador de mi calibre.",
          "Esperaba algo más cercano a mis peticiones.",
          "Tendrás que mejorar mucho los términos si quieres que firme.",
          "Mi agente dice que esto es una falta de respeto."
       ];
       setFeedback({ text: reactions[Math.floor(Math.random() * reactions.length)], type: 'NEUTRAL' });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-4 backdrop-blur-xl">
      <div className="bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        <header className="p-6 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Negociación de Contrato</h2>
              <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">{player.name}</p>
           </div>
           <button onClick={onClose} className="text-slate-500 hover:text-white" disabled={isLocked}>
              <X size={28} />
           </button>
        </header>

        <div className="p-8 space-y-8">
           {/* Current vs Target */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Sueldo Actual</p>
                 <p className="text-xl font-bold text-white">£{player.salary.toLocaleString()}</p>
              </div>
              <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/20">
                 <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Sueldo Pretendido</p>
                 <p className="text-xl font-bold text-blue-400">£{requestedSalary.toLocaleString()}</p>
              </div>
           </div>

           {/* Feedback Area */}
           {feedback && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${
                 feedback.type === 'SUCCESS' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                 feedback.type === 'ERROR' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                 'bg-slate-700/50 border-slate-600 text-slate-300'
              }`}>
                 {feedback.type === 'SUCCESS' ? <CheckCircle2 className="shrink-0" size={18}/> : <AlertCircle className="shrink-0" size={18}/>}
                 <p className="text-sm italic">"{feedback.text}"</p>
              </div>
           )}

           {/* Negotiation Inputs */}
           <div className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Propuesta Salarial</label>
                 <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                    <input 
                       type="number" 
                       disabled={isLocked}
                       className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                       value={proposedSalary}
                       onChange={(e) => setProposedSalary(Number(e.target.value))}
                    />
                 </div>
                 <div className="flex justify-between px-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Paciencia: {3 - player.negotiationAttempts}/3 intentos</span>
                    <span className={`text-[10px] font-bold ${proposedSalary >= requestedSalary ? 'text-green-500' : 'text-yellow-500'}`}>
                       {proposedSalary >= requestedSalary ? 'Oferta atractiva' : 'Arriesgado'}
                    </span>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Duración del Vínculo</label>
                 <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-700">
                    {[1, 2, 3, 4, 5].map(y => (
                       <button 
                          key={y}
                          disabled={isLocked}
                          onClick={() => setYears(y)}
                          className={`flex-1 py-3 text-xs font-black rounded-lg transition-all ${years === y ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                       >
                          {y} {y === 1 ? 'AÑO' : 'AÑOS'}
                       </button>
                    ))}
                 </div>
              </div>
           </div>

           <div className="flex flex-col gap-3">
              <button 
                 onClick={handleSubmit}
                 disabled={isLocked}
                 className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${isLocked ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                 <TrendingUp size={20} /> Enviar Oferta
              </button>
              <button 
                 onClick={onClose}
                 disabled={isLocked}
                 className="w-full py-3 text-slate-500 hover:text-red-400 transition-colors text-[10px] font-black tracking-widest uppercase"
              >
                 Retirarse de la negociación
              </button>
           </div>
        </div>

        <div className="bg-slate-900 p-4 border-t border-slate-700 flex items-center gap-4">
           <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400 shrink-0">
              <AlertCircle size={20} />
           </div>
           <p className="text-[10px] text-slate-400 leading-tight uppercase font-bold tracking-widest">
              Un jugador con alta lealtad valorará más el proyecto que el sueldo. No abuses de ofertas bajas o romperá la negociación.
           </p>
        </div>
      </div>
    </div>
  );
};
