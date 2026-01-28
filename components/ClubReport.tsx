
import React from 'react';
import { Club } from '../types';
import { Trophy, Star, Building2, Wallet, Zap, Users, Shield } from 'lucide-react';
import { FMBox, FMTable, FMTableCell } from './FMUI';

interface ClubReportProps {
  club: Club;
}

const KitVisual: React.FC<{ primary: string, secondary: string, label: string }> = ({ primary, secondary, label }) => {
  // Convertimos las clases bg- de Tailwind a colores de texto para que el SVG pueda usar fill="currentColor"
  const fillPrimary = primary.replace('bg-', 'text-');
  const fillSecondary = secondary.replace('text-', 'text-').replace('bg-', 'text-');

  return (
    <div className="flex flex-col items-center group cursor-help">
      <div className="relative w-24 h-28 transition-transform duration-300 ease-out group-hover:scale-110 filter drop-shadow-lg">
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Capa 1: El Torso (Base) */}
          <path 
            d="M 30 10 L 15 10 L 0 30 L 15 45 L 25 35 L 25 90 L 75 90 L 75 35 L 85 45 L 100 30 L 85 10 L 70 10 L 50 22 Z" 
            className={`${fillPrimary} fill-current`}
          />
          
          {/* Capa 2: Cuello y Puños (Detalles) */}
          <g className={`${fillSecondary} fill-current`}>
            {/* Cuello en V */}
            <path d="M 35 10 L 50 25 L 65 10 L 60 10 L 50 20 L 40 10 Z" />
            {/* Puño Izquierdo */}
            <path d="M 0 30 L 5 35 L 18 22 L 13 17 Z" opacity="0.8" />
            {/* Puño Derecho */}
            <path d="M 100 30 L 95 35 L 82 22 L 87 17 Z" opacity="0.8" />
          </g>

          {/* Capa 3: Sombreado y Textura (Relieve) */}
          <path 
            d="M 50 22 L 50 90" 
            stroke="black" 
            strokeWidth="15" 
            opacity="0.1" 
            fill="none"
          />
          <path 
            d="M 25 35 L 75 35" 
            stroke="white" 
            strokeWidth="2" 
            opacity="0.05" 
            fill="none"
          />
          
          {/* Brillo lateral para volumen */}
          <path 
            d="M 25 35 L 25 90" 
            stroke="white" 
            strokeWidth="4" 
            opacity="0.1" 
            fill="none"
          />
        </svg>
        
        {/* Etiqueta de equipo pequeña en el pecho (estilo logo) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20 pointer-events-none">
           <Shield size={20} className="text-black" />
        </div>
      </div>
      <span className="mt-3 text-[10px] font-black uppercase text-slate-600 tracking-[0.2em] bg-slate-100 px-3 py-0.5 border border-slate-300 rounded-sm shadow-inner group-hover:bg-slate-900 group-hover:text-white transition-colors">
        {label}
      </span>
    </div>
  );
};

export const ClubReport: React.FC<ClubReportProps> = ({ club }) => {
  const getReputationLabel = (rep: number) => {
    if (rep > 9000) return "Mundial";
    if (rep > 7000) return "Continental";
    if (rep > 5000) return "Nacional";
    if (rep > 3000) return "Regional";
    return "Local";
  };

  const renderStars = (rep: number) => {
    const stars = Math.round(rep / 2000);
    return (
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={12} 
            className={i < stars ? "text-yellow-500 fill-yellow-500" : "text-slate-300"} 
          />
        ))}
      </div>
    );
  };

  const getFacilityLevelLabel = (lvl: number) => {
    if (lvl >= 18) return "Primer Nivel";
    if (lvl >= 15) return "Excelentes";
    if (lvl >= 12) return "Buenas";
    if (lvl >= 9) return "Adecuadas";
    if (lvl >= 6) return "Básicas";
    return "Precarias";
  };

  const InfoRow = ({ label, value, children, isGreen = false }: { label: string, value?: string, children?: React.ReactNode, isGreen?: boolean }) => (
    <div className="flex border-b border-[#a0b0a0] last:border-0 hover:bg-[#ccd9cc] transition-colors">
       <div className="w-1/2 bg-[#e8ece8]/50 p-2 text-[10px] font-black text-slate-600 uppercase tracking-wide border-r border-[#a0b0a0] flex items-center" style={{ fontFamily: 'Verdana, sans-serif' }}>
          {label}
       </div>
       <div className={`w-1/2 p-2 text-xs font-bold ${isGreen ? 'text-green-700' : 'text-slate-800'} flex items-center gap-2`} style={{ fontFamily: 'Verdana, sans-serif' }}>
          {value || children}
       </div>
    </div>
  );

  return (
    <div className="flex-1 p-2 md:p-4 overflow-y-auto flex flex-col gap-4 bg-[#d4dcd4]">
      <FMBox title={`Información del Club - ${club.name}`} noPadding>
        <div className="flex flex-col lg:flex-row bg-white">
          <div className="p-6 flex flex-col items-center justify-center bg-[#f0f4f0] border-r border-[#a0b0a0] lg:w-1/3">
            <div className="w-32 h-32 bg-white border-4 border-slate-300 shadow-lg flex items-center justify-center rounded-sm relative overflow-hidden mb-4">
              <div className={`absolute inset-0 opacity-20 ${club.primaryColor}`}></div>
              <span className="text-6xl font-black z-10 text-slate-900 italic">
                {club.shortName.substring(0, 1)}
              </span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter text-center leading-none">{club.name}</h2>
            <div className="mt-3 text-[10px] font-black text-slate-500 uppercase tracking-widest bg-[#e8ece8] border border-[#a0b0a0] px-4 py-1 rounded-full">{club.country}</div>
          </div>

          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-[#a0b0a0]">
            <InfoRow label="Nombre Completo" value={club.name} />
            <InfoRow label="Estadio" value={club.stadium} />
            <InfoRow label="Reputación" isGreen>
               <span className="mr-2">{getReputationLabel(club.reputation)}</span>
               {renderStars(club.reputation)}
            </InfoRow>
            <InfoRow label="Instalaciones Entreno" value={`${getFacilityLevelLabel(club.trainingFacilities)} (${club.trainingFacilities}/20)`} isGreen />
            <InfoRow label="Instalaciones Juveniles" value={`${getFacilityLevelLabel(club.youthFacilities)} (${club.youthFacilities}/20)`} isGreen />
            <InfoRow label="Economía" value={`£${club.finances.balance.toLocaleString()}`} isGreen />
            <InfoRow label="Mánager" value="Tú" />
          </div>
        </div>
      </FMBox>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FMBox title="Palmarés Reciente" noPadding className="min-h-[250px]">
          <div className="flex-1 overflow-y-auto">
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
                  <td colSpan={2} className="p-12 text-center text-slate-400 italic text-[10px] uppercase font-black">Sin títulos en el registro</td>
                </tr>
              )}
            </FMTable>
          </div>
        </FMBox>

        <div className="flex flex-col gap-4">
          <FMBox title="Equipación Oficial">
            <div className="flex justify-around items-center h-full py-8 bg-white border-b border-[#a0b0a0]">
              <KitVisual primary={club.primaryColor} secondary={club.secondaryColor} label="Titular" />
              <KitVisual primary={club.secondaryColor} secondary={club.primaryColor} label="Alternativa" />
            </div>
          </FMBox>

          <FMBox title="Presupuestos" noPadding>
            <div className="p-4 space-y-3 bg-white">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fichajes Restante</span>
                <span className="text-sm font-black text-green-700">£{club.finances.transferBudget.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sueldos Mensual</span>
                <span className="text-sm font-black text-slate-900">£{club.finances.wageBudget.toLocaleString()}</span>
              </div>
            </div>
          </FMBox>
        </div>
      </div>
    </div>
  );
};
