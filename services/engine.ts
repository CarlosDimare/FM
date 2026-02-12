
import { Player, Club, MatchEvent, PlayerMatchStats, TeamMatchStats, Zone, Position, TacticalReport, TacticSettings, TransitionPhase, MatchState, BallState } from '../types';
import { randomInt } from './utils';
import { world } from './worldManager';

export const SLOT_CONFIG: Record<number, { line: 'GK' | 'SW' | 'DEF' | 'DM' | 'MID' | 'AM' | 'ATT', side?: 'LEFT' | 'RIGHT' | 'CENTER', abbr: string }> = {
  0: { line: 'GK', side: 'CENTER', abbr: 'POR' },
  31: { line: 'SW', side: 'CENTER', abbr: 'LIB' },
  1: { line: 'DEF', side: 'LEFT', abbr: 'DFI' }, 2: { line: 'DEF', side: 'CENTER', abbr: 'DFC' }, 3: { line: 'DEF', side: 'CENTER', abbr: 'DFC' }, 4: { line: 'DEF', side: 'CENTER', abbr: 'DFC' }, 5: { line: 'DEF', side: 'RIGHT', abbr: 'DFD' },
  6: { line: 'DM', side: 'LEFT', abbr: 'CRI' }, 7: { line: 'DM', side: 'CENTER', abbr: 'MCD' }, 8: { line: 'DM', side: 'CENTER', abbr: 'MCD' }, 9: { line: 'DM', side: 'CENTER', abbr: 'MCD' }, 10: { line: 'DM', side: 'RIGHT', abbr: 'CRD' },
  11: { line: 'MID', side: 'LEFT', abbr: 'MI' }, 12: { line: 'MID', side: 'CENTER', abbr: 'MC' }, 13: { line: 'MID', side: 'CENTER', abbr: 'MC' }, 14: { line: 'MID', side: 'CENTER', abbr: 'MC' }, 15: { line: 'MID', side: 'RIGHT', abbr: 'MD' },
  16: { line: 'AM', side: 'LEFT', abbr: 'MPI' }, 17: { line: 'AM', side: 'CENTER', abbr: 'MPC' }, 18: { line: 'AM', side: 'RIGHT', abbr: 'MPD' }, 19: { line: 'AM', side: 'CENTER', abbr: 'MPC' }, 20: { line: 'AM', side: 'CENTER', abbr: 'MPC' },
  26: { line: 'ATT', side: 'CENTER', abbr: 'DLC' }, 27: { line: 'ATT', side: 'LEFT', abbr: 'EXT' }, 28: { line: 'ATT', side: 'RIGHT', abbr: 'EXT' }, 29: { line: 'ATT', side: 'CENTER', abbr: 'DLC' }, 30: { line: 'ATT', side: 'CENTER', abbr: 'DLC' },
};

const BASE_COORDS: Record<number, { x: number, y: number }> = {
    0: { x: 30, y: 500 }, 
    31: { x: 80, y: 500 }, 
    1: { x: 150, y: 150 }, 2: { x: 150, y: 350 }, 3: { x: 150, y: 500 }, 4: { x: 150, y: 650 }, 5: { x: 150, y: 850 }, 
    6: { x: 300, y: 200 }, 7: { x: 300, y: 400 }, 8: { x: 300, y: 500 }, 9: { x: 300, y: 600 }, 10: { x: 300, y: 800 }, 
    11: { x: 500, y: 100 }, 12: { x: 500, y: 400 }, 13: { x: 500, y: 500 }, 14: { x: 500, y: 600 }, 15: { x: 500, y: 900 }, 
    16: { x: 700, y: 150 }, 17: { x: 700, y: 500 }, 18: { x: 700, y: 850 }, 19: { x: 700, y: 400 }, 20: { x: 700, y: 600 }, 
    26: { x: 850, y: 500 }, 27: { x: 850, y: 200 }, 28: { x: 850, y: 800 }, 29: { x: 850, y: 400 }, 30: { x: 850, y: 600 }, 
};

export class ProfileNarrativeEngine {
  static getPersonalityLabel(player: Player): string {
    const { mental } = player.stats;
    if (mental.professionalism >= 18 && mental.determination >= 15) return "Modelo de Profesionalidad";
    if (mental.temperament <= 6) return "Volátil";
    if (mental.leadership >= 16) return "Líder Nato";
    return "Equilibrado";
  }

