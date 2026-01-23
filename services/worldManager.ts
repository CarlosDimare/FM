
import { Player, Club, Competition, CompetitionType, Position, PlayerStats, Fixture, TableEntry, Tactic, Staff, StaffRole, SquadType, PlayerSeasonStats, ClubHonour, TransferOffer, InboxMessage, MessageCategory, MatchLog } from "../types";
import { generateUUID, randomInt, weightedRandom } from "./utils";
import { NATIONS } from "../constants";
import { TACTIC_PRESETS, NAMES_DB, STAFF_NAMES, POS_DEFINITIONS, ARG_PRIMERA, ARG_NACIONAL, CONT_CLUBS, WORLD_BOSSES, RealClubDef } from "../data/static";

export class WorldManager {
  players: Player[] = [];
  clubs: Club[] = [];
  competitions: Competition[] = [];
  staff: Staff[] = [];
  tactics: Tactic[] = [...TACTIC_PRESETS];
  offers: TransferOffer[] = [];
  inbox: InboxMessage[] = [];
  matchHistory: MatchLog[] = []; // Persistent history

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

    // Load Argentine Leagues
    this.loadRealClubs(ARG_PRIMERA, "L_ARG_1");
    this.loadRealClubs(ARG_NACIONAL, "L_ARG_2");
    
    // Load Continental Opponents (Not in a playable league, but exist for cups)
    // We assign them to a dummy ID so they don't appear in the main tables but exist in world
    this.loadRealClubs(CONT_CLUBS, "L_SAM_OTHER");
    
    // Load World Bosses (Real Madrid etc) for Club World Cup
    this.loadRealClubs(WORLD_BOSSES, "L_EUR_ELITE");

