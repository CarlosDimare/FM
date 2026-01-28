
import React, { useState } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { X, DollarSign, ArrowRightLeft, ShieldAlert, Clock, Percent } from 'lucide-react';

interface TransferOfferModalProps {
  player: Player;
  userClubId: string;
  onClose: () => void;
  onOfferMade: () => void;
  currentDate: Date;
}

export const TransferOfferModal: React.FC<TransferOfferModalProps> = ({ player, userClubId, onClose, onOfferMade, currentDate }) => {
  const [offerType, setOfferType] = useState<'PURCHASE' | 'LOAN'>('PURCHASE');
  const [amount, setAmount] = useState(player.value);
  const [wageShare, setWageShare] = useState(100);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const userClub = world.getClub(userClubId);
  const targetClub = world.getClub(player.clubId);
  
  const isSmallTeam = userClub && targetClub && userClub.reputation < targetClub.reputation - 1000;
  
  const canAfford = userClub && (offerType === 'PURCHASE' ? userClub.finances.transferBudget >= amount : true);

  const handleSubmit = async () => {
    if (!canAfford) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    world.makeTransferOffer(player.id, userClubId, amount, offerType, currentDate, wageShare);
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-700 overflow-hidden flex flex-col">
        <header className="p-6 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Realizar Oferta</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{player.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={24} />
          </button>
        </header>

        <div className="p-8 space-y-6">
          {!submitted ? (
            <>
              <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                <button 
                  onClick={() => { setOfferType('PURCHASE'); setAmount(player.value); }}
                  className={`flex-1 py-2 text-xs font-black rounded transition-all uppercase tracking-widest ${offerType === 'PURCHASE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  Fichaje
                </button>
                <button 
                  onClick={() => { setOfferType('LOAN'); setAmount(0); }}
                  className={`flex-1 py-2 text-xs font-black rounded transition-all uppercase tracking-widest ${offerType === 'LOAN' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                >
                  Cesión
                </button>
              </div>

              {offerType === 'PURCHASE' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500">
                    <span>Valor de Mercado</span>
                    <span className="text-slate-300 font-mono">£{player.value.toLocaleString()}</span>
                  </div>
                  
                  {isSmallTeam && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded text-[9px] text-orange-400 uppercase font-black tracking-widest text-center">
                      ⚠️ El club vendedor exigirá más por tu menor reputación.
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monto de la Oferta</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                      <input 
                        type="number" 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  {!canAfford && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-3 text-red-400 text-xs font-bold">
                      <ShieldAlert size={16} /> Presupuesto insuficiente.
                    </div>
                  )}
                </div>
              )}

              {offerType === 'LOAN' && (
                <div className="space-y-4">
                  <div className="text-center py-2 text-slate-400 text-xs italic">
                    Ofrece pagar parte del sueldo para convencer al club.
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Contribución Salarial (%)</label>
                    <div className="relative">
                      <Percent className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                      <select 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-12 pr-6 py-4 text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold appearance-none"
                        value={wageShare}
                        onChange={(e) => setWageShare(Number(e.target.value))}
                      >
                        <option value={0}>0%</option>
                        <option value={30}>30%</option>
                        <option value={50}>50%</option>
                        <option value={70}>70%</option>
                        <option value={100}>100%</option>
                      </select>
                    </div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase text-right">
                       Sueldo Estimado: £{((player.salary * wageShare) / 100).toLocaleString()}/mes
                    </p>
                  </div>
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={loading || !canAfford}
                className={`w-full py-5 flex items-center justify-center gap-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${loading || !canAfford ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                {loading ? 'Procesando...' : 'Enviar Oferta'}
              </button>
            </>
          ) : (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-blue-500/10 border-4 border-blue-500 text-blue-500">
                <Clock size={40} />
              </div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2 text-white">
                Oferta Enviada
              </h4>
              <p className="text-slate-400 text-xs leading-relaxed mb-8 uppercase font-bold tracking-widest">
                Espera la respuesta del club en el buzón de entrada.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-700 hover:bg-slate-600 text-white font-black rounded-xl uppercase tracking-widest text-xs"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
