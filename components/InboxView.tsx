
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
      case 'MARKET': return <ShoppingBag size={14} style={{ color: '#999' }} />;
      case 'SQUAD': return <Users size={14} style={{ color: '#999' }} />;
      case 'STATEMENTS': return <MessageSquare size={14} style={{ color: '#999' }} />;
      case 'FINANCE': return <Wallet size={14} style={{ color: '#999' }} />;
    }
  };

  const deleteMessage = (id: string, e: React.MouseEvent) => {
     e.stopPropagation();
     world.inbox = world.inbox.filter(m => m.id !== id);
     if (selectedMessageId === id) setSelectedMessageId(null);
     onUpdate();
  };

  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden" style={{ backgroundColor: '#dcdcdc' }}>
      {/* Sidebar List */}
      <div className="w-full lg:w-96 flex flex-col" style={{ backgroundColor: '#f4f4f4', borderRight: '1px solid #999' }}>
        <header className="p-4 border-b shrink-0" style={{ borderColor: '#999' }}>
          <h2 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-2" style={{ color: '#333' }}>
            <Inbox size={20} /> Buzón
          </h2>
          <div className="flex mt-3 gap-1 overflow-x-auto scrollbar-hide">
            {['ALL', 'MARKET', 'SQUAD', 'STATEMENTS'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-3 py-1 text-[9px] font-black uppercase rounded-full border transition-all whitespace-nowrap ${filter === f ? 'shadow-lg' : ''}`}
                style={{
                  backgroundColor: filter === f ? '#666' : 'transparent',
                  borderColor: filter === f ? '#444' : '#999',
                  color: filter === f ? '#fff' : '#666'
                }}
              >
                {f === 'ALL' ? 'Todos' : f}
              </button>
            ))}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ borderTop: '1px solid #999' }}>
          {filteredMessages.length === 0 ? (
            <div className="p-12 text-center italic" style={{ color: '#999' }}>
               <Mail size={32} className="mx-auto mb-2 opacity-30" />
               <p className="text-xs uppercase font-bold tracking-widest">Buzón vacío</p>
            </div>
          ) : (
            filteredMessages.map(m => (
              <div 
                key={m.id}
                onClick={() => handleSelectMessage(m.id)}
                className={`p-4 cursor-pointer transition-all relative group ${selectedMessageId === m.id ? 'border-l-4' : ''} ${!m.isRead ? '' : ''}`}
                style={{
                  backgroundColor: selectedMessageId === m.id ? '#fff' : 'transparent',
                  borderColor: selectedMessageId === m.id ? '#666' : 'transparent',
                  borderBottom: '1px solid #999'
                }}
              >
                <div className="flex justify-between items-start mb-1">
                   <div className="flex items-center gap-2">
                      {getCategoryIcon(m.category)}
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#999' }}>{m.date.toLocaleDateString()}</span>
                   </div>
                   {!m.isRead && <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#666' }}></div>}
                </div>
                <h4 className={`text-sm truncate ${!m.isRead ? 'font-black' : 'font-medium'}`} style={{ color: !m.isRead ? '#333' : '#666' }}>{m.subject}</h4>
                <p className="text-[11px] line-clamp-1" style={{ color: '#999' }}>{m.body}</p>
                
                <button 
                  onClick={(e) => deleteMessage(m.id, e)}
                  className="absolute top-4 right-4 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: '#999' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Content */}
      <div className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: '#dcdcdc' }}>
        {selectedMessage ? (
          <div className="flex-1 flex flex-col p-6 lg:p-10 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-start border-b pb-6 mb-8" style={{ borderColor: '#999' }}>
               <div>
                  <div className="flex items-center gap-3 mb-2">
                     <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border"
                       style={{
                         backgroundColor: selectedMessage.category === 'MARKET' ? 'rgba(102, 102, 102, 0.1)' :
                                        selectedMessage.category === 'SQUAD' ? 'rgba(102, 102, 102, 0.1)' :
                                        'rgba(102, 102, 102, 0.1)',
                         borderColor: '#999',
                         color: '#666'
                       }}>
                        {selectedMessage.category}
                     </span>
                     <span className="text-xs font-mono" style={{ color: '#999' }}>{selectedMessage.date.toLocaleDateString()} {selectedMessage.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <h3 className="text-3xl font-black italic tracking-tighter uppercase" style={{ color: '#333' }}>{selectedMessage.subject}</h3>
               </div>
               <div className="flex items-center gap-2">
                  <div className="p-3 rounded-full" style={{ backgroundColor: '#e8e8e8', color: '#999' }}><Clock size={20} /></div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-4 scrollbar-hide">
               <p className="leading-relaxed text-lg font-medium whitespace-pre-wrap" style={{ color: '#666' }}>
                  {selectedMessage.body}
               </p>
               
               {selectedMessage.category === 'MARKET' && (
                  <div className="mt-10 p-6 rounded-2xl flex items-center justify-between" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#999' }}><ShoppingBag size={24} style={{ color: '#fff' }}/></div>
                        <div>
                           <p className="text-xs font-black uppercase tracking-widest" style={{ color: '#666' }}>Acción sugerida</p>
                           <p className="font-bold" style={{ color: '#333' }}>Revisar el estado en Negociaciones</p>
                        </div>
                     </div>
                     <ChevronRight style={{ color: '#666' }} />
                  </div>
               )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center opacity-20">
             <Inbox size={120} style={{ color: '#999' }} />
             <p className="text-2xl font-black uppercase italic tracking-tighter mt-4" style={{ color: '#999' }}>Selecciona un mensaje</p>
          </div>
        )}
      </div>
    </div>
  );
};
