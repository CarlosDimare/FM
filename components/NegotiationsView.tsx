
import React, { useState, useMemo } from 'react';
import { world } from '../services/worldManager';
import { TransferOffer, Club, Player } from '../types';
import { MessageSquare, History, CheckCircle, XCircle, Clock, ArrowRightLeft, DollarSign, Info, UserCheck, Wallet } from 'lucide-react';
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

  const activeOffers = offers.filter(o => o.status !== 'COMPLETED' && o.status !== 'REJECTED');
  const historyOffers = offers.filter(o => o.status === 'COMPLETED' || o.status === 'REJECTED');

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
      case 'ACCEPTED': return 'Aceptada (Club)';
      case 'REJECTED': return 'Rechazada';
      case 'COUNTER_OFFER': return 'Contraoferta';
      case 'PENDING': return 'Pendiente';
      case 'COMPLETED': return 'Completado';
      default: return status;
    }
  };

  const handleFinalize = (offer: TransferOffer) => {
      world.completeTransfer(offer);
      onUpdate();
  };

  const renderOfferRow = (offer: TransferOffer) => {
    const player = world.players.find(p => p.id === offer.playerId);
    const toClub = world.getClub(offer.toClubId);
    const fromClub = world.getClub(offer.fromClubId);
    const isBuying = offer.fromClubId === userClubId;

    return (
      <div key={offer.id} className="bg-white border border-[#a0b0a0] rounded-sm p-4 shadow-sm hover:border-[#3a4a3a] transition-all group mb-2">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white shrink-0 shadow-inner ${isBuying ? 'bg-slate-800' : 'bg-[#aabdaa]'}`}>
              {isBuying ? <ArrowRightLeft size={20} /> : <DollarSign size={20} />}
            </div>
            <div className="min-w-0">
              <h4 className="text-slate-900 font-black text-sm uppercase italic truncate">{player?.name || 'Jugador desconocido'}</h4>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight truncate">
                {isBuying ? `Destino: ${userClubId === offer.fromClubId ? 'Tu Club' : toClub?.name}` : `Hacia: ${toClub?.name}`}
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 w-full md:w-auto">
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
               <p className="text-[8px] uppercase font-black text-slate-400">Tipo de Trato</p>
               <p className="text-[10px] font-bold text-slate-800 uppercase">{offer.type === 'PURCHASE' ? 'Traspaso' : 'Cesión'}</p>
            </div>
            
            <div className="bg-slate-50 p-2 rounded border border-slate-100">
               <p className="text-[8px] uppercase font-black text-slate-400">{offer.type === 'PURCHASE' ? 'Costo' : 'Sueldo asumido'}</p>
               <p className="text-[10px] font-bold text-slate-900">
                  {offer.type === 'PURCHASE' ? `£${offer.amount.toLocaleString()}` : `${offer.wageShare}% (£${((player?.salary || 0) * offer.wageShare / 100).toLocaleString()}/mes)`}
               </p>
            </div>

            <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
                <div className={`px-3 py-1 rounded-[2px] border text-[9px] font-black uppercase tracking-tighter text-center ${getStatusStyle(offer.status)}`}>
                  {getStatusLabel(offer.status)}
                </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
            {offer.status === 'COUNTER_OFFER' && isBuying && (
              <button 
                onClick={() => { world.acceptCounterOffer(offer.id, currentDate); onUpdate(); }}
                className="flex-1 md:flex-none bg-gradient-to-b from-[#e0a040] to-[#b07020] text-white text-[9px] font-black px-4 py-2 rounded shadow-sm hover:brightness-110 uppercase tracking-widest"
              >
                Aceptar £{offer.counterAmount?.toLocaleString()}
              </button>
            )}

            {offer.status === 'ACCEPTED' && isBuying && (
              <button 
                onClick={() => handleFinalize(offer)}
                className="flex-1 md:flex-none bg-gradient-to-b from-green-600 to-green-800 text-white text-[9px] font-black px-5 py-2 rounded shadow-md hover:brightness-110 flex items-center justify-center gap-2 uppercase tracking-widest animate-pulse"
              >
                <UserCheck size={14} /> FIRMAR JUGADOR
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-center">
           <div className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1.5">
              <Clock size={12} /> Iniciada: {offer.date.toLocaleDateString()}
           </div>
           {offer.status === 'ACCEPTED' && isBuying && (
              <span className="text-[9px] text-green-600 font-black uppercase tracking-widest">
                 ¡Acuerdo alcanzado! Haz clic en Firmar para incorporarlo.
              </span>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-2 md:p-4 h-full flex flex-col gap-4 bg-[#d4dcd4] overflow-hidden">
      <header className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 uppercase italic tracking-tighter leading-none">Centro de Fichajes</h2>
            <p className="text-slate-600 font-bold text-[9px] md:text-[10px] uppercase tracking-widest italic mt-1">Acuerdos, cesiones y confirmaciones de contrato.</p>
          </div>
          
          <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm w-full md:w-auto">
             <button 
                onClick={() => setActiveTab('ACTIVE')}
                className={`flex-1 md:px-6 py-2 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'ACTIVE' ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
             >
                <MessageSquare size={14} /> ACTIVAS ({activeOffers.length})
             </button>
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`flex-1 md:px-6 py-2 text-[9px] font-black rounded-[1px] transition-all uppercase tracking-widest flex items-center justify-center gap-2 ${activeTab === 'HISTORY' ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
             >
                <History size={14} /> HISTORIAL ({historyOffers.length})
             </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scroll pr-1">
         <div className="flex flex-col">
            {activeTab === 'ACTIVE' ? (
               activeOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 italic flex flex-col items-center justify-center gap-3 bg-[#e8ece8] rounded-sm border border-dashed border-[#a0b0a0]">
                     <Clock size={40} className="opacity-20" />
                     <p className="font-black uppercase tracking-widest text-[10px]">No hay ofertas pendientes de resolución.</p>
                  </div>
               ) : (
                  activeOffers.map(renderOfferRow)
               )
            ) : (
               historyOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-400 italic flex flex-col items-center justify-center gap-3 bg-[#e8ece8] rounded-sm border border-dashed border-[#a0b0a0]">
                     <History size={40} className="opacity-20" />
                     <p className="font-black uppercase tracking-widest text-[10px]">El historial de transferencias está vacío.</p>
                  </div>
               ) : (
                  historyOffers.map(renderOfferRow)
               )
            )}
         </div>
      </div>

      <div className="bg-[#bcc8bc]/50 p-4 rounded-sm border border-[#a0b0a0] flex items-start gap-4 shrink-0 shadow-inner">
         <div className="p-2 bg-slate-100 rounded-full text-slate-700 border border-slate-300">
            <Info size={16} />
         </div>
         <div className="flex-1">
            <p className="text-[10px] text-slate-800 font-black uppercase tracking-tight">Manual de Negociación</p>
            <p className="text-[9px] text-slate-600 font-bold uppercase leading-tight mt-1">
               Un trato aceptado por el club rival NO incorpora al jugador automáticamente. Debes pulsar <span className="text-green-700">"FIRMAR JUGADOR"</span> para cerrar el contrato personal y que se una a tu disciplina.
            </p>
         </div>
      </div>
    </div>
  );
};
