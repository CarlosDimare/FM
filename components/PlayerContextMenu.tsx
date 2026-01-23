
import React from 'react';
// Fix: Import world from services/worldManager instead of types
import { Player } from '../types';
import { world } from '../services/worldManager';
import { UserPlus, UserMinus, ArrowRightLeft, DollarSign, Clock, ShieldCheck, UserX } from 'lucide-react';

interface PlayerContextMenuProps {
  player: Player;
  x: number;
  y: number;
  onClose: () => void;
  onUpdate: () => void;
}

export const PlayerContextMenu: React.FC<PlayerContextMenuProps> = ({ player, x, y, onClose, onUpdate }) => {
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
      className="fixed z-[1000] rounded-lg shadow-2xl py-2 w-56 animate-in fade-in zoom-in duration-100"
      style={{ left: x, top: y, backgroundColor: '#f4f4f4', border: '1px solid #999' }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="px-4 py-2" style={{ borderBottom: '1px solid #999' }}>
        <p className="font-bold text-xs truncate" style={{ color: '#333' }}>{player.name}</p>
        <p className="text-[9px] uppercase tracking-widest" style={{ color: '#999' }}>{player.positions[0]}</p>
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

      <div className="border-t py-1" style={{ borderColor: '#999' }}>
        <ContextItem 
          icon={<DollarSign size={14} style={{ color: player.transferStatus === 'TRANSFERABLE' ? '#666' : '' }}/>} 
          label={player.transferStatus === 'TRANSFERABLE' ? "Quitar de Transferibles" : "Declarar Transferible"} 
          onClick={() => handleAction(() => setStatus(player.transferStatus === 'TRANSFERABLE' ? 'NONE' : 'TRANSFERABLE'))} 
        />
        <ContextItem 
          icon={<ShieldCheck size={14} style={{ color: player.transferStatus === 'LOANABLE' ? '#666' : '' }}/>} 
          label={player.transferStatus === 'LOANABLE' ? "Quitar de Cedibles" : "Declarar Cedible"} 
          onClick={() => handleAction(() => setStatus(player.transferStatus === 'LOANABLE' ? 'NONE' : 'LOANABLE'))} 
        />
      </div>
    </div>
  );
};

const ContextItem = ({ icon, label, onClick }: { icon: React.ReactNode, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="w-full text-left px-4 py-2 text-xs font-medium flex items-center gap-3 transition-colors"
    style={{ color: '#333' }}
  >
    {icon} {label}
  </button>
);
