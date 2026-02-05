
import { Player, Position, Club, Fixture, TableEntry, Competition, MatchStage, Staff, PlayerStats } from "../types";
import { world } from "./worldManager";
import { randomInt, generateUUID } from "./utils";
import { CompetitionSummary } from "../components/SeasonSummaryModal";
import { Scheduler } from "./scheduler";
import { MatchSimulator } from "./engine"; 

export class LifecycleManager {

  // Renamed to broader "ProcessDailyPhysicals" to cover injuries
  static recoverDailyFitness() {
     const clubPhysioMap = new Map<string, number>();
     world.clubs.forEach(c => {
        const physios = world.getStaffByClub(c.id).filter(s => s.role === 'PHYSIO');
        const avg = physios.length > 0 ? physios.reduce((a,b) => a + b.attributes.physiotherapy, 0) / physios.length : 5;
        clubPhysioMap.set(c.id, avg);
     });

     world.players.forEach(p => {
        const physioScore = clubPhysioMap.get(p.clubId) || 5;
        const physioMult = 1 + (physioScore / 40); 

        // Fitness Recovery
        if (p.fitness < 100) {
           const recovery = (2 + (p.stats.physical.naturalFitness * 0.65)) * physioMult;
           p.fitness = Math.min(100, Math.round(p.fitness + recovery));
        }

        // Injury Recovery
        if (p.injury) {
           p.injury.daysLeft -= 1;
           if (p.injury.daysLeft <= 0) {
              p.injury = undefined;
              // Optional: notify recovery?
           }
        }
     });
  }

  // New: Decrement suspensions for clubs that just played
  static processPostMatchSuspensions(homeTeamId: string, awayTeamId: string) {
     const processTeam = (clubId: string) => {
        const suspendedPlayers = world.getPlayersByClub(clubId).filter(p => p.suspension && p.suspension.matchesLeft > 0);
        suspendedPlayers.forEach(p => {
           if (p.suspension) {
              p.suspension.matchesLeft -= 1;
              if (p.suspension.matchesLeft <= 0) {
                 p.suspension = undefined;
              }
           }
        });
     };
     processTeam(homeTeamId);
     processTeam(awayTeamId);
  }
  
  static processEndOfSeason(fixtures: Fixture[], userClubId?: string, currentDate?: Date): CompetitionSummary[] {
    
    // 1. Force finish all cups recursively (Loop until a Final is played)
    const refDate = currentDate || new Date();
    world.competitions.filter(c => c.type !== 'LEAGUE').forEach(cup => {
        this.resolveCupIdeally(cup, fixtures, refDate);
    });

    // 2. Resolve pending league matches (if any weird leftovers)
    fixtures.filter(f => !f.played && world.getClub(f.homeTeamId)).forEach(f => {
        const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, 'SENIOR');
        f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
        const hEleven = world.selectBestEleven(f.homeTeamId, 'SENIOR');
        const aEleven = world.selectBestEleven(f.awayTeamId, 'SENIOR');
        MatchSimulator.finalizeSeasonStats(hEleven, aEleven, stats, homeScore, awayScore, f.competitionId);
    });

