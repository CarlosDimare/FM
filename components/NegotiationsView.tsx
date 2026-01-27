
import React, { useState, useMemo } from 'react';
import { world } from '../services/worldManager';
import { TransferOffer, Club, Player } from '../types';
import { MessageSquare, History, CheckCircle, XCircle, Clock, ArrowRightLeft, DollarSign, Info } from 'lucide-react';
import { FMBox, FMTable, FMTableCell, FMButton } from './FMUI';

interface NegotiationsViewProps {
  userClubId: string;
  onUpdate: () => void;
  currentDate: Date; 
}

export const NegotiationsView: React.FC<NegotiationsViewProps> = ({ userClubId, onUpdate, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  const offers = useMemo(() => {
    return world.offers.filter(o => o.fromClubId === userClubId || o.toClubId === userClubId);
  }, [userClubId, world.offers.length]);

  const activeOffers = offers.filter(o => o.status !== 'COMPLETED');
  const historyOffers = offers.filter(o => o.status === 'COMPLETED');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-300';
      case 'COUNTER_OFFER': return 'bg-amber-100 text-amber-800 border-amber-300';
      default: return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'Aceptada';
      case 'REJECTED': return 'Rechazada';
      case 'COUNTER_OFFER': return 'Contraoferta';
      case 'PENDING': return 'Pendiente';
      case 'COMPLETED': return 'Completado';
      default: return status;
    }
  };

  const renderOfferRow = (offer: TransferOffer) => {
    const player = world.players.find(p => p.id === offer.playerId);
    const toClub = world.getClub(offer.toClubId);
    const fromClub = world.getClub(offer.fromClubId);
    const isBuying = offer.fromClubId === userClubId;

    return (
      <div key={offer.id} className="bg-white border border-[#a0b0a0] rounded-sm p-3 shadow-sm hover:border-[#3a4a3a] transition-all group">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-white shrink-0 ${isBuying ? 'bg-slate-800' : 'bg-[#aabdaa]'}`}>
              {isBuying ? <ArrowRightLeft size={16} /> : <DollarSign size={16} />}
            </div>
            <div className="min-w-0">
              <h4 className="text-slate-900 font-bold text-[11px] uppercase truncate">{player?.name || 'Jugador desconocido'}</h4>
              <p className="text-slate-500 text-[9px] font-bold uppercase tracking-tight truncate">
                {isBuying ? `Hacia ${toClub?.name}` : `Desde ${fromClub?.name}`}
              </p>
            </div>
          </div>

          <div className="flex flex-row md:flex-row items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
            <div className="text-left md:text-right">
              <p className="text-slate-950 font-bold text-xs">£{offer.amount.toLocaleString()}</p>
              <p className="text-slate-400 text-[8px] uppercase font-bold tracking-widest">{offer.type === 'PURCHASE' ? 'Traspaso' : 'Cesión'}</p>
            </div>

            <div className={`px-2 py-0.5 rounded-[1px] border text-[8px] font-black uppercase tracking-tighter ${getStatusStyle(offer.status)}`}>
              {getStatusLabel(offer.status)}
            </div>

            {offer.status === 'COUNTER_OFFER' && isBuying && (
              <button 
                onClick={() => { world.acceptCounterOffer(offer.id, currentDate); onUpdate(); }}
                className="bg-gradient-to-b from-[#3a4a3a] to-[#1a2a1a] text-white text-[8px] font-black px-3 py-1.5 rounded-[1px] uppercase tracking-widest shadow-sm hover:brightness-110 active:translate-y-px"
              >
                Aceptar £{offer.counterAmount?.toLocaleString()}
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-2 text-[8px] text-slate-400 font-bold uppercase flex items-center gap-1">
           <Clock size={10} /> Recibido el {offer.date.toLocaleDateString()}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
      <header className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter">Centro de Negociaciones</h2>
            <p className="text-slate-600 font-bold text-[9px] md:text-[10px] uppercase tracking-widest italic">Gestiona tus ofertas y el historial de transferencias.</p>
          </div>
          
          <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm w-full md:w-auto">
             <button 
                onClick={() => setActiveTab('ACTIVE')}
                className={`flex-1 md:px-4 py-1.5 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'ACTIVE' ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
             >
                <MessageSquare size={12} /> ACTIVAS ({activeOffers.length})
             </button>
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 md:px-4 py-1.5 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'HISTORY' ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
             >
                <History size={12} /> HISTORIAL ({historyOffers.length})
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1">
         <div className="space-y-2">
            {activeTab === 'ACTIVE' ? (
               activeOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 italic flex flex-col items-center justify-center gap-3 bg-[#e8ece8] rounded-sm border border-dashed border-[#a0b0a0]">
                     <Clock size={32} className="opacity-20" />
                     <p className="font-bold uppercase tracking-widest text-[9px]">No hay negociaciones en curso actualmente.</p>
                  </div>
               ) : (
                  activeOffers.map(renderOfferRow)
               )
            ) : (
               historyOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 italic flex flex-col items-center justify-center gap-3 bg-[#e8ece8] rounded-sm border border-dashed border-[#a0b0a0]">
                     <History size={32} className="opacity-20" />
                     <p className="font-bold uppercase tracking-widest text-[9px]">No hay historial de fichajes todavía.</p>
                  </div>
               ) : (
                  historyOffers.map(renderOfferRow)
               )
            )}
         </div>
      </div>

      <div className="bg-[#bcc8bc]/50 p-3 rounded-sm border border-[#a0b0a0] flex items-center gap-3 shrink-0">
         <Info size={14} className="text-slate-700" />
         <p className="text-[9px] text-slate-700 font-bold uppercase tracking-tight">
            Las respuestas pueden tardar de 2 a 4 días simulados tras el envío de la oferta inicial.
         </p>
      </div>
    </div>
  );
};
