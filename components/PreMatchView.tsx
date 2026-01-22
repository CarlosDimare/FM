import React from 'react';
import { Club, Player } from '../types';
import { Play, Clipboard, ShieldCheck } from 'lucide-react';

interface PreMatchViewProps {
  club: Club;
  opponent: Club;
  starters: Player[];
  onStart: () => void;
  onGoToTactics: () => void;
}

export const PreMatchView: React.FC<PreMatchViewProps> = ({ club, opponent, starters, onStart, onGoToTactics }) => {
  return (
    <div className="p-8 h-full flex flex-col items-center justify-center bg-slate-900 overflow-y-auto">
      <div className="max-w-4xl w-full bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500">
        <header className="p-8 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl ${club.primaryColor}`}>{club.shortName}</div>
            <div className="text-4xl font-black text-slate-700 italic">VS</div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl ${opponent.primaryColor}`}>{opponent.shortName}</div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Preparativos</h2>
            <p className="text-blue-400 font-bold text-xs uppercase tracking-widest">{club.stadium}</p>
          </div>
        </header>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2">
              <Clipboard size={14}/> Alineación Confirmada
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
              {starters.length === 0 ? (
                <div className="p-8 border-2 border-dashed border-slate-700 rounded-xl text-center text-slate-500 italic">No has seleccionado un 11 inicial.</div>
              ) : (
                starters.sort((a,b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0)).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl border border-slate-700 hover:border-slate-500 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-700">{p.positions[0]}</span>
                      <span className="text-white font-bold">{p.name}</span>
                    </div>
                    <span className="text-yellow-500 font-bold text-xs">{(p.currentAbility/20).toFixed(1)} ★</span>
                  </div>
                ))
              )}
            </div>
            {starters.length < 11 && (
               <p className="mt-4 text-red-400 text-xs font-bold animate-pulse">Debes tener 11 jugadores titulares para jugar.</p>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                <h4 className="text-white font-bold mb-2 flex items-center gap-2 text-sm"><ShieldCheck size={16} className="text-blue-400"/> Informe del Ayudante</h4>
                <p className="text-slate-400 text-sm italic leading-relaxed">"El equipo está listo, jefe. La moral es {starters.reduce((acc, p) => acc + p.morale, 0) / (starters.length || 1) > 80 ? 'excelente' : 'mejorable'}. Si mantenemos la presión arriba deberíamos llevarnos los 3 puntos."</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                    <span className="block text-[10px] text-slate-500 font-black uppercase mb-1">Tu Nivel</span>
                    <span className="text-2xl font-black text-white">{(club.reputation/2000).toFixed(1)}</span>
                 </div>
                 <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 text-center">
                    <span className="block text-[10px] text-slate-500 font-black uppercase mb-1">Rival Nivel</span>
                    <span className="text-2xl font-black text-white">{(opponent.reputation/2000).toFixed(1)}</span>
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <button 
                onClick={onStart}
                disabled={starters.length < 11}
                className={`w-full py-5 flex items-center justify-center gap-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${starters.length < 11 ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}
              >
                <Play size={20} /> Jugar Partido
              </button>
              <button 
                onClick={onGoToTactics}
                className="w-full py-4 text-slate-500 hover:text-white transition-colors text-xs font-black tracking-widest uppercase border border-transparent hover:border-slate-700 rounded-xl"
              >
                Ajustar Tácticas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};