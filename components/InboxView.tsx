import React, { useState, useMemo } from 'react';
import { world } from '../services/worldManager';
import { InboxMessage, MessageCategory } from '../types';
import { Mail, ShoppingBag, Users, MessageSquare, Wallet, Trash2, Clock, CheckCircle, ChevronRight, Inbox, Trophy } from 'lucide-react';

interface InboxViewProps {
  onUpdate: () => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ onUpdate }) => {
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'ALL' | MessageCategory>('ALL');

  const filteredMessages = useMemo(() => {
    return world.inbox.filter(m => filter === 'ALL' || m.category === filter);
  }, [filter, world.inbox.length]);

  const selectedMessage = useMemo(() => {
    return world.inbox.find(m => m.id === selectedMessageId);
  }, [selectedMessageId]);

  const handleSelectMessage = (id: string) => {
    setSelectedMessageId(id);
    const msg = world.inbox.find(m => m.id === id);
    if (msg && !msg.isRead) {
      msg.isRead = true;
      onUpdate();
    }
  };

  const getCategoryIcon = (cat: MessageCategory) => {
    switch (cat) {
      case 'MARKET': return <ShoppingBag size={14} className="text-blue-700" />;
      case 'SQUAD': return <Users size={14} className="text-green-700" />;
      case 'STATEMENTS': return <MessageSquare size={14} className="text-amber-700" />;
      case 'FINANCE': return <Wallet size={14} className="text-emerald-700" />;
      case 'COMPETITION': return <Trophy size={14} className="text-yellow-700" />;
    }
  };

  const deleteMessage = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     world.inbox = world.inbox.filter(m => m.id !== id);
     if (selectedMessageId === id) setSelectedMessageId(null);
     onUpdate();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-400 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full lg:w-96 border-r border-slate-500 flex flex-col bg-slate-200 shadow-xl">
        <header className="p-4 bg-slate-300 border-b border-slate-500 shrink-0">
          <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tighter flex items-center gap-2">
            <Inbox size={20} /> CORREO
          </h2>
          <div className="flex mt-3 gap-1 overflow-x-auto scrollbar-hide">
            {[
              { id: 'ALL', label: 'Todos' },
              { id: 'MARKET', label: 'Mercado' },
              { id: 'SQUAD', label: 'Plantel' },
              { id: 'STATEMENTS', label: 'Prensa' },
              { id: 'COMPETITION', label: 'Torneo' }
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id as any)}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-sm border transition-all whitespace-nowrap ${filter === f.id ? 'bg-slate-800 border-slate-950 text-white shadow-md' : 'bg-slate-100 border-slate-400 text-slate-600 hover:border-slate-500'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-400 bg-slate-200">
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-slate-500 italic">
               <Mail size={32} className="mx-auto mb-2 opacity-20" />
               <p className="text-[10px] uppercase font-black tracking-widest">Sin Mensajes</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id}
                onClick={() => handleSelectMessage(m.id)}
                className={`p-4 cursor-pointer transition-all hover:bg-slate-300 relative group ${selectedMessageId === m.id ? 'bg-slate-400/30 border-l-4 border-slate-950' : ''} ${!m.isRead ? 'bg-slate-300/50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-2">
                      {getCategoryIcon(m.category)}
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest font-mono">{m.date.toLocaleDateString()}</span>
                   </div>
                   {!m.isRead && <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>}
                </div>
                <h4 className={`text-sm truncate uppercase tracking-tight ${!m.isRead ? 'text-slate-950 font-black italic' : 'text-slate-700 font-bold'}`}>{m.subject}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-1 font-medium italic">{m.body}</p>
                
                <button 
                  onClick={(e) => deleteMessage(m.id, e)}
                  className="absolute top-4 right-4 p-1 text-slate-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 flex flex-col bg-slate-300 overflow-hidden">
        {selectedMessage ? (
          <div className="flex-1 flex flex-col m-6 bg-slate-100 border border-slate-500 rounded-sm shadow-2xl p-6 lg:p-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start border-b-2 border-slate-300 pb-6 mb-8">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <span className={`px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest border border-slate-400 bg-slate-200 text-slate-800`}>
                        {selectedMessage.category}
                     </span>
                     <span className="text-[11px] text-slate-600 font-mono font-bold">{selectedMessage.date.toLocaleDateString()} • {selectedMessage.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="text-3xl font-black text-slate-950 italic tracking-tighter uppercase">{selectedMessage.subject}</h3>
               </div>
               <div className="p-3 bg-slate-200 rounded-sm border border-slate-400 text-slate-600"><Clock size={20} /></div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 custom-scroll">
               <p className="text-slate-950 leading-relaxed text-lg font-bold italic whitespace-pre-wrap font-serif">
                  {selectedMessage.body}
               </p>
               
               {selectedMessage.category === 'MARKET' && (
                  <div className="mt-10 p-6 bg-slate-200 border border-slate-500 rounded-sm flex items-center justify-between shadow-inner">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-900 rounded-sm flex items-center justify-center text-white"><ShoppingBag size={24}/></div>
                        <div>
                           <p className="text-xs font-black text-slate-950 uppercase tracking-[0.2em]">Acción Requerida</p>
                           <p className="text-slate-700 font-black italic">Ir al centro de negociaciones</p>
                        </div>
                     </div>
                     <ChevronRight className="text-slate-950" />
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-600 opacity-30">
             <Inbox size={120} />
             <p className="text-2xl font-black uppercase italic tracking-widest mt-4">Seleccione un elemento del buzón</p>
          </div>
        )}
      </div>
    </div>
  );
};