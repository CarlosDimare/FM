
import { Player, Club, MatchEvent, PlayerMatchStats, Zone, Position, TacticalReport, TacticSettings, TransitionPhase, MatchState, BallState } from '../types';
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
    if (mental.determination >= 17) return "Muy Determinado";
    return "Equilibrado";
  }

  static generateHeadline(player: Player): string {
    const { technical, mental, physical, goalkeeping } = player.stats;
    if (player.fitness < 60) return "Físicamente al límite, necesita descanso urgente.";
    if (player.morale < 35) return "Desmotivado y con la cabeza fuera del equipo.";
    if (goalkeeping) {
       if (goalkeeping.reflexes >= 16) return "Un seguro bajo palos con reflejos felinos.";
       if (goalkeeping.oneOnOnes >= 16) return "Especialista en salir triunfante de los mano a mano.";
       return "Portero solvente que aporta seguridad a la zaga.";
    }
    if (technical.finishing >= 16 && mental.composure >= 15) return "Un depredador del área que rara vez falla ante el gol.";
    if (physical.pace >= 17 || physical.acceleration >= 17) return "Un velocista capaz de castigar cualquier defensa adelantada.";
    if (technical.passing >= 16 && mental.vision >= 15) return "Un cerebro privilegiado capaz de ver huecos imposibles.";
    if (technical.technique >= 16 && mental.flair >= 16) return "Un virtuoso del balón que deleita con su calidad técnica.";
    if (technical.marking >= 16 && technical.tackling >= 16) return "Un baluarte defensivo prácticamente inexpugnable.";
    if (technical.heading >= 16 && physical.jumpingReach >= 16) return "Un coloso del aire dominante en ambas áreas.";
    if (mental.positioning >= 16 && mental.anticipation >= 16) return "Lee el juego de maravilla y siempre está en el lugar justo.";
    if (mental.determination >= 18 && mental.workRate >= 17) return "Un guerrero incansable que lucha cada balón como si fuera el último.";
    if (mental.leadership >= 17) return "El gran capitán que guía al grupo con autoridad y ejemplo.";
    if (player.currentAbility > 150) return "Un futbolista de clase mundial que marca diferencias.";
    if (player.currentAbility > 120) return "Un jugador de gran nivel plenamente consolidado.";
    return "Un profesional centrado en cumplir con su labor diaria.";
  }
}

export class MatchSimulator {
  private static buildupPhase: Record<string, number> = {};

  private static getEffectiveAttribute(p: Player, stats: Record<string, PlayerMatchStats>, category: 'mental' | 'technical' | 'physical', attr: string): number {
    const base = (p.stats as any)[category][attr] || 10;
    const condition = stats[p.id]?.condition || 100;
    const moraleMult = 0.95 + (p.morale / 1000); 
    const fatigueMult = 1 - ((100 - condition) / 100 * 0.2);
    return Math.max(1, base * moraleMult * fatigueMult);
  }

  private static calculatePressure(actor: Player, defPlayers: Player[], ballX: number, ballY: number, actorStats: Record<string, PlayerMatchStats>, isHomeActor: boolean): number {
    let totalPressure = 0;
    defPlayers.forEach(def => {
      const coords = this.getPlayerCoords(def, !isHomeActor, ballX); 
      const dist = Math.sqrt(Math.pow(coords.x - ballX, 2) + Math.pow(coords.y - ballY, 2));
      
      if (dist < 150) { // Radio de presión reducido de 200 a 150 para ser más realista
        const marking = this.getEffectiveAttribute(def, actorStats, 'technical', 'marking');
        const pos = this.getEffectiveAttribute(def, actorStats, 'mental', 'positioning');
        totalPressure += (marking * 0.5 + pos * 0.5) * (1 - dist / 150);
      }
    });
    return totalPressure / 5; 
  }

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

