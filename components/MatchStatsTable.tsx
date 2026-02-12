
import React, { useState } from 'react';
import { Player, PlayerMatchStats, Club, Position } from '../types';
import { PlusCircle, X, BrainCircuit, Info, Clock } from 'lucide-react';
import { FMBox } from './FMUI';

const getRatingColor = (val: number) => {
    if (val >= 8) return 'text-green-700 font-black';
    if (val >= 7.5) return 'text-blue-800 font-bold';
    if (val < 6) return 'text-red-600 font-bold';
    return 'text-black';
};

const generateRatingExplanation = (s: PlayerMatchStats, pos: Position): string => {
    if (s.minutesPlayed === 0) return "No participó lo suficiente para ser evaluado.";
    
    let base = "Obtuvo una calificación de " + s.rating.toFixed(1) + ".";
    let positives = [];
    let negatives = [];

    // Goals & Assists (Huge Impact)
    if (s.goals > 0) positives.push(`Sumó muchos puntos gracias a ${s.goals > 1 ? 'sus goles' : 'su gol'}`);
    if (s.assists > 0) positives.push(`Fue premiado por su asistencia${s.assists > 1 ? 's' : ''}`);

    // GK Specifics
    if (pos === Position.GK) {
        if (s.saves > 3) positives.push(`Sumó valor por sus ${s.saves} atajadas`);
        if (s.conceded > 0) negatives.push(`Fue penalizado severamente por recibir ${s.conceded} gol${s.conceded > 1 ? 'es' : ''}`);
    }

    // Defensive Actions
    if (s.tacklesCompleted > 4) positives.push(`Destacó por sus ${s.tacklesCompleted} entradas exitosas`);
    if (s.interceptions > 5) positives.push(`Sumó por sus ${s.interceptions} intercepciones`);

    // Technical
    if (s.keyPasses > 2) positives.push(`Generó peligro con ${s.keyPasses} pases clave`);
    if (s.dribblesCompleted > 3) positives.push(`Desequilibró con ${s.dribblesCompleted} regates`);

    // Negatives
    if (s.card === 'RED') negatives.push("Su expulsión destrozó su calificación");
    else if (s.card === 'YELLOW') negatives.push("Restó puntos por la tarjeta amarilla");
    
    if (s.foulsCommitted > 3) negatives.push("Perdió puntos por reiteración de faltas");
    
    // Construct sentence
    let explanation = base + " ";
    
    if (positives.length > 0) {
        explanation += positives.join(" y ") + ". ";
    }
    
    if (negatives.length > 0) {
        if (positives.length > 0) explanation += "Sin embargo, ";
        explanation += negatives.join(" y ") + ".";
    } else if (positives.length === 0) {
        if (s.rating < 6.0) explanation += "Tuvo poca participación positiva en el juego.";
        else explanation += "Cumplió con una actuación regular sin incidencias mayores.";
    }

    return explanation;
};

interface PlayerRowProps {
    p: Player;
    idx: number;
    isSub: boolean;
    s: PlayerMatchStats | undefined;
    onClick: () => void;
}

const PlayerRow: React.FC<PlayerRowProps> = ({ p, idx, isSub, s, onClick }) => {
    const rowBg = idx % 2 === 0 ? 'bg-white' : 'bg-[#f4f7f4]';
    // CRITICAL: A player is considered active only if they have recorded minutes or scored a goal (just in case)
    const hasPlayed = s && s.minutesPlayed > 0.1;
    const isFaded = isSub && !hasPlayed;

    return (
        <tr 
            className={`${rowBg} hover:bg-[#ccd9cc] transition-colors border-b border-[#d0d8d0] cursor-pointer ${isFaded ? 'opacity-50' : ''}`}
            onClick={onClick}
        >
            <td className={`px-1 py-1 text-center font-mono text-[9px] border-r border-[#a0b0a0]/30 sticky left-0 z-10 ${rowBg} ${isFaded ? 'text-slate-400' : 'text-slate-700'}`}>
                {isSub ? idx + 12 : idx + 1}
            </td>
            <td className="px-1 py-1 text-center border-r border-[#a0b0a0]/30 w-4">
                {s?.card === 'YELLOW' && <div className="w-1.5 h-2.5 bg-yellow-400 border border-yellow-600 mx-auto rounded-[1px]"></div>}
                {s?.card === 'RED' && <div className="w-1.5 h-2.5 bg-red-600 border border-red-800 mx-auto rounded-[1px]"></div>}
            </td>
            <td className={`px-2 py-1 text-left truncate max-w-[140px] border-r border-[#a0b0a0]/30 sticky left-6 z-10 ${rowBg} shadow-[1px_0_2px_rgba(0,0,0,0.1)] ${isFaded ? 'text-slate-400 font-normal italic' : 'text-slate-900 font-bold'}`}>
                {p.name}
            </td>
            <td className="px-1 py-1 text-center border-r border-[#a0b0a0]/30 w-6">
                {p.injury && <PlusCircle size={10} className="text-red-600 mx-auto" />}
            </td>
            <td className={`px-1 py-1 text-center border-r border-[#a0b0a0]/30 ${isFaded ? 'text-slate-300' : (s?.assists && s.assists > 0 ? 'text-blue-800 font-bold' : 'text-slate-900')}`}>
                {hasPlayed ? (s?.assists || 0) : '-'}
            </td>
            <td className={`px-1 py-1 text-center border-r border-[#a0b0a0]/30 ${isFaded ? 'text-slate-300' : (s?.goals && s.goals > 0 ? 'text-black font-black' : 'text-slate-900')}`}>
                {hasPlayed ? (s?.goals || 0) : '-'}
            </td>
            <td className={`px-1 py-1 text-center border-r border-[#a0b0a0]/30 sticky right-0 z-10 ${rowBg} shadow-[-1px_0_2px_rgba(0,0,0,0.05)] ${isFaded ? 'text-slate-300' : getRatingColor(s?.rating ?? 6.0)}`}>
                {hasPlayed ? (s?.rating ?? 6.0).toFixed(1) : '-'}
            </td>
        </tr>
    );
};