    // 3. Generate Summaries
    const summaries: CompetitionSummary[] = world.competitions.map(comp => {
       let championId = "";
       let championName = "Sin Ganador";

       if (comp.type === 'LEAGUE') {
          const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
          if (table.length > 0) {
             championId = table[0].clubId;
             championName = table[0].clubName;
             const c = world.getClub(championId);
             if (c && currentDate) c.honours.unshift({ name: comp.name, year: currentDate.getFullYear() });
          }
       } else {
          // Find the Played Final
          const finalMatch = fixtures.find(f => f.competitionId === comp.id && f.stage === 'FINAL' && f.played);
          if (finalMatch) {
             const hScore = finalMatch.homeScore || 0;
             const aScore = finalMatch.awayScore || 0;
             let winnerId = "";
             
             if (hScore > aScore) winnerId = finalMatch.homeTeamId;
             else if (aScore > hScore) winnerId = finalMatch.awayTeamId;
             else {
                // Ensure tie-break exists even if simulation missed it
                if (finalMatch.penaltyHome === undefined) {
                    let pH = 0, pA = 0;
                    while(pH === pA) { pH = randomInt(3,5); pA = randomInt(3,5); }
                    finalMatch.penaltyHome = pH;
                    finalMatch.penaltyAway = pA;
                }
                winnerId = finalMatch.penaltyHome! > finalMatch.penaltyAway! ? finalMatch.homeTeamId : finalMatch.awayTeamId;
             }

             if (winnerId) {
                championId = winnerId;
                championName = world.getClub(winnerId)?.name || "Equipo Desconocido";
                const c = world.getClub(championId);
                if (c && currentDate) c.honours.unshift({ name: comp.name, year: currentDate.getFullYear() });
             }
          }
       }

       // Player Awards
       const eligiblePlayers = world.players.filter(p => (p.statsByCompetition[comp.id]?.appearances || 0) > 0);
       if (eligiblePlayers.length === 0) {
          return {
             compId: comp.id, compName: comp.name, compType: comp.type, championId, championName,
             topScorer: { name: 'N/A', club: '', value: 0 },
             topAssists: { name: 'N/A', club: '', value: 0 },
             bestGK: { name: 'N/A', club: '', value: '0.00' },
             bestDF: { name: 'N/A', club: '', value: '0.00' }
          };
       }

       const getStats = (p: Player) => p.statsByCompetition[comp.id];
       const topScorer = [...eligiblePlayers].sort((a,b) => getStats(b).goals - getStats(a).goals)[0];
       const topAssister = [...eligiblePlayers].sort((a,b) => getStats(b).assists - getStats(a).assists)[0];
       const bestGK = [...eligiblePlayers].filter(p => p.positions.includes(Position.GK) && getStats(p).appearances > 2).sort((a,b) => (getStats(b).totalRating/(getStats(b).appearances || 1)) - (getStats(a).totalRating/(getStats(a).appearances || 1)))[0];
       const bestDF = [...eligiblePlayers].filter(p => p.positions.some(pos => pos.includes("DF") || pos === Position.SW) && getStats(p).appearances > 2).sort((a,b) => (getStats(b).totalRating/(getStats(b).appearances || 1)) - (getStats(a).totalRating/(getStats(a).appearances || 1)))[0];

       return {
          compId: comp.id, compName: comp.name, compType: comp.type, championId, championName,
          topScorer: topScorer ? { name: topScorer.name, club: world.getClub(topScorer.clubId)?.name || '', value: getStats(topScorer).goals } : { name: 'N/A', club: '', value: 0 },
          topAssists: topAssister ? { name: topAssister.name, club: world.getClub(topAssister.clubId)?.name || '', value: getStats(topAssister).assists } : { name: 'N/A', club: '', value: 0 },
          bestGK: bestGK ? { name: bestGK.name, club: world.getClub(bestGK.clubId)?.name || '', value: (getStats(bestGK).totalRating/getStats(bestGK).appearances).toFixed(2) } : { name: 'N/A', club: '', value: '0.00' },
          bestDF: bestDF ? { name: bestDF.name, club: world.getClub(bestDF.clubId)?.name || '', value: (getStats(bestDF).totalRating/getStats(bestDF).appearances).toFixed(2) } : { name: 'N/A', club: '', value: '0.00' }
       };
    });

    // 4. Process Promotions, Relegations and Qualification
    this.handleLeagueMovements(fixtures, currentDate, userClubId);

    const seasonYear = currentDate ? currentDate.getFullYear() : 2008;

