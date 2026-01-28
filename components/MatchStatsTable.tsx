
import React from 'react';
import { Player, PlayerMatchStats, Club } from '../types';
import { PlusCircle } from 'lucide-react';

// Auxiliares movidos fuera del componente para mejor rendimiento
const getConditionColor = (val: number) => {
    if (val >= 90) return 'text-green-700';
    if (val >= 75) return 'text-blue-800';
    if (val >= 60) return 'text-amber-700';
    return 'text-red-600 font-bold';
};

const getRatingColor = (val: number) => {
    if (val >= 8) return 'text-green-700 font-black';
    if (val >= 7.5) return 'text-blue-800 font-bold';
    if (val < 6) return 'text-red-600 font-bold';
    return 'text-black';
};

interface CellProps {
    val: number;
    highlightThreshold?: number;
    isFaded?: boolean;
}

const Cell: React.FC<CellProps> = ({ val, highlightThreshold, isFaded }) => (
    <td className={`px-1 py-1 text-center border-r border-[#a0b0a0]/30 ${isFaded ? 'text-slate-400' : 'text-slate-900'} ${!isFaded && highlightThreshold && val >= highlightThreshold ? 'font-bold text-blue-900' : ''}`}>
        {val === 0 ? '' : val}
    </td>
);

interface PlayerRowProps {
    p: Player;
    idx: number;
    isSub: boolean;
    s: PlayerMatchStats | undefined;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ p, idx, isSub, s }) => {
    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f7f4]';
    
    // Un suplente está "faded" (gris) si no tiene actividad registrada (no ha entrado)
    // Consideramos que ha jugado si su condición bajó de 100 o hizo algún pase
    const hasPlayed = s && (s.passesAttempted > 0 || s.condition < 100);
    const isFaded = isSub && !hasPlayed;

    return (
        <tr className={`${rowBg} hover:bg-[#ccd9cc] transition-colors border-b border-[#d0d8d0]`}>
            {/* Nº: Los titulares 1-11, los suplentes del 12 en adelante */}
            <td className={`px-1 py-1 text-center font-mono text-[9px] border-r border-[#a0b0a0]/30 ${isFaded ? 'text-slate-400' : 'text-slate-700'}`}>
                {isSub ? idx + 12 : idx + 1}
            </td>
            {/* T (Tarjetas) */}
            <td className="px-1 py-1 text-center border-r border-[#a0b0a0]/30 w-4">
                {s?.card === 'YELLOW' && <div className="w-1.5 h-2.5 bg-yellow-400 border border-yellow-600 mx-auto rounded-[1px]"></div>}
                {s?.card === 'RED' && <div className="w-1.5 h-2.5 bg-red-600 border border-red-800 mx-auto rounded-[1px]"></div>}
            </td>
            {/* Nombre: En gris si no ha jugado */}
            <td className={`px-2 py-1 text-left truncate max-w-[140px] border-r border-[#a0b0a0]/30 ${isFaded ? 'text-slate-400 font-normal italic' : 'text-slate-900 font-bold'}`}>
                {p.name}
            </td>
            {/* Inf. (Iconos) */}
            <td className="px-1 py-1 text-center border-r border-[#a0b0a0]/30 w-6">
                {p.injury && <PlusCircle size={10} className="text-red-600 mx-auto" />}
            </td>
            
            <Cell val={s?.passesAttempted ?? 0} isFaded={isFaded} />
            <Cell val={s?.passesCompleted ?? 0} highlightThreshold={20} isFaded={isFaded} />
            <Cell val={s?.keyPasses ?? 0} highlightThreshold={1} isFaded={isFaded} />
            
            <Cell val={s?.headersAttempted ?? 0} isFaded={isFaded} />
            <Cell val={s?.headersWon ?? 0} highlightThreshold={3} isFaded={isFaded} />
            <Cell val={s?.keyHeaders ?? 0} highlightThreshold={1} isFaded={isFaded} />
            
            <Cell val={s?.interceptions ?? 0} highlightThreshold={3} isFaded={isFaded} />
            <Cell val={s?.dribblesCompleted ?? 0} highlightThreshold={3} isFaded={isFaded} />
            <Cell val={s?.offsides ?? 0} isFaded={isFaded} />
            <Cell val={s?.foulsCommitted ?? 0} isFaded={isFaded} />
            <Cell val={s?.foulsReceived ?? 0} isFaded={isFaded} />
            <Cell val={s?.assists ?? 0} highlightThreshold={1} isFaded={isFaded} />
            <Cell val={s?.shots ?? 0} highlightThreshold={3} isFaded={isFaded} />
            <Cell val={s?.shotsBlocked ?? 0} isFaded={isFaded} />
            
            {/* ESTADO: Solo visible si ha jugado */}
            <td className={`px-1 py-1 text-center font-bold border-r border-[#a0b0a0]/30 w-10 ${isFaded ? 'text-slate-300' : getConditionColor(Math.round(s?.condition ?? 100))}`}>
                {!isFaded ? `${Math.round(s?.condition ?? 100)}` : ''}
            </td>
            <td className={`px-1 py-1 text-center border-r border-[#a0b0a0]/30 w-8 ${isFaded ? 'text-slate-300' : getRatingColor(s?.rating ?? 6.0)}`}>
                {!isFaded ? (s?.rating ?? 6.0).toFixed(1) : ''}
            </td>
            <td className={`px-1 py-1 text-center font-black w-8 ${isFaded ? 'text-slate-300' : 'text-slate-900'}`}>
                {(!isFaded && (s?.goals ?? 0) > 0) ? s?.goals : ''}
            </td>
        </tr>
    );
};

