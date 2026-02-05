
import React, { useState } from 'react';
import { world } from '../services/worldManager';
import { X, Settings, PauseCircle, PlayCircle, Save } from 'lucide-react';
import { FMButton } from './FMUI';

interface SettingsModalProps {
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [pauseAtHalftime, setPauseAtHalftime] = useState(world.matchSettings.pauseAtHalftime);

  const handleSave = () => {
    world.matchSettings.pauseAtHalftime = pauseAtHalftime;
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-slate-200 w-full max-w-sm rounded-sm border-2 border-slate-500 shadow-2xl overflow-hidden flex flex-col">
        <header className="p-4 bg-slate-300 border-b border-slate-400 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <Settings size={20} className="text-slate-700" />
             <h3 className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Configuración</h3>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-red-600 transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="p-6 space-y-6">
           <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-300 pb-1">Simulación de Partido</h4>
              
              <div className="flex flex-col gap-2">
                 <label className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <PauseCircle size={18} className={pauseAtHalftime ? "text-blue-600" : "text-slate-400"} />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 uppercase">Pausar en el Entretiempo</span>
                          <span className="text-[9px] text-slate-500 font-medium">Detener la simulación al minuto 45.</span>
                       </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${pauseAtHalftime ? 'border-blue-600' : 'border-slate-400'}`}>
                       {pauseAtHalftime && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <input type="radio" checked={pauseAtHalftime} onChange={() => setPauseAtHalftime(true)} className="hidden" />
                 </label>

                 <label className="flex items-center justify-between p-3 bg-white border border-slate-300 rounded-sm cursor-pointer hover:bg-slate-50 transition-colors group">
                    <div className="flex items-center gap-3">
                       <PlayCircle size={18} className={!pauseAtHalftime ? "text-blue-600" : "text-slate-400"} />
                       <div className="flex flex-col">
                          <span className="text-[11px] font-bold text-slate-900 uppercase">Simulación Continua</span>
                          <span className="text-[9px] text-slate-500 font-medium">Avanzar hasta el final sin pausas.</span>
                       </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!pauseAtHalftime ? 'border-blue-600' : 'border-slate-400'}`}>
                       {!pauseAtHalftime && <div className="w-2 h-2 bg-blue-600 rounded-full"></div>}
                    </div>
                    <input type="radio" checked={!pauseAtHalftime} onChange={() => setPauseAtHalftime(false)} className="hidden" />
                 </label>
              </div>
           </div>

           <FMButton onClick={handleSave} className="w-full py-3">
              <Save size={14} /> Guardar Cambios
           </FMButton>
        </div>
      </div>
    </div>
  );
};
