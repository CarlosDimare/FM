
import { Player, Club, MatchEvent, PlayerMatchStats, TeamMatchStats, PitchZone, Position } from '../types';
import { randomInt } from './utils';
import { world } from './worldManager';

// Define constants used in engine
const ZONES: Record<string, number[]> = {
    DEF: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
    MID: [16, 17, 18, 19, 20, 21, 22, 23, 24, 25],
    ATT: [26, 27, 28, 29, 30]
};

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
        (team: string, player: string) => `${team} busca espacios a través de ${player}.`
    ],
    ATTACK_3_4: [
        (team: string, player: string) => `${player} encara hacia el área rival.`,
        (team: string, player: string) => `¡Peligro! ${player} se escapa con el balón.`
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

export class MatchSimulator {
  static momentum = 0;
  static possessionCount = { home: 0, away: 0 };
  static lastEventIntensity = 2;
  static lastAttackingTeamId: string | null = null;
  
  static initMatchStats(players: Player[]): Record<string, PlayerMatchStats> {
    const stats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
      stats[p.id] = {
        rating: 6.0, goals: 0, assists: 0, shots: 0, passesAttempted: 0, passesCompleted: 0, dribblesAttempted: 0, dribblesCompleted: 0, tacklesAttempted: 0, tacklesCompleted: 0, foulsCommitted: 0, shotsOnTarget: 0, saves: 0, participationPhrase: "Buscando su lugar en el partido."
      };
    });
    this.momentum = 0;
    this.possessionCount = { home: 0, away: 0 };
    this.lastEventIntensity = 2;
    this.lastAttackingTeamId = null;
    return stats;
  }

  private static getPlayerZoneIntensity(player: Player): 1 | 2 | 3 | 4 | 5 {
      const pos = player.positions[0];
      if (pos.includes('GK')) return 1;
      if (pos.includes('SW') || (pos.includes('DF') && !pos.includes('M'))) return 1;
      if (pos.includes('DM') || pos === Position.MC || pos === Position.MR || pos === Position.ML) return 2;
      if (pos.includes('AM')) return 3;
      if (pos.includes('ST') || pos.includes('DL')) return 4;
      return 2; 
  }

  private static getEffectiveAbility(p: Player, attributeKey?: string): number {
     const fatigueFactor = Math.max(0.4, p.fitness / 100); 
     const moraleFactor = 0.9 + (p.morale / 100) * 0.2; // 0.9 to 1.1
     
     let baseAttr = p.currentAbility;
     if (attributeKey) {
        // Find attribute in stats
        const allStats: Record<string, number> = { ...p.stats.mental, ...p.stats.physical, ...p.stats.technical, ...(p.stats.goalkeeping || {}) };
        if (allStats[attributeKey]) baseAttr = allStats[attributeKey] * 10;
     }

     return baseAttr * fatigueFactor * moraleFactor;
  }

  static simulateMinute(
    minute: number, homeTeam: Club, awayTeam: Club, homeEleven: Player[], awayEleven: Player[], playerStats: Record<string, PlayerMatchStats>, currentDate?: Date
  ): { event: MatchEvent | null, teamStats: { home: TeamMatchStats, away: TeamMatchStats }, slowMotion: boolean } {
    
    // DESPERATION MODE: Last 15 minutes, if someone is losing, they push harder (more chances, but more counter-attacks)
    let chaosMultiplier = 1.0;
    if (minute > 75) {
       chaosMultiplier = 1.5;
    }

    const hMidPower = this.calculateZonePower(homeEleven, 'MID');
    const aMidPower = this.calculateZonePower(awayEleven, 'MID');
    
    // Tactical Balance: Advantage to team with more players in Midfield
    const hMidCount = homeEleven.filter(p => ZONES.MID.includes(p.tacticalPosition!)).length;
    const aMidCount = awayEleven.filter(p => ZONES.MID.includes(p.tacticalPosition!)).length;
    const tacticalBonus = (hMidCount - aMidCount) * 2;

    this.momentum += ((hMidPower - aMidPower) + tacticalBonus) * 0.08;
    this.momentum = Math.max(-12, Math.min(12, this.momentum));
    
    const totalPower = (50 + (this.momentum * 2.5) + randomInt(-8, 8));
    const isHomePossession = Math.random() * 100 < totalPower;
    
    if (isHomePossession) this.possessionCount.home++; else this.possessionCount.away++;
    
    this.simulateHiddenActions(isHomePossession ? homeEleven : awayEleven, isHomePossession ? awayEleven : homeEleven, playerStats);
    
    let event: MatchEvent | null = null;
    let slowMotion = false;
    
    const attackingTeam = isHomePossession ? homeTeam : awayTeam;
    const defendingTeam = isHomePossession ? awayTeam : homeTeam;
    const attPlayers = isHomePossession ? homeEleven : awayEleven;
    const defPlayers = isHomePossession ? awayEleven : homeEleven;

    // 1. Critical Events (Cards/Injuries)
    if (Math.random() < 0.009 * chaosMultiplier) {
       event = this.resolveDisciplinary(minute, defPlayers, defendingTeam, playerStats);
    } else if (Math.random() < 0.004) {
       event = this.resolveInjury(minute, attPlayers, defPlayers, homeTeam, awayTeam, playerStats, currentDate);
    }
    
    // 2. Attack Sequence (Differentiated by skill)
    if (!event && Math.random() < 0.17 * chaosMultiplier) { 
       event = this.resolveAttackSequence(minute, attackingTeam, attPlayers, defendingTeam, defPlayers, playerStats);
    }

    // 3. Possession Flow
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

     let homeStr = getTeamStrength(homePlayers, home.reputation) + 12; 
     let awayStr = getTeamStrength(awayPlayers, away.reputation);
     
     homeStr += randomInt(-15, 25);
     awayStr += randomInt(-15, 25);

     const diff = homeStr - awayStr;
     let homeScore = 0, awayScore = 0;

     if (diff > 60) { homeScore = randomInt(2, 6); awayScore = randomInt(0, 1); }
     else if (diff > 30) { homeScore = randomInt(1, 4); awayScore = randomInt(0, 1); }
     else if (diff > 0) { homeScore = randomInt(1, 3); awayScore = randomInt(0, 2); }
     else if (diff > -30) { homeScore = randomInt(0, 2); awayScore = randomInt(1, 3); }
     else { homeScore = randomInt(0, 1); awayScore = randomInt(2, 6); }

     const stats: Record<string, PlayerMatchStats> = {};
     [...homePlayers, ...awayPlayers].forEach(p => {
        stats[p.id] = { rating: 5.5 + Math.random() * 3, goals: 0, assists: 0, shots: 0, passesAttempted: 10, passesCompleted: 8, dribblesAttempted: 0, dribblesCompleted: 0, tacklesAttempted: 0, tacklesCompleted: 0, foulsCommitted: 0, shotsOnTarget: 0, saves: 0 };
        // Simulate cards
        if (Math.random() < 0.15) stats[p.id].card = 'YELLOW';
        else if (Math.random() < 0.01) stats[p.id].card = 'RED';
     });
     
     const assignGoals = (players: Player[], count: number) => {
        const pool = players.filter(p => p.positions.some(pos => pos.includes('ST') || pos.includes('AM') || pos.includes('W')));
        const finalPool = pool.length > 0 ? pool : players;
        for(let i=0; i<count; i++) {
           const scorer = finalPool[randomInt(0, finalPool.length-1)];
           if(stats[scorer.id]) {
              stats[scorer.id].goals++;
              stats[scorer.id].shots++;
              stats[scorer.id].shotsOnTarget++;
           }
        }
     };
     assignGoals(homePlayers, homeScore);
     assignGoals(awayPlayers, awayScore);

     return { homeScore, awayScore, stats };
  }

  private static resolvePossession(minute: number, team: Club, players: Player[]): MatchEvent {
     let phrases = PHRASES.POSSESSION_MID;
     const p = players[randomInt(0, players.length-1)];
     const intensity = this.getPlayerZoneIntensity(p);

     if (intensity === 1) phrases = PHRASES.POSSESSION_DEF;
     else if (intensity >= 4) phrases = PHRASES.ATTACK_3_4;

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

  private static resolveDisciplinary(minute: number, players: Player[], team: Club, stats: Record<string, PlayerMatchStats>): MatchEvent | null {
     if (players.length === 0) return null;
     const p = players[randomInt(0, players.length - 1)];
     
     // Aggression increases chance of red cards
     const aggressionMod = (p.stats.mental.aggression - 10) * 0.01;
     const isRed = Math.random() < (0.12 + aggressionMod);
     
     const yTexts = [`Tarjeta amarilla para ${p.name}.`, `${p.name} es amonestado.`, `Dura entrada de ${p.name}, amarilla.`];
     const rTexts = [`¡ROJA! ${p.name} expulsado.`, `¡A la calle ${p.name}!`, `Roja directa para ${p.name}.`];
     
     if (stats[p.id]) {
        // If already yellow, potential second yellow?
        if (stats[p.id].card === 'YELLOW' && !isRed) {
           if (Math.random() < 0.2) {
              stats[p.id].card = 'RED'; // Convert to red (second yellow logic handled visually as Red)
              return {
                 minute,
                 type: 'RED_CARD',
                 teamId: team.id,
                 playerId: p.id,
                 text: `¡Segunda amarilla para ${p.name}! Se va a la calle.`,
                 importance: 'HIGH',
                 intensity: 4
              };
           }
           return null; // Ignore duplicate yellow
        } else {
           stats[p.id].card = isRed ? 'RED' : 'YELLOW';
        }
     }

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

  private static resolveInjury(minute: number, hPlayers: Player[], aPlayers: Player[], h: Club, a: Club, stats: Record<string, PlayerMatchStats>, currentDate?: Date): MatchEvent | null {
     const allPlayers = [...hPlayers, ...aPlayers];
     if (allPlayers.length === 0) return null;
     const p = allPlayers[randomInt(0, allPlayers.length - 1)];
     const team = p.clubId === h.id ? h : a;
     
     // Select Real Injury
     const injuryDef = INJURY_TYPES[randomInt(0, INJURY_TYPES.length - 1)];
     const days = randomInt(injuryDef.min, injuryDef.max);
     
     // Store injury in match stats so it can be applied later
     if (stats[p.id]) {
        stats[p.id].sustainedInjury = { type: injuryDef.name, days: days };
     }
     
     const squadPlayers = world.getPlayersByClub(team.id).filter(sp => !sp.isStarter && !sp.injury && !sp.suspension);
     let subText = "";
     if (squadPlayers.length > 0) {
        const sub = squadPlayers[0];
        subText = ` Entra ${sub.name}.`;
        const teamArray = p.clubId === h.id ? hPlayers : aPlayers;
        const idx = teamArray.findIndex(pl => pl.id === p.id);
        if (idx !== -1) teamArray[idx] = sub;
     }

     return { minute, type: 'INJURY', teamId: team.id, text: `${p.name} cae lesionado (${injuryDef.name}).${subText}`, importance: 'MEDIUM', intensity: 2 };
  }

  private static resolveAttackSequence(minute: number, attTeam: Club, attPlayers: Player[], defTeam: Club, defPlayers: Player[], stats: Record<string, PlayerMatchStats>): MatchEvent | null {
     if (attPlayers.length === 0 || defPlayers.length === 0) return null;

     const creator = attPlayers[randomInt(0, attPlayers.length - 1)];
     const finisher = attPlayers[randomInt(0, attPlayers.length - 1)];
     const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
     
     // VISION DUEL: Does the creator see the pass?
     const visionCheck = this.getEffectiveAbility(creator, 'vision') + randomInt(-20, 20);
     const defAnticipation = defPlayers.reduce((acc, dp) => acc + this.getEffectiveAbility(dp, 'anticipation'), 0) / defPlayers.length;
     
     if (visionCheck < defAnticipation - 15) {
        return { minute, type: 'POSSESSION', text: `${defTeam.name} corta el intento de avance de ${creator.name}.`, teamId: defTeam.id, importance: 'LOW', intensity: 2 };
     }

     const attackType = randomInt(1, 5); 
     const typeMap: any = { 1: 'CROSS', 2: 'LONG_SHOT', 3: 'THROUGH_BALL', 4: 'CORNER', 5: 'NORMAL' };
     return this.resolveShot(minute, attTeam, finisher, gk, creator, stats, typeMap[attackType]);
  }

  private static resolveShot(minute: number, team: Club, shooter: Player, gk: Player, assister: Player, stats: Record<string, PlayerMatchStats>, type: string): MatchEvent {
     // Record the shot attempt
     if (stats[shooter.id]) stats[shooter.id].shots++;

     // ATTRIBUTE DUEL SYSTEM
     let attackAttr = 'finishing';
     let defenseAttr = 'reflexes';
     
     if (type === 'CROSS' || type === 'CORNER') {
        attackAttr = 'heading';
        defenseAttr = 'aerialReach';
     } else if (type === 'LONG_SHOT') {
        attackAttr = 'longShots';
        defenseAttr = 'positioning';
     }

     // Mental factors
     const composure = this.getEffectiveAbility(shooter, 'composure') / 10;
     const pressure = randomInt(0, 10);
     
     const shotPower = this.getEffectiveAbility(shooter, attackAttr) + composure - pressure + randomInt(-20, 30);
     const savePower = this.getEffectiveAbility(gk, defenseAttr) + (gk.stats.mental.positioning * 5) + randomInt(-20, 20);
     
     const isTarget = shotPower > savePower - 25;
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

  private static simulateHiddenActions(att: Player[], def: Player[], stats: Record<string, PlayerMatchStats>) {
    att.forEach(p => { 
      if (stats[p.id]) { 
        stats[p.id].passesAttempted++; 
        if (randomInt(0, 100) < (p.stats.technical.passing * 5)) stats[p.id].passesCompleted++; 
      } 
    });
    def.forEach(p => { 
      if (Math.random() < 0.15 && stats[p.id]) { 
        stats[p.id].tacklesAttempted++; 
        if (randomInt(0, 100) < (p.stats.technical.tackling * 5)) stats[p.id].tacklesCompleted++; 
      } 
    });
  }

  private static updatePlayerRating(player: Player, s: PlayerMatchStats) {
    if (!s) return;
    let r = 6.0 + s.goals * 1.6 + s.assists * 1.1 + s.saves * 0.35;
    if (s.passesAttempted > 0) {
       const pct = s.passesCompleted / s.passesAttempted;
       r += (pct - 0.7) * 2;
    }
    s.rating = Math.max(1, Math.min(10, Math.round(r * 10) / 10));
    s.participationPhrase = s.rating > 8 ? "Partidazo." : s.rating > 6.5 ? "Sólido." : "Discreto.";
  }

  private static compileTeamStats(teamId: string, playerStats: Record<string, PlayerMatchStats>, possession: number): TeamMatchStats {
    let onTarget = 0, fouls = 0, totalShots = 0;
    Object.values(playerStats).forEach(ps => { 
       onTarget += ps.shotsOnTarget; 
       fouls += ps.foulsCommitted;
       totalShots += ps.shots; // Sum real shots from player stats
    });
    
    // Fallback if simulation didn't record misses correctly in previous versions, but now it should.
    // If totalShots < onTarget (impossible but check), fix it.
    if (totalShots < onTarget) totalShots = Math.round(onTarget * 1.5);

    return { possession: Math.round(possession), shots: totalShots, shotsOnTarget: onTarget, fouls: randomInt(5, 15), corners: randomInt(2, 8) };
  }

  private static calculateZonePower(players: Player[], zone: PitchZone): number {
     const zonePlayers = players.filter(p => ZONES[zone].includes(p.tacticalPosition!));
     if (zonePlayers.length === 0) return 10;
     return zonePlayers.reduce((acc, p) => acc + (this.getEffectiveAbility(p) / 15), 0);
  }

  static finalizeSeasonStats(homePlayers: Player[], awayPlayers: Player[], matchStats: Record<string, PlayerMatchStats>, homeScore: number, awayScore: number, competitionId: string) {
      const updateStats = (players: Player[], isHome: boolean) => {
        const myScore = isHome ? homeScore : awayScore;
        const opponentScore = isHome ? awayScore : homeScore;
        const moraleMod = myScore > opponentScore ? 5 : myScore === opponentScore ? 0 : -8;

        players.forEach(p => {
          const stats = matchStats[p.id];
          if (!stats) return;
          
          // 1. Update Global Season Stats
          p.seasonStats.appearances += 1;
          p.seasonStats.goals += stats.goals;
          p.seasonStats.assists += stats.assists;
          p.seasonStats.totalRating += stats.rating;
          
          if (p.positions.includes(Position.GK)) {
             if (opponentScore === 0) p.seasonStats.cleanSheets += 1;
             p.seasonStats.conceded += opponentScore; // Track conceded goals
          }

          // 2. Update Competition Specific Stats
          if (!p.statsByCompetition[competitionId]) {
             p.statsByCompetition[competitionId] = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 };
          }
          const compStats = p.statsByCompetition[competitionId];
          compStats.appearances += 1;
          compStats.goals += stats.goals;
          compStats.assists += stats.assists;
          compStats.totalRating += stats.rating;
          if (p.positions.includes(Position.GK)) {
             if (opponentScore === 0) compStats.cleanSheets += 1;
             compStats.conceded += opponentScore;
          }
          
          // 3. Process Injuries from Match
          if (stats.sustainedInjury) {
             p.injury = {
                type: stats.sustainedInjury.type,
                daysLeft: stats.sustainedInjury.days
             };
             // Ensure injured players are removed from starter list immediately for future logic
             p.isStarter = false;
             p.tacticalPosition = undefined;
          }

          // 4. Process Cards & Suspensions
          if (stats.card === 'RED') {
             // Direct Red: 1 to 3 matches ban
             const matches = randomInt(1, 3);
             p.suspension = { type: 'RED_CARD', matchesLeft: matches };
             // Removed from squad
             p.isStarter = false;
             p.tacticalPosition = undefined;
          } else if (stats.card === 'YELLOW') {
             p.yellowCardsAccumulated = (p.yellowCardsAccumulated || 0) + 1;
             // Suspension logic: 5 yellows = 1 match ban
             if (p.yellowCardsAccumulated >= 5) {
                p.suspension = { type: 'YELLOW_ACCUMULATION', matchesLeft: 1 };
                p.yellowCardsAccumulated = 0; // Reset or keep accumulating? Typically resets or goes to higher threshold. Lets reset for simplicity.
                p.isStarter = false;
                p.tacticalPosition = undefined;
             }
          }

          // Fatigue and Morale logic remains global
          const fatigue = 28 - (p.stats.physical.stamina * 0.8) + randomInt(0, 6);
          // Apply rounding to prevent decimals
          p.fitness = Math.max(0, Math.round(p.fitness - fatigue));
          p.morale = Math.max(0, Math.min(100, Math.round(p.morale + moraleMod + (stats.rating > 7.5 ? 2 : -2))));
        });
      };
      updateStats(homePlayers, true);
      updateStats(awayPlayers, false);
  }
}

export class ProfileNarrativeEngine {
    static generateScoutingReport(player: Player): string[] {
        return [
            "Jugador con gran potencial.",
            "Destaca por su técnica depurada.",
            "Necesita mejorar su consistencia."
        ];
    }

    static generateHeadline(player: Player): string {
        if (player.currentAbility > 160) return "Una estrella mundial en su apogeo";
        if (player.currentAbility > 140) return "Un jugador de calidad para cualquier equipo";
        if (player.age < 21 && player.potentialAbility > 150) return "Una joven promesa con futuro brillante";
        return "Un jugador profesional competente";
    }
}
