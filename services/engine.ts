
import { Player, Club, MatchEvent, PlayerMatchStats, TeamMatchStats, PitchZone, Position, TacticalReport, TacticSettings } from '../types';
import { randomInt } from './utils';
import { world } from './worldManager';

// --- NEW TACTICAL COORDINATE SYSTEM ---

type TacticalLine = 'GK' | 'SW' | 'DEF' | 'DM' | 'MID' | 'AM' | 'ATT';
type TacticalLane = 1 | 2 | 3 | 4 | 5; // 1=Left, 2=InnerLeft, 3=Center, 4=InnerRight, 5=Right

interface SlotMetadata {
    line: TacticalLine;
    lane: TacticalLane;
}

// Map every tactical slot (0-30) to coordinates
export const SLOT_CONFIG: Record<number, SlotMetadata> = {
    0: { line: 'GK', lane: 3 },
    
    // LIBERO / SWEEPER
    31: { line: 'SW', lane: 3 }, // LIB

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
    GOAL_NORMAL: [
        (team: string, scorer: string) => `¡GOL de ${scorer}! Definición impecable.`,
        (team: string, scorer: string) => `¡GOLAZO de ${team}! ${scorer} la manda a guardar.`,
        (team: string, scorer: string) => `${scorer} no perdona en el mano a mano. ¡GOL!`,
        (team: string, scorer: string) => `¡La red se infla! ${scorer} marca para ${team}.`
    ],
    CHANCE_SAVE: [
        (team: string, shooter: string, gk: string) => `¡Paradón de ${gk} a tiro de ${shooter}!`,
        (team: string, shooter: string, gk: string) => `${gk} vuela para evitar el gol de ${shooter}.`,
        (team: string, shooter: string, gk: string) => `Mano salvadora de ${gk} ante el remate de ${shooter}.`
    ],
    CHANCE_MISS: [
        (team: string, shooter: string) => `${shooter} dispara... ¡Fuera!`,
        (team: string, shooter: string) => `El remate de ${shooter} se va desviado.`,
        (team: string, shooter: string) => `Ocasión desperdiciada por ${shooter}.`
    ]
};

export class ProfileNarrativeEngine {
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
  
