
import { Player, MatchEvent, Position, MatchState, Club, PlayerMatchStats, TeamMatchStats } from "../types";
import { randomInt } from "./utils";
import { world } from "./worldManager";

const ZONES = {
   GK: [0],
   DEF: [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],
   MID: [16,17,18,19,20,21,22,23,24,25],
   ATT: [26,27,28,29,30]
};

type PitchZone = 'DEF' | 'MID' | 'ATT';

// Phrase Banks
const PHRASES = {
  POSSESSION_DEF: [
    (t: string, p: string) => `${t} toca en su propia línea defensiva para salir de la presión.`,
    (t: string, p: string) => `Balón tranquilo para los centrales de ${t}.`,
    (t: string, p: string) => `${p} despeja sin complicaciones ante la presión rival.`,
    (t: string, p: string) => `Juego trabado, ${t} intenta reorganizarse desde atrás.`,
    (t: string, p: string) => `${p} levanta la cabeza y busca opciones en largo desde la cueva.`,
    (t: string, p: string) => `Circulación lenta de ${t} en zona de seguridad.`
  ],
  POSSESSION_MID: [
    (t: string, p: string) => `${t} busca huecos en el mediocampo con paciencia.`,
    (t: string, p: string) => `Posesión larga para ${t}, moviendo el balón de lado a lado.`,
    (t: string, p: string) => `Duelo táctico en la medular, ${p} distribuye el juego con criterio.`,
    (t: string, p: string) => `${p} pide calma, pisa la pelota y retrasa el juego.`,
    (t: string, p: string) => `El balón pasa por los pies de ${p}, el metrónomo del equipo.`,
    (t: string, p: string) => `${t} intenta imponer su ritmo en la zona ancha.`
  ],
  ATTACK_3_4: [
    (t: string, p: string) => `${t} embotella al rival. ¡${p} encara por banda y busca el centro!`,
    (t: string, p: string) => `¡Presión asfixiante de ${t}! ${p} recupera en zona peligrosa...`,
    (t: string, p: string) => `${p} filtra un pase entre líneas que rompe la defensa... ¡Cuidado!`,
    (t: string, p: string) => `¡Qué maniobra de ${p}! Se quita a dos de encima y se acerca al área.`,
    (t: string, p: string) => `Contragolpe de manual de ${t}, ${p} conduce con espacios...`,
    (t: string, p: string) => `Triangulación perfecta de ${t} en la frontal, ${p} prepara el gatillo...`
  ],
  CHANCE_SAVE: [
    (t: string, p: string, gk: string) => `¡PARADÓN! ${gk} vuela para desviar el disparo de ${p} que buscaba la escuadra.`,
    (t: string, p: string, gk: string) => `${gk} reacciona a tiempo y atrapa en dos tiempos el remate de ${p}.`,
    (t: string, p: string, gk: string) => `¡Mano salvadora! ${gk} evita el tanto de ${p} con una estirada felina.`,
    (t: string, p: string, gk: string) => `Remate a quemarropa de ${p} que se estrella en el cuerpo de ${gk}. ¡Milagro!`,
    (t: string, p: string, gk: string) => `¡${gk} se hace gigante! Gana el mano a mano contra ${p}.`
  ],
  CHANCE_MISS: [
    (t: string, p: string) => `${p} lo intenta con un disparo potente que se marcha rozando el poste. ¡Uyyy!`,
    (t: string, p: string) => `${p} conecta un remate defectuoso que sale muy desviado. Ocasión desperdiciada.`,
    (t: string, p: string) => `¡Al larguero! El remate de ${p} hace temblar la portería rival.`,
    (t: string, p: string) => `Buena aproximación de ${t} pero ${p} no logra dirigir el balón entre los tres palos.`,
    (t: string, p: string) => `¡Increíble lo que ha fallado ${p}! Estaba solo y la mandó a las nubes.`
  ],
  GOAL_NORMAL: [
    (t: string, p: string) => `¡GOL! ${p} marca para el ${t} con una definición clínica.`,
    (t: string, p: string) => `¡GOOOOOL! ${p} encuentra la red y adelanta a su equipo.`,
    (t: string, p: string) => `¡GOL GOL GOL! Remate cruzado de ${p} imposible para el portero.`,
    (t: string, p: string) => `¡Llegó el tanto! ${p} aprovecha el balón suelto y no perdona.`,
    (t: string, p: string) => `¡El balón besa la red! ${p} firma el gol para ${t}.`
  ],
  GOAL_HEADER: [
    (t: string, p: string, a: string) => `¡GOL DE CABEZA! Centro medido de ${a} y testarazo inapelable de ${p}.`,
    (t: string, p: string, a: string) => `¡GOOOOL AÉREO! ${p} se suspende en el aire tras el pase de ${a} y martillea la red.`,
    (t: string, p: string, a: string) => `¡Cabezazo letal! ${p} gana a todos por arriba y marca a pase de ${a}.`
  ],
  GOAL_LONG: [
    (t: string, p: string) => `¡QUÉ GOLAZO ANTOLÓGICO! ${p} saca un misil tierra-aire desde 30 metros a la escuadra.`,
    (t: string, p: string) => `¡OBRA DE ARTE! Zapatazo de ${p} desde su casa que sorprende al portero. ¡GOLAZO!`,
    (t: string, p: string) => `¡GOLAZO DE MEDIA DISTANCIA! ${p} la puso donde duermen las arañas.`
  ]
};

