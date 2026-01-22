
import { Player, Club, Competition, CompetitionType, Position, PlayerStats, Fixture, TableEntry, Tactic, Staff, StaffRole, SquadType, PlayerSeasonStats, ClubHonour, TransferStatus, TransferOffer, InboxMessage, MessageCategory } from "../types";
import { generateUUID, randomInt, weightedRandom } from "./utils";
import { NATIONS } from "../constants";

const CITIES = {
  "España": ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao", "Vigo", "San Sebastián", "Villarreal", "Pamplona", "Getafe", "Granada", "Elche", "Cádiz", "Valladolid", "Almería", "Girona", "Mallorca", "Vitoria", "Santander", "Zaragoza", "Málaga", "Oviedo", "Gijón", "Tenerife"],
  "Inglaterra": ["London", "Manchester", "Liverpool", "Birmingham", "Leeds", "Newcastle", "Sheffield", "Bristol", "Leicester", "Wolverhampton", "Southampton", "Nottingham", "Brighton", "Bournemouth", "Burnley", "Watford", "Norwich", "Derby", "Middlesbrough", "Sunderland"],
  "Italia": ["Turin", "Milan", "Rome", "Naples", "Florence", "Bergamo", "Genoa", "Bologna", "Verona", "Udine", "Sassuolo", "Monza", "Lecce", "Empoli", "Salerno", "Spezia", "Cremona", "Venice", "Parma", "Bari"],
  "Alemania": ["Munich", "Dortmund", "Leipzig", "Leverkusen", "Berlin", "Frankfurt", "Wolfsburg", "Gladbach", "Hoffenheim", "Mainz", "Cologne", "Stuttgart", "Augsburg", "Bremen", "Bochum", "Gelsenkirchen", "Hamburg", "Dusseldorf", "Hannover", "Nuremberg"],
  "Argentina": ["Avellaneda", "Rosario", "La Plata", "Córdoba", "Mendoza", "Santa Fe", "Tucumán", "Lanús", "Banfield", "Florencio Varela", "Victoria", "Santiago del Estero", "Paraná", "Junín", "Vicente López", "San Martín", "Barracas", "Sarandí"],
  "Portugal": ["Lisbon", "Porto", "Braga", "Guimarães"],
  "Países Bajos": ["Amsterdam", "Eindhoven", "Rotterdam", "Alkmaar"],
  "Escocia": ["Glasgow", "Edinburgh", "Aberdeen"],
  "Turquía": ["Istanbul", "Ankara", "Trabzon"],
  "Grecia": ["Athens", "Thessaloniki", "Piraeus"],
  "Bélgica": ["Brussels", "Bruges", "Liege", "Antwerp"],
  "Ucrania": ["Donetsk", "Kyiv", "Kharkiv"]
};

const GK_POS = [Position.GK];
const DEF_POS = [Position.SW, Position.DC, Position.DRC, Position.DLC, Position.DR, Position.DL];
const MID_DEF_POS = [Position.DM, Position.DMC, Position.DMR, Position.DML];
const MID_POS = [Position.MC, Position.MCL, Position.MCR, Position.ML, Position.MR];
const ATT_POS = [Position.AM, Position.AMC, Position.AMR, Position.AML, Position.ST, Position.STC, Position.STR, Position.STL];

const TACTIC_PRESETS: Tactic[] = [
   { id: '4-4-2', name: '4-4-2 Clásica', positions: [0, 6, 7, 8, 10, 16, 17, 19, 20, 27, 29] },
   { id: '4-3-3', name: '4-3-3 Ofensiva', positions: [0, 6, 7, 8, 10, 13, 17, 19, 26, 28, 30] },
   { id: '4-2-3-1', name: '4-2-3-1 Doble Pivote', positions: [0, 6, 7, 8, 10, 12, 14, 23, 26, 30, 28] },
   { id: '3-5-2', name: '3-5-2 Carrileros', positions: [0, 7, 3, 9, 11, 15, 17, 18, 19, 27, 29] },
   { id: '5-4-1', name: '5-4-1 Muro Defensivo', positions: [0, 6, 7, 3, 9, 10, 12, 14, 26, 30, 28] }
];

