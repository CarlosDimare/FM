
import React, { useState } from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { X, DollarSign, ArrowRightLeft, ShieldAlert, Clock } from 'lucide-react';

interface TransferOfferModalProps {
  player: Player;
  userClubId: string;
  onClose: () => void;
  onOfferMade: () => void;
  currentDate: Date; // Added current date prop
}

export const TransferOfferModal: React.FC<TransferOfferModalProps> = ({ player, userClubId, onClose, onOfferMade, currentDate }) => {
  const [offerType, setOfferType] = useState<'PURCHASE' | 'LOAN'>('PURCHASE');
  const [amount, setAmount] = useState(player.value);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const userClub = world.getClub(userClubId);
  const targetClub = world.getClub(player.clubId);
  
  // Calculate small team tax display
  const isSmallTeam = userClub && targetClub && userClub.reputation < targetClub.reputation - 1000;
  
  const canAfford = userClub && (offerType === 'PURCHASE' ? userClub.finances.transferBudget >= amount : true);

  const handleSubmit = async () => {
    if (!canAfford) return;
    setLoading(true);
    
    // Simulate short processing delay
    await new Promise(r => setTimeout(r, 600));
    
    world.makeTransferOffer(player.id, userClubId, amount, offerType, currentDate);
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
        <header className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
          <div>
            <h3 className="text-xl font-black uppercase italic tracking-tighter" style={{ color: '#333' }}>Realizar Oferta</h3>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#999' }}>{player.name}</p>
          </div>
          <button onClick={onClose} style={{ color: '#999' }}>
            <X size={24} />
          </button>
        </header>

        <div className="p-8 space-y-6">
          {!submitted ? (
            <>
              <div className="flex p-1 rounded-lg" style={{ backgroundColor: '#1e293b', border: '1px solid #999' }}>
                <button 
                  onClick={() => { setOfferType('PURCHASE'); setAmount(player.value); }}
                  className="flex-1 py-2 text-xs font-black rounded transition-all uppercase tracking-widest"
                  style={{ 
                    backgroundColor: offerType === 'PURCHASE' ? '#666' : 'transparent',
                    color: offerType === 'PURCHASE' ? '#fff' : '#999' 
                  }}
                >
                  Fichaje
                </button>
                <button 
                  onClick={() => { setOfferType('LOAN'); setAmount(0); }}
                  className="flex-1 py-2 text-xs font-black rounded transition-all uppercase tracking-widest"
                  style={{ 
                    backgroundColor: offerType === 'LOAN' ? '#666' : 'transparent',
                    color: offerType === 'LOAN' ? '#fff' : '#999' 
                  }}
                >
                  Cesión
                </button>
              </div>

              {offerType === 'PURCHASE' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest" style={{ color: '#999' }}>
                    <span>Valor de Mercado</span>
                    <span className="font-mono" style={{ color: '#ccc' }}>£{player.value.toLocaleString()}</span>
                  </div>
                  
                  {isSmallTeam && (
                    <div className="p-2 rounded text-[9px] uppercase font-black tracking-widest text-center" style={{ backgroundColor: 'rgba(204, 153, 0, 0.1)', borderColor: '#cc9900', border: '1px solid #cc9900', color: '#cc9900' }}>
                      ⚠️ Atención: El club vendedor exige un recargo por tu menor reputación.
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block" style={{ color: '#999' }}>Monto de la Oferta</label>
                    <div className="relative">
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2" size={18} style={{ color: '#666' }} />
                      <input 
                        type="number" 
                        className="w-full rounded-xl pl-12 pr-6 py-4 outline-none font-bold"
                        style={{ backgroundColor: '#1e293b', border: '1px solid #999', color: '#fff' }}
                        value={amount}
                        onChange={(e) => setAmount(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  {!canAfford && (
                    <div className="p-3 rounded-lg flex items-center gap-3 text-xs font-bold" style={{ backgroundColor: 'rgba(153, 153, 153, 0.1)', border: '1px solid #999', color: '#999' }}>
                      <ShieldAlert size={16} /> Presupuesto insuficiente.
                    </div>
                  )}
                </div>
              )}

              {offerType === 'LOAN' && (
                <div className="text-center py-6 text-sm italic" style={{ color: '#999' }}>
                  Solicitarás la cesión del jugador. Si no está listado como cedible, solo aceptarán si cubres el 100% de la ficha o tienes gran reputación.
                </div>
              )}

              <button 
                onClick={handleSubmit}
                disabled={loading || !canAfford}
                className="w-full py-5 flex items-center justify-center gap-3 rounded-xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                style={{ 
                  backgroundColor: loading || !canAfford ? '#1e293b' : '#666',
                  color: loading || !canAfford ? '#999' : '#fff',
                  cursor: loading || !canAfford ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Procesando...' : 'Enviar Oferta'}
              </button>
            </>
          ) : (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'rgba(102, 102, 102, 0.1)', border: '4px solid #666', color: '#666' }}>
                <Clock size={40} />
              </div>
              <h4 className="text-2xl font-black uppercase italic tracking-tighter mb-2" style={{ color: '#333' }}>
                Oferta Enviada
              </h4>
              <p className="text-xs leading-relaxed mb-8 uppercase font-bold tracking-widest" style={{ color: '#999' }}>
                Recibirás una respuesta en tu buzón en un plazo de 2 a 4 días.
              </p>
              <button 
                onClick={onClose}
                className="w-full py-4 font-black rounded-xl uppercase tracking-widest text-xs"
                style={{ backgroundColor: '#1e293b', color: '#fff' }}
              >
                Volver
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