export class MatchSimulator {
  private static momentum: number = 0;
  private static possessionCount: { home: number, away: number } = { home: 0, away: 0 };
  private static lastEventIntensity: number = 2;
  private static lastAttackingTeamId: string | null = null;

  static initMatchStats(players: Player[]): Record<string, PlayerMatchStats> {
    const stats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
      stats[p.id] = {
        rating: 6.0, goals: 0, assists: 0, passesAttempted: 0, passesCompleted: 0, dribblesAttempted: 0, dribblesCompleted: 0, tacklesAttempted: 0, tacklesCompleted: 0, foulsCommitted: 0, shotsOnTarget: 0, saves: 0, participationPhrase: "Buscando su lugar en el partido."
      };
    });
    this.momentum = 0;
    this.possessionCount = { home: 0, away: 0 };
    this.lastEventIntensity = 2;
    this.lastAttackingTeamId = null;
    return stats;
  }

  // Determine intensity based on zone
  private static getPlayerZoneIntensity(player: Player): 1 | 2 | 3 | 4 {
      const pos = player.positions[0];
      if (pos.includes('GK') || pos.includes('SW') || (pos.includes('DF') && !pos.includes('M'))) return 1;
      if (pos.includes('DM') || pos === Position.MC || pos === Position.MR || pos === Position.ML) return 2;
      if (pos.includes('AM')) return 3;
      if (pos.includes('ST') || pos.includes('DL')) return 4;
      return 2; // Fallback
  }

  static simulateMinute(
    minute: number, homeTeam: Club, awayTeam: Club, homeEleven: Player[], awayEleven: Player[], playerStats: Record<string, PlayerMatchStats>, currentDate?: Date
  ): { event: MatchEvent | null, teamStats: { home: TeamMatchStats, away: TeamMatchStats }, slowMotion: boolean } {
    
    // Momentum calculation
    const hMid = this.calculateZonePower(homeEleven, 'MID');
    const aMid = this.calculateZonePower(awayEleven, 'MID');
    this.momentum += (hMid - aMid) * 0.05;
    this.momentum = Math.max(-10, Math.min(10, this.momentum));
    
    const totalPower = (50 + (this.momentum * 2) + randomInt(-5, 5));
    const isHomePossession = Math.random() * 100 < totalPower;
    
    if (isHomePossession) this.possessionCount.home++; else this.possessionCount.away++;
    
    this.simulateHiddenActions(isHomePossession ? homeEleven : awayEleven, isHomePossession ? awayEleven : homeEleven, playerStats);
    
    let event: MatchEvent | null = null;
    let slowMotion = false;
    
    const attackingTeam = isHomePossession ? homeTeam : awayTeam;
    const defendingTeam = isHomePossession ? awayTeam : homeTeam;
    const attPlayers = isHomePossession ? homeEleven : awayEleven;
    const defPlayers = isHomePossession ? awayEleven : homeEleven;

    // 1. Cards/Injuries
    if (Math.random() < 0.008) {
       event = this.resolveDisciplinary(minute, defPlayers, defendingTeam);
    } else if (Math.random() < 0.004) {
       event = this.resolveInjury(minute, [...homeEleven, ...awayEleven], homeTeam, awayTeam, currentDate);
    }
    
    // 2. Attack Sequence
    if (!event && Math.random() < 0.16) { 
       event = this.resolveAttackSequence(minute, attackingTeam, attPlayers, defendingTeam, defPlayers, playerStats);
    }

    // 3. Possession
    if (!event && Math.random() < 0.25) {
       event = this.resolvePossession(minute, attackingTeam, attPlayers);
    }

    // Determine slow motion for next tick and update state
    if (event) {
       this.lastEventIntensity = event.intensity;
       // Only update attacking team if it's an attacking event
       if (event.type === 'CHANCE' || event.type === 'POSSESSION') {
          this.lastAttackingTeamId = event.teamId || null;
       } else if (event.type === 'GOAL') {
          this.lastAttackingTeamId = null; // Reset after goal
       }
       
       if (event.intensity >= 3) {
          slowMotion = true;
       }
    } else {
       // Degrade intensity slightly over time if nothing happens, but keep momentum state relevant
       if (this.lastEventIntensity > 1) this.lastEventIntensity -= 1;
    }

    const totalPoss = this.possessionCount.home + this.possessionCount.away;
    const teamStats = {
      home: this.compileTeamStats(homeTeam.id, playerStats, (this.possessionCount.home / (totalPoss || 1)) * 100),
      away: this.compileTeamStats(awayTeam.id, playerStats, (this.possessionCount.away / (totalPoss || 1)) * 100)
    };
    
    if (minute % 5 === 0 || (event && event.type === 'GOAL')) {
      [...homeEleven, ...awayEleven].forEach(p => {
        if (playerStats[p.id]) this.updatePlayerRating(p, playerStats[p.id]);
      });
    }
    return { event, teamStats, slowMotion };
  }

  private static resolvePossession(minute: number, team: Club, players: Player[]): MatchEvent {
     let phrases = PHRASES.POSSESSION_MID;
     const p = players[randomInt(0, players.length-1)];
     const intensity = this.getPlayerZoneIntensity(p);

     if (intensity === 1) phrases = PHRASES.POSSESSION_DEF;
     else if (intensity === 2) phrases = PHRASES.POSSESSION_MID;
     else phrases = PHRASES.ATTACK_3_4;

     const textFunc = phrases[randomInt(0, phrases.length-1)];
     return {
        minute,
        type: intensity >= 3 ? 'CHANCE' : 'POSSESSION',
        text: textFunc(team.name, p.name),
        teamId: team.id,
        importance: intensity >= 3 ? 'MEDIUM' : 'LOW',
        intensity: intensity as 1 | 2 | 3 | 4 | 5
     };
  }

  private static resolveDisciplinary(minute: number, players: Player[], team: Club): MatchEvent | null {
     if (players.length === 0) return null;
     const p = players[randomInt(0, players.length - 1)];
     const isRed = Math.random() < 0.12;
     const yTexts = [
       `Tarjeta amarilla para ${p.name} por una falta táctica.`,
       `${p.name} llega tarde y es amonestado.`,
       `Dura entrada de ${p.name}, el árbitro le muestra la amarilla.`,
       `Agarra de la camiseta al rival. Amarilla para ${p.name}.`,
       `${p.name} protesta airadamente y ve la tarjeta.`
     ];
     const rTexts = [
       `¡TARJETA ROJA! ${p.name} es expulsado tras una entrada criminal.`,
       `¡A la calle! ${p.name} agrede a un rival y deja a su equipo con diez.`,
       `Segunda amarilla para ${p.name}. ¡Expulsado!`,
       `El árbitro no lo duda: Roja directa para ${p.name}.`,
       `Entrada de último hombre de ${p.name}. Roja indiscutible.`
     ];
     return {
        minute,
        type: isRed ? 'RED_CARD' : 'YELLOW_CARD',
        teamId: team.id,
        playerId: p.id,
        text: isRed ? rTexts[randomInt(0, rTexts.length-1)] : yTexts[randomInt(0, yTexts.length-1)],
        importance: isRed ? 'HIGH' : 'MEDIUM',
        intensity: isRed ? 4 : 3
     };
  }

  private static resolveInjury(minute: number, players: Player[], h: Club, a: Club, currentDate?: Date): MatchEvent | null {
     if (players.length === 0) return null;
     const p = players[randomInt(0, players.length - 1)];
     const team = p.clubId === h.id ? h : a;
     
     const injuryTypes = ["esguince de tobillo", "rotura de fibras", "contusión fuerte", "problema en el muslo", "lesión de rodilla"];
     const days = randomInt(5, 45);
     const type = injuryTypes[randomInt(0, injuryTypes.length-1)];
     
     // Set injury in world state if it's user club (simulation only)
     p.injury = { type, daysLeft: days };
     
     if (currentDate) {
        world.addInboxMessage('SQUAD', `Informe Médico: ${p.name}`, `El jugador ha sufrido un ${type} durante el partido. El fisioterapeuta estima que estará de baja unos ${days} días.`, currentDate, p.id);
     }

     return { minute, type: 'INJURY', teamId: team.id, playerId: p.id, text: `¡Problemas físicos! ${p.name} se tira al suelo y pide el cambio inmediatamente por un ${type}.`, importance: 'MEDIUM', intensity: 2 };
  }

  private static resolveAttackSequence(minute: number, attTeam: Club, attPlayers: Player[], defTeam: Club, defPlayers: Player[], stats: Record<string, PlayerMatchStats>): MatchEvent | null {
     if (attPlayers.length === 0 || defPlayers.length === 0) return null;

     const attackType = randomInt(0, 5); 
     const creatorIdx = randomInt(0, attPlayers.length - 1);
     let finisherIdx = randomInt(0, attPlayers.length - 1);
     if (finisherIdx === creatorIdx && attPlayers.length > 1) finisherIdx = (creatorIdx + 1) % attPlayers.length;

     const creator = attPlayers[creatorIdx];
     const finisher = attPlayers[finisherIdx];
     const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
     
     if (!stats[finisher.id]) return null;

     const canScore = this.lastEventIntensity >= 3 && this.lastAttackingTeamId === attTeam.id;

     if (!canScore) {
        const phrases = PHRASES.ATTACK_3_4;
        const textFunc = phrases[randomInt(0, phrases.length-1)];
        this.momentum = this.momentum > 0 ? 9 : -9; 
        
        return {
           minute,
           type: 'CHANCE',
           text: textFunc(attTeam.name, creator.name),
           teamId: attTeam.id,
           playerId: creator.id,
           importance: 'MEDIUM',
           intensity: 3 
        };
     }

     if (attackType === 1) return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, 'CROSS');
     else if (attackType === 2) return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, 'LONG_SHOT');
     else if (attackType === 3) return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, 'THROUGH_BALL');
     else if (attackType === 4) return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, 'CORNER');
     else return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, 'NORMAL');
  }

  private static resolveShot(minute: number, team: Club, shooter: Player, gk: Player, assister: Player, stats: Record<string, PlayerMatchStats>, type: string): MatchEvent {
     let shotPower = shooter.stats.technical.finishing + shooter.stats.mental.composure;
     let savePower = (gk.stats.goalkeeping?.reflexes || 10) + (gk.stats.mental.positioning || 10);
     
     if (type === 'CROSS' || type === 'CORNER') {
        shotPower = shooter.stats.technical.heading + shooter.stats.physical.jumpingReach;
     } else if (type === 'LONG_SHOT') {
        shotPower = shooter.stats.technical.longShots + shooter.stats.physical.strength;
        savePower += 5; 
     }
     
     const rng = randomInt(-5, 10);
     const isTarget = shotPower + rng > savePower - 8;
     
     if (isTarget && stats[shooter.id]) stats[shooter.id].shotsOnTarget++;
     
     if (shotPower + rng > savePower) {
        if (stats[shooter.id]) stats[shooter.id].goals++;
        
        let goalText = "";
        const hasAssist = assister.id !== shooter.id && Math.random() < 0.75 && stats[assister.id];
        if (hasAssist) stats[assister.id].assists++;

        if (type === 'CROSS') {
           const phrases = PHRASES.GOAL_HEADER;
           goalText = phrases[randomInt(0, phrases.length-1)](team.name, shooter.name, assister.name);
        } else if (type === 'LONG_SHOT') {
           const phrases = PHRASES.GOAL_LONG;
           goalText = phrases[randomInt(0, phrases.length-1)](team.name, shooter.name);
        } else {
           const phrases = PHRASES.GOAL_NORMAL;
           goalText = phrases[randomInt(0, phrases.length-1)](team.name, shooter.name);
        }
        
        return { minute, type: 'GOAL', teamId: team.id, playerId: shooter.id, assistId: assister.id, text: goalText, importance: 'HIGH', intensity: 5 };
     } else if (isTarget) {
        if (stats[gk.id]) stats[gk.id].saves++;
        const phrases = PHRASES.CHANCE_SAVE;
        return { minute, type: 'CHANCE', text: phrases[randomInt(0, phrases.length-1)](team.name, shooter.name, gk.name), teamId: team.id, importance: 'MEDIUM', intensity: 4 }; 
     }
     
     const phrases = PHRASES.CHANCE_MISS;
     return { minute, type: 'MISS', text: phrases[randomInt(0, phrases.length-1)](team.name, shooter.name), teamId: team.id, importance: 'LOW', intensity: 4 }; 
  }

  private static simulateHiddenActions(att: Player[], def: Player[], stats: Record<string, PlayerMatchStats>) {
    att.forEach(p => { 
      if (stats[p.id]) { 
        if (Math.random() < 0.6) {
           stats[p.id].passesAttempted++; 
           if (Math.random() * 20 < p.stats.technical.passing + 5) stats[p.id].passesCompleted++; 
        }
      } 
    });
    def.forEach(p => { 
      if (Math.random() < 0.2 && stats[p.id]) { 
        stats[p.id].tacklesAttempted++; 
        if (Math.random() * 20 < p.stats.technical.tackling + 2) stats[p.id].tacklesCompleted++; 
      } 
    });
  }

  private static generatePerformanceDescription(s: PlayerMatchStats, isGK: boolean): string {
     const passPct = s.passesAttempted > 0 ? Math.round((s.passesCompleted / s.passesAttempted) * 100) : 0;
     
     if (s.rating >= 9.0) {
        if (s.goals >= 2) return `¡PARTIDAZO HISTÓRICO! Destrozó al rival con ${s.goals} goles.`;
        if (s.assists >= 2) return `¡MAGISTRAL! El cerebro del equipo con ${s.assists} asistencias y ${passPct}% de pases.`;
        if (isGK && s.saves >= 5) return `¡UNA PARED! Salvó al equipo con ${s.saves} paradas imposibles.`;
        return `Una actuación perfecta, dominando todas las facetas del juego.`;
     }
     
     if (s.rating >= 8.0) {
        if (s.goals > 0) return `Determinante en el área, marcó un gol y llevó peligro constante.`;
        if (s.assists > 0) return `Muy creativo, dio una asistencia clave y movió al equipo.`;
        if (isGK) return `Muy seguro bajo palos, transmitiendo confianza.`;
        if (passPct > 85 && s.passesAttempted > 20) return `Una brújula en el campo, acertó el ${passPct}% de sus entregas.`;
        return `Gran despliegue físico y táctico, destacando sobre el resto.`;
     }

     if (s.rating >= 7.0) {
        if (s.goals > 0) return `Cumplió marcando un gol importante.`;
        if (passPct < 60 && s.passesAttempted > 10) return `Fallón en el pase (${passPct}%), pero compensó con esfuerzo.`;
        return `Partido sólido, sin cometer errores graves.`;
     }

     if (s.rating >= 6.0) return `Actuación discreta, aportando equilibrio pero sin brillar.`;
     
     if (s.rating >= 5.0) {
        if (s.shotsOnTarget === 0 && !isGK) return `Desaparecido en ataque, no logró rematar ni una vez.`;
        return `Le costó entrar en juego, partido flojo.`;
     }
     
     return `¡DESASTROSO! Totalmente superado por la situación.`;
  }

  private static updatePlayerRating(player: Player, s: PlayerMatchStats) {
    if (!s) return;
    let r = 6.0 + s.goals * 1.5 + s.assists * 1.0 + s.saves * 0.4;
    if (s.passesAttempted > 5) {
       const pct = s.passesCompleted / s.passesAttempted;
       if (pct > 0.9) r += 0.5;
       else if (pct < 0.6) r -= 0.5;
    }
    r -= s.foulsCommitted * 0.2;
    
    s.rating = Math.max(1, Math.min(10, Math.round(r * 10) / 10));
    
    const isGK = player.positions.includes(Position.GK);
    s.participationPhrase = this.generatePerformanceDescription(s, isGK);
  }

  private static compileTeamStats(teamId: string, playerStats: Record<string, PlayerMatchStats>, possession: number): TeamMatchStats {
    let onTarget = 0, fouls = 0;
    Object.values(playerStats).forEach(ps => { onTarget += ps.shotsOnTarget; fouls += ps.foulsCommitted; });
    return { possession: Math.round(possession), shots: Math.round(onTarget * 1.7), shotsOnTarget: onTarget, fouls: Math.round(fouls / 2), corners: randomInt(2, 7) };
  }

  private static calculateZonePower(players: Player[], zone: PitchZone): number {
     const zonePlayers = players.filter(p => ZONES[zone].includes(p.tacticalPosition!));
     return zonePlayers.length === 0 ? 8 : zonePlayers.reduce((acc, p) => acc + (p.currentAbility / 10), 0);
  }

  static finalizeSeasonStats(homePlayers: Player[], awayPlayers: Player[], matchStats: Record<string, any>, homeScore: number, awayScore: number) {
      const distributeGoals = (players: Player[], score: number) => {
          let goalsAssigned = 0;
          players.forEach(p => { if(matchStats[p.id]) goalsAssigned += matchStats[p.id].goals; });
          
          let remaining = score - goalsAssigned;
          const scorers = players.filter(p => p.positions.some(pos => pos.includes('ST') || pos.includes('AM') || pos.includes('W') || pos.includes('DL')));
          const pool = scorers.length > 0 ? scorers : players;

          while(remaining > 0 && pool.length > 0) {
              const scorer = pool[randomInt(0, pool.length-1)];
              if (!matchStats[scorer.id]) matchStats[scorer.id] = { rating: 7.0, goals: 0, assists: 0 };
              matchStats[scorer.id].goals = (matchStats[scorer.id].goals || 0) + 1;
              remaining--;
          }
      };

      distributeGoals(homePlayers, homeScore);
      distributeGoals(awayPlayers, awayScore);

      const updateStats = (players: Player[], isHome: boolean) => {
        const opponentScore = isHome ? awayScore : homeScore;
        const isCleanSheet = opponentScore === 0;

        players.forEach(p => {
          const stats = matchStats[p.id];
          if (!stats) return;
          
          p.seasonStats.appearances += 1;
          p.seasonStats.goals += stats.goals || 0;
          p.seasonStats.assists += stats.assists || 0;
          p.seasonStats.totalRating += stats.rating || 6.0;
          
          const isDefensive = p.positions.some(pos => pos.includes('GK') || pos.includes('DF') || pos.includes('SW'));
          if (isCleanSheet && isDefensive) {
              p.seasonStats.cleanSheets += 1;
          }
        });
      };

      updateStats(homePlayers, true);
      updateStats(awayPlayers, false);
  }
}

