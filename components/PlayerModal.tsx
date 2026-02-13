
import React, { useState, useMemo } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position, SquadType, DialogueTone, POSITION_FULL_NAMES, PlayerHistoryEntry } from '../types';
import { world } from '../services/worldManager';
import { ProfileNarrativeEngine } from '../services/engine';
import { DialogueSystem } from '../services/dialogueSystem';
import { TransferOfferModal } from './TransferOfferModal';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { X, MessageSquare, Activity, Map, FileText, History, TrendingUp, TrendingDown, Minus, ShieldAlert, ArrowRightLeft, UserX, UserPlus, Users, MessageCircle, AlertCircle, Info, Award, ShieldAlert as DisciplineIcon, Shield, User, Star, ChevronLeft, ChevronRight, Cake, Ruler, Weight, UserCircle } from 'lucide-react';
import { FMTable, FMTableCell, FMButton, FMBox } from './FMUI';
import { getFlagUrl } from '../data/static';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
  userClubId: string;
  currentDate: Date;
}

// Coordenadas para el mapa de posiciones
const POSITION_COORDS: Record<string, { x: number, y: number }> = {
  'P': { x: 50, y: 90 },
  'DFC': { x: 50, y: 75 },
  'LD': { x: 85, y: 75 },
  'LI': { x: 15, y: 75 },
  'MCD': { x: 50, y: 60 },
  'MC': { x: 50, y: 45 },
  'MD': { x: 85, y: 45 },
  'MI': { x: 15, y: 45 },
  'MPC': { x: 50, y: 30 },
  'ED': { x: 85, y: 20 },
  'EI': { x: 15, y: 20 },
  'DC': { x: 50, y: 15 },
};

const getKeyAttributes = (pos: Position): string[] => {
  switch (pos) {
    case Position.GK: return ['reflexes', 'handling', 'oneOnOnes', 'aerialReach', 'commandOfArea', 'agility'];
    case Position.DC: return ['marking', 'tackling', 'heading', 'positioning', 'jumpingReach', 'strength', 'bravery'];
    case Position.DR: case Position.DL: return ['tackling', 'marking', 'crossing', 'pace', 'stamina', 'positioning'];
    case Position.DM: return ['tackling', 'marking', 'passing', 'positioning', 'teamwork', 'workRate'];
    case Position.MC: return ['passing', 'technique', 'firstTouch', 'vision', 'decisions', 'teamwork'];
    case Position.AM: return ['passing', 'technique', 'vision', 'flair', 'dribbling', 'offTheBall'];
    case Position.ST: return ['finishing', 'composure', 'offTheBall', 'firstTouch', 'pace', 'acceleration', 'heading'];
    default: return ['passing', 'determination', 'stamina'];
  }
};

