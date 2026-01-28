
export enum Position {
  GK = 'GK', SW = 'SW', DC = 'DC', DLC = 'DLC', DRC = 'DRC', DR = 'DR', DL = 'DL',
  DM = 'DM', DMC = 'DMC', DMR = 'DMR', DML = 'DML',
  MC = 'MC', MCR = 'MCR', MCL = 'MCL', MR = 'MR', ML = 'ML',
  AM = 'AM', AMC = 'AMC', AMR = 'AMR', AML = 'AML',
  ST = 'ST', STC = 'STC', STR = 'STR', STL = 'STL'
}

export type SquadType = 'SENIOR' | 'RESERVE' | 'U20';
export type MatchStage = 'REGULAR' | 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';
export type CompetitionType = 'LEAGUE' | 'CUP' | 'CONTINENTAL_ELITE' | 'CONTINENTAL_SMALL' | 'GLOBAL';
export type StaffRole = 'HEAD_COACH' | 'ASSISTANT_MANAGER' | 'PHYSIO' | 'FITNESS_COACH' | 'RESERVE_MANAGER' | 'YOUTH_MANAGER';
export type TacticalStyle = 'POSSESSION' | 'DIRECT' | 'COUNTER' | 'HIGH_PRESS' | 'BALANCED' | 'PARK_THE_BUS';
export type MessageCategory = 'MARKET' | 'SQUAD' | 'STATEMENTS' | 'FINANCE' | 'COMPETITION';
export type PitchZone = 'DEF' | 'MID' | 'ATT';
export type Attribute = number;
export type DialogueType = 'PRAISE_FORM' | 'CRITICIZE_FORM' | 'PRAISE_TRAINING' | 'WARN_CONDUCT' | 'DEMAND_MORE';
export type DialogueTone = 'MILD' | 'MODERATE' | 'AGGRESSIVE';

export interface PlayerStats {
  mental: {
    aggression: number;
    anticipation: number;
    bravery: number;
    composure: number;
    concentration: number;
    decisions: number;
    determination: number;
    flair: number;
    leadership: number;
    offTheBall: number;
    positioning: number;
    teamwork: number;
    vision: number;
    workRate: number;
    professionalism: number;
    ambition: number;
    pressure: number;
    temperament: number;
    loyalty: number;
    adaptability: number;
    sportsmanship: number;
  };
  physical: Record<string, number>;
  technical: Record<string, number>;
  goalkeeping?: Record<string, number>;
}

export interface PlayerSeasonStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  conceded: number;
  totalRating: number;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  birthDate: Date;
  height: number;
  weight: number;
  nationality: string;
  positions: Position[];
  secondaryPositions: Position[];
  stats: PlayerStats;
  seasonStats: PlayerSeasonStats;
  statsByCompetition: Record<string, PlayerSeasonStats>;
  history: { year: number, clubId: string, stats: PlayerSeasonStats }[];
  currentAbility: number;
  potentialAbility: number;
  reputation: number;
  fitness: number;
  morale: number;
  clubId: string;
  isStarter: boolean;
  squad: SquadType;
  tacticalPosition?: number;
  tacticalArrow?: number;
  value: number;
  salary: number;
  transferStatus: 'NONE' | 'TRANSFERABLE' | 'LOANABLE';
  contractExpiry: Date;
  loyalty: number;
  negotiationAttempts: number;
  isUnhappyWithContract: boolean;
  developmentTrend?: 'STABLE' | 'RISING' | 'DECLINING';
  yellowCardsAccumulated: number;
  injury?: { type: string, daysLeft: number };
  suspension?: { type: string, matchesLeft: number };
  requestedSalary?: number;
  lastNegotiationDate?: Date;
  loanDetails?: { originalClubId: string, wageShare: number }; // Datos si el jugador está cedido
}

export interface ClubHonour {
  name: string;
  year: number;
}

export interface Club {
  id: string;
  name: string;
  shortName: string;
  leagueId: string;
  country: string;
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
  qualifiedFor?: string | null;
  trainingFacilities: number;
  youthFacilities: number;
}

export interface Competition {
  id: string;
  name: string;
  country: string;
  type: CompetitionType;
  tier: number;
}

