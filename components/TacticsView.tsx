
import React, { useState } from 'react';
import { Player, Position, Club } from '../types';
import { world } from '../services/worldManager';
import { Shirt, Save, UserCheck, AlertCircle, X, Check, Ambulance, AlertTriangle } from 'lucide-react';
import { FMButton } from './FMUI';

interface TacticsViewProps {
   players: Player[];
   club: Club;
   onUpdatePlayer: (player: Player) => void;
   onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

export const TacticsView: React.FC<TacticsViewProps> = ({ players, club, onUpdatePlayer, onContextMenu }) => {
   const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
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
      if (positions.includes(Position.GK)) return 'bg-yellow-500 text-black';
      return `${club.primaryColor} text-white`;
   };

   const isPlayerUnavailable = (p: Player) => {
      return (p.injury && p.injury.daysLeft > 0) || (p.suspension && p.suspension.matchesLeft > 0);
   };

   const handleLoadTactic = (tacticId: string) => {
      setSelectedTacticId(tacticId);
      const tactic = world.getTactics().find(t => t.id === tacticId);
      if (!tactic) return;
      
      // Clear current setup
      players.forEach(p => {
         if (p.isStarter) {
            p.isStarter = false;
            p.tacticalPosition = undefined;
            onUpdatePlayer(p);
         }
      });
      
      // Fill slots with the new tactic shape
      autoPickBestEleven(tactic.positions);
   };

   const handleOpenSaveModal = () => {
      // Validate we have 11 players
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
      // Save just the positions (slots) to recreate the shape later
      const positions = currentStarters.map(p => p.tacticalPosition!).sort((a,b) => a - b);
      
      world.saveTactic(newTacticName.trim(), positions);
      
      // Force UI update to show new tactic in dropdown
      setUpdateTrigger(prev => prev + 1);

      // Automatically select the new tactic
      const tactics = world.getTactics();
      const newTactic = tactics[tactics.length - 1];
      if (newTactic) {
         setSelectedTacticId(newTactic.id);
      }
      
      setIsSaveModalOpen(false);
   };

