
// 1-20 Attribute Range type
export type Attribute = number; 

export enum Position {
  GK = "POR",
  SW = "LIB", DC = "DFC", DRC = "DF D/C", DLC = "DF I/C", DR = "DFD", DL = "DFI",
  DM = "MCD", DMC = "MCD C", DMR = "MCD D", DML = "MCD I",
  MC = "MC", MCR = "MC D", MCL = "MC I", MR = "MD", ML = "MI",
  AM = "MP", AMC = "MP C", AMR = "MP D", AML = "MP I",
  ST = "DL", STC = "DLC", STR = "DLD", STL = "DLI"
}

export type SquadType = 'SENIOR' | 'RESERVE' | 'U20';
export type TransferStatus = 'NONE' | 'TRANSFERABLE' | 'LOANABLE';
export type CompetitionType = 'LEAGUE' | 'CUP' | 'CONTINENTAL_ELITE' | 'CONTINENTAL_SMALL' | 'GLOBAL';

// Inbox Types
export type MessageCategory = 'MARKET' | 'SQUAD' | 'STATEMENTS' | 'FINANCE' | 'COMPETITION';

export interface InboxMessage {
  id: string;
  date: Date;
  category: MessageCategory;
  subject: string;
  body: string;
  isRead: boolean;
  relatedId?: string; // Player ID, Club ID or Competition ID
}

export interface TransferOffer {
  id: string;
  playerId: string;
  fromClubId: string;
  toClubId: string;
  amount: number;
  type: 'PURCHASE' | 'LOAN';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'COMPLETED';
  date: Date;
  responseDate: Date;
  counterAmount?: number;
  isViewed: boolean;
}

export interface MatchLog {
  fixtureId: string;
  date: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  stats: Record<string, PlayerMatchStats>;
}

export const POSITION_ORDER: Record<string, number> = {
  [Position.GK]: 1,
  [Position.SW]: 2, [Position.DC]: 3, [Position.DRC]: 3, [Position.DLC]: 3, [Position.DR]: 4, [Position.DL]: 4,
  [Position.DM]: 5, [Position.DMC]: 5, [Position.DMR]: 5, [Position.DML]: 5,
  [Position.MC]: 6, [Position.MCR]: 6, [Position.MCL]: 6, [Position.MR]: 7, [Position.ML]: 7,
  [Position.AM]: 8, [Position.AMC]: 8, [Position.AMR]: 8, [Position.AML]: 8,
  [Position.ST]: 9, [Position.STC]: 9, [Position.STR]: 9, [Position.STL]: 9
};

export const ATTRIBUTE_LABELS: Record<string, string> = {
  corners: "Córners", crossing: "Centros", dribbling: "Regate", finishing: "Remates", firstTouch: "Primer Toque", freeKickTaking: "Lanz. Faltas", heading: "Cabeceo", longShots: "Tiros Lejanos", longThrows: "Saques de Banda", marking: "Marcaje", passing: "Pases", penaltyTaking: "Penaltis", tackling: "Entradas", technique: "Técnica",
  aggression: "Agresividad", anticipation: "Anticipación", bravery: "Valentía", composure: "Compostura", concentration: "Concentración", decisions: "Decisiones", determination: "Determinación", flair: "Talento", leadership: "Liderazgo", offTheBall: "Desmarques", positioning: "Colocación", teamwork: "Trabajo Equipo", vision: "Visión", workRate: "Sacrificio",
  acceleration: "Aceleración", agility: "Agilidad", balance: "Equilibrio", jumpingReach: "Alcance Salto", naturalFitness: "Forma Natural", pace: "Velocidad", stamina: "Resistencia", strength: "Fuerza",
  aerialReach: "Alcance Aéreo", commandOfArea: "Mando en Área", communication: "Comunicación", eccentricity: "Excentricidad", handling: "Agarre", kicking: "Saque", oneOnOnes: "Uno contra Uno", reflexes: "Reflejos", rushingOut: "Salidas", punching: "Despeje Puños", throwing: "Saque Mano",
  coaching: "Entrenamiento", judgingAbility: "Juzgar Calidad", judgingPotential: "Juzgar Potencial", medical: "Medicina", physiotherapy: "Fisioterapia", motivation: "Motivación", manManagement: "Gestión Personal"
};

