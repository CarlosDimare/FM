
import { Player, Position, Club, Fixture, TableEntry, Competition, MatchStage, Staff } from "../types";
import { world } from "./worldManager";
import { randomInt, generateUUID } from "./utils";
import { CompetitionSummary } from "../components/SeasonSummaryModal";
import { Scheduler } from "./scheduler";

export class LifecycleManager {

  static recoverDailyFitness() {
     // Cache staff maps to optimize speed
     const clubPhysioMap = new Map<string, number>();
     world.clubs.forEach(c => {
        const physios = world.getStaffByClub(c.id).filter(s => s.role === 'PHYSIO');
        const avg = physios.length > 0 ? physios.reduce((a,b) => a + b.attributes.physiotherapy, 0) / physios.length : 5;
        clubPhysioMap.set(c.id, avg);
     });

     world.players.forEach(p => {
        if (p.fitness < 100) {
           // Natural fitness 20 = +15% per day, 1 = +2%
           // Physio boost: 20 physio = 1.5x speed
           const physioScore = clubPhysioMap.get(p.clubId) || 5;
           const physioMult = 1 + (physioScore / 40); // 1.0 to 1.5
           const recovery = (2 + (p.stats.physical.naturalFitness * 0.65)) * physioMult;
           p.fitness = Math.min(100, Math.round(p.fitness + recovery));
        }
     });
  }
  
