
import { Club, Fixture, SquadType, MatchStage, Competition } from "../types";
import { generateUUID, randomInt } from "./utils";

export class Scheduler {
  static generateSeasonFixtures(leagueId: string, clubs: Club[], startDate: Date, squadType: SquadType = 'SENIOR'): Fixture[] {
    const fixtures: Fixture[] = [];
    const leagueClubs = clubs.filter(c => c.leagueId === leagueId);
    if (leagueClubs.length < 2) return [];
    const numRounds = (leagueClubs.length - 1) * 2;
    const matchesPerRound = leagueClubs.length / 2;
    let rotatingClubs = [...leagueClubs];
    const fixedClub = rotatingClubs.shift(); 
    if (!fixedClub) return [];
    let currentRoundDate = new Date(startDate);
    
    // Ensure leagues start on Saturday/Sunday
    if (currentRoundDate.getDay() !== 6 && currentRoundDate.getDay() !== 0) {
        // Find next Saturday
        const dist = (6 - currentRoundDate.getDay() + 7) % 7;
        currentRoundDate.setDate(currentRoundDate.getDate() + dist);
    }

    for (let round = 0; round < numRounds; round++) {
      if (round > 0) currentRoundDate.setDate(currentRoundDate.getDate() + 7);
      const roundClubs = [fixedClub, ...rotatingClubs];
      for (let i = 0; i < matchesPerRound; i++) {
        const homeIdx = i;
        const awayIdx = roundClubs.length - 1 - i;
        const teamA = roundClubs[homeIdx];
        const teamB = roundClubs[awayIdx];
        const isHome = round % 2 === 0;
        fixtures.push({ id: generateUUID(), competitionId: leagueId, homeTeamId: isHome ? teamA.id : teamB.id, awayTeamId: isHome ? teamB.id : teamA.id, date: new Date(currentRoundDate), played: false, squadType, stage: 'REGULAR' });
      }
      const last = rotatingClubs.pop();
      if (last) rotatingClubs.unshift(last);
    }
    return fixtures.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  static generateCupRound(competitionId: string, clubs: Club[], roundDate: Date, stage: MatchStage): Fixture[] {
     const fixtures: Fixture[] = [];
     const shuffled = [...clubs].sort(() => Math.random() - 0.5);
     
     // Ensure Cup rounds are mid-week (Wednesday) to avoid conflict
     const safeDate = new Date(roundDate);
     while(safeDate.getDay() !== 3) {
        safeDate.setDate(safeDate.getDate() + 1);
     }

     for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i] && shuffled[i+1]) {
           fixtures.push({
              id: generateUUID(),
              competitionId,
              homeTeamId: shuffled[i].id,
              awayTeamId: shuffled[i+1].id,
              date: new Date(safeDate),
              played: false,
              squadType: 'SENIOR',
              stage: stage,
              isNeutral: stage === 'FINAL' || competitionId === 'W_CLUB' // Club World Cup always neutral
           });
        }
     }
     return fixtures;
  }

  static generateKnockoutDraw(competitionId: string, seeds: Club[], nonSeeds: Club[], roundDate: Date, stage: MatchStage): Fixture[] {
      const fixtures: Fixture[] = [];
      const pot1 = [...seeds].sort(() => Math.random() - 0.5);
      const pot2 = [...nonSeeds].sort(() => Math.random() - 0.5);
      
      const safeDate = new Date(roundDate);
      while(safeDate.getDay() !== 3) safeDate.setDate(safeDate.getDate() + 1);

      // Pair Pot 1 vs Pot 2
      for (let i = 0; i < pot1.length; i++) {
         if (pot1[i] && pot2[i]) {
            // Usually Pot 2 plays home first in Libertadores R16
            fixtures.push({
               id: generateUUID(),
               competitionId,
               homeTeamId: pot2[i].id, 
               awayTeamId: pot1[i].id,
               date: new Date(safeDate),
               played: false,
               squadType: 'SENIOR',
               stage: stage
            });
         }
      }
      return fixtures;
  }

  static generateContinentalGroups(competitionId: string, clubs: Club[], startDate: Date): Fixture[] {
      const fixtures: Fixture[] = [];
      
      // Sort by reputation to create Pots (Seeding)
      const rankedClubs = [...clubs].sort((a,b) => b.reputation - a.reputation);
      const groupsCount = 8;
      
      if (rankedClubs.length < 32) return []; // Need 32 teams for accurate simulation

      const pot1 = rankedClubs.slice(0, 8);
      const pot2 = rankedClubs.slice(8, 16);
      const pot3 = rankedClubs.slice(16, 24);
      const pot4 = rankedClubs.slice(24, 32);

      // Shuffle pots to randomize distribution
      const pots = [pot1, pot2, pot3, pot4].map(p => p.sort(() => Math.random() - 0.5));
      
      // Ensure start is a Wednesday
      const safeStartDate = new Date(startDate);
      while(safeStartDate.getDay() !== 3) {
         safeStartDate.setDate(safeStartDate.getDate() + 1);
      }

      for (let groupIdx = 0; groupIdx < groupsCount; groupIdx++) {
         // Pick one team from each pot for this group
         const groupClubs = [pots[0][groupIdx], pots[1][groupIdx], pots[2][groupIdx], pots[3][groupIdx]];

         // Group stage has 6 matchdays
         for (let m = 0; m < 6; m++) {
            const matchDate = new Date(safeStartDate);
            matchDate.setDate(matchDate.getDate() + (m * 14)); // Every 2 weeks
            
            // Basic pairing logic for 4 teams group
            // Round Robin logic
            let pairs: number[][] = [];
            if (m === 0) pairs = [[0,1], [2,3]]; // 1 vs 2, 3 vs 4
            if (m === 1) pairs = [[1,2], [3,0]]; // 2 vs 3, 4 vs 1
            if (m === 2) pairs = [[0,2], [1,3]]; // 1 vs 3, 2 vs 4
            if (m === 3) pairs = [[1,0], [3,2]]; // Returns
            if (m === 4) pairs = [[2,1], [0,3]];
            if (m === 5) pairs = [[2,0], [3,1]];

            pairs.forEach(p => {
               fixtures.push({
                  id: generateUUID(),
                  competitionId,
                  homeTeamId: groupClubs[p[0]].id,
                  awayTeamId: groupClubs[p[1]].id,
                  date: matchDate,
                  played: false,
                  squadType: 'SENIOR',
                  stage: 'GROUP',
                  groupId: groupIdx
               });
            });
         }
      }
      return fixtures;
  }
}