  private static getPlayerLabel(p: Player, club?: Club): string {
      const tacticalPos = p.tacticalPosition ?? -1;
      const abbr = tacticalPos >= 0 ? (SLOT_CONFIG[tacticalPos]?.abbr || 'JUG') : 'JUG';
      const shortName = p.name.split(' ').pop(); 
      const teamTag = club ? `${club.shortName} ` : "";
      return `${teamTag}(${abbr}) ${shortName}`;
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
          const xOffset = (ballX - x) * 0.45;
          x += xOffset;
      }
      return { x, y };
  }

  private static getProximityWeight(p: Player, ballX: number, ballY: number, isHomeTeam: boolean): number {
      const coords = this.getPlayerCoords(p, isHomeTeam, ballX);
      const dist = Math.sqrt(Math.pow(coords.x - ballX, 2) + Math.pow(coords.y - ballY, 2));
      if (dist < 40) return 1.2;
      if (dist < 100) return 1.0;
      if (dist < 250) return 0.6;
      return 0.01;
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

    const activeHome = homeEleven.filter(p => p.isStarter && p.tacticalPosition !== undefined);
    const activeAway = awayEleven.filter(p => p.isStarter && p.tacticalPosition !== undefined);
    
    const activeOnPitch = [...activeHome, ...activeAway];
    const actor = activeOnPitch.find(p => p.id === newState.possessorId);
    const isHomeActor = actor ? actor.clubId === homeTeam.id : (newState.possessionTeamId === homeTeam.id);
    const attPlayers = isHomeActor ? activeHome : activeAway;
    const defPlayers = isHomeActor ? activeAway : activeHome;
    const currentTeamStats = isHomeActor ? newState.homeStats : newState.awayStats;
    const actorClub = isHomeActor ? homeTeam : awayTeam;
    const defClub = isHomeActor ? awayTeam : homeTeam;
    
    const ballX = newState.ballPosition.x;
    const ballY = newState.ballPosition.y;

    const distToGoal = isHomeActor ? (1000 - ballX) : (ballX - 0);
    const isBallInAttackingThird = distToGoal < 300;
    const currentZone = this.getZoneLabel(ballX, ballY, isHomeActor);

    if (newState.ballState === 'KICKOFF') {
        const teamId = (newState.homeScore + newState.awayScore === 0) ? (randomInt(0, 1) === 0 ? homeTeam.id : awayTeam.id) : (isHomeActor ? awayTeam.id : homeTeam.id);
        newState.possessionTeamId = teamId;
        newState.ballPosition = { x: 500, y: 500 };
        newState.ballState = 'IN_PLAY';
        const kTeam = teamId === homeTeam.id ? homeTeam : awayTeam;
        newState.events.push({ minute: state.minute, second: state.second, type: 'KICKOFF', text: `Inicio de juego. Mueve ${kTeam.name}.`, importance: 'MEDIUM', intensity: 2 });
        timeConsumed = 8;
    } 
    else if (newState.ballState === 'OUT_OF_BOUNDS') {
        newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: "Reanudación del juego.", importance: 'LOW', intensity: 1 });
        newState.ballState = 'IN_PLAY';
        const validReceivers = attPlayers.filter(p => SLOT_CONFIG[p.tacticalPosition || 0]?.line !== 'GK');
        const target = validReceivers[randomInt(0, validReceivers.length-1)];
        newState.possessorId = target.id;
        timeConsumed = 20;
    }
    else if (newState.ballState === 'IN_PLAY') {
        if (!actor) {
            const winner = activeOnPitch.map(p => ({ 
                player: p, 
                score: (this.getEffectiveAttribute(p, newState.playerStats, 'mental', 'anticipation') + 
                        this.getEffectiveAttribute(p, newState.playerStats, 'physical', 'acceleration') * 0.5) * 
                        (0.6 + Math.random()) * this.getProximityWeight(p, ballX, ballY, p.clubId === homeTeam.id) 
            })).sort((a,b) => b.score - a.score)[0].player;
            
            newState.possessorId = winner.id; 
            newState.possessionTeamId = winner.clubId;
            timeConsumed = 10;
        } else {
            const decisions = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'decisions');
            const flair = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'flair');
            const actorRole = SLOT_CONFIG[actor.tacticalPosition || 0]?.line;
            const isActorGK = actorRole === 'GK';
            
            let action: 'SHOOT' | 'DRIBBLE' | 'PASS' | 'CLEAR' = 'PASS';
            const rollDecision = Math.random() * 20;

            if (isBallInAttackingThird && !isActorGK) {
                // Decisiones más inteligentes: solo dispara si está cerca o tiene mucho talento
                if (distToGoal < 180 && rollDecision < (decisions * 0.6)) action = 'SHOOT';
                else if (distToGoal < 280 && rollDecision < (flair * 0.4)) action = 'DRIBBLE';
            } else if (distToGoal > 800 && (rollDecision > 16 || isActorGK)) {
                action = 'CLEAR';
            }

            const pressure = this.calculatePressure(actor, defPlayers, ballX, ballY, newState.playerStats, isHomeActor);
            const composure = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'composure');
            // La serenidad ahora mitiga mucho mejor la presión
            const pressurePenalty = Math.max(0, (pressure - (composure * 0.8)) / 4); 

            const nearbyDefData = defPlayers.map(p => ({ 
                player: p, 
                dist: Math.sqrt(Math.pow(this.getPlayerCoords(p, !isHomeActor, ballX).x - ballX, 2) + Math.pow(this.getPlayerCoords(p, !isHomeActor, ballX).y - ballY, 2)) 
            })).sort((a,b) => a.dist - b.dist)[0];
            const nearbyDef = nearbyDefData.player;

            if (action === 'SHOOT') {
                slowMotion = true;
                const finishing = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'finishing');
                const technique = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'technique');
                
                // Calidad de remate mejorada
                const shootingQuality = (finishing * 0.7 + technique * 0.3) - (pressurePenalty * 2.2) + (Math.random() * 8 - 4);
                
                const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
                const reflexes = this.getEffectiveAttribute(gk, newState.playerStats, 'goalkeeping' as any, 'reflexes');
                const positionGk = this.getEffectiveAttribute(gk, newState.playerStats, 'mental', 'positioning');
                const saveQuality = (reflexes * 0.8 + positionGk * 0.2) * (0.9 + Math.random() * 0.4);

                newState.playerStats[actor.id].shots++;
                currentTeamStats.shots++; 

                // Umbral de gol bajado drásticamente de 8.5 a 4.2 para permitir más goles
                if (shootingQuality > saveQuality + 4.2) {
                    currentTeamStats.shotsOnTarget++;
                    const goalTexts = ["Remate inapelable.", "Ajustado al palo.", "Fusiló al portero.", "Cabezazo magistral.", "Definición de crack.", "No pudo hacer nada el arquero."];
                    this.scoreGoal(newState, actor, gk, isHomeActor, "Gol", goalTexts[randomInt(0, goalTexts.length-1)], actorClub);
                } else if (shootingQuality > saveQuality - 1) {
                    currentTeamStats.shotsOnTarget++;
                    newState.playerStats[gk.id].saves++;
                    newState.events.push({ minute: state.minute, second: state.second, type: 'SAVE', text: `${this.getPlayerLabel(gk, defClub)} evita el tanto de ${this.getPlayerLabel(actor, actorClub)}.`, teamId: gk.clubId, importance: 'HIGH', intensity: 4 });
                    newState.possessorId = gk.id;
                } else {
                    const missTexts = ["Disparo desviado", "Se le fue a las nubes", "Remate fuera", "Impactó en el lateral de la red"];
                    newState.events.push({ minute: state.minute, second: state.second, type: 'MISS', text: `${missTexts[randomInt(0, missTexts.length-1)]} de ${this.getPlayerLabel(actor, actorClub)}.`, teamId: actor.clubId, importance: 'MEDIUM', intensity: 2 });
                    newState.ballState = 'OUT_OF_BOUNDS'; newState.possessorId = null;
                }
                timeConsumed = 30;
            } 
            else if (action === 'DRIBBLE') {
                const dribbling = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'dribbling');
                const technique = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'technique');
                const tackling = this.getEffectiveAttribute(nearbyDef, newState.playerStats, 'technical', 'tackling');
                
                const dribbleDifficulty = (isBallInAttackingThird ? 1.3 : 1.0) + (pressure / 25);

                if ((dribbling * 0.5 + technique * 0.5) - (pressurePenalty * 1.5) > (tackling * dribbleDifficulty)) {
                    newState.playerStats[actor.id].dribblesCompleted++;
                    this.moveBall(newState, isHomeActor, 120, 40);
                    newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `${this.getPlayerLabel(actor, actorClub)} supera la marca de ${this.getPlayerLabel(nearbyDef, defClub)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 2 });
                } else {
                    newState.possessorId = nearbyDef.id;
                    newState.playerStats[nearbyDef.id].tacklesCompleted++;
                    newState.events.push({ minute: state.minute, second: state.second, type: 'TACKLE', text: `${this.getPlayerLabel(nearbyDef, defClub)} le quita el balón a ${this.getPlayerLabel(actor, actorClub)}.`, teamId: nearbyDef.clubId, importance: 'MEDIUM', intensity: 3 });
                }
                timeConsumed = 15;
            }
            else if (action === 'CLEAR') {
                this.moveBall(newState, isHomeActor, 400, 180);
                const clearMsgs = ["revienta el balón", "despeja el peligro", "aleja la pelota", "manda el balón arriba"];
                newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `${this.getPlayerLabel(actor, actorClub)} ${clearMsgs[randomInt(0,3)]}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                newState.possessorId = null;
                timeConsumed = 12;
            }
            else { 
                const passing = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'passing');
                const vision = this.getEffectiveAttribute(actor, newState.playerStats, 'mental', 'vision');
                const firstTouch = this.getEffectiveAttribute(actor, newState.playerStats, 'technical', 'firstTouch');
                
                if (firstTouch < 10 && Math.random() < 0.1) {
                    const failMsgs = ["Mal control", "Control defectuoso", "El balón se le escapa"];
                    newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `${failMsgs[randomInt(0,2)]} de ${this.getPlayerLabel(actor, actorClub)}. Pierde la posesión.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                    newState.possessorId = nearbyDef.id;
                } else {
                    const passQuality = (passing * 0.7 + vision * 0.3) - (pressurePenalty * 1.2);
                    let possibleReceivers = attPlayers.filter(p => p.id !== actor.id);
                    
                    const target = possibleReceivers[randomInt(0, possibleReceivers.length-1)];
                    const passBaseDifficulty = (isBallInAttackingThird ? 11 : 6) + Math.random() * 5; 
                    
                    if (passQuality > passBaseDifficulty) {
                        newState.playerStats[actor.id].passesCompleted++;
                        newState.possessorId = target.id;
                        this.moveBall(newState, isHomeActor, 110, 45);
                        if (isBallInAttackingThird || Math.random() > 0.75) {
                             newState.events.push({ minute: state.minute, second: state.second, type: 'PASS', text: `${this.getPlayerLabel(actor, actorClub)} ${this.getRandomPassVerb(currentZone, isBallInAttackingThird)} ${this.getPlayerLabel(target, actorClub)}.`, teamId: actor.clubId, importance: 'LOW', intensity: 1 });
                        }
                    } else {
                        newState.playerStats[actor.id].passesAttempted++;
                        newState.possessorId = nearbyDef.id;
                        const interceptMsgs = ["interceptado por", "cortado por", "que regala a", "se queda corto ante"];
                        newState.events.push({ minute: state.minute, second: state.second, type: 'INTERCEPTION', text: `Pase impreciso de ${this.getPlayerLabel(actor, actorClub)} ${interceptMsgs[randomInt(0,3)]} ${this.getPlayerLabel(nearbyDef, defClub)}.`, teamId: nearbyDef.clubId, importance: 'LOW', intensity: 1 });
                    }
                }
                timeConsumed = 15;
            }
        }
    }

    activeOnPitch.forEach(p => {
        const stats = newState.playerStats[p.id];
        if (stats && timeConsumed > 0) {
            stats.minutesPlayed += (timeConsumed / 60);
            const stamina = p.stats.physical.stamina;
            const fatigueRate = 0.007 * (1.6 - stamina / 20);
            stats.condition = Math.max(1, stats.condition - (timeConsumed * fatigueRate)); 
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

  private static scoreGoal(state: MatchState, scorer: Player, gk: Player, isHome: boolean, title: string, desc: string, club: Club) {
      state.playerStats[scorer.id].goals++;
      state.playerStats[gk.id].conceded++;
      if (isHome) state.homeScore++; else state.awayScore++;
      state.events.push({ minute: state.minute, second: state.second, type: 'GOAL', text: `¡GOL de ${this.getPlayerLabel(scorer, club)}! ${desc}`, teamId: scorer.clubId, playerId: scorer.id, importance: 'HIGH', intensity: 5 });
      state.ballState = 'KICKOFF';
      state.possessorId = null;
  }

  private static moveBall(state: MatchState, isHome: boolean, dx: number, dy: number) {
      const dir = isHome ? 1 : -1;
      state.ballPosition.x = Math.max(5, Math.min(995, state.ballPosition.x + (dx * dir)));
      state.ballPosition.y = Math.max(5, Math.min(995, state.ballPosition.y + randomInt(-dy, dy)));
  }

  private static updateRating(p: Player, s: PlayerMatchStats) {
      if (s.minutesPlayed < 5) { s.rating = 6.0; return; }
      let score = 6.0;
      score += (s.goals || 0) * 1.6; score += (s.assists || 0) * 1.0; score += (s.saves || 0) * 0.5; score -= (s.conceded || 0) * 0.7;
      score += (s.tacklesCompleted || 0) * 0.2; score += (s.interceptions || 0) * 0.15;
      score -= (s.passesAttempted - s.passesCompleted) * 0.04;
      s.rating = Math.max(1, Math.min(10, score));
  }

  static simulateQuickMatch(homeId: string, awayId: string, squadType: string): { homeScore: number, awayScore: number, stats: Record<string, PlayerMatchStats> } {
      const hS = world.getPlayersByClub(homeId).filter(p => p.squad === squadType);
      const aS = world.getPlayersByClub(awayId).filter(p => p.squad === squadType);
      const hRep = world.getClub(homeId)?.reputation || 5000;
      const aRep = world.getClub(awayId)?.reputation || 5000;
      let hScore = 0, aScore = 0;
      const bias = (hRep - aRep) / 2500; 
      for(let i=0; i<3; i++) { 
        if (Math.random() + (bias * 0.05) > 0.93) hScore++; 
        if (Math.random() - (bias * 0.05) > 0.94) aScore++; 
      }
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
