
import React, { useState, useRef } from 'react';
import { Player, Position, Club } from '../types';
import { world } from '../services/worldManager';
import { Save, RefreshCw, X, ChevronRight, MoreHorizontal } from 'lucide-react';
import { FMButton } from './FMUI';

interface TacticsViewProps {
   players: Player[];
   club: Club;
   onUpdatePlayer: (player: Player) => void;
   onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

// 0=GK, 1-5=DEF, 6-10=DM, 11-15=MID, 16-20=AM, 21-25=FW, 26-30=ST
const SLOT_COORDS: Record<number, { t: number, l: number }> = {
   0: { t: 90, l: 50 },
   
   1: { t: 75, l: 15 }, // DL
   2: { t: 75, l: 32 }, // DCL
   3: { t: 75, l: 50 }, // DC
   4: { t: 75, l: 68 }, // DCR
   5: { t: 75, l: 85 }, // DR
   
   6: { t: 62, l: 30 }, // DMCL
   7: { t: 62, l: 70 }, // DMCR
   8: { t: 62, l: 50 }, // DMC
   9: { t: 62, l: 20 }, // DML
   10: { t: 62, l: 80 }, // DMR

   11: { t: 45, l: 15 }, // ML
   12: { t: 45, l: 35 }, // MCL
   13: { t: 45, l: 50 }, // MC
   14: { t: 45, l: 65 }, // MCR
   15: { t: 45, l: 85 }, // MR

   16: { t: 28, l: 20 }, // AML
   17: { t: 28, l: 50 }, // AMC
   18: { t: 28, l: 80 }, // AMR
   19: { t: 28, l: 35 }, // AMCL
   20: { t: 28, l: 65 }, // AMCR

   26: { t: 12, l: 50 }, // STC
   27: { t: 12, l: 30 }, // STL
   28: { t: 12, l: 70 }, // STR
   29: { t: 12, l: 40 }, // STCL
   30: { t: 12, l: 60 }, // STCR
};

const PlayerPill: React.FC<{ player: Player, primary: string, secondary: string }> = ({ player, primary, secondary }) => {
   return (
      <div className={`
         w-12 h-12 md:w-16 md:h-16 rounded-full flex flex-col items-center justify-center 
         shadow-lg border-2 border-white transition-transform hover:scale-110 z-20 relative
         ${player.positions.includes(Position.GK) ? 'bg-yellow-400 text-black border-yellow-600' : `${primary} ${secondary}`}
      `}>
         <div className="text-[10px] md:text-xs font-black leading-none">{player.positions[0]}</div>
         <div className="absolute -bottom-3 bg-black/70 text-white px-1.5 py-0.5 rounded-sm text-[8px] md:text-[9px] font-bold uppercase whitespace-nowrap border border-white/20 truncate max-w-[60px] md:max-w-[80px]">
            {player.name.split(' ').pop()}
         </div>
         {player.fitness < 80 && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold border border-white">
               {Math.round(player.fitness)}
            </div>
         )}
      </div>
   );
};

