
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Player, Position, Club, TacticSettings, PlayerTacticSettings, Tactic } from '../types';
import { world } from '../services/worldManager';
import { SLOT_CONFIG } from '../services/engine';
import { Save, UserCheck, SlidersHorizontal, MousePointer2, Settings2, Trash2, ArrowUpRight, ChevronRight, LayoutGrid, ClipboardList } from 'lucide-react';
import { FMButton, FMBox } from './FMUI';

interface TacticsViewProps {
   players: Player[];
   club: Club;
   onUpdatePlayer: (player: Player) => void;
   onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

const SLOT_COORDS: Record<number, { t: number, l: number }> = {
   0: { t: 90, l: 50 }, // GK
   
   // LIBERO / SWEEPER
   31: { t: 82.5, l: 50 }, // LIB
   
   // DEFENSE (t: 75)
   1: { t: 75, l: 8 },  2: { t: 75, l: 29 }, 3: { t: 75, l: 50 }, 4: { t: 75, l: 71 }, 5: { t: 75, l: 92 },
   
   // DM (t: 62)
   9: { t: 62, l: 8 },  6: { t: 62, l: 29 }, 8: { t: 62, l: 50 }, 7: { t: 62, l: 71 }, 10: { t: 62, l: 92 },
   
   // MID (t: 45)
   11: { t: 45, l: 8 }, 12: { t: 45, l: 29 }, 13: { t: 45, l: 50 }, 14: { t: 45, l: 71 }, 15: { t: 45, l: 92 },
   
   // AM (t: 28)
   16: { t: 28, l: 8 }, 19: { t: 28, l: 29 }, 17: { t: 28, l: 50 }, 20: { t: 28, l: 71 }, 18: { t: 28, l: 92 },
   
   // ATT (t: 12)
   27: { t: 12, l: 8 }, 29: { t: 12, l: 29 }, 26: { t: 12, l: 50 }, 30: { t: 12, l: 71 }, 28: { t: 12, l: 92 },
};

const SliderRow: React.FC<{ 
    label: string; 
    value: number; 
    min?: number; 
    max?: number; 
    onChange: (val: number) => void; 
    getLabel?: (val: number) => string;
}> = ({ label, value, min = 1, max = 20, onChange, getLabel }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-2 border-b border-[#a0b0a0]/20 hover:bg-black/5 px-2 group">
        <div className="flex justify-between items-center sm:w-32">
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>{label}</span>
            <span className="sm:hidden text-[10px] font-black text-slate-900 uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>
                {getLabel ? getLabel(value) : value}
            </span>
        </div>
        <div className="flex items-center gap-3 flex-1">
            <input 
                type="range" min={min} max={max} step="1" 
                className="flex-1 accent-[#3a4a3a] h-1.5 bg-slate-300 rounded-lg appearance-none cursor-pointer"
                value={value} 
                onChange={(e) => onChange(parseInt(e.target.value))} 
            />
            <span className="hidden sm:inline w-24 text-[10px] font-black text-slate-900 text-right uppercase" style={{ fontFamily: 'Verdana, sans-serif' }}>
                {getLabel ? getLabel(value) : value}
            </span>
        </div>
    </div>
);

const CheckboxRow: React.FC<{ label: string; checked: boolean; onChange: (val: boolean) => void }> = ({ label, checked, onChange }) => (
    <label className="flex items-center gap-3 py-2 cursor-pointer hover:bg-black/5 px-2 group border-b border-[#a0b0a0]/10 sm:border-0">
        <div className={`w-5 h-5 border border-[#3a4a3a] rounded-[1px] flex items-center justify-center transition-colors shadow-inner ${checked ? 'bg-[#3a4a3a]' : 'bg-white'}`}>
            {checked && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
        </div>
        <input type="checkbox" className="hidden" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>{label}</span>
    </label>
);

const CycleOption: React.FC<{ label: string; value: string; options: { id: string; label: string }[]; onChange: (val: any) => void }> = ({ label, value, options, onChange }) => (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 py-2 border-b border-[#a0b0a0]/20 px-2 group">
        <span className="sm:w-32 text-[10px] font-black text-slate-600 uppercase tracking-tight" style={{ fontFamily: 'Verdana, sans-serif' }}>{label}</span>
        <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-sm">
            {options.map(opt => (
                <button 
                    key={opt.id} 
                    onClick={() => onChange(opt.id)}
                    className={`flex-1 py-2 text-[8px] font-black uppercase rounded-[1px] transition-all ${value === opt.id ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-600 hover:bg-black/5'}`}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    </div>
);

export const TacticsView: React.FC<TacticsViewProps> = ({ players, club, onUpdatePlayer, onContextMenu }) => {
   const [viewMode, setViewMode] = useState<'PITCH' | 'INSTRUCTIONS'>('PITCH');
   const [instructionType, setInstructionType] = useState<'TEAM' | 'INDIVIDUAL'>('TEAM');
   const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
   const [selectedTacticId, setSelectedTacticId] = useState<string>('');
   const [newTacticName, setNewTacticName] = useState('');
   const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
   
   const [draggingSlot, setDraggingSlot] = useState<number | null>(null);
   const [drawingArrowFrom, setDrawingArrowFrom] = useState<number | null>(null);
   const [currentHoverSlot, setCurrentHoverSlot] = useState<number | null>(null);

   const activeTactic = world.getTactics().find(t => t.id === selectedTacticId) || world.getTactics()[0];
   const starters = players.filter(p => p.isStarter && p.tacticalPosition !== undefined);
   const bench = players.filter(p => !p.isStarter && !p.injury && !p.suspension).sort((a,b) => b.currentAbility - a.currentAbility);

   useEffect(() => {
      if (activeTactic) {
         setSelectedTacticId(activeTactic.id);
      }
   }, []);

   const updateTeamSettings = (key: keyof TacticSettings, val: any) => {
       if (!activeTactic) return;
       activeTactic.settings = { ...activeTactic.settings, [key]: val };
       onUpdatePlayer(players[0]); 
   };

   const updateIndividualSettings = (slot: number, key: keyof PlayerTacticSettings, val: any) => {
       if (!activeTactic) return;
       if (!activeTactic.individualSettings[slot]) {
           activeTactic.individualSettings[slot] = {
               mentality: 10, creativeFreedom: 10, passingStyle: 10, closingDown: 10, tackling: 10,
               forwardRuns: 'MIXED', runWithBall: 'MIXED', longShots: 'MIXED', throughBalls: 'MIXED',
               crossBall: 'MIXED', marking: 'ZONAL', tightMarking: false, holdUpBall: false
           };
       }
       activeTactic.individualSettings[slot] = { ...activeTactic.individualSettings[slot], [key]: val };
       onUpdatePlayer(players[0]);
   };

   const handleAutoPick = () => {
      const currentSquad = players.length > 0 ? players[0].squad : 'SENIOR';
      world.selectBestEleven(club.id, currentSquad, activeTactic.id); 
      if (players.length > 0) onUpdatePlayer(players[0]);
   };

   const isPlayerSuitableForLine = (p: Player, line: string) => {
       const pos = p.positions[0];
       if (line === 'GK') return pos === Position.GK;
       if (line === 'SW') return pos === Position.SW;
       if (line === 'DEF') return [Position.DC, Position.DL, Position.DR].includes(pos);
       if (line === 'DM') return [Position.DM, Position.DMC, Position.DMR, Position.DML].includes(pos);
       if (line === 'MID') return [Position.MC, Position.ML, Position.MR, Position.MCL, Position.MCR].includes(pos);
       if (line === 'AM') return [Position.AM, Position.AML, Position.AMR, Position.AMC].includes(pos);
       if (line === 'ATT') return [Position.ST, Position.STR, Position.STL].includes(pos);
       return false;
   };

   const handleTacticChange = (tacticId: string) => {
       setSelectedTacticId(tacticId);
       const newTactic = world.getTactics().find(t => t.id === tacticId);
       if (!newTactic) return;

       const currentStarters = players.filter(p => p.isStarter);
       const unassignedPlayers = [...currentStarters];
       const targetSlots = [...newTactic.positions];

       // Clear current positions
       unassignedPlayers.forEach(p => p.tacticalPosition = undefined);

       // 1. Assign GK
       const gkSlot = targetSlots.find(s => SLOT_CONFIG[s].line === 'GK');
       if (gkSlot !== undefined) {
           const gkIdx = unassignedPlayers.findIndex(p => p.positions.includes(Position.GK));
           if (gkIdx !== -1) {
               unassignedPlayers[gkIdx].tacticalPosition = gkSlot;
               unassignedPlayers.splice(gkIdx, 1);
               targetSlots.splice(targetSlots.indexOf(gkSlot), 1);
           }
       }

       // 2. Assign remaining based on line suitability
       for (const slot of [...targetSlots]) {
           if (!targetSlots.includes(slot)) continue;
           
           const line = SLOT_CONFIG[slot].line;
           let bestIdx = unassignedPlayers.findIndex(p => isPlayerSuitableForLine(p, line));
           
           if (bestIdx === -1 && unassignedPlayers.length > 0) {
               bestIdx = 0; // Fallback
           }

           if (bestIdx !== -1) {
               unassignedPlayers[bestIdx].tacticalPosition = slot;
               unassignedPlayers.splice(bestIdx, 1);
               targetSlots.splice(targetSlots.indexOf(slot), 1);
           }
       }
       
       onUpdatePlayer(players[0]);
   };

   const handleSlotDrop = (targetSlot: number) => {
      if (draggingSlot === null || draggingSlot === targetSlot) return;
      
      const p1 = starters.find(p => p.tacticalPosition === draggingSlot);
      const p2 = starters.find(p => p.tacticalPosition === targetSlot);

      if (p1) p1.tacticalPosition = targetSlot;
      if (p2) p2.tacticalPosition = draggingSlot;

      const idx1 = activeTactic.positions.indexOf(draggingSlot);
      const idx2 = activeTactic.positions.indexOf(targetSlot);
      if (idx1 !== -1) activeTactic.positions[idx1] = targetSlot;
      if (idx2 !== -1) activeTactic.positions[idx2] = draggingSlot;
      
      // If we move to an empty slot, ensure it becomes active in the tactic definition
      if (idx1 === -1 && p1) activeTactic.positions.push(targetSlot);
      if (idx1 !== -1 && !p2 && idx2 === -1) {
          // If we moved a player FROM a slot to an empty slot, and no one swapped back, remove the old slot
          activeTactic.positions.splice(idx1, 1);
          activeTactic.positions.push(targetSlot);
      }

      const sSlot = draggingSlot as number;
      const settings1 = activeTactic.individualSettings[sSlot];
      const settings2 = activeTactic.individualSettings[targetSlot];
      if (settings1) activeTactic.individualSettings[targetSlot] = settings1;
      else delete activeTactic.individualSettings[targetSlot];
      if (settings2) activeTactic.individualSettings[sSlot] = settings2;
      else delete activeTactic.individualSettings[sSlot];

      const arrow1 = activeTactic.arrows[sSlot];
      const arrow2 = activeTactic.arrows[targetSlot];
      if (arrow1 !== undefined) activeTactic.arrows[targetSlot] = arrow1;
      else delete activeTactic.arrows[targetSlot];
      if (arrow2 !== undefined) activeTactic.arrows[sSlot] = arrow2;
      else delete activeTactic.arrows[sSlot];

      setDraggingSlot(null);
      onUpdatePlayer(players[0]);
   };

   const handleCreateArrow = (targetSlot: number) => {
       if (drawingArrowFrom === null) return;
       if (drawingArrowFrom !== targetSlot) {
           activeTactic.arrows[drawingArrowFrom] = targetSlot;
       } else {
           delete activeTactic.arrows[drawingArrowFrom];
       }
       setDrawingArrowFrom(null);
       onUpdatePlayer(players[0]);
   };

   const getMentalityLabel = (v: number) => v <= 4 ? "Ultra Def." : v <= 8 ? "Defensiva" : v <= 12 ? "Normal" : v <= 16 ? "Atacante" : "Agobio";

   const renderPitch = () => (
      <div className="relative w-full max-w-[420px] aspect-[3/4] shadow-2xl bg-[#1e3a29] border-[3px] border-white/30 rounded-sm overflow-hidden ring-4 ring-[#a0b0a0]/30"
           onMouseLeave={() => { setDraggingSlot(null); setDrawingArrowFrom(null); setCurrentHoverSlot(null); }}>
          <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
             <g stroke="white" strokeWidth="2" fill="none">
                <rect x="5%" y="5%" width="90%" height="90%" />
                <line x1="5%" y1="50%" x2="95%" y2="50%" />
                <circle cx="50%" cy="50%" r="15%" />
                <rect x="25%" y="5%" width="50%" height="15%" />
                <rect x="25%" y="80%" width="50%" height="15%" />
             </g>
          </svg>

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                  <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#fbbf24" />
                  </marker>
              </defs>
              {Object.entries(activeTactic.arrows).map(([from, to]) => {
                  const start = SLOT_COORDS[parseInt(from)];
                  const end = SLOT_COORDS[to];
                  if (!start || !end) return null;
                  return (
                      <line key={from} x1={`${start.l}%`} y1={`${start.t}%`} x2={`${end.l}%`} y2={`${end.t}%`} 
                            stroke="#fbbf24" strokeWidth="2" strokeDasharray="4" markerEnd="url(#arrowhead)" />
                  );
              })}
          </svg>

          {Object.entries(SLOT_COORDS).map(([idx, coords]) => {
             const slotIdx = parseInt(idx);
             const p = starters.find(pl => pl.tacticalPosition === slotIdx);
             const isSelected = selectedSlot === slotIdx;
             
             // Render ALL slots to allow free dragging
             return (
                <div 
                    key={idx} 
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 sm:w-16 sm:h-16 flex flex-col items-center justify-center z-10 
                                ${draggingSlot === slotIdx ? 'opacity-30 scale-90' : ''}
                                ${currentHoverSlot === slotIdx ? 'ring-2 ring-white/50 rounded-full' : ''}`} 
                    style={{ top: `${coords.t}%`, left: `${coords.l}%` }}
                    onMouseEnter={() => setCurrentHoverSlot(slotIdx)}
                    onMouseDown={(e) => {
                        if (e.button === 0) setDraggingSlot(slotIdx);
                        if (e.button === 2) setDrawingArrowFrom(slotIdx);
                        setSelectedSlot(slotIdx);
                    }}
                    onMouseUp={() => {
                        if (draggingSlot !== null) handleSlotDrop(slotIdx);
                        if (drawingArrowFrom !== null) handleCreateArrow(slotIdx);
                    }}
                    onContextMenu={(e) => { e.preventDefault(); if (p) onContextMenu?.(e, p); }}
                >
                   {p ? (
                      <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-full border-2 flex items-center justify-center font-black text-[9px] sm:text-xs shadow-lg transition-all hover:scale-110 cursor-pointer ${isSelected ? 'ring-4 ring-yellow-400' : ''} ${p.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : `${club.primaryColor} ${club.secondaryColor} border-black/20`}`}>
                         {p.positions[0]}
                         <div className="absolute -bottom-4 sm:-bottom-5 bg-black/80 text-white px-1.5 py-0.5 rounded-[1px] text-[7px] sm:text-[8px] font-black uppercase whitespace-nowrap truncate max-w-[60px] sm:max-w-[80px] shadow-sm">
                            {p.name.split(' ').pop()}
                         </div>
                      </div>
                   ) : (
                      <div className={`w-7 h-7 sm:w-10 sm:h-10 rounded-full border border-dashed flex items-center justify-center transition-colors ${currentHoverSlot === slotIdx ? 'border-white bg-white/20' : 'border-white/10'}`}>
                         {/* Show subtle indicator for empty slots */}
                      </div>
                   )}
                </div>
             );
          })}
      </div>
   );

   return (
      <div className="flex flex-col h-full bg-[#d4dcd4] overflow-hidden select-none" onContextMenu={e => e.preventDefault()}>
         {/* Tactic Toolbar - Tier 1 */}
         <div className="bg-[#e8ece8] border-b border-[#a0b0a0] p-2 flex flex-col gap-2 z-30 shadow-sm">
            <div className="flex items-center justify-between gap-2">
                <select className="bg-white border border-[#a0b0a0] text-[10px] font-black px-3 py-2 uppercase rounded-sm shadow-inner flex-1 max-w-[200px]" 
                   value={selectedTacticId} 
                   onChange={(e) => handleTacticChange(e.target.value)}
                >
                   {world.getTactics().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                
                <div className="flex bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] shadow-inner">
                    <button onClick={() => setViewMode('PITCH')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-[1px] transition-all flex items-center gap-1.5 ${viewMode === 'PITCH' ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'}`}>
                        <LayoutGrid size={12} /> <span className="hidden sm:inline">DIBUJO</span>
                    </button>
                    <button onClick={() => setViewMode('INSTRUCTIONS')} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-[1px] transition-all flex items-center gap-1.5 ${viewMode === 'INSTRUCTIONS' ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'}`}>
                        <ClipboardList size={12} /> <span className="hidden sm:inline">INSTRUCCIONES</span>
                    </button>
                </div>
            </div>

            {/* Toolbar - Tier 2 */}
            <div className="flex gap-2">
                <FMButton variant="secondary" onClick={handleAutoPick} className="flex-1 py-2 text-[9px]">
                   <UserCheck size={12}/> ELEGIR 11
                </FMButton>
                <FMButton variant="primary" onClick={() => setIsSaveModalOpen(true)} className="flex-1 py-2 text-[9px]">
                   <Save size={12}/> GUARDAR
                </FMButton>
            </div>
         </div>

         <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 relative overflow-y-auto custom-scroll bg-[#cbd5e1]/30 p-2 sm:p-4 flex justify-center items-start">
               {viewMode === 'PITCH' ? (
                  <div className="flex flex-col items-center gap-4 w-full">
                      {renderPitch()}
                      <div className="w-full max-w-[420px] bg-white/60 p-2 rounded-sm border border-[#a0b0a0] text-[8px] font-black text-slate-500 uppercase tracking-widest flex flex-wrap justify-center gap-3 sm:gap-6 shadow-sm">
                          <span className="flex items-center gap-1.5"><MousePointer2 size={10} className="text-slate-400" /> IZQ: MOVER / ELEGIR</span>
                          <span className="flex items-center gap-1.5"><ArrowUpRight size={10} className="text-slate-400" /> DER: DIBUJAR FLECHA</span>
                      </div>
                  </div>
               ) : (
                  <div className="w-full max-w-4xl flex flex-col gap-4 pb-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="flex gap-1 bg-[#bcc8bc] p-0.5 rounded-sm border border-[#a0b0a0] self-stretch sm:self-start shadow-sm">
                          <button onClick={() => setInstructionType('TEAM')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all ${instructionType === 'TEAM' ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'}`}>Instrucciones de Equipo</button>
                          <button onClick={() => setInstructionType('INDIVIDUAL')} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 text-[9px] font-black uppercase rounded-[1px] transition-all ${instructionType === 'INDIVIDUAL' ? 'bg-[#3a4a3a] text-white shadow-md' : 'text-slate-700 hover:bg-black/5'}`}>Instrucciones Individuales</button>
                      </div>

                      {instructionType === 'TEAM' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <FMBox title="Instrucciones de Equipo" noPadding className="shadow-lg">
                                <div className="p-2 sm:p-4 bg-white/50 space-y-0.5">
                                    <SliderRow label="Mentalidad" value={activeTactic.settings.mentality} onChange={(v) => updateTeamSettings('mentality', v)} getLabel={getMentalityLabel} />
                                    <SliderRow label="Libertad Creativa" value={activeTactic.settings.creativeFreedom} onChange={(v) => updateTeamSettings('creativeFreedom', v)} />
                                    <SliderRow label="Estilo de Pase" value={activeTactic.settings.passingStyle} onChange={(v) => updateTeamSettings('passingStyle', v)} />
                                    <SliderRow label="Tempo" value={activeTactic.settings.tempo} onChange={(v) => updateTeamSettings('tempo', v)} />
                                    <SliderRow label="Anchura" value={activeTactic.settings.width} onChange={(v) => updateTeamSettings('width', v)} />
                                    <SliderRow label="Presión" value={activeTactic.settings.closingDown} onChange={(v) => updateTeamSettings('closingDown', v)} />
                                    <SliderRow label="Pérdida de Tiempo" value={activeTactic.settings.timeWasting} onChange={(v) => updateTeamSettings('timeWasting', v)} />
                                    <SliderRow label="Línea Defensiva" value={activeTactic.settings.defensiveLine} onChange={(v) => updateTeamSettings('defensiveLine', v)} />
                                    <SliderRow label="Entradas" value={activeTactic.settings.tackling} onChange={(v) => updateTeamSettings('tackling', v)} />
                                </div>
                            </FMBox>
                            <FMBox title="Órdenes Específicas" noPadding className="shadow-lg">
                                <div className="p-2 sm:p-4 bg-white/50 grid grid-cols-1 sm:grid-cols-2 gap-x-2">
                                    <CheckboxRow label="Marcaje Férreo" checked={activeTactic.settings.tightMarking} onChange={(v) => updateTeamSettings('tightMarking', v)} />
                                    <CheckboxRow label="Hombre Objetivo" checked={activeTactic.settings.useTargetMan} onChange={(v) => updateTeamSettings('useTargetMan', v)} />
                                    <CheckboxRow label="Usar Organizador" checked={activeTactic.settings.usePlaymaker} onChange={(v) => updateTeamSettings('usePlaymaker', v)} />
                                    <CheckboxRow label="Fuera de Juego" checked={activeTactic.settings.playOffside} onChange={(v) => updateTeamSettings('playOffside', v)} />
                                    <CheckboxRow label="Contraataque" checked={activeTactic.settings.counterAttack} onChange={(v) => updateTeamSettings('counterAttack', v)} />
                                </div>
                            </FMBox>
                          </div>
                      ) : (
                          <div className="flex flex-col md:flex-row gap-4 min-h-[500px]">
                              {/* Selected Position Indicator */}
                              <div className="w-full md:w-48 shrink-0 flex flex-col gap-2">
                                  <div className="h-[250px] md:h-[280px] flex justify-center">
                                     {renderPitch()}
                                  </div>
                                  {selectedSlot !== null && starters.find(p => p.tacticalPosition === selectedSlot) && (
                                      <div className="p-3 bg-[#e8ece8] border border-[#a0b0a0] rounded-sm text-center shadow-md border-t-4 border-t-slate-800">
                                          <p className="text-[10px] font-black uppercase text-slate-900 truncate">
                                              {starters.find(p => p.tacticalPosition === selectedSlot)?.name}
                                          </p>
                                          <p className="text-[8px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Línea: {SLOT_CONFIG[selectedSlot].line}</p>
                                      </div>
                                  )}
                              </div>

                              <div className="flex-1 overflow-y-auto custom-scroll">
                                  {selectedSlot !== null ? (
                                      <div className="space-y-4">
                                          <FMBox title="Instrucciones Individuales" noPadding className="shadow-lg">
                                              <div className="p-2 sm:p-4 bg-white/50 space-y-0.5">
                                                  <SliderRow label="Mentalidad" value={activeTactic.individualSettings[selectedSlot]?.mentality || 10} onChange={(v) => updateIndividualSettings(selectedSlot, 'mentality', v)} getLabel={getMentalityLabel} />
                                                  <SliderRow label="Libertad Creativa" value={activeTactic.individualSettings[selectedSlot]?.creativeFreedom || 10} onChange={(v) => updateIndividualSettings(selectedSlot, 'creativeFreedom', v)} />
                                                  <SliderRow label="Estilo de Pase" value={activeTactic.individualSettings[selectedSlot]?.passingStyle || 10} onChange={(v) => updateIndividualSettings(selectedSlot, 'passingStyle', v)} />
                                                  <SliderRow label="Presión" value={activeTactic.individualSettings[selectedSlot]?.closingDown || 10} onChange={(v) => updateIndividualSettings(selectedSlot, 'closingDown', v)} />
                                                  <SliderRow label="Entradas" value={activeTactic.individualSettings[selectedSlot]?.tackling || 10} onChange={(v) => updateIndividualSettings(selectedSlot, 'tackling', v)} />
                                                  
                                                  <div className="pt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4">
                                                      <CycleOption label="Subidas" value={activeTactic.individualSettings[selectedSlot]?.forwardRuns || 'MIXED'} options={[{id:'RARELY', label:'Poco'}, {id:'MIXED', label:'A veces'}, {id:'OFTEN', label:'Siempre'}]} onChange={(v) => updateIndividualSettings(selectedSlot, 'forwardRuns', v)} />
                                                      <CycleOption label="Correr con balón" value={activeTactic.individualSettings[selectedSlot]?.runWithBall || 'MIXED'} options={[{id:'RARELY', label:'Poco'}, {id:'MIXED', label:'A veces'}, {id:'OFTEN', label:'Siempre'}]} onChange={(v) => updateIndividualSettings(selectedSlot, 'runWithBall', v)} />
                                                      <CycleOption label="Tiros lejanos" value={activeTactic.individualSettings[selectedSlot]?.longShots || 'MIXED'} options={[{id:'RARELY', label:'Poco'}, {id:'MIXED', label:'A veces'}, {id:'OFTEN', label:'Siempre'}]} onChange={(v) => updateIndividualSettings(selectedSlot, 'longShots', v)} />
                                                      <CycleOption label="Pases al hueco" value={activeTactic.individualSettings[selectedSlot]?.throughBalls || 'MIXED'} options={[{id:'RARELY', label:'Poco'}, {id:'MIXED', label:'A veces'}, {id:'OFTEN', label:'Siempre'}]} onChange={(v) => updateIndividualSettings(selectedSlot, 'throughBalls', v)} />
                                                      <CycleOption label="Centrar balón" value={activeTactic.individualSettings[selectedSlot]?.crossBall || 'MIXED'} options={[{id:'RARELY', label:'Poco'}, {id:'MIXED', label:'A veces'}, {id:'OFTEN', label:'Siempre'}]} onChange={(v) => updateIndividualSettings(selectedSlot, 'crossBall', v)} />
                                                  </div>

                                                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 border-t border-[#a0b0a0]/20 mt-2">
                                                      <CheckboxRow label="Marcaje Férreo" checked={activeTactic.individualSettings[selectedSlot]?.tightMarking || false} onChange={(v) => updateIndividualSettings(selectedSlot, 'tightMarking', v)} />
                                                      <CheckboxRow label="Aguantar Balón" checked={activeTactic.individualSettings[selectedSlot]?.holdUpBall || false} onChange={(v) => updateIndividualSettings(selectedSlot, 'holdUpBall', v)} />
                                                  </div>
                                              </div>
                                          </FMBox>
                                      </div>
                                  ) : (
                                      <div className="h-48 md:h-full flex flex-col items-center justify-center text-slate-400 bg-white/20 rounded border-2 border-dashed border-slate-400 shadow-inner">
                                          <MousePointer2 size={32} className="mb-2 opacity-30" />
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] px-6 text-center">Selecciona una ficha para configurar sus órdenes individuales</p>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}
                  </div>
               )}
            </div>

            {/* Bench Sidebar - Desktop only */}
            <div className="w-64 border-l border-[#a0b0a0] bg-[#e8ece8] flex flex-col shadow-inner hidden xl:flex">
               <header className="p-3 bg-[#d4dcd4] border-b border-[#a0b0a0] text-[10px] font-black uppercase tracking-widest text-slate-700 flex justify-between items-center" style={{ background: 'linear-gradient(to bottom, #cfd8cf 0%, #a3b4a3 100%)' }}>
                  <span>Disponibles</span>
                  <span className="bg-black/10 px-2 rounded-full text-[9px] border border-black/5">{bench.length}</span>
               </header>
               <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll bg-[#dbe6db]/40">
                  {bench.map(p => (
                     <div key={p.id} className="flex items-center gap-3 p-2 bg-white border border-[#a0b0a0] rounded-sm hover:border-blue-500 transition-all cursor-default group shadow-sm" onContextMenu={(e) => onContextMenu?.(e, p)}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 shadow-sm border ${p.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : 'bg-slate-200 border-slate-400 text-slate-700'}`}>
                           {p.positions[0]}
                        </div>
                        <div className="min-w-0">
                           <p className="text-[10px] font-black uppercase text-slate-900 truncate leading-none group-hover:text-blue-800">{p.name}</p>
                           <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[8px] font-bold text-slate-400 uppercase">CA: {(p.currentAbility/20).toFixed(1)}</span>
                              <span className={`text-[8px] font-black ${p.fitness < 90 ? 'text-red-600' : 'text-green-700'}`}>{Math.round(p.fitness)}% FIS</span>
                           </div>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         {/* Save Modal */}
         {isSaveModalOpen && (
            <div className="fixed inset-0 z-[500] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
               <FMBox title="Guardar Esquema Táctico" className="w-full max-w-sm shadow-2xl border-2 border-slate-400">
                  <div className="p-6 space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Nombre de la Táctica</label>
                        <input autoFocus type="text" className="w-full bg-white border border-[#a0b0a0] rounded-sm px-4 py-3 text-sm font-black uppercase outline-none focus:border-[#3a4a3a] shadow-inner text-slate-800" placeholder="Ej: 4-4-2 OFENSIVA..." value={newTacticName} onChange={(e) => setNewTacticName(e.target.value)} />
                     </div>
                     <div className="flex gap-2">
                        <FMButton variant="secondary" onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-3">CANCELAR</FMButton>
                        <FMButton variant="primary" onClick={() => { if(newTacticName && activeTactic) { world.saveTactic(newTacticName, [...activeTactic.positions], { ...activeTactic.settings }); setIsSaveModalOpen(false); } }} className="flex-1 py-3">CONFIRMAR</FMButton>
                     </div>
                  </div>
               </FMBox>
            </div>
         )}
      </div>
   );
};
