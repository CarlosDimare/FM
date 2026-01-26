
import React from 'react';
import { Player } from '../types';
import { world } from '../services/worldManager';
import { UserPlus, UserMinus, ArrowRightLeft, DollarSign, Clock, ShieldCheck, UserX } from 'lucide-react';

interface PlayerContextMenuProps {
  player: Player;
  x: number;
  y: number;
  onClose: () => void;
  onUpdate: () => void;
  currentDate?: Date;
}

export const PlayerContextMenu: React.FC<PlayerContextMenuProps> = ({ player, x, y, onClose, onUpdate, currentDate }) => {
  const handleAction = (action: () => void) => {
    action();
    onUpdate();
    onClose();
  };

  const moveSquad = (squad: 'SENIOR' | 'RESERVE' | 'U20') => {
    player.squad = squad;
    if (squad !== 'SENIOR') {
      player.isStarter = false;
      player.tacticalPosition = undefined;
    }
  };

  const setStatus = (status: 'NONE' | 'TRANSFERABLE' | 'LOANABLE') => {
    player.transferStatus = status;
  };

  return (
    <div 
      className="fixed z-[1000] bg-slate-800 border border-slate-700 rounded-lg shadow-2xl py-2 w-56 animate-in fade-in zoom-in duration-100"
      style={{ left: x, top: y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2 border-b border-slate-700">
        <p className="text-white font-bold text-xs truncate">{player.name}</p>
        <p className="text-slate-500 text-[9px] uppercase tracking-widest">{player.positions[0]}</p>
      </div>

      <div className="py-1">
        {player.squad !== 'SENIOR' && (
          <ContextItem icon={<UserPlus size={14}/>} label="Mover a Primer Equipo" onClick={() => handleAction(() => moveSquad('SENIOR'))} />
        )}
        {player.squad !== 'RESERVE' && (
          <ContextItem icon={<ArrowRightLeft size={14}/>} label="Mover a Reserva" onClick={() => handleAction(() => moveSquad('RESERVE'))} />
        )}
        {player.squad !== 'U20' && (
          <ContextItem icon={<Clock size={14}/>} label="Mover a Sub-20" onClick={() => handleAction(() => moveSquad('U20'))} />
        )}
      </div>

      <div className="border-t border-slate-700 py-1">
        <ContextItem 
          icon={<DollarSign size={14} className={player.transferStatus === 'TRANSFERABLE' ? 'text-green-400' : ''}/>} 
          label={player.transferStatus === 'TRANSFERABLE' ? "Quitar de Transferibles" : "Declarar Transferible"} 
          onClick={() => handleAction(() => setStatus(player.transferStatus === 'TRANSFERABLE' ? 'NONE' : 'TRANSFERABLE'))} 
        />
        <ContextItem 
          icon={<ShieldCheck size={14} className={player.transferStatus === 'LOANABLE' ? 'text-blue-400' : ''}/>} 
          label={player.transferStatus === 'LOANABLE' ? "Quitar de Cedibles" : "Declarar Cedible"} 
          onClick={() => handleAction(() => setStatus(player.transferStatus === 'LOANABLE' ? 'NONE' : 'LOANABLE'))} 
        />
        {currentDate && player.clubId !== 'FREE_AGENT' && (
           <ContextItem 
             icon={<UserX size={14} className="text-red-500"/>} 
             label="Rescindir Contrato" 
             onClick={() => handleAction(() => world.rescindContract(player.id, currentDate))} 
           />
        )}
      </div>
    </div>
  );
};

const ContextItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-xs font-medium text-slate-300 hover:bg-blue-600 hover:text-white flex items-center gap-3 transition-colors"
  >
    {icon} {label}
  </button>
);
