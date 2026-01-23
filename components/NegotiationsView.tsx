
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
      <div key={offer.id} className="p-4 rounded-xl shadow-lg transition-all" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-white" style={{ backgroundColor: isBuying ? '#666' : '#999' }}>
              {isBuying ? <ArrowRightLeft size={20} /> : <DollarSign size={20} />}
            </div>
            <div>
              <h4 className="font-bold text-sm" style={{ color: '#333' }}>{player?.name || 'Jugador desconocido'}</h4>
              <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: '#999' }}>
                {isBuying ? `Hacia ${toClub?.name}` : `Desde ${world.getClub(offer.fromClubId)?.name}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] uppercase font-black tracking-widest" style={{ color: '#999' }}>Monto</p>
              <p className="font-mono font-bold text-sm" style={{ color: '#333' }}>£{offer.amount.toLocaleString()}</p>
            </div>

            <div className="px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest" style={{ backgroundColor: '#e8e8e8', borderColor: '#999', color: '#666' }}>
              {getStatusLabel(offer.status)}
            </div>

            {offer.status === 'COUNTER_OFFER' && isBuying && (
              <button 
                onClick={() => { world.acceptCounterOffer(offer.id, currentDate); onUpdate(); }}
                className="text-[9px] font-black px-4 py-1.5 rounded uppercase tracking-widest shadow-lg transition-all"
                style={{ backgroundColor: '#666', color: '#fff' }}
              >
                Aceptar £{offer.counterAmount?.toLocaleString()}
              </button>
            )}

            {offer.status === 'ACCEPTED' && isBuying && (
               <p className="text-[9px] italic" style={{ color: '#999' }}>El fichaje se completará al avanzar de día.</p>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-3 flex justify-between items-center" style={{ borderTop: '1px solid #999' }}>
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest" style={{ color: '#999' }}>
              <Clock size={12} /> Enviada el {offer.date.toLocaleDateString()}
           </div>
           {offer.status === 'PENDING' && (
              <div className="text-[9px] font-black uppercase tracking-widest animate-pulse" style={{ color: '#666' }}>
                Esperando respuesta...
              </div>
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 h-full flex flex-col gap-6 overflow-hidden" style={{ backgroundColor: '#dcdcdc' }}>
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: '#333' }}>Centro de Negociaciones</h2>
          <p className="text-sm" style={{ color: '#999' }}>Gestiona tus ofertas y el historial de transferencias.</p>
        </div>
        
        <div className="flex p-1 rounded-lg shadow-inner" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
           <button 
              onClick={() => setActiveTab('ACTIVE')}
              className="px-4 py-2 text-[10px] font-black rounded-md transition-all uppercase tracking-widest flex items-center gap-2"
              style={{ 
                backgroundColor: activeTab === 'ACTIVE' ? '#666' : 'transparent',
                color: activeTab === 'ACTIVE' ? '#fff' : '#666' 
              }}
           >
              <MessageSquare size={14} /> Activas ({activeOffers.length})
           </button>
           <button 
              onClick={() => setActiveTab('HISTORY')}
              className="px-4 py-2 text-[10px] font-black rounded-md transition-all uppercase tracking-widest flex items-center gap-2"
              style={{ 
                backgroundColor: activeTab === 'HISTORY' ? '#666' : 'transparent',
                color: activeTab === 'HISTORY' ? '#fff' : '#666' 
              }}
           >
              <History size={14} /> Historial ({historyOffers.length})
           </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
         <div className="space-y-4">
            {activeTab === 'ACTIVE' ? (
               activeOffers.length === 0 ? (
                  <div className="p-20 text-center italic flex flex-col items-center justify-center gap-4 rounded-2xl" style={{ color: '#999', backgroundColor: 'rgba(232, 232, 232, 0.5)', border: '2px dashed #999' }}>
                     <Clock size={48} style={{ opacity: 0.3 }} />
                     <p className="font-bold uppercase tracking-widest text-xs">No hay negociaciones en curso actualmente.</p>
                  </div>
               ) : (
                  activeOffers.map(renderOfferRow)
               )
            ) : (
               historyOffers.length === 0 ? (
                  <div className="p-20 text-center italic flex flex-col items-center justify-center gap-4 rounded-2xl" style={{ color: '#999', backgroundColor: 'rgba(232, 232, 232, 0.5)', border: '2px dashed #999' }}>
                     <History size={48} style={{ opacity: 0.3 }} />
                     <p className="font-bold uppercase tracking-widest text-xs">No hay historial de fichajes todavía.</p>
                  </div>
               ) : (
                  historyOffers.map(renderOfferRow)
               )
            )}
         </div>
      </div>

      <div className="p-4 rounded-xl flex items-center gap-4" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
         <div className="p-2 rounded-full" style={{ backgroundColor: '#ccc', color: '#666' }}><Info size={16} /></div>
         <p className="text-[10px] leading-tight uppercase font-bold tracking-widest" style={{ color: '#666' }}>
            Recuerda que las respuestas de los clubes pueden tardar entre 2 y 4 días simulados. Las ofertas aceptadas se completan automáticamente al día siguiente.
         </p>
      </div>
    </div>
  );
};
