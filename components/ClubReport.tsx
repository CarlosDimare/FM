
import React from 'react';
import { Club } from '../types';
import { Trophy, Star, Building2, Wallet, Zap, Users, Shield } from 'lucide-react';
import { FMBox, FMTable, FMTableCell } from './FMUI';

interface ClubReportProps {
  club: Club;
}

const KitVisual: React.FC<{ c1: string, c2: string, label: string }> = ({ c1, c2, label }) => (
  <div className="flex flex-col items-center">
    <div className="relative w-16 h-20">
      <div className={`w-full h-full ${c1} rounded-t-sm relative flex items-center justify-center overflow-hidden border border-slate-600`}>
          <div className={`absolute inset-x-0 top-0 h-4 ${c2} opacity-30`}></div>
          <div className={`absolute inset-y-0 left-0 w-2 ${c2} opacity-20`}></div>
      </div>
      <div className="flex justify-between -mt-px">
          <div className={`w-6 h-6 ${c1} border border-slate-600`}></div>
          <div className={`w-6 h-6 ${c1} border border-slate-600`}></div>
      </div>
    </div>
    <span className="mt-2 text-[9px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
  </div>
);

export const ClubReport: React.FC<ClubReportProps> = ({ club }) => {
  const getReputationLabel = (rep: number) => {
    if (rep > 9000) return "Mundial";
    if (rep > 7000) return "Continental";
    if (rep > 5000) return "Nacional";
    if (rep > 3000) return "Regional";
    return "Local";
  };

  const getFacilityLevelLabel = (lvl: number) => {
    if (lvl >= 18) return "Instalaciones de primer nivel";
    if (lvl >= 15) return "Excelentes";
    if (lvl >= 12) return "Buenas";
    if (lvl >= 9) return "Adecuadas";
    if (lvl >= 6) return "Básicas";
    return "Precarias";
  };

  const InfoRow = ({ label, value, isGreen = false }: { label: string, value: string, isGreen?: boolean }) => (
    <div className="flex border-b border-[#a0b0a0] last:border-0 hover:bg-[#ccd9cc] transition-colors">
       <div className="w-1/2 bg-slate-200/50 p-2 text-[10px] font-black text-slate-600 uppercase tracking-wide border-r border-[#a0b0a0] flex items-center" style={{ fontFamily: 'Verdana, sans-serif' }}>
          {label}
       </div>
       <div className={`w-1/2 p-2 text-xs font-bold ${isGreen ? 'text-green-700' : 'text-slate-800'} flex items-center`} style={{ fontFamily: 'Verdana, sans-serif' }}>
          {value}
       </div>
    </div>
  );

  return (
    <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-[#d4dcd4]">
      {/* Main Header / Info Box */}
      <FMBox title={`Información del Club - ${club.name}`} noPadding>
        <div className="flex flex-col lg:flex-row bg-white">
          {/* Logo & Basic Info */}
          <div className="p-6 flex flex-col items-center justify-center bg-slate-50 border-r border-[#a0b0a0] lg:w-1/3">
            <div className="w-32 h-32 bg-white border-4 border-slate-300 shadow-lg flex items-center justify-center rounded-sm relative overflow-hidden mb-4">
              <div className={`absolute inset-0 opacity-20 ${club.primaryColor}`}></div>
              <span className="text-6xl font-black z-10 text-slate-900 italic">
                {club.shortName.substring(0, 1)}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter text-center">{club.name}</h2>
            <div className="mt-2 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-200 px-3 py-1 rounded-full">{club.country}</div>
          </div>

          {/* Details Table */}
          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-[#a0b0a0]">
            <InfoRow label="Nombre Completo" value={club.name} />
            <InfoRow label="Estadio" value={club.stadium} />
            <InfoRow label="Reputación" value={getReputationLabel(club.reputation)} isGreen />
            <InfoRow label="Centro de Entrenamiento" value={`${getFacilityLevelLabel(club.trainingFacilities)} (${club.trainingFacilities}/20)`} isGreen />
            <InfoRow label="Inferiores" value={`${getFacilityLevelLabel(club.youthFacilities)} (${club.youthFacilities}/20)`} isGreen />
            <InfoRow label="Manager" value="Tú" />
            <InfoRow label="Estatus Financiero" value={club.finances.balance > 5000000 ? "Seguro" : "Inestable"} isGreen={club.finances.balance > 5000000} />
          </div>
        </div>
      </FMBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Honours Table */}
        <FMBox title="Palmarés Reciente" noPadding>
          <div className="flex-1 overflow-y-auto max-h-[300px]">
            <FMTable headers={['Año', 'Competición']} colWidths={['60px', 'auto']}>
              {club.honours.length > 0 ? (
                club.honours.map((h, i) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f2f7f2]'}>
                    <FMTableCell className="font-mono text-slate-600 font-bold">{h.year}</FMTableCell>
                    <FMTableCell className="text-slate-900 font-bold italic">🏆 {h.name}</FMTableCell>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={2} className="p-8 text-center text-slate-400 italic text-[10px] uppercase font-black">Sin títulos en el registro</td>
                </tr>
              )}
            </FMTable>
          </div>
        </FMBox>

        {/* Kits and Extra Panels */}
        <div className="flex flex-col gap-4">
          <FMBox title="Equipación Oficial">
            <div className="flex justify-around items-center h-full py-4 bg-white">
              <KitVisual c1={club.primaryColor} c2={club.secondaryColor} label="Titular" />
              <KitVisual c1={club.secondaryColor} c2={club.primaryColor} label="Alternativa" />
            </div>
          </FMBox>

          <FMBox title="Resumen de Finanzas">
            <div className="p-4 space-y-4 bg-white">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presupuesto Fichajes</span>
                <span className="text-sm font-black text-green-700">£{club.finances.transferBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Presupuesto Salarial</span>
                <span className="text-sm font-black text-slate-900">£{club.finances.wageBudget.toLocaleString()} / mes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance Total</span>
                <span className={`text-sm font-black ${club.finances.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>£{club.finances.balance.toLocaleString()}</span>
              </div>
            </div>
          </FMBox>
        </div>
      </div>
    </div>
  );
};