  static initMatchStats(players: Player[]): Record<string, PlayerMatchStats> {
    const stats: Record<string, PlayerMatchStats> = {};
    players.forEach(p => {
      stats[p.id] = {
        rating: 6.0, 
        goals: 0, assists: 0, 
        condition: 100,
        minutesPlayed: 0,
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
    return stats;
  }

  static analyzeMatchup(home: Club, away: Club, hPlayers: Player[], aPlayers: Player[]) {}

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

  private static updatePhysicalCondition(players: Player[], stats: Record<string, PlayerMatchStats>, minute: number) {
      players.forEach(p => {
          if (!stats[p.id]) return;
          let drain = 0.15;
          const staminaMod = (15 - p.stats.physical.stamina) * 0.015;
          drain += staminaMod;
          const workRateCost = p.stats.mental.workRate * 0.012;
          drain += workRateCost;
          if (minute > 70) drain *= 1.4;
          if (minute > 85) drain *= 1.2;
          stats[p.id].condition = Math.max(1, stats[p.id].condition - drain);
      });
  }

  private static updatePlayerRating(player: Player, stat: PlayerMatchStats, concededGoals: number) {
      let r = 6.0; 
      r += stat.goals * 1.5;
      r += stat.assists * 1.0;
      r += stat.keyPasses * 0.2; 
      r += stat.dribblesCompleted * 0.05;
      if (stat.passesAttempted > 10) {
          const acc = stat.passesCompleted / stat.passesAttempted;
          if (acc > 0.85) r += 0.3;
          else if (acc < 0.60) r -= 0.2;
      }
      r += stat.keyTackles * 0.3;
      r += (stat.tacklesCompleted / 3) * 0.1; 
      r += (stat.interceptions / 3) * 0.1;
      if (player.positions.includes(Position.GK)) {
          r += stat.saves * 0.4;
      }
      r -= (stat.foulsCommitted * 0.15);
      if (stat.card === 'YELLOW') r -= 0.6;
      if (stat.card === 'RED') r -= 2.5;
      // Fix: Comparison between Position and "GK" string literal.
      if (player.positions.some(pos => pos.includes('D') || pos === Position.GK)) {
          r -= (concededGoals * 0.5);
      }
      stat.rating = Math.max(2.0, Math.min(10.0, r));
  }

  private static simulateBackgroundActivity(minute: number, hPlayers: Player[], aPlayers: Player[], stats: Record<string, PlayerMatchStats>) {
      const allActive = [...hPlayers, ...aPlayers];
      allActive.forEach(p => {
          if (!stats[p.id]) return;
          const s = stats[p.id];
          s.minutesPlayed++;
          if (Math.random() < 0.25) { 
              s.passesAttempted++;
              const passSkill = (p.stats.technical.passing || 10) + (p.stats.mental.decisions || 10);
              if (Math.random() < 0.65 + (passSkill / 200)) s.passesCompleted++;
          }
          if (p.positions[0].includes('D') && Math.random() < 0.08) {
              s.interceptions++;
              s.headersAttempted++;
              if (Math.random() < 0.7) s.headersWon++;
          }
      });
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
    minute: number, 
    homeTeam: Club, 
    awayTeam: Club, 
    homeEleven: Player[], 
    awayEleven: Player[], 
    playerStats: Record<string, PlayerMatchStats>,
    homeTactics?: TacticSettings,
    awayTactics?: TacticSettings
  ): { event: MatchEvent | null, teamStats: { home: TeamMatchStats, away: TeamMatchStats }, slowMotion: boolean } {
    const activeHome = homeEleven.filter(p => p.tacticalPosition !== undefined).slice(0, 11);
    const activeAway = awayEleven.filter(p => p.tacticalPosition !== undefined).slice(0, 11);

    if (minute % 5 === 0) this.updatePhysicalCondition([...activeHome, ...activeAway], playerStats, minute);
    this.simulateBackgroundActivity(minute, activeHome, activeAway, playerStats);

    const hMentality = homeTactics?.mentality || 10;
    const aMentality = awayTactics?.mentality || 10;
    const hTempo = homeTactics?.tempo || 10;
    const aTempo = awayTactics?.tempo || 10;

    const globalIntensity = (hMentality + aMentality + hTempo + aTempo) / 35; // Slightly boosted base
    const baseEventRollThreshold = 0.18 * globalIntensity; 

    const eventRoll = Math.random();
    let event: MatchEvent | null = null;
    let slowMotion = false;

    const calculateWeightedStr = (players: Player[], mentality: number) => {
        const base = players.reduce((s,p) => s + this.getEffectiveAbility(p), 0);
        const offenseMult = 1 + ((mentality - 10) * 0.06);
        return base * offenseMult;
    };

    const homeStr = calculateWeightedStr(activeHome, hMentality);
    const awayStr = calculateWeightedStr(activeAway, aMentality);
    const totalStr = homeStr + awayStr;
    const baseHomeProb = homeStr / totalStr;
    
    const isHomeAttack = Math.random() < (baseHomeProb + (this.momentum * 0.1));
    const attTeam = isHomeAttack ? homeTeam : awayTeam;
    const defTeam = isHomeAttack ? awayTeam : homeTeam;
    const attPlayers = isHomeAttack ? activeHome : activeAway;
    const defPlayers = isHomeAttack ? activeAway : activeHome;
    const attMentality = isHomeAttack ? hMentality : aMentality;

    if (eventRoll < baseEventRollThreshold) { 
        const actionType = Math.random();
        const scoringChanceThreshold = 0.45 + ((attMentality - 10) * 0.025);

        if (actionType < scoringChanceThreshold) {
            const shooter = this.pickActor(attPlayers, 'ATT') || attPlayers[0];
            const gk = defPlayers.find(p => p.positions.includes(Position.GK)) || defPlayers[0];
            const assister = this.pickActor(attPlayers.filter(p => p.id !== shooter.id), 'MID');
            
            if (playerStats[shooter.id]) playerStats[shooter.id].shots++;
            
            const finish = this.getEffectiveAbility(shooter, 'finishing');
            const save = this.getEffectiveAbility(gk, 'reflexes');
            
            const tacticalFinishBonus = (attMentality - 10) * 3;
            if (finish + tacticalFinishBonus + randomInt(0, 50) > save + randomInt(0, 45)) {
                event = { minute, type: 'GOAL', text: PHRASES.GOAL_NORMAL[randomInt(0, PHRASES.GOAL_NORMAL.length-1)](attTeam.name, shooter.name), teamId: attTeam.id, playerId: shooter.id, importance: 'HIGH', intensity: 5 };
                if (playerStats[shooter.id]) { playerStats[shooter.id].goals++; playerStats[shooter.id].shotsOnTarget++; }
                if (assister && playerStats[assister.id]) playerStats[assister.id].assists++;
                this.momentum = isHomeAttack ? 0.3 : -0.3;
            } else {
                if (Math.random() < 0.6) {
                    event = { minute, type: 'CHANCE', text: PHRASES.CHANCE_SAVE[randomInt(0, PHRASES.CHANCE_SAVE.length-1)](attTeam.name, shooter.name, gk.name), teamId: attTeam.id, playerId: shooter.id, importance: 'MEDIUM', intensity: 4 };
                    if (playerStats[shooter.id]) playerStats[shooter.id].shotsOnTarget++;
                    if (playerStats[gk.id]) playerStats[gk.id].saves++;
                } else {
                    event = { minute, type: 'MISS', text: PHRASES.CHANCE_MISS[randomInt(0, PHRASES.CHANCE_MISS.length-1)](attTeam.name, shooter.name), teamId: attTeam.id, playerId: shooter.id, importance: 'LOW', intensity: 3 };
                }
            }
            slowMotion = true;
        } else if (actionType < 0.6) {
            const offender = this.pickActor(defPlayers);
            const victim = this.pickActor(attPlayers);
            if (offender && victim) {
                if (playerStats[offender.id]) playerStats[offender.id].foulsCommitted++;
                if (Math.random() < 0.25) {
                    event = { minute, type: 'YELLOW_CARD', text: `Tarjeta amarilla para ${offender.name} por dura entrada sobre ${victim.name}.`, teamId: defTeam.id, playerId: offender.id, importance: 'MEDIUM', intensity: 3 };
                    if (playerStats[offender.id]) playerStats[offender.id].card = 'YELLOW';
                }
            }
        }
    }

    const homeTeamStats = { possession: 50 + (this.momentum * 20), shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0 };
    const awayTeamStats = { possession: 50 - (this.momentum * 20), shots: 0, shotsOnTarget: 0, fouls: 0, corners: 0 };
    
    const hSc = activeHome.reduce((acc, p) => acc + (playerStats[p.id]?.goals || 0), 0);
    const aSc = activeAway.reduce((acc, p) => acc + (playerStats[p.id]?.goals || 0), 0);

    activeHome.forEach(p => { 
        if(playerStats[p.id]) {
            this.updatePlayerRating(p, playerStats[p.id], aSc);
            homeTeamStats.shots += playerStats[p.id].shots;
            homeTeamStats.shotsOnTarget += playerStats[p.id].shotsOnTarget;
            homeTeamStats.fouls += playerStats[p.id].foulsCommitted;
        }
    });
    activeAway.forEach(p => { 
        if(playerStats[p.id]) {
            this.updatePlayerRating(p, playerStats[p.id], hSc);
            awayTeamStats.shots += playerStats[p.id].shots;
            awayTeamStats.shotsOnTarget += playerStats[p.id].shotsOnTarget;
            awayTeamStats.fouls += playerStats[p.id].foulsCommitted;
        }
    });

    return { event, teamStats: { home: homeTeamStats, away: awayTeamStats }, slowMotion };
  }

  static simulateQuickMatch(homeId: string, awayId: string, squadType: string): { homeScore: number, awayScore: number, stats: Record<string, PlayerMatchStats> } {
      const home = world.getClub(homeId);
      const away = world.getClub(awayId);
      const homeSquad = world.getPlayersByClub(homeId).filter(p => p.squad === squadType);
      const awaySquad = world.getPlayersByClub(awayId).filter(p => p.squad === squadType);
      
      let homeRep = home ? home.reputation : 5000;
      let awayRep = away ? away.reputation : 5000;
      homeRep *= 1.25; 

      const total = homeRep + awayRep;
      const homeProb = homeRep / total;
      
      const poolRoll = Math.random();
      const topTeamFactor = (Math.max(homeRep, awayRep) > 7000) ? 0.08 : 0.02;
      
      let goalsPool = 0;
      if (poolRoll < (0.05 - topTeamFactor)) goalsPool = 0; 
      else if (poolRoll < 0.22) goalsPool = 1;
      else if (poolRoll < 0.52) goalsPool = 2;
      else if (poolRoll < 0.78) goalsPool = 3;
      else if (poolRoll < 0.94) goalsPool = 4;
      else goalsPool = 5;

      let h = 0, a = 0;
      const stats: Record<string, PlayerMatchStats> = {};

      const getScorer = (pool: Player[]) => {
          const attackers = pool.filter(p => p.positions[0].includes('S') || p.positions[0].includes('A'));
          const poolToPick = attackers.length > 0 && Math.random() < 0.85 ? attackers : pool;
          return poolToPick[randomInt(0, poolToPick.length - 1)];
      };

      const assignToStats = (p: Player, isGoal: boolean) => {
          if (!stats[p.id]) {
              stats[p.id] = { 
                  rating: 6.0 + Math.random() * 2, goals: 0, assists: 0, condition: 90, minutesPlayed: 90,
                  passesAttempted: 20, passesCompleted: 15, keyPasses: 0, shots: 0, shotsOnTarget: 0, 
                  dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0, tacklesAttempted: 0, 
                  tacklesCompleted: 0, keyTackles: 0, interceptions: 0, shotsBlocked: 0, 
                  headersAttempted: 0, headersWon: 0, keyHeaders: 0, foulsCommitted: 0, 
                  foulsReceived: 0, saves: 0 
              };
          }
          if (isGoal) {
              stats[p.id].goals++;
              stats[p.id].rating = Math.min(10, stats[p.id].rating + 1.3);
          } else {
              stats[p.id].assists++;
              stats[p.id].rating = Math.min(10, stats[p.id].rating + 0.9);
          }
      };

      for(let i = 0; i < goalsPool; i++) {
          if(Math.random() < homeProb) {
              h++;
              const scorer = getScorer(homeSquad);
              if (scorer) assignToStats(scorer, true);
              if (Math.random() < 0.7) {
                  const assister = homeSquad.filter(p => p.id !== (scorer?.id || ''))[randomInt(0, homeSquad.length - 2)];
                  if (assister) assignToStats(assister, false);
              }
          } else {
              a++;
              const scorer = getScorer(awaySquad);
              if (scorer) assignToStats(scorer, true);
              if (Math.random() < 0.7) {
                  const assister = awaySquad.filter(p => p.id !== (scorer?.id || ''))[randomInt(0, awaySquad.length - 2)];
                  if (assister) assignToStats(assister, false);
              }
          }
      }
      
      return { homeScore: h, awayScore: a, stats };
  }

  static finalizeSeasonStats(homeSquad: Player[], awaySquad: Player[], matchStats: Record<string, PlayerMatchStats>, hScore: number, aScore: number, competitionId: string) {
      const update = (p: Player, s: PlayerMatchStats, conceded: number) => {
          if (!p.seasonStats) p.seasonStats = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 };
          if (!p.statsByCompetition[competitionId]) p.statsByCompetition[competitionId] = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 };
          
          const rating = s.rating || 6.0;
          
          if (s.minutesPlayed > 0 || s.goals > 0 || s.assists > 0) {
              p.seasonStats.appearances++;
              p.seasonStats.goals += s.goals;
              p.seasonStats.assists += s.assists;
              if (conceded === 0 && (p.positions.includes(Position.GK) || p.positions.some(pos => pos.includes('D')))) p.seasonStats.cleanSheets++;
              p.seasonStats.conceded += conceded;
              p.seasonStats.totalRating += rating;

              const comp = p.statsByCompetition[competitionId];
              comp.appearances++;
              comp.goals += s.goals;
              comp.assists += s.assists;
              if (conceded === 0 && (p.positions.includes(Position.GK) || p.positions.some(pos => pos.includes('D')))) comp.cleanSheets++;
              comp.conceded += conceded;
              comp.totalRating += rating;
          }
      };

      homeSquad.forEach(p => {
          let s = matchStats[p.id];
          if (!s) s = { rating: 6.0, goals: 0, assists: 0, condition: 100, minutesPlayed: 0, passesAttempted: 0, passesCompleted: 0, keyPasses: 0, shots: 0, shotsOnTarget: 0, dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0, tacklesAttempted: 0, tacklesCompleted: 0, keyTackles: 0, interceptions: 0, shotsBlocked: 0, headersAttempted: 0, headersWon: 0, keyHeaders: 0, foulsCommitted: 0, foulsReceived: 0, saves: 0 };
          update(p, s, aScore);
      });

      awaySquad.forEach(p => {
          let s = matchStats[p.id];
          if (!s) s = { rating: 6.0, goals: 0, assists: 0, condition: 100, minutesPlayed: 0, passesAttempted: 0, passesCompleted: 0, keyPasses: 0, shots: 0, shotsOnTarget: 0, dribblesAttempted: 0, dribblesCompleted: 0, offsides: 0, tacklesAttempted: 0, tacklesCompleted: 0, keyTackles: 0, interceptions: 0, shotsBlocked: 0, headersAttempted: 0, headersWon: 0, keyHeaders: 0, foulsCommitted: 0, foulsReceived: 0, saves: 0 };
          update(p, s, hScore);
      });
  }

  static generateTacticalAnalysis(myTeam: Club, oppTeam: Club, myPlayers: Player[], myStats: Record<string, PlayerMatchStats>, myScore: number, oppScore: number, minute: number): TacticalReport {
      let strength = "Defensa Sólida";
      let weakness = "Falta de Posesión";
      let suggestion = "Mantener el esquema.";
      let summary = "Partido disputado en el medio campo.";
      
      if (myScore > oppScore) {
          summary = "Estamos dominando el marcador, el equipo se siente cómodo.";
          strength = "Efectividad en ataque";
          suggestion = "Bajar el ritmo y controlar la posesión.";
      } else if (myScore < oppScore) {
          summary = "El rival nos está superando en las áreas clave.";
          weakness = "Fragilidad defensiva";
          suggestion = "Adelantar líneas y presionar más arriba.";
      }

      return {
          title: minute >= 90 ? "Informe Final" : "Charla de Vestuario",
          summary,
          keyStrength: strength,
          keyWeakness: weakness,
          suggestion
      };
  }
}
