
import { Player, Position, Club, Fixture, TableEntry, Competition } from "../types";
import { world } from "./worldManager";
import { randomInt, generateUUID } from "./utils";
import { CompetitionSummary } from "../components/SeasonSummaryModal";

export class LifecycleManager {
  
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
             const hScore = finalMatch.homeScore || 0;
             const aScore = finalMatch.awayScore || 0;
             if (hScore > aScore) {
                championId = finalMatch.homeTeamId;
                championName = world.getClub(finalMatch.homeTeamId)?.name || "Equipo Desconocido";
             } else {
                championId = finalMatch.awayTeamId;
                championName = world.getClub(finalMatch.awayTeamId)?.name || "Equipo Desconocido";
             }
          } else {
             // Fallback for demo: if no final played, pick the highest reputation club that participated
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

  private static updatePlayerDevelopment(p: Player) {
     const { mental, physical, technical } = p.stats;
     if (p.age > 30) {
        if (physical.pace > 5 && Math.random() > 0.6) physical.pace -= 1;
        if (physical.stamina > 5 && Math.random() > 0.6) physical.stamina -= 1;
     }
     if (p.age < 28 && mental.decisions < 20 && Math.random() > 0.8) mental.decisions += 1;
     if (p.age < 24 && p.currentAbility < p.potentialAbility) {
        const keys = Object.keys(technical) as Array<keyof typeof technical>;
        const skill = keys[randomInt(0, keys.length-1)];
        if (technical[skill] < 20 && Math.random() > 0.7) technical[skill] += 1;
     }
  }
}