export class ProfileNarrativeEngine {
  static generateScoutingReport(player: Player): string[] {
    const phrases: string[] = [];
    
    if (player.stats.physical.pace >= 15 && player.stats.physical.acceleration >= 15) {
      phrases.push("Un velocista nato, letal al contragolpe.");
    } else if (player.stats.physical.strength >= 15) {
      phrases.push("Una roca en el aspecto físico.");
    } else if (player.stats.physical.stamina >= 16) {
      phrases.push("Incansable, cubre mucho terreno.");
    }

    if (player.stats.technical.finishing >= 15) {
      phrases.push("Definidor clínico frente a la portería.");
    } else if (player.stats.technical.passing >= 15 && player.stats.mental.vision >= 15) {
      phrases.push("Excelente visión de juego y distribución.");
    } else if (player.stats.technical.dribbling >= 15) {
      phrases.push("Gran capacidad de desborde individual.");
    } else if (player.stats.technical.tackling >= 15) {
      phrases.push("Muy sólido en el corte defensivo.");
    }

    if (player.stats.mental.leadership >= 15) {
      phrases.push("Líder natural y capitán ejemplar.");
    } else if (player.stats.mental.workRate >= 16) {
      phrases.push("Un trabajador incansable para el equipo.");
    } else if (player.stats.mental.flair >= 16) {
      phrases.push("Impredecible y capaz de jugadas mágicas.");
    }

    if (player.positions.includes(Position.GK)) {
        if (player.stats.goalkeeping?.reflexes! >= 15) phrases.push("Reflejos felinos bajo palos.");
        if (player.stats.goalkeeping?.commandOfArea! >= 15) phrases.push("Dueño absoluto de su área.");
    }

    if (phrases.length === 0) {
       phrases.push("Jugador equilibrado sin puntos débiles evidentes.");
    }

    return phrases;
  }
}
