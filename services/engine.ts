
import { Player, Club, MatchEvent, PlayerMatchStats, TeamMatchStats, PitchZone, Position } from '../types';
import { randomInt } from './utils';
import { world } from './worldManager';

// --- NEW TACTICAL COORDINATE SYSTEM ---

type TacticalLine = 'GK' | 'DEF' | 'DM' | 'MID' | 'AM' | 'ATT';
type TacticalLane = 1 | 2 | 3 | 4 | 5; // 1=Left, 2=InnerLeft, 3=Center, 4=InnerRight, 5=Right

interface SlotMetadata {
    line: TacticalLine;
    lane: TacticalLane;
}

// Map every tactical slot (0-30) to coordinates
export const SLOT_CONFIG: Record<number, SlotMetadata> = {
    0: { line: 'GK', lane: 3 },
    
    // DEFENSE
    1: { line: 'DEF', lane: 1 }, // DL
    2: { line: 'DEF', lane: 2 }, // DCL
    3: { line: 'DEF', lane: 3 }, // DC
    4: { line: 'DEF', lane: 4 }, // DCR
    5: { line: 'DEF', lane: 5 }, // DR
    
    // DM
    6: { line: 'DM', lane: 2 }, // DMCL
    7: { line: 'DM', lane: 4 }, // DMCR
    8: { line: 'DM', lane: 3 }, // DMC
    9: { line: 'DM', lane: 1 }, // DML
    10: { line: 'DM', lane: 5 }, // DMR

    // MID
    11: { line: 'MID', lane: 1 }, // ML
    12: { line: 'MID', lane: 2 }, // MCL
    13: { line: 'MID', lane: 3 }, // MC
    14: { line: 'MID', lane: 4 }, // MCR
    15: { line: 'MID', lane: 5 }, // MR

    // AM
    16: { line: 'AM', lane: 1 }, // AML
    17: { line: 'AM', lane: 3 }, // AMC
    18: { line: 'AM', lane: 5 }, // AMR
    19: { line: 'AM', lane: 2 }, // AMCL
    20: { line: 'AM', lane: 4 }, // AMCR

    // ATT
    26: { line: 'ATT', lane: 3 }, // STC
    27: { line: 'ATT', lane: 1 }, // STL (Wide)
    28: { line: 'ATT', lane: 5 }, // STR (Wide)
    29: { line: 'ATT', lane: 2 }, // STCL (Inner)
    30: { line: 'ATT', lane: 4 }, // STCR (Inner)
};

// Slots considered "Wide" on the pitch grid (Columns 1 and 5)
const WIDE_SLOTS = [1, 5, 9, 10, 11, 15, 16, 18, 27, 28]; 

const INJURY_TYPES = [
    { name: "Esguince de Tobillo", min: 7, max: 21 },
    { name: "Contractura Muscular", min: 3, max: 10 },
    { name: "Rotura de Fibras", min: 21, max: 45 },
    { name: "Golpe en la Rodilla", min: 5, max: 14 }
];

const PHRASES: any = {
    POSSESSION_DEF: [
        (team: string, player: string) => `${player} controla en defensa para ${team}.`,
        (team: string, player: string) => `${team} mueve el balón atrás con ${player}.`
    ],
    POSSESSION_MID: [
        (team: string, player: string) => `${player} distribuye en el medio campo.`,
        (team: string, player: string) => `${team} busca espacios a través de ${player}.`,
        (team: string, player: string) => `${player} intenta poner calma al juego.`
    ],
    ATTACK_3_4: [
        (team: string, player: string) => `${player} encara hacia el área rival.`,
        (team: string, player: string) => `¡Peligro! ${player} se escapa con el balón.`
    ],
    DUEL_INTERCEPTION: [
        (def: string, att: string) => `¡Gran corte de ${def}! Adivinó la intención de ${att}.`,
        (def: string, att: string) => `${def} intercepta el pase filtrado de ${att}.`,
        (def: string, att: string) => `${att} pierde el balón ante la presión de ${def}.`
    ],
    DUEL_TACKLE: [
        (def: string, att: string) => `¡Al suelo ${def}! Le roba la cartera a ${att}.`,
        (def: string, att: string) => `${def} impone su físico y desplaza a ${att}.`,
        (def: string, att: string) => `Cierre providencial de ${def} cuando ${att} se iba solo.`
    ],
    DUEL_WON_WING: [
        (att: string, def: string) => `${att} desborda a ${def} con pura velocidad...`,
        (att: string, def: string) => `¡Bicicleta de ${att}! Deja pagando a ${def}.`
    ],
    DUEL_WON_CENTER: [
        (att: string, def: string) => `${att} gira sobre ${def} y queda de cara al arco...`,
        (att: string, def: string) => `¡Caño de ${att} a ${def}! Se va solo...`
    ],
    GOAL_NORMAL: [
        (team: string, scorer: string) => `¡GOL de ${scorer}! Definición impecable.`,
        (team: string, scorer: string) => `¡GOLAZO de ${team}! ${scorer} la manda a guardar.`,
        (team: string, scorer: string) => `${scorer} no perdona en el mano a mano. ¡GOL!`,
        (team: string, scorer: string) => `¡La red se infla! ${scorer} marca para ${team}.`
    ],
    GOAL_HEADER: [
        (team: string, scorer: string, assist: string) => `¡Cabezazo letal de ${scorer} a centro de ${assist}! GOL.`,
        (team: string, scorer: string, assist: string) => `¡GOL de cabeza! ${scorer} gana en las alturas tras pase de ${assist}.`
    ],
    GOAL_LONG: [
        (team: string, scorer: string) => `¡QUÉ BOMBAZO! ${scorer} marca desde fuera del área.`,
        (team: string, scorer: string) => `¡GOLAZO de media distancia de ${scorer}!`
    ],
    CHANCE_SAVE: [
        (team: string, shooter: string, gk: string) => `¡Paradón de ${gk} a tiro de ${shooter}!`,
        (team: string, shooter: string, gk: string) => `${gk} vuela para evitar el gol de ${shooter}.`,
        (team: string, shooter: string, gk: string) => `Mano salvadora de ${gk} ante el remate de ${shooter}.`,
        (team: string, shooter: string, gk: string) => `El portero ${gk} le niega el gol a ${shooter}.`
    ],
    CHANCE_MISS: [
        (team: string, shooter: string) => `${shooter} dispara... ¡Fuera!`,
        (team: string, shooter: string) => `El remate de ${shooter} se va desviado.`,
        (team: string, shooter: string) => `Ocasión desperdiciada por ${shooter}.`,
        (team: string, shooter: string) => `${shooter} la manda a las nubes.`
    ]
};