  static processEndOfSeason(fixtures: Fixture[]): CompetitionSummary[] {
    const summaries: CompetitionSummary[] = world.competitions.map(comp => {
       let championId = "";
       let championName = "Sin Ganador";

       if (comp.type === 'LEAGUE') {
          const table = world.getLeagueTable(comp.id, fixtures, 'SENIOR');
          if (table.length > 0) {
             championId = table[0].clubId;
             championName = table[0].clubName;
          }
       } else {
          // Cup or Continental: Winner of the FINAL
          const finalMatch = fixtures.find(f => f.competitionId === comp.id && f.stage === 'FINAL' && f.played);
          if (finalMatch) {
             // Check normal score first, then penalties if exists
             const hScore = finalMatch.homeScore || 0;
             const aScore = finalMatch.awayScore || 0;
             let winnerId = "";
             
             if (hScore > aScore) winnerId = finalMatch.homeTeamId;
             else if (aScore > hScore) winnerId = finalMatch.awayTeamId;
             else if (finalMatch.penaltyHome !== undefined && finalMatch.penaltyAway !== undefined) {
                winnerId = finalMatch.penaltyHome > finalMatch.penaltyAway ? finalMatch.homeTeamId : finalMatch.awayTeamId;
             }

             if (winnerId) {
                championId = winnerId;
                championName = world.getClub(winnerId)?.name || "Equipo Desconocido";
             }
          } else {
             // Fallback for demo
             const participants = world.getClubsByCompetition(comp.id, fixtures);
             if (participants.length > 0) {
                const best = participants.sort((a,b) => b.reputation - a.reputation)[0];
                championId = best.id;
                championName = best.name;
             }
          }
       }

       // Player Awards for this competition
       const clubsInComp = world.getClubsByCompetition(comp.id, fixtures).map(c => c.id);
       const compPlayers = world.players.filter(p => clubsInComp.includes(p.clubId) && p.squad === 'SENIOR');

       if (compPlayers.length === 0) {
          return {
             compId: comp.id, compName: comp.name, compType: comp.type, championId, championName,
             topScorer: { name: 'N/A', club: '', value: 0 },
             topAssists: { name: 'N/A', club: '', value: 0 },
             bestGK: { name: 'N/A', club: '', value: '0.00' },
             bestDF: { name: 'N/A', club: '', value: '0.00' }
          };
       }

       const topScorer = [...compPlayers].sort((a,b) => b.seasonStats.goals - a.seasonStats.goals)[0];
       const topAssister = [...compPlayers].sort((a,b) => b.seasonStats.assists - a.seasonStats.assists)[0];
       
       const bestGK = [...compPlayers]
          .filter(p => p.positions.includes(Position.GK) && p.seasonStats.appearances > 2)
          .sort((a,b) => (b.seasonStats.totalRating/(b.seasonStats.appearances || 1)) - (a.seasonStats.totalRating/(a.seasonStats.appearances || 1)))[0];

       const bestDF = [...compPlayers]
          .filter(p => p.positions.some(pos => pos.includes("DF") || pos === Position.SW) && p.seasonStats.appearances > 2)
          .sort((a,b) => (b.seasonStats.totalRating/(b.seasonStats.appearances || 1)) - (a.seasonStats.totalRating/(a.seasonStats.appearances || 1)))[0];

       return {
          compId: comp.id, compName: comp.name, compType: comp.type, championId, championName,
          topScorer: topScorer ? { name: topScorer.name, club: world.getClub(topScorer.clubId)?.name || '', value: topScorer.seasonStats.goals } : { name: 'N/A', club: '', value: 0 },
          topAssists: topAssister ? { name: topAssister.name, club: world.getClub(topAssister.clubId)?.name || '', value: topAssister.seasonStats.assists } : { name: 'N/A', club: '', value: 0 },
          bestGK: bestGK ? { name: bestGK.name, club: world.getClub(bestGK.clubId)?.name || '', value: (bestGK.seasonStats.totalRating/bestGK.seasonStats.appearances).toFixed(2) } : { name: 'N/A', club: '', value: '0.00' },
          bestDF: bestDF ? { name: bestDF.name, club: world.getClub(bestDF.clubId)?.name || '', value: (bestDF.seasonStats.totalRating/bestDF.seasonStats.appearances).toFixed(2) } : { name: 'N/A', club: '', value: '0.00' }
       };
    });

    // Development & Reset for next season
    world.players.forEach(player => {
      this.updatePlayerDevelopment(player);
      player.seasonStats = { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, totalRating: 0 };
    });

    const retiredIds: string[] = [];
    world.players.forEach(p => { if (p.age > 34 && Math.random() < (p.age - 32) * 0.20) retiredIds.push(p.id); });
    world.players = world.players.filter(p => !retiredIds.includes(p.id));

    world.clubs.forEach(club => {
      for(let i=0; i<3; i++) {
         const pos = [Position.GK, Position.DC, Position.MC, Position.ST][randomInt(0, 3)];
         const regen = world.createRandomPlayer(club.id, pos, 15, 16);
         regen.squad = 'U20'; world.players.push(regen);
      }
    });

    return summaries;
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
      
      const cups = world.competitions.filter(c => c.type === 'CUP' || c.type === 'CONTINENTAL_ELITE');
      
      cups.forEach(cup => {
         const cupFixtures = fixtures.filter(f => f.competitionId === cup.id);
         
         if (cup.type === 'CONTINENTAL_ELITE') {
            // Handle Group Stage -> Round of 16
            // We assume 8 groups (0-7), 4 teams each. 32 teams total.
            // Matchdays = 6. Total Group Matches = 8 groups * 6 matches * 2 per matchday = 96 matches.
            const groupMatches = cupFixtures.filter(f => f.stage === 'GROUP');
            const hasRound16 = cupFixtures.some(f => f.stage === 'ROUND_OF_16');
            
            if (groupMatches.length >= 96 && groupMatches.every(f => f.played) && !hasRound16) {
               // Logic: Iterate groups 0-7, take top 2 from each.
               const qualifiedClubs: Club[] = [];
               
               for(let g=0; g<8; g++) {
                  const groupTable = world.getLeagueTable(cup.id, fixtures, 'SENIOR', g);
                  if (groupTable.length >= 2) {
                     const first = world.getClub(groupTable[0].clubId);
                     const second = world.getClub(groupTable[1].clubId);
                     if (first) qualifiedClubs.push(first);
                     if (second) qualifiedClubs.push(second);
                  }
               }
               
               if (qualifiedClubs.length === 16) {
                  const nextDate = this.findNextCupDate(currentDate);
                  newFixtures.push(...Scheduler.generateCupRound(cup.id, qualifiedClubs, nextDate, 'ROUND_OF_16'));
                  world.addInboxMessage('COMPETITION', `Sorteo ${cup.name}`, `Finalizada la fase de grupos. Definidos los Octavos de Final.`, currentDate, cup.id);
               }
            } else {
               // Normal Cup Logic for Knockouts
               this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
            }
         } else {
            // Standard Cup
            this.processKnockoutStage(cup, cupFixtures, currentDate, newFixtures);
         }
      });
      return newFixtures;
  }

