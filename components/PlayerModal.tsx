
import React, { useState } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position } from '../types';
import { world } from '../services/worldManager';
import { getAttributeColor, getAttributeBgClass } from '../constants';
import { ProfileNarrativeEngine } from '../services/engine';
import { DialogueSystem } from '../services/dialogueSystem';
import { TransferOfferModal } from './TransferOfferModal';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { X, MessageSquare, Activity, Brain, Zap, Map, BarChart2, DollarSign, FileText, Scale, Ruler, Building2, Calendar, UserCheck } from 'lucide-react';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  userClubId: string;
  currentDate: Date;
}

const AttributeRow: React.FC<{ label: string; value: Attribute }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-[11px] sm:text-sm py-1 border-b group hover:bg-white transition-colors fm-compact" style={{ borderColor: '#e0e0e0' }}>
    <span className="truncate pr-2" style={{ color: '#666' }}>{ATTRIBUTE_LABELS[label] || label}</span>
    <span className={`font-black px-1.5 sm:px-2 rounded min-w-[24px] text-center shadow-inner ${getAttributeBgClass(value)}`}>
      {value}
    </span>
  </div>
);

const POS_MAP: Record<string, { top: string; left: string }> = {
  [Position.GK]: { top: "92%", left: "50%" },
  [Position.SW]: { top: "85%", left: "50%" },
  [Position.DC]: { top: "80%", left: "50%" },
  [Position.DRC]: { top: "80%", left: "65%" },
  [Position.DLC]: { top: "80%", left: "35%" },
  [Position.DR]: { top: "80%", left: "85%" },
  [Position.DL]: { top: "80%", left: "15%" },
  [Position.DM]: { top: "65%", left: "50%" },
  [Position.DMC]: { top: "65%", left: "50%" },
  [Position.DMR]: { top: "65%", left: "75%" },
  [Position.DML]: { top: "65%", left: "25%" },
  [Position.MC]: { top: "50%", left: "50%" },
  [Position.MCR]: { top: "50%", left: "65%" },
  [Position.MCL]: { top: "50%", left: "35%" },
  [Position.MR]: { top: "50%", left: "85%" },
  [Position.ML]: { top: "50%", left: "15%" },
  [Position.AM]: { top: "35%", left: "50%" },
  [Position.AMC]: { top: "35%", left: "50%" },
  [Position.AMR]: { top: "35%", left: "80%" },
  [Position.AML]: { top: "35%", left: "20%" },
  [Position.ST]: { top: "15%", left: "50%" },
  [Position.STC]: { top: "15%", left: "50%" },
  [Position.STR]: { top: "15%", left: "70%" },
  [Position.STL]: { top: "15%", left: "30%" }
};

