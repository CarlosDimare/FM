
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
     for (let i = 0; i < shuffled.length; i += 2) {
        if (shuffled[i] && shuffled[i+1]) {
           fixtures.push({
              id: generateUUID(),
              competitionId,
              homeTeamId: shuffled[i].id,
              awayTeamId: shuffled[i+1].id,
              date: new Date(roundDate),
              played: false,
              squadType: 'SENIOR',
              stage: stage,
              isNeutral: stage === 'FINAL'
           });
        }
     }
     return fixtures;
  }

  static generateContinentalGroups(competitionId: string, clubs: Club[], startDate: Date): Fixture[] {
      const fixtures: Fixture[] = [];
      const shuffledClubs = [...clubs].sort(() => Math.random() - 0.5).slice(0, 32);
      
      for (let groupIdx = 0; groupIdx < 8; groupIdx++) {
         const groupClubs = shuffledClubs.slice(groupIdx * 4, (groupIdx * 4) + 4);
         if (groupClubs.length < 4) continue;

         // Group stage has 6 matchdays
         for (let m = 0; m < 6; m++) {
            const matchDate = new Date(startDate);
            matchDate.setDate(matchDate.getDate() + (m * 14) + (randomInt(0,1))); // Tue or Wed
            
            // Basic pairing logic for 4 teams group
            const pairs = m % 2 === 0 ? [[0,1], [2,3]] : [[0,2], [1,3]];
            pairs.forEach(p => {
               fixtures.push({
                  id: generateUUID(),
                  competitionId,
                  homeTeamId: groupClubs[p[0]].id,
                  awayTeamId: groupClubs[p[1]].id,
                  date: matchDate,
                  played: false,
                  squadType: 'SENIOR',
                  stage: 'GROUP'
               });
            });
         }
      }
      return fixtures;
  }
}