interface MatchStatsTableProps {
    players: Player[]; 
    stats: Record<string, PlayerMatchStats>;
    club: Club;
}

export const MatchStatsTable: React.FC<MatchStatsTableProps> = ({ players, stats, club }) => {
    const [selectedStats, setSelectedStats] = useState<{ player: Player, stats: PlayerMatchStats } | null>(null);

    const starters = players
        .filter(p => p.isStarter && p.tacticalPosition !== undefined)
        .sort((a, b) => (a.tacticalPosition ?? 0) - (b.tacticalPosition ?? 0))
        .slice(0, 11);

    const bench = players
        .filter(p => !p.isStarter)
        .sort((a, b) => {
            const hasActivityA = stats[a.id] && stats[a.id].minutesPlayed > 0.1 ? 1 : 0;
            const hasActivityB = stats[b.id] && stats[b.id].minutesPlayed > 0.1 ? 1 : 0;
            return hasActivityB - hasActivityA || b.currentAbility - a.currentAbility;
        })
        .slice(0, 9);

    const BlueStatRow = ({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) => (
        <div className="flex justify-between items-center py-2 px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter" style={{ fontFamily: 'Verdana' }}>{label}</span>
            <span className={`text-[12px] font-black ${highlight ? 'text-blue-700' : 'text-blue-900'}`} style={{ fontFamily: 'Verdana' }}>{value}</span>
        </div>
    );

    const BasicStatRow = ({ label, value }: { label: string, value: string | number }) => (
        <div className="flex justify-between items-center border-b border-slate-100 py-2">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
            <span className="text-[12px] font-black text-blue-900">{value}</span>
        </div>
    );

    return (
        <div className="w-full bg-[#d4dcd4] border border-[#a0b0a0] rounded-sm shadow-sm select-none flex flex-col h-full overflow-hidden relative">
            
            {selectedStats && (
                <div className="absolute inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedStats(null)}>
                    <div className="bg-[#e8ece8] w-full max-sm rounded-sm border border-[#a0b0a0] shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="border-b border-[#a0b0a0] px-3 py-1.5 flex justify-between items-center bg-gradient-to-b from-[#cfd8cf] to-[#a3b4a3]">
                            <span className="text-[#1a1a1a] font-black text-[11px] uppercase tracking-tighter">ESTADÍSTICAS: {selectedStats.player.name.toUpperCase()}</span>
                            <button onClick={() => setSelectedStats(null)} className="text-slate-700 hover:text-black"><X size={16}/></button>
                        </div>

                        <div className="bg-white p-4 space-y-4">
                            {/* Top Header Grid */}
                            <div className="flex items-center gap-6 pb-4 border-b border-slate-100">
                                <div className="text-center">
                                    <div className="text-3xl font-black text-slate-900 leading-none">
                                        {selectedStats.stats.minutesPlayed > 0.1 ? selectedStats.stats.rating.toFixed(1) : '-'}
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">RATING</span>
                                </div>
                                <div className="flex-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ESTADO FÍSICO</div>
                                    <div className="w-full bg-slate-100 h-2 rounded-full border border-slate-200 overflow-hidden">
                                        <div className="h-full bg-blue-700" style={{ width: `${selectedStats.stats.condition}%` }}></div>
                                    </div>
                                    <div className="text-right text-[10px] font-black text-slate-900 mt-1">{Math.round(selectedStats.stats.condition)}%</div>
                                </div>
                            </div>

                            {/* Core Stats Grid 2x2 */}
                            <div className="grid grid-cols-2 gap-x-8">
                                <BasicStatRow label="GOLES" value={selectedStats.stats.goals} />
                                <BasicStatRow label="ASISTENCIAS" value={selectedStats.stats.assists} />
                                <BasicStatRow label="MINUTOS" value={Math.round(selectedStats.stats.minutesPlayed)} />
                                <BasicStatRow label="PASES CLAVE" value={selectedStats.stats.keyPasses} />
                            </div>

                            {/* Technical Details Grid */}
                            <div className="border border-blue-300 bg-blue-50/20 p-2 rounded-[1px] grid grid-cols-2 gap-x-4 divide-x divide-blue-200">
                                <div className="space-y-0.5">
                                    <BlueStatRow label="PASES" value={`${selectedStats.stats.passesCompleted}/${selectedStats.stats.passesAttempted}`} />
                                    <BlueStatRow label="ENTRADAS" value={`${selectedStats.stats.tacklesCompleted}/${selectedStats.stats.tacklesAttempted}`} />
                                    <BlueStatRow label="REGATES" value={selectedStats.stats.dribblesCompleted} />
                                    <BlueStatRow label="FALTAS REC." value={selectedStats.stats.foulsReceived} />
                                </div>
                                <div className="space-y-0.5 pl-4">
                                    <BlueStatRow label="REMATES" value={`${selectedStats.stats.shotsOnTarget}/${selectedStats.stats.shots}`} />
                                    <BlueStatRow label="INTERCEPCIONES" value={selectedStats.stats.interceptions} />
                                    <BlueStatRow label="FALTAS COM." value={selectedStats.stats.foulsCommitted} />
                                    <BlueStatRow label="FUERA DE JUEGO" value={selectedStats.stats.offsides} />
                                </div>
                            </div>

                            {/* Analyst Comment */}
                            <div className="bg-[#f0f4f0] border border-[#a0b0a0] rounded-sm p-4 relative">
                                <div className="flex items-center gap-2 mb-3 text-blue-800">
                                    <BrainCircuit size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">COMENTARIO DEL ANALISTA</span>
                                </div>
                                <p className="text-[13px] leading-relaxed font-bold italic text-slate-700" style={{ fontFamily: 'Georgia, serif' }}>
                                    "{generateRatingExplanation(selectedStats.stats, selectedStats.player.positions[0])}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-auto flex-1 custom-scroll">
                <table className="w-full min-w-max text-[10px] border-collapse" style={{ fontFamily: 'Verdana, sans-serif' }}>
                    <thead className="sticky top-0 z-20">
                        <tr className="bg-[#bcc8bc] border-b border-[#a0b0a0]">
                            <th colSpan={4} className="py-1 px-2 text-left font-black uppercase text-slate-600 tracking-wider border-r border-[#a0b0a0]/50 h-5 sticky left-0 z-30 bg-[#bcc8bc]">Información</th>
                            <th colSpan={3} className="py-1 text-center font-black uppercase text-slate-600 tracking-wider sticky right-0 z-30 bg-[#bcc8bc]">Rendimiento</th>
                        </tr>
                        <tr className="border-b border-[#8c9c8c] text-[#1a1a1a] h-6 bg-[#dbe6db]">
                            <th className="w-6 py-1 text-center font-bold border-r border-[#a0b0a0]/30 sticky left-0 z-30 bg-[#dbe6db]">Nº</th>
                            <th className="w-4 py-1 text-center font-bold border-r border-[#a0b0a0]/30">T</th>
                            <th className="py-1 px-2 text-left font-bold min-w-[120px] border-r border-[#a0b0a0]/30 sticky left-6 z-30 bg-[#dbe6db] shadow-[1px_0_2px_rgba(0,0,0,0.1)]">Nombre</th>
                            <th className="w-6 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Inf..</th>
                            <th className="w-10 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Asi</th>
                            <th className="w-10 py-1 text-center font-bold border-r border-[#a0b0a0]/30">Gls</th>
                            <th className="w-10 py-1 text-center font-bold border-r border-[#a0b0a0]/30 sticky right-0 z-30 bg-[#dbe6db] shadow-[-1px_0_2px_rgba(0,0,0,0.05)]">Pro</th>
                        </tr>
                    </thead>
                    <tbody>
                        {starters.map((p, idx) => (
                            <PlayerRow key={p.id} p={p} idx={idx} isSub={false} s={stats[p.id]} onClick={() => stats[p.id] && setSelectedStats({ player: p, stats: stats[p.id] })} />
                        ))}
                        {bench.map((p, idx) => (
                            <PlayerRow key={p.id} p={p} idx={idx} isSub={true} s={stats[p.id]} onClick={() => stats[p.id] && setSelectedStats({ player: p, stats: stats[p.id] })} />
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