export interface Fixture {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  played: boolean;
  squadType: SquadType;
  stage: MatchStage;
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  isNeutral?: boolean;
  groupId?: number;
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

export interface Tactic {
  id: string;
  name: string;
  positions: number[];
}

export interface Staff {
  id: string;
  name: string;
  age: number;
  nationality: string;
  role: StaffRole;
  clubId: string;
  preferredFormation?: string;
  tacticalStyle?: TacticalStyle;
  attributes: {
    coaching: number;
    judgingAbility: number;
    judgingPotential: number;
    tacticalKnowledge: number;
    medical: number;
    physiotherapy: number;
    motivation: number;
    manManagement: number;
    adaptability: number;
  };
  salary: number;
  contractExpiry: Date;
  history: { year: number, clubId: string, role: StaffRole }[];
}

export interface TransferOffer {
  id: string;
  playerId: string;
  fromClubId: string;
  toClubId: string;
  amount: number;
  wageShare: number; // Porcentaje del sueldo que paga el comprador (0-100)
  type: 'PURCHASE' | 'LOAN';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'COMPLETED';
  date: Date;
  responseDate: Date;
  isViewed: boolean;
  counterAmount?: number;
}

export interface InboxMessage {
  id: string;
  date: Date;
  category: MessageCategory;
  subject: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
}

export interface PlayerMatchStats {
  rating: number;
  goals: number;
  assists: number;
  condition: number;
  passesAttempted: number;
  passesCompleted: number;
  keyPasses: number;
  shots: number;
  shotsOnTarget: number;
  dribblesAttempted: number;
  dribblesCompleted: number;
  offsides: number;
  tacklesAttempted: number;
  tacklesCompleted: number;
  keyTackles: number;
  interceptions: number;
  shotsBlocked: number;
  headersAttempted: number;
  headersWon: number;
  keyHeaders: number;
  saves: number;
  foulsCommitted: number;
  foulsReceived: number;
  card?: 'YELLOW' | 'RED';
  participationPhrase?: string;
  sustainedInjury?: { type: string, days: number };
}

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  corners: number;
}

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'CHANCE' | 'POSSESSION' | 'MISS' | 'YELLOW_CARD' | 'RED_CARD' | 'INJURY' | 'WHISTLE';
  text: string;
  teamId?: string;
  playerId?: string;
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

export interface DialogueResult {
  text: string;
  moraleChange: number;
  reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  canReplica?: boolean;
}

/**
 * Interface representing a summary of a completed match, 
 * used for tracking history in the WorldManager.
 */
export interface MatchLog {
  id: string;
  date: Date;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  squadType: SquadType;
  stage: MatchStage;
}

export const ATTRIBUTE_LABELS: Record<string, string> = {
  aggression: "Agresividad",
  anticipation: "Anticipación",
  bravery: "Valentía",
  composure: "Serenidad",
  concentration: "Concentración",
  decisions: "Decisiones",
  determination: "Determinación",
  flair: "Talento",
  leadership: "Liderazgo",
  offTheBall: "Desmarque",
  positioning: "Colocación",
  teamwork: "Juego en Equipo",
  vision: "Visión",
  workRate: "Sacrificio",
  professionalism: "Profesionalismo",
  ambition: "Ambición",
  pressure: "Manejo de Presión",
  temperament: "Temperamento",
  loyalty: "Lealtad",
  adaptability: "Adaptabilidad",
  sportsmanship: "Juego Limpio",
  corners: "Córners",
  crossing: "Centros",
  dribbling: "Regate",
  finishing: "Remate",
  firstTouch: "Control",
  freeKickTaking: "Tiros Libres",
  heading: "Cabeceo",
  longShots: "Tiros Lejanos",
  longThrows: "Saques Largos",
  marking: "Marcaje",
  passing: "Pases",
  penaltyTaking: "Penaltis",
  tackling: "Entradas",
  technique: "Técnica",
  acceleration: "Aceleración",
  agility: "Agilidad",
  balance: "Equilibrio",
  jumpingReach: "Salto",
  naturalFitness: "Recup. Física",
  pace: "Velocidad",
  stamina: "Resistencia",
  strength: "Fuerza",
  aerialReach: "Alcance Aéreo",
  commandOfArea: "Mando en Área",
  communication: "Comunicación",
  eccentricity: "Excentricidad",
  handling: "Blocaje",
  kicking: "Saques Puerta",
  oneOnOnes: "Uno contra Uno",
  reflexes: "Reflejos",
  rushingOut: "Salidas",
  punching: "Puños",
  throwing: "Saque con Mano",
  coaching: "Entrenamiento",
  judgingAbility: "Juzgar Calidad",
  judgingPotential: "Juzgar Potencial",
  tacticalKnowledge: "Conoc. Tácticos",
  medical: "Conoc. Médico",
  physiotherapy: "Fisioterapia",
  motivation: "Motivación",
  manManagement: "Gestión Personal"
};

export const POSITION_ORDER: Record<string, number> = {
   'GK': 1, 'SW': 2, 'DR': 3, 'DL': 4, 'DC': 5, 'WBR': 6, 'WBL': 7, 'DM': 8, 'MR': 9, 'ML': 10, 'MC': 11, 'AMR': 12, 'AML': 13, 'AMC': 14, 'ST': 15
};
