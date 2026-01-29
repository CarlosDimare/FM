
import React, { useState } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position, SquadType, DialogueTone, POSITION_FULL_NAMES } from '../types';
import { world } from '../services/worldManager';
import { ProfileNarrativeEngine } from '../services/engine';
import { DialogueSystem } from '../services/dialogueSystem';
import { TransferOfferModal } from './TransferOfferModal';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { X, MessageSquare, Activity, Map, FileText, History, TrendingUp, ShieldAlert, ArrowRightLeft, UserX, UserPlus, Users, MessageCircle, AlertCircle, Info, Award, ShieldAlert as DisciplineIcon } from 'lucide-react';
import { FMTable, FMTableCell, FMButton, FMBox } from './FMUI';
import { getFlagUrl } from '../data/static';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  userClubId: string;
  currentDate: Date;
}

// Custom Attribute Row for FM08 Style
const AttributeRow: React.FC<{ label: string; value: Attribute; index: number }> = ({ label, value, index }) => {
  // FM08 Logic: High (>=11) is Blue, Low is Black/Grey. 
  // Adjusting threshold to 11 based on screenshot (10 is black, 11 is blue)
  const valueColor = value >= 11 ? 'text-blue-800' : 'text-slate-900';
  
  return (
    <div className={`flex justify-between items-center px-2 py-0.5 border-b border-[#a0b0a0]/30 ${index % 2 === 0 ? 'bg-[#e8ece8]' : 'bg-[#dce4dc]'} hover:bg-[#ccd9cc] transition-colors cursor-default group`}>
      <span className="text-[10px] font-bold text-slate-700 truncate pr-2 group-hover:text-black" style={{ fontFamily: 'Verdana, sans-serif' }}>
        {ATTRIBUTE_LABELS[label] || label}
      </span>
      <span className={`text-[11px] font-black ${valueColor}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
        {value}
      </span>
    </div>
  );
};

// FM08 Section Header
const AttributeSectionHeader: React.FC<{ title: string }> = ({ title }) => (
   <div className="px-2 py-1 border-b border-[#8c9c8c] shadow-sm mb-0.5" 
        style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
      <h3 className="text-[#1a1a1a] font-bold text-[10px] uppercase tracking-wide drop-shadow-sm" style={{ fontFamily: 'Verdana, sans-serif' }}>{title}</h3>
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
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PERSONAL' | 'POSITIONS' | 'HISTORY' | 'CONTRACT' | 'INTERACTION'>('PROFILE');
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

  // Use standard FM Header style instead of club colors for cleaner look in the modal, 
  // or use the club colors but in a contained way.
  // The screenshot request implied keeping the "shape" but applying the style.
  // We'll use a clean white/sage header to match the industrial look.
  
  const InfoRow = ({ label, value }: { label: string, value: string }) => (
     <div className="flex border-b border-[#a0b0a0] last:border-0 hover:bg-[#ccd9cc] transition-colors">
        <div className="w-1/3 bg-[#e8ece8]/50 p-2 text-[10px] font-black text-slate-600 uppercase tracking-wide border-r border-[#a0b0a0] flex items-center" style={{ fontFamily: 'Verdana, sans-serif' }}>
           {label}
        </div>
        <div className="w-2/3 p-2 text-xs font-bold text-slate-900 flex items-center" style={{ fontFamily: 'Verdana, sans-serif' }}>
           {value}
        </div>
     </div>
  );

  // Dynamic header styles based on club colors
  const headerBgClass = club ? club.primaryColor : 'bg-slate-800';
  const headerTextClass = club ? club.secondaryColor : 'text-white';
  const headerBorderClass = club && club.primaryColor === 'bg-white' ? 'border-slate-300' : 'border-black/20';

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="bg-[#d4dcd4] w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] md:rounded-sm shadow-2xl border border-[#a0b0a0] flex flex-col overflow-hidden">
          
          {/* Header - Industrial Style with Dynamic Club Colors */}
          <div className={`p-3 md:p-4 border-b flex justify-between items-start shadow-sm shrink-0 transition-colors duration-300 ${headerBgClass} ${headerBorderClass}`}>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col gap-y-1">
                 <div className="flex flex-wrap items-baseline gap-2">
                    <h2 className={`text-2xl md:text-3xl font-black truncate tracking-tighter uppercase italic flex items-center gap-2 ${headerTextClass}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
                        <img 
                          src={getFlagUrl(player.nationality)} 
                          alt={player.nationality} 
                          className="w-6 h-4 md:w-8 md:h-5 object-cover shadow-sm rounded-[1px] border border-black/10" 
                        />
                        <span>{player.name}</span>
                        <span className="opacity-70 font-normal text-lg"> - </span>
                        <span className="text-lg opacity-90">{club?.name || 'Agente Libre'}</span>
                    </h2>
                 </div>

                 {/* Metadata Line */}
                 <div className={`flex flex-wrap items-center gap-3 font-bold uppercase text-[10px] tracking-tight mt-1 ${headerTextClass} opacity-80`} style={{ fontFamily: 'Verdana, sans-serif' }}>
                    <span className="bg-black/20 px-1.5 rounded-[1px] text-current border border-black/10">
                        {POSITION_FULL_NAMES[player.positions[0]] || player.positions[0]}
                    </span>
                    <span>{player.nationality.toUpperCase()}</span>
                    <span>•</span>
                    <span>{player.age} AÑOS</span>
                    <span>•</span>
                    <span>{player.height} CM</span>
                    <span>•</span>
                    <span>{player.weight} KG</span>
                 </div>

                 {/* Quote Line */}
                 <div className={`text-xs font-black uppercase italic tracking-tight leading-tight mt-1 ${headerTextClass} opacity-90`} style={{ fontFamily: 'Verdana, sans-serif' }}>
                    "{headline}"
                 </div>

                 {/* Personality Badge */}
                 <div className="flex flex-wrap gap-2 mt-1">
                    <div className="flex items-center gap-1 bg-black/10 border border-black/10 px-2 py-0.5 rounded-[1px]" title="Personalidad">
                        <span className={`text-[9px] font-black uppercase ${headerTextClass} opacity-90`}>{personality}</span>
                    </div>
                    {player.developmentTrend === 'RISING' && (
                       <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-2 py-0.5 rounded-[1px]">
                          <TrendingUp size={10} className="text-green-600" /> 
                       </div>
                    )}
                    {playerMotive && (
                       <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-[1px]">
                          <AlertCircle size={10} className="text-amber-600" />
                       </div>
                    )}
                 </div>
              </div>
            </div>
            
            <button onClick={onClose} className={`${headerTextClass} opacity-70 hover:opacity-100 transition-colors`}><X size={24} /></button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#a0b0a0] bg-[#e8ece8] justify-between md:justify-start">
             {[
                { id: 'PROFILE', label: 'Atributos', icon: Activity },
                { id: 'PERSONAL', label: 'Información', icon: Info },
                { id: 'POSITIONS', label: 'Posiciones', icon: Map },
                { id: 'HISTORY', label: 'Historial', icon: History },
                { id: 'CONTRACT', label: 'Contrato', icon: FileText },
                { id: 'INTERACTION', label: 'Charla', icon: MessageSquare }
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); resetCharla(); }}
                  title={tab.label}
                  className={`flex-1 md:flex-none px-4 md:px-6 py-3 transition-all border-r border-[#a0b0a0] flex items-center justify-center ${activeTab === tab.id ? 'bg-[#d4dcd4] text-black shadow-inner font-bold' : 'text-slate-600 hover:bg-[#ccd9cc] hover:text-slate-900'}`}
               >
                  <tab.icon size={16} />
               </button>
             ))}
          </div>

          <div className="overflow-y-auto flex-1 p-2 md:p-4 bg-[#d4dcd4]">
            {activeTab === 'PROFILE' && (
               <div className="space-y-4 h-full flex flex-col">
                  {/* Mobile Tab Switcher for Columns */}
                  <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] mb-2 md:hidden">
                     {['TECHNICAL', 'MENTAL', 'PHYSICAL'].map(cat => (
                        <button 
                           key={cat}
                           onClick={() => setAttributeCategory(cat as any)}
                           className={`flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-[1px] transition-all ${attributeCategory === cat ? 'bg-[#3a4a3a] text-white shadow-sm' : 'text-slate-700 hover:bg-[#ccd9cc]'}`}
                        >
                           {cat === 'TECHNICAL' ? 'Técnica' : cat === 'PHYSICAL' ? 'Físico' : 'Mental'}
                        </button>
                     ))}
                  </div>

                  <div className="flex-1 md:grid md:grid-cols-3 gap-2 h-full overflow-hidden">
                     {/* Column 1: Technical (or Mobile Active) */}
                     <div className={`flex flex-col h-full bg-[#d4dcd4] border border-[#a0b0a0] shadow-sm ${attributeCategory !== 'TECHNICAL' ? 'hidden md:flex' : 'flex'}`}>
                        <AttributeSectionHeader title="Atri. técnicos" />
                        <div className="flex-1 overflow-y-auto bg-white border-t border-[#a0b0a0]">
                           {Object.entries(player.stats.technical).map(([k,v], i) => <AttributeRow key={k} label={k} value={v} index={i}/>)}
                        </div>
                     </div>

                     {/* Column 2: Mental */}
                     <div className={`flex flex-col h-full bg-[#d4dcd4] border border-[#a0b0a0] shadow-sm ${attributeCategory !== 'MENTAL' ? 'hidden md:flex' : 'flex'}`}>
                        <AttributeSectionHeader title="Atri. mentales" />
                        <div className="flex-1 overflow-y-auto bg-white border-t border-[#a0b0a0]">
                           {Object.entries(player.stats.mental)
                              .filter(([k]) => !['professionalism','ambition','pressure','temperament','loyalty','adaptability','sportsmanship'].includes(k))
                              .map(([k,v], i) => <AttributeRow key={k} label={k} value={v as number} index={i}/>)}
                        </div>
                     </div>

                     {/* Column 3: Physical & Other */}
                     <div className={`flex flex-col h-full bg-[#d4dcd4] border border-[#a0b0a0] shadow-sm ${attributeCategory !== 'PHYSICAL' ? 'hidden md:flex' : 'flex'}`}>
                        <div className="flex flex-col flex-1 min-h-0">
                           <AttributeSectionHeader title="Atri. físicos" />
                           <div className="overflow-y-auto bg-white border-t border-[#a0b0a0] mb-2">
                              {Object.entries(player.stats.physical).map(([k,v], i) => <AttributeRow key={k} label={k} value={v} index={i}/>)}
                           </div>
                        </div>
                        
                        <div className="shrink-0">
                           <AttributeSectionHeader title="Otros" />
                           <div className="bg-white border-t border-[#a0b0a0]">
                              {player.positions.includes(Position.GK) && player.stats.goalkeeping && (
                                 <AttributeRow label="Calif. de portero" value={Math.round(player.currentAbility/10)} index={0} />
                              )}
                              <div className="flex justify-between items-center px-2 py-0.5 border-b border-[#a0b0a0]/30 bg-[#e8ece8]">
                                 <span className="text-[10px] font-bold text-slate-700">Forma física</span>
                                 <span className="text-[11px] font-black text-green-700">{Math.round(player.fitness)}%</span>
                              </div>
                              <div className="flex justify-between items-center px-2 py-0.5 border-b border-[#a0b0a0]/30 bg-[#dce4dc]">
                                 <span className="text-[10px] font-bold text-slate-700">Moral</span>
                                 <span className="text-[11px] font-black text-green-700">{player.morale > 80 ? 'Muy alta' : player.morale > 50 ? 'Alta' : 'Baja'}</span>
                              </div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}
            
            {activeTab === 'PERSONAL' && (
               <FMBox title="Datos Personales" className="max-w-2xl mx-auto" noPadding>
                  <div className="flex flex-col bg-white">
                     <InfoRow label="Nombre Completo" value={player.name} />
                     <InfoRow label="Nacimiento" value={player.birthDate.toLocaleDateString()} />
                     <InfoRow label="Nacionalidad" value={player.nationality} />
                     <InfoRow label="Valor Estimado" value={`£${player.value.toLocaleString()}`} />
                     <InfoRow label="Sueldo" value={`£${player.salary.toLocaleString()}`} />
                     <InfoRow label="Vencimiento" value={player.contractExpiry.toLocaleDateString()} />
                  </div>
               </FMBox>
            )}

            {activeTab === 'POSITIONS' && (
               <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="relative w-full max-w-[320px] aspect-[68/105] shadow-xl bg-[#1e3a29] border-4 border-[#a0b0a0] rounded-sm overflow-hidden ring-4 ring-[#d4dcd4]">
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
                  <p className="mt-4 text-slate-500 text-[10px] font-black uppercase tracking-widest bg-[#e8ece8] px-3 py-1 border border-[#a0b0a0] rounded-sm">Disposición Táctica Preferida</p>
               </div>
            )}
            
            {activeTab === 'CONTRACT' && (
               <div className="max-w-2xl mx-auto space-y-8 mt-4">
                  <div className="grid grid-cols-2 gap-8 border-b border-[#a0b0a0] pb-8">
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase">Valor Estimado</label><p className="text-3xl font-black text-slate-900 tracking-tighter">£{player.value.toLocaleString()}</p></div>
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase">Salario Mensual</label><p className="text-xl font-bold text-slate-700">£{player.salary.toLocaleString()}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-bold pb-6 border-b border-[#a0b0a0]">
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
            
            {activeTab === 'HISTORY' && (
               <div className="max-w-3xl mx-auto mt-4">
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
                           <tr key={i} className="hover:bg-[#ccd9cc] transition-colors">
                              <FMTableCell className="text-slate-500 font-mono">{h.year}</FMTableCell>
                              <FMTableCell className="text-slate-700 italic truncate max-w-[120px]">{hClub?.name || 'Desconocido'}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.appearances}</FMTableCell>
                              <FMTableCell className="text-center text-green-700/80" isNumber>{h.stats.goals}</FMTableCell>
                              <FMTableCell className="text-center text-blue-700/80" isNumber>{h.stats.assists}</FMTableCell>
                              <FMTableCell className="text-center font-bold bg-[#e8ece8]" isNumber>{hRating}</FMTableCell>
                           </tr>
                        )
                     })}
                  </FMTable>
               </div>
            )}
            
            {activeTab === 'INTERACTION' && (
               <div className="max-w-3xl mx-auto space-y-6 mt-4">
                  {/* Player Initiated Conversations (Motives) */}
                  {playerMotive && interactionStage === 'TOPIC' && (
                    <FMBox title="Asunto Pendiente" className="bg-amber-50">
                       <div className="p-4">
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
                    </FMBox>
                  )}

                  {interactionStage === 'TOPIC' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <FMBox title="Rendimiento" noPadding>
                          <div className="flex flex-col gap-2 p-2">
                             <button onClick={() => handleTopicSelect('PRAISE_FORM')} className="p-3 bg-white hover:bg-[#ccd9cc] border border-[#a0b0a0] rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 text-left transition-colors">Elogiar Forma</button>
                             <button onClick={() => handleTopicSelect('CRITICIZE_FORM')} className="p-3 bg-white hover:bg-[#ccd9cc] border border-[#a0b0a0] rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 text-left transition-colors">Criticar Forma</button>
                             <button onClick={() => handleTopicSelect('PRAISE_TRAINING')} className="p-3 bg-white hover:bg-[#ccd9cc] border border-[#a0b0a0] rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 text-left transition-colors">Elogiar Entrenamiento</button>
                          </div>
                       </FMBox>

                       <FMBox title="Disciplina y Otros" noPadding>
                          <div className="flex flex-col gap-2 p-2">
                             <button onClick={() => handleTopicSelect('DEMAND_MORE')} className="p-3 bg-white hover:bg-[#ccd9cc] border border-[#a0b0a0] rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 text-left transition-colors">Exigir Más</button>
                             <button onClick={() => handleTopicSelect('WARN_CONDUCT')} className="p-3 bg-white hover:bg-[#ccd9cc] border border-[#a0b0a0] rounded-sm text-[10px] font-black uppercase tracking-widest text-slate-700 text-left transition-colors">Advertir Conducta</button>
                          </div>
                       </FMBox>
                    </div>
                  )}

                  {interactionStage === 'TONE' && selectedTopic && (
                    <FMBox title="Seleccionar Tono" className="animate-in fade-in duration-300">
                       <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(DialogueSystem.getTopicOptions(selectedTopic)).map(([tone, phrase]) => (
                             <button 
                                key={tone}
                                onClick={() => handleToneSelect(tone as DialogueTone)}
                                className={`p-4 border-2 rounded-sm text-left transition-all group flex flex-col gap-2 h-full bg-white hover:border-[#3a4a3a] ${
                                   tone === 'MILD' ? 'border-green-300' :
                                   tone === 'MODERATE' ? 'border-blue-300' :
                                   'border-red-300'
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
                       <div className="p-2 border-t border-[#a0b0a0] flex justify-center bg-[#e8ece8]">
                          <FMButton variant="secondary" onClick={resetCharla}>Volver</FMButton>
                       </div>
                    </FMBox>
                  )}

                  {(interactionStage === 'RESULT' || interactionStage === 'REPLICA') && dialogueResult && (
                     <FMBox title="Resultado de la Charla" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 text-center bg-white">
                           <div className="text-slate-800 font-bold italic text-2xl leading-relaxed mb-6">
                              "{dialogueResult.text}"
                           </div>
                           
                           <div className="flex flex-col items-center gap-6">
                              <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-tighter shadow-sm border ${
                                 dialogueResult.reactionType === 'POSITIVE' ? 'bg-green-100 text-green-700 border-green-300' :
                                 dialogueResult.reactionType === 'NEGATIVE' ? 'bg-red-100 text-red-700 border-red-300' :
                                 'bg-slate-200 text-slate-600 border-slate-300'
                              }`}>
                                 Efecto: {dialogueResult.moraleChange > 0 ? '+' : ''}{dialogueResult.moraleChange} Moral
                              </span>

                              <div className="flex gap-3">
                                 {interactionStage === 'RESULT' && dialogueResult.canReplica && (
                                    <FMButton variant="primary" onClick={handleReplica} className="px-10 py-3">Réplica</FMButton>
                                 )}
                                 <FMButton variant="secondary" onClick={resetCharla} className="px-10 py-3">Finalizar</FMButton>
                              </div>
                           </div>
                        </div>
                     </FMBox>
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
