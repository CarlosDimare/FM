
import React, { useState } from 'react';
import { Staff, ATTRIBUTE_LABELS } from '../types';
import { world } from '../services/worldManager';
import { getAttributeColor } from '../constants';
import { X, Briefcase, Activity, Calendar, History, Wallet } from 'lucide-react';
import { FMTable, FMTableCell } from './FMUI';

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
    <div className="p-4 md:p-6 h-full flex flex-col bg-slate-300">
      <header className="mb-6 border-b border-slate-400 pb-4">
        <h2 className="text-2xl font-black text-slate-950 uppercase italic tracking-tighter">Cuerpo Técnico</h2>
        <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">Los empleados que hacen funcionar al club.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-20 custom-scroll">
        {staff.map(s => (
          <div 
            key={s.id} 
            onClick={() => setSelectedStaff(s)}
            className="bg-slate-200 p-6 rounded-sm border border-slate-400 hover:border-slate-600 hover:bg-slate-100 transition-all cursor-pointer group relative overflow-hidden shadow-sm hover:shadow-md"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 text-slate-900">
               <Briefcase size={64} />
            </div>
            <h3 className="text-lg font-black text-slate-950 mb-1 uppercase italic">{s.name}</h3>
            <p className="text-blue-700 font-black text-[10px] uppercase mb-4 tracking-widest">{getRoleLabel(s.role)}</p>
            <div className="flex gap-4 text-[10px] text-slate-600 font-bold uppercase">
               <span>{s.nationality}</span>
               <span>{s.age} años</span>
            </div>
          </div>
        ))}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] rounded-sm shadow-2xl border-2 border-slate-500 flex flex-col overflow-hidden animate-in zoom-in duration-200">
            {(() => {
               const club = world.getClub(selectedStaff.clubId);
               const headerClasses = club ? `${club.primaryColor} ${club.secondaryColor}` : 'bg-slate-900 text-white';
               const borderColor = club && club.primaryColor === 'bg-white' ? 'border-slate-300' : 'border-black/20';
               
               return (
                  <header className={`${headerClasses} p-6 border-b ${borderColor} flex justify-between items-start`}>
                     <div>
                        <h3 className="text-2xl font-black truncate uppercase italic tracking-tighter">{selectedStaff.name}</h3>
                        <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">{getRoleLabel(selectedStaff.role)}</p>
                        <div className="flex gap-3 mt-3 text-[10px] font-black uppercase tracking-tight opacity-90">
                           <span>{selectedStaff.nationality}</span>
                           <span>•</span>
                           <span>{selectedStaff.age} AÑOS</span>
                        </div>
                     </div>
                     <button onClick={() => setSelectedStaff(null)} className="opacity-70 hover:opacity-100 transition-colors">
                        <X size={24} />
                     </button>
                  </header>
               );
            })()}
            
            <div className="flex-1 overflow-y-auto bg-slate-50 p-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Attributes Column */}
                  <div>
                     <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                        <Activity size={14} /> Atributos Clave
                     </h4>
                     <div className="space-y-1 bg-white p-4 rounded-sm border border-slate-200 shadow-sm">
                        {Object.entries(selectedStaff.attributes).map(([key, val]) => (
                           <div key={key} className="flex justify-between items-center py-1.5 border-b border-slate-100 last:border-0 group">
                              <span className="text-slate-600 font-bold text-[11px] uppercase tracking-wide group-hover:text-slate-900">{ATTRIBUTE_LABELS[key] || key}</span>
                              <span className={`font-black text-xs ${getAttributeColor(val as number)} bg-slate-50 px-2 py-0.5 rounded-sm min-w-[24px] text-center`}>{val as number}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Contract & History Column */}
                  <div className="space-y-6">
                     <div>
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                           <Wallet size={14} /> Contrato
                        </h4>
                        <div className="bg-white p-4 rounded-sm border border-slate-200 shadow-sm space-y-3">
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Sueldo</span>
                              <span className="text-slate-900 font-black text-sm">£{selectedStaff.salary.toLocaleString()}</span>
                           </div>
                           <div className="flex justify-between items-center">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">Expira</span>
                              <span className="text-slate-900 font-black text-sm">{selectedStaff.contractExpiry ? selectedStaff.contractExpiry.toLocaleDateString() : 'N/A'}</span>
                           </div>
                        </div>
                     </div>

                     <div className="flex-1 min-h-0 flex flex-col">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 border-b border-slate-300 pb-2">
                           <History size={14} /> Historial
                        </h4>
                        <div className="bg-white border border-slate-200 rounded-sm shadow-sm overflow-hidden flex-1">
                           <FMTable headers={['Año', 'Club', 'Rol']} colWidths={['50px', 'auto', 'auto']}>
                              {selectedStaff.history && selectedStaff.history.length > 0 ? (
                                 selectedStaff.history.map((h, i) => (
                                    <tr key={i} className="border-b border-slate-100 last:border-0">
                                       <FMTableCell className="text-slate-500 font-mono">{h.year}</FMTableCell>
                                       <FMTableCell className="text-slate-900 font-bold">{world.getClub(h.clubId)?.name || 'Desconocido'}</FMTableCell>
                                       <FMTableCell className="text-slate-500 text-[9px] uppercase">{getRoleLabel(h.role)}</FMTableCell>
                                    </tr>
                                 ))
                              ) : (
                                 <tr><td colSpan={3} className="p-4 text-center text-slate-400 italic text-[10px]">Sin historial previo</td></tr>
                              )}
                           </FMTable>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
