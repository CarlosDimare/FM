import React, { useState } from 'react';
import { Player, Position, Club } from '../types';
import { world } from '../services/worldManager';
import { Shirt, X, GripVertical, Save, RefreshCw, ChevronDown, UserCheck } from 'lucide-react';

interface TacticsViewProps {
   players: Player[];
   club: Club;
   onUpdatePlayer: (player: Player) => void;
   onContextMenu?: (e: React.MouseEvent, player: Player) => void;
}

export const TacticsView: React.FC<TacticsViewProps> = ({ players, club, onUpdatePlayer, onContextMenu }) => {
   const [draggedPlayerId, setDraggedPlayerId] = useState<string | null>(null);
   const [selectedTacticId, setSelectedTacticId] = useState<string>('');

   const starters = players.filter(p => p.isStarter);
   const getPlayerAtSlot = (idx: number) => players.find(p => p.isStarter && p.tacticalPosition === idx);
   const isDragging = draggedPlayerId !== null;

   const getPlayerColor = (positions: Position[]) => {
      if (positions.includes(Position.GK)) return 'bg-yellow-500 text-black';
      return `${club.primaryColor} text-white`;
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

   const autoPickBestEleven = (targetPositions?: number[]) => {
      let slotsToFill = targetPositions || world.getTactics()[0].positions;
      players.forEach(p => { p.isStarter = false; p.tacticalPosition = undefined; onUpdatePlayer(p); });
      const availablePlayers = [...players].sort((a,b) => b.currentAbility - a.currentAbility);
      const usedPlayerIds = new Set<string>();
      slotsToFill.slice(0, 11).forEach(slotIdx => {
         const bestFit = availablePlayers.find(p => !usedPlayerIds.has(p.id));
         if (bestFit) {
            bestFit.isStarter = true;
            bestFit.tacticalPosition = slotIdx;
            usedPlayerIds.add(bestFit.id);
            onUpdatePlayer(bestFit);
         }
      });
   };

   const handleDragStart = (e: React.DragEvent, playerId: string) => {
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
                  draggable
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className="z-20 flex flex-col items-center cursor-grab active:cursor-grabbing transform hover:scale-105 transition-transform"
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

   return (
      <div className="p-2 sm:p-4 h-full flex flex-col lg:flex-row gap-4 overflow-hidden bg-slate-400">
         <div className="flex-1 flex flex-col gap-3 min-h-0">
            {/* Toolbar */}
            <div className="bg-slate-200 p-2 rounded-sm border border-slate-500 flex flex-wrap gap-2 items-center justify-between shadow-sm">
               <div className="flex gap-2 items-center w-full sm:w-auto">
                  <select 
                    className="flex-1 sm:flex-none bg-slate-100 text-slate-950 text-[10px] font-black uppercase border border-slate-400 rounded-sm px-3 py-2 outline-none"
                    value={selectedTacticId} onChange={(e) => handleLoadTactic(e.target.value)}
                  >
                    <option value="" disabled>Formación</option>
                    {world.getTactics().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                  <button onClick={() => autoPickBestEleven()} className="bg-slate-950 text-white text-[10px] px-4 py-2 rounded-sm uppercase font-black tracking-widest hover:bg-black transition-colors">Elegir 11</button>
               </div>
            </div>

            {/* Pitch - Adaptive for Mobile */}
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
               {players.sort((a,b) => b.currentAbility - a.currentAbility).map(p => (
                  <div 
                    key={p.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, p.id)} 
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, p)} 
                    className={`flex items-center p-2 rounded-sm transition-all border ${p.isStarter ? 'opacity-30 grayscale bg-slate-300 border-slate-400' : 'bg-slate-100 border-slate-300 hover:border-slate-800 shadow-sm cursor-grab active:cursor-grabbing'}`}
                  >
                     <div className={`w-7 h-7 rounded-sm flex items-center justify-center font-black text-[9px] mr-2 shrink-0 ${getPlayerColor(p.positions)}`}>{p.positions[0].substring(0,2)}</div>
                     <div className="flex-1 min-w-0"><p className="text-[11px] font-black text-slate-950 truncate uppercase italic">{p.name.split(' ').pop()}</p><div className="flex gap-2 text-[8px] text-slate-600 font-black uppercase"><span>{p.positions[0]}</span><span className="text-blue-800">★ {(p.currentAbility/40).toFixed(1)}</span></div></div>
                  </div>
               ))}
            </div>
         </div>
      </div>
   );
}