   const autoPickBestEleven = (targetPositions?: number[]) => {
      // 1. Determine target positions (shape)
      let slotsToFill = targetPositions;
      if (!slotsToFill) {
         const activeTactic = world.getTactics().find(t => t.id === selectedTacticId);
         slotsToFill = activeTactic ? activeTactic.positions : world.getTactics()[0].positions;
      }

      // 2. Reset everyone first
      players.forEach(p => { 
          if (p.isStarter) {
            p.isStarter = false; 
            p.tacticalPosition = undefined; 
            onUpdatePlayer(p); 
          }
      });

      // 3. Filter eligible players
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
            .sort((a, b) => {
               const scoreA = a.currentAbility * (a.fitness / 100);
               const scoreB = b.currentAbility * (b.fitness / 100);
               return scoreB - scoreA;
            })[0];

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

   const handleDragStart = (e: React.DragEvent, playerId: string) => {
      const p = players.find(pl => pl.id === playerId);
      if (p && isPlayerUnavailable(p)) {
         e.preventDefault();
         return;
      }
      e.dataTransfer.effectAllowed = 'move';
      setDraggedPlayerId(playerId);
   };

   const handleDrop = (e: React.DragEvent, targetSlotIdx: number) => {
      e.preventDefault();
      if (!draggedPlayerId) return;
      const draggedPlayer = players.find(p => p.id === draggedPlayerId);
      if (!draggedPlayer) return;
      const targetPlayer = getPlayerAtSlot(targetSlotIdx);

      if (draggedPlayer.isStarter) {
         if (targetPlayer) {
            const oldPos = draggedPlayer.tacticalPosition;
            draggedPlayer.tacticalPosition = targetSlotIdx;
            targetPlayer.tacticalPosition = oldPos;
            onUpdatePlayer(targetPlayer);
         } else draggedPlayer.tacticalPosition = targetSlotIdx;
         onUpdatePlayer(draggedPlayer);
      } else {
         if (starters.length >= 11 && !targetPlayer) return;
         if (targetPlayer) {
            targetPlayer.isStarter = false;
            targetPlayer.tacticalPosition = undefined;
            onUpdatePlayer(targetPlayer);
         }
         draggedPlayer.isStarter = true;
         draggedPlayer.tacticalPosition = targetSlotIdx;
         onUpdatePlayer(draggedPlayer);
      }
      setDraggedPlayerId(null);
   };

   const renderCell = (index: number) => {
      const player = getPlayerAtSlot(index);
      return (
         <div 
            key={index}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className={`relative flex-1 flex flex-col items-center justify-center transition-all ${isDragging ? 'bg-white/10 ring-1 ring-inset ring-white/20' : ''}`}
         >
            {player && (
               <div 
                  draggable={!isPlayerUnavailable(player)}
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className={`z-20 flex flex-col items-center cursor-grab active:cursor-grabbing transform hover:scale-105 transition-transform ${isPlayerUnavailable(player) ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
               >
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-[9px] sm:text-[11px] ${getPlayerColor(player.positions)} ${player.positions[0] === Position.GK ? 'ring-2 ring-yellow-400/30' : ''}`}>
                     {player.positions[0].substring(0,2)}
                  </div>
                  <div className="bg-slate-900/90 text-white text-[7px] sm:text-[9px] px-1 py-0.5 rounded mt-0.5 truncate max-w-[45px] sm:max-w-[70px] shadow-lg border border-white/10 font-black uppercase">
                     {player.name.split(' ').pop()}
                  </div>
               </div>
            )}
         </div>
      );
   };

   // Always get the latest tactics from world directly
   const allTactics = world.getTactics();

   return (
      <div className="p-2 sm:p-4 h-full flex flex-col lg:flex-row gap-4 overflow-hidden bg-slate-400 relative">
         {/* Save Tactic Modal */}
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
                        <input 
                           autoFocus
                           type="text" 
                           placeholder="ej: 4-3-3 Ofensiva" 
                           className="w-full bg-white border border-slate-400 rounded-sm px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                           value={newTacticName}
                           onChange={(e) => setNewTacticName(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && confirmSaveTactic()}
                        />
                     </div>
                     <div className="flex gap-2 pt-2">
                        <FMButton variant="secondary" onClick={() => setIsSaveModalOpen(false)} className="flex-1">Cancelar</FMButton>
                        <FMButton variant="primary" onClick={confirmSaveTactic} className="flex-1">
                           <Check size={14} /> Guardar
                        </FMButton>
                     </div>
                  </div>
               </div>
            </div>
         )}

         <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Toolbar */}
            <div className="bg-slate-200 p-2 rounded-sm border border-slate-500 flex flex-wrap gap-2 items-center justify-between shadow-sm">
               <div className="flex gap-2 items-center w-full sm:w-auto">
                  <select 
                    className="flex-1 sm:flex-none bg-slate-100 text-slate-950 text-[10px] font-black uppercase border border-slate-400 rounded-sm px-3 py-2 outline-none cursor-pointer hover:border-slate-600 transition-colors"
                    value={selectedTacticId} 
                    onChange={(e) => handleLoadTactic(e.target.value)}
                  >
                    <option value="" disabled>Formación</option>
                    {allTactics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  
                  <button 
                     onClick={() => autoPickBestEleven()} 
                     className="bg-slate-950 text-white text-[10px] px-4 py-2 rounded-sm uppercase font-black tracking-widest hover:bg-black transition-colors flex items-center gap-2 shadow-lg"
                     title="Selecciona los mejores 11 jugadores"
                  >
                     <UserCheck size={14} /> Elegir 11
                  </button>

                  <button 
                     onClick={handleOpenSaveModal} 
                     className="bg-blue-600 text-white text-[10px] px-4 py-2 rounded-sm uppercase font-black tracking-widest hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg"
                     title="Guardar la disposición actual"
                  >
                     <Save size={14} /> Guardar
                  </button>
               </div>
               
               <div className={`px-3 py-1.5 rounded-sm font-black text-[10px] uppercase border flex items-center gap-2 ${starters.length === 11 ? 'bg-green-100 text-green-800 border-green-400' : 'bg-red-100 text-red-800 border-red-400'}`}>
                  {starters.length === 11 ? <UserCheck size={14} /> : <AlertCircle size={14} />}
                  {starters.length}/11 Titulares
               </div>
            </div>

            {/* Pitch */}
            <div className="flex-1 bg-slate-300 rounded-sm border border-slate-500 flex items-center justify-center p-2 min-h-[350px] sm:min-h-[450px] overflow-hidden relative shadow-inner">
               <div className="relative w-full h-full max-w-[95%] sm:max-w-[55vh] aspect-[68/105] shadow-2xl bg-[#1e293b] border-2 border-slate-600 rounded-sm">
                  {/* Pitch markings */}
                  <div className="absolute inset-0 opacity-10 pointer-events-none p-1">
                    <svg width="100%" height="100%" viewBox="0 0 100 140" preserveAspectRatio="none">
                        <rect width="100" height="140" fill="#2d5a40" fillOpacity="0.4" />
                        <line x1="0" y1="70" x2="100" y2="70" stroke="white" strokeWidth="1"/>
                        <circle cx="50" cy="70" r="15" fill="none" stroke="white" strokeWidth="1" />
                        <rect x="25" y="0" width="50" height="20" fill="none" stroke="white" strokeWidth="1" />
                        <rect x="25" y="120" width="50" height="20" fill="none" stroke="white" strokeWidth="1" />
                    </svg>
                  </div>
                  {/* Tactical Slots Grid */}
                  <div className="absolute inset-0 flex flex-col z-10 p-1">
                     <div className="flex-[1] flex w-full">{renderCell(30)}{renderCell(29)}{renderCell(28)}{renderCell(27)}{renderCell(26)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(25)}{renderCell(24)}{renderCell(23)}{renderCell(22)}{renderCell(21)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(20)}{renderCell(19)}{renderCell(18)}{renderCell(17)}{renderCell(16)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(15)}{renderCell(14)}{renderCell(13)}{renderCell(12)}{renderCell(11)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(10)}{renderCell(9)}{renderCell(8)}{renderCell(7)}{renderCell(6)}</div>
                     <div className="flex-[1] flex w-full">{renderCell(5)}{renderCell(4)}{renderCell(3)}{renderCell(2)}{renderCell(1)}</div>
                     <div className="flex-[1] flex w-full justify-center"><div className="w-1/4 h-full">{renderCell(0)}</div></div>
                  </div>
               </div>
            </div>
         </div>

         {/* Available Players List */}
         <div className="lg:w-72 bg-slate-200 rounded-sm border border-slate-500 flex flex-col h-[200px] lg:h-auto overflow-hidden shadow-sm">
            <header className="p-3 border-b border-slate-500 bg-slate-300 shrink-0">
               <h3 className="text-slate-900 font-black text-[10px] flex items-center gap-2 uppercase tracking-widest"><Shirt size={14}/> BANQUILLO</h3>
            </header>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1 custom-scroll">
               {players.sort((a,b) => b.currentAbility - a.currentAbility).map(p => {
                  const unavailable = isPlayerUnavailable(p);
                  return (
                     <div 
                        key={p.id} 
                        draggable={!unavailable} 
                        onDragStart={(e) => handleDragStart(e, p.id)} 
                        onContextMenu={(e) => onContextMenu && onContextMenu(e, p)} 
                        className={`flex items-center p-2 rounded-sm transition-all border ${p.isStarter ? 'opacity-30 grayscale bg-slate-300 border-slate-400' : 'bg-slate-100 border-slate-300 hover:border-slate-800 shadow-sm'} ${unavailable ? 'bg-red-50 border-red-200 opacity-70 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}
                     >
                        <div className={`w-7 h-7 rounded-sm flex items-center justify-center font-black text-[9px] mr-2 shrink-0 ${getPlayerColor(p.positions)}`}>{p.positions[0].substring(0,2)}</div>
                        <div className="flex-1 min-w-0">
                           <div className="flex justify-between items-center">
                              <p className="text-[11px] font-black text-slate-950 truncate uppercase italic">{p.name.split(' ').pop()}</p>
                              {p.injury && <span className="text-[8px] bg-red-600 text-white px-1 rounded flex items-center gap-0.5"><Ambulance size={8}/> {p.injury.daysLeft}d</span>}
                              {p.suspension && p.suspension.matchesLeft > 0 && <span className="text-[8px] bg-red-600 text-white px-1 rounded flex items-center gap-0.5"><AlertTriangle size={8}/> {p.suspension.matchesLeft}p</span>}
                           </div>
                           <div className="flex gap-2 text-[8px] text-slate-600 font-black uppercase">
                              <span>{p.positions[0]}</span>
                              <span className="text-blue-800">★ {(p.currentAbility/40).toFixed(1)}</span>
                              <span className={`${p.fitness < 80 ? 'text-red-600' : 'text-green-700'}`}>{Math.round(p.fitness)}%</span>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      </div>
   );
}
