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
    <div className="p-8 h-full flex flex-col items-center justify-center overflow-y-auto" style={{ backgroundColor: '#dcdcdc' }}>
      <div className="max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
        <header className="p-8 border-b flex justify-between items-center" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
          <div className="flex items-center gap-6">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl ${club.primaryColor}`}>{club.shortName}</div>
            <div className="text-4xl font-black italic" style={{ color: '#999' }}>VS</div>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-xl ${opponent.primaryColor}`}>{opponent.shortName}</div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: '#333' }}>Preparativos</h2>
            <p className="font-bold text-xs uppercase tracking-widest" style={{ color: '#666' }}>{club.stadium}</p>
          </div>
        </header>

        <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="font-black uppercase text-xs tracking-widest mb-6 flex items-center gap-2" style={{ color: '#999' }}>
              <Clipboard size={14}/> Alineación Confirmada
            </h3>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-4 scrollbar-hide">
              {starters.length === 0 ? (
                <div className="p-8 border-2 border-dashed rounded-xl text-center italic" style={{ borderColor: '#999', color: '#999' }}>No has seleccionado un 11 inicial.</div>
              ) : (
                starters.sort((a,b) => (a.tacticalPosition || 0) - (b.tacticalPosition || 0)).map(p => (
                  <div key={p.id} className="flex items-center justify-between p-3 rounded-xl transition-colors" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black" style={{ backgroundColor: '#1e293b', color: '#999', border: '1px solid #999' }}>{p.positions[0]}</span>
                      <span className="font-bold" style={{ color: '#333' }}>{p.name}</span>
                    </div>
                    <span className="font-bold text-xs" style={{ color: '#999' }}>{(p.currentAbility/20).toFixed(1)} ★</span>
                  </div>
                ))
              )}
            </div>
            {starters.length < 11 && (
               <p className="mt-4 text-xs font-bold animate-pulse" style={{ color: '#999' }}>Debes tener 11 jugadores titulares para jugar.</p>
            )}
          </div>

          <div className="flex flex-col justify-between">
            <div className="space-y-6">
              <div className="p-6 rounded-2xl" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                <h4 className="font-bold mb-2 flex items-center gap-2 text-sm" style={{ color: '#333' }}><ShieldCheck size={16} style={{ color: '#666' }}/> Informe del Ayudante</h4>
                <p className="text-sm italic leading-relaxed" style={{ color: '#999' }}>"El equipo está listo, jefe. La moral es {starters.reduce((acc, p) => acc + p.morale, 0) / (starters.length || 1) > 80 ? 'excelente' : 'mejorable'}. Si mantenemos la presión arriba deberíamos llevarnos los 3 puntos."</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 rounded-xl text-center" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                    <span className="block text-[10px] font-black uppercase mb-1" style={{ color: '#999' }}>Tu Nivel</span>
                    <span className="text-2xl font-black" style={{ color: '#333' }}>{(club.reputation/2000).toFixed(1)}</span>
                 </div>
                 <div className="p-4 rounded-xl text-center" style={{ backgroundColor: '#e8e8e8', border: '1px solid #999' }}>
                    <span className="block text-[10px] font-black uppercase mb-1" style={{ color: '#999' }}>Rival Nivel</span>
                    <span className="text-2xl font-black" style={{ color: '#333' }}>{(opponent.reputation/2000).toFixed(1)}</span>
                 </div>
              </div>
            </div>

            <div className="space-y-4 pt-8">
              <button 
                onClick={onStart}
                disabled={starters.length < 11}
                className="w-full py-5 flex items-center justify-center gap-3 rounded-2xl font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95"
                style={{ 
                  backgroundColor: starters.length < 11 ? '#1e293b' : '#666',
                  color: starters.length < 11 ? '#999' : '#fff',
                  cursor: starters.length < 11 ? 'not-allowed' : 'pointer'
                }}
              >
                <Play size={20} /> Jugar Partido
              </button>
              <button 
                onClick={onGoToTactics}
                className="w-full py-4 transition-colors text-xs font-black tracking-widest uppercase border rounded-xl"
                style={{ color: '#999', borderColor: 'transparent' }}
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