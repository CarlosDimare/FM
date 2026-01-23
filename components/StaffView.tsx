import React, { useState } from 'react';
import { Staff, ATTRIBUTE_LABELS } from '../types';
import { getAttributeColor } from '../constants';
import { X, Briefcase, Activity } from 'lucide-react';

interface StaffViewProps {
  staff: Staff[];
}

export const StaffView: React.FC<StaffViewProps> = ({ staff }) => {
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);

  const getRoleLabel = (role: string) => {
    switch(role) {
      case 'ASSISTANT_MANAGER': return 'Segundo Entrenador';
      case 'PHYSIO': return 'Fisioterapeuta';
      case 'FITNESS_COACH': return 'Preparador Físico';
      case 'RESERVE_MANAGER': return 'E. Reserva';
      case 'YOUTH_MANAGER': return 'E. Juveniles';
      default: return role;
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <header className="mb-6">
        <h2 className="text-2xl font-bold text-white">Cuerpo Técnico</h2>
        <p className="text-slate-400">Los empleados que hacen funcionar al club.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-20">
        {staff.map(s => (
          <div 
            key={s.id} 
            onClick={() => setSelectedStaff(s)}
            className="bg-slate-800 p-6 rounded-lg border border-slate-700 hover:border-blue-500 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10">
               <Briefcase size={64} />
            </div>
            <h3 className="text-xl font-bold text-white mb-1">{s.name}</h3>
            <p className="text-blue-400 font-bold text-xs uppercase mb-4">{getRoleLabel(s.role)}</p>
            <div className="flex gap-4 text-xs text-slate-400">
               <span>{s.nationality}</span>
               <span>{s.age} años</span>
            </div>
          </div>
        ))}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-slate-800 w-full max-w-lg rounded-xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden">
            <header className="p-6 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
              <div>
                 <h3 className="text-2xl font-bold text-white">{selectedStaff.name}</h3>
                 <p className="text-blue-400 font-bold uppercase text-sm tracking-widest">{getRoleLabel(selectedStaff.role)}</p>
              </div>
              <button onClick={() => setSelectedStaff(null)} className="text-slate-400 hover:text-white">
                <X size={24} />
              </button>
            </header>
            <div className="p-8 space-y-2">
               {/* Fixed: Cast val to number as Object.entries returns [string, unknown] which causes issues with getAttributeColor */}
               {Object.entries(selectedStaff.attributes).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2 border-b border-slate-700 last:border-0">
                     <span className="text-slate-400 font-medium">{ATTRIBUTE_LABELS[key] || key}</span>
                     <span className={`font-black ${getAttributeColor(val as number)} bg-slate-900 px-3 py-1 rounded`}>{val as number}</span>
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};