export interface PlayerMatchStats {
  rating: number;
  goals: number;
  assists: number;
  passesAttempted: number;
  passesCompleted: number;
  dribblesAttempted: number;
  dribblesCompleted: number;
  tacklesAttempted: number;
  tacklesCompleted: number;
  foulsCommitted: number;
  shotsOnTarget: number;
  saves: number;
  participationPhrase?: string;
}

export interface PlayerSeasonStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  totalRating: number;
}

export interface PlayerStats {
  mental: MentalAttributes;
  technical: TechnicalAttributes;
  physical: PhysicalAttributes;
  goalkeeping?: GoalkeepingAttributes;
}

export interface MentalAttributes { [key: string]: Attribute }
export interface TechnicalAttributes { [key: string]: Attribute }
export interface PhysicalAttributes { [key: string]: Attribute }
export interface GoalkeepingAttributes { [key: string]: Attribute }

export interface Player {
  id: string;
  name: string;
  age: number;
  birthDate: Date;
  nationality: string;
  height: number;
  weight: number;
  positions: Position[];
  secondaryPositions: Position[];
  stats: PlayerStats;
  seasonStats: PlayerSeasonStats;
  currentAbility: number;
  potentialAbility: number;
  fitness: number;
  morale: number;
  clubId: string;
  squad: SquadType;
  isStarter: boolean; 
  tacticalPosition?: number;
  salary: number;
  value: number;
  transferStatus: TransferStatus;
  injury?: {
    type: string;
    daysLeft: number;
  };
  suspension?: {
    type: 'RED_CARD' | 'YELLOW_ACCUMULATION';
    matchesLeft: number;
  };
  // Contract specific
  contractExpiry: Date;
  loyalty: number; // 1-20
  negotiationAttempts: number;
  requestedSalary?: number;
  isUnhappyWithContract: boolean;
  lastNegotiationDate?: Date;
}

export type StaffRole = 'ASSISTANT_MANAGER' | 'PHYSIO' | 'FITNESS_COACH' | 'RESERVE_MANAGER' | 'YOUTH_MANAGER';

export interface StaffAttributes {
  coaching: Attribute;
  judgingAbility: Attribute;
  judgingPotential: Attribute;
  medical: Attribute;
  physiotherapy: Attribute;
  motivation: Attribute;
  manManagement: Attribute;
}

export interface Staff {
  id: string;
  name: string;
  age: number;
  nationality: string;
  role: StaffRole;
  clubId: string;
  attributes: StaffAttributes;
  salary: number;
}

export interface Tactic {
  id: string;
  name: string;
  positions: number[];
}

export interface Competition {
  id: string;
  name: string;
  country: string; // 'Europe' for continental
  type: CompetitionType;
  tier: number;
}

export interface ClubHonour {
  name: string;
  year: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string; // The primary league competition
  primaryColor: string;
  secondaryColor: string;
  finances: {
    balance: number;
    transferBudget: number;
    wageBudget: number;
    monthlyIncome: number;
    monthlyExpenses: number;
  };
  reputation: number;
  stadium: string;
  honours: ClubHonour[];
}

export type MatchStage = 'REGULAR' | 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'MISS' | 'CHANCE' | 'YELLOW_CARD' | 'RED_CARD' | 'INJURY' | 'SUB' | 'WHISTLE' | 'FOUL' | 'CORNER' | 'POSSESSION';
  text: string;
  teamId?: string;
  playerId?: string;
  assistId?: string;
  subInId?: string;
  subOutId?: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  intensity: 1 | 2 | 3 | 4 | 5;
}

export interface MatchState {
  isPlaying: boolean;
  minute: number;
  homeScore: number;
  awayScore: number;
  events: MatchEvent[];
  homeTeamId: string;
  awayTeamId: string;
  homeStats: TeamMatchStats;
  awayStats: TeamMatchStats;
  playerStats: Record<string, PlayerMatchStats>;
}

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  corners: number;
}

export interface Fixture {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  squadType: SquadType;
  stage: MatchStage;
  isNeutral?: boolean;
  groupId?: number; // 0-7 for Groups A-H
  penaltyHome?: number;
  penaltyAway?: number;
}

export interface TableEntry {
  clubId: string;
  clubName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
}

export type DialogueType = 'PRAISE_FORM' | 'CRITICIZE_FORM' | 'WARN_CONDUCT' | 'PRAISE_TRAINING' | 'DEMAND_MORE';

export interface DialogueResult {
  text: string;
  moraleChange: number;
  reactionType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
}
