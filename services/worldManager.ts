
import { Player, Club, Competition, CompetitionType, Position, PlayerStats, Fixture, TableEntry, Tactic, Staff, StaffRole, SquadType, PlayerSeasonStats, ClubHonour, TransferOffer, InboxMessage, MessageCategory, MatchLog } from "../types";
import { generateUUID, randomInt, weightedRandom } from "./utils";
import { NATIONS } from "../constants";
import { TACTIC_PRESETS, NAMES_DB, REGEN_DB, STAFF_NAMES, POS_DEFINITIONS, ARG_PRIMERA, ARG_NACIONAL, CONT_CLUBS, CONT_CLUBS_TIER2, WORLD_BOSSES, RealClubDef } from "../data/static";

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
    
    // Load Continental Opponents
    // We assign them to a dummy ID so they don't appear in the main tables but exist in world
    // Merge both Elite and Tier 2 lists into the pool
    this.loadRealClubs([...CONT_CLUBS, ...CONT_CLUBS_TIER2], "L_SAM_OTHER");
    
    // Load World Bosses (Real Madrid etc) for Club World Cup
    this.loadRealClubs(WORLD_BOSSES, "L_EUR_ELITE");

    this.players.forEach(p => {
       // Random initial transfer status for immersion
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
      const contractYears = randomInt(1, 4);
      const startYear = 2008 - randomInt(0, 5);
      
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
        salary: coachingAbility * 3500,
        contractExpiry: new Date(2008 + contractYears, 5, 30),
        history: [
           { year: startYear, clubId: clubId, role: role },
           { year: startYear - randomInt(1, 3), clubId: this.clubs[randomInt(0, this.clubs.length-1)]?.id || clubId, role: role }
        ]
      };
      this.staff.push(s);
    });
  }

  createHumanManager(clubId: string, name: string) {
     const manager: Staff = {
        id: generateUUID(),
        name: name,
        age: 35,
        nationality: "Argentina", // Default
        role: 'HEAD_COACH',
        clubId: clubId,
        attributes: {
           coaching: 12,
           judgingAbility: 12,
           judgingPotential: 11,
           medical: 2,
           physiotherapy: 2,
           motivation: 14,
           manManagement: 13
        },
        salary: 12000,
        contractExpiry: new Date(2009, 5, 30),
        history: []
     };
     this.staff.unshift(manager); // Add to beginning so it appears first in list if not sorted
  }

  createRandomPlayer(clubId: string, primaryPos: Position, minAge = 16, maxAge = 36, baseYear: number = 2008): Player {
    const club = this.getClub(clubId);
    const repBase = club ? club.reputation / 500 : 10;
    const tier = randomInt(Math.max(1, repBase - 5), Math.min(20, repBase + 5)); 

    // Nationality & Name Generation
    let nat = "Argentina";
    let firstName = "";
    let lastName = "";

    // Determine Nationality based on club
    if (club) {
        // 90% chance to be from the club's country, 10% foreign
        if (Math.random() < 0.9) {
            nat = club.country;
        } else {
            // Random foreigner (neighbor or european)
            const foreignOptions = Object.keys(REGEN_DB);
            // Add Argentina to mix if club is not argentine
            if (club.country !== "Argentina") foreignOptions.push("argentina");
            
            const pickedKey = foreignOptions[randomInt(0, foreignOptions.length - 1)];
            // Map key back to display name if needed, or stick to simple
            if (pickedKey === "argentina") nat = "Argentina";
            else {
                // Find matching display name or just Capitalize
                // Simple mapping back from key to display name would be ideal but for now we rely on REGEN_DB structure
                // Reverse look up FLAGS keys or just capitalize
                nat = pickedKey.charAt(0).toUpperCase() + pickedKey.slice(1);
                if (pickedKey === "espana") nat = "España";
                if (pickedKey === "inglaterra") nat = "Inglaterra";
                if (pickedKey === "alemania") nat = "Alemania";
                if (pickedKey === "paises bajos") nat = "Países Bajos";
                if (pickedKey === "belgica") nat = "Bélgica";
                if (pickedKey === "brasil") nat = "Brasil";
                if (pickedKey === "peru") nat = "Peru";
            }
        }
    } else {
        nat = NATIONS[randomInt(0, NATIONS.length - 1)];
    }

    // Generate Name based on Nationality
    const normalizeKey = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const regenKey = normalizeKey(nat);

    if (REGEN_DB[regenKey]) {
        const db = REGEN_DB[regenKey];
        firstName = db.nombres[randomInt(0, db.nombres.length - 1)];
        lastName = db.apellidos[randomInt(0, db.apellidos.length - 1)];
    } else {
        // Fallback to generic/Argentine names
        firstName = NAMES_DB.firstNames[randomInt(0, NAMES_DB.firstNames.length - 1)];
        lastName = NAMES_DB.lastNames[randomInt(0, NAMES_DB.lastNames.length - 1)];
        // Force nat to Argentina if we used Argentine names and nat wasn't specific
        if (!club && !NATIONS.includes(nat)) nat = "Argentina";
    }

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
    const birthYear = baseYear - age;
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
    const reputation = Math.round(currentAbility * 40 + randomInt(0, 500));
    
    const ageFactor = age < 23 ? 1.5 : age > 30 ? 0.6 : 1.0;
    const value = Math.round((currentAbility * currentAbility * 2500) * ageFactor);
    const salary = Math.round((currentAbility * 2500) / 10) * 10;

    const contractYears = randomInt(1, 4);
    const contractExpiry = new Date(baseYear + contractYears, 5, 30);
    
    return {
      id: generateUUID(),
      name: `${firstName} ${lastName}`,
      age: age, birthDate: birthDate, height, weight, nationality: nat,
      positions: [primaryPos], secondaryPositions: secondaryPositions, stats: stats,
      seasonStats: { appearances: 0, goals: 0, assists: 0, cleanSheets: 0, conceded: 0, totalRating: 0 },
      statsByCompetition: {},
      history: [],
      currentAbility, potentialAbility, reputation, fitness: 100, morale: 100, clubId: clubId, isStarter: false, squad: 'SENIOR',
      value, salary, transferStatus: 'NONE', contractExpiry, loyalty: weightedRandom(5, 20), negotiationAttempts: 0,
      isUnhappyWithContract: false,
      developmentTrend: 'STABLE',
      yellowCardsAccumulated: 0
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

  // CORE AI LOGIC
  processAIActivity(currentDate: Date) {
     this.generateAIOffersToUser(currentDate); // AI bidding on User players
     this.processBackgroundTransfers(currentDate); // AI vs AI transfers
     this.processAIRenewals(currentDate);
     this.manageAISquads(currentDate); // List players for transfer/loan
     this.processAIUnsettling(currentDate); // Big clubs unsettling players
     this.updatePlayerMarketValues(); 
  }

  // 1. AI OFFERS TO USER
  private generateAIOffersToUser(currentDate: Date) {
     if (Math.random() > 0.05) return; // Only 5% chance per day to initiate user offers loop

     // Find a rich club looking for players
     const buyers = this.clubs.filter(c => c.finances.transferBudget > 3000000 && c.reputation > 5000);
     const buyer = buyers[randomInt(0, buyers.length - 1)];
     if (!buyer) return;

     const potentialTargets = this.players.filter(p => p.clubId !== buyer.id && p.clubId !== 'FREE_AGENT' && p.currentAbility > 120);
     const target = potentialTargets[randomInt(0, potentialTargets.length - 1)];
     if (!target) return;

     const sellerClub = this.getClub(target.clubId);
     if (!sellerClub) return;

     // Determine Offer Type
     const isTransferListed = target.transferStatus === 'TRANSFERABLE';
     const isLoanListed = target.transferStatus === 'LOANABLE';
     
     // AI Logic: Buy if listed OR if they are rich and want a star
     if (isTransferListed || (buyer.reputation > sellerClub.reputation + 500 && buyer.finances.transferBudget > target.value * 1.5)) {
        // Make Purchase Offer
        const offerAmount = isTransferListed ? target.value : Math.round(target.value * (randomInt(11, 15) / 10));
        
        // Check if offer already exists
        const exists = this.offers.some(o => o.playerId === target.id && o.fromClubId === buyer.id && o.status === 'PENDING');
        if (!exists) {
           this.makeTransferOffer(target.id, buyer.id, offerAmount, 'PURCHASE', currentDate);
        }
     } 
     // AI Logic: Loan if listed loanable and young
     else if (isLoanListed && target.age < 23 && buyer.reputation < sellerClub.reputation) {
        const exists = this.offers.some(o => o.playerId === target.id && o.fromClubId === buyer.id && o.status === 'PENDING');
        if (!exists) {
           this.makeTransferOffer(target.id, buyer.id, 0, 'LOAN', currentDate);
        }
     }
  }

  // 2. AI SQUAD MANAGEMENT (Listing players)
  private manageAISquads(currentDate: Date) {
     // Run periodically, not every day for everyone
     if (Math.random() > 0.1) return;

     this.clubs.forEach(club => {
        const squad = this.getPlayersByClub(club.id);
        
        // A. TRANSFER LIST DEADWOOD
        const deadwood = squad.filter(p => p.age > 29 && p.squad !== 'SENIOR' && p.contractExpiry.getFullYear() <= currentDate.getFullYear() + 1);
        deadwood.forEach(p => {
           if (Math.random() < 0.3) p.transferStatus = 'TRANSFERABLE';
        });

        // B. LOAN LIST YOUNGSTERS
        const youngsters = squad.filter(p => p.age < 21 && p.potentialAbility > p.currentAbility + 20 && p.squad !== 'SENIOR');
        youngsters.forEach(p => {
           if (Math.random() < 0.3) p.transferStatus = 'LOANABLE';
        });
     });
  }

  // 3. AI UNSETTLING (Big clubs declaring interest)
  private processAIUnsettling(currentDate: Date) {
     if (Math.random() > 0.05) return;

     const bigClubs = this.clubs.filter(c => c.reputation > 8000); // River, Boca, Flamengo, etc.
     const bigClub = bigClubs[randomInt(0, bigClubs.length - 1)];
     
     if (!bigClub) return;

     // Find a player performing well in a smaller club
     const targets = this.players.filter(p => {
        const club = this.getClub(p.clubId);
        if (!club || club.reputation >= bigClub.reputation) return false;
        
        const avgRating = p.seasonStats.appearances > 5 ? p.seasonStats.totalRating / p.seasonStats.appearances : 0;
        return avgRating > 7.4 && p.age < 28 && p.currentAbility > 130;
     });

     const target = targets[randomInt(0, targets.length - 1)];
     if (target) {
        // Declare interest
        const reaction = Math.random();
        if (reaction < 0.6) {
           target.isUnhappyWithContract = true;
           target.morale = Math.max(0, target.morale - 20);
           this.addInboxMessage('STATEMENTS', 'Rumores de Fichaje', `El ${bigClub.name} ha declarado públicamente su interés en ${target.name}. El jugador podría verse tentado.`, currentDate, target.id);
        }
     }
  }

  // 4. BACKGROUND TRANSFERS (Refined)
  private processBackgroundTransfers(currentDate: Date) {
     const buyer = this.clubs.filter(c => c.finances.transferBudget > 1000000)[randomInt(0, 10)];
     if (!buyer) return;

     // Needs analysis... (Simplified)
     const squad = this.getPlayersByClub(buyer.id);
     if (squad.length > 28) return; // Squad full

     const listedPlayers = this.players.filter(p => p.transferStatus === 'TRANSFERABLE' && p.clubId !== buyer.id && p.value <= buyer.finances.transferBudget);
     
     const target = listedPlayers.find(p => p.currentAbility > 120 && p.reputation <= buyer.reputation); // simplified rep check via value/ability

     if (target) {
        const seller = this.getClub(target.clubId);
        if (seller) {
           const fee = target.value;
           buyer.finances.balance -= fee;
           buyer.finances.transferBudget -= fee;
           seller.finances.balance += fee;
           seller.finances.transferBudget += fee;
           
           target.clubId = buyer.id;
           target.squad = 'SENIOR';
           target.isStarter = false;
           target.transferStatus = 'NONE';
           target.morale = 80; // Reset morale
           target.isUnhappyWithContract = false;

           if (target.value > 5000000) {
              this.addInboxMessage('MARKET', 'Fichaje Destacado', `${buyer.name} ha fichado a ${target.name} del ${seller.name} por £${(fee/1000000).toFixed(1)}M.`, currentDate);
           }
        }
     }
  }

  processDailyContracts(currentDate: Date, userClubId?: string) {
     this.players.forEach(p => {
        if (p.clubId !== 'FREE_AGENT' && p.contractExpiry < currentDate) {
           const isUserPlayer = p.clubId === userClubId;
           // Release logic
           p.clubId = 'FREE_AGENT';
           p.isStarter = false;
           p.tacticalPosition = undefined;
           p.salary = 0;
           p.transferStatus = 'NONE';
           p.value = 0;

           if (isUserPlayer) {
              this.addInboxMessage('SQUAD', 'Baja por Fin de Contrato', `${p.name} ha abandonado el club al finalizar su contrato. Ahora es agente libre.`, currentDate, p.id);
           }
        }
     });
  }

  rescindContract(playerId: string, currentDate: Date) {
     const player = this.players.find(p => p.id === playerId);
     if (!player || player.clubId === 'FREE_AGENT') return;

     const compensation = player.salary * 12; // Simple estimation logic
     const club = this.getClub(player.clubId);
     if (club) club.finances.balance -= compensation;

     player.clubId = 'FREE_AGENT';
     player.isStarter = false;
     player.tacticalPosition = undefined;
     player.salary = 0;
     player.transferStatus = 'NONE';
     player.value = 0;

     this.addInboxMessage('SQUAD', 'Rescisión de Contrato', `Has rescindido el contrato de ${player.name} pagando una compensación de £${compensation.toLocaleString()}. El jugador es ahora libre.`, currentDate, player.id);
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

  checkRenewalTriggers(currentDate: Date, userClubId?: string) {
    this.players.forEach(p => {
       const diffTime = p.contractExpiry.getTime() - currentDate.getTime();
       const monthsLeft = diffTime / (1000 * 60 * 60 * 24 * 30);
       const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

       // User Team 6-month warning (approx 180 days)
       if (userClubId && p.clubId === userClubId) {
          if (daysLeft === 180) {
             this.addInboxMessage('SQUAD', 'Contrato por finalizar', `El contrato de ${p.name} finaliza en 6 meses. A partir de ahora es libre de negociar con otros clubes.`, currentDate, p.id);
          }
       }

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
    
    // Check if targeting a user-controlled club. 
    // Simplified: If responseDate is infinite, user must respond.
    // For now, let's keep it simple.
    
    const offer: TransferOffer = { id: generateUUID(), playerId, fromClubId, toClubId: player.clubId, amount, type, status: 'PENDING', date: new Date(currentDate), responseDate, isViewed: false };
    this.offers.push(offer);
    return offer;
  }

  processTransferDecisions(currentDate: Date) {
    this.offers.forEach(offer => {
      if (offer.status !== 'PENDING' || currentDate < offer.responseDate) return;
      
      // If the response date is very far in future (9999), it means it's waiting for manual user interaction. 
      // We don't implement this fully yet, but we skip processing here.
      if (offer.responseDate.getFullYear() === 9999) return;

      const player = this.players.find(p => p.id === offer.playerId);
      const toClub = this.getClub(offer.toClubId);
      const fromClub = this.getClub(offer.fromClubId);
      if (!player || !toClub || !fromClub) return;
      
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
      } else if (offer.type === 'LOAN') {
         if (player.transferStatus === 'LOANABLE' || offer.amount > 0) {
            offer.status = 'ACCEPTED';
            this.addInboxMessage('MARKET', `Cesión Aceptada: ${player.name}`, `El ${toClub.name} acepta la cesión.`, currentDate, player.id);
         } else {
            offer.status = 'REJECTED';
            this.addInboxMessage('MARKET', `Cesión Rechazada: ${player.name}`, `El club no quiere ceder al jugador.`, currentDate, player.id);
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
      
      if (offer.type === 'PURCHASE') {
         player.clubId = offer.fromClubId; 
         player.transferStatus = 'NONE';
      } else {
         player.clubId = offer.fromClubId; 
      }
      
      player.squad = 'SENIOR'; 
      player.isStarter = false; 
      
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