    // 5. Development & History
    world.players.forEach(player => {
      this.updatePlayerDevelopment(player);
      if (player.seasonStats.appearances > 0) {
         player.history.push({ year: seasonYear, clubId: player.clubId, stats: { ...player.seasonStats } });
      }
      player.seasonStats = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 };
      player.statsByCompetition = {}; 
    });

    // 6. Retirement & Regens
    const retiredIds: string[] = [];
    world.players.forEach(p => { if (p.age > 34 && Math.random() < (p.age - 32) * 0.20) retiredIds.push(p.id); });
    world.players = world.players.filter(p => !retiredIds.includes(p.id));

    const nextSeasonYear = seasonYear + 1;
    world.clubs.forEach(club => {
      const newYouthNames: string[] = [];
      for(let i=0; i<3; i++) {
         const pos = [Position.GK, Position.DC, Position.MC, Position.ST][randomInt(0, 3)];
         const regen = world.createRandomPlayer(club.id, pos, 15, 16, nextSeasonYear);
         regen.squad = 'U20'; 
         world.players.push(regen);
         if (club.id === userClubId) newYouthNames.push(regen.name);
      }
      if (club.id === userClubId && newYouthNames.length > 0 && currentDate) {
         world.addInboxMessage('SQUAD', 'Incorporación de Juveniles', `Se han incorporado ${newYouthNames.length} nuevos jugadores al equipo Sub-20 para la temporada ${nextSeasonYear}.`, currentDate, club.id);
      }
    });

    return summaries;
  }

  // RECURSIVE CUP RESOLVER
  private static resolveCupIdeally(cup: Competition, fixtures: Fixture[], currentDate: Date) {
      let limit = 0;
      let hasFinal = fixtures.some(f => f.competitionId === cup.id && f.stage === 'FINAL' && f.played);
      
      // Use a local simulation date to ensure we progress through rounds logically
      // even if we are simulating everything in one go at season end.
      let simDate = new Date(currentDate);

      while (!hasFinal && limit < 12) {
          // 1. Find matches of this cup that are NOT played
          const pending = fixtures.filter(f => f.competitionId === cup.id && !f.played);
          
          if (pending.length > 0) {
              // Force play them
              pending.forEach(f => {
                  const { homeScore, awayScore, stats } = MatchSimulator.simulateQuickMatch(f.homeTeamId, f.awayTeamId, 'SENIOR');
                  f.played = true; f.homeScore = homeScore; f.awayScore = awayScore;
                  if (homeScore === awayScore) {
                      let pH = 0, pA = 0;
                      while(pH === pA) { pH = randomInt(3,5); pA = randomInt(3,5); }
                      f.penaltyHome = pH; f.penaltyAway = pA;
                  }
                  const hEleven = world.selectBestEleven(f.homeTeamId, 'SENIOR');
                  const aEleven = world.selectBestEleven(f.awayTeamId, 'SENIOR');
                  MatchSimulator.finalizeSeasonStats(hEleven, aEleven, stats, homeScore, awayScore, f.competitionId);
                  // Ensure we reduce suspensions for simulated matches
                  this.processPostMatchSuspensions(f.homeTeamId, f.awayTeamId);
              });
          }

          // 2. Trigger "Next Round" logic using the simulation date
          const nextRoundFixtures = this.processCompetitionProgress(fixtures, simDate);
          
          if (nextRoundFixtures.length > 0) {
              fixtures.push(...nextRoundFixtures);
              // Advance sim date for the next round (2 weeks)
              simDate.setDate(simDate.getDate() + 14);
          } else {
              // No more rounds generated? Maybe we just finished the final?
              hasFinal = fixtures.some(f => f.competitionId === cup.id && f.stage === 'FINAL' && f.played);
              if (hasFinal) break; 
              
              limit++; 
          }
          
          // Check again for loop condition
          hasFinal = fixtures.some(f => f.competitionId === cup.id && f.stage === 'FINAL' && f.played);
          limit++;
      }
  }

  private static handleLeagueMovements(fixtures: Fixture[], currentDate?: Date, userClubId?: string) {
      if (!currentDate) return;

      const t1 = world.getLeagueTable('L_ARG_1', fixtures, 'SENIOR');
      const t2 = world.getLeagueTable('L_ARG_2', fixtures, 'SENIOR');

      if (t1.length < 2 || t2.length < 2) return;

      const relegatedTeams = t1.slice(-2); 
      const promotedTeams = t2.slice(0, 2); 

      // Reset previous qualifications
      world.clubs.forEach(c => c.qualifiedFor = null);

      // FIX: Increase to 6 teams each to ensure we have enough for 32 team pools
      const libTeams = t1.slice(0, 6);
      const sudTeams = t1.slice(6, 12);

      relegatedTeams.forEach(r => {
         const club = world.getClub(r.clubId);
         if (club) {
            club.leagueId = 'L_ARG_2'; 
            if (club.id === userClubId) {
               world.addInboxMessage('COMPETITION', 'DESCENSO CONSUMADO', `Día triste para el club. Hemos descendido a la Segunda División.`, currentDate, club.id);
            } else {
               world.addInboxMessage('COMPETITION', 'Noticias de Liga', `El ${club.name} ha descendido a Segunda División.`, currentDate, club.id);
            }
         }
      });

      promotedTeams.forEach(p => {
         const club = world.getClub(p.clubId);
         if (club) {
            club.leagueId = 'L_ARG_1'; 
            if (club.id === userClubId) {
               world.addInboxMessage('COMPETITION', '¡ASCENSO!', `¡Objetivo cumplido! Jugaremos en Primera División la próxima temporada.`, currentDate, club.id);
            } else {
               world.addInboxMessage('COMPETITION', 'Noticias de Liga', `El ${club.name} ha ascendido a Primera División.`, currentDate, club.id);
            }
         }
      });

      libTeams.forEach(l => {
         const club = world.getClub(l.clubId);
         if (club) {
            club.qualifiedFor = 'CONT_LIB';
            if (club.id === userClubId) world.addInboxMessage('COMPETITION', 'Clasificación Continental', `Nos hemos clasificado para la COPA LIBERTADORES.`, currentDate, club.id);
         }
      });

      sudTeams.forEach(s => {
         const club = world.getClub(s.clubId);
         if (club) {
            club.qualifiedFor = 'CONT_SUD';
            if (club.id === userClubId) world.addInboxMessage('COMPETITION', 'Clasificación Continental', `Nos hemos clasificado para la COPA SUDAMERICANA.`, currentDate, club.id);
         }
      });
  }

  static checkBirthdays(currentDate: Date) {
    world.players.forEach(player => {
      const bDate = new Date(player.birthDate);
      if (bDate.getMonth() === currentDate.getMonth() && bDate.getDate() === currentDate.getDate()) {
        player.age += 1;
      }
    });
  }

  static processCompetitionProgress(fixtures: Fixture[], currentDate: Date): Fixture[] {
      const newFixtures: Fixture[] = [];
      const cups = world.competitions.filter(c => c.type === 'CUP' || c.type.startsWith('CONTINENTAL') || c.type === 'GLOBAL');
      
      cups.forEach(cup => {
         const cupFixtures = fixtures.filter(f => f.competitionId === cup.id);
         
         if (cup.type.startsWith('CONTINENTAL')) {
            const groupMatches = cupFixtures.filter(f => f.stage === 'GROUP');
            const hasRound16 = cupFixtures.some(f => f.stage === 'ROUND_OF_16');
            
            if (groupMatches.length > 0 && groupMatches.every(f => f.played) && !hasRound16) {
               const pot1: Club[] = [];
               const pot2: Club[] = [];
               
               for(let g=0; g<8; g++) {
                  const groupTable = world.getLeagueTable(cup.id, fixtures, 'SENIOR', g);
                  if (groupTable.length >= 2) {
                     const first = world.getClub(groupTable[0].clubId);
                     const second = world.getClub(groupTable[1].clubId);
                     if (first) pot1.push(first);
                     if (second) pot2.push(second);
                  }
               }
               
               if (pot1.length === 8 && pot2.length === 8) {
                  const nextDate = this.findNextCupDate(currentDate);
                  newFixtures.push(...Scheduler.generateKnockoutDraw(cup.id, pot1, pot2, nextDate, 'ROUND_OF_16'));
                  world.addInboxMessage('COMPETITION', `Sorteo ${cup.name}`, `Finalizada la fase de grupos. Se han sorteado los cruces de Octavos.`, currentDate, cup.id);
               }
            } else {
               this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
            }
         } else {
            this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
         }
      });
      return newFixtures;
  }

  private static findNextCupDate(fromDate: Date): Date {
     const d = new Date(fromDate);
     d.setDate(d.getDate() + 14); 
     while(d.getDay() !== 3) { d.setDate(d.getDate() + 1); }
     return d;
  }

  private static processKnockoutStage(cup: Competition, cupFixtures: Fixture[], currentDate: Date, newFixtures: Fixture[]) {
      const stages = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
      let currentStageIdx = -1;
      
      // Find the furthest stage that has fixtures
      for(let i=stages.length-1; i>=0; i--) {
         if (cupFixtures.some(f => f.stage === stages[i])) {
            currentStageIdx = i;
            break;
         }
      }
      
      // If no knockout stages yet (only R32 or nothing), check if R32 is done
      if (currentStageIdx === -1) {
          const r32 = cupFixtures.filter(f => f.stage === 'ROUND_OF_32');
          if (r32.length > 0 && r32.every(f => f.played)) {
              this.generateNextRound(cup, r32, 'ROUND_OF_16', currentDate, newFixtures);
          }
          return;
      }

      if (currentStageIdx >= stages.length - 1) return; // Final is done

      const currentStage = stages[currentStageIdx];
      const nextStage = stages[currentStageIdx + 1];
      const currentRoundMatches = cupFixtures.filter(f => f.stage === currentStage);
      
      if (currentRoundMatches.every(f => f.played) && !cupFixtures.some(f => f.stage === nextStage) && currentRoundMatches.length > 0) {
          this.generateNextRound(cup, currentRoundMatches, nextStage as MatchStage, currentDate, newFixtures);
      }
  }

  private static generateNextRound(cup: Competition, prevRoundMatches: Fixture[], nextStage: MatchStage, currentDate: Date, newFixtures: Fixture[]) {
      const winners: Club[] = [];
         
      prevRoundMatches.forEach(f => {
        const winnerId = this.resolveKnockoutTie(f);
        const wClub = world.getClub(winnerId);
        if (wClub) winners.push(wClub);
      });

      if (winners.length >= 2) {
        const nextDate = this.findNextCupDate(currentDate);
        newFixtures.push(...Scheduler.generateCupRound(cup.id, winners, nextDate, nextStage));
        
        const msg = nextStage === 'FINAL' ? `Definida la Gran Final de la ${cup.name}.` : `Definidos los cruces de ${nextStage} en la ${cup.name}.`;
        world.addInboxMessage('COMPETITION', `Fase Avanzada ${cup.name}`, msg, currentDate, cup.id);
      }
  }

  private static resolveKnockoutTie(fixture: Fixture): string {
     const h = fixture.homeScore || 0;
     const a = fixture.awayScore || 0;
     
     if (h > a) return fixture.homeTeamId;
     if (a > h) return fixture.awayTeamId;
     
     if (fixture.penaltyHome === undefined) {
        let pH = 0, pA = 0;
        while(pH === pA) {
           if (Math.random() > 0.2) pH++;
           if (Math.random() > 0.2) pA++;
        }
        fixture.penaltyHome = pH;
        fixture.penaltyAway = pA;
     }
     
     return fixture.penaltyHome! > fixture.penaltyAway! ? fixture.homeTeamId : fixture.awayTeamId;
  }

  private static updatePlayerDevelopment(p: Player) {
     const { mental, physical, technical } = p.stats;
     const avgRating = p.seasonStats.appearances > 3 ? p.seasonStats.totalRating / p.seasonStats.appearances : 5.5;
     
     let growthFactor = 1.0;
     if (avgRating >= 7.5) growthFactor = 2.0;
     else if (avgRating >= 7.0) growthFactor = 1.5;
     else if (avgRating >= 6.5) growthFactor = 1.0;
     else if (avgRating >= 6.0) growthFactor = 0.8;
     else growthFactor = 0.4;

     const coaches = world.getStaffByClub(p.clubId).filter(s => s.role !== 'PHYSIO');
     const coachingScore = coaches.length > 0 ? coaches.reduce((a,b) => a + b.attributes.coaching, 0) / coaches.length : 8;
     growthFactor *= (0.8 + (coachingScore / 50)); 

     let phase: 'YOUNG' | 'PRIME' | 'VETERAN' = 'PRIME';
     if (p.age < 24) phase = 'YOUNG';
     else if (p.age > 30) phase = 'VETERAN';

     let totalChange = 0;

     if (phase === 'YOUNG') {
        if (p.currentAbility < p.potentialAbility) {
           const chance = 0.4 * growthFactor; 
           Object.keys(technical).forEach(k => { if ((technical as any)[k] < 20 && Math.random() < chance) { (technical as any)[k]++; totalChange++; } });
           Object.keys(physical).forEach(k => { if ((physical as any)[k] < 20 && Math.random() < (chance * 0.7)) { (physical as any)[k]++; totalChange++; } });
           Object.keys(mental).forEach(k => { if ((mental as any)[k] < 20 && Math.random() < (chance * 0.3)) { (mental as any)[k]++; totalChange++; } });
        }
     } 
     else if (phase === 'PRIME') {
        const mentalChance = 0.3 * growthFactor;
        Object.keys(mental).forEach(k => { if ((mental as any)[k] < 20 && Math.random() < mentalChance) { (mental as any)[k]++; totalChange++; } });
        if (avgRating > 7.2 && p.currentAbility < p.potentialAbility) {
           const keys = Object.keys(technical);
           const k = keys[randomInt(0, keys.length - 1)];
           if ((technical as any)[k] < 20) { (technical as any)[k]++; totalChange++; }
        }
     }
     else {
        const declineBase = (p.age - 30) * 0.15; 
        const mitigation = (p.stats.physical.naturalFitness / 40) + (growthFactor * 0.2); 
        const declineChance = Math.max(0.05, declineBase - mitigation);
        Object.keys(physical).forEach(k => { if ((physical as any)[k] > 1 && Math.random() < declineChance) { (physical as any)[k]--; totalChange--; } });
        Object.keys(technical).forEach(k => { if ((technical as any)[k] > 1 && Math.random() < (declineChance * 0.5)) { (technical as any)[k]--; totalChange--; } });
        if (Math.random() < 0.3) {
            const mKeys = ['decisions', 'positioning', 'anticipation', 'leadership', 'composure'];
            const k = mKeys[randomInt(0, mKeys.length - 1)];
            if ((mental as any)[k] < 20) { (mental as any)[k]++; totalChange++; }
        }
     }

     // Added type casting to resolve arithmetic operation errors on unknown values
     const avgTech = (Object.values(technical) as number[]).reduce((a,b) => a+b, 0) / Object.values(technical).length;
     const avgMen = (Object.values(mental) as number[]).reduce((a,b) => a+b, 0) / Object.values(mental).length;
     const avgPhy = (Object.values(physical) as number[]).reduce((a,b) => a+b, 0) / Object.values(physical).length;
     
     const oldCA = p.currentAbility;
     p.currentAbility = ((avgTech + avgMen + avgPhy) / 3) * 10;

     if (totalChange > 0 || (p.currentAbility - oldCA) > 2) p.developmentTrend = 'RISING';
     else if (totalChange < 0 || (p.currentAbility - oldCA) < -2) p.developmentTrend = 'DECLINING';
     else p.developmentTrend = 'STABLE';
  }
}
