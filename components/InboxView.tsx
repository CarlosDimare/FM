
import React, { useState, useMemo } from 'react';
import { world } from '../services/worldManager';
import { InboxMessage, MessageCategory } from '../types';
import { Mail, ShoppingBag, Users, MessageSquare, Wallet, Trash2, Clock, CheckCircle, ChevronRight, Inbox } from 'lucide-react';

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
      case 'MARKET': return <ShoppingBag size={14} className="text-blue-400" />;
      case 'SQUAD': return <Users size={14} className="text-green-400" />;
      case 'STATEMENTS': return <MessageSquare size={14} className="text-yellow-400" />;
      case 'FINANCE': return <Wallet size={14} className="text-emerald-400" />;
    }
  };

  const deleteMessage = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     world.inbox = world.inbox.filter(m => m.id !== id);
     if (selectedMessageId === id) setSelectedMessageId(null);
     onUpdate();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full bg-slate-900 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full lg:w-96 border-r border-slate-800 flex flex-col bg-slate-900/50">
        <header className="p-4 border-b border-slate-800 shrink-0">
          <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
            <Inbox size={20} /> Buzón
          </h2>
          <div className="flex mt-3 gap-1 overflow-x-auto scrollbar-hide">
            {['ALL', 'MARKET', 'SQUAD', 'STATEMENTS'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border transition-all whitespace-nowrap ${filter === f ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'border-slate-700 text-slate-500 hover:text-slate-300'}`}
              >
                {f === 'ALL' ? 'Todos' : f}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide divide-y divide-slate-800">
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center text-slate-600 italic">
               <Mail size={32} className="mx-auto mb-2 opacity-20" />
               <p className="text-xs uppercase font-bold tracking-widest">Buzón vacío</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id}
                onClick={() => handleSelectMessage(m.id)}
                className={`p-4 cursor-pointer transition-all hover:bg-slate-800/50 relative group ${selectedMessageId === m.id ? 'bg-slate-800 border-l-4 border-blue-500' : ''} ${!m.isRead ? 'bg-blue-900/10' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-2">
                      {getCategoryIcon(m.category)}
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.date.toLocaleDateString()}</span>
                   </div>
                   {!m.isRead && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>}
                </div>
                <h4 className={`text-sm truncate ${!m.isRead ? 'text-white font-black' : 'text-slate-300 font-medium'}`}>{m.subject}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-1">{m.body}</p>
                
                <button 
                  onClick={(e) => deleteMessage(m.id, e)}
                  className="absolute top-4 right-4 p-1 text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
        {selectedMessage ? (
          <div className="flex-1 flex flex-col p-6 lg:p-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start border-b border-slate-800 pb-6 mb-8">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                        selectedMessage.category === 'MARKET' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        selectedMessage.category === 'SQUAD' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                     }`}>
                        {selectedMessage.category}
                     </span>
                     <span className="text-xs text-slate-500 font-mono">{selectedMessage.date.toLocaleDateString()} {selectedMessage.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">{selectedMessage.subject}</h3>
               </div>
               <div className="flex items-center gap-2">
                  <div className="p-3 bg-slate-800 rounded-full text-slate-500"><Clock size={20} /></div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
               <p className="text-slate-300 leading-relaxed text-lg font-medium whitespace-pre-wrap">
                  {selectedMessage.body}
               </p>
               
               {selectedMessage.category === 'MARKET' && (
                  <div className="mt-10 p-6 bg-blue-900/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white"><ShoppingBag size={24}/></div>
                        <div>
                           <p className="text-xs font-black text-blue-400 uppercase tracking-widest">Acción sugerida</p>
                           <p className="text-slate-200 font-bold">Revisar el estado en Negociaciones</p>
                        </div>
                     </div>
                     <ChevronRight className="text-blue-500" />
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-700 opacity-20">
             <Inbox size={120} />
             <p className="text-2xl font-black uppercase italic tracking-tighter mt-4">Selecciona un mensaje</p>
          </div>
        )}
      </div>
    </div>
  );
};