export class ProfileNarrativeEngine {
  // (Narrative Engine code remains unchanged)
  static generateHeadline(player: Player): string {
    const { mental, technical, physical } = player.stats;
    const ability = player.currentAbility;
    const potential = player.potentialAbility;
    const age = player.age;

    if (ability > 170) return "Estrella de Clase Mundial";
    if (ability > 150) return "Jugador Clave";
    if (age < 22 && potential > ability + 30) return "Joven Promesa";
    if (age < 22 && potential > 150) return "Chico Maravilla";
    if (mental.leadership >= 16 && mental.determination >= 15) return "Líder Carismático";
    if (mental.workRate >= 16 && mental.teamwork >= 16) return "Jugador de Equipo Incansable";
    if (mental.flair >= 16 && technical.dribbling >= 15) return "Mago con el Balón";
    if (physical.pace >= 16 && physical.acceleration >= 16) return "Velocista";
    if (technical.finishing >= 16 && mental.composure >= 15) return "Depredador del Área";
    if (mental.aggression >= 16 && mental.bravery >= 16) return "Guerrero";
    if (age > 31) return "Veterano Experimentado";
    if (ability > 130) return "Jugador de Buen Nivel";
    return "Jugador de la Plantilla";
  }

  static getPersonalityLabel(player: Player): string {
    const { professionalism, ambition, loyalty, pressure, temperament, sportsmanship, determination } = player.stats.mental;
    if (professionalism >= 18 && determination >= 10) return "Modelo de Profesional";
    if (professionalism >= 15 && determination >= 15) return "Profesional";
    if (loyalty >= 18 && ambition < 10) return "Muy Leal";
    if (ambition >= 18 && loyalty < 10) return "Muy Ambicioso";
    if (ambition >= 15 && determination >= 15) return "Ambicioso";
    if (sportsmanship >= 17) return "Deportista";
    if (temperament <= 5) return "Temperamental";
    if (professionalism >= 15) return "Bastante Profesional";
    if (determination >= 17) return "Determinado";
    if (pressure >= 17 && determination >= 15) return "Líder de Hierro";
    if (loyalty >= 15) return "Leal";
    if (professionalism < 5 && temperament < 5) return "Problemático";
    if (ambition < 5 && professionalism < 10) return "Falto de Ambición";
    return "Equilibrado";
  }
}

export class MatchSimulator {
  static momentum = 0;
  static possessionCount = { home: 0, away: 0 };
  static lastEventIntensity = 2;
  static lastAttackingTeamId: string | null = null;
  