  // Helper to find a non-weekend day for cups
  private static findNextCupDate(fromDate: Date): Date {
     const d = new Date(fromDate);
     d.setDate(d.getDate() + 14); // Default 2 weeks gap
     // Force Wednesday
     while(d.getDay() !== 3) {
        d.setDate(d.getDate() + 1);
     }
     return d;
  }

  private static processKnockoutStage(cup: Competition, cupFixtures: Fixture[], currentDate: Date, newFixtures: Fixture[]) {
      const stages = ['ROUND_OF_16', 'QUARTER_FINAL', 'SEMI_FINAL', 'FINAL'];
      let currentStageIdx = -1;
      for(let i=stages.length-1; i>=0; i--) {
         if (cupFixtures.some(f => f.stage === stages[i])) {
            currentStageIdx = i;
            break;
         }
      }
      
      if (currentStageIdx === -1 || currentStageIdx >= stages.length - 1) return;

      const currentStage = stages[currentStageIdx];
      const nextStage = stages[currentStageIdx + 1];
      const currentRoundMatches = cupFixtures.filter(f => f.stage === currentStage);
      
      if (currentRoundMatches.every(f => f.played) && !cupFixtures.some(f => f.stage === nextStage) && currentRoundMatches.length > 0) {
         const winners: Club[] = [];
         
         currentRoundMatches.forEach(f => {
            const winnerId = this.resolveKnockoutTie(f);
            const wClub = world.getClub(winnerId);
            if (wClub) winners.push(wClub);
         });

         if (winners.length >= 2) {
            const nextDate = this.findNextCupDate(currentDate);
            newFixtures.push(...Scheduler.generateCupRound(cup.id, winners, nextDate, nextStage as MatchStage));
            world.addInboxMessage('COMPETITION', `Sorteo ${cup.name}`, `Definidos los cruces de ${nextStage}.`, currentDate, cup.id);
         }
      }
  }

  // Solves ties by simulating penalties if needed and updating the fixture
  private static resolveKnockoutTie(fixture: Fixture): string {
     const h = fixture.homeScore || 0;
     const a = fixture.awayScore || 0;
     
     if (h > a) return fixture.homeTeamId;
     if (a > h) return fixture.awayTeamId;
     
     // It's a draw, simulate penalties if not already done
     if (fixture.penaltyHome === undefined) {
        // Simple penalty logic (could be improved with player stats)
        let pH = 0;
        let pA = 0;
        // Best of 5
        for(let i=0; i<5; i++) {
           if (Math.random() > 0.2) pH++;
           if (Math.random() > 0.2) pA++;
        }
        // Sudden death
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
     const avgRating = p.seasonStats.appearances > 0 ? p.seasonStats.totalRating / p.seasonStats.appearances : 0;
     
     // Get coaching bonus
     const coaches = world.getStaffByClub(p.clubId).filter(s => s.role !== 'PHYSIO');
     const coachingScore = coaches.length > 0 ? coaches.reduce((a,b) => a + b.attributes.coaching, 0) / coaches.length : 5;
     
     // Performance based development modifiers + Staff Influence
     // High coaching (20) adds 0.3 to chance.
     let growthChance = 0.5 + (coachingScore / 60); 
     
     if (avgRating > 7.5) growthChance += 0.3;
     else if (avgRating < 6.0) growthChance -= 0.1;

     // Age Decline
     if (p.age > 30) {
        if (physical.pace > 5 && Math.random() > 0.6) physical.pace -= 1;
        if (physical.stamina > 5 && Math.random() > 0.6) physical.stamina -= 1;
     }
     
     // Mental Growth (Experience)
     if (p.age < 28 && mental.decisions < 20 && Math.random() > 0.8) mental.decisions += 1;
     
     // Technical Growth (Potential + Performance)
     if (p.age < 24 && p.currentAbility < p.potentialAbility) {
        const keys = Object.keys(technical) as Array<keyof typeof technical>;
        const skill = keys[randomInt(0, keys.length-1)];
        // Higher chance if playing well
        if (technical[skill] < 20 && Math.random() < growthChance) technical[skill] += 1;
     }
  }
}
