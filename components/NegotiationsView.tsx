import React, { useState, useMemo } from 'react';
import { world } from '../services/worldManager';
import { TransferOffer, Club, Player } from '../types';
import { MessageSquare, History, CheckCircle, XCircle, Clock, ArrowRightLeft, DollarSign, Info } from 'lucide-react';

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
      case 'ACCEPTED': return 'bg-green-200 text-green-900 border-green-600';
      case 'REJECTED': return 'bg-red-200 text-red-900 border-red-600';
      case 'COUNTER_OFFER': return 'bg-yellow-200 text-yellow-900 border-yellow-600';
      default: return 'bg-slate-300 text-slate-800 border-slate-500';
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
      <div key={offer.id} className="bg-slate-200 p-4 rounded-sm border border-slate-500 shadow-lg hover:border-slate-800 transition-all">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-sm flex items-center justify-center font-black text-white ${isBuying ? 'bg-slate-800' : 'bg-slate-600'}`}>
              {isBuying ? <ArrowRightLeft size={20} /> : <DollarSign size={20} />}
            </div>
            <div>
              <h4 className="text-slate-950 font-black italic uppercase tracking-tighter">{player?.name || 'Jugador desconocido'}</h4>
              <p className="text-slate-600 text-[10px] uppercase font-black tracking-widest">
                {isBuying ? `Hacia ${toClub?.name}` : `Desde ${world.getClub(offer.fromClubId)?.name}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Monto</p>
              <p className="text-slate-950 font-mono font-black text-sm">£{offer.amount.toLocaleString()}</p>
            </div>

            <div className={`px-3 py-1 rounded-sm border text-[10px] font-black uppercase tracking-widest ${getStatusStyle(offer.status)}`}>
              {getStatusLabel(offer.status)}
            </div>

            {offer.status === 'COUNTER_OFFER' && isBuying && (
              <button 
                onClick={() => { world.acceptCounterOffer(offer.id, currentDate); onUpdate(); }}
                className="bg-slate-950 hover:bg-black text-white text-[9px] font-black px-4 py-1.5 rounded-sm uppercase tracking-widest shadow-lg transition-all"
              >
                Aceptar £{offer.counterAmount?.toLocaleString()}
              </button>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-slate-400 flex justify-between items-center">
           <div className="flex items-center gap-2 text-slate-600 text-[9px] font-black uppercase tracking-widest">
              <Clock size={12} /> Enviada el {offer.date.toLocaleDateString()}
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 bg-slate-400 overflow-hidden">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-600 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">CENTRO DE NEGOCIACIONES</h2>
          <p className="text-slate-800 font-black text-xs uppercase tracking-widest">Gestiona tus ofertas y el historial de transferencias.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-sm border border-slate-600 shadow-inner">
           <button 
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === 'ACTIVE' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-600 hover:text-slate-950'}`}
           >
              <MessageSquare size={14} /> ACTIVAS ({activeOffers.length})
           </button>
           <button 
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 text-[10px] font-black rounded-sm transition-all uppercase tracking-widest flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-slate-950 text-white shadow-lg' : 'text-slate-600 hover:text-slate-950'}`}
           >
              <History size={14} /> HISTORIAL ({historyOffers.length})
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
         <div className="space-y-4">
            {activeTab === 'ACTIVE' ? (
               activeOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-700 italic flex flex-col items-center justify-center gap-4 bg-slate-300 rounded-sm border-2 border-dashed border-slate-500">
                     <Clock size={48} className="opacity-20" />
                     <p className="font-black uppercase tracking-widest text-[10px]">No hay negociaciones en curso actualmente.</p>
                  </div>
               ) : (
                  activeOffers.map(renderOfferRow)
               )
            ) : (
               historyOffers.length === 0 ? (
                  <div className="p-20 text-center text-slate-700 italic flex flex-col items-center justify-center gap-4 bg-slate-300 rounded-sm border-2 border-dashed border-slate-500">
                     <History size={48} className="opacity-20" />
                     <p className="font-black uppercase tracking-widest text-[10px]">No hay historial de fichajes todavía.</p>
                  </div>
               ) : (
                  historyOffers.map(renderOfferRow)
               )
            )}
         </div>
      </div>

      <div className="bg-slate-950/10 p-4 rounded-sm border border-slate-600 flex items-center gap-4">
         <div className="p-2 bg-slate-950/20 rounded-full text-slate-900"><Info size={16} /></div>
         <p className="text-[10px] text-slate-800 leading-tight uppercase font-black tracking-widest">
            Las respuestas pueden tardar de 2 a 4 días simulados.
         </p>
      </div>
    </div>
  );
};