export class WorldManager {
  players: Player[] = [];
  clubs: Club[] = [];
  competitions: Competition[] = [];
  staff: Staff[] = [];
  tactics: Tactic[] = [...TACTIC_PRESETS];
  offers: TransferOffer[] = [];
  inbox: InboxMessage[] = [];

  constructor() { this.initWorld(); }

  initWorld() {
    this.competitions = [
      { id: "L_ESP", name: "La Liga", country: "España", type: 'LEAGUE', tier: 1 },
      { id: "L_ENG", name: "Premier League", country: "Inglaterra", type: 'LEAGUE', tier: 1 },
      { id: "L_ITA", name: "Serie A", country: "Italia", type: 'LEAGUE', tier: 1 },
      { id: "L_GER", name: "Bundesliga", country: "Alemania", type: 'LEAGUE', tier: 1 },
      { id: "L_ARG", name: "Liga Profesional", country: "Argentina", type: 'LEAGUE', tier: 1 },
      
      // Domestic Cups
      { id: "C_ESP", name: "Copa del Rey", country: "España", type: 'CUP', tier: 1 },
      { id: "C_ENG", name: "FA Cup", country: "Inglaterra", type: 'CUP', tier: 1 },
      { id: "C_ITA", name: "Coppa Italia", country: "Italia", type: 'CUP', tier: 1 },
      { id: "C_GER", name: "DFB Pokal", country: "Alemania", type: 'CUP', tier: 1 },

      // Continental
      { id: "CONT_ELITE", name: "Champions Cup", country: "Europa", type: 'CONTINENTAL_ELITE', tier: 1 },
      { id: "CONT_SMALL", name: "Euro Trophy", country: "Europa", type: 'CONTINENTAL_SMALL', tier: 2 },
    ];

    this.createDefinedClubs();
    this.createEuropeanElite();
    
    this.competitions.filter(c => c.type === 'LEAGUE').forEach(league => {
      const existingCount = this.clubs.filter(c => c.leagueId === league.id).length;
      const needed = 20 - existingCount;
      const cityList = CITIES[league.country as keyof typeof CITIES] || [];
      for (let i = 0; i < needed; i++) {
        let cityName = cityList[i % cityList.length];
        let finalName = `${cityName} FC`;
        const club: Club = {
          id: generateUUID(), name: finalName, shortName: cityName.substring(0, 3).toUpperCase(),
          leagueId: league.id, primaryColor: this.getRandomTailwindColor(), secondaryColor: "text-white",
          finances: { 
            balance: randomInt(5000000, 30000000), 
            transferBudget: randomInt(1000000, 10000000), 
            wageBudget: randomInt(50000, 500000),
            monthlyIncome: randomInt(200000, 1000000),
            monthlyExpenses: 0
          },
          reputation: randomInt(3000, 6000),
          stadium: `Estadio Municipal de ${cityName}`,
          honours: this.generateRandomHonours()
        };
        this.clubs.push(club);
        this.generateSquadsForClub(club.id);
        this.generateStaffForClub(club.id);
        this.updateClubMonthlyExpenses(club.id);
      }
    });

    this.players.forEach(p => {
       if (Math.random() < 0.05) {
          p.transferStatus = Math.random() > 0.5 ? 'TRANSFERABLE' : 'LOANABLE';
       }
    });
  }

