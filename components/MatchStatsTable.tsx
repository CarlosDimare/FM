
import React, { useState } from 'react';
import { Player, PlayerMatchStats, Club } from '../types';
import { PlusCircle, X, BrainCircuit, Info, Clock } from 'lucide-react';
import { FMBox } from './FMUI';

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

const generateRatingExplanation = (s: PlayerMatchStats): string => {
    if (s.minutesPlayed === 0) return "No participó lo suficiente para ser evaluado.";
    
    const comments: string[] = [];
    
    // Nivel general basado en rating
    if (s.rating >= 8.5) comments.push("Fue el director de orquesta absoluto del equipo.");
    else if (s.rating >= 7.8) comments.push("Tuvo una actuación determinante y de alto nivel.");
    else if (s.rating >= 7.0) comments.push("Cumplió con una labor sólida y constante durante los minutos que jugó.");
    else if (s.rating < 6.0) comments.push("Tuvo una tarde para el olvido, pesando muy poco en el desarrollo.");
    else comments.push("Tuvo una actuación discreta, alternando buenas intervenciones con momentos de ausencia.");

    // Goles y Asistencias
    if (s.goals > 0) comments.push(`Su mayor aporte fue el gol${s.goals > 1 ? 'es' : ''}, demostrando gran instinto asesino en el área.`);
    if (s.assists > 0) comments.push("Fue clave en la creación, logrando filtrar pases que terminaron en la red.");
    
    // Pases y Precisión
    const passAcc = s.passesAttempted > 0 ? (s.passesCompleted / s.passesAttempted) : 0;
    if (passAcc > 0.90 && s.passesAttempted > 10) comments.push("Estuvo impecable en la distribución, fallando muy pocos envíos.");
    else if (passAcc < 0.65 && s.passesAttempted > 8) comments.push("Se le vio muy impreciso en la entrega, regalando balones peligrosos en zonas críticas.");

    // Duelos y Defensa
    if (s.tacklesAttempted > 0) {
        const tackleAcc = s.tacklesCompleted / s.tacklesAttempted;
        if (tackleAcc >= 0.8) comments.push("Se impuso en la mayoría de sus duelos individuales, siendo un muro infranqueable.");
        else if (tackleAcc < 0.4) comments.push("Perdió gran parte de los duelos directos, siendo superado con relativa facilidad por los atacantes.");
    }
    
    if (s.headersAttempted > 0) {
        const headerAcc = s.headersWon / s.headersAttempted;
        if (headerAcc > 0.7) comments.push("Dominó el juego aéreo, ganando casi todas las divididas por arriba.");
    }

    // Puntería
    if (s.shots > 0) {
        const shotAcc = s.shotsOnTarget / s.shots;
        if (shotAcc === 1 && s.goals > 0) comments.push("Tuvo una efectividad envidiable frente al arco.");
        else if (shotAcc < 0.25) comments.push("Le faltó mucha puntería hoy, desperdiciando remates que debieron ir al arco.");
    }

    // Disciplina
    if (s.card === 'YELLOW') comments.push("La tarjeta amarilla recibida lo condicionó y le quitó agresividad en los minutos finales.");
    if (s.card === 'RED') comments.push("Su expulsión fue un golpe durísimo que dejó al equipo en inferioridad técnica y numérica.");

    return comments.join(' ');
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
    const hasPlayed = s && (s.minutesPlayed > 0 || s.goals > 0);
    const isFaded = isSub && !hasPlayed;

    return (
        <tr 
            className={`${rowBg} hover:bg-[#ccd9cc] transition-colors border-b border-[#d0d8d0] cursor-pointer`}
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
                {!isFaded ? (s?.assists || 0) : '-'}
            </td>
            <td className={`px-1 py-1 text-center border-r border-[#a0b0a0]/30 ${isFaded ? 'text-slate-300' : (s?.goals && s.goals > 0 ? 'text-black font-black' : 'text-slate-900')}`}>
                {(!isFaded && (s?.goals ?? 0) > 0) ? s?.goals : (!isFaded ? '0' : '-')}
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
            const hasActivityA = stats[a.id] && (stats[a.id].minutesPlayed > 0 || stats[a.id].goals > 0) ? 1 : 0;
            const hasActivityB = stats[b.id] && (stats[b.id].minutesPlayed > 0 || stats[b.id].goals > 0) ? 1 : 0;
            return hasActivityB - hasActivityA || b.currentAbility - a.currentAbility;
        })
        .slice(0, 9);

    const StatRow = ({ label, value, highlight = false }: { label: string, value: string | number, highlight?: boolean }) => (
        <div className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0">
            <span className="text-[10px] font-bold text-slate-500 uppercase">{label}</span>
            <span className={`text-xs font-black ${highlight ? 'text-blue-800' : 'text-slate-900'}`}>{value}</span>
        </div>
    );

    return (
        <div className="w-full bg-[#d4dcd4] border border-[#a0b0a0] rounded-sm shadow-sm select-none flex flex-col h-full overflow-hidden relative">
            
            {selectedStats && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedStats(null)}>
                    <FMBox className="w-full max-w-sm shadow-2xl border-2 border-slate-400" title={
                        <div className="flex justify-between items-center w-full">
                            <span>Estadísticas: {selectedStats.player.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); setSelectedStats(null); }} className="text-slate-700 hover:text-black"><X size={16}/></button>
                        </div>
                    } noPadding>
                        <div className="flex flex-col bg-white overflow-hidden max-h-[85vh]" onClick={e => e.stopPropagation()}>
                            <div className="p-4 overflow-y-auto custom-scroll">
                                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200">
                                    <div className="text-center min-w-[60px]">
                                        {selectedStats.stats.minutesPlayed > 0 ? (
                                            <>
                                                <div className={`text-2xl font-black ${getRatingColor(selectedStats.stats.rating)}`}>
                                                    {selectedStats.stats.rating.toFixed(1)}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Rating</span>
                                            </>
                                        ) : (
                                            <div className="text-lg font-black text-slate-400 italic">S/C</div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Estado Físico</div>
                                        <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                            <div className={`h-full ${getConditionColor(selectedStats.stats.condition).split(' ')[0].replace('text-', 'bg-')}`} style={{ width: `${selectedStats.stats.condition}%` }}></div>
                                        </div>
                                        <div className="text-right text-[10px] font-black mt-0.5">{Math.round(selectedStats.stats.condition)}%</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-x-6 gap-y-2 mb-4">
                                    <StatRow label="Goles" value={selectedStats.stats.goals} highlight={selectedStats.stats.goals > 0} />
                                    <StatRow label="Asistencias" value={selectedStats.stats.assists} highlight={selectedStats.stats.assists > 0} />
                                    <StatRow label="Minutos" value={selectedStats.stats.minutesPlayed} />
                                    <StatRow label="Pases Clave" value={selectedStats.stats.keyPasses} />
                                    <StatRow label="Pases" value={`${selectedStats.stats.passesCompleted}/${selectedStats.stats.passesAttempted}`} />
                                    <StatRow label="Remates" value={`${selectedStats.stats.shotsOnTarget}/${selectedStats.stats.shots}`} />
                                    <StatRow label="Entradas" value={`${selectedStats.stats.tacklesCompleted}/${selectedStats.stats.tacklesAttempted}`} />
                                    <StatRow label="Intercepciones" value={selectedStats.stats.interceptions} />
                                    <StatRow label="Regates" value={selectedStats.stats.dribblesCompleted} />
                                    <StatRow label="Faltas Com." value={selectedStats.stats.foulsCommitted} />
                                    <StatRow label="Faltas Rec." value={selectedStats.stats.foulsReceived} />
                                    <StatRow label="Fuera de Juego" value={selectedStats.stats.offsides} />
                                </div>

                                {selectedStats.stats.minutesPlayed > 0 && (
                                    <div className="bg-[#f0f4f0] border border-[#a0b0a0] rounded-sm p-3 mt-2">
                                        <div className="flex items-center gap-2 mb-2 text-blue-800">
                                            <BrainCircuit size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Comentario del Analista</span>
                                        </div>
                                        <p className="text-[11px] leading-relaxed font-bold italic text-slate-800" style={{ fontFamily: 'Verdana, sans-serif' }}>
                                            "{generateRatingExplanation(selectedStats.stats)}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </FMBox>
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
