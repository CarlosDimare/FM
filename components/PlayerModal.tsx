
import React, { useState } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position, SquadType, DialogueTone } from '../types';
import { world } from '../services/worldManager';
import { getAttributeColor } from '../constants';
import { ProfileNarrativeEngine } from '../services/engine';
import { DialogueSystem } from '../services/dialogueSystem';
import { TransferOfferModal } from './TransferOfferModal';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { X, MessageSquare, Activity, Map, BarChart2, FileText, History, TrendingUp, TrendingDown, ShieldAlert, ArrowRightLeft, UserX, UserPlus, Users, Heart, ShieldAlert as DisciplineIcon, Award, Zap, ChevronRight, MessageCircle, AlertCircle } from 'lucide-react';
import { FMTable, FMTableCell, FMButton } from './FMUI';
import { getFlagUrl } from '../data/static';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  userClubId: string;
  currentDate: Date;
}

const AttributeRow: React.FC<{ label: string; value: Attribute }> = ({ label, value }) => (
  <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-100 group hover:bg-slate-50 transition-colors">
    <span className="text-slate-600 truncate pr-2 group-hover:text-slate-950 font-medium">{ATTRIBUTE_LABELS[label] || label}</span>
    <span className={`font-bold ${getAttributeColor(value)} bg-slate-100 px-1.5 rounded min-w-[24px] text-center`}>
      {value}
    </span>
  </div>
);

const POS_MAP: Record<string, { top: string; left: string }> = {
  [Position.GK]: { top: "90%", left: "50%" },
  [Position.SW]: { top: "82%", left: "50%" },
  [Position.DC]: { top: "75%", left: "50%" },
  [Position.DRC]: { top: "75%", left: "70%" },
  [Position.DLC]: { top: "75%", left: "30%" },
  [Position.DR]: { top: "75%", left: "85%" },
  [Position.DL]: { top: "75%", left: "15%" },
  [Position.DM]: { top: "60%", left: "50%" },
  [Position.DMC]: { top: "60%", left: "50%" },
  [Position.DMR]: { top: "60%", left: "75%" },
  [Position.DML]: { top: "60%", left: "25%" },
  [Position.MC]: { top: "45%", left: "50%" },
  [Position.MCR]: { top: "45%", left: "70%" },
  [Position.MCL]: { top: "45%", left: "30%" },
  [Position.MR]: { top: "45%", left: "85%" },
  [Position.ML]: { top: "45%", left: "15%" },
  [Position.AM]: { top: "30%", left: "50%" },
  [Position.AMC]: { top: "30%", left: "50%" },
  [Position.AMR]: { top: "30%", left: "80%" },
  [Position.AML]: { top: "30%", left: "20%" },
  [Position.ST]: { top: "12%", left: "50%" },
  [Position.STC]: { top: "12%", left: "50%" },
  [Position.STR]: { top: "12%", left: "70%" },
  [Position.STL]: { top: "12%", left: "30%" }
};