  createEuropeanElite() {
     const elite = [
        { name: "SL Benfica", country: "Portugal", rep: 8200, pCol: "bg-red-700", sCol: "text-white" },
        { name: "FC Porto", country: "Portugal", rep: 8400, pCol: "bg-blue-700", sCol: "text-white" },
        { name: "Ajax", country: "Países Bajos", rep: 8300, pCol: "bg-white", sCol: "text-red-600" },
        { name: "PSV Eindhoven", country: "Países Bajos", rep: 8100, pCol: "bg-red-600", sCol: "text-white" },
        { name: "Celtic", country: "Escocia", rep: 7800, pCol: "bg-green-700", sCol: "text-white" },
        { name: "Rangers", country: "Escocia", rep: 7700, pCol: "bg-blue-800", sCol: "text-white" },
        { name: "Galatasaray", country: "Turquía", rep: 7900, pCol: "bg-red-600", sCol: "text-yellow-400" },
        { name: "Fenerbahçe", country: "Turquía", rep: 7850, pCol: "bg-yellow-400", sCol: "text-blue-900" },
        { name: "Olympiacos", country: "Grecia", rep: 7600, pCol: "bg-red-600", sCol: "text-white" },
        { name: "Anderlecht", country: "Bélgica", rep: 7500, pCol: "bg-purple-700", sCol: "text-white" },
        { name: "Shakhtar Donetsk", country: "Ucrania", rep: 8000, pCol: "bg-orange-500", sCol: "text-black" },
        { name: "Zenit", country: "Rusia", rep: 7900, pCol: "bg-sky-600", sCol: "text-white" },
     ];

     elite.forEach(e => {
        const club: Club = {
          id: generateUUID(), name: e.name, shortName: e.name.substring(0,3).toUpperCase(),
          leagueId: "L_EURO_OTHER", primaryColor: e.pCol, secondaryColor: e.sCol,
          finances: { balance: 40000000, transferBudget: 15000000, wageBudget: 1500000, monthlyIncome: 2000000, monthlyExpenses: 0 },
          reputation: e.rep,
          stadium: `Arena de ${e.name}`,
          honours: this.generateRandomHonours()
        };
        this.clubs.push(club);
        this.generateSquadsForClub(club.id);
        this.generateStaffForClub(club.id);
        this.updateClubMonthlyExpenses(club.id);
     });
  }