const PositionMarker: React.FC<{ pos: Position, isPrimary?: boolean }> = ({ pos, isPrimary }) => {
   const coords = POS_MAP[pos];
   if (!coords) return null;
   return (
       <div 
          className="absolute w-6 h-6 sm:w-7 sm:h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white flex items-center justify-center text-[6px] sm:text-[7px] font-black shadow-xl transition-transform hover:scale-110"
          style={{ 
            top: coords.top, 
            left: coords.left,
            backgroundColor: isPrimary ? '#666' : '#999',
            color: isPrimary ? '#fff' : '#ccc'
          }}
       >
          {pos}
       </div>
   );
};

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, userClubId, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'INTERACTION' | 'POSITIONS' | 'STATS' | 'CONTRACT'>('PROFILE');
  const [dialogueResult, setDialogueResult] = useState<DialogueResult | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);

  if (!player) return null;
  const isUserPlayer = player.clubId === userClubId;
  const club = world.getClub(player.clubId);
  const report = ProfileNarrativeEngine.generateScoutingReport(player);

  const handleInteraction = (type: DialogueType) => {
     const result = DialogueSystem.getPlayerReaction(player, type);
     player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
     setDialogueResult(result);
  };

  const avgRating = player.seasonStats.appearances > 0 
    ? (player.seasonStats.totalRating / player.seasonStats.appearances).toFixed(2)
    : "0.00";

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'TRANSFERABLE': return 'En Venta';
      case 'LOANABLE': return 'Cedible';
      case 'NONE': return 'Intransferible';
      default: return status;
    }
  };

  const isRenewalBlocked = player.negotiationAttempts >= 3;

  return (
    <>
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="metallic-panel w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] md:rounded-lg shadow-2xl border-x md:border flex flex-col overflow-hidden fm-compact" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
          {/* Top Banner FM Style */}
          <div className="h-1.5 w-full" style={{ backgroundColor: club?.primaryColor || '#0066cc' }}></div>
          
          {/* Header */}
          <div className="p-4 sm:p-6 flex justify-between items-start border-b" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                 <h2 className="text-2xl sm:text-4xl font-black truncate drop-shadow-md tracking-tighter uppercase italic" style={{ color: '#333' }}>{player.name}</h2>
                 <div className="text-[10px] sm:text-xs font-black uppercase tracking-widest truncate px-2 py-0.5 rounded border" style={{ color: '#0066cc', backgroundColor: '#e6f3ff', borderColor: '#0066cc' }}>{club?.name}</div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                 <span className="text-sm sm:text-lg font-mono font-black" style={{ color: '#ff9900' }}>{player.positions[0]}</span>
                 <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: '#ccc' }}></div>
                 <span className="text-[10px] sm:text-sm font-bold uppercase tracking-tight" style={{ color: '#666' }}>
                    {player.nationality} • {player.age} años
                 </span>
                 <div className="h-4 w-px hidden sm:block" style={{ backgroundColor: '#ccc' }}></div>
                 <div className="flex items-center gap-1.5 text-[10px] sm:text-sm font-bold" style={{ color: '#666' }}>
                    <Ruler size={14} className="text-gray-400" /> {player.height} cm
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] sm:text-sm font-bold" style={{ color: '#666' }}>
                    <Scale size={14} className="text-gray-400" /> {player.weight} kg
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 shrink-0">
              <button onClick={onClose} className="text-gray-500 hover:text-black transition-colors p-1">
                <X size={28} />
              </button>
              {!isUserPlayer && (
                 <button 
                   onClick={() => setShowOfferModal(true)}
                   className="px-4 py-2 sm:px-8 sm:py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95 border"
                   style={{ backgroundColor: '#009900', color: '#fff', borderColor: '#006600' }}
                 >
                   <DollarSign size={14} /> <span className="hidden xs:inline">Hacer Oferta</span>
                 </button>
              )}
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b overflow-x-auto whitespace-nowrap scrollbar-hide px-2 fm-compact" style={{ backgroundColor: '#f0f0f0', borderColor: '#ccc' }}>
             {[
                { id: 'PROFILE', label: 'Atributos', icon: Activity },
                { id: 'POSITIONS', label: 'Posiciones', icon: Map },
                { id: 'STATS', label: 'Estadísticas', icon: BarChart2 },
                { id: 'CONTRACT', label: 'Contrato', icon: FileText },
                { id: 'INTERACTION', label: 'Conversación', icon: MessageSquare }
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setDialogueResult(null); }}
                  className={`px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id ? 'border-black' : 'border-transparent'}`}
                  style={{ color: activeTab === tab.id ? '#000' : '#666', backgroundColor: activeTab === tab.id ? '#fff' : 'transparent' }}
               >
                  <tab.icon size={14} />
                  {tab.label}
               </button>
             ))}
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-8" style={{ backgroundColor: '#e8e8e8' }}>
            {activeTab === 'PROFILE' && (
               <div className="flex flex-col gap-6 animate-in fade-in duration-300 fm-compact">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 rounded-xl border shadow-inner metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                      <div className="flex items-center gap-2 mb-4">
                         <Zap size={14} style={{ color: '#0066cc' }} />
                         <h3 className="font-black text-[10px] uppercase tracking-widest" style={{ color: '#0066cc' }}>Técnica</h3>
                      </div>
                      <div className="space-y-0.5">{Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                    </div>
                    <div className="p-4 rounded-xl border shadow-inner metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                      <div className="flex items-center gap-2 mb-4">
                         <Brain size={14} style={{ color: '#ff9900' }} />
                         <h3 className="font-black text-[10px] uppercase tracking-widest" style={{ color: '#ff9900' }}>Mental</h3>
                      </div>
                      <div className="space-y-0.5">{Object.entries(player.stats.mental).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="p-4 rounded-xl border shadow-inner metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                        <div className="flex items-center gap-2 mb-4">
                           <Activity size={14} style={{ color: '#009900' }} />
                           <h3 className="font-black text-[10px] uppercase tracking-widest" style={{ color: '#009900' }}>Físico</h3>
                        </div>
                        <div className="space-y-0.5">{Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                      </div>
                      
                      <div className="p-4 rounded-xl border flex-1" style={{ backgroundColor: '#e6f3ff', borderColor: '#0066cc' }}>
                         <h3 className="text-[9px] font-black uppercase tracking-[0.2em] mb-3" style={{ color: '#0066cc' }}>Informe del Ojeador</h3>
                         <div className="space-y-2">
                           {report.map((line, i) => (
                             <p key={i} className="text-[11px] italic leading-relaxed" style={{ color: '#333' }}> "{line}" </p>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Morale and Fitness Bar for FM feel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="p-3 rounded-lg border flex items-center justify-between metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#666' }}>Forma Física</span>
                        <div className="flex items-center gap-3 w-1/2">
                           <div className="flex-1 h-1.5 rounded-full overflow-hidden border" style={{ backgroundColor: '#e0e0e0', borderColor: '#999' }}>
                              <div className={`h-full transition-all`} style={{ width: `${player.fitness}%`, backgroundColor: player.fitness > 90 ? '#009900' : '#ff9900' }}></div>
                           </div>
                           <span className="text-xs font-mono font-black" style={{ color: '#333' }}>{player.fitness}%</span>
                        </div>
                     </div>
                     <div className="p-3 rounded-lg border flex items-center justify-between metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: '#666' }}>Moral</span>
                        <div className="flex items-center gap-3 w-1/2">
                           <div className="flex-1 h-1.5 rounded-full overflow-hidden border" style={{ backgroundColor: '#e0e0e0', borderColor: '#999' }}>
                              <div className={`h-full transition-all`} style={{ width: `${player.morale}%`, backgroundColor: player.morale > 70 ? '#00cc00' : player.morale > 40 ? '#ffcc00' : '#cc0000' }}></div>
                           </div>
                           <span className="text-xs font-mono font-black" style={{ color: '#333' }}>{player.morale}%</span>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'CONTRACT' && (
                <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 fm-compact">
                   <div className="rounded-2xl border p-8 shadow-xl metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                      <h3 className="text-xl font-black uppercase italic tracking-tighter mb-8 flex items-center gap-3 pb-4" style={{ color: '#333', borderBottom: '1px solid #ccc' }}>
                         <FileText style={{ color: '#666' }} /> Detalles del Vínculo
                      </h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                         <div className="space-y-6">
                            <div>
                               <label className="text-[10px] font-black uppercase tracking-widest block mb-1 flex items-center gap-2" style={{ color: '#666' }}>
                                  <Building2 size={12} /> Club Propietario
                               </label>
                               <p className="text-lg font-bold" style={{ color: '#333' }}>{club?.name}</p>
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase tracking-widest block mb-1 flex items-center gap-2" style={{ color: '#666' }}>
                                  <Calendar size={12} /> Vence el
                               </label>
                               <p className="text-lg font-bold" style={{ color: '#666' }}>{player.contractExpiry.toLocaleDateString()}</p>
                            </div>
                            <div>
                               <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#666' }}>Estatus</label>
                               <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border"
                                 style={{ 
                                    color: player.transferStatus === 'TRANSFERABLE' ? '#999' :
                                           player.transferStatus === 'LOANABLE' ? '#666' :
                                           '#666',
                                    borderColor: '#999',
                                    backgroundColor: player.transferStatus === 'TRANSFERABLE' ? 'rgba(153, 153, 153, 0.2)' :
                                                   player.transferStatus === 'LOANABLE' ? 'rgba(102, 102, 102, 0.2)' :
                                                   'rgba(102, 102, 102, 0.2)'
                                 }}>
                                  {getStatusLabel(player.transferStatus)}
                               </span>
                            </div>
                         </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#666' }}>Valor Estimado</label>
                              <p className="text-3xl font-black tracking-tighter" style={{ color: '#009900' }}>£{player.value.toLocaleString()}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#666' }}>Salario Mensual</label>
                              <p className="text-xl font-bold" style={{ color: '#333' }}>£{player.salary.toLocaleString()}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black uppercase tracking-widest block mb-1" style={{ color: '#666' }}>Salario Anual</label>
                              <p className="text-sm font-medium" style={{ color: '#666' }}>£{(player.salary * 12).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>

                     {isUserPlayer && (
                        <div className="mt-12 flex flex-col gap-4">
                           <button 
                             onClick={() => setShowRenewalModal(true)}
                             disabled={isRenewalBlocked}
                             className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl border ${isRenewalBlocked ? 'cursor-not-allowed opacity-50' : ''}`}
                             style={{ 
                               backgroundColor: isRenewalBlocked ? '#ccc' : '#0066cc',
                               color: isRenewalBlocked ? '#666' : '#fff',
                               borderColor: isRenewalBlocked ? '#999' : '#004499'
                             }}
                           >
                              <UserCheck size={20} /> Ofrecer Nuevo Contrato
                           </button>
                           {isRenewalBlocked && (
                              <p className="text-[10px] font-bold text-center uppercase tracking-widest" style={{ color: '#cc0000' }}>
                                 ⚠️ El jugador se niega a negociar tras los rechazos anteriores.
                              </p>
                           )}
                           {player.isUnhappyWithContract && !isRenewalBlocked && (
                              <p className="text-[10px] font-bold text-center uppercase tracking-widest animate-pulse" style={{ color: '#ff9900' }}>
                                 📢 El jugador solicita una revisión de su contrato actual.
                              </p>
                           )}
                        </div>
                     )}

                      <div className="mt-8 p-4 rounded-xl border italic text-center" style={{ backgroundColor: '#e8e8e8', borderColor: '#ccc' }}>
                         <p className="text-xs" style={{ color: '#666' }}>
                           "El jugador se siente {(player.morale > 70) ? 'muy contento' : 'un poco inquieto'} con las condiciones actuales de su contrato."
                         </p>
                      </div>
                  </div>
               </div>
            )}

            {activeTab === 'POSITIONS' && (
               <div className="flex flex-col items-center animate-in zoom-in duration-300 fm-compact">
                  <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[68/105] shadow-2xl fm-pitch border-4 rounded-lg overflow-hidden" style={{ borderColor: '#333' }}>
                      {player.positions.map(p => <PositionMarker key={p} pos={p} isPrimary />)}
                      {player.secondaryPositions.map(p => <PositionMarker key={p} pos={p} />)}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
                     <div className="text-center p-3 rounded-lg border metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                        <p className="text-[10px] font-black uppercase mb-1" style={{ color: '#666' }}>Pierna Hábil</p>
                        <p className="text-sm font-bold" style={{ color: '#333' }}>Derecha</p>
                     </div>
                     <div className="text-center p-3 rounded-lg border metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                        <p className="text-[10px] font-black uppercase mb-1" style={{ color: '#666' }}>Rol Sugerido</p>
                        <p className="text-sm font-black" style={{ color: '#0066cc' }}>{player.positions[0]}</p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'STATS' && (
               <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-300 fm-compact">
                  <div className="rounded-2xl border divide-y overflow-hidden shadow-2xl metallic-panel" style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}>
                     <div className="p-6" style={{ backgroundColor: '#e8e8e8', borderBottom: '1px solid #ccc' }}>
                        <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: '#666' }}>Estadísticas de Temporada</h3>
                     </div>
                     <div className="flex justify-between p-4 px-8 items-center" style={{ borderBottom: '1px solid #e0e0e0' }}><span className="font-bold" style={{ color: '#333' }}>Partidos Jugados</span><span className="font-mono font-black text-lg" style={{ color: '#000' }}>{player.seasonStats.appearances}</span></div>
                     <div className="flex justify-between p-4 px-8 items-center" style={{ borderBottom: '1px solid #e0e0e0' }}><span className="font-bold" style={{ color: '#333' }}>Goles Marcados</span><span className="font-mono font-black text-lg" style={{ color: '#009900' }}>{player.seasonStats.goals}</span></div>
                     <div className="flex justify-between p-4 px-8 items-center" style={{ borderBottom: '1px solid #e0e0e0' }}><span className="font-bold" style={{ color: '#333' }}>Asistencias</span><span className="font-mono font-black text-lg" style={{ color: '#0066cc' }}>{player.seasonStats.assists}</span></div>
                     <div className="flex justify-between p-4 px-8 items-center" style={{ borderBottom: '1px solid #e0e0e0' }}><span className="font-bold" style={{ color: '#333' }}>Porterías a Cero</span><span className="font-mono font-black text-lg" style={{ color: '#666' }}>{player.seasonStats.cleanSheets}</span></div>
                     <div className="flex justify-between p-6 px-8 items-center" style={{ backgroundColor: '#e6f3ff' }}><span className="font-black uppercase tracking-widest text-xs" style={{ color: '#0066cc' }}>Puntuación Media</span><span className="text-2xl font-black drop-shadow-sm" style={{ color: '#000' }}>{avgRating}</span></div>
                  </div>
               </div>
            )}

            {activeTab === 'INTERACTION' && (
               <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-in fade-in duration-300 fm-compact">
                  {isUserPlayer ? (
                     <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-widest text-center mb-6" style={{ color: '#666' }}>Charla con el Jugador</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                           {[
                              { id: 'PRAISE_FORM', label: 'Elogiar Estado de Forma' },
                              { id: 'CRITICIZE_FORM', label: 'Criticar Rendimiento' },
                              { id: 'PRAISE_TRAINING', label: 'Felicitar por Entrenamiento' },
                              { id: 'DEMAND_MORE', label: 'Exigir más Ambición' }
                           ].map(t => (
                             <button 
                                key={t.id} 
                                onClick={() => handleInteraction(t.id as any)} 
                                className="text-left p-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-lg active:scale-95 border metallic-panel"
                                style={{ backgroundColor: '#f4f4f4', borderColor: '#999' }}
                                onMouseEnter={(e) => { 
                                   e.currentTarget.style.backgroundColor = '#0066cc'; 
                                   e.currentTarget.style.color = '#fff'; 
                                   e.currentTarget.style.borderColor = '#004499';
                                }}
                                onMouseLeave={(e) => { 
                                   e.currentTarget.style.backgroundColor = '#f4f4f4'; 
                                   e.currentTarget.style.color = '#333';
                                   e.currentTarget.style.borderColor = '#999';
                                }}
                             >
                                {t.label}
                             </button>
                           ))}
                        </div>
                     </div>
                  ) : (
                     <div className="py-20 text-center space-y-4 opacity-40">
                        <MessageSquare size={64} className="mx-auto" style={{ color: '#999' }} />
                        <p className="italic font-medium" style={{ color: '#666' }}>Solo puedes interactuar directamente con jugadores de tu propia plantilla.</p>
                     </div>
                  )}
                  
                  {dialogueResult && (
                     <div className="mt-8 p-8 rounded-2xl border-2 text-center animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden" style={{ backgroundColor: '#f4f4f4', borderColor: '#0066cc' }}>
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#0066cc' }}></div>
                        <p className="text-lg italic font-medium" style={{ color: '#333' }}>"{dialogueResult.text}"</p>
                        <div className="mt-4 flex justify-center gap-2">
                           <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                              dialogueResult.reactionType === 'POSITIVE' ? 'text-green-600 border-green-600' :
                              dialogueResult.reactionType === 'NEGATIVE' ? 'text-red-600 border-red-600' : 'text-gray-600 border-gray-600'
                           }`} style={{ 
                              backgroundColor: dialogueResult.reactionType === 'POSITIVE' ? '#e6ffe6' :
                              dialogueResult.reactionType === 'NEGATIVE' ? '#ffe6e6' : '#e8e8e8'
                           }}>
                              Reacción {dialogueResult.reactionType}
                           </div>
                        </div>
                     </div>
                  )}
               </div>
            )}
          </div>
        </div>
      </div>

      {showOfferModal && <TransferOfferModal player={player} userClubId={userClubId} onClose={() => setShowOfferModal(false)} onOfferMade={() => {}} currentDate={currentDate} />}
      {showRenewalModal && (
         <ContractNegotiationModal 
            player={player} 
            userClubId={userClubId} 
            currentDate={currentDate} 
            onClose={() => setShowRenewalModal(false)} 
            onRenewed={() => { setShowRenewalModal(false); }}
         />
      )}
    </>
  );
};
