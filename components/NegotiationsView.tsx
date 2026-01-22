
import React, { useState, useMemo } from 'react';
import { world } from '../services/worldManager';
import { TransferOffer, Club, Player } from '../types';
// Added Info icon to imports
import { MessageSquare, History, CheckCircle, XCircle, Clock, ArrowRightLeft, DollarSign, Info } from 'lucide-react';

interface NegotiationsViewProps {
  userClubId: string;
  onUpdate: () => void;
  currentDate: Date; // Added currentDate to fix acceptCounterOffer call
}

export const NegotiationsView: React.FC<NegotiationsViewProps> = ({ userClubId, onUpdate, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'HISTORY'>('ACTIVE');

  const offers = useMemo(() => {
    // Current only user club offers are tracked, but we filter just in case
    return world.offers.filter(o => o.fromClubId === userClubId || o.toClubId === userClubId);
  }, [userClubId, world.offers.length]);

  const activeOffers = offers.filter(o => o.status !== 'COMPLETED');
  const historyOffers = offers.filter(o => o.status === 'COMPLETED');

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'ACCEPTED': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'REJECTED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'COUNTER_OFFER': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
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
    const isBuying = offer.fromClubId === userClubId;

    return (
      <div key={offer.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg hover:border-slate-500 transition-all">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-black text-white ${isBuying ? 'bg-blue-600' : 'bg-red-600'}`}>
              {isBuying ? <ArrowRightLeft size={20} /> : <DollarSign size={20} />}
            </div>
            <div>
              <h4 className="text-white font-bold text-sm">{player?.name || 'Jugador desconocido'}</h4>
              <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">
                {isBuying ? `Hacia ${toClub?.name}` : `Desde ${world.getClub(offer.fromClubId)?.name}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monto</p>
              <p className="text-white font-mono font-bold text-sm">£{offer.amount.toLocaleString()}</p>
            </div>

            <div className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(offer.status)}`}>
              {getStatusLabel(offer.status)}
            </div>

            {offer.status === 'COUNTER_OFFER' && isBuying && (
              <button 
                // Fix: Added second argument currentDate to acceptCounterOffer as required by worldManager.ts
                onClick={() => { world.acceptCounterOffer(offer.id, currentDate); onUpdate(); }}
                className="bg-blue-600 hover:bg-blue-500 text-white text-[9px] font-black px-4 py-1.5 rounded uppercase tracking-widest shadow-lg transition-all"
              >
                Aceptar £{offer.counterAmount?.toLocaleString()}
              </button>
            )}

            {offer.status === 'ACCEPTED' && isBuying && (
               <p className="text-[9px] text-slate-400 italic">El fichaje se completará al avanzar de día.</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-700 flex justify-between items-center">
           <div className="flex items-center gap-2 text-slate-500 text-[9px] font-bold uppercase tracking-widest">
              <Clock size={12} /> Enviada el {offer.date.toLocaleDateString()}
           </div>
           {offer.status === 'PENDING' && (
              <div className="text-blue-400 text-[9px] font-black uppercase tracking-widest animate-pulse">
                Esperando respuesta...
              </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Centro de Negociaciones</h2>
          <p className="text-slate-400 text-sm">Gestiona tus ofertas y el historial de transferencias.</p>
        </div>
        
        <div className="flex bg-slate-800 p-1 rounded-lg border border-slate-700 shadow-inner">
           <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 text-[10px] font-black rounded-md transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === 'ACTIVE' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
              <MessageSquare size={14} /> Activas ({activeOffers.length})
           </button>
           <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 text-[10px] font-black rounded-md transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
           >
              <History size={14} /> Historial ({historyOffers.length})
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
         <div className="space-y-4">
            {activeTab === 'ACTIVE' ? (
               activeOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-600 italic flex flex-col items-center justify-center gap-4 bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-800">
                     <Clock size={48} className="opacity-20" />
                     <p className="font-bold uppercase tracking-widest text-xs">No hay negociaciones en curso actualmente.</p>
                  </div>
               ) : (
                  activeOffers.map(renderOfferRow)
               )
            ) : (
               historyOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-600 italic flex flex-col items-center justify-center gap-4 bg-slate-800/20 rounded-2xl border-2 border-dashed border-slate-800">
                     <History size={48} className="opacity-20" />
                     <p className="font-bold uppercase tracking-widest text-xs">No hay historial de fichajes todavía.</p>
                  </div>
               ) : (
                  historyOffers.map(renderOfferRow)
               )
            )}
         </div>
      </div>

      <div className="bg-blue-900/10 p-4 rounded-xl border border-blue-900/30 flex items-center gap-4">
         <div className="p-2 bg-blue-600/20 rounded-full text-blue-400"><Info size={16} /></div>
         <p className="text-[10px] text-slate-400 leading-tight uppercase font-bold tracking-widest">
            Recuerda que las respuestas de los clubes pueden tardar entre 2 y 4 días simulados. Las ofertas aceptadas se completan automáticamente al día siguiente.
         </p>
      </div>
    </div>
  );
};