  createDefinedClubs() {
    const clubDefinitions = [
      { name: "Real Madrid", short: "RMD", pCol: "bg-white", sCol: "text-slate-900", league: "L_ESP", stadium: "Santiago Bernabéu", reputation: 9500 },
      { name: "FC Barcelona", short: "BAR", pCol: "bg-blue-800", sCol: "text-red-600", league: "L_ESP", stadium: "Camp Nou", reputation: 9200 },
      { name: "Manchester Blue", short: "MCI", pCol: "bg-sky-400", sCol: "text-white", league: "L_ENG", stadium: "Etihad Stadium", reputation: 8800 },
      { name: "Chelsea FC", short: "CHE", pCol: "bg-blue-700", sCol: "text-white", league: "L_ENG", stadium: "Stamford Bridge", reputation: 9000 },
      { name: "Boca Juniors", short: "BOC", pCol: "bg-blue-800", sCol: "text-yellow-400", league: "L_ARG", stadium: "La Bombonera", reputation: 8500 },
      { name: "River Plate", short: "RIV", pCol: "bg-white", sCol: "text-red-600", league: "L_ARG", stadium: "El Monumental", reputation: 8400 },
    ];
    clubDefinitions.forEach(c => {
      const club: Club = {
        id: generateUUID(), name: c.name, shortName: c.short, primaryColor: c.pCol, secondaryColor: c.sCol, leagueId: c.league,
        finances: { 
          balance: randomInt(50000000, 150000000), 
          transferBudget: randomInt(20000000, 80000000), 
          wageBudget: randomInt(2000000, 5000000),
          monthlyIncome: randomInt(1000000, 5000000),
          monthlyExpenses: 0
        },
        reputation: c.reputation,
        stadium: c.stadium,
        honours: [
          { name: "Liga Nacional", year: 2007 },
          { name: "Copa Nacional", year: 2005 },
          { name: "Copa Continental", year: 2002 }
        ]
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
    const possible = ["Copa Nacional", "Liga Nacional", "Supercopa", "Copa Continental"];
    const count = randomInt(0, 3);
    for (let i = 0; i < count; i++) {
      honours.push({ name: possible[randomInt(0, possible.length - 1)], year: randomInt(1990, 2007) });
    }
    return honours.sort((a,b) => b.year - a.year);
  }

  getRandomTailwindColor() {
    const colors = ["bg-red-600", "bg-blue-600", "bg-green-600", "bg-yellow-500", "bg-purple-600", "bg-slate-700", "bg-orange-500", "bg-teal-500"];
    return colors[randomInt(0, colors.length - 1)];
  }

  generateSquadsForClub(clubId: string) {
    const squads: SquadType[] = ['SENIOR', 'RESERVE', 'U20'];
    squads.forEach(squadType => {
      const size = squadType === 'SENIOR' ? 24 : squadType === 'RESERVE' ? 20 : 18;
      const squadStructure = [...Array(Math.floor(size*0.1)).fill('GK'), ...Array(Math.floor(size*0.3)).fill('DEF'), ...Array(Math.floor(size*0.2)).fill('DM'), ...Array(Math.floor(size*0.2)).fill('MID'), ...Array(Math.floor(size*0.2)).fill('ATT')];
      
      squadStructure.forEach((roleType, index) => {
        let posPool: Position[] = roleType === 'GK' ? GK_POS : roleType === 'DEF' ? DEF_POS : roleType === 'DM' ? MID_DEF_POS : roleType === 'MID' ? MID_POS : ATT_POS;
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
    const names = ["Roberto", "Carlos", "Massimo", "Jurgen", "Pep", "Carlo", "Zinedine", "Julian", "Erik"];
    const surnames = ["Ancelotti", "Guardiola", "Klopp", "Mourinho", "Simeone", "Zidane", "Nagelsmann", "Ten Hag"];

    roles.forEach(role => {
      const coachingAbility = weightedRandom(8, 20);
      const s: Staff = {
        id: generateUUID(),
        name: `${names[randomInt(0, names.length-1)]} ${surnames[randomInt(0, surnames.length-1)]}`,
        age: randomInt(35, 65),
        nationality: NATIONS[randomInt(0, NATIONS.length-1)],
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
    const firstNames = ["James", "Diego", "Luis", "Sergio", "Iker", "Lionel", "Enzo", "Lautaro", "Karim", "Pedri", "Gavi", "Lamine", "Pau", "Nico", "Ferran"];
    const lastNames = ["Smith", "Garcia", "Rodriguez", "Silva", "Ramos", "Messi", "Alvarez", "Fernandez", "Yamal", "Perez", "Gonzalez", "Cubarsi", "Williams", "Torres"];
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

    return {
      id: generateUUID(),
      name: `${firstNames[randomInt(0, firstNames.length - 1)]} ${lastNames[randomInt(0, lastNames.length - 1)]}`,
      age: age, birthDate: birthDate, height, weight, nationality: NATIONS[randomInt(0, NATIONS.length - 1)],
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

  getLeagueTable(competitionId: string, fixtures: Fixture[], squadType: SquadType = 'SENIOR'): TableEntry[] {
     const clubs = this.getClubsByCompetition(competitionId, fixtures);
     const table: Record<string, TableEntry> = {};
     clubs.forEach(c => { table[c.id] = { clubId: c.id, clubName: c.name, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, points: 0 }; });
     fixtures.filter(f => f.competitionId === competitionId && f.played && f.squadType === squadType).forEach(f => {
        const home = table[f.homeTeamId]; const away = table[f.awayTeamId];
        if (!home || !away) return;
        const hScore = f.homeScore || 0; const aScore = f.awayScore || 0;
        home.played++; away.played++; home.gf += hScore; home.ga += aScore; home.gd = home.gf - home.ga; away.gf += aScore; away.ga += hScore; away.gd = away.gf - away.ga;
        if (hScore > aScore) { home.won++; home.points += 3; away.lost++; }
        else if (hScore < aScore) { away.won++; away.points += 3; home.lost++; }
        else { home.drawn++; home.points += 1; away.drawn++; away.points += 1; }
     });
     return Object.values(table).sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);
  }

  // Contract Logic
  getRequestedSalary(player: Player, club: Club): number {
    const avgRating = player.seasonStats.appearances > 0 ? player.seasonStats.totalRating / player.seasonStats.appearances : 6.0;
    const baseDemand = player.salary * 1.2;
    const performanceMultiplier = Math.max(1, (avgRating - 6.5) * 2);
    const prestigeFactor = Math.max(0.8, 1 + (club.reputation - 5000) / 10000);
    const loyaltyDiscount = 1 - (player.loyalty / 100);
    return Math.round((baseDemand * performanceMultiplier * prestigeFactor * loyaltyDiscount) / 10) * 10;
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