  static generateHeadline(player: Player): string {
    const avgRating = player.seasonStats.appearances > 0 ? player.seasonStats.totalRating / player.seasonStats.appearances : 0;
    if (avgRating > 7.5) return `En una forma espectacular.`;
    if (player.fitness < 70) return `Mostrando signos de fatiga acumulada.`;
    if (player.morale < 40) return `Parece distraído y poco comprometido.`;
    return `Centrado en su rendimiento diario.`;
  }
}

export class MatchSimulator {
  private static buildupPhase: Record<string, number> = {};
  private static gkStress: Record<string, number> = {}; 

  private static getZoneLabel(x: number, y: number, isHomePossession: boolean): string {
      const attX = isHomePossession ? x : 1000 - x;
      const attY = isHomePossession ? y : 1000 - y; 
      let zoneX = "";
      if (attX < 250) zoneX = "Defensa";
      else if (attX < 550) zoneX = "Campo Propio";
      else if (attX < 800) zoneX = "Medio Campo";
      else if (attX < 950) zoneX = "3/4 de Cancha";
      else zoneX = "Área Rival";
      let zoneY = "";
      if (attY < 150) zoneY = "Izq";
      else if (attY > 850) zoneY = "Der";
      else zoneY = "Centro";
      if (attX > 880 && attY > 250 && attY < 750) return "Área Chica/Penal";
      return `${zoneX} ${zoneY}`;
  }

  private static getPlayerLabel(p: Player): string {
      // FIX: Improved fallback to prevent all unknown players appearing as Goalkeepers (POR)
      const tacticalPos = p.tacticalPosition ?? -1;
      const abbr = tacticalPos >= 0 ? (SLOT_CONFIG[tacticalPos]?.abbr || 'JUG') : 'JUG';
      const shortName = p.name.split(' ').pop(); 
      return `(${abbr}) ${shortName}`;
  }

  private static getRandomPassVerb(zone: string, isForward: boolean): string {
      const forwardVerbs = ["filtra pase a", "habilita a", "busca en profundidad a", "lanza para", "conecta con"];
      const neutralVerbs = ["toca para", "combina con", "cede el balón a", "encuentra a", "juega con", "abre hacia"];
      const backwardVerbs = ["retrasa para", "asegura con", "descarga en", "vuelve a empezar con"];
      const pool = isForward ? forwardVerbs : (zone.includes("Defensa") ? backwardVerbs : neutralVerbs);
      return pool[randomInt(0, pool.length - 1)];
  }

  private static getPlayerCoords(p: Player, isHomeTeam: boolean, ballX: number): { x: number, y: number } {
      const base = BASE_COORDS[p.tacticalPosition || 0] || { x: 500, y: 500 };
      let x = base.x; let y = base.y;
      if (!isHomeTeam) { x = 1000 - x; y = 1000 - y; }
      const isGK = SLOT_CONFIG[p.tacticalPosition || 0]?.line === 'GK';
      if (isGK) {
          const gkShift = (ballX - (isHomeTeam ? 0 : 1000)) * 0.05; 
          x += gkShift;
      } else {
          const xOffset = (ballX - x) * 0.4;
          x += xOffset;
      }
      return { x, y };
  }

  private static getProximityWeight(p: Player, ballX: number, ballY: number, isHomeTeam: boolean): number {
      const coords = this.getPlayerCoords(p, isHomeTeam, ballX);
      const dist = Math.sqrt(Math.pow(coords.x - ballX, 2) + Math.pow(coords.y - ballY, 2));
      const isGK = SLOT_CONFIG[p.tacticalPosition || 0]?.line === 'GK';
      if (isGK) {
          const distToOwnGoal = Math.abs(coords.x - (isHomeTeam ? 0 : 1000));
          if (distToOwnGoal > 250) return 0.0001; 
          if (dist > 100) return 0.01;
      }
      if (dist < 50) return 1.0;
      if (dist < 150) return 0.8;
      if (dist < 300) return 0.3;
      return 0.001;
  }

  private static getPerformanceFactor(): number {
      return 0.7 + Math.random() * 0.6; // 0.7 to 1.3 - Slightly wider variance for upsets
  }