  static initMatchStats(players: Player[]): Record<string, PlayerMatchStats> {
    const stats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
      stats[p.id] = {
        rating: 6.0, 
        goals: 0, assists: 0, 
        condition: 100,
        passesAttempted: 0, passesCompleted: 0, keyPasses: 0,
        shots: 0, shotsOnTarget: 0,
        dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0,
        tacklesAttempted: 0, tacklesCompleted: 0, keyTackles: 0,
        interceptions: 0, shotsBlocked: 0,
        headersAttempted: 0, headersWon: 0, keyHeaders: 0,
        foulsCommitted: 0, foulsReceived: 0,
        saves: 0,
        participationPhrase: "Buscando su lugar en el partido."
      };
    });
    this.momentum = 0;
    this.possessionCount = { home: 0, away: 0 };
    this.lastEventIntensity = 2;
    this.lastAttackingTeamId = null;
    return stats;
  }

  // (Helper methods omitted for brevity as they are unchanged)
  static analyzeMatchup(home: Club, away: Club, hPlayers: Player[], aPlayers: Player[]) { /* ... */ }
  private static parsePlayerCompatibleLanes(position: string) { /* ... */ return { line: 'MID', lanes: [3] } as any; }
  static calculatePositionEfficiency(player: Player, slotIndex: number): number { /* ... */ return 1.0; }
  private static getPositionEfficiency(player: Player): number { /* ... */ return 1.0; }
  private static getEffectiveAbility(p: Player, attributeKey?: string): number { 
     const fatigueFactor = Math.max(0.2, p.fitness / 100); 
     const moraleFactor = 0.9 + (p.morale / 100) * 0.2;
     let baseAttr = p.currentAbility;
     if (attributeKey) {
        const allStats: Record<string, number> = { ...p.stats.mental, ...p.stats.physical, ...p.stats.technical, ...(p.stats.goalkeeping || {}) };
        if (allStats[attributeKey]) baseAttr = allStats[attributeKey] * 6; 
     }
     return baseAttr * fatigueFactor * moraleFactor;
  }
  private static applyTacticalStyles(home: Club, away: Club, homeStats: TeamMatchStats, awayStats: TeamMatchStats) { /* ... */ }

  // --- REALISTIC STAMINA DRAIN ---
  // Players should lose ~25-40% condition in 90 mins depending on Stamina/WorkRate
  // Base drain per minute should be approx 0.3 - 0.5
  private static updatePhysicalCondition(players: Player[], stats: Record<string, PlayerMatchStats>, minute: number) {
      players.forEach(p => {
          if (!stats[p.id]) return;
          
          // Base Metabolic Cost (0.15% per minute just for existing)
          let drain = 0.15;

          // Stamina Mitigation: High Stamina (20) reduces drain, Low Stamina (1) increases it.
          // Range: -0.10 (at 20) to +0.15 (at 1)
          const staminaMod = (15 - p.stats.physical.stamina) * 0.015;
          drain += staminaMod;

          // Work Rate Penalty: Players who run more (20) burn more fuel
          // Range: +0.02 (at 1) to +0.20 (at 20)
          const workRateCost = p.stats.mental.workRate * 0.012;
          drain += workRateCost;

          // Accumulated Fatigue: After 70 mins, tiredness accelerates
          if (minute > 70) drain *= 1.4;
          if (minute > 85) drain *= 1.2;

          // Random variability (sprint, jog, walk cycles)
          const activitySpike = Math.random() < 0.2 ? 0.3 : 0;
          drain += activitySpike;

          // Safety floor
          drain = Math.max(0.05, drain);

          stats[p.id].condition = Math.max(1, stats[p.id].condition - drain);
      });
  }

  // --- DYNAMIC RATINGS ENGINE ---
  // Replaces static logic with event-weighted ratings
  private static updatePlayerRating(player: Player, stat: PlayerMatchStats, concededGoals: number) {
      let r = 6.0; // Base start

      // -- OFFENSIVE CONTRIBUTIONS --
      r += stat.goals * 1.2;
      r += stat.assists * 0.8;
      r += stat.keyPasses * 0.15; 
      r += stat.dribblesCompleted * 0.05;
      
      // Passing Volume & Accuracy reward
      if (stat.passesAttempted > 10) {
          const acc = stat.passesCompleted / stat.passesAttempted;
          if (acc > 0.85) r += 0.3;
          else if (acc < 0.60) r -= 0.2;
      }

      // -- DEFENSIVE CONTRIBUTIONS --
      r += stat.keyTackles * 0.3;
      r += (stat.tacklesCompleted / 3) * 0.1; 
      r += (stat.interceptions / 3) * 0.1;
      r += (stat.headersWon / 4) * 0.1;
      r += stat.shotsBlocked * 0.2;
      
      // GK specific
      if (player.positions.includes(Position.GK)) {
          r += stat.saves * 0.3;
          r += (stat.keyPasses * 0.1); // Distribution
      }

      // -- PENALTIES --
      r -= (stat.foulsCommitted * 0.15);
      if (stat.card === 'YELLOW') r -= 0.6;
      if (stat.card === 'RED') r -= 2.5;
      r -= (stat.offsides * 0.1);

      // Team Performance Impact (Defenders punished for goals conceded)
      if (player.positions.some(pos => pos.includes('D') || pos === 'GK')) {
          r -= (concededGoals * 0.4);
          // Mitigation: High tackles/headers can save a defender's rating despite goals
      }

      // Clamp
      stat.rating = Math.max(2.0, Math.min(10.0, r));
  }

  // --- THE INVISIBLE GAME SIMULATOR ---
  // Runs every minute to generate volume stats (Passes, Headers, Tackles)
  private static simulateBackgroundActivity(
      minute: number,
      homeTeamId: string, 
      awayTeamId: string,
      hPlayers: Player[], 
      aPlayers: Player[], 
      stats: Record<string, PlayerMatchStats>
  ) {
      const allActive = [...hPlayers, ...aPlayers];
      
      // Determine possession bias for this minute
      const momentum = this.momentum; // -10 (Away Dominating) to +10 (Home Dominating)
      const homePossProb = 0.5 + (momentum * 0.02); // 0.3 to 0.7
      
      // We simulate ~3-5 "micro-events" per minute to generate stats volume
      const eventsCount = randomInt(3, 6);

      for(let i=0; i<eventsCount; i++) {
          const isHomeAction = Math.random() < homePossProb;
          const activeSide = isHomeAction ? hPlayers : aPlayers;
          const passiveSide = isHomeAction ? aPlayers : hPlayers;

          // Pick random actors weighted by position relevance
          // MIDs are most involved, then DEFs/ATTs, GK least.
          const actor = this.pickActor(activeSide);
          if (!actor || !stats[actor.id]) continue;

          const s = stats[actor.id];
          const pos = actor.positions[0];

          // Logic based on Position
          if (pos.includes('M') || pos.includes('DM')) {
              // MIDFIELDERS: Mostly Passing
              s.passesAttempted++;
              if (Math.random() < (actor.stats.technical.passing / 25) + 0.4) {
                  s.passesCompleted++;
              } else {
                  // Pass intercepted?
                  const interceptor = this.pickActor(passiveSide, 'DEF');
                  if (interceptor && stats[interceptor.id]) stats[interceptor.id].interceptions++;
              }
          } 
          else if (pos.includes('D') || pos === 'SW') {
              // DEFENDERS: Circulation or Long Balls
              s.passesAttempted++;
              if (Math.random() < 0.8) s.passesCompleted++; // Easy passes at back
          }
          else if (pos.includes('ST') || pos.includes('AM')) {
              // ATTACKERS: Dribbles, Offsides, Fouls
              const roll = Math.random();
              if (roll < 0.15) {
                  s.dribblesAttempted++;
                  if (Math.random() < (actor.stats.technical.dribbling / 25)) s.dribblesCompleted++;
              } else if (roll < 0.18) {
                  s.offsides += (Math.random() < 0.05 ? 1 : 0);
              } else if (roll < 0.25) {
                  s.foulsCommitted += (Math.random() < 0.05 ? 1 : 0);
                  const victim = this.pickActor(passiveSide);
                  if (victim && stats[victim.id]) stats[victim.id].foulsReceived++;
              } else {
                  s.passesAttempted++; // Link up play
                  if (Math.random() < 0.6) s.passesCompleted++;
              }
          }

          // Defensive Response (Tackles/Headers)
          if (Math.random() < 0.3) {
              const defender = this.pickActor(passiveSide, 'DEF');
              if (defender && stats[defender.id]) {
                  const ds = stats[defender.id];
                  if (Math.random() < 0.5) {
                      ds.tacklesAttempted++;
                      if (Math.random() < (defender.stats.technical.tackling / 22)) ds.tacklesCompleted++;
                  } else {
                      ds.headersAttempted++;
                      if (Math.random() < (defender.stats.technical.heading / 22)) ds.headersWon++;
                  }
              }
          }
      }
  }

  private static pickActor(players: Player[], roleFilter?: 'DEF' | 'MID' | 'ATT'): Player | undefined {
      let pool = players;
      if (roleFilter === 'DEF') pool = players.filter(p => p.positions.some(pos => pos.includes('D') || pos.includes('SW')));
      else if (roleFilter === 'MID') pool = players.filter(p => p.positions.some(pos => pos.includes('M')));
      else if (roleFilter === 'ATT') pool = players.filter(p => p.positions.some(pos => pos.includes('S') || pos.includes('A')));
      
      if (pool.length === 0) pool = players;
      return pool[randomInt(0, pool.length - 1)];
  }

  static simulateMinute(
    minute: number, homeTeam: Club, awayTeam: Club, homeEleven: Player[], awayEleven: Player[], playerStats: Record<string, PlayerMatchStats>, currentDate?: Date
  ): { event: MatchEvent | null, teamStats: { home: TeamMatchStats, away: TeamMatchStats }, slowMotion: boolean } {
    
    const activeHome = homeEleven.filter(p => p.tacticalPosition !== undefined).slice(0, 11);
    const activeAway = awayEleven.filter(p => p.tacticalPosition !== undefined).slice(0, 11);

    // 1. Run The "Invisible Game" (Volume Generator)
    this.simulateBackgroundActivity(minute, homeTeam.id, awayTeam.id, activeHome, activeAway, playerStats);

    // 2. Process Physical Decay (More Aggressive)
    this.updatePhysicalCondition(activeHome, playerStats, minute);
    this.updatePhysicalCondition(activeAway, playerStats, minute);

    let chaosMultiplier = 1.0;
    if (minute > 75) chaosMultiplier = 1.5;

    const hCount = activeHome.length;
    const aCount = activeAway.length;
    
    const getTeamPower = (players: Player[]) => {
        return players.reduce((acc, p) => acc + this.getEffectiveAbility(p), 0);
    };

    const hPower = getTeamPower(activeHome);
    const aPower = getTeamPower(activeAway);
    
    let tacticalBonus = 0;
    if (hCount < 11) tacticalBonus -= (11 - hCount) * 15;
    if (aCount < 11) tacticalBonus += (11 - aCount) * 15;

    // Momentum shift
    const powerDiff = (hPower - aPower) / 50; 
    this.momentum += (powerDiff + tacticalBonus) * 0.05;
    this.momentum = Math.max(-12, Math.min(12, this.momentum));
    
    const totalPower = (50 + (this.momentum * 2.5) + randomInt(-8, 8));
    const isHomePossession = Math.random() * 100 < totalPower;
    
    if (isHomePossession) this.possessionCount.home++; else this.possessionCount.away++;
    
    // Original Event Logic
    let event: MatchEvent | null = null;
    let slowMotion = false;
    
    const attackingTeam = isHomePossession ? homeTeam : awayTeam;
    const defendingTeam = isHomePossession ? awayTeam : homeTeam;
    const attPlayers = isHomePossession ? activeHome : activeAway;
    const defPlayers = isHomePossession ? activeAway : activeHome;

    if (Math.random() < 0.009 * chaosMultiplier) {
       event = this.resolveDisciplinary(minute, defPlayers, defendingTeam, playerStats);
    } else if (Math.random() < 0.004) {
       event = this.resolveInjury(minute, attPlayers, defPlayers, homeTeam, awayTeam, playerStats, currentDate);
    }
    
    if (!event && Math.random() < 0.17 * chaosMultiplier) { 
       event = this.resolveAttackSequence(minute, attackingTeam, attPlayers, defendingTeam, defPlayers, playerStats);
    }

    if (!event && Math.random() < 0.28) {
       event = this.resolvePossession(minute, attackingTeam, attPlayers);
    }

    if (event) {
       this.lastEventIntensity = event.intensity;
       if (event.type === 'CHANCE' || event.type === 'POSSESSION') {
          this.lastAttackingTeamId = event.teamId || null;
       } else if (event.type === 'GOAL') {
          this.lastAttackingTeamId = null;
       }
       if (event.intensity >= 3) slowMotion = true;
    } else {
       if (this.lastEventIntensity > 1) this.lastEventIntensity -= 1;
    }

    const totalPoss = this.possessionCount.home + this.possessionCount.away;
    const teamStats = {
      home: this.compileTeamStats(homeEleven, playerStats, (this.possessionCount.home / (totalPoss || 1)) * 100),
      away: this.compileTeamStats(awayEleven, playerStats, (this.possessionCount.away / (totalPoss || 1)) * 100)
    };
    
    this.applyTacticalStyles(homeTeam, awayTeam, teamStats.home, teamStats.away);

    // Update Ratings Dynamic (Every 5 mins OR Goal)
    // We need current Score to punish defenders
    // Since we don't have current score in args easily without refactoring, we estimate via player stats
    
    // Wait, simple fix: iterate players and sum goals from stats
    let hScore = 0, aScore = 0;
    activeHome.forEach(p => hScore += playerStats[p.id]?.goals || 0);
    activeAway.forEach(p => aScore += playerStats[p.id]?.goals || 0);

    if (minute % 5 === 0 || (event && event.type === 'GOAL')) {
      activeHome.forEach(p => { if (playerStats[p.id]) this.updatePlayerRating(p, playerStats[p.id], aScore); });
      activeAway.forEach(p => { if (playerStats[p.id]) this.updatePlayerRating(p, playerStats[p.id], hScore); });
    }
    
    return { event, teamStats, slowMotion };
  }

  private static resolveDisciplinary(minute: number, defPlayers: Player[], defTeam: Club, stats: Record<string, PlayerMatchStats>): MatchEvent | null {
      const offender = defPlayers[randomInt(0, defPlayers.length - 1)];
      if (!offender || !stats[offender.id]) return null;
      
      stats[offender.id].foulsCommitted++;

      const roll = Math.random();
      if (roll < 0.2) {
          if (stats[offender.id].card === 'YELLOW') {
              stats[offender.id].card = 'RED';
              return { minute, type: 'RED_CARD', text: `¡Segunda amarilla para ${offender.name}! Expulsado.`, teamId: defTeam.id, playerId: offender.id, importance: 'HIGH', intensity: 5 };
          } else if (!stats[offender.id].card) {
              stats[offender.id].card = 'YELLOW';
              return { minute, type: 'YELLOW_CARD', text: `Tarjeta amarilla para ${offender.name}.`, teamId: defTeam.id, playerId: offender.id, importance: 'MEDIUM', intensity: 3 };
          }
      } else if (roll < 0.02) {
          stats[offender.id].card = 'RED';
          return { minute, type: 'RED_CARD', text: `¡ROJA DIRECTA para ${offender.name}!`, teamId: defTeam.id, playerId: offender.id, importance: 'HIGH', intensity: 5 };
      }
      return { minute, type: 'WHISTLE', text: `Falta de ${offender.name}.`, teamId: defTeam.id, playerId: offender.id, importance: 'LOW', intensity: 1 };
  }

  private static resolveInjury(minute: number, attPlayers: Player[], defPlayers: Player[], homeTeam: Club, awayTeam: Club, stats: Record<string, PlayerMatchStats>, currentDate?: Date): MatchEvent | null {
      const players = [...attPlayers, ...defPlayers];
      const victim = players[randomInt(0, players.length-1)];
      if(!victim) return null;
      
      const injury = INJURY_TYPES[randomInt(0, INJURY_TYPES.length-1)];
      if (stats[victim.id]) {
          stats[victim.id].sustainedInjury = { type: injury.name, days: randomInt(injury.min, injury.max) };
      }
      if (currentDate) {
          victim.injury = { type: injury.name, daysLeft: randomInt(injury.min, injury.max) };
      }

      return { minute, type: 'INJURY', text: `¡${victim.name} se retira lesionado! Parece ${injury.name}.`, teamId: victim.clubId, playerId: victim.id, importance: 'HIGH', intensity: 4 };
  }

  private static resolvePossession(minute: number, team: Club, players: Player[]): MatchEvent | null {
      const p = players[randomInt(0, players.length - 1)];
      let text = `${team.name} controla el balón.`;
      if (p) {
          const texts = PHRASES.POSSESSION_MID;
          text = texts[randomInt(0, texts.length-1)](team.name, p.name);
      }
      return { minute, type: 'POSSESSION', text, teamId: team.id, playerId: p?.id, importance: 'LOW', intensity: 1 };
  }

  private static resolveAttackSequence(minute: number, attTeam: Club, attPlayers: Player[], defTeam: Club, defPlayers: Player[], stats: Record<string, PlayerMatchStats>): MatchEvent | null {
     if (attPlayers.length === 0) return null;
     const gk = defPlayers.find(p => p.tacticalPosition === 0);
     if (!gk) {
         const finisher = attPlayers[0];
         if (stats[finisher.id]) { stats[finisher.id].shots++; stats[finisher.id].shotsOnTarget++; stats[finisher.id].goals++; }
         return { minute, type: 'GOAL', teamId: attTeam.id, playerId: finisher.id, text: `¡PORTERÍA VACÍA! ${finisher.name} marca a placer.`, importance: 'HIGH', intensity: 5 };
     }
     const getWidthScore = (players: Player[]) => players.filter(p => WIDE_SLOTS.includes(p.tacticalPosition!) || (p.tacticalArrow && WIDE_SLOTS.includes(p.tacticalArrow))).length;
     const attWidth = getWidthScore(attPlayers);
     const defWidth = getWidthScore(defPlayers);
     let attackTypeWeights = { CROSS: 20, THROUGH_BALL: 20, LONG_SHOT: 15, CORNER: 10, NORMAL: 35 };
     if (attPlayers.length > defPlayers.length + 1) { attackTypeWeights.THROUGH_BALL += 30; attackTypeWeights.NORMAL += 20; }
     if (attWidth > defWidth + 1) { attackTypeWeights.CROSS += 30; attackTypeWeights.NORMAL -= 10; } 
     else if (attWidth < 2 && defWidth > 2) { attackTypeWeights.THROUGH_BALL += 25; attackTypeWeights.CROSS -= 10; }
     const weightedList: string[] = [];
     Object.entries(attackTypeWeights).forEach(([type, weight]) => { for(let i=0; i<weight; i++) weightedList.push(type); });
     const currentType = weightedList[randomInt(0, weightedList.length - 1)];
     const creator = attPlayers.filter(p => p.tacticalPosition !== 0)[randomInt(0, attPlayers.length - 2)] || attPlayers[0];
     const finisher = attPlayers.filter(p => p.positions.some(pos => pos.includes('ST') || pos.includes('AM')))[randomInt(0, 3)] || attPlayers[randomInt(0, attPlayers.length-1)];
     let directDefender: Player;
     if (currentType === 'CROSS') { directDefender = defPlayers.find(p => p.positions.some(pos => pos === Position.DR || pos === Position.DL)) || defPlayers.find(p => p.tacticalPosition !== 0) || defPlayers[0]; } 
     else { directDefender = defPlayers.find(p => p.positions.some(pos => pos.includes('DC') || pos.includes('DM'))) || defPlayers.find(p => p.tacticalPosition !== 0) || defPlayers[0]; }
     if (!directDefender) directDefender = gk; 
     if (currentType === 'CROSS' || currentType === 'CORNER') {
         if (stats[directDefender.id]) stats[directDefender.id].headersAttempted++;
         if (stats[finisher.id]) stats[finisher.id].headersAttempted++;
     }
     const visionCheck = this.getEffectiveAbility(creator, 'vision') + randomInt(-30, 30);
     const defAntic = this.getEffectiveAbility(directDefender, 'anticipation');
     const defPos = this.getEffectiveAbility(directDefender, 'positioning');
     const numbersAdvantage = Math.min(30, (attPlayers.length - defPlayers.length) * 10);
     const interceptionCheck = ((defAntic + defPos) / 2) + randomInt(-30, 30) - numbersAdvantage;
     if (visionCheck < interceptionCheck - 15) {
        if (stats[directDefender.id]) stats[directDefender.id].interceptions++;
        if (currentType === 'CROSS' || currentType === 'CORNER') { if (stats[directDefender.id]) { stats[directDefender.id].headersWon++; stats[directDefender.id].keyHeaders++; } }
        return { minute, type: 'POSSESSION', text: PHRASES.DUEL_INTERCEPTION[randomInt(0, PHRASES.DUEL_INTERCEPTION.length-1)](directDefender.name, creator.name), teamId: defTeam.id, importance: 'LOW', intensity: 2 };
     }
     let attAttr = 'dribbling'; let defAttr = 'tackling';
     if (currentType === 'THROUGH_BALL') { attAttr = 'pace'; defAttr = 'marking'; }
     if (currentType === 'CROSS') { attAttr = 'acceleration'; defAttr = 'tackling'; }
     const breakthroughScore = this.getEffectiveAbility(creator, attAttr) + randomInt(-40, 40) + (numbersAdvantage / 2);
     const defenseScore = this.getEffectiveAbility(directDefender, defAttr) + randomInt(-40, 40);
     if (breakthroughScore < defenseScore) {
        if (stats[directDefender.id]) { stats[directDefender.id].tacklesAttempted++; stats[directDefender.id].tacklesCompleted++; stats[directDefender.id].keyTackles++; }
        if (stats[creator.id]) { stats[creator.id].dribblesAttempted++; }
        return { minute, type: 'POSSESSION', text: PHRASES.DUEL_TACKLE[randomInt(0, PHRASES.DUEL_TACKLE.length-1)](directDefender.name, creator.name), teamId: defTeam.id, importance: 'MEDIUM', intensity: 3 };
     }
     if (stats[creator.id]) { stats[creator.id].dribblesAttempted++; stats[creator.id].dribblesCompleted++; stats[creator.id].keyPasses++; }
     if (Math.random() < 0.05) { if (stats[finisher.id]) stats[finisher.id].offsides++; return { minute, type: 'WHISTLE', text: `Fuera de juego de ${finisher.name}.`, teamId: defTeam.id, importance: 'LOW', intensity: 1 }; }
     const rawDiff = breakthroughScore - defenseScore;
     const advantageBonus = Math.min(20, Math.max(0, rawDiff / 2.5)); 
     return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, currentType, advantageBonus);
  }

  private static resolveShot(minute: number, team: Club, shooter: Player, gk: Player, assister: Player, stats: Record<string, PlayerMatchStats>, type: string, advantageBonus: number): MatchEvent {
     if (stats[shooter.id]) stats[shooter.id].shots++;
     let attackAttr = 'finishing'; let defenseAttr = 'reflexes'; let shotDifficultyMod = 0; 
     if (type === 'CROSS' || type === 'CORNER') { attackAttr = 'heading'; defenseAttr = 'aerialReach'; shotDifficultyMod = -15; if (stats[shooter.id]) stats[shooter.id].headersWon++; } 
     else if (type === 'LONG_SHOT') { attackAttr = 'longShots'; defenseAttr = 'positioning'; shotDifficultyMod = -40; } 
     else if (type === 'THROUGH_BALL') { defenseAttr = 'oneOnOnes'; shotDifficultyMod = +15; } 
     else { shotDifficultyMod = +5; }
     const composure = this.getEffectiveAbility(shooter, 'composure') * 0.5;
     const shotPower = this.getEffectiveAbility(shooter, attackAttr) + composure + advantageBonus + shotDifficultyMod + randomInt(-40, 60);
     const gkPos = this.getEffectiveAbility(gk, 'positioning') * 0.5; 
     const savePower = this.getEffectiveAbility(gk, defenseAttr) + gkPos + randomInt(-30, 50);
     const isTarget = shotPower > savePower - 30; 
     if (!isTarget && Math.random() < 0.3) { /* Block logic omitted for speed */ }
     if (isTarget && stats[shooter.id]) stats[shooter.id].shotsOnTarget++;
     if (shotPower > savePower) {
        if (stats[shooter.id]) stats[shooter.id].goals++;
        if (assister.id !== shooter.id && stats[assister.id]) stats[assister.id].assists++;
        let goalText = "";
        if (type === 'CROSS') goalText = PHRASES.GOAL_HEADER[randomInt(0, 1)](team.name, shooter.name, assister.name);
        else if (type === 'LONG_SHOT') goalText = PHRASES.GOAL_LONG[randomInt(0, 1)](team.name, shooter.name);
        else goalText = PHRASES.GOAL_NORMAL[randomInt(0, 3)](team.name, shooter.name);
        return { minute, type: 'GOAL', teamId: team.id, playerId: shooter.id, text: goalText, importance: 'HIGH', intensity: 5 };
     } else if (isTarget) {
        if (stats[gk.id]) stats[gk.id].saves++;
        return { minute, type: 'CHANCE', text: PHRASES.CHANCE_SAVE[randomInt(0, 3)](team.name, shooter.name, gk.name), teamId: team.id, importance: 'MEDIUM', intensity: 4 }; 
     }
     return { minute, type: 'MISS', text: PHRASES.CHANCE_MISS[randomInt(0, 3)](team.name, shooter.name), teamId: team.id, importance: 'LOW', intensity: 4 }; 
  }

  private static compileTeamStats(players: Player[], stats: Record<string, PlayerMatchStats>, possession: number): TeamMatchStats {
      let shots = 0, onTarget = 0, fouls = 0;
      players.forEach(p => { if (stats[p.id]) { shots += stats[p.id].shots; onTarget += stats[p.id].shotsOnTarget; fouls += stats[p.id].foulsCommitted; } });
      return { possession: Math.round(possession), shots, shotsOnTarget: onTarget, fouls, corners: Math.floor(shots / 4) };
  }

  static finalizeSeasonStats(homeEleven: Player[], awayEleven: Player[], matchStats: Record<string, PlayerMatchStats>, homeScore: number, awayScore: number, competitionId: string) {
      const update = (p: Player, gf: number, ga: number) => {
          const s = matchStats[p.id];
          if (!s) return;
          p.seasonStats.appearances++; p.seasonStats.goals += s.goals; p.seasonStats.assists += s.assists; p.seasonStats.totalRating += s.rating;
          if (ga === 0 && (p.positions.includes(Position.GK) || p.positions[0].includes('D'))) p.seasonStats.cleanSheets++;
          if (p.positions.includes(Position.GK)) p.seasonStats.conceded += ga;
          if (!p.statsByCompetition[competitionId]) p.statsByCompetition[competitionId] = { appearances:0, goals:0, assists:0, cleanSheets:0, conceded:0, totalRating:0 };
          const c = p.statsByCompetition[competitionId];
          c.appearances++; c.goals += s.goals; c.assists += s.assists; c.totalRating += s.rating;
          if (ga === 0 && (p.positions.includes(Position.GK) || p.positions[0].includes('D'))) c.cleanSheets++;
          if (p.positions.includes(Position.GK)) c.conceded += ga;
          if (s.card === 'YELLOW') { p.yellowCardsAccumulated++; if (p.yellowCardsAccumulated >= 5) { p.suspension = { type: 'Yellow Accumulation', matchesLeft: 1 }; p.yellowCardsAccumulated = 0; } } 
          else if (s.card === 'RED') { p.suspension = { type: 'Red Card', matchesLeft: 2 }; }
          if (s.sustainedInjury) { p.injury = { type: s.sustainedInjury.type, daysLeft: s.sustainedInjury.days }; }
      };
      homeEleven.forEach(p => update(p, homeScore, awayScore));
      awayEleven.forEach(p => update(p, awayScore, homeScore));
  }

  static simulateQuickMatch(homeTeamId: string, awayTeamId: string, squadType: string = 'SENIOR'): { homeScore: number, awayScore: number, stats: Record<string, PlayerMatchStats> } {
     const home = world.getClub(homeTeamId);
     const away = world.getClub(awayTeamId);
     const homePlayers = world.selectBestEleven(homeTeamId, squadType as any);
     const awayPlayers = world.selectBestEleven(awayTeamId, squadType as any);
     
     if (!home || !away) return { homeScore: 0, awayScore: 0, stats: {} };

     const getTeamStrength = (players: Player[], clubRep: number) => {
        if (players.length === 0) return 0;
        const avgEffectiveAbility = players.reduce((s, p) => s + this.getEffectiveAbility(p), 0) / players.length;
        return (avgEffectiveAbility * 0.7) + (clubRep / 100 * 0.3);
     };

     let homeStr = getTeamStrength(homePlayers, home.reputation) + 5; 
     let awayStr = getTeamStrength(awayPlayers, away.reputation);
     homeStr += randomInt(-10, 15); awayStr += randomInt(-10, 15);
     const diff = homeStr - awayStr;
     let homeScore = 0, awayScore = 0;
     if (diff > 50) { homeScore = randomInt(1, 3); awayScore = randomInt(0, 1); }
     else if (diff > 25) { homeScore = randomInt(0, 2); awayScore = randomInt(0, 1); }
     else if (diff > 0) { homeScore = randomInt(0, 2); awayScore = randomInt(0, 2); }
     else if (diff > -25) { homeScore = randomInt(0, 1); awayScore = randomInt(0, 2); }
     else { homeScore = randomInt(0, 1); awayScore = randomInt(1, 3); }

     const stats: Record<string, PlayerMatchStats> = {};
     [...homePlayers, ...awayPlayers].forEach(p => {
        // High Volume Stats for Quick Match to match new engine
        const mins = 90;
        stats[p.id] = { 
            rating: 6.0, 
            goals: 0, assists: 0, 
            condition: randomInt(65, 85), // Realistic fatigue
            shots: 0, shotsOnTarget: 0,
            passesAttempted: randomInt(25, 55), passesCompleted: randomInt(15, 45), keyPasses: randomInt(0, 3),
            dribblesAttempted: randomInt(0, 8), dribblesCompleted: randomInt(0, 5), offsides: randomInt(0, 1),
            tacklesAttempted: randomInt(1, 6), tacklesCompleted: randomInt(0, 5), keyTackles: randomInt(0, 3),
            interceptions: randomInt(2, 8), shotsBlocked: randomInt(0, 2),
            headersAttempted: randomInt(1, 8), headersWon: randomInt(0, 6), keyHeaders: randomInt(0, 2),
            foulsCommitted: randomInt(0, 3), foulsReceived: randomInt(0, 3),
            saves: 0
        };
        // Positional Boosts
        if (p.positions[0].includes('D')) { stats[p.id].interceptions += 4; stats[p.id].headersWon += 3; }
        if (p.positions[0].includes('M')) { stats[p.id].passesAttempted += 20; stats[p.id].passesCompleted += 15; }
        
        if (Math.random() < 0.12) stats[p.id].card = 'YELLOW';
        else if (Math.random() < 0.005) stats[p.id].card = 'RED';
        
        // Recalculate rating based on these fake stats + bias
        let r = 6.0 + (Math.random() * 1.0);
        if (homeScore > awayScore && homePlayers.includes(p)) r += 0.8;
        if (awayScore > homeScore && awayPlayers.includes(p)) r += 0.8;
        if (homeScore < awayScore && homePlayers.includes(p) && p.positions[0].includes('D')) r -= 0.8;
        stats[p.id].rating = Math.min(10, r);
     });
     
     const assignEvents = (players: Player[], goalCount: number) => {
        const weightedPool: Player[] = [];
        players.forEach(p => {
           let weight = 1;
           if (p.currentAbility > 140) weight += 2;
           if (p.positions[0].includes('ST') || p.positions[0].includes('FW')) weight += 5;
           for(let w=0; w<weight; w++) weightedPool.push(p);
        });
        if (weightedPool.length === 0) return;
        for(let i=0; i<goalCount; i++) {
           const scorer = weightedPool[randomInt(0, weightedPool.length-1)];
           if(stats[scorer.id]) {
              stats[scorer.id].goals++;
              stats[scorer.id].rating = Math.min(10, stats[scorer.id].rating + 1.2);
           }
        }
     };
     assignEvents(homePlayers, homeScore);
     assignEvents(awayPlayers, awayScore);

     return { homeScore, awayScore, stats };
  }
}
