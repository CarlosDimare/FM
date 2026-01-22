
import React, { useState } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position } from '../types';
import { world } from '../services/worldManager';
import { getAttributeColor } from '../constants';
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
  <div className="flex justify-between items-center text-[11px] sm:text-sm py-1 border-b border-slate-800/30 group hover:bg-slate-700/20 transition-colors">
    <span className="text-slate-400 truncate pr-2 group-hover:text-slate-200">{ATTRIBUTE_LABELS[label] || label}</span>
    <span className={`font-bold ${getAttributeColor(value)} bg-slate-900/80 px-1.5 sm:px-2 rounded min-w-[24px] text-center shadow-inner`}>
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
         className={`absolute w-6 h-6 sm:w-7 sm:h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white flex items-center justify-center text-[6px] sm:text-[7px] font-black shadow-xl transition-transform hover:scale-110
            ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-500 text-slate-100'}
         `}
         style={{ top: coords.top, left: coords.left }}
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
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="bg-slate-800 w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] md:rounded-lg shadow-2xl border-x md:border border-slate-700 flex flex-col overflow-hidden">
          {/* Top Banner FM Style */}
          <div className={`h-1.5 w-full ${club?.primaryColor || 'bg-blue-600'}`}></div>
          
          {/* Header */}
          <div className="bg-slate-900 p-4 sm:p-6 flex justify-between items-start border-b border-slate-700/50">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-1">
                 <h2 className="text-2xl sm:text-4xl font-black text-white truncate drop-shadow-md tracking-tighter uppercase italic">{player.name}</h2>
                 <div className="text-[10px] sm:text-xs font-black text-blue-400 uppercase tracking-widest truncate bg-blue-900/20 px-2 py-0.5 rounded border border-blue-500/20">{club?.name}</div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                 <span className="text-sm sm:text-lg font-mono font-black text-yellow-500">{player.positions[0]}</span>
                 <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
                 <span className="text-[10px] sm:text-sm text-slate-400 font-bold uppercase tracking-tight">
                    {player.nationality} • {player.age} años
                 </span>
                 <div className="h-4 w-px bg-slate-700 hidden sm:block"></div>
                 <div className="flex items-center gap-1.5 text-[10px] sm:text-sm text-slate-400 font-bold">
                    <Ruler size={14} className="text-slate-500" /> {player.height} cm
                 </div>
                 <div className="flex items-center gap-1.5 text-[10px] sm:text-sm text-slate-400 font-bold">
                    <Scale size={14} className="text-slate-500" /> {player.weight} kg
                 </div>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-3 shrink-0">
              <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1">
                <X size={28} />
              </button>
              {!isUserPlayer && (
                 <button 
                   onClick={() => setShowOfferModal(true)}
                   className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 sm:px-8 sm:py-3 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                 >
                   <DollarSign size={14} /> <span className="hidden xs:inline">Hacer Oferta</span>
                 </button>
              )}
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-slate-700 bg-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-hide px-2">
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
                  className={`px-4 sm:px-6 py-4 text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id ? 'text-blue-400 border-blue-400 bg-slate-900/40' : 'text-slate-500 border-transparent hover:text-slate-300'}`}
               >
                  <tab.icon size={14} />
                  {tab.label}
               </button>
             ))}
          </div>

          {/* Content Area */}
          <div className="overflow-y-auto flex-1 p-4 sm:p-8 bg-slate-900/40">
            {activeTab === 'PROFILE' && (
               <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                      <div className="flex items-center gap-2 mb-4">
                         <Zap size={14} className="text-blue-400" />
                         <h3 className="text-blue-400 font-black text-[10px] uppercase tracking-widest">Técnica</h3>
                      </div>
                      <div className="space-y-0.5">{Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                      <div className="flex items-center gap-2 mb-4">
                         <Brain size={14} className="text-yellow-400" />
                         <h3 className="text-yellow-400 font-black text-[10px] uppercase tracking-widest">Mental</h3>
                      </div>
                      <div className="space-y-0.5">{Object.entries(player.stats.mental).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                    </div>
                    <div className="flex flex-col gap-6">
                      <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/50 shadow-inner">
                        <div className="flex items-center gap-2 mb-4">
                           <Activity size={14} className="text-green-400" />
                           <h3 className="text-green-400 font-black text-[10px] uppercase tracking-widest">Físico</h3>
                        </div>
                        <div className="space-y-0.5">{Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                      </div>
                      
                      <div className="bg-blue-600/5 p-4 rounded-xl border border-blue-500/20 flex-1">
                         <h3 className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] mb-3">Informe del Ojeador</h3>
                         <div className="space-y-2">
                           {report.map((line, i) => (
                             <p key={i} className="text-[11px] text-slate-300 italic leading-relaxed">" {line} "</p>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Morale and Fitness Bar for FM feel */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forma Física</span>
                        <div className="flex items-center gap-3 w-1/2">
                           <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                              <div className={`h-full transition-all ${player.fitness > 90 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${player.fitness}%` }}></div>
                           </div>
                           <span className="text-xs font-mono font-bold text-slate-200">{player.fitness}%</span>
                        </div>
                     </div>
                     <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Moral</span>
                        <div className="flex items-center gap-3 w-1/2">
                           <div className="flex-1 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-700">
                              <div className={`h-full transition-all ${player.morale > 70 ? 'bg-green-400' : player.morale > 40 ? 'bg-yellow-400' : 'bg-red-400'}`} style={{ width: `${player.morale}%` }}></div>
                           </div>
                           <span className="text-xs font-mono font-bold text-slate-200">{player.morale}%</span>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'CONTRACT' && (
               <div className="max-w-2xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="bg-slate-800/60 rounded-2xl border border-slate-700 p-8 shadow-xl">
                     <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3 border-b border-slate-700 pb-4">
                        <FileText className="text-blue-400" /> Detalles del Vínculo
                     </h3>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 flex items-center gap-2">
                                 <Building2 size={12} /> Club Propietario
                              </label>
                              <p className="text-lg font-bold text-white">{club?.name}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 flex items-center gap-2">
                                 <Calendar size={12} /> Vence el
                              </label>
                              <p className="text-lg font-bold text-slate-300">{player.contractExpiry.toLocaleDateString()}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Estatus</label>
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${
                                 player.transferStatus === 'TRANSFERABLE' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                 player.transferStatus === 'LOANABLE' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                                 'bg-green-500/10 text-green-400 border-green-500/20'
                              }`}>
                                 {getStatusLabel(player.transferStatus)}
                              </span>
                           </div>
                        </div>

                        <div className="space-y-6">
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Valor Estimado</label>
                              <p className="text-3xl font-black text-green-400 tracking-tighter">£{player.value.toLocaleString()}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Salario Mensual</label>
                              <p className="text-xl font-bold text-white">£{player.salary.toLocaleString()}</p>
                           </div>
                           <div>
                              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1">Salario Anual</label>
                              <p className="text-sm font-medium text-slate-400">£{(player.salary * 12).toLocaleString()}</p>
                           </div>
                        </div>
                     </div>

                     {isUserPlayer && (
                        <div className="mt-12 flex flex-col gap-4">
                           <button 
                             onClick={() => setShowRenewalModal(true)}
                             disabled={isRenewalBlocked}
                             className={`w-full py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl ${isRenewalBlocked ? 'bg-slate-700 text-slate-500 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
                           >
                              <UserCheck size={20} /> Ofrecer Nuevo Contrato
                           </button>
                           {isRenewalBlocked && (
                              <p className="text-[10px] text-red-400 font-bold text-center uppercase tracking-widest">
                                 ⚠️ El jugador se niega a negociar tras los rechazos anteriores.
                              </p>
                           )}
                           {player.isUnhappyWithContract && !isRenewalBlocked && (
                              <p className="text-[10px] text-yellow-500 font-bold text-center uppercase tracking-widest animate-pulse">
                                 📢 El jugador solicita una revisión de su contrato actual.
                              </p>
                           )}
                        </div>
                     )}

                     <div className="mt-8 p-4 bg-slate-900/60 rounded-xl border border-slate-700 italic text-center">
                        <p className="text-xs text-slate-400">"El jugador se siente {(player.morale > 70) ? 'muy contento' : 'un poco inquieto'} con las condiciones actuales de su contrato."</p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'POSITIONS' && (
               <div className="flex flex-col items-center animate-in zoom-in duration-300">
                  <div className="relative w-full max-w-[340px] sm:max-w-[380px] aspect-[68/105] shadow-2xl bg-[#1a2c26] border-4 border-slate-700 rounded-lg overflow-hidden">
                     <div className="absolute inset-0 opacity-20"><svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none"><rect width="100" height="140" fill="#2d5a40" /><line x1="0" y1="70" x2="100" y2="70" stroke="white" strokeWidth="1" strokeDasharray="2,2"/></svg></div>
                     {player.positions.map(p => <PositionMarker key={p} pos={p} isPrimary />)}
                     {player.secondaryPositions.map(p => <PositionMarker key={p} pos={p} />)}
                  </div>
                  <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-sm">
                     <div className="text-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Pierna Hábil</p>
                        <p className="text-sm font-bold text-white">Derecha</p>
                     </div>
                     <div className="text-center p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Rol Sugerido</p>
                        <p className="text-sm font-bold text-blue-400">{player.positions[0]}</p>
                     </div>
                  </div>
               </div>
            )}

            {activeTab === 'STATS' && (
               <div className="max-w-xl mx-auto space-y-4 animate-in fade-in duration-300">
                  <div className="bg-slate-800/60 rounded-2xl border border-slate-700 divide-y divide-slate-700/50 overflow-hidden shadow-2xl">
                     <div className="p-6 bg-slate-900/50">
                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Estadísticas de Temporada</h3>
                     </div>
                     <div className="flex justify-between p-4 px-8 items-center"><span className="text-slate-300 font-bold">Partidos Jugados</span><span className="font-mono font-black text-lg text-white">{player.seasonStats.appearances}</span></div>
                     <div className="flex justify-between p-4 px-8 items-center"><span className="text-slate-300 font-bold">Goles Marcados</span><span className="font-mono font-black text-lg text-green-400">{player.seasonStats.goals}</span></div>
                     <div className="flex justify-between p-4 px-8 items-center"><span className="text-slate-300 font-bold">Asistencias</span><span className="font-mono font-black text-lg text-blue-400">{player.seasonStats.assists}</span></div>
                     <div className="flex justify-between p-4 px-8 items-center"><span className="text-slate-300 font-bold">Porterías a Cero</span><span className="font-mono font-black text-lg text-slate-400">{player.seasonStats.cleanSheets}</span></div>
                     <div className="flex justify-between p-6 px-8 items-center bg-blue-600/5"><span className="font-black text-blue-400 uppercase tracking-widest text-xs">Puntuación Media</span><span className="text-2xl font-black text-white drop-shadow-sm">{avgRating}</span></div>
                  </div>
               </div>
            )}

            {activeTab === 'INTERACTION' && (
               <div className="flex flex-col gap-6 max-w-2xl mx-auto animate-in fade-in duration-300">
                  {isUserPlayer ? (
                    <div className="space-y-4">
                       <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest text-center mb-6">Charla con el Jugador</h3>
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
                               className="text-left p-4 bg-slate-800/80 border border-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all hover:bg-blue-600 hover:border-blue-400 hover:text-white shadow-lg active:scale-95"
                            >
                               {t.label}
                            </button>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="py-20 text-center space-y-4 opacity-40">
                       <MessageSquare size={64} className="mx-auto text-slate-600" />
                       <p className="text-slate-400 italic font-medium">Solo puedes interactuar directamente con jugadores de tu propia plantilla.</p>
                    </div>
                  )}
                  
                  {dialogueResult && (
                    <div className="mt-8 p-8 bg-slate-800/90 rounded-2xl border-2 border-blue-500/30 text-center animate-in zoom-in duration-300 shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                       <p className="text-lg italic text-slate-200 font-medium">"{dialogueResult.text}"</p>
                       <div className="mt-4 flex justify-center gap-2">
                          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                             dialogueResult.reactionType === 'POSITIVE' ? 'bg-green-500/20 text-green-400' :
                             dialogueResult.reactionType === 'NEGATIVE' ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-400'
                          }`}>
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
