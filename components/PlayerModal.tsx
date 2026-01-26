
import React, { useState } from 'react';
import { Player, Attribute, DialogueType, DialogueResult, ATTRIBUTE_LABELS, Position, SquadType } from '../types';
import { world } from '../services/worldManager';
import { getAttributeColor } from '../constants';
import { ProfileNarrativeEngine } from '../services/engine';
import { DialogueSystem } from '../services/dialogueSystem';
import { TransferOfferModal } from './TransferOfferModal';
import { ContractNegotiationModal } from './ContractNegotiationModal';
import { X, MessageSquare, Activity, Map, BarChart2, FileText, History, TrendingUp, TrendingDown, ShieldAlert, ArrowRightLeft, UserX, UserPlus, Users } from 'lucide-react';
import { FMTable, FMTableCell, FMButton } from './FMUI';

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

const INTERACTION_LABELS: Record<string, string> = {
   'PRAISE_FORM': 'Elogiar Forma',
   'CRITICIZE_FORM': 'Criticar Forma',
   'PRAISE_TRAINING': 'Elogiar Entrenamiento',
   'DEMAND_MORE': 'Exigir Más',
   'WARN_CONDUCT': 'Advertir Conducta'
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
  const [attributeCategory, setAttributeCategory] = useState<'TECHNICAL' | 'MENTAL' | 'PHYSICAL'>('TECHNICAL');
  const [dialogueResult, setDialogueResult] = useState<DialogueResult | null>(null);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  
  // Force update to reflect immediate changes in actions
  const [, setForceUpdate] = useState(0);

  if (!player) return null;
  const isUserPlayer = player.clubId === userClubId;
  const club = world.getClub(player.clubId);
  const report = ProfileNarrativeEngine.generateScoutingReport(player);
  const headline = ProfileNarrativeEngine.generateHeadline(player);
  const isGK = player.positions.includes(Position.GK);

  const handleInteraction = (type: DialogueType) => {
     const result = DialogueSystem.getPlayerReaction(player, type);
     player.morale = Math.max(0, Math.min(100, player.morale + result.moraleChange));
     setDialogueResult(result);
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
          {/* Dynamic Header */}
          <div className={`${headerClasses} p-4 md:p-6 flex justify-between items-start border-b ${borderColor}`}>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col lg:flex-row lg:items-end gap-x-4 gap-y-1 mb-2">
                 <div className="flex flex-wrap items-baseline gap-2 md:gap-3">
                    <h2 className="text-2xl md:text-3xl font-black truncate tracking-tighter uppercase italic drop-shadow-sm">{player.name}</h2>
                    <div className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded border border-white/30 backdrop-blur-sm self-center">{club?.name}</div>
                    {player.developmentTrend === 'RISING' && (
                       <div className="flex items-center gap-1 bg-green-500/20 text-current px-2 py-0.5 rounded border border-green-500/30 self-center" title="En progresión">
                          <TrendingUp size={10} /> <span className="text-[8px] font-black uppercase">Mejorando</span>
                       </div>
                    )}
                    {player.developmentTrend === 'DECLINING' && (
                       <div className="flex items-center gap-1 bg-red-500/20 text-current px-2 py-0.5 rounded border border-red-500/30 self-center" title="En declive">
                          <TrendingDown size={10} /> <span className="text-[8px] font-black uppercase">Declive</span>
                       </div>
                    )}
                 </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-bold uppercase text-[10px] tracking-tight opacity-90 mt-1 mb-3">
                 <span className="font-black text-xs bg-black/10 px-2 rounded-sm">{player.positions[0]}</span>
                 <span>{player.nationality}</span>
                 <span className="opacity-60">•</span>
                 <span>{player.age} AÑOS</span>
                 <span className="opacity-60">•</span>
                 <span>{player.height} CM</span>
                 <span className="opacity-60">•</span>
                 <span>{player.weight} KG</span>
              </div>

              <div className="text-sm md:text-base text-current opacity-95 font-medium leading-tight">
                 "{headline}"
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
                  onClick={() => { setActiveTab(tab.id as any); setDialogueResult(null); }}
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
                  {/* Mobile Sub-Nav */}
                  <div className="flex gap-2 p-1 bg-slate-100 rounded-sm mb-4">
                     {['TECHNICAL', 'MENTAL', 'PHYSICAL'].map(cat => (
                        <button 
                           key={cat}
                           onClick={() => setAttributeCategory(cat as any)}
                           className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest rounded-sm transition-all ${attributeCategory === cat ? 'bg-slate-900 text-white shadow' : 'text-slate-500 hover:text-slate-900'}`}
                        >
                           {cat === 'TECHNICAL' ? 'Técnica' : cat === 'MENTAL' ? 'Mental' : 'Físico'}
                        </button>
                     ))}
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:hidden">
                     {attributeCategory === 'TECHNICAL' && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                           {Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}
                        </div>
                     )}
                     {attributeCategory === 'MENTAL' && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                           {Object.entries(player.stats.mental).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}
                        </div>
                     )}
                     {attributeCategory === 'PHYSICAL' && (
                        <div className="space-y-0.5 animate-in fade-in slide-in-from-left-2 duration-200">
                           {Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}
                        </div>
                     )}
                  </div>

                  {/* Desktop Full View */}
                  <div className="hidden md:grid md:grid-cols-3 gap-8">
                     <div className="space-y-4">
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Técnica</h3>
                        <div className="space-y-0.5">{Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Mental</h3>
                        <div className="space-y-0.5">{Object.entries(player.stats.mental).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                     </div>
                     <div className="space-y-4">
                        <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Físico</h3>
                        <div className="space-y-0.5">{Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                     </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-sm border border-slate-200 mt-6">
                     <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Informe de Ojeo</h3>
                     <div className="space-y-2">
                       {report.map((line, i) => <p key={i} className="text-[11px] text-slate-700 italic font-medium leading-relaxed">" {line} "</p>)}
                     </div>
                  </div>
               </div>
            )}
            {activeTab === 'POSITIONS' && (
               <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
                  <div className="relative w-full max-w-[320px] aspect-[68/105] shadow-2xl bg-[#1e3a29] border-4 border-slate-300 rounded-sm overflow-hidden ring-4 ring-slate-100">
                     {/* Detailed Pitch SVG */}
                     <svg width="100%" height="100%" viewBox="0 0 68 105" className="absolute inset-0 w-full h-full">
                        {/* Grass Patterns */}
                        <defs>
                           <pattern id="grass" width="68" height="10" patternUnits="userSpaceOnUse">
                              <rect width="68" height="5" fill="#2d5a40" />
                              <rect y="5" width="68" height="5" fill="#35684a" />
                           </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grass)" />
                        
                        {/* Lines */}
                        <g fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1">
                           {/* Outer Boundary */}
                           <rect x="2" y="2" width="64" height="101" />
                           {/* Halfway Line */}
                           <line x1="2" y1="52.5" x2="66" y2="52.5" />
                           {/* Center Circle */}
                           <circle cx="34" cy="52.5" r="9" />
                           <circle cx="34" cy="52.5" r="0.5" fill="white" />
                           
                           {/* Top Box */}
                           <rect x="19" y="2" width="30" height="16" />
                           <rect x="26" y="2" width="16" height="5.5" />
                           
                           {/* Bottom Box */}
                           <rect x="19" y="87" width="30" height="16" />
                           <rect x="26" y="97.5" width="16" height="5.5" />
                           
                           {/* Arcs */}
                           <path d="M 26,18 A 9,9 0 0,0 42,18" />
                           <path d="M 26,87 A 9,9 0 0,1 42,87" />
                           
                           {/* Corners */}
                           <path d="M 2,5 A 3,3 0 0,0 5,2" />
                           <path d="M 63,2 A 3,3 0 0,0 66,5" />
                           <path d="M 2,100 A 3,3 0 0,1 5,103" />
                           <path d="M 66,100 A 3,3 0 0,0 63,103" />
                        </g>
                     </svg>

                     {/* Players chips */}
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
                        
                        {/* Move Squad Buttons */}
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
                  {/* Mobile Compact Grid */}
                  <div className="grid grid-cols-2 gap-3">
                     <StatBox label="Partidos" value={player.seasonStats.appearances} />
                     <StatBox label="Goles" value={player.seasonStats.goals} color="text-green-700" />
                     <StatBox label="Asistencias" value={player.seasonStats.assists} color="text-blue-700" />
                     <StatBox label="Calif. Media" value={avgRating} bg="bg-slate-100" />
                     {isGK && (
                        <>
                           <StatBox label="Encajados" value={player.seasonStats.conceded} color="text-red-700" />
                           <StatBox label="Valla Invicta" value={player.seasonStats.cleanSheets} />
                        </>
                     )}
                  </div>
               </div>
            )}
            {activeTab === 'HISTORY' && (
               <div className="max-w-2xl mx-auto">
                  <FMTable 
                     headers={['Año', 'Club', 'PJ', 'G', 'Ast', 'Med', ...(isGK ? ['Enc', 'Inv'] : [])]}
                     colWidths={['45px', 'auto', '35px', '35px', '35px', '45px', ...(isGK ? ['35px', '35px'] : [])]}
                  >
                     <tr className="bg-blue-50 font-bold border-l-4 border-l-blue-600">
                        <FMTableCell className="font-mono text-blue-900">{currentDate.getFullYear()}</FMTableCell>
                        <FMTableCell className="text-blue-900 italic truncate max-w-[120px]">{club?.name}</FMTableCell>
                        <FMTableCell className="text-center" isNumber>{player.seasonStats.appearances}</FMTableCell>
                        <FMTableCell className="text-center text-green-700" isNumber>{player.seasonStats.goals}</FMTableCell>
                        <FMTableCell className="text-center text-blue-700" isNumber>{player.seasonStats.assists}</FMTableCell>
                        <FMTableCell className="text-center bg-blue-100" isNumber>{avgRating}</FMTableCell>
                        {isGK && (
                           <>
                              <FMTableCell className="text-center text-red-700" isNumber>{player.seasonStats.conceded}</FMTableCell>
                              <FMTableCell className="text-center text-slate-700" isNumber>{player.seasonStats.cleanSheets}</FMTableCell>
                           </>
                        )}
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
                              {isGK && (
                                 <>
                                    <FMTableCell className="text-center text-red-700/80" isNumber>{h.stats.conceded || 0}</FMTableCell>
                                    <FMTableCell className="text-center text-slate-600" isNumber>{h.stats.cleanSheets}</FMTableCell>
                                 </>
                              )}
                           </tr>
                        )
                     })}
                     {player.history.length === 0 && (
                        <tr>
                           <td colSpan={isGK ? 8 : 6} className="p-8 text-center text-slate-400 italic text-[10px] uppercase font-black tracking-widest">
                              No hay registros históricos previos.
                           </td>
                        </tr>
                     )}
                  </FMTable>
               </div>
            )}
            {activeTab === 'INTERACTION' && (
               <div className="max-w-xl mx-auto space-y-8">
                  <div className="grid grid-cols-2 gap-3">
                     {Object.keys(INTERACTION_LABELS).map(t => (
                        <button key={t} onClick={() => handleInteraction(t as any)} className="p-4 border border-slate-200 rounded-sm text-[10px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-left">
                           {INTERACTION_LABELS[t]}
                        </button>
                     ))}
                  </div>
                  {dialogueResult && <div className="p-6 bg-slate-50 border border-slate-200 italic text-slate-800 text-center font-medium">"{dialogueResult.text}"</div>}
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