  static initMatchStats(players: Player[]): Record<string, PlayerMatchStats> {
    const stats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
      stats[p.id] = {
        rating: 6.0, goals: 0, assists: 0, condition: 100, minutesPlayed: 0,
        passesAttempted: 0, passesCompleted: 0, keyPasses: 0,
        shots: 0, shotsOnTarget: 0, dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0,
        tacklesAttempted: 0, tacklesCompleted: 0, keyTackles: 0,
        interceptions: 0, shotsBlocked: 0, headersAttempted: 0, headersWon: 0, keyHeaders: 0,
        saves: 0, conceded: 0, foulsCommitted: 0, foulsReceived: 0, participationPhrase: ""
      };
    });
    return stats;
  }

  static simulateStep(
    state: MatchState,
    homeTeam: Club, awayTeam: Club,
    homeEleven: Player[], awayEleven: Player[]
  ): { nextState: MatchState, slowMotion: boolean } {
    
    const newState: MatchState = { 
        ...state,
        homeStats: { ...state.homeStats },
        awayStats: { ...state.awayStats },
        playerStats: { ...state.playerStats },
        ballPosition: { ...state.ballPosition },
        events: [...state.events]
    };

    let timeConsumed = 0;
    let slowMotion = false;

    const activeHome = homeEleven.filter(p => p.isStarter && p.tacticalPosition !== undefined && (!p.suspension || p.suspension.matchesLeft === 0));
    const activeAway = awayEleven.filter(p => p.isStarter && p.tacticalPosition !== undefined && (!p.suspension || p.suspension.matchesLeft === 0));
    
    const activeOnPitch = [...activeHome, ...activeAway];
    const actor = activeOnPitch.find(p => p.id === newState.possessorId);
    const isHomeActor = actor ? actor.clubId === homeTeam.id : (newState.possessionTeamId === homeTeam.id);
    const attPlayers = isHomeActor ? activeHome : activeAway;
    const defPlayers = isHomeActor ? activeAway : activeHome;
    
    const ballX = newState.ballPosition.x;
    const ballY = newState.ballPosition.y;

    const distToGoal = isHomeActor ? (1000 - ballX) : (ballX - 0);
    const isBallInAttackingThird = distToGoal < 300;
    const currentZone = this.getZoneLabel(ballX, ballY, isHomeActor);

    if (!this.gkStress[homeTeam.id]) this.gkStress[homeTeam.id] = 0;
    if (!this.gkStress[awayTeam.id]) this.gkStress[awayTeam.id] = 0;
    this.gkStress[homeTeam.id] = Math.max(0, this.gkStress[homeTeam.id] - 0.05);
    this.gkStress[awayTeam.id] = Math.max(0, this.gkStress[awayTeam.id] - 0.05);

    if (newState.ballState === 'KICKOFF') {
        const teamId = (newState.homeScore + newState.awayScore === 0) ? (randomInt(0, 1) === 0 ? homeTeam.id : awayTeam.id) : (isHomeActor ? awayTeam.id : homeTeam.id);
        const activeTeam = teamId === homeTeam.id ? activeHome : activeAway;
        const kickOffActor = activeTeam.find(p => p.positions.includes(Position.ST)) || activeTeam[0];
        newState.possessionTeamId = teamId;
        newState.ballPosition = { x: 500, y: 500 };
        newState.ballState = 'IN_PLAY';
        newState.events.push({ minute: state.minute, second: state.second, type: 'KICKOFF', text: `[Centro] Inicio de juego. Mueve ${teamId === homeTeam.id ? homeTeam.name : awayTeam.name}.`, importance: 'MEDIUM', intensity: 2, teamId: teamId });
        const receiver = activeTeam.find(p => p.id !== kickOffActor.id && (p.positions.includes(Position.MC) || p.positions.includes(Position.DM)));
        if (receiver) { newState.possessorId = receiver.id; newState.events.push({ minute: state.minute, second: state.second + 2, type: 'PASS', text: `[Centro] ${this.getPlayerLabel(kickOffActor)} toca en corto para ${this.getPlayerLabel(receiver)}.`, teamId: teamId, importance: 'LOW', intensity: 1 }); }
        timeConsumed = 15; // Slow buildup
    } 
    else if (newState.ballState === 'OUT_OF_BOUNDS') {
        const isCorner = Math.random() < 0.15; 
        if (isCorner) {
            const taker = attPlayers.sort((a,b) => b.stats.technical.corners - a.stats.technical.corners)[0];
            const target = attPlayers.filter(p => p.id !== taker.id).sort((a,b) => (a.height) - (b.height))[0];
            const defender = defPlayers.sort((a,b) => (a.height) - (b.height))[0];
            const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
            const aerialWin = (target.height * Math.random()) > (defender.height * Math.random() * 1.15);
            if (aerialWin) {
                newState.playerStats[target.id] = { ...newState.playerStats[target.id], shots: (newState.playerStats[target.id].shots || 0) + 1 };
                const headerAccuracy = target.stats.technical.heading * this.getPerformanceFactor();
                const saveQuality = ((gk.stats.goalkeeping?.reflexes || 10) * this.getPerformanceFactor()) - this.gkStress[gk.clubId];
                if (headerAccuracy > saveQuality * 1.35 + 8) { this.scoreGoal(newState, target, gk, isHomeActor, "Córner", "Cabezazo tras tiro de esquina."); timeConsumed = 45; }
                else { 
                    newState.playerStats[gk.id].saves++; 
                    newState.playerStats[target.id].shotsOnTarget++; 
                    this.gkStress[gk.clubId] += 1.5; 
                    newState.events.push({ minute: state.minute, second: state.second, type: 'SAVE', text: `[Área] ${this.getPlayerLabel(gk)} detiene cabezazo de ${this.getPlayerLabel(target)} tras córner.`, teamId: gk.clubId, importance: 'MEDIUM', intensity: 3 }); 
                    newState.possessorId = gk.id; timeConsumed = 25; 
                }
            } else {
                newState.events.push({ minute: state.minute, second: state.second, type: 'CORNER', text: `[Área] Córner de ${this.getPlayerLabel(taker)} despejado por ${this.getPlayerLabel(defender)}.`, importance: 'LOW', intensity: 1 });
                newState.possessorId = defender.id; timeConsumed = 20;
            }
        } else {
            newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: "[Banda] Balón fuera. Saque de banda.", importance: 'LOW', intensity: 1 });
            newState.possessorId = null; timeConsumed = 22;
        }
        newState.ballState = 'IN_PLAY';
    }
    else if (newState.ballState === 'IN_PLAY') {
        if (!actor) {
            const winner = activeOnPitch.map(p => ({ player: p, score: (p.stats.mental.anticipation + p.stats.physical.acceleration) * Math.random() * this.getProximityWeight(p, ballX, ballY, p.clubId === homeTeam.id) })).sort((a,b) => b.score - a.score)[0].player;
            newState.possessorId = winner.id; newState.possessionTeamId = winner.clubId;
            newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `[${this.getZoneLabel(ballX, ballY, winner.clubId === homeTeam.id)}] ${this.getPlayerLabel(winner)} recupera el balón suelto.`, teamId: winner.clubId, importance: 'LOW', intensity: 1 });
            timeConsumed = randomInt(8, 16);
        } else {
            const nearbyDef = defPlayers.map(p => ({ player: p, dist: Math.sqrt(Math.pow(this.getPlayerCoords(p, !isHomeActor, ballX).x - ballX, 2) + Math.pow(this.getPlayerCoords(p, !isHomeActor, ballX).y - ballY, 2)) })).sort((a,b) => a.dist - b.dist)[0];
            const slotData = SLOT_CONFIG[actor.tacticalPosition || 0];
            const line = slotData?.line || 'MID';

            let action: 'CROSS' | 'SHOOT' | 'DRIBBLE' | 'PASS' | 'CLEAR' = 'PASS';

            // DECISION LOGIC
            if (isBallInAttackingThird && line !== 'GK') {
                const finishingFactor = actor.stats.technical.finishing / 100;
                if (distToGoal < 240 && Math.random() < (0.12 + finishingFactor)) action = 'SHOOT';
                else if (Math.random() < 0.25) action = 'DRIBBLE';
            } 
            // Underdog "Desperate Clear" to avoid infinite pressure
            else if (distToGoal > 750 && Math.random() < 0.45) {
                action = 'CLEAR';
            }
            // Occasional long shot for underdogs when they have space
            else if (distToGoal < 400 && distToGoal > 250 && Math.random() < 0.05) {
                action = 'SHOOT';
            }

            if (action === 'SHOOT') {
                const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
                const blockChance = (nearbyDef.dist < 60) ? (nearbyDef.player.stats.mental.positioning + nearbyDef.player.stats.physical.agility) * 0.025 : 0;
                
                newState.playerStats[actor.id] = { ...newState.playerStats[actor.id], shots: (newState.playerStats[actor.id].shots || 0) + 1 };

                if (Math.random() < blockChance) {
                    newState.playerStats[nearbyDef.player.id].shotsBlocked++;
                    newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `[Área] ${this.getPlayerLabel(nearbyDef.player)} bloquea el disparo de ${this.getPlayerLabel(actor)}.`, teamId: nearbyDef.player.clubId, importance: 'MEDIUM', intensity: 3 });
                    newState.possessorId = nearbyDef.player.id; timeConsumed = 18;
                } else {
                    const accuracyRoll = actor.stats.technical.finishing * this.getPerformanceFactor();
                    if (accuracyRoll < 12) {
                        newState.events.push({ minute: state.minute, second: state.second, type: 'MISS', text: `[Área] Disparo desviado de ${this.getPlayerLabel(actor)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                        newState.ballState = 'OUT_OF_BOUNDS'; newState.possessorId = null; timeConsumed = 25;
                    } else {
                        const finish = (actor.stats.technical.finishing + actor.stats.mental.composure) * this.getPerformanceFactor();
                        const stressFactor = this.gkStress[gk.clubId];
                        const save = ((gk.stats.goalkeeping?.reflexes || 10) + (gk.stats.goalkeeping?.oneOnOnes || 10)) * this.getPerformanceFactor() - stressFactor;
                        
                        if (finish > save * 1.30 + 8) {
                            this.scoreGoal(newState, actor, gk, isHomeActor, `Gol`, "Definición certera."); timeConsumed = 50;
                        } else {
                            newState.playerStats[gk.id].saves++;
                            newState.playerStats[actor.id].shotsOnTarget++;
                            this.gkStress[gk.clubId] += 1.0; 
                            newState.events.push({ minute: state.minute, second: state.second, type: 'SAVE', text: `[Área] ${this.getPlayerLabel(gk)} contiene remate de ${this.getPlayerLabel(actor)}.`, teamId: gk.clubId, importance: 'HIGH', intensity: 3 });
                            newState.possessorId = gk.id; timeConsumed = 30;
                        }
                    }
                }
            }
            else if (action === 'DRIBBLE') {
                if (actor.stats.technical.dribbling * this.getPerformanceFactor() > nearbyDef.player.stats.technical.tackling * this.getPerformanceFactor() * 1.4) {
                    newState.playerStats[actor.id].dribblesCompleted++;
                    this.moveBall(newState, isHomeActor, 120, 50);
                    newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `[${currentZone}] ${this.getPlayerLabel(actor)} regatea a ${this.getPlayerLabel(nearbyDef.player)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                    timeConsumed = 18;
                } else {
                    newState.possessorId = nearbyDef.player.id;
                    newState.events.push({ minute: state.minute, second: state.second, type: 'TACKLE', text: `[${currentZone}] ${this.getPlayerLabel(nearbyDef.player)} quita el balón a ${this.getPlayerLabel(actor)}.`, teamId: nearbyDef.player.clubId, importance: 'LOW', intensity: 1 });
                    timeConsumed = 15;
                }
            }
            else if (action === 'CLEAR') {
                const clearDist = randomInt(400, 750);
                this.moveBall(newState, isHomeActor, clearDist, randomInt(-150, 150));
                newState.events.push({ minute: state.minute, second: state.second, type: 'WHISTLE', text: `[${currentZone}] ${this.getPlayerLabel(actor)} despeja con fuerza para aliviar la presión.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                newState.possessorId = null; // Ball becomes loose
                timeConsumed = 20;
            }
            else { // PASS
                const possibleReceivers = attPlayers.filter(p => p.id !== actor.id);
                // FIX: Better receiver selection logic to avoid self-passing loops
                const receiver = possibleReceivers.length > 0 
                    ? [...possibleReceivers].sort((a,b) => Math.abs(200 - Math.sqrt(Math.pow(this.getPlayerCoords(a, isHomeActor, ballX).x - ballX, 2))) - Math.abs(200 - Math.sqrt(Math.pow(this.getPlayerCoords(b, isHomeActor, ballX).x - ballX, 2)))).slice(0, 3)[randomInt(0, Math.min(2, possibleReceivers.length-1))]
                    : null;

                if (!receiver) {
                    // Force a clearance if no one is around
                    this.moveBall(newState, isHomeActor, 500, 0);
                    newState.possessorId = null;
                    timeConsumed = 15;
                    return { nextState: newState, slowMotion };
                }

                const passQual = (actor.stats.technical.passing + actor.stats.mental.vision) * this.getPerformanceFactor();
                
                // Dominance Fatigue: Teams with high possession are more likely to misplace long pases
                const possessionFatigue = (isHomeActor ? newState.homeStats.possession : newState.awayStats.possession) > 65 ? 5 : 0;

                if (passQual > (26 + possessionFatigue)) { 
                    newState.playerStats[actor.id].passesCompleted++;
                    newState.possessorId = receiver.id;
                    this.moveBall(newState, isHomeActor, 90, randomInt(-60, 60));
                    newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `[${currentZone}] ${this.getPlayerLabel(actor)} ${this.getRandomPassVerb(currentZone, true)} ${this.getPlayerLabel(receiver)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                    timeConsumed = randomInt(15, 25); 
                } else {
                    newState.playerStats[actor.id].passesAttempted++;
                    const interceptor = defPlayers[randomInt(0, defPlayers.length-1)];
                    newState.possessorId = interceptor.id; newState.possessionTeamId = interceptor.clubId;
                    newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `[${currentZone}] ${this.getPlayerLabel(interceptor)} corta el pase de ${this.getPlayerLabel(actor)}.`, teamId: interceptor.clubId, importance: 'LOW', intensity: 1 });
                    timeConsumed = 18;
                }
            }
        }
    }

    // ACCUMULATION LOGIC
    newState.homeStats.shots = 0;
    newState.homeStats.shotsOnTarget = 0;
    newState.homeStats.fouls = 0;
    newState.awayStats.shots = 0;
    newState.awayStats.shotsOnTarget = 0;
    newState.awayStats.fouls = 0;

    [...homeEleven, ...awayEleven].forEach(p => {
        const s = newState.playerStats[p.id];
        if (s) {
            if (p.clubId === homeTeam.id) {
                newState.homeStats.shots += (s.shots || 0);
                newState.homeStats.shotsOnTarget += (s.shotsOnTarget || 0);
                newState.homeStats.fouls += (s.foulsCommitted || 0);
            } else {
                newState.awayStats.shots += (s.shots || 0);
                newState.awayStats.shotsOnTarget += (s.shotsOnTarget || 0);
                newState.awayStats.fouls += (s.foulsCommitted || 0);
            }
        }
    });

    activeOnPitch.forEach(p => {
        const stats = newState.playerStats[p.id];
        if (stats && timeConsumed > 0) {
            stats.minutesPlayed += (timeConsumed / 60);
            stats.condition = Math.max(1, stats.condition - (timeConsumed * 0.005)); 
            this.updateRating(p, stats);
        }
    });

    if (newState.possessionTeamId) {
        if (newState.possessionTeamId === homeTeam.id) newState.homeStats.possessionTime += timeConsumed;
        else newState.awayStats.possessionTime += timeConsumed;
        const total = newState.homeStats.possessionTime + newState.awayStats.possessionTime;
        if (total > 0) { newState.homeStats.possession = Math.round((newState.homeStats.possessionTime / total) * 100); newState.awayStats.possession = 100 - newState.homeStats.possession; }
    }

    newState.second += timeConsumed;
    while (newState.second >= 60) { newState.second -= 60; newState.minute += 1; }

    if (newState.minute >= 45 && !newState.halftimeTriggered) { newState.isPlaying = false; newState.halftimeTriggered = true; newState.ballState = 'KICKOFF'; newState.events.push({ minute: 45, second: 0, type: 'WHISTLE', text: "DESCANSO", importance: 'MEDIUM', intensity: 2 }); }
    if (newState.minute >= 90) { newState.isPlaying = false; newState.ballState = 'FINISHED'; newState.events.push({ minute: 90, second: 0, type: 'WHISTLE', text: "FINAL DEL PARTIDO", importance: 'HIGH', intensity: 5 }); }

    return { nextState: newState, slowMotion };
  }

  private static scoreGoal(state: MatchState, scorer: Player, gk: Player, isHome: boolean, title: string, desc: string) {
      state.playerStats[scorer.id] = { 
          ...state.playerStats[scorer.id], 
          goals: (state.playerStats[scorer.id].goals || 0) + 1,
          shotsOnTarget: (state.playerStats[scorer.id].shotsOnTarget || 0) + 1,
          shots: (state.playerStats[scorer.id].shots || 0) + 1
      };
      state.playerStats[gk.id].conceded++;
      if (isHome) state.homeScore++; else state.awayScore++;
      state.events.push({ minute: state.minute, second: state.second, type: 'GOAL', text: `GOL de ${this.getPlayerLabel(scorer)}. ${desc}`, teamId: scorer.clubId, playerId: scorer.id, importance: 'HIGH', intensity: 5 });
      state.ballState = 'KICKOFF';
      state.possessorId = null;
      this.gkStress[gk.clubId] = 0; 
  }

  private static moveBall(state: MatchState, isHome: boolean, dx: number, dy: number) {
      const dir = isHome ? 1 : -1;
      state.ballPosition.x = Math.max(5, Math.min(995, state.ballPosition.x + (dx * dir) + randomInt(-25, 25)));
      state.ballPosition.y = Math.max(5, Math.min(995, state.ballPosition.y + randomInt(-dy, dy)));
  }

  private static updateRating(p: Player, s: PlayerMatchStats) {
      if (s.minutesPlayed < 10) { s.rating = 6.0; return; }
      let score = 6.0;
      score += (s.goals || 0) * 1.5; score += (s.assists || 0) * 0.9; score += (s.saves || 0) * 0.5; score -= (s.conceded || 0) * 0.7;
      score += (s.tacklesCompleted || 0) * 0.2; score += (s.interceptions || 0) * 0.15;
      s.rating = Math.max(1, Math.min(10, score));
  }

  static simulateQuickMatch(homeId: string, awayId: string, squadType: string): { homeScore: number, awayScore: number, stats: Record<string, PlayerMatchStats> } {
      const hS = world.getPlayersByClub(homeId).filter(p => p.squad === squadType);
      const aS = world.getPlayersByClub(awayId).filter(p => p.squad === squadType);
      const hRep = world.getClub(homeId)?.reputation || 5000;
      const aRep = world.getClub(awayId)?.reputation || 5000;
      let hScore = 0, aScore = 0;
      const bias = (hRep - aRep) / 2500; 
      for(let i=0; i<6; i++) { if (Math.random() + (bias * 0.05) > 0.90) hScore++; if (Math.random() - (bias * 0.05) > 0.92) aScore++; }
      const stats = this.initMatchStats([...hS, ...aS]);
      return { homeScore: hScore, awayScore: aScore, stats };
  }

  static finalizeSeasonStats(hS: Player[], aS: Player[], mS: Record<string, PlayerMatchStats>, h: number, a: number, cId: string) {
      const proc = (ps: Player[], ga: number) => ps.forEach(p => {
          const s = mS[p.id]; if(!s || s.minutesPlayed <= 0.1) return;
          p.seasonStats.appearances++; p.seasonStats.goals += s.goals; p.seasonStats.assists += s.assists; p.seasonStats.conceded += ga; p.seasonStats.totalRating += s.rating;
          if(!p.statsByCompetition[cId]) p.statsByCompetition[cId] = { appearances:0, goals:0, assists:0, cleanSheets:0, conceded:0, totalRating:0 };
          const cs = p.statsByCompetition[cId]; cs.appearances++; cs.goals += s.goals; cs.assists += s.assists; cs.conceded += ga; cs.totalRating += s.rating;
      });
      proc(hS, a); proc(aS, h);
  }
}
