import { Player, Club, Competition, Position, PlayerStats, Fixture, TableEntry, Tactic, Staff, StaffRole, SquadType, TransferOffer, InboxMessage, MessageCategory, TacticalStyle, TacticSettings, MatchSettings } from "../types";
import { generateUUID, randomInt, weightedRandom } from "./utils";
import { NATIONS } from "../constants";
import { TACTIC_PRESETS, NAMES_DB, REGEN_DB, STAFF_NAMES, POS_DEFINITIONS, ARG_PRIMERA, ARG_NACIONAL, CONT_CLUBS, CONT_CLUBS_TIER2, WORLD_BOSSES, RealClubDef } from "../data/static";
import { REAL_PLAYERS_DB, RealPlayerDef } from "../data/realPlayers";
import { SLOT_CONFIG } from "./engine";

export class WorldManager {
  players: Player[] = [];
  clubs: Club[] = [];
  competitions: Competition[] = [];
  staff: Staff[] = [];
  tactics: Tactic[] = TACTIC_PRESETS.map(t => ({ ...t, settings: { ...t.settings } }));
  offers: TransferOffer[] = [];
  inbox: InboxMessage[] = [];
  matchSettings: MatchSettings = {
     pauseAtHalftime: true
  };

  constructor() { this.initWorld(); }

  initWorld() {
    this.competitions = [
      { id: "L_ARG_1", name: "Liga Profesional", country: "Argentina", type: 'LEAGUE', tier: 1 },
      { id: "L_ARG_2", name: "Primera Nacional", country: "Argentina", type: 'LEAGUE', tier: 2 },
      { id: "C_ARG", name: "Copa Argentina", country: "Argentina", type: 'CUP', tier: 1 },
      { id: "CONT_LIB", name: "Copa Libertadores", country: "Sudamérica", type: 'CONTINENTAL_ELITE', tier: 1 },
      { id: "CONT_SUD", name: "Copa Sudamericana", country: "Sudamérica", type: 'CONTINENTAL_SMALL', tier: 2 },
      { id: "W_CLUB", name: "Mundial de Clubes", country: "Global", type: 'GLOBAL', tier: 1 },
    ];

    this.loadRealClubs(ARG_PRIMERA, "L_ARG_1");
    this.loadRealClubs(ARG_NACIONAL, "L_ARG_2");
    this.loadRealClubs([...CONT_CLUBS, ...CONT_CLUBS_TIER2], "L_SAM_OTHER");
    this.loadRealClubs(WORLD_BOSSES, "L_EUR_ELITE");

    this.players.forEach(p => {
       if (Math.random() < 0.08) {
          if (p.age < 22 && p.currentAbility < 120 && p.potentialAbility > 140) p.transferStatus = 'LOANABLE';
          else if (p.age > 28) p.transferStatus = 'TRANSFERABLE';
       }
    });
  }

  loadRealClubs(definitions: RealClubDef[], leagueId: string) {
     definitions.forEach(def => {
        const club: Club = {
           id: generateUUID(),
           name: def.name,
           shortName: def.short,
           leagueId: leagueId,
           country: def.country,
           primaryColor: def.pCol,
           secondaryColor: def.sCol,
           finances: {
              balance: def.rep * 2500,
              transferBudget: def.rep * 800,
              wageBudget: def.rep * 80,
              monthlyIncome: def.rep * 200,
              monthlyExpenses: 0
           },
           reputation: def.rep,
           stadium: def.stadium,
           honours: this.generateRandomHonours(),
           trainingFacilities: Math.min(20, Math.floor(def.rep / 500) + randomInt(-2, 2)),
           youthFacilities: Math.min(20, Math.floor(def.rep / 550) + randomInt(-3, 3))
        };
        this.clubs.push(club);
        this.injectRealPlayers(club);
        this.generateSquadsForClub(club.id);
        this.generateStaffForClub(club.id);
        this.updateClubMonthlyExpenses(club.id);
     });
  }

  getClub(id: string) { return this.clubs.find(c => c.id === id); }
  getPlayersByClub(clubId: string) { return this.players.filter(p => p.clubId === clubId); }
  getStaffByClub(clubId: string) { return this.staff.filter(s => s.clubId === clubId); }
  getLeagues() { return this.competitions.filter(c => c.type === 'LEAGUE'); }
  getTactics() { return this.tactics; }

