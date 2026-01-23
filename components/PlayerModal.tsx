
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
  <div className="flex justify-between items-center text-[11px] py-1 border-b border-slate-100 group hover:bg-slate-50 transition-colors">
    <span className="text-slate-600 truncate pr-2 group-hover:text-slate-950 font-medium">{ATTRIBUTE_LABELS[label] || label}</span>
    <span className={`font-bold ${getAttributeColor(value)} bg-slate-100 px-1.5 rounded min-w-[24px] text-center`}>
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
         className={`absolute w-6 h-6 sm:w-7 sm:h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white flex items-center justify-center text-[7px] font-black shadow-md
            ${isPrimary ? 'bg-blue-600 text-white' : 'bg-slate-400 text-white'}
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

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[150] md:p-4 backdrop-blur-sm">
        <div className="bg-white w-full h-full md:h-auto md:max-w-5xl md:max-h-[95vh] md:rounded-sm shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
          <div className={`h-1.5 w-full ${club?.primaryColor || 'bg-slate-800'}`}></div>
          <div className="bg-slate-50 p-6 flex justify-between items-start border-b border-slate-300">
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-2 mb-1">
                 <h2 className="text-3xl font-black text-slate-950 truncate tracking-tighter uppercase italic">{player.name}</h2>
                 <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-2 py-0.5 rounded border border-slate-200">{club?.name}</div>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 font-bold uppercase text-[11px] tracking-tight">
                 <span className="text-blue-700 font-black">{player.positions[0]}</span>
                 <span>{player.nationality} • {player.age} años</span>
                 <span>{player.height} cm • {player.weight} kg</span>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
          </div>

          <div className="flex border-b border-slate-300 bg-slate-50">
             {[
                { id: 'PROFILE', label: 'Atributos', icon: Activity },
                { id: 'POSITIONS', label: 'Posiciones', icon: Map },
                { id: 'STATS', label: 'Estadísticas', icon: BarChart2 },
                { id: 'CONTRACT', label: 'Contrato', icon: FileText },
                { id: 'INTERACTION', label: 'Charla', icon: MessageSquare }
             ].map((tab) => (
               <button 
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id as any); setDialogueResult(null); }}
                  className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border-b-2 ${activeTab === tab.id ? 'text-slate-950 border-slate-950 bg-white' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
               >
                  <tab.icon size={14} /> {tab.label}
               </button>
             ))}
          </div>

          <div className="overflow-y-auto flex-1 p-8 bg-white">
            {activeTab === 'PROFILE' && (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Técnica</h3>
                    <div className="space-y-0.5">{Object.entries(player.stats.technical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Mental</h3>
                    <div className="space-y-0.5">{Object.entries(player.stats.mental).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-widest border-b border-slate-100 pb-1">Físico</h3>
                      <div className="space-y-0.5">{Object.entries(player.stats.physical).map(([k,v]) => <AttributeRow key={k} label={k} value={v}/>)}</div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-sm border border-slate-200">
                       <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Informe de Ojeo</h3>
                       <div className="space-y-2">
                         {report.map((line, i) => <p key={i} className="text-[11px] text-slate-700 italic font-medium leading-relaxed">" {line} "</p>)}
                       </div>
                    </div>
                  </div>
               </div>
            )}
            {activeTab === 'POSITIONS' && (
               <div className="flex flex-col items-center">
                  <div className="relative w-full max-w-[320px] aspect-[68/105] shadow-lg bg-[#2d4a3e] border-2 border-slate-300 rounded-sm overflow-hidden">
                     <div className="absolute inset-0 opacity-10"><svg width="100%" height="100%"><rect width="100%" height="100%" fill="none" stroke="white" strokeWidth="2" strokeDasharray="5,5"/></svg></div>
                     {player.positions.map(p => <PositionMarker key={p} pos={p} isPrimary />)}
                     {player.secondaryPositions.map(p => <PositionMarker key={p} pos={p} />)}
                  </div>
               </div>
            )}
            {activeTab === 'CONTRACT' && (
               <div className="max-w-xl mx-auto space-y-8">
                  <div className="grid grid-cols-2 gap-8 border-b border-slate-200 pb-8">
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase">Valor Estimado</label><p className="text-3xl font-black text-slate-900 tracking-tighter">£{player.value.toLocaleString()}</p></div>
                     <div><label className="text-[10px] font-bold text-slate-500 uppercase">Salario Mensual</label><p className="text-xl font-bold text-slate-700">£{player.salary.toLocaleString()}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm font-bold">
                     <div className="flex justify-between"><span className="text-slate-500">Vencimiento</span><span className="text-slate-900">{player.contractExpiry.toLocaleDateString()}</span></div>
                     <div className="flex justify-between"><span className="text-slate-500">Estatus</span><span className="text-slate-900 uppercase text-[10px]">{player.transferStatus}</span></div>
                  </div>
               </div>
            )}
            {activeTab === 'STATS' && (
               <div className="max-w-md mx-auto space-y-4">
                  <div className="bg-slate-50 border border-slate-200 divide-y divide-slate-200 rounded-sm">
                     <div className="p-4 flex justify-between"><span>PJ</span><span className="font-bold">{player.seasonStats.appearances}</span></div>
                     <div className="p-4 flex justify-between"><span>Goles</span><span className="font-bold text-green-700">{player.seasonStats.goals}</span></div>
                     <div className="p-4 flex justify-between"><span>Asistencias</span><span className="font-bold text-blue-700">{player.seasonStats.assists}</span></div>
                     <div className="p-4 flex justify-between bg-slate-100 font-bold"><span>Calificación Media</span><span>{avgRating}</span></div>
                  </div>
               </div>
            )}
            {activeTab === 'INTERACTION' && (
               <div className="max-w-xl mx-auto space-y-8">
                  <div className="grid grid-cols-2 gap-3">
                     {['PRAISE_FORM', 'CRITICIZE_FORM', 'PRAISE_TRAINING', 'DEMAND_MORE'].map(t => (
                        <button key={t} onClick={() => handleInteraction(t as any)} className="p-4 border border-slate-200 rounded-sm text-[10px] font-black uppercase text-slate-600 hover:bg-slate-900 hover:text-white transition-all text-left">{t.replace('_', ' ')}</button>
                     ))}
                  </div>
                  {dialogueResult && <div className="p-6 bg-slate-50 border border-slate-200 italic text-slate-800 text-center font-medium">"{dialogueResult.text}"</div>}
               </div>
            )}
          </div>
          
          <footer className="p-4 border-t border-slate-300 bg-slate-50 flex justify-end gap-3">
            {!isUserPlayer ? (
               <button onClick={() => setShowOfferModal(true)} className="px-6 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-sm">Hacer Oferta</button>
            ) : (
               <button onClick={() => setShowRenewalModal(true)} className="px-6 py-2 border border-slate-900 text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-sm">Renovar Contrato</button>
            )}
          </footer>
        </div>
      </div>
      {showOfferModal && <TransferOfferModal player={player} userClubId={userClubId} onClose={() => setShowOfferModal(false)} onOfferMade={() => {}} currentDate={currentDate} />}
      {showRenewalModal && <ContractNegotiationModal player={player} userClubId={userClubId} currentDate={currentDate} onClose={() => setShowRenewalModal(false)} onRenewed={() => setShowRenewalModal(false)} />}
    </>
  );
};
