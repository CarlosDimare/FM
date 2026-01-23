
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
   const [newTacticName, setNewTacticName] = useState('');
   const [isSaveMode, setIsSaveMode] = useState(false);

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

   const handleSaveTactic = () => {
      if (!newTacticName.trim()) return;
      const positions = starters.map(p => p.tacticalPosition!).filter(pos => pos !== undefined);
      if (positions.length < 1) return;
      world.saveTactic(newTacticName, positions);
      setIsSaveMode(false);
      setNewTacticName('');
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

   const renderCell = (index: number, label: string) => {
      const player = getPlayerAtSlot(index);
      return (
         <div 
            key={index}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleDrop(e, index)}
            className={`relative flex-1 flex flex-col items-center justify-center transition-all ${isDragging ? 'bg-white/5 border border-white/5' : ''}`}
         >
            {player && (
               <div 
                  draggable
                  onDragStart={(e) => handleDragStart(e, player.id)}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, player)}
                  className="z-20 flex flex-col items-center cursor-grab active:cursor-grabbing scale-90 sm:scale-100"
               >
                  <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-full border-2 border-white shadow-xl flex items-center justify-center font-black text-[10px] sm:text-xs ${getPlayerColor(player.positions)}`}>
                     {player.positions[0].substring(0,2)}
                  </div>
                  <div className="bg-black/80 text-white text-[8px] sm:text-[10px] px-1.5 py-0.5 rounded mt-0.5 truncate max-w-[50px] sm:max-w-[80px] shadow border border-white/20">
                     {player.name.split(' ').pop()}
                  </div>
               </div>
            )}
         </div>
      );
   };

    return (
       <div className="p-2 sm:p-4 h-full flex flex-col lg:flex-row gap-2 md:gap-4 overflow-hidden fm-compact">
          <div className="flex-1 flex flex-col gap-2 min-h-0">
             {/* Toolbar - Compact on Mobile */}
             <div className="metallic-panel p-2 rounded-lg flex flex-wrap gap-2 items-center justify-between shadow-lg" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide max-w-full">
                   <select 
                     className="text-[10px] sm:text-xs border rounded px-2 py-1.5"
                     style={{ backgroundColor: '#e8e8e8', borderColor: '#999', color: '#333' }}
                     value={selectedTacticId} onChange={(e) => handleLoadTactic(e.target.value)}
                   >
                     <option value="" disabled>Táctica</option>
                     {world.getTactics().map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                   </select>
                   <button onClick={() => autoPickBestEleven()} className="text-[10px] px-3 py-1.5 rounded whitespace-nowrap uppercase font-black tracking-widest border" style={{ backgroundColor: '#0066cc', color: '#fff', borderColor: '#004499' }}>Auto</button>
                   <button onClick={() => { players.forEach(p => { p.isStarter = false; onUpdatePlayer(p); }); }} className="text-[10px] px-3 py-1.5 rounded whitespace-nowrap uppercase border" style={{ backgroundColor: '#e8e8e8', color: '#333', borderColor: '#999' }}>Reset</button>
                </div>
             </div>

             {/* Pitch */}
             <div className="flex-1 rounded-lg flex items-center justify-center p-1 sm:p-2 min-h-[300px] overflow-hidden" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                <div className="relative w-full h-full max-w-[90vw] sm:max-w-[60vh] aspect-[68/105] shadow-2xl fm-pitch border rounded overflow-hidden" style={{ borderColor: '#333' }}>
                   <div className="absolute inset-0 flex flex-col z-10 p-1">
                      <div className="flex-[1] flex w-full">{renderCell(30, "")}{renderCell(29, "")}{renderCell(28, "")}{renderCell(27, "")}{renderCell(26, "")}</div>
                      <div className="flex-[1] flex w-full">{renderCell(25, "")}{renderCell(24, "")}{renderCell(23, "")}{renderCell(22, "")}{renderCell(21, "")}</div>
                      <div className="flex-[1] flex w-full">{renderCell(20, "")}{renderCell(19, "")}{renderCell(18, "")}{renderCell(17, "")}{renderCell(16, "")}</div>
                      <div className="flex-[1] flex w-full">{renderCell(15, "")}{renderCell(14, "")}{renderCell(13, "")}{renderCell(12, "")}{renderCell(11, "")}</div>
                      <div className="flex-[1] flex w-full">{renderCell(10, "")}{renderCell(9, "")}{renderCell(8, "")}{renderCell(7, "")}{renderCell(6, "")}</div>
                      <div className="flex-[1] flex w-full">{renderCell(5, "")}{renderCell(4, "")}{renderCell(3, "")}{renderCell(2, "")}{renderCell(1, "")}</div>
                      <div className="flex-[1] flex w-full justify-center"><div className="w-1/4 h-full">{renderCell(0, "")}</div></div>
                   </div>
                </div>
             </div>
          </div>

          {/* Available Players - Compact Sidebar/Bottom Drawer style */}
          <div className="lg:w-80 metallic-panel rounded-lg flex flex-col min-h-[150px] lg:h-auto overflow-hidden" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
             <header className="p-3 border-b shrink-0" style={{ backgroundColor: '#e8e8e8', borderColor: '#ccc' }}>
                <h3 className="font-bold text-xs flex items-center gap-2 uppercase tracking-widest" style={{ color: '#333' }}><Shirt size={14}/> Plantilla</h3>
             </header>
             <div className="flex-1 overflow-y-auto p-1.5 space-y-1 scrollbar-hide">
                {players.sort((a,b) => b.currentAbility - a.currentAbility).map(p => (
                   <div key={p.id} draggable onDragStart={(e) => handleDragStart(e, p.id)} onContextMenu={(e) => onContextMenu && onContextMenu(e, p)} className={`flex items-center p-2 rounded transition-all ${p.isStarter ? 'opacity-40 grayscale' : 'shadow-sm'}`} style={{ backgroundColor: p.isStarter ? '#ccc' : '#e8e8e8' }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center font-black text-[9px] mr-2 shrink-0 border-2 border-white" style={{ backgroundColor: p.positions.includes(Position.GK) ? '#ffcc00' : club.primaryColor, color: p.positions.includes(Position.GK) ? '#000' : '#fff' }}>{p.positions[0].substring(0,2)}</div>
                      <div className="flex-1 min-w-0"><p className="text-[11px] font-bold truncate fm-link" style={{ color: '#0066cc' }}>{p.name}</p><div className="flex gap-2 text-[8px] uppercase" style={{ color: '#666' }}><span>{p.positions[0]}</span><span style={{ color: '#ff9900' }}>★ {(p.currentAbility/20).toFixed(0)}</span></div></div>
                   </div>
                ))}
             </div>
          </div>
       </div>
    );
}