  updateClubMonthlyExpenses(clubId: string) {
    const club = this.getClub(clubId);
    if (!club) return;
    const players = this.getPlayersByClub(clubId);
    const staff = this.getStaffByClub(clubId);
    const totalSalaries = players.reduce((sum, p) => sum + p.salary, 0) + staff.reduce((sum, s) => sum + s.salary, 0);
    club.finances.monthlyExpenses = totalSalaries + (club.reputation * 10);
  }

  generateRandomHonours() {
    const honours = [];
    const possible = ["Liga Profesional", "Copa Argentina", "Supercopa", "Copa Libertadores", "Copa Sudamericana"];
    const count = randomInt(0, 5);
    for (let i = 0; i < count; i++) {
      honours.push({ name: possible[randomInt(0, possible.length - 1)], year: randomInt(1970, 2007) });
    }
    return honours.sort((a,b) => b.year - a.year);
  }

  injectRealPlayers(club: Club) {
     const dbPlayers = REAL_PLAYERS_DB.filter(p => p.clubShort === club.shortName);
     dbPlayers.forEach(def => {
        const player = this.createRealPlayer(club.id, def);
        this.players.push(player);
     });
  }

  createRealPlayer(clubId: string, def: RealPlayerDef): Player {
     const posMap: Record<string, Position> = {
        'GK': Position.GK, 'DC': Position.DC, 'DL': Position.DL, 'DR': Position.DR,
        'DM': Position.DM, 'MC': Position.MC, 'ML': Position.ML, 'MR': Position.MR,
        'AMC': Position.AMC, 'AML': Position.AML, 'AMR': Position.AMR, 'ST': Position.ST,
        'WD': Position.STR, 'WI': Position.STL, 'P': Position.GK, 'DFC': Position.DC,
        'LD': Position.DR, 'LI': Position.DL
     };
     
     const primaryPos = posMap[def.position] || Position.MC;
     const age = def.age;
     const birthDate = new Date(2008 - age, randomInt(0, 11), randomInt(1, 28));
     const caBase = def.ca / 10;

     const stats: PlayerStats = {
        mental: { 
           aggression: weightedRandom(caBase - 4, caBase + 4), anticipation: weightedRandom(caBase - 3, caBase + 4),
           bravery: weightedRandom(caBase - 4, caBase + 4), composure: weightedRandom(caBase - 3, caBase + 4),
           concentration: weightedRandom(caBase - 4, caBase + 4), decisions: weightedRandom(caBase - 3, caBase + 4),
           determination: randomInt(10, 20), flair: weightedRandom(caBase - 5, caBase + 5),
           leadership: weightedRandom(caBase - 5, caBase + 5), offTheBall: weightedRandom(caBase - 4, caBase + 4),
           positioning: weightedRandom(caBase - 4, caBase + 4), teamwork: weightedRandom(caBase - 4, caBase + 4),
           vision: weightedRandom(caBase - 4, caBase + 4), workRate: weightedRandom(caBase - 4, caBase + 4),
           professionalism: randomInt(10, 20), ambition: randomInt(10, 20), pressure: randomInt(10, 20),
           temperament: randomInt(5, 20), loyalty: randomInt(10, 20), adaptability: weightedRandom(10, 20),
           sportsmanship: weightedRandom(5, 20)
        },
        technical: {
           corners: weightedRandom(caBase - 5, caBase + 5), crossing: weightedRandom(caBase - 5, caBase + 5),
           dribbling: weightedRandom(caBase - 5, caBase + 5), finishing: weightedRandom(caBase - 5, caBase + 5),
           firstTouch: weightedRandom(caBase - 3, caBase + 4), freeKickTaking: weightedRandom(caBase - 5, caBase + 5),
           heading: weightedRandom(caBase - 5, caBase + 5), longShots: weightedRandom(caBase - 5, caBase + 5),
           longThrows: weightedRandom(caBase - 5, caBase + 5), marking: weightedRandom(caBase - 5, caBase + 5),
           passing: weightedRandom(caBase - 4, caBase + 4), penaltyTaking: weightedRandom(caBase - 5, caBase + 5),
           tackling: weightedRandom(caBase - 5, caBase + 5), technique: weightedRandom(caBase - 3, caBase + 4)
        },
        physical: {
           acceleration: weightedRandom(caBase - 4, caBase + 4), agility: weightedRandom(caBase - 4, caBase + 4),
           balance: weightedRandom(caBase - 4, caBase + 4), jumpingReach: weightedRandom(caBase - 4, caBase + 4),
           naturalFitness: weightedRandom(caBase - 2, caBase + 4), pace: weightedRandom(caBase - 4, caBase + 4),
           stamina: weightedRandom(caBase - 4, caBase + 4), strength: weightedRandom(caBase - 4, caBase + 4)
        }
     };

     if (primaryPos === Position.GK) {
        stats.goalkeeping = {
           aerialReach: weightedRandom(caBase - 3, caBase + 4), commandOfArea: weightedRandom(caBase - 3, caBase + 4),
           communication: weightedRandom(caBase - 3, caBase + 4), eccentricity: weightedRandom(1, 15),
           handling: weightedRandom(caBase - 3, caBase + 4), kicking: weightedRandom(caBase - 3, caBase + 4),
           oneOnOnes: weightedRandom(caBase - 3, caBase + 4), reflexes: weightedRandom(caBase - 3, caBase + 4),
           rushingOut: weightedRandom(caBase - 3, caBase + 4), punching: weightedRandom(caBase - 3, caBase + 4),
           throwing: weightedRandom(caBase - 3, caBase + 4)
        };
     }

     return {
        id: generateUUID(), name: def.name, photo: def.photo, age: age, birthDate,
        height: 180, weight: 75, nationality: def.nationality, positions: [primaryPos], secondaryPositions: [],
        stats, seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 },
        statsByCompetition: {}, history: [], currentAbility: def.ca, potentialAbility: def.pa,
        reputation: def.ca * 45, fitness: 100, morale: 100, clubId, isStarter: false, squad: 'SENIOR',
        value: Math.round(def.ca * def.ca * 2500), salary: Math.round(def.ca * 2500 / 10) * 10,
        transferStatus: 'NONE', contractExpiry: new Date(2010, 5, 30), loyalty: stats.mental.loyalty,
        negotiationAttempts: 0, isUnhappyWithContract: false, developmentTrend: 'STABLE', yellowCardsAccumulated: 0
     };
  }

  generateSquadsForClub(clubId: string) {
    const squads: SquadType[] = ['SENIOR', 'RESERVE', 'U20'];
    squads.forEach(squadType => {
      const size = squadType === 'SENIOR' ? 24 : squadType === 'RESERVE' ? 20 : 18;
      const existing = this.getPlayersByClub(clubId).filter(p => p.squad === squadType);
      const needed = Math.max(0, size - existing.length);
      if (needed === 0) return;

      const squadStructure = [
          ...Array(Math.floor(needed*0.1)).fill('GK'), ...Array(Math.floor(needed*0.3)).fill('DEF'), 
          ...Array(Math.floor(needed*0.2)).fill('DM'), ...Array(Math.floor(needed*0.2)).fill('MID'), 
          ...Array(Math.floor(needed*0.2)).fill('ATT')
      ];
      
      squadStructure.forEach((roleType) => {
        let posPool: Position[] = roleType === 'GK' ? POS_DEFINITIONS.GK : roleType === 'DEF' ? POS_DEFINITIONS.DEF : roleType === 'DM' ? POS_DEFINITIONS.DM : roleType === 'MID' ? POS_DEFINITIONS.MID : POS_DEFINITIONS.ATT;
        const primaryPos = posPool[randomInt(0, posPool.length - 1)];
        let ageRange = squadType === 'U20' ? [15, 19] : squadType === 'RESERVE' ? [17, 25] : [18, 36];
        const player = this.createRandomPlayer(clubId, primaryPos, ageRange[0], ageRange[1]);
        player.squad = squadType;
        this.players.push(player);
      });
    });
  }

  generateStaffForClub(clubId: string) {
    const roles: StaffRole[] = ['HEAD_COACH', 'ASSISTANT_MANAGER', 'PHYSIO', 'FITNESS_COACH', 'RESERVE_MANAGER', 'YOUTH_MANAGER'];
    roles.forEach(role => {
      const s: Staff = {
        id: generateUUID(), name: `${STAFF_NAMES.names[randomInt(0, STAFF_NAMES.names.length-1)]} ${STAFF_NAMES.surnames[randomInt(0, STAFF_NAMES.surnames.length-1)]}`,
        age: randomInt(35, 65), nationality: "Argentina", role: role, clubId: clubId,
        attributes: { coaching: weightedRandom(8, 20), judgingAbility: weightedRandom(8, 20), judgingPotential: weightedRandom(8, 20), tacticalKnowledge: weightedRandom(10, 20), adaptability: weightedRandom(5, 20), medical: role === 'PHYSIO' ? 18 : 5, physiotherapy: role === 'PHYSIO' ? 18 : 5, motivation: weightedRandom(8, 20), manManagement: weightedRandom(8, 20) },
        salary: randomInt(3000, 15000), contractExpiry: new Date(2010, 5, 30), history: []
      };
      this.staff.push(s);
    });
  }

  createRandomPlayer(clubId: string, primaryPos: Position, minAge = 16, maxAge = 36, baseYear = 2008): Player {
    const club = this.getClub(clubId);
    const repBase = club ? club.reputation / 500 : 10;
    let nat = club ? (Math.random() < 0.9 ? club.country : NATIONS[randomInt(0, NATIONS.length - 1)]) : "Argentina";
    const normalizeKey = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    let firstName = "", lastName = "";
    const regenData = REGEN_DB[normalizeKey(nat)];
    if (regenData) {
        firstName = regenData.nombres[randomInt(0, regenData.nombres.length - 1)];
        lastName = regenData.apellidos[randomInt(0, regenData.apellidos.length - 1)];
    } else {
        firstName = NAMES_DB.firstNames[randomInt(0, NAMES_DB.firstNames.length - 1)];
        lastName = NAMES_DB.lastNames[randomInt(0, NAMES_DB.lastNames.length - 1)];
    }

    const ca = randomInt(Math.max(1, repBase * 5), Math.min(200, repBase * 15));
    const pa = Math.min(200, ca + randomInt(0, 50));
    const caBase = ca / 10;

    const stats: PlayerStats = {
        mental: { aggression: weightedRandom(caBase-4, caBase+4), anticipation: weightedRandom(caBase-4, caBase+4), bravery: weightedRandom(caBase-4, caBase+4), composure: weightedRandom(caBase-4, caBase+4), concentration: weightedRandom(caBase-4, caBase+4), decisions: weightedRandom(caBase-4, caBase+4), determination: randomInt(5, 20), flair: weightedRandom(caBase-4, caBase+4), leadership: weightedRandom(caBase-4, caBase+4), offTheBall: weightedRandom(caBase-4, caBase+4), positioning: weightedRandom(caBase-4, caBase+4), teamwork: weightedRandom(caBase-4, caBase+4), vision: weightedRandom(caBase-4, caBase+4), workRate: weightedRandom(caBase-4, caBase+4), professionalism: randomInt(5, 20), ambition: randomInt(5, 20), pressure: randomInt(5, 20), temperament: randomInt(5, 20), loyalty: randomInt(5, 20), adaptability: randomInt(5, 20), sportsmanship: randomInt(5, 20) },
        technical: { corners: weightedRandom(caBase-4, caBase+4), crossing: weightedRandom(caBase-4, caBase+4), dribbling: weightedRandom(caBase-4, caBase+4), finishing: weightedRandom(caBase-4, caBase+4), firstTouch: weightedRandom(caBase-4, caBase+4), freeKickTaking: weightedRandom(caBase-4, caBase+4), heading: weightedRandom(caBase-4, caBase+4), longShots: weightedRandom(caBase-4, caBase+4), longThrows: weightedRandom(caBase-4, caBase+4), marking: weightedRandom(caBase-4, caBase+4), passing: weightedRandom(caBase-4, caBase+4), penaltyTaking: weightedRandom(caBase-4, caBase+4), tackling: weightedRandom(caBase-4, caBase+4), technique: weightedRandom(caBase-4, caBase+4) },
        physical: { acceleration: weightedRandom(caBase-4, caBase+4), agility: weightedRandom(caBase-4, caBase+4), balance: weightedRandom(caBase-4, caBase+4), jumpingReach: weightedRandom(caBase-4, caBase+4), naturalFitness: weightedRandom(caBase-4, caBase+4), pace: weightedRandom(caBase-4, caBase+4), stamina: weightedRandom(caBase-4, caBase+4), strength: weightedRandom(caBase-4, caBase+4) }
    };
    if (primaryPos === Position.GK) {
        stats.goalkeeping = { aerialReach: weightedRandom(caBase-4, caBase+4), commandOfArea: weightedRandom(caBase-4, caBase+4), communication: weightedRandom(caBase-4, caBase+4), eccentricity: randomInt(1, 20), handling: weightedRandom(caBase-4, caBase+4), kicking: weightedRandom(caBase-4, caBase+4), oneOnOnes: weightedRandom(caBase-4, caBase+4), reflexes: weightedRandom(caBase-4, caBase+4), rushingOut: weightedRandom(caBase-4, caBase+4), punching: weightedRandom(caBase-4, caBase+4), throwing: weightedRandom(caBase-4, caBase+4) };
    }

    return {
        id: generateUUID(), name: `${firstName} ${lastName}`, age: randomInt(minAge, maxAge), birthDate: new Date(baseYear - 20, randomInt(0, 11), randomInt(1, 28)), height: randomInt(165, 195), weight: randomInt(65, 95), nationality: nat, positions: [primaryPos], secondaryPositions: [], stats, seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 }, statsByCompetition: {}, history: [], currentAbility: ca, potentialAbility: pa, reputation: ca * 40, fitness: 100, morale: 100, clubId, isStarter: false, squad: 'SENIOR', value: Math.round(ca * ca * 2000), salary: Math.round(ca * 2000 / 12), transferStatus: 'NONE', contractExpiry: new Date(2010, 5, 30), loyalty: stats.mental.loyalty, negotiationAttempts: 0, isUnhappyWithContract: false, yellowCardsAccumulated: 0
    };
  }

  getLeagueTable(compId: string, fixtures: Fixture[], squadType: SquadType, groupId?: number): TableEntry[] {
    const table: Record<string, TableEntry> = {};
    
    // Fix: We must only initialize the table with clubs that are actually in the requested group
    const relevantFixtures = fixtures.filter(f => 
        f.competitionId === compId && 
        f.squadType === squadType && 
        (groupId === undefined || f.groupId === groupId)
    );

    const participantIds = new Set(relevantFixtures.flatMap(f => [f.homeTeamId, f.awayTeamId]));
    
    // Fallback for leagues that might not have any fixtures yet
    if (participantIds.size === 0 && groupId === undefined) {
        this.clubs.filter(c => c.leagueId === compId).forEach(c => participantIds.add(c.id));
    }

    const clubs = this.clubs.filter(c => participantIds.has(c.id));
    
    clubs.forEach(c => table[c.id] = { clubId: c.id, clubName: c.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 });
    
    relevantFixtures.filter(f => f.played).forEach(f => {
      const h = table[f.homeTeamId]; const a = table[f.awayTeamId];
      if (!h || !a) return;
      h.played++; a.played++; h.gf += f.homeScore!; h.ga += f.awayScore!; a.gf += f.awayScore!; a.ga += f.homeScore!;
      if (f.homeScore! > f.awayScore!) { h.won++; a.lost++; h.points += 3; }
      else if (f.homeScore! < f.awayScore!) { a.won++; h.lost++; a.points += 3; }
      else { h.drawn++; a.drawn++; h.points++; a.points++; }
    });
    
    return Object.values(table)
        .map(e => ({ ...e, gd: e.gf - e.ga }))
        .sort((a,b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }

  getClubsByCompetition(compId: string, fixtures: Fixture[], groupId?: number): Club[] {
    const ids = new Set(fixtures.filter(f => f.competitionId === compId && (groupId === undefined || f.groupId === groupId)).flatMap(f => [f.homeTeamId, f.awayTeamId]));
    return this.clubs.filter(c => ids.has(c.id));
  }

  getClubsByLeague(leagueId: string) { return this.clubs.filter(c => c.leagueId === leagueId); }

  selectBestEleven(clubId: string, squad: SquadType) {
    const players = this.getPlayersByClub(clubId).filter(p => p.squad === squad && !p.injury && (!p.suspension || p.suspension.matchesLeft === 0));
    players.forEach(p => { p.isStarter = false; p.tacticalPosition = undefined; });
    
    const tactic = this.tactics[0];
    tactic.positions.forEach(slot => {
        const metadata = SLOT_CONFIG[slot];
        if (!metadata) return;

        const eligible = players.filter(p => {
            if (p.isStarter) return false;
            const primaryPos = p.positions[0];
            
            if (metadata.line === 'GK') return primaryPos === Position.GK;
            if (metadata.line === 'SW') return primaryPos === Position.SW;
            if (metadata.line === 'DEF') return primaryPos === Position.DC || primaryPos === Position.DL || primaryPos === Position.DR;
            if (metadata.line === 'DM') return primaryPos === Position.DM || primaryPos === Position.DML || primaryPos === Position.DMR;
            if (metadata.line === 'MID') return primaryPos === Position.MC || primaryPos === Position.MR || primaryPos === Position.ML;
            // Fix: Comparison between narrowed enum type and specific member caused overlap error due to duplicate string values in Position enum. Casting primaryPos to any to skip overlap check.
            if (metadata.line === 'AM') return (primaryPos as any) === Position.AM || primaryPos === Position.AMC || primaryPos === Position.AMR || primaryPos === Position.AML;
            if (metadata.line === 'ATT') return primaryPos === Position.ST || primaryPos === Position.STR || primaryPos === Position.STL;
            return false;
        });

        let best = eligible.sort((a,b) => b.currentAbility - a.currentAbility)[0];
        if (!best) {
            best = players.filter(p => !p.isStarter).sort((a,b) => b.currentAbility - a.currentAbility)[0];
        }

        if (best) { 
            best.isStarter = true; 
            best.tacticalPosition = slot; 
        }
    });

    return players.filter(p => p.isStarter);
  }

  saveTactic(name: string, positions: number[], settings: TacticSettings) {
    this.tactics.push({ id: generateUUID(), name, positions, settings, arrows: {}, individualSettings: {} });
  }

  makeTransferOffer(playerId: string, fromClubId: string, amount: number, type: 'PURCHASE' | 'LOAN', date: Date, wageShare = 100) {
    const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: this.players.find(p => p.id === playerId)!.clubId, amount, wageShare, type, status: 'ACCEPTED', date, responseDate: date, isViewed: false };
    this.offers.push(offer);
  }

  acceptCounterOffer(offerId: string, date: Date) {
    const o = this.offers.find(offer => offer.id === offerId);
    if (o) { o.status = 'ACCEPTED'; o.amount = o.counterAmount || o.amount; o.responseDate = date; }
  }

  completeTransfer(offer: TransferOffer) {
    const p = this.players.find(player => player.id === offer.playerId);
    if (p) {
        const oldClub = this.getClub(p.clubId); const newClub = this.getClub(offer.fromClubId);
        if (oldClub && offer.type === 'PURCHASE') oldClub.finances.balance += offer.amount;
        if (newClub && offer.type === 'PURCHASE') newClub.finances.balance -= offer.amount;
        p.clubId = offer.fromClubId; p.isStarter = false; p.tacticalPosition = undefined;
        offer.status = 'COMPLETED';
    }
  }

  rescindContract(playerId: string, date: Date) {
    const p = this.players.find(player => player.id === playerId);
    if (p) { p.clubId = 'FREE_AGENT'; p.isStarter = false; p.tacticalPosition = undefined; }
  }

  createHumanManager(clubId: string, name: string) {
    const manager: Staff = { id: generateUUID(), name, age: 35, nationality: "Argentina", role: 'HEAD_COACH', clubId, attributes: { coaching: 12, judgingAbility: 12, judgingPotential: 11, tacticalKnowledge: 10, adaptability: 10, medical: 2, physiotherapy: 2, motivation: 14, manManagement: 13 }, salary: 12000, contractExpiry: new Date(2009, 5, 30), history: [] };
    this.staff = this.staff.filter(s => s.clubId !== clubId || s.role !== 'HEAD_COACH');
    this.staff.unshift(manager);
  }

  getRequestedSalary(player: Player, club: Club) { return Math.round(player.salary * 1.2); }
  submitContractOffer(player: Player, salary: number, years: number, date: Date) { return 'ACCEPTED'; }
  processAIActivity(date: Date) {}
  processDailyContracts(date: Date, userClubId?: string) {}
  processTransferDecisions(date: Date) {}
  checkRenewalTriggers(date: Date, userClubId?: string) {}

  addInboxMessage(category: MessageCategory, subject: string, body: string, date: Date, relatedId?: string) {
    this.inbox.unshift({ id: generateUUID(), date: new Date(date), category, subject, body, isRead: false, relatedId });
  }
}

export const world = new WorldManager();