const PositionMarker: React.FC<{ pos: Position, isPrimary?: boolean }> = ({ pos, isPrimary }) => {
   const coords = POS_MAP[pos];
   if (!coords) return null;
   return (
      <div 
         className={`absolute w-8 h-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-black shadow-lg z-10
            ${isPrimary ? 'bg-blue-600 text-white ring-2 ring-blue-400/50' : 'bg-slate-500 text-white opacity-90'}
         `}
         style={{ top: coords.top, left: coords.left }}
      >
         {pos}
      </div>
   );
};

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, userClubId, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'INTERACTION' | 'POSITIONS' | 'STATS' | 'HISTORY' | 'CONTRACT'>('PROFILE');
  const [attributeCategory, setAttributeCategory] = useState<'TECHNICAL' | 'PHYSICAL' | 'MENTAL'>('TECHNICAL');
  
  // Charla state
  const [selectedTopic, setSelectedTopic] = useState<DialogueType | null>(null);
  const [selectedTone, setSelectedTone] = useState<DialogueTone | null>(null);
  const [dialogueResult, setDialogueResult] = useState<DialogueResult | null>(null);
  const [interactionStage, setInteractionStage] = useState<'TOPIC' | 'TONE' | 'RESULT' | 'REPLICA'>('TOPIC');

  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  
  const [, setForceUpdate] = useState(0);

  if (!player) return null;
  const isUserPlayer = player.clubId === userClubId;
  const club = world.getClub(player.clubId);
  const headline = ProfileNarrativeEngine.generateHeadline(player);
  const personality = ProfileNarrativeEngine.getPersonalityLabel(player);
  const playerMotive = DialogueSystem.checkPlayerMotives(player, currentDate);

  const resetCharla = () => {
    setSelectedTopic(null);
    setSelectedTone(null);
    setDialogueResult(null);
    setInteractionStage('TOPIC');
  };

  const handleTopicSelect = (type: DialogueType) => {
    setSelectedTopic(type);
    setInteractionStage('TONE');
  };

  const handleToneSelect = (tone: DialogueTone) => {
     if (!selectedTopic) return;
     const result = DialogueSystem.getPlayerReaction(player, selectedTopic, tone, currentDate);
     player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
     setSelectedTone(tone);
     setDialogueResult(result);
     setInteractionStage('RESULT');
  };

  const handleMotiveAction = (action: 'PROMISE' | 'IGNORE') => {
    const result = DialogueSystem.resolveInitiatedMotive(player, action, currentDate);
    player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
    setDialogueResult(result);
    setInteractionStage('RESULT');
  };

  const handleReplica = () => {
     if (!selectedTone) return;
     const result = DialogueSystem.getReplicaResponse(player, selectedTone);
     player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
     setDialogueResult(result);
     setInteractionStage('REPLICA');
  };

  const changeSquad = (newSquad: SquadType) => {
     player.squad = newSquad;
     if (newSquad !== 'SENIOR') {
        player.isStarter = false;
        player.tacticalPosition = undefined;
     }
     setForceUpdate(prev => prev + 1);
  };

  const toggleStatus = (type: 'TRANSFERABLE' | 'LOANABLE') => {
     player.transferStatus = player.transferStatus === type ? 'NONE' : type;
     setForceUpdate(prev => prev + 1);
  };

  const handleRescind = () => {
     if (confirm("¿Estás seguro de rescindir el contrato? Deberás pagar una compensación.")) {
        world.rescindContract(player.id, currentDate);
        onClose();
     }
  };

  const avgRating = player.seasonStats.appearances > 0 
    ? (player.seasonStats.totalRating / player.seasonStats.appearances).toFixed(2)
    : "0.00";

  const headerClasses = club 
      ? `${club.primaryColor} ${club.secondaryColor}` 
      : 'bg-slate-900 text-white';

  const borderColor = club && club.primaryColor === 'bg-white' ? 'border-slate-300' : 'border-black/20';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] md:rounded-sm shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
          {/* Dynamic Header Reordered */}
          <div className={`${headerClasses} p-4 md:p-6 flex justify-between items-start border-b ${borderColor}`}>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col gap-y-1 mb-2">
                 <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                    <h2 className="text-2xl md:text-3xl font-black truncate tracking-tighter uppercase italic drop-shadow-sm flex items-center gap-2">
                        <img 
                          src={getFlagUrl(player.nationality)} 
                          alt={player.nationality} 
                          className="w-6 h-4 md:w-8 md:h-5 object-cover shadow-sm rounded-[1px]" 
                        />
                        {player.name}
                    </h2>
                    <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded border border-white/30 backdrop-blur-sm self-center">{club?.name}</div>
                 </div>

                 {/* 1. Metadata below Name */}
                 <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-black uppercase text-[10px] tracking-tight opacity-90 mt-1">
                    <span className="text-xs bg-black/10 px-2 rounded-sm">{player.positions[0]}</span>
                    <span>{player.nationality}</span>
                    <span className="opacity-60 font-normal">•</span>
                    <span>{player.age} AÑOS</span>
                    <span className="opacity-60 font-normal">•</span>
                    <span>{player.height} CM</span>
                    <span className="opacity-60 font-normal">•</span>
                    <span>{player.weight} KG</span>
                 </div>

                 {/* 2. Headline below metadata */}
                 <div className="text-xs md:text-sm text-current opacity-95 font-black uppercase italic tracking-tight leading-tight mt-2">
                    "{headline}"
                 </div>

                 {/* 3. Personality below headline */}
                 <div className="flex flex-wrap gap-2 mt-2">
                    <div className="flex items-center gap-1 bg-black/20 text-current px-2 py-0.5 rounded border border-white/20" title="Personalidad">
                        <span className="text-[8px] font-black uppercase">{personality}</span>
                    </div>

                    {player.developmentTrend === 'RISING' && (
                       <div className="flex items-center gap-1 bg-green-500/20 text-current px-2 py-0.5 rounded border border-green-500/30" title="En progresión">
                          <TrendingUp size={10} className="text-green-400" /> <span className="text-[8px] font-black uppercase">Mejorando</span>
                       </div>
                    )}

                    {playerMotive && (
                       <div className="flex items-center gap-1 bg-orange-600 text-white px-2 py-0.5 rounded border border-orange-700 shadow-sm" title="Conflictivo">
                          <AlertCircle size={10} className="text-white" /> <span className="text-[8px] font-black uppercase tracking-tighter">Descontento</span>
                       </div>
                    )}
                 </div>
              </div>
            </div>
            
            <button onClick={onClose} className="opacity-70 hover:opacity-100 transition-opacity"><X size={24} /></button>
          </div>

          <div className="flex border-b border-slate-300 bg-slate-50 justify-between md:justify-start">
             {[
                { id: 'PROFILE', label: 'Atributos', icon: Activity },
                { id: 'POSITIONS', label: 'Posiciones', icon: Map },
                { id: 'STATS', label: 'Estadísticas', icon: BarChart2 },
                { id: 'HISTORY', label: 'Historial', icon: History },
                { id: 'CONTRACT', label: 'Contrato', icon: FileText },
                { id: 'INTERACTION', label: 'Charla', icon: MessageSquare }
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); resetCharla(); }}
                  title={tab.label}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-4 transition-all border-b-2 ${activeTab === tab.id ? 'text-slate-950 border-slate-950 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
               >
                  <tab.icon size={18} className="mx-auto" />
               </button>
             ))}
          </div>

          <div className="overflow-y-auto flex-1 p-4 md:p-8 bg-white">
            {activeTab === 'PROFILE' && (
               <div className="space-y-6">
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-sm mb-4">
                     {['TECHNICAL', 'PHYSICAL', 'MENTAL'].map(cat => (
                        <button 
                           key={cat}
                           onClick={() => setAttributeCategory(cat as any)}
                           className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${attributeCategory === cat ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                           {cat === 'TECHNICAL' ? 'Técnica' : cat === 'PHYSICAL' ? 'Físico' : 'Mental'}
                        </button>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:hidden">
                     {attributeCategory === 'TECHNICAL' && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                           {Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}
                        </div>
                     )}
                     {attributeCategory === 'PHYSICAL' && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                           {Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}
                        </div>
                     )}
                     {attributeCategory === 'MENTAL' && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                           {Object.entries(player.stats.mental).filter(([k]) => !['professionalism','ambition','pressure','temperament','loyalty','adaptability','sportsmanship'].includes(k)).map(([k,v]) => <AttributeRow key={k} label={k} value={v as number}/>)}
                           <div className="mt-4 pt-4 border-t border-slate-100">
                              <div className="flex items-center justify-center gap-2 bg-slate-100 text-slate-800 px-3 py-2 rounded border border-slate-200 shadow-sm">
                                 <span className="text-[10px] font-black uppercase tracking-widest">{personality}</span>
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  <div className="hidden md:grid md:grid-cols-3 gap-8">
                     <div className="space-y-4">
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Técnica</h3>
                        <div className="space-y-0.5">{Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Físico</h3>
                        <div className="space-y-0.5">{Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Mental</h3>
                        <div className="space-y-0.5">
                           {Object.entries(player.stats.mental).filter(([k]) => !['professionalism','ambition','pressure','temperament','loyalty','adaptability','sportsmanship'].includes(k)).map(([k,v]) => <AttributeRow key={k} label={k} value={v as number}/>)}
                        </div>
                        <div className="mt-4 pt-2">
                           <div className="flex items-center justify-center gap-2 bg-slate-100 text-slate-800 px-3 py-2 rounded border border-slate-200 shadow-sm hover:bg-slate-200 transition-colors">
                              <span className="text-[10px] font-black uppercase tracking-widest">{personality}</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
            {activeTab === 'POSITIONS' && (
               <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="relative w-full max-w-[320px] aspect-[68/105] shadow-2xl bg-[#1e3a29] border-4 border-slate-300 rounded-sm overflow-hidden ring-4 ring-slate-100">
                     <svg width="100%" height="100%" viewBox="0 0 68 105" className="absolute inset-0 w-full h-full">
                        <defs>
                           <pattern id="grass" width="68" height="10" patternUnits="userSpaceOnUse">
                              <rect width="68" height="5" fill="#2d5a40" />
                              <rect y="5" width="68" height="5" fill="#35684a" />
                           </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grass)" />
                        <g fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1">
                           <rect x="2" y="2" width="64" height="101" />
                           <line x1="2" y1="52.5" x2="66" y2="52.5" />
                           <circle cx="34" cy="52.5" r="9" />
                           <circle cx="34" cy="52.5" r="0.5" fill="white" />
                           <rect x="19" y="2" width="30" height="16" />
                           <rect x="26" y="2" width="16" height="5.5" />
                           <rect x="19" y="87" width="30" height="16" />
                           <rect x="26" y="97.5" width="16" height="5.5" />
                           <path d="M 26,18 A 9,9 0 0,0 42,18" />
                           <path d="M 26,87 A 9,9 0 0,1 42,87" />
                           <path d="M 2,5 A 3,3 0 0,0 5,2" />
                           <path d="M 63,2 A 3,3 0 0,0 66,5" />
                           <path d="M 2,100 A 3,3 0 0,1 5,103" />
                           <path d="M 66,100 A 3,3 0 0,0 63,103" />
                        </g>
                     </svg>
                     {player.positions.map(p => <PositionMarker key={p} pos={p} isPrimary />)}
                     {player.secondaryPositions.map(p => <PositionMarker key={p} pos={p} />)}
                  </div>
                  <p className="mt-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Disposición Táctica Preferida</p>
               </div>
            )}
            {activeTab === 'CONTRACT' && (
               <div className="max-w-2xl mx-auto space-y-8">
                  <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-8">
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase">Valor Estimado</label><p className="text-3xl font-black text-slate-900 tracking-tighter">£{player.value.toLocaleString()}</p></div>
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase">Salario Mensual</label><p className="text-xl font-bold text-slate-700">£{player.salary.toLocaleString()}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-bold pb-6 border-b border-slate-200">
                     <div className="flex justify-between"><span className="text-slate-500">Vencimiento</span><span className="text-slate-900">{player.contractExpiry.toLocaleDateString()}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Estatus</span><span className="text-slate-900 uppercase text-[10px]">{player.transferStatus}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Plantel</span><span className="text-slate-900 uppercase text-[10px]">{player.squad}</span></div>
                  </div>

                  {isUserPlayer && (
                     <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <FMButton onClick={() => setShowRenewalModal(true)} variant="primary" className="w-full">
                           <FileText size={12} /> Renovar Contrato
                        </FMButton>
                        <FMButton onClick={handleRescind} variant="danger" className="w-full">
                           <UserX size={12} /> Rescindir
                        </FMButton>
                        <FMButton 
                           onClick={() => toggleStatus('TRANSFERABLE')} 
                           variant={player.transferStatus === 'TRANSFERABLE' ? 'secondary' : 'primary'} 
                           className={`w-full ${player.transferStatus === 'TRANSFERABLE' ? 'bg-orange-100 border-orange-300 text-orange-800' : ''}`}
                        >
                           <ArrowRightLeft size={12} /> {player.transferStatus === 'TRANSFERABLE' ? 'No Transferible' : 'Transferible'}
                        </FMButton>
                        <FMButton 
                           onClick={() => toggleStatus('LOANABLE')} 
                           variant={player.transferStatus === 'LOANABLE' ? 'secondary' : 'primary'}
                           className={`w-full ${player.transferStatus === 'LOANABLE' ? 'bg-blue-100 border-blue-300 text-blue-800' : ''}`}
                        >
                           <ShieldAlert size={12} /> {player.transferStatus === 'LOANABLE' ? 'No Cedible' : 'Cedible'}
                        </FMButton>
                        {player.squad !== 'SENIOR' && (
                           <FMButton onClick={() => changeSquad('SENIOR')} variant="secondary" className="w-full">
                              <UserPlus size={12} /> A Primera
                           </FMButton>
                        )}
                        {player.squad !== 'RESERVE' && (
                           <FMButton onClick={() => changeSquad('RESERVE')} variant="secondary" className="w-full">
                              <Users size={12} /> A Reserva
                           </FMButton>
                        )}
                        {player.squad !== 'U20' && player.age <= 20 && (
                           <FMButton onClick={() => changeSquad('U20')} variant="secondary" className="w-full">
                              <Users size={12} /> A Sub-20
                           </FMButton>
                        )}
                     </div>
                  )}
                  {!isUserPlayer && (
                     <div className="flex justify-end">
                        <FMButton onClick={() => setShowOfferModal(true)} variant="primary" className="px-8 py-3">
                           Hacer Oferta
                        </FMButton>
                     </div>
                  )}
               </div>
            )}
            {activeTab === 'STATS' && (
               <div className="max-w-md mx-auto space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                     <StatBox label="Partidos" value={player.seasonStats.appearances} />
                     <StatBox label="Goles" value={player.seasonStats.goals} color="text-green-700" />
                     <StatBox label="Asistencias" value={player.seasonStats.assists} color="text-blue-700" />
                     <StatBox label="Calif. Media" value={avgRating} bg="bg-slate-100" />
                  </div>
               </div>
            )}
            {activeTab === 'HISTORY' && (
               <div className="max-w-2xl mx-auto">
                  <FMTable 
                     headers={['Año', 'Club', 'PJ', 'G', 'Ast', 'Med']}
                     colWidths={['45px', 'auto', '35px', '35px', '35px', '45px']}
                  >
                     <tr className="bg-blue-50 font-bold border-l-4 border-l-blue-600">
                        <FMTableCell className="font-mono text-blue-900">{currentDate.getFullYear()}</FMTableCell>
                        <FMTableCell className="text-blue-900 italic truncate max-w-[120px]">{club?.name}</FMTableCell>
                        <FMTableCell className="text-center" isNumber>{player.seasonStats.appearances}</FMTableCell>
                        <FMTableCell className="text-center text-green-700" isNumber>{player.seasonStats.goals}</FMTableCell>
                        <FMTableCell className="text-center text-blue-700" isNumber>{player.seasonStats.assists}</FMTableCell>
                        <FMTableCell className="text-center bg-blue-100" isNumber>{avgRating}</FMTableCell>
                     </tr>
                     {player.history.slice().reverse().map((h, i) => {
                        const hClub = world.getClub(h.clubId);
                        const hRating = h.stats.appearances > 0 ? (h.stats.totalRating / h.stats.appearances).toFixed(2) : '0.00';
                        return (
                           <tr key={i} className="hover:bg-slate-50 transition-colors">
                              <FMTableCell className="text-slate-500 font-mono">{h.year}</FMTableCell>
                              <FMTableCell className="text-slate-700 italic truncate max-w-[120px]">{hClub?.name || 'Desconocido'}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.appearances}</FMTableCell>
                              <FMTableCell className="text-center text-green-700/80" isNumber>{h.stats.goals}</FMTableCell>
                              <FMTableCell className="text-center text-blue-700/80" isNumber>{h.stats.assists}</FMTableCell>
                              <FMTableCell className="text-center font-bold bg-slate-100" isNumber>{hRating}</FMTableCell>
                           </tr>
                        )
                     })}
                  </FMTable>
               </div>
            )}
            {activeTab === 'INTERACTION' && (
               <div className="max-w-3xl mx-auto space-y-6">
                  {/* Player Initiated Conversations (Motives) */}
                  {playerMotive && interactionStage === 'TOPIC' && (
                    <div className="bg-amber-50 border border-amber-200 p-6 rounded-sm mb-6 animate-in slide-in-from-top-2">
                       <div className="flex items-center gap-2 text-amber-700 font-black text-[10px] uppercase tracking-widest mb-3">
                          <MessageSquare size={14} /> El jugador quiere hablar
                       </div>
                       <p className="text-slate-800 font-medium italic text-lg leading-relaxed mb-4">
                          "{playerMotive}"
                       </p>
                       <div className="flex gap-2">
                          <FMButton variant="primary" onClick={() => handleMotiveAction('PROMISE')} className="text-[10px] shadow-md border-slate-700">Prometer buscar solución</FMButton>
                          <FMButton variant="secondary" onClick={() => handleMotiveAction('IGNORE')} className="text-[10px] shadow-sm border-slate-400">Ignorar petición</FMButton>
                       </div>
                    </div>
                  )}

                  {interactionStage === 'TOPIC' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       {/* Theme: Rendimiento */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-2">
                             <Award size={14} /> Rendimiento
                          </h4>
                          <div className="flex flex-col gap-2">
                             <button onClick={() => handleTopicSelect('PRAISE_FORM')} className="p-4 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-900 hover:text-white transition-all text-center shadow-sm">Elogiar Forma</button>
                             <button onClick={() => handleTopicSelect('CRITICIZE_FORM')} className="p-4 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-900 hover:text-white transition-all text-center shadow-sm">Criticar Forma</button>
                             <button onClick={() => handleTopicSelect('PRAISE_TRAINING')} className="p-4 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-900 hover:text-white transition-all text-center shadow-sm">Elogiar Entrenamiento</button>
                          </div>
                       </div>

                       {/* Theme: Conducta y Otros */}
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-1 flex items-center gap-2">
                             <DisciplineIcon size={14} /> Disciplina y Otros
                          </h4>
                          <div className="flex flex-col gap-2">
                             <button onClick={() => handleTopicSelect('DEMAND_MORE')} className="p-4 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-900 hover:text-white transition-all text-center shadow-sm">Exigir Más</button>
                             <button onClick={() => handleTopicSelect('WARN_CONDUCT')} className="p-4 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 bg-white hover:bg-slate-900 hover:text-white transition-all text-center shadow-sm">Advertir Conducta</button>
                             <button className="p-4 border border-slate-300 rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 cursor-not-allowed text-center shadow-sm">Preguntar por el futuro</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {interactionStage === 'TONE' && selectedTopic && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                       <header className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Selecciona el tono de la charla</p>
                          <h4 className="text-lg font-black text-slate-900 uppercase italic">¿Qué le quieres decir?</h4>
                       </header>
                       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(DialogueSystem.getTopicOptions(selectedTopic)).map(([tone, phrase]) => (
                             <button 
                                key={tone}
                                onClick={() => handleToneSelect(tone as DialogueTone)}
                                className={`p-6 border-2 rounded-sm text-left transition-all group flex flex-col gap-4 h-full ${
                                   tone === 'MILD' ? 'border-green-300 hover:bg-green-50' :
                                   tone === 'MODERATE' ? 'border-blue-300 hover:bg-blue-50' :
                                   'border-red-300 hover:bg-red-50'
                                }`}
                             >
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full self-start ${
                                   tone === 'MILD' ? 'bg-green-100 text-green-700' :
                                   tone === 'MODERATE' ? 'bg-blue-100 text-blue-700' :
                                   'bg-red-100 text-red-700'
                                }`}>{tone}</span>
                                <p className="text-xs font-bold text-slate-700 leading-relaxed italic">"{phrase}"</p>
                             </button>
                          ))}
                       </div>
                       <div className="flex justify-center mt-4">
                          <FMButton variant="secondary" onClick={resetCharla}>Cambiar de tema</FMButton>
                       </div>
                    </div>
                  )}

                  {(interactionStage === 'RESULT' || interactionStage === 'REPLICA') && dialogueResult && (
                     <div className="mt-8 p-10 bg-slate-50 border border-slate-200 rounded-sm relative animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-6 py-1.5 border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                           <MessageCircle size={14}/> Reacción del Jugador
                        </div>
                        
                        <div className="text-slate-800 text-center font-bold italic text-2xl leading-relaxed">
                           "{dialogueResult.text}"
                        </div>
                        
                        <div className="mt-8 flex flex-col items-center gap-6">
                           <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-sm ${
                              dialogueResult.reactionType === 'POSITIVE' ? 'bg-green-100 text-green-700' :
                              dialogueResult.reactionType === 'NEGATIVE' ? 'bg-red-100 text-red-700' :
                              'bg-slate-200 text-slate-600'
                           }`}>
                              Efecto: {dialogueResult.moraleChange > 0 ? '+' : ''}{dialogueResult.moraleChange} Moral
                           </span>

                           <div className="flex gap-3">
                              {interactionStage === 'RESULT' && dialogueResult.canReplica && (
                                 <FMButton variant="primary" onClick={handleReplica} className="px-10 py-3">Réplica</FMButton>
                              )}
                              <FMButton variant="secondary" onClick={resetCharla} className="px-10 py-3">Finalizar Charla</FMButton>
                           </div>
                        </div>
                     </div>
                  )}

                  {!dialogueResult && !selectedTopic && !playerMotive && (
                     <div className="text-center py-20 text-slate-300 flex flex-col items-center gap-4 border-2 border-dashed border-slate-100 rounded-sm">
                        <MessageSquare size={48} className="opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Inicia una conversación temática con el jugador</p>
                     </div>
                  )}
               </div>
            )}
          </div>
        </div>
      </div>
      {showOfferModal && <TransferOfferModal player={player} userClubId={userClubId} onClose={() => setShowOfferModal(false)} onOfferMade={() => {}} currentDate={currentDate} />}
      {showRenewalModal && <ContractNegotiationModal player={player} userClubId={userClubId} currentDate={currentDate} onClose={() => setShowRenewalModal(false)} onRenewed={() => setShowRenewalModal(false)} />}
    </>
  );
};

const StatBox = ({ label, value, color = "text-slate-950", bg = "bg-white" }: { label: string, value: string | number, color?: string, bg?: string }) => (
   <div className={`${bg} p-3 rounded-sm border border-slate-300 shadow-sm flex flex-col items-center justify-center`}>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">{label}</span>
      <span className={`text-xl font-bold ${color}`}>{value}</span>
   </div>
);
