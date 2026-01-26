
import React, { useState } from 'react';
import { Player, Position, Club } from '../types';
import { world } from '../services/worldManager';
import { Shirt, Save, UserCheck, AlertCircle, X, Check, Ambulance, AlertTriangle, ArrowRightLeft, MousePointer2 } from 'lucide-react';
import { FMButton } from './FMUI';

interface TacticsViewProps {
   players: Player[];
   club: Club;
   onUpdatePlayer: (player: Player) => void;
   onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

export const TacticsView: React.FC<TacticsViewProps> = ({ players, club, onUpdatePlayer, onContextMenu }) => {
   const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
   const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
   const [selectedTacticId, setSelectedTacticId] = useState<string>('');
   
   // Modal State
   const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
   const [newTacticName, setNewTacticName] = useState('');

   // We use a counter to force re-render when a tactic is saved
   const [updateTrigger, setUpdateTrigger] = useState(0);

   const starters = players.filter(p => p.isStarter && p.tacticalPosition !== undefined);
   const getPlayerAtSlot = (idx: number) => players.find(p => p.isStarter && p.tacticalPosition === idx);
   const isDragging = draggedPlayerId !== null;

   const getPlayerColor = (positions: Position[]) => {
      if (positions.includes(Position.GK)) return 'bg-yellow-500 text-black border-yellow-300';
      return `${club.primaryColor} text-white border-white`;
   };

   const isPlayerUnavailable = (p: Player) => {
      return (p.injury && p.injury.daysLeft > 0) || (p.suspension && p.suspension.matchesLeft > 0);
   };

   const handleLoadTactic = (tacticId: string) => {
      setSelectedTacticId(tacticId);
      const tactic = world.getTactics().find(t => t.id === tacticId);
      if (!tactic) return;
      
      players.forEach(p => {
         if (p.isStarter) {
            p.isStarter = false;
            p.tacticalPosition = undefined;
            onUpdatePlayer(p);
         }
      });
      autoPickBestEleven(tactic.positions);
   };

   const handleOpenSaveModal = () => {
      const currentStarters = players.filter(p => p.isStarter && p.tacticalPosition !== undefined);
      if (currentStarters.length !== 11) {
         alert(`Error: Tienes ${currentStarters.length} jugadores en el campo. Necesitas exactamente 11 para guardar una táctica.`);
         return;
      }
      setNewTacticName('');
      setIsSaveModalOpen(true);
   };

   const confirmSaveTactic = () => {
      if (!newTacticName.trim()) return;
      const currentStarters = players.filter(p => p.isStarter && p.tacticalPosition !== undefined);
      const positions = currentStarters.map(p => p.tacticalPosition!).sort((a,b) => a - b);
      world.saveTactic(newTacticName.trim(), positions);
      setUpdateTrigger(prev => prev + 1);
      const tactics = world.getTactics();
      const newTactic = tactics[tactics.length - 1];
      if (newTactic) setSelectedTacticId(newTactic.id);
      setIsSaveModalOpen(false);
   };

   const autoPickBestEleven = (targetPositions?: number[]) => {
      let slotsToFill = targetPositions;
      if (!slotsToFill) {
         const activeTactic = world.getTactics().find(t => t.id === selectedTacticId);
         slotsToFill = activeTactic ? activeTactic.positions : world.getTactics()[0].positions;
      }

      players.forEach(p => { 
          if (p.isStarter) {
            p.isStarter = false; 
            p.tacticalPosition = undefined; 
            onUpdatePlayer(p); 
          }
      });

      const availablePlayers = players.filter(p => !isPlayerUnavailable(p));
      const usedPlayerIds = new Set<string>();

      const getRole = (slotIdx: number): 'GK' | 'DEF' | 'MID' | 'ATT' => {
         if (slotIdx === 0) return 'GK';
         if (slotIdx >= 1 && slotIdx <= 15) return 'DEF';
         if (slotIdx >= 16 && slotIdx <= 25) return 'MID';
         return 'ATT';
      };

      const playerFitsRole = (p: Player, role: 'GK' | 'DEF' | 'MID' | 'ATT'): boolean => {
         if (role === 'GK') return p.positions.includes(Position.GK);
         if (role === 'DEF') return p.positions.some(pos => pos.includes('DF') || pos === Position.SW);
         if (role === 'MID') return p.positions.some(pos => pos.includes('M') || pos.includes('DM'));
         if (role === 'ATT') return p.positions.some(pos => pos.includes('ST') || pos.includes('DL') || pos.includes('AM'));
         return false;
      };

      slotsToFill.slice(0, 11).forEach(slotIdx => {
         const role = getRole(slotIdx);
         const bestFit = availablePlayers
            .filter(p => !usedPlayerIds.has(p.id) && playerFitsRole(p, role))
            .sort((a, b) => (a.currentAbility * (a.fitness / 100)) - (b.currentAbility * (b.fitness / 100)))
            .reverse()[0];

         if (bestFit) {
            bestFit.isStarter = true;
            bestFit.tacticalPosition = slotIdx;
            usedPlayerIds.add(bestFit.id);
            onUpdatePlayer(bestFit);
         } else {
            const panicPick = availablePlayers
                .filter(p => !usedPlayerIds.has(p.id))
                .sort((a, b) => (b.currentAbility * (b.fitness/100)) - (a.currentAbility * (a.fitness/100)))[0];
            if (panicPick) {
               panicPick.isStarter = true;
               panicPick.tacticalPosition = slotIdx;
               usedPlayerIds.add(panicPick.id);
               onUpdatePlayer(panicPick);
            }
         }
      });
   };

   // INTERACTION LOGIC
   const handlePlayerClick = (p: Player) => {
      if (isPlayerUnavailable(p)) return;
      
      if (selectedPlayerId === null) {
         // Select first player
         setSelectedPlayerId(p.id);
      } else {
         // Swap or Move
         const sourcePlayer = players.find(pl => pl.id === selectedPlayerId);
         if (!sourcePlayer) { setSelectedPlayerId(null); return; }

         if (sourcePlayer.id === p.id) {
            setSelectedPlayerId(null); // Deselect
            return;
         }

         // Swap Logic
         const sourcePos = sourcePlayer.tacticalPosition;
         const targetPos = p.tacticalPosition;
         const sourceStarter = sourcePlayer.isStarter;
         const targetStarter = p.isStarter;

         sourcePlayer.isStarter = targetStarter;
         sourcePlayer.tacticalPosition = targetPos;
         
         p.isStarter = sourceStarter;
         p.tacticalPosition = sourcePos;

         onUpdatePlayer(sourcePlayer);
         onUpdatePlayer(p);
         setSelectedPlayerId(null);
      }
   };

   const handleSlotClick = (slotIdx: number) => {
      const existingPlayer = getPlayerAtSlot(slotIdx);
      
      if (selectedPlayerId) {
         const sourcePlayer = players.find(p => p.id === selectedPlayerId);
         if (!sourcePlayer) return;

         if (existingPlayer) {
            // Swap with player in slot
            if (existingPlayer.id === sourcePlayer.id) return; // Clicked same slot
            const oldSourcePos = sourcePlayer.tacticalPosition;
            sourcePlayer.tacticalPosition = slotIdx;
            sourcePlayer.isStarter = true;
            
            existingPlayer.tacticalPosition = oldSourcePos;
            // If source was bench, target goes to bench
            if (!sourcePlayer.isStarter) existingPlayer.isStarter = false;
            
            onUpdatePlayer(existingPlayer);
            onUpdatePlayer(sourcePlayer);
         } else {
            // Move to empty slot
            if (sourcePlayer.isStarter) {
               // Moving from another slot on pitch
               sourcePlayer.tacticalPosition = slotIdx;
            } else {
               // Moving from bench to pitch
               if (starters.length >= 11) {
                  alert("Ya hay 11 jugadores. Selecciona uno del campo para cambiarlo.");
                  return;
               }
               sourcePlayer.isStarter = true;
               sourcePlayer.tacticalPosition = slotIdx;
            }
            onUpdatePlayer(sourcePlayer);
         }
         setSelectedPlayerId(null);
      } else {
         if (existingPlayer) {
            setSelectedPlayerId(existingPlayer.id);
         }
      }
   };

   const handleDragStart = (e: React.DragEvent, playerId: string) => {
      const p = players.find(pl => pl.id === playerId);
      if (p && isPlayerUnavailable(p)) { e.preventDefault(); return; }
      e.dataTransfer.effectAllowed = 'move';
      setDraggedPlayerId(playerId);
      setSelectedPlayerId(playerId); // Also select for visual clarity
   };

   const handleDrop = (e: React.DragEvent, targetSlotIdx: number) => {
      e.preventDefault();
      handleSlotClick(targetSlotIdx); // Reuse click logic for drop
      setDraggedPlayerId(null);
      setSelectedPlayerId(null);
   };

   const renderCell = (index: number) => {
      const player = getPlayerAtSlot(index);
      const isSelected = player && player.id === selectedPlayerId;
      const isTarget = selectedPlayerId && !player; // Empty slot is potential target

      return (
         <div 
            key={index}
            onClick={() => handleSlotClick(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className={`relative flex-1 flex flex-col items-center justify-center transition-all ${isTarget ? 'bg-white/20 ring-2 ring-white/40 cursor-pointer rounded' : ''} ${isDragging && !player ? 'bg-white/10 border border-dashed border-white/30' : ''}`}
         >
            {player && (
               <div 
                  draggable={!isPlayerUnavailable(player)}
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className={`z-20 flex flex-col items-center cursor-pointer active:cursor-grabbing transform transition-transform ${isSelected ? 'scale-110' : 'hover:scale-105'} ${isPlayerUnavailable(player) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
               >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 shadow-xl flex items-center justify-center font-black text-[9px] sm:text-[11px] ${getPlayerColor(player.positions)} ${isSelected ? 'ring-2 ring-blue-400 border-blue-400' : ''}`}>
                     {player.positions[0].substring(0,2)}
                  </div>
                  <div className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded mt-0.5 truncate max-w-[50px] sm:max-w-[70px] shadow-lg border font-black uppercase tracking-tight ${isSelected ? 'bg-blue-600 text-white border-blue-400' : 'bg-slate-900/90 text-white border-white/20'}`}>
                     {player.name.split(' ').pop()}
                  </div>
               </div>
            )}
         </div>
      );
   };

   const allTactics = world.getTactics();

   return (
      <div className="flex flex-col h-full overflow-hidden bg-slate-400">
         {/* Modal */}
         {isSaveModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/60 flex items-center justify-center backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-slate-200 w-full max-w-sm rounded-sm border border-slate-500 shadow-2xl p-6">
                  <header className="flex justify-between items-center mb-6 border-b border-slate-400 pb-2">
                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Save size={16} /> Guardar Táctica
                     </h3>
                     <button onClick={() => setIsSaveModalOpen(false)} className="text-slate-500 hover:text-red-600 transition-colors"><X size={20}/></button>
                  </header>
                  <div className="space-y-4">
                     <div>
                        <label className="block text-[10px] font-black uppercase text-slate-500 mb-1">Nombre de la táctica</label>
                        <input autoFocus type="text" placeholder="ej: 4-3-3 Ofensiva" className="w-full bg-white border border-slate-400 rounded-sm px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600" value={newTacticName} onChange={(e) => setNewTacticName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmSaveTactic()} />
                     </div>
                     <div className="flex gap-2 pt-2">
                        <FMButton variant="secondary" onClick={() => setIsSaveModalOpen(false)} className="flex-1">Cancelar</FMButton>
                        <FMButton variant="primary" onClick={confirmSaveTactic} className="flex-1"><Check size={14} /> Guardar</FMButton>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* PITCH AREA (Top) */}
         <div className="shrink-0 p-2 sm:p-4 bg-slate-300 border-b border-slate-500 flex flex-col items-center">
            {/* Toolbar */}
            <div className="w-full max-w-4xl bg-slate-200 p-2 rounded-sm border border-slate-500 flex flex-wrap gap-2 items-center justify-between shadow-sm mb-3">
               <div className="flex gap-2 items-center flex-1">
                  <div className="flex items-center bg-slate-100 border border-slate-400 rounded-sm">
                     <select className="bg-transparent text-slate-950 text-[10px] font-black uppercase px-2 py-1.5 outline-none cursor-pointer w-24 sm:w-32" value={selectedTacticId} onChange={(e) => handleLoadTactic(e.target.value)}>
                        <option value="" disabled>Formación</option>
                        {allTactics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                     </select>
                     <button onClick={handleOpenSaveModal} className="border-l border-slate-400 px-2 py-1.5 hover:bg-slate-300 transition-colors" title="Guardar"><Save size={12} /></button>
                  </div>
                  
                  <button onClick={() => autoPickBestEleven()} className="bg-slate-950 text-white text-[10px] px-3 py-1.5 rounded-sm uppercase font-black tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-sm border border-slate-700">
                     <UserCheck size={12} /> <span className="hidden sm:inline">Elegir 11</span>
                  </button>
               </div>
               
               <div className={`px-2 py-1 rounded-sm font-black text-[10px] uppercase border flex items-center gap-2 ${starters.length === 11 ? 'bg-green-100 text-green-800 border-green-400' : 'bg-red-100 text-red-800 border-red-400'}`}>
                  {starters.length === 11 ? <UserCheck size={12} /> : <AlertCircle size={12} />}
                  {starters.length}/11
               </div>
            </div>

            {/* Pitch Graphic */}
            <div className="relative w-full max-w-[320px] sm:max-w-[400px] aspect-[68/105] shadow-2xl bg-[#1e293b] border-2 border-slate-600 rounded-sm overflow-hidden select-none">
                  {/* Markings */}
                  <div className="absolute inset-0 opacity-20 pointer-events-none p-1">
                    <svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none">
                        <rect width="100" height="140" fill="#2d5a40" fillOpacity="0.4" />
                        <line x1="0" y1="70" x2="100" y2="70" stroke="white" strokeWidth="1"/>
                        <circle cx="50" cy="70" r="15" fill="none" stroke="white" strokeWidth="1" />
                        <rect x="25" y="0" width="50" height="20" fill="none" stroke="white" strokeWidth="1" />
                        <rect x="25" y="120" width="50" height="20" fill="none" stroke="white" strokeWidth="1" />
                    </svg>
                  </div>
                  {/* Slots Grid - Left to Right Order (1...5) */}
                  <div className="absolute inset-0 flex flex-col z-10 p-1">
                     <div className="flex-[1] flex w-full">{renderCell(26)}{renderCell(27)}{renderCell(28)}{renderCell(29)}{renderCell(30)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(21)}{renderCell(22)}{renderCell(23)}{renderCell(24)}{renderCell(25)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(16)}{renderCell(17)}{renderCell(18)}{renderCell(19)}{renderCell(20)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(11)}{renderCell(12)}{renderCell(13)}{renderCell(14)}{renderCell(15)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(6)}{renderCell(7)}{renderCell(8)}{renderCell(9)}{renderCell(10)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(1)}{renderCell(2)}{renderCell(3)}{renderCell(4)}{renderCell(5)}</div>
                     <div className="flex-[1] flex w-full justify-center"><div className="w-1/3 h-full">{renderCell(0)}</div></div>
                  </div>
            </div>
         </div>

         {/* PLAYER LIST (Scrollable Bottom) */}
         <div className="flex-1 min-h-0 bg-slate-200 border-t border-slate-500 flex flex-col">
            <header className="p-2 border-b border-slate-400 bg-slate-300/50 flex justify-between items-center shrink-0">
               <h3 className="text-slate-900 font-black text-[10px] flex items-center gap-2 uppercase tracking-widest px-2"><Shirt size={12}/> Plantilla Disponible</h3>
               {selectedPlayerId && <div className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded animate-pulse">Selecciona un lugar en el campo</div>}
            </header>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scroll">
               {players.sort((a,b) => b.currentAbility - a.currentAbility).map(p => {
                  const unavailable = isPlayerUnavailable(p);
                  const isSelected = selectedPlayerId === p.id;
                  return (
                     <div 
                        key={p.id} 
                        onClick={() => handlePlayerClick(p)}
                        className={`flex items-center p-2 rounded-sm transition-all border cursor-pointer 
                           ${p.isStarter 
                              ? 'bg-slate-300 border-slate-400 opacity-60' 
                              : isSelected 
                                 ? 'bg-blue-100 border-blue-500 shadow-md ring-1 ring-blue-400' 
                                 : 'bg-white border-slate-300 hover:border-slate-500 hover:bg-slate-50 shadow-sm'}
                           ${unavailable ? 'bg-red-50 border-red-200 opacity-70 cursor-not-allowed' : ''}
                        `}
                     >
                        <div className={`w-6 h-6 rounded-sm flex items-center justify-center font-black text-[8px] mr-3 shrink-0 ${getPlayerColor(p.positions)}`}>{p.positions[0].substring(0,2)}</div>
                        <div className="flex-1 min-w-0 flex items-center justify-between">
                           <div>
                              <p className="text-[11px] font-black text-slate-950 truncate uppercase">{p.name}</p>
                              <div className="flex gap-2 text-[9px] text-slate-500 font-bold uppercase mt-0.5">
                                 {p.injury && <span className="text-red-600 flex items-center gap-0.5"><Ambulance size={10}/> Lesionado</span>}
                                 {p.suspension && p.suspension.matchesLeft > 0 && <span className="text-red-600 flex items-center gap-0.5"><AlertTriangle size={10}/> Sancionado</span>}
                                 {!p.injury && !p.suspension && <span>{p.positions.join('/')}</span>}
                              </div>
                           </div>
                           <div className="flex flex-col items-end">
                              <span className="text-[9px] font-black text-blue-700">★ {(p.currentAbility/20).toFixed(1)}</span>
                              <span className={`text-[9px] font-bold ${p.fitness < 80 ? 'text-red-600' : 'text-green-700'}`}>{Math.round(p.fitness)}% FIS</span>
                           </div>
                        </div>
                        {isSelected && <ArrowRightLeft size={14} className="ml-2 text-blue-600 animate-pulse"/>}
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
}
