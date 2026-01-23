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
    <div className="p-6 h-full flex flex-col" style={{ backgroundColor: '#dcdcdc' }}>
      <header className="mb-6">
        <h2 className="text-2xl font-bold" style={{ color: '#333' }}>Cuerpo Técnico</h2>
        <p style={{ color: '#999' }}>Los empleados que hacen funcionar al club.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto flex-1 pb-20">
        {staff.map(s => (
          <div 
            key={s.id} 
            onClick={() => setSelectedStaff(s)}
            className="p-6 rounded-lg transition-all cursor-pointer group relative overflow-hidden"
            style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10">
               <Briefcase size={64} style={{ color: '#999' }} />
            </div>
            <h3 className="text-xl font-bold mb-1" style={{ color: '#333' }}>{s.name}</h3>
            <p className="font-bold text-xs uppercase mb-4" style={{ color: '#666' }}>{getRoleLabel(s.role)}</p>
            <div className="flex gap-4 text-xs" style={{ color: '#999' }}>
               <span>{s.nationality}</span>
               <span>{s.age} años</span>
            </div>
          </div>
        ))}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 backdrop-blur-md" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
          <div className="w-full max-w-lg rounded-xl shadow-2xl flex flex-col overflow-hidden" style={{ backgroundColor: '#f4f4f4', border: '1px solid #999' }}>
            <header className="p-6 border-b flex justify-between items-center" style={{ backgroundColor: '#e8e8e8', borderColor: '#999' }}>
              <div>
                 <h3 className="text-2xl font-bold" style={{ color: '#333' }}>{selectedStaff.name}</h3>
                 <p className="font-bold uppercase text-sm tracking-widest" style={{ color: '#666' }}>{getRoleLabel(selectedStaff.role)}</p>
              </div>
              <button onClick={() => setSelectedStaff(null)} style={{ color: '#999' }}>
                <X size={24} />
              </button>
            </header>
            <div className="p-8 space-y-2">
               {Object.entries(selectedStaff.attributes).map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-2" style={{ borderBottom: '1px solid #999' }}>
                     <span className="font-medium" style={{ color: '#999' }}>{ATTRIBUTE_LABELS[key] || key}</span>
                     <span className={`font-black px-3 py-1 rounded`} style={{ color: getAttributeColor(val as number), backgroundColor: '#1e293b' }}>{val as number}</span>
                  </div>
               ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};