    this.players.forEach(p => {
       if (Math.random() < 0.05) {
          p.transferStatus = Math.random() > 0.5 ? 'TRANSFERABLE' : 'LOANABLE';
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
           primaryColor: def.pCol,
           secondaryColor: def.sCol,
           finances: {
              balance: def.rep * 2500, // Richer clubs have more rep
              transferBudget: def.rep * 800,
              wageBudget: def.rep * 80,
              monthlyIncome: def.rep * 200,
              monthlyExpenses: 0
           },
           reputation: def.rep,
           stadium: def.stadium,
           honours: this.generateRandomHonours()
        };
        this.clubs.push(club);
        this.generateSquadsForClub(club.id);
        this.generateStaffForClub(club.id);
        this.updateClubMonthlyExpenses(club.id);
     });
  }

  addInboxMessage(category: MessageCategory, subject: string, body: string, date: Date, relatedId?: string) {
    this.inbox.unshift({ id: generateUUID(), date: new Date(date), category, subject, body, isRead: false, relatedId });
  }

  updateClubMonthlyExpenses(clubId: string) {
    const club = this.getClub(clubId);
    if (!club) return;
    const players = this.getPlayersByClub(clubId);
    const staff = this.getStaffByClub(clubId);
    const totalSalaries = players.reduce((sum, p) => sum + p.salary, 0) + staff.reduce((sum, s) => sum + s.salary, 0);
    club.finances.monthlyExpenses = totalSalaries + (club.reputation * 10);
  }

  generateRandomHonours(): ClubHonour[] {
    const honours: ClubHonour[] = [];
    const possible = ["Liga Profesional", "Copa Argentina", "Supercopa", "Copa Libertadores", "Copa Sudamericana"];
    const count = randomInt(0, 5);
    for (let i = 0; i < count; i++) {
      honours.push({ name: possible[randomInt(0, possible.length - 1)], year: randomInt(1970, 2007) });
    }
    return honours.sort((a,b) => b.year - a.year);
  }

  generateSquadsForClub(clubId: string) {
    const squads: SquadType[] = ['SENIOR', 'RESERVE', 'U20'];
    squads.forEach(squadType => {
      const size = squadType === 'SENIOR' ? 24 : squadType === 'RESERVE' ? 20 : 18;
      const squadStructure = [...Array(Math.floor(size*0.1)).fill('GK'), ...Array(Math.floor(size*0.3)).fill('DEF'), ...Array(Math.floor(size*0.2)).fill('DM'), ...Array(Math.floor(size*0.2)).fill('MID'), ...Array(Math.floor(size*0.2)).fill('ATT')];
      
      squadStructure.forEach((roleType, index) => {
        let posPool: Position[] = roleType === 'GK' ? POS_DEFINITIONS.GK : roleType === 'DEF' ? POS_DEFINITIONS.DEF : roleType === 'DM' ? POS_DEFINITIONS.DM : roleType === 'MID' ? POS_DEFINITIONS.MID : POS_DEFINITIONS.ATT;
        const primaryPos = posPool[randomInt(0, posPool.length - 1)];
        
        let ageRange = squadType === 'U20' ? [15, 19] : squadType === 'RESERVE' ? [17, 25] : [18, 36];
        const player = this.createRandomPlayer(clubId, primaryPos, ageRange[0], ageRange[1]);
        player.squad = squadType;
        
        if (squadType === 'SENIOR' && index < 11) {
          player.isStarter = true;
          const p442 = TACTIC_PRESETS[0].positions;
          player.tacticalPosition = p442[index];
        }
        this.players.push(player);
      });
    });
  }

  generateStaffForClub(clubId: string) {
    const roles: StaffRole[] = ['ASSISTANT_MANAGER', 'PHYSIO', 'FITNESS_COACH', 'RESERVE_MANAGER', 'YOUTH_MANAGER'];
    
    roles.forEach(role => {
      const coachingAbility = weightedRandom(8, 20);
      const s: Staff = {
        id: generateUUID(),
        name: `${STAFF_NAMES.names[randomInt(0, STAFF_NAMES.names.length-1)]} ${STAFF_NAMES.surnames[randomInt(0, STAFF_NAMES.surnames.length-1)]}`,
        age: randomInt(35, 65),
        nationality: "Argentina",
        role: role,
        clubId: clubId,
        attributes: {
          coaching: coachingAbility,
          judgingAbility: weightedRandom(8, 20),
          judgingPotential: weightedRandom(8, 20),
          medical: role === 'PHYSIO' ? weightedRandom(15, 20) : weightedRandom(1, 10),
          physiotherapy: role === 'PHYSIO' ? weightedRandom(15, 20) : weightedRandom(1, 10),
          motivation: weightedRandom(8, 20),
          manManagement: weightedRandom(8, 20)
        },
        salary: coachingAbility * 3500
      };
      this.staff.push(s);
    });
  }

  createRandomPlayer(clubId: string, primaryPos: Position, minAge = 16, maxAge = 36): Player {
    const club = this.getClub(clubId);
    const repBase = club ? club.reputation / 500 : 10;
    const tier = randomInt(Math.max(1, repBase - 5), Math.min(20, repBase + 5)); 

    const secondaryPositions: Position[] = [];
    if (Math.random() > 0.6) {
       const related = this.getRelatedPosition(primaryPos);
       if (related && related !== primaryPos) secondaryPositions.push(related);
    }

    const isGk = primaryPos === Position.GK;
    const isDef = primaryPos.includes("DF") || primaryPos === Position.SW;
    const isAtt = primaryPos.includes("DL") || primaryPos.includes("ST");

    let height = 182;
    if (isGk) height = randomInt(185, 202);
    else if (isDef) height = randomInt(180, 198);
    else if (isAtt) height = randomInt(165, 195);
    else height = randomInt(168, 188);

    let weight = height - 105 + randomInt(-5, 10);
    const age = randomInt(minAge, maxAge);
    const birthYear = 2008 - age;
    const birthDate = new Date(birthYear, randomInt(0, 11), randomInt(1, 28));

    const stats: PlayerStats = {
      mental: { aggression: weightedRandom(1, 20), anticipation: weightedRandom(tier - 3, Math.min(20, tier + 4)), bravery: weightedRandom(1, 20), composure: weightedRandom(tier - 3, Math.min(20, tier + 4)), concentration: weightedRandom(1, 20), decisions: weightedRandom(tier - 2, Math.min(20, tier + 4)), determination: weightedRandom(1, 20), flair: weightedRandom(1, 20), leadership: weightedRandom(1, 20), offTheBall: weightedRandom(1, 20), positioning: weightedRandom(tier - 3, Math.min(20, tier + 4)), teamwork: weightedRandom(1, 20), vision: weightedRandom(tier - 4, Math.min(20, tier + 5)), workRate: weightedRandom(1, 20) },
      technical: { corners: weightedRandom(1, 20), crossing: weightedRandom(1, 20), dribbling: weightedRandom(1, 20), finishing: isAtt ? weightedRandom(tier, 20) : weightedRandom(1, 15), firstTouch: weightedRandom(tier - 2, Math.min(20, tier + 3)), freeKickTaking: weightedRandom(1, 20), heading: weightedRandom(1, 20), longShots: weightedRandom(1, 20), longThrows: weightedRandom(1, 20), marking: isDef ? weightedRandom(tier, 20) : weightedRandom(1, 15), passing: weightedRandom(tier - 3, Math.min(20, tier + 4)), penaltyTaking: weightedRandom(1, 20), tackling: isDef ? weightedRandom(tier, 20) : weightedRandom(1, 15), technique: weightedRandom(tier - 2, Math.min(20, tier + 4)) },
      physical: { acceleration: weightedRandom(5, 20), agility: weightedRandom(5, 20), balance: weightedRandom(5, 20), jumpingReach: height > 190 ? weightedRandom(14, 20) : weightedRandom(5, 16), naturalFitness: weightedRandom(10, 20), pace: weightedRandom(5, 20), stamina: weightedRandom(10, 20), strength: weight > 85 ? weightedRandom(14, 20) : weightedRandom(5, 16) }
    };

    if (isGk) stats.goalkeeping = { aerialReach: weightedRandom(tier, 20), commandOfArea: weightedRandom(tier, 20), communication: weightedRandom(tier, 20), eccentricity: weightedRandom(1, 20), handling: weightedRandom(tier, 20), kicking: weightedRandom(tier, 20), oneOnOnes: weightedRandom(tier, 20), reflexes: weightedRandom(tier, 20), rushingOut: weightedRandom(tier, 20), punching: weightedRandom(tier, 20), throwing: weightedRandom(tier, 20) };

    const avg = (stats.technical.technique + stats.mental.decisions + stats.physical.stamina) / 3;
    const currentAbility = avg * 10;
    const potentialAbility = Math.min(200, currentAbility + randomInt(0, 40));
    
    const ageFactor = age < 23 ? 1.5 : age > 30 ? 0.6 : 1.0;
    const value = Math.round((currentAbility * currentAbility * 2500) * ageFactor);
    const salary = Math.round((currentAbility * 2500) / 10) * 10;

    const contractYears = randomInt(1, 4);
    const contractExpiry = new Date(2008 + contractYears, 5, 30);
    
    const nat = club ? "Argentina" : NATIONS[randomInt(0, NATIONS.length - 1)];

    return {
      id: generateUUID(),
      name: `${NAMES_DB.firstNames[randomInt(0, NAMES_DB.firstNames.length - 1)]} ${NAMES_DB.lastNames[randomInt(0, NAMES_DB.lastNames.length - 1)]}`,
      age: age, birthDate: birthDate, height, weight, nationality: nat,
      positions: [primaryPos], secondaryPositions: secondaryPositions, stats: stats,
      seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, totalRating: 0 },
      currentAbility, potentialAbility, fitness: 100, morale: 100, clubId: clubId, isStarter: false, squad: 'SENIOR',
      value, salary, transferStatus: 'NONE', contractExpiry, loyalty: weightedRandom(5, 20), negotiationAttempts: 0,
      isUnhappyWithContract: false
    };
  }

  getRelatedPosition(pos: Position): Position | null {
     switch(pos) {
        case Position.DC: return Math.random() > 0.5 ? Position.SW : Position.DMC;
        case Position.DR: return Math.random() > 0.5 ? Position.MR : Position.DRC;
        case Position.DL: return Math.random() > 0.5 ? Position.ML : Position.DLC;
        case Position.DMC: return Math.random() > 0.5 ? Position.MC : Position.DC;
        case Position.MC: return Math.random() > 0.5 ? Position.AMC : Position.DMC;
        case Position.MR: return Math.random() > 0.5 ? Position.AMR : Position.DR;
        case Position.ML: return Math.random() > 0.5 ? Position.AML : Position.DL;
        case Position.AMC: return Math.random() > 0.5 ? Position.STC : Position.MC;
        case Position.AMR: return Math.random() > 0.5 ? Position.MR : Position.STR;
        case Position.AML: return Math.random() > 0.5 ? Position.ML : Position.STL;
        case Position.STC: return Position.AMC;
        default: return null;
     }
  }

  getClub(id: string) { return this.clubs.find(c => c.id === id); }
  getPlayersByClub(clubId: string) { return this.players.filter(p => p.clubId === clubId); }
  getStaffByClub(clubId: string) { return this.staff.filter(s => s.clubId === clubId); }
  getLeagues() { return this.competitions.filter(c => c.type === 'LEAGUE'); }
  getClubsByLeague(leagueId: string) { return this.clubs.filter(c => c.leagueId === leagueId); }
  getTactics(): Tactic[] { return this.tactics; }
  saveTactic(name: string, positions: number[]) { this.tactics.push({ id: generateUUID(), name, positions }); }

  getClubsByCompetition(competitionId: string, fixtures: Fixture[]): Club[] {
     const clubIds = new Set<string>();
     fixtures.filter(f => f.competitionId === competitionId).forEach(f => {
        clubIds.add(f.homeTeamId);
        clubIds.add(f.awayTeamId);
     });
     return this.clubs.filter(c => clubIds.has(c.id));
  }

  getLeagueTable(competitionId: string, fixtures: Fixture[], squadType: SquadType = 'SENIOR', groupId?: number): TableEntry[] {
     const clubs = this.getClubsByCompetition(competitionId, fixtures);
     const table: Record<string, TableEntry> = {};
     
     clubs.forEach(c => { table[c.id] = { clubId: c.id, clubName: c.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }; });
     
     const relevantFixtures = fixtures.filter(f => 
        f.competitionId === competitionId && 
        f.played && 
        f.squadType === squadType &&
        (groupId === undefined || f.groupId === groupId)
     );

     relevantFixtures.forEach(f => {
        const home = table[f.homeTeamId]; const away = table[f.awayTeamId];
        if (!home || !away) return;
        const hScore = f.homeScore || 0; const aScore = f.awayScore || 0;
        home.played++; away.played++; home.gf += hScore; home.ga += aScore; home.gd = home.gf - home.ga; away.gf += aScore; away.ga += hScore; away.gd = away.gf - away.ga;
        if (hScore > aScore) { home.won++; home.points += 3; away.lost++; }
        else if (hScore < aScore) { away.won++; away.points += 3; home.lost++; }
        else { home.drawn++; home.points += 1; away.drawn++; away.points += 1; }
     });
     
     const result = Object.values(table).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
     if (groupId !== undefined) {
        return result.filter(r => r.played > 0);
     }
     return result;
  }

  processAIActivity(currentDate: Date) {
     this.processAITransfers(currentDate);
     this.processAIRenewals(currentDate);
     this.cleanUpAIDeadwood(); // AI tries to sell unwanted players
     this.updatePlayerMarketValues(); // Daily dynamic value update
  }

  private updatePlayerMarketValues() {
     this.players.forEach(p => {
        const ageFactor = p.age < 23 ? 1.5 : p.age > 30 ? 0.6 : 1.0;
        let formFactor = 1.0;
        if (p.seasonStats.appearances > 0) {
           const avgRating = p.seasonStats.totalRating / p.seasonStats.appearances;
           if (avgRating > 7.5) formFactor = 1.3;
           else if (avgRating < 6.0) formFactor = 0.8;
        }
        
        const baseValue = (p.currentAbility * p.currentAbility * 2500) * ageFactor * formFactor;
        
        const noise = randomInt(-5, 5) / 100;
        p.value = Math.max(1000, Math.round(baseValue * (1 + noise)));
     });
  }

  selectBestEleven(clubId: string, squadType: SquadType = 'SENIOR'): Player[] {
     const defaultFormation = [0, 6, 7, 8, 10, 16, 17, 19, 20, 27, 29];
     const allPlayers = this.getPlayersByClub(clubId).filter(p => p.squad === squadType && !p.injury && (!p.suspension || p.suspension.matchesLeft === 0));
     
     this.getPlayersByClub(clubId).forEach(p => { 
        if (p.squad === squadType) p.isStarter = false; 
     });

     const starters: Player[] = [];
     const usedIds = new Set<string>();

     const getBestForSlot = (tacticalIndex: number): Player | null => {
        let role = 'MID';
        if (tacticalIndex === 0) role = 'GK';
        else if (tacticalIndex >= 1 && tacticalIndex <= 15) role = 'DEF';
        else if (tacticalIndex >= 26) role = 'ATT';

        const candidates = allPlayers.filter(p => !usedIds.has(p.id) && this.playerFitsRole(p, role));
        return candidates.sort((a,b) => (b.currentAbility * (b.fitness/100)) - (a.currentAbility * (a.fitness/100)))[0];
     };

     defaultFormation.forEach(slot => {
        let player = getBestForSlot(slot);
        if (!player) {
           player = allPlayers.find(p => !usedIds.has(p.id));
        }

        if (player) {
           player.isStarter = true;
           player.tacticalPosition = slot;
           starters.push(player);
           usedIds.add(player.id);
        }
     });

     return starters;
  }

  private playerFitsRole(p: Player, role: string): boolean {
     if (role === 'GK') return p.positions.includes(Position.GK);
     if (role === 'DEF') return p.positions.some(pos => pos.includes('DF') || pos === Position.SW);
     if (role === 'MID') return p.positions.some(pos => pos.includes('M') || pos.includes('DM'));
     if (role === 'ATT') return p.positions.some(pos => pos.includes('ST') || pos.includes('DL') || pos.includes('AM'));
     return false;
  }

  private cleanUpAIDeadwood() {
     this.clubs.forEach(club => {
        if (club.id === this.players[0]?.clubId) return; 
        
        const players = this.getPlayersByClub(club.id);
        if (players.length > 25) {
           const deadwood = players.filter(p => 
              p.squad === 'SENIOR' && 
              p.age > 23 && 
              p.seasonStats.appearances < 5 && 
              p.transferStatus === 'NONE'
           );
           
           deadwood.forEach(p => {
              if (Math.random() < 0.1) p.transferStatus = 'TRANSFERABLE';
           });
        }
     });
  }

  private processAITransfers(currentDate: Date) {
     const buyer = this.clubs.filter(c => c.reputation > 6000 && c.finances.transferBudget > 2000000)[randomInt(0, 5)];
     if (!buyer) return;

     const squad = this.getPlayersByClub(buyer.id).filter(p => p.squad === 'SENIOR');
     const gks = squad.filter(p => p.positions.includes(Position.GK)).length;
     const defs = squad.filter(p => p.positions.some(pos => pos.includes('DF'))).length;
     const mids = squad.filter(p => p.positions.some(pos => pos.includes('M'))).length;
     const atts = squad.filter(p => p.positions.some(pos => pos.includes('ST') || pos.includes('DL'))).length;

     let neededPos = '';
     if (gks < 2) neededPos = 'GK';
     else if (defs < 7) neededPos = 'DEF';
     else if (mids < 7) neededPos = 'MID';
     else if (atts < 4) neededPos = 'ATT';
     
     if (Math.random() < 0.2) neededPos = 'ANY';

     if (neededPos === '') return; 

     const candidates = this.players.filter(p => 
        p.clubId !== buyer.id && 
        p.value < buyer.finances.transferBudget * 0.9 &&
        p.transferStatus !== 'NONE' 
     );
     
     const target = candidates.find(p => {
        if (neededPos === 'ANY') return p.currentAbility > 150;
        return this.playerFitsRole(p, neededPos) && p.currentAbility > 130;
     });

     if (!target) return;

     const seller = this.getClub(target.clubId);
     if (seller && seller.reputation <= buyer.reputation) {
        const fee = Math.round(target.value * (Math.random() * 0.2 + 0.9));
        buyer.finances.transferBudget -= fee;
        buyer.finances.balance -= fee;
        seller.finances.transferBudget += fee;
        seller.finances.balance += fee;
        
        target.clubId = buyer.id;
        target.squad = 'SENIOR';
        target.isStarter = false;
        target.transferStatus = 'NONE';
        
        if (target.value > 8000000) {
           this.addInboxMessage('MARKET', 'Fichaje Confirmado', `${buyer.name} refuerza su plantilla con ${target.name} (£${(fee/1000000).toFixed(1)}M).`, currentDate);
        }
     }
  }

  private processAIRenewals(currentDate: Date) {
     this.players.forEach(p => {
        const monthsLeft = (p.contractExpiry.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
        if (monthsLeft < 12 && monthsLeft > 0) {
           const club = this.getClub(p.clubId);
           if (club && p.currentAbility > 130 && club.finances.wageBudget > p.salary * 1.1) {
              if (Math.random() < 0.1) {
                 p.contractExpiry = new Date(currentDate.getFullYear() + randomInt(2, 4), 5, 30);
                 p.salary = Math.round(p.salary * 1.1);
                 p.isUnhappyWithContract = false;
              }
           }
        }
     });
  }

  getRequestedSalary(player: Player, club: Club): number {
    const base = (player.currentAbility * 2500) / 10;
    const factor = player.age < 24 ? 1.3 : 1.1;
    const demand = Math.max(base * factor, player.salary * 1.15);
    return Math.round(demand / 500) * 500;
  }

  checkRenewalTriggers(currentDate: Date) {
    this.players.forEach(p => {
       const monthsLeft = (p.contractExpiry.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
       const avgRating = p.seasonStats.appearances > 5 ? p.seasonStats.totalRating / p.seasonStats.appearances : 0;
       if (!p.requestedSalary) {
          if (monthsLeft < 12 || (avgRating > 7.5 && p.morale > 80)) {
             const club = this.getClub(p.clubId);
             if (club) { p.requestedSalary = this.getRequestedSalary(p, club); p.isUnhappyWithContract = true; }
          }
       }
    });
  }

  submitContractOffer(player: Player, proposedSalary: number, years: number, currentDate: Date): 'ACCEPTED' | 'REJECTED' | 'BROKEN' {
    if (player.negotiationAttempts >= 3) return 'BROKEN';
    const club = this.getClub(player.clubId);
    if (!club) return 'REJECTED';
    const demand = player.requestedSalary || this.getRequestedSalary(player, club);
    const acceptanceThreshold = demand * 0.95;
    player.negotiationAttempts++;
    player.lastNegotiationDate = new Date(currentDate);
    if (proposedSalary >= acceptanceThreshold) {
       player.salary = proposedSalary; player.contractExpiry = new Date(currentDate.getFullYear() + years, 5, 30);
       player.negotiationAttempts = 0; player.isUnhappyWithContract = false; player.morale = Math.min(100, player.morale + 20);
       this.addInboxMessage('SQUAD', `Renovación: ${player.name}`, `${player.name} ha firmado un nuevo contrato con el club.`, currentDate, player.id);
       return 'ACCEPTED';
    }
    if (player.negotiationAttempts >= 3) {
       player.morale = Math.max(0, player.morale - 40); player.transferStatus = 'TRANSFERABLE';
       this.addInboxMessage('SQUAD', `Negociaciones Rotas: ${player.name}`, `${player.name} rompe negociaciones y pide ser transferido.`, currentDate, player.id);
       return 'BROKEN';
    }
    return 'REJECTED';
  }

  makeTransferOffer(playerId: string, fromClubId: string, amount: number, type: 'PURCHASE' | 'LOAN', currentDate: Date): TransferOffer {
    const player = this.players.find(p => p.id === playerId);
    if (!player) throw new Error("Player not found");
    const responseDate = new Date(currentDate);
    responseDate.setDate(responseDate.getDate() + randomInt(2, 4));
    const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: player.clubId, amount, type, status: 'PENDING', date: new Date(currentDate), responseDate, isViewed: false };
    this.offers.push(offer);
    return offer;
  }

  processTransferDecisions(currentDate: Date) {
    this.offers.forEach(offer => {
      if (offer.status !== 'PENDING' || currentDate < offer.responseDate) return;
      const player = this.players.find(p => p.id === offer.playerId);
      const toClub = this.getClub(offer.toClubId);
      if (!player || !toClub) return;
      const targetValue = player.value;
      if (offer.type === 'PURCHASE') {
        const isListed = player.transferStatus === 'TRANSFERABLE';
        if (!isListed && offer.amount < targetValue * 3) {
          offer.status = 'COUNTER_OFFER'; offer.counterAmount = Math.round(targetValue * 3);
          this.addInboxMessage('MARKET', `Contraoferta por ${player.name}`, `El ${toClub.name} pide £${(offer.counterAmount/1000000).toFixed(1)}M.`, currentDate, player.id);
        } else {
          offer.status = (offer.amount >= targetValue * 0.9) ? 'ACCEPTED' : 'REJECTED';
          const msg = offer.status === 'ACCEPTED' ? `Oferta Aceptada por ${player.name}` : `Oferta Rechazada por ${player.name}`;
          this.addInboxMessage('MARKET', msg, `Respuesta del ${toClub.name}.`, currentDate, player.id);
        }
      }
    });
  }

  completeTransfer(offer: TransferOffer) {
    const player = this.players.find(p => p.id === offer.playerId);
    const fromClub = this.getClub(offer.fromClubId);
    const toClub = this.getClub(offer.toClubId);
    if (player && fromClub && toClub) {
      if (offer.type === 'PURCHASE') { fromClub.finances.balance -= offer.amount; toClub.finances.balance += offer.amount; }
      player.clubId = offer.fromClubId; player.squad = 'SENIOR'; player.isStarter = false; player.transferStatus = 'NONE';
      this.updateClubMonthlyExpenses(fromClub.id); this.updateClubMonthlyExpenses(toClub.id);
      offer.status = 'COMPLETED';
    }
  }

  acceptCounterOffer(offerId: string, currentDate: Date) {
    const offer = this.offers.find(o => o.id === offerId);
    if (offer && offer.counterAmount) {
      offer.amount = offer.counterAmount; offer.status = 'ACCEPTED';
      const player = this.players.find(p => p.id === offer.playerId);
      if (player) this.addInboxMessage('MARKET', `Fichaje Confirmado: ${player.name}`, `Has aceptado la contraoferta.`, currentDate, player.id);
    }
  }
}
export const world = new WorldManager();