export const TacticsView: React.FC<TacticsViewProps> = ({ players, club, onUpdatePlayer, onContextMenu }) => {
   const [selectedTacticId, setSelectedTacticId] = useState<string>('');
   const [newTacticName, setNewTacticName] = useState('');
   const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
   
   // Drag & Draw State
   const [draggingId, setDraggingId] = useState<string | null>(null);
   const [drawingStartSlot, setDrawingStartSlot] = useState<number | null>(null);
   const [mousePos, setMousePos] = useState<{x: number, y: number} | null>(null);
   const pitchRef = useRef<HTMLDivElement>(null);

   const starters = players.filter(p => p.isStarter && p.tacticalPosition !== undefined);
   const bench = players.filter(p => !p.isStarter && !p.injury && !p.suspension).sort((a,b) => b.currentAbility - a.currentAbility);

   const getPlayerAtSlot = (idx: number) => starters.find(p => p.tacticalPosition === idx);

   const handlePitchMouseDown = (e: React.MouseEvent, slotIdx: number) => {
      // Allow browser context menu if control key is pressed (for dev), otherwise custom logic
      if (e.button === 2) { 
         // Right click -> Start Arrow
         e.preventDefault();
         const p = getPlayerAtSlot(slotIdx);
         if (p) {
            setDrawingStartSlot(slotIdx);
         }
      } else if (e.button === 0) {
         // Left click -> Start Drag
         const p = getPlayerAtSlot(slotIdx);
         if (p) {
            setDraggingId(p.id);
         }
      }
   };

   const handleBenchMouseDown = (e: React.MouseEvent, playerId: string) => {
      if (e.button === 0) {
         setDraggingId(playerId);
      }
   };

   const handleGlobalMouseMove = (e: React.MouseEvent) => {
      if (!pitchRef.current) return;
      const rect = pitchRef.current.getBoundingClientRect();
      // Relative coordinates for arrow drawing
      setMousePos({
         x: e.clientX - rect.left,
         y: e.clientY - rect.top
      });
   };

   const handleSlotMouseUp = (e: React.MouseEvent, slotIdx: number) => {
      e.preventDefault();
      
      // Handle Drop
      if (draggingId) {
         const draggedPlayer = players.find(p => p.id === draggingId);
         if (draggedPlayer) {
            const targetPlayer = getPlayerAtSlot(slotIdx);
            
            // If target has player, swap. If not, just move.
            // If dragged was on bench, set as starter.
            
            if (draggedPlayer.isStarter && draggedPlayer.tacticalPosition !== undefined) {
               // Moving starter to another slot
               if (targetPlayer) {
                  // Swap
                  const oldPos = draggedPlayer.tacticalPosition;
                  draggedPlayer.tacticalPosition = slotIdx;
                  targetPlayer.tacticalPosition = oldPos;
                  onUpdatePlayer(targetPlayer);
               } else {
                  // Move to empty
                  draggedPlayer.tacticalPosition = slotIdx;
               }
            } else {
               // Moving bench to starter
               if (targetPlayer) {
                  // Swap bench player with starter
                  targetPlayer.isStarter = false;
                  targetPlayer.tacticalPosition = undefined;
                  onUpdatePlayer(targetPlayer);
               }
               draggedPlayer.isStarter = true;
               draggedPlayer.tacticalPosition = slotIdx;
            }
            onUpdatePlayer(draggedPlayer);
         }
         setDraggingId(null);
      }

      // Handle Arrow End
      if (drawingStartSlot !== null) {
         const p = getPlayerAtSlot(drawingStartSlot);
         if (p) {
            if (slotIdx === drawingStartSlot) {
               p.tacticalArrow = undefined; // Click on self clears arrow
            } else {
               p.tacticalArrow = slotIdx;
            }
            onUpdatePlayer(p);
         }
         setDrawingStartSlot(null);
      }
   };

   const handleGlobalMouseUp = () => {
      if (draggingId) setDraggingId(null);
      if (drawingStartSlot !== null) setDrawingStartSlot(null);
   };

   // RENDER HELPERS
   const renderArrows = () => {
      if (!pitchRef.current) return null;
      return (
         <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
            <defs>
               <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
                  <polygon points="0 0, 6 2, 0 4" fill="#fbbf24" />
               </marker>
            </defs>
            {starters.map(p => {
               if (p.tacticalArrow === undefined || p.tacticalPosition === undefined) return null;
               const start = SLOT_COORDS[p.tacticalPosition];
               const end = SLOT_COORDS[p.tacticalArrow];
               if (!start || !end) return null;
               return (
                  <line 
                     key={`arrow-${p.id}`}
                     x1={`${start.l}%`} y1={`${start.t}%`}
                     x2={`${end.l}%`} y2={`${end.t}%`}
                     stroke="#fbbf24" strokeWidth="3" strokeDasharray="5 3"
                     markerEnd="url(#arrowhead)"
                     opacity="0.9"
                  />
               );
            })}
            {drawingStartSlot !== null && mousePos && (
               (() => {
                  const start = SLOT_COORDS[drawingStartSlot];
                  const rect = pitchRef.current?.getBoundingClientRect();
                  if (!rect) return null;
                  const startX = (start.l / 100) * rect.width;
                  const startY = (start.t / 100) * rect.height;
                  return (
                     <line 
                        x1={startX} y1={startY}
                        x2={mousePos.x} y2={mousePos.y}
                        stroke="#fbbf24" strokeWidth="3" strokeDasharray="5 3"
                        opacity="0.6"
                     />
                  );
               })()
            )}
         </svg>
      );
   };

   return (
      <div className="flex flex-col lg:flex-row h-full bg-[#3d4c53] overflow-hidden" 
           onMouseUp={handleGlobalMouseUp}
           onMouseMove={handleGlobalMouseMove}
      >
         {isSaveModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
               <div className="bg-[#e8ece8] w-full max-w-sm rounded-sm border border-[#a0b0a0] p-6 shadow-2xl">
                  <h3 className="font-bold mb-4 uppercase text-sm">Guardar Táctica</h3>
                  <input autoFocus type="text" className="w-full mb-4 p-2 border" placeholder="Nombre..." value={newTacticName} onChange={(e) => setNewTacticName(e.target.value)} />
                  <div className="flex gap-2">
                     <FMButton variant="secondary" onClick={() => setIsSaveModalOpen(false)} className="flex-1">Cancelar</FMButton>
                     <FMButton variant="primary" onClick={() => { if(newTacticName) { const pos = starters.map(p=>p.tacticalPosition!).sort((a,b)=>a-b); world.saveTactic(newTacticName, pos); setIsSaveModalOpen(false); } }} className="flex-1">Guardar</FMButton>
                  </div>
               </div>
            </div>
         )}

         {/* PITCH SECTION */}
         <div className="flex-1 relative bg-[#2a3830] flex flex-col min-h-[50vh] lg:min-h-0">
            {/* Header / Toolbar */}
            <div className="bg-[#e8ece8] border-b border-[#a0b0a0] p-2 flex justify-between items-center z-30">
                <div className="flex gap-2 w-full max-w-xs">
                   <select className="flex-1 bg-white border border-[#a0b0a0] text-[10px] font-bold px-2 py-1 uppercase" 
                      value={selectedTacticId} 
                      onChange={(e) => {
                         const t = world.getTactics().find(t => t.id === e.target.value);
                         if (t) {
                            players.forEach(p => { if(p.isStarter) { p.isStarter=false; p.tacticalPosition=undefined; onUpdatePlayer(p); } });
                            const avail = players.filter(p => !p.injury && !p.suspension).sort((a,b) => b.currentAbility - a.currentAbility);
                            t.positions.forEach(pos => {
                               const p = avail.find(pl => !pl.isStarter);
                               if(p) { p.isStarter=true; p.tacticalPosition=pos; onUpdatePlayer(p); }
                            });
                            setSelectedTacticId(t.id);
                         }
                      }}
                   >
                      <option value="" disabled>Formación</option>
                      {world.getTactics().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                   <button onClick={() => setIsSaveModalOpen(true)} className="p-1 bg-white border border-[#a0b0a0] hover:bg-slate-100"><Save size={14}/></button>
                </div>
                <div className="text-[9px] font-black uppercase text-slate-500 tracking-widest hidden sm:block">Arrastrar: Mover • Click Der: Flecha</div>
            </div>

            {/* The Visual Pitch */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center p-4 select-none" ref={pitchRef} onContextMenu={(e) => e.preventDefault()}>
                <div className="relative w-full max-w-[450px] aspect-[3/4] lg:aspect-[3.2/4] shadow-2xl bg-[#1e3a29] border-[3px] border-white/30 rounded-sm">
                   {/* Pitch Lines SVG */}
                   <svg className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
                      <rect width="100%" height="100%" fill="none" />
                      <g stroke="white" strokeWidth="2" fill="none">
                         <rect x="5%" y="5%" width="90%" height="90%" />
                         <line x1="5%" y1="50%" x2="95%" y2="50%" />
                         <circle cx="50%" cy="50%" r="15%" />
                         <rect x="25%" y="5%" width="50%" height="15%" />
                         <rect x="25%" y="80%" width="50%" height="15%" />
                         <rect x="38%" y="5%" width="24%" height="5%" />
                         <rect x="38%" y="90%" width="24%" height="5%" />
                      </g>
                   </svg>
                   
                   {/* Movement Arrows */}
                   {renderArrows()}

                   {/* Slots */}
                   {Object.entries(SLOT_COORDS).map(([key, coords]) => {
                      const slotIdx = parseInt(key);
                      const player = getPlayerAtSlot(slotIdx);
                      const isDragged = draggingId === player?.id;
                      
                      return (
                         <div 
                            key={slotIdx}
                            className="absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-[16%] h-[12%] z-20"
                            style={{ top: `${coords.t}%`, left: `${coords.l}%` }}
                            onMouseDown={(e) => handlePitchMouseDown(e, slotIdx)}
                            onMouseUp={(e) => handleSlotMouseUp(e, slotIdx)}
                         >
                            {/* Empty Slot Hitbox */}
                            <div className={`w-full h-full rounded-full transition-colors ${draggingId && !player ? 'bg-white/10 border-2 border-dashed border-white/30' : ''}`}></div>

                            {player && (
                               <div className={`absolute pointer-events-none transition-opacity ${isDragged ? 'opacity-50' : 'opacity-100'}`}>
                                  <PlayerPill player={player} primary={club.primaryColor} secondary={club.secondaryColor} />
                               </div>
                            )}
                         </div>
                      );
                   })}
                </div>
            </div>
         </div>

         {/* SIDEBAR / BOTTOM BAR */}
         <div className="w-full lg:w-72 bg-[#e8ece8] border-t lg:border-t-0 lg:border-l border-[#a0b0a0] flex flex-col shadow-2xl z-40 max-h-[40vh] lg:max-h-none">
            <header className="p-3 bg-[#d4dcd4] border-b border-[#a0b0a0] text-[10px] font-black uppercase text-[#1a1a1a] tracking-widest flex justify-between">
               <span>Plantilla Disponible</span>
               <span className="text-slate-500">{bench.length} Jug.</span>
            </header>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll bg-[#d4dcd4]">
               {bench.map(p => (
                  <div 
                     key={p.id}
                     className={`flex items-center gap-2 p-2 bg-white border border-[#a0b0a0] rounded-[2px] cursor-grab active:cursor-grabbing hover:bg-[#f0f4f0] transition-colors group select-none ${draggingId === p.id ? 'opacity-50' : ''}`}
                     onMouseDown={(e) => handleBenchMouseDown(e, p.id)}
                  >
                     <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black border ${p.positions.includes(Position.GK) ? 'bg-yellow-400 border-yellow-600' : 'bg-slate-200 border-slate-400 text-slate-700'}`}>
                        {p.positions[0]}
                     </div>
                     <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-[#1a1a1a] truncate group-hover:text-blue-800">{p.name}</p>
                        <p className="text-[8px] text-slate-500 font-mono flex items-center gap-2">
                           <span>{(p.currentAbility/20).toFixed(1)} ★</span>
                           <span className={p.fitness < 90 ? 'text-red-600' : 'text-green-700'}>{Math.round(p.fitness)}% Fis</span>
                        </p>
                     </div>
                     {/* Quick Action for mobile if drag is hard */}
                     <button className="lg:hidden p-2 text-slate-400 hover:text-blue-600" onClick={() => {
                        // Find first empty slot logic
                        const used = new Set(starters.map(s=>s.tacticalPosition));
                        const slot = [0,1,2,3,4,5,11,12,13,14,15,26,27].find(s => !used.has(s));
                        if(slot !== undefined) {
                           p.isStarter = true; p.tacticalPosition = slot; onUpdatePlayer(p);
                        }
                     }}>
                        <ChevronRight size={14} />
                     </button>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
};