interface MatchStatsTableProps {
    players: Player[]; 
    stats: Record<string, PlayerMatchStats>;
    club: Club;
}

export const MatchStatsTable: React.FC<MatchStatsTableProps> = ({ players, stats }) => {
    // 1. Filtrado estricto de titulares (Máximo 11)
    const starters = players
        .filter(p => p.isStarter && p.tacticalPosition !== undefined)
        .sort((a, b) => (a.tacticalPosition ?? 0) - (b.tacticalPosition ?? 0))
        .slice(0, 11);

    // 2. Filtrado estricto de suplentes (Máximo 9)
    // Primero intentamos pillar a los que han jugado, luego rellenamos con los que tienen isStarter en false
    const bench = players
        .filter(p => !p.isStarter)
        .sort((a, b) => {
            // Prioridad a los que tienen actividad en stats
            const hasActivityA = stats[a.id] && (stats[a.id].passesAttempted > 0 || stats[a.id].condition < 100) ? 1 : 0;
            const hasActivityB = stats[b.id] && (stats[b.id].passesAttempted > 0 || stats[b.id].condition < 100) ? 1 : 0;
            return hasActivityB - hasActivityA || b.currentAbility - a.currentAbility;
        })
        .slice(0, 9);

    return (
        <div className="w-full bg-[#d4dcd4] border border-[#a0b0a0] rounded-sm shadow-sm select-none overflow-hidden">
            <table className="w-full text-[10px] border-collapse" style={{ fontFamily: 'Verdana, sans-serif' }}>
                <thead>
                    <tr className="bg-[#bcc8bc] border-b border-[#a0b0a0]">
                        <th colSpan={4} className="py-1 px-2 text-left font-black uppercase text-slate-600 tracking-wider border-r border-[#a0b0a0]/50 h-5">Información</th>
                        <th colSpan={3} className="py-1 text-center font-black uppercase text-slate-600 tracking-wider border-r border-[#a0b0a0]/50">Pases</th>
                        <th colSpan={3} className="py-1 text-center font-black uppercase text-slate-600 tracking-wider border-r border-[#a0b0a0]/50">Aire</th>
                        <th colSpan={8} className="py-1 text-center font-black uppercase text-slate-600 tracking-wider border-r border-[#a0b0a0]/50">General</th>
                        <th colSpan={3} className="py-1 text-center font-black uppercase text-slate-600 tracking-wider">Estado</th>
                    </tr>
                    <tr className="border-b border-[#8c9c8c] text-[#1a1a1a] h-6" style={{ background: 'linear-gradient(to bottom, #dbe6db 0%, #aabdaa 100%)' }}>
                        <th className="w-6 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Nº</th>
                        <th className="w-4 py-1 text-center font-bold border-r border-[#a0b0a0]/30">T</th>
                        <th className="py-1 px-2 text-left font-bold min-w-[120px] border-r border-[#a0b0a0]/30">Nombre</th>
                        <th className="w-6 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Inf.</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Pas</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Bue</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Imp</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Cab</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Gan</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Imp</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Int</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Des</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Fdj</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">F.C</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">F.R</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Asi</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Tir</th>
                        <th className="w-7 py-1 text-center font-normal border-r border-[#a0b0a0]/30">Tap</th>
                        <th className="w-10 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Con</th>
                        <th className="w-8 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Pro</th>
                        <th className="w-8 py-1 text-center font-bold">Gls</th>
                    </tr>
                </thead>
                <tbody>
                    {starters.map((p, idx) => (
                        <PlayerRow key={p.id} p={p} idx={idx} isSub={false} s={stats[p.id]} />
                    ))}
                    {bench.map((p, idx) => (
                        <PlayerRow key={p.id} p={p} idx={idx} isSub={true} s={stats[p.id]} />
                    ))}
                </tbody>
            </table>
        </div>
    );
};