// Atributo compactado para evitar scroll
const AttributeRow: React.FC<{ label: string; value: Attribute; isKey: boolean; trend?: string }> = ({ label, value, isKey, trend }) => {
  const valueColor = value >= 16 ? 'text-blue-800' : value >= 11 ? 'text-blue-600/60' : 'text-slate-400/40';
  const labelColor = value >= 11 ? 'text-slate-600' : 'text-slate-400/60';
  
  return (
    <div className={`flex items-center px-1.5 py-0.5 border-b border-[#a0b0a0]/5 hover:bg-[#ccd9cc] transition-colors cursor-default group ${isKey ? 'bg-blue-700/5' : ''}`}>
      <div className="w-5 flex items-center justify-end mr-2">
         <span className={`text-[11px] font-black leading-tight ${valueColor}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
            {value}
         </span>
      </div>
      <div className="w-2.5 mr-1 opacity-50">
        {trend === 'RISING' && <TrendingUp size={9} className="text-green-600" />}
        {trend === 'DECLINING' && <TrendingDown size={9} className="text-red-600" />}
      </div>
      <span className={`text-[8px] uppercase tracking-tighter truncate flex-1 ${labelColor} ${isKey ? 'font-black' : 'font-bold'}`} style={{ fontFamily: 'Verdana, sans-serif' }}>
        {ATTRIBUTE_LABELS[label] || label}
      </span>
      {isKey && <div className="w-1 h-1 rounded-full bg-blue-400/40"></div>}
    </div>
  );
};

const SubGroupHeader: React.FC<{ title: string }> = ({ title }) => (
   <div className="px-1.5 py-0.5 bg-black/5 border-y border-[#a0b0a0]/10 mb-0.5 mt-1 first:mt-0">
      <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
   </div>
);

export const PlayerModal: React.FC<PlayerModalProps> = ({ player, onClose, userClubId, currentDate }) => {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'PERSONAL' | 'POSITIONS' | 'HISTORY' | 'CONTRACT' | 'INTERACTION'>('PROFILE');
  const [activeProfileSubTab, setActiveProfileSubTab] = useState<'TECHNICAL' | 'MENTAL' | 'PHYSICAL'>('TECHNICAL');
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  
  // Dialogue state
  const [dialogueType, setDialogueType] = useState<DialogueType>('PRAISE_FORM');
  const [dialogueTone, setDialogueTone] = useState<DialogueTone>('MODERATE');
  const [dialogueResult, setDialogueResult] = useState<DialogueResult | null>(null);

  if (!player) return null;
  
  const club = world.getClub(player.clubId);
  const headline = ProfileNarrativeEngine.generateHeadline(player);
  const personality = ProfileNarrativeEngine.getPersonalityLabel(player);
  const isUserPlayer = player.clubId === userClubId;
  const keyAttributes = getKeyAttributes(player.positions[0]);

  const handleRescind = () => {
     if (confirm("¿Estás seguro de rescindir el contrato?")) {
        world.rescindContract(player.id, currentDate);
        onClose();
     }
  };

  const handleTalk = () => {
    const result = DialogueSystem.getPlayerReaction(player, dialogueType, dialogueTone, currentDate);
    setDialogueResult(result);
    player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
  };

  const clubBg = club ? club.primaryColor : 'bg-white';
  const clubText = club ? club.secondaryColor : 'text-blue-900';
  const isHeaderLight = clubBg === 'bg-white';

  const personalMotive = DialogueSystem.checkPlayerMotives(player, currentDate);

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="bg-[#d4dcd4] w-full h-full md:h-auto md:max-w-6xl md:rounded-sm shadow-2xl border border-[#a0b0a0] flex flex-col overflow-hidden">
          
          {/* Header */}
          <div className={`${clubBg} p-3 md:p-4 border-b ${isHeaderLight ? 'border-[#a0b0a0]' : 'border-black/20'} flex items-start gap-3 md:gap-4 shrink-0 relative transition-colors duration-500`}>
             <div className="w-20 h-24 md:w-24 md:h-28 bg-white border border-[#a0b0a0] rounded-sm overflow-hidden flex items-center justify-center shrink-0 shadow-md relative">
                {player.photo ? <img src={player.photo} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-300" />}
                <div className="absolute bottom-1 right-1 w-4 h-3 md:w-5 md:h-4 shadow-sm border border-white">
                    <img src={getFlagUrl(player.nationality)} className="w-full h-full object-cover" />
                </div>
             </div>

             <div className="flex-1 flex flex-col gap-0.5 md:gap-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-baseline md:gap-2">
                    <h2 className={`text-xl md:text-3xl font-black ${clubText} uppercase italic tracking-tighter drop-shadow-sm truncate`} style={{ fontFamily: 'Verdana' }}>{player.name}</h2>
                    <div className="flex items-center gap-1">
                      <span className={`hidden md:inline text-xl font-bold opacity-40 ${clubText}`}> - </span>
                      <h3 className={`text-xs md:text-xl font-black ${clubText} uppercase italic tracking-tighter opacity-70 truncate`}>{club?.name || 'Agente Libre'}</h3>
                    </div>
                </div>

                <div className={`flex flex-wrap items-center gap-x-2 md:gap-x-4 gap-y-1 text-[8px] md:text-[10px] font-black uppercase tracking-tight ${isHeaderLight ? 'text-slate-500' : 'text-white/60'}`} style={{ fontFamily: 'Verdana' }}>
                   <span className={`${isHeaderLight ? 'bg-[#bcc8bc] text-slate-800' : 'bg-black/20 text-white'} px-1.5 py-0.5 rounded-sm`}>{POSITION_FULL_NAMES[player.positions[0]] || player.positions[0]}</span>
                   <span>{player.nationality.toUpperCase()}</span>
                   <span>• {player.age} AÑOS</span>
                   <span className="hidden md:inline">• {player.height} CM</span>
                </div>

                <div className={`text-[9px] md:text-[12px] font-black italic uppercase mt-1 md:mt-2 px-2 py-1 md:px-3 md:py-1.5 rounded-sm inline-block self-start ${isHeaderLight ? 'bg-blue-50 text-blue-800 border border-blue-100' : 'bg-black/30 text-white border border-white/10 shadow-inner'}`}>
                   "{headline.toUpperCase()}"
                </div>

                <div className="flex items-center gap-2 mt-1 md:mt-2">
                    <span className={`text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase border ${isHeaderLight ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-white/10 text-white border-white/20'}`}>{personality}</span>
                    <div className={`ml-auto px-1.5 py-0.5 rounded-sm border ${isHeaderLight ? 'bg-[#bcc8bc] border-[#a0b0a0]' : 'bg-black/20 border-white/10'}`}>
                        <span className={`text-[7px] md:text-[9px] font-black uppercase ${isHeaderLight ? 'text-green-700' : 'text-green-400'}`}>LEAL</span>
                    </div>
                </div>
             </div>

             <button onClick={onClose} className={`p-1 transition-colors shrink-0 ${isHeaderLight ? 'text-slate-400 hover:text-red-600' : 'text-white/40 hover:text-white'}`}><X size={20} md:size={24} /></button>
          </div>

          {/* Nav Tabs */}
          <div className="flex bg-[#e8ece8] border-b border-[#a0b0a0] divide-x divide-[#a0b0a0]/50 shrink-0 overflow-x-auto scrollbar-hide">
             {[
                { id: 'PROFILE', icon: Activity }, { id: 'PERSONAL', icon: Info }, { id: 'POSITIONS', icon: Map },
                { id: 'HISTORY', icon: History }, { id: 'CONTRACT', icon: FileText }, { id: 'INTERACTION', icon: MessageSquare }
             ].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id as any)} className={`flex-1 md:flex-none px-4 md:px-5 py-2.5 md:py-3 transition-colors ${activeTab === t.id ? 'bg-[#d4dcd4] shadow-inner' : 'hover:bg-[#ccd9cc] text-slate-600'}`}>
                    <t.icon size={16} md:size={18} className="mx-auto" />
                </button>
             ))}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col bg-[#d4dcd4] p-2 md:p-3 relative">
             {activeTab === 'PROFILE' && (
                <div className="h-full flex flex-col gap-2 overflow-hidden">
                   <div className="md:hidden flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm shrink-0">
                      {['TECHNICAL', 'MENTAL', 'PHYSICAL'].map(st => (
                        <button key={st} onClick={() => setActiveProfileSubTab(st as any)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all ${activeProfileSubTab === st ? 'bg-[#3a4a3a] text-white' : 'text-slate-700'}`}>
                           {st.substring(0, 3)}
                        </button>
                      ))}
                   </div>

                   <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 overflow-hidden">
                      {/* Technical */}
                      <div className={`${activeProfileSubTab === 'TECHNICAL' ? 'flex' : 'hidden md:flex'} flex-col bg-white border border-[#a0b0a0] overflow-hidden shadow-sm`}>
                          <div className="px-2 py-1 border-b border-[#8c9c8c] bg-gradient-to-b from-[#cfd8cf] to-[#a3b4a3] shrink-0"><h3 className="text-[#1a1a1a] font-black text-[8px] uppercase tracking-widest">ATRI. TÉCNICOS</h3></div>
                          <div className="flex-1 overflow-y-auto custom-scroll p-0.5">
                            <SubGroupHeader title="Defensivo" />
                            {['marking', 'tackling', 'heading'].map(k => (<AttributeRow key={k} label={k} value={player.stats.technical[k as keyof typeof player.stats.technical]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                            <SubGroupHeader title="Creativo" />
                            {['passing', 'technique', 'firstTouch', 'crossing', 'dribbling'].map(k => (<AttributeRow key={k} label={k} value={player.stats.technical[k as keyof typeof player.stats.technical]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                            <SubGroupHeader title="Ofensivo / Otros" />
                            {['finishing', 'longShots', 'corners', 'freeKickTaking', 'penaltyTaking', 'longThrows'].map(k => (<AttributeRow key={k} label={k} value={player.stats.technical[k as keyof typeof player.stats.technical]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                          </div>
                      </div>

                      {/* Mental */}
                      <div className={`${activeProfileSubTab === 'MENTAL' ? 'flex' : 'hidden md:flex'} flex-col bg-white border border-[#a0b0a0] overflow-hidden shadow-sm`}>
                          <div className="px-2 py-1 border-b border-[#8c9c8c] bg-gradient-to-b from-[#cfd8cf] to-[#a3b4a3] shrink-0"><h3 className="text-[#1a1a1a] font-black text-[8px] uppercase tracking-widest">ATRI. MENTALES</h3></div>
                          <div className="flex-1 overflow-y-auto custom-scroll p-0.5">
                            <SubGroupHeader title="Inteligencia" />
                            {['anticipation', 'decisions', 'positioning', 'vision', 'concentration'].map(k => (<AttributeRow key={k} label={k} value={player.stats.mental[k as keyof typeof player.stats.mental] as number} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                            <SubGroupHeader title="Esfuerzo y Carácter" />
                            {['determination', 'workRate', 'teamwork', 'aggression', 'bravery', 'leadership'].map(k => (<AttributeRow key={k} label={k} value={player.stats.mental[k as keyof typeof player.stats.mental] as number} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                            <SubGroupHeader title="Otros" />
                            {['composure', 'flair', 'offTheBall'].map(k => (<AttributeRow key={k} label={k} value={player.stats.mental[k as keyof typeof player.stats.mental] as number} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                          </div>
                      </div>

                      {/* Physical */}
                      <div className={`${activeProfileSubTab === 'PHYSICAL' ? 'flex' : 'hidden md:flex'} flex-col gap-2 overflow-hidden`}>
                          <div className="bg-white border border-[#a0b0a0] flex flex-col flex-1 overflow-hidden shadow-sm">
                            <div className="px-2 py-1 border-b border-[#8c9c8c] bg-gradient-to-b from-[#cfd8cf] to-[#a3b4a3] shrink-0"><h3 className="text-[#1a1a1a] font-black text-[8px] uppercase tracking-widest">ATRI. FÍSICOS</h3></div>
                            <div className="flex-1 overflow-y-auto custom-scroll p-0.5">
                                <SubGroupHeader title="Velocidad" />
                                {['acceleration', 'pace', 'agility'].map(k => (<AttributeRow key={k} label={k} value={player.stats.physical[k as keyof typeof player.stats.physical]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                                <SubGroupHeader title="Poder" />
                                {['strength', 'jumpingReach', 'balance', 'stamina'].map(k => (<AttributeRow key={k} label={k} value={player.stats.physical[k as keyof typeof player.stats.physical]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                                <SubGroupHeader title="Condición" />
                                {['naturalFitness'].map(k => (<AttributeRow key={k} label={k} value={player.stats.physical[k as keyof typeof player.stats.physical]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                                {player.stats.goalkeeping && (
                                  <>
                                      <SubGroupHeader title="Portería" />
                                      {Object.keys(player.stats.goalkeeping).map(k => (<AttributeRow key={k} label={k} value={(player.stats.goalkeeping as any)[k]} isKey={keyAttributes.includes(k)} trend={player.developmentTrend} />))}
                                  </>
                                )}
                            </div>
                          </div>
                          
                          <div className="bg-white border border-[#a0b0a0] shrink-0 shadow-sm overflow-hidden mb-1 md:mb-0">
                            <div className="bg-gradient-to-b from-[#f0f4f0] to-[#d0d8d0] px-2 py-1 border-b border-[#a0b0a0]"><span className="text-[#1a1a1a] font-black text-[7px] uppercase tracking-widest">ESTADO ACTUAL</span></div>
                            <div className="p-1 flex flex-col">
                                <div className="flex justify-between items-center px-1.5 py-1 hover:bg-[#f0f4f0] transition-colors border-b border-black/5"><span className="text-[7px] font-black text-slate-500 uppercase">Condición</span><span className="text-[10px] font-black text-green-700">{Math.round(player.fitness)}%</span></div>
                                <div className="flex justify-between items-center px-1.5 py-1 hover:bg-[#f0f4f0] transition-colors"><span className="text-[7px] font-black text-slate-500 uppercase">Moral</span><span className={`text-[10px] font-black ${player.morale > 80 ? 'text-green-700' : 'text-blue-700'}`}>{player.morale > 80 ? 'MUY ALTA' : 'ALTA'}</span></div>
                            </div>
                          </div>
                      </div>
                   </div>
                </div>
             )}

             {activeTab === 'PERSONAL' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full overflow-y-auto p-2">
                   <FMBox title="Información Biográfica">
                      <div className="space-y-2 p-2 bg-white">
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-slate-500"><Cake size={14}/> <span className="text-[10px] font-black uppercase">Nacimiento</span></div><span className="text-xs font-bold">{player.birthDate.toLocaleDateString()} ({player.age} años)</span></div>
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-slate-500"><Ruler size={14}/> <span className="text-[10px] font-black uppercase">Altura</span></div><span className="text-xs font-bold">{player.height} cm</span></div>
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-slate-500"><Weight size={14}/> <span className="text-[10px] font-black uppercase">Peso</span></div><span className="text-xs font-bold">{player.weight} kg</span></div>
                         <div className="flex items-center justify-between border-b pb-1"><div className="flex items-center gap-2 text-slate-500"><UserCircle size={14}/> <span className="text-[10px] font-black uppercase">Personalidad</span></div><span className="text-xs font-bold text-blue-800">{personality}</span></div>
                      </div>
                   </FMBox>
                   <FMBox title="Contrato e Importancia">
                      <div className="space-y-2 p-2 bg-white">
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-slate-500 uppercase">Club Actual</span><span className="text-xs font-black">{club?.name || 'Agente Libre'}</span></div>
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-slate-500 uppercase">Sueldo Mensual</span><span className="text-xs font-black text-blue-900">£{player.salary.toLocaleString()}</span></div>
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-slate-500 uppercase">Vencimiento</span><span className="text-xs font-bold">{player.contractExpiry.toLocaleDateString()}</span></div>
                         <div className="flex justify-between border-b pb-1"><span className="text-[10px] font-black text-slate-500 uppercase">Valor Estimado</span><span className="text-xs font-black text-green-700">£{player.value.toLocaleString()}</span></div>
                      </div>
                   </FMBox>
                </div>
             )}

             {activeTab === 'POSITIONS' && (
                <div className="flex flex-col items-center justify-center h-full p-2">
                   <div className="relative w-full max-w-[320px] aspect-[68/105] shadow-xl bg-[#1e3a29] border-4 border-[#a0b0a0] rounded-sm overflow-hidden">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full opacity-30">
                         <g fill="none" stroke="white" strokeWidth="0.5">
                            <rect x="2" y="2" width="96" height="96" />
                            <line x1="2" y1="50" x2="98" y2="50" />
                            <circle cx="50" cy="50" r="10" />
                            <rect x="25" y="2" width="50" height="15" />
                            <rect x="25" y="83" width="50" height="15" />
                         </g>
                      </svg>
                      
                      {/* Marcadores de posiciones */}
                      {player.positions.map(pos => {
                        const coords = POSITION_COORDS[pos] || { x: 50, y: 50 };
                        return (
                          <div key={pos} className="absolute w-6 h-6 -ml-3 -mt-3 flex items-center justify-center" style={{ left: `${coords.x}%`, top: `${coords.y}%` }}>
                            <div className="w-full h-full bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                            <span className="absolute -bottom-4 text-[7px] font-black text-white bg-black/60 px-1 rounded uppercase whitespace-nowrap">{pos}</span>
                          </div>
                        );
                      })}
                      {player.secondaryPositions.map(pos => {
                        const coords = POSITION_COORDS[pos] || { x: 50, y: 50 };
                        return (
                          <div key={pos} className="absolute w-5 h-5 -ml-2.5 -mt-2.5 flex items-center justify-center" style={{ left: `${coords.x}%`, top: `${coords.y}%` }}>
                            <div className="w-full h-full bg-yellow-400 rounded-full border border-white opacity-80 shadow-md"></div>
                            <span className="absolute -bottom-3 text-[6px] font-black text-white bg-black/40 px-0.5 rounded uppercase whitespace-nowrap">{pos}</span>
                          </div>
                        );
                      })}
                   </div>
                   <div className="mt-4 flex gap-4 text-[8px] font-black uppercase">
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Natural</div>
                      <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-400 rounded-full"></div> Eficaz</div>
                   </div>
                </div>
             )}

             {activeTab === 'HISTORY' && (
                <div className="h-full overflow-hidden p-2 flex flex-col">
                   <FMBox title="Historial del Jugador" className="flex-1 overflow-hidden" noPadding>
                      <FMTable headers={['Año', 'Club', 'Pj', 'Gls', 'Asi', 'Cal']} colWidths={['50px', 'auto', '30px', '30px', '30px', '40px']}>
                         {player.history && player.history.length > 0 ? player.history.sort((a,b) => b.year - a.year).map((h, i) => (
                           <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}>
                              <FMTableCell className="font-mono text-slate-500">{h.year}</FMTableCell>
                              <FMTableCell className="font-bold">{world.getClub(h.clubId)?.name || 'Desconocido'}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.appearances}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.goals}</FMTableCell>
                              <FMTableCell className="text-center" isNumber>{h.stats.assists}</FMTableCell>
                              <FMTableCell className="text-center font-bold text-blue-800" isNumber>{(h.stats.totalRating / (h.stats.appearances || 1)).toFixed(2)}</FMTableCell>
                           </tr>
                         )) : (
                           <tr><td colSpan={6} className="p-12 text-center text-slate-400 italic text-[10px] uppercase font-black">No hay historial previo registrado</td></tr>
                         )}
                      </FMTable>
                   </FMBox>
                </div>
             )}

             {activeTab === 'CONTRACT' && (
                <div className="max-w-2xl mx-auto space-y-4 md:space-y-6 pt-4 w-full overflow-y-auto px-2">
                   <FMBox title="Detalles del Contrato">
                      <div className="p-3 md:p-4 bg-white space-y-3 md:space-y-4">
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">Valor estimado</span><span className="text-lg md:text-xl font-black text-slate-900">£{player.value.toLocaleString()}</span></div>
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">Sueldo mensual</span><span className="text-lg md:text-xl font-black text-blue-900">£{player.salary.toLocaleString()}</span></div>
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">Vencimiento</span><span className="text-sm font-bold text-slate-700">{player.contractExpiry.toLocaleDateString()}</span></div>
                         <div className="flex justify-between border-b pb-2"><span className="text-[10px] font-black text-slate-400 uppercase">Estado Transferencia</span><span className="text-xs font-black text-orange-600 uppercase">{player.transferStatus === 'TRANSFERABLE' ? 'Transferible' : player.transferStatus === 'LOANABLE' ? 'Cedible' : 'Indiscutible'}</span></div>
                      </div>
                   </FMBox>
                   {isUserPlayer && (
                      <div className="grid grid-cols-2 gap-2">
                         <FMButton variant="primary" onClick={() => setShowRenewalModal(true)}>Renovar Contrato</FMButton>
                         <FMButton variant="danger" onClick={handleRescind}>Rescindir</FMButton>
                      </div>
                   )}
                </div>
             )}

             {activeTab === 'INTERACTION' && (
               <div className="h-full flex flex-col p-2 gap-4 overflow-y-auto">
                  {personalMotive && !dialogueResult && (
                    <div className="bg-amber-100 border border-amber-300 p-3 rounded-sm flex items-start gap-3 animate-in slide-in-from-top-2">
                       <AlertCircle className="text-amber-600 shrink-0" size={18} />
                       <div className="flex-1">
                          <p className="text-[10px] font-black text-amber-700 uppercase">Petición del Jugador</p>
                          <p className="text-xs italic font-bold text-slate-800 mt-1">"{personalMotive}"</p>
                          <div className="mt-3 flex gap-2">
                             <button onClick={() => setDialogueResult(DialogueSystem.resolveInitiatedMotive(player, 'PROMISE', currentDate))} className="text-[9px] bg-green-600 text-white px-3 py-1 font-black uppercase rounded-[1px] hover:bg-green-700 transition-colors">Hacer Promesa</button>
                             <button onClick={() => setDialogueResult(DialogueSystem.resolveInitiatedMotive(player, 'IGNORE', currentDate))} className="text-[9px] bg-slate-400 text-white px-3 py-1 font-black uppercase rounded-[1px] hover:bg-slate-500 transition-colors">Ignorar</button>
                          </div>
                       </div>
                    </div>
                  )}

                  {dialogueResult ? (
                    <div className="bg-white border border-[#a0b0a0] p-6 rounded-sm text-center flex flex-col items-center gap-4 animate-in zoom-in">
                       <div className={`p-4 rounded-full border-4 ${dialogueResult.reactionType === 'POSITIVE' ? 'bg-green-100 border-green-500 text-green-600' : dialogueResult.reactionType === 'NEGATIVE' ? 'bg-red-100 border-red-500 text-red-600' : 'bg-slate-100 border-slate-400 text-slate-600'}`}>
                          <MessageCircle size={48} />
                       </div>
                       <h4 className="text-xl font-black uppercase italic tracking-tighter text-[#1a1a1a]">Respuesta del Jugador</h4>
                       <p className="text-sm font-bold italic text-slate-700 max-w-md">"{dialogueResult.text}"</p>
                       <div className="flex gap-2 items-center text-[10px] font-black">
                          <span className="text-slate-500 uppercase">Cambio Moral:</span>
                          <span className={dialogueResult.moraleChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                             {dialogueResult.moraleChange >= 0 ? '+' : ''}{dialogueResult.moraleChange}
                          </span>
                       </div>
                       <FMButton variant="secondary" onClick={() => setDialogueResult(null)} className="mt-4 px-12">Finalizar Charla</FMButton>
                    </div>
                  ) : (
                    <FMBox title="Charlas con el Jugador">
                       <div className="p-4 space-y-6">
                          <div>
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tema de Conversación</label>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  { id: 'PRAISE_FORM', label: 'Elogiar Forma' },
                                  { id: 'CRITICIZE_FORM', label: 'Criticar Rendimiento' },
                                  { id: 'PRAISE_TRAINING', label: 'Elogiar Entreno' },
                                  { id: 'DEMAND_MORE', label: 'Exigir más Esfuerzo' },
                                  { id: 'WARN_CONDUCT', label: 'Advertir Disciplina' }
                                ].map(opt => (
                                  <button key={opt.id} onClick={() => setDialogueType(opt.id as any)} className={`px-4 py-3 text-[10px] font-black uppercase rounded-[1px] border transition-all ${dialogueType === opt.id ? 'bg-[#3a4a3a] text-white border-black' : 'bg-white text-slate-700 border-[#a0b0a0]'}`}>{opt.label}</button>
                                ))}
                             </div>
                          </div>

                          <div>
                             <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Tono de Voz</label>
                             <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-inner">
                                {['MILD', 'MODERATE', 'AGGRESSIVE'].map(t => (
                                  <button key={t} onClick={() => setDialogueTone(t as any)} className={`flex-1 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all ${dialogueTone === t ? (t === 'AGGRESSIVE' ? 'bg-red-700 text-white' : 'bg-[#3a4a3a] text-white') : 'text-slate-700'}`}>{t === 'MILD' ? 'Tranquilo' : t === 'MODERATE' ? 'Directo' : 'Agresivo'}</button>
                                ))}
                             </div>
                          </div>

                          <div className="bg-slate-100 p-4 border border-slate-300 rounded-sm italic text-xs font-bold text-slate-600">
                             " {DialogueSystem.getTopicOptions(dialogueType)[dialogueTone]} "
                          </div>

                          <FMButton onClick={handleTalk} className="w-full py-4 text-xs tracking-widest"><MessageCircle size={14}/> Iniciar Diálogo</FMButton>
                       </div>
                    </FMBox>
                  )}
               </div>
             )}
          </div>
        </div>
      </div>
      {showRenewalModal && <ContractNegotiationModal player={player} userClubId={userClubId} currentDate={currentDate} onClose={() => setShowRenewalModal(false)} onRenewed={() => setShowRenewalModal(false)} />}
    </>
  );
};
