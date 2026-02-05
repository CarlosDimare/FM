
export enum Position {
  GK = 'P',
  SW = 'LIB',
  DC = 'DFC',
  DRC = 'DFC',
  DLC = 'DFC',
  DR = 'LD',
  DL = 'LI',
  DMR = 'CD',
  DML = 'CI',
  DMC = 'MCD',
  DM = 'MCD',
  MC = 'MC',
  MCR = 'MC',
  MCL = 'MC',
  MR = 'MD',
  ML = 'MI',
  AM = 'MPC',
  AMC = 'MPC',
  AMR = 'ED',
  AML = 'EI',
  ST = 'DC',
  STC = 'DC',
  STR = 'WD',
  STL = 'WI'
}

export type SquadType = 'SENIOR' | 'RESERVE' | 'U20';

export type Attribute = number; // 1-20

export interface PlayerStats {
  mental: {
    aggression: Attribute;
    anticipation: Attribute;
    bravery: Attribute;
    composure: Attribute;
    concentration: Attribute;
    decisions: Attribute;
    determination: Attribute;
    flair: Attribute;
    leadership: Attribute;
    offTheBall: Attribute;
    positioning: Attribute;
    teamwork: Attribute;
    vision: Attribute;
    workRate: Attribute;
    professionalism: Attribute;
    ambition: Attribute;
    pressure: Attribute;
    temperament: Attribute;
    loyalty: Attribute;
    adaptability: Attribute;
    sportsmanship: Attribute;
  };
  technical: {
    corners: Attribute;
    crossing: Attribute;
    dribbling: Attribute;
    finishing: Attribute;
    firstTouch: Attribute;
    freeKickTaking: Attribute;
    heading: Attribute;
    longShots: Attribute;
    longThrows: Attribute;
    marking: Attribute;
    passing: Attribute;
    penaltyTaking: Attribute;
    tackling: Attribute;
    technique: Attribute;
  };
  physical: {
    acceleration: Attribute;
    agility: Attribute;
    balance: Attribute;
    jumpingReach: Attribute;
    naturalFitness: Attribute;
    pace: Attribute;
    stamina: Attribute;
    strength: Attribute;
  };
  goalkeeping?: {
    aerialReach: Attribute;
    commandOfArea: Attribute;
    communication: Attribute;
    eccentricity: Attribute;
    handling: Attribute;
    kicking: Attribute;
    oneOnOnes: Attribute;
    reflexes: Attribute;
    rushingOut: Attribute;
    punching: Attribute;
    throwing: Attribute;
  };
}

export interface PlayerSeasonStats {
  appearances: number;
  goals: number;
  assists: number;
  cleanSheets: number;
  conceded: number;
  totalRating: number;
}

export interface PlayerHistoryEntry {
  year: number;
  clubId: string;
  stats: PlayerSeasonStats;
}

export interface Player {
  id: string;
  name: string;
  photo?: string;
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
  history: PlayerHistoryEntry[];
  currentAbility: number;
  potentialAbility: number;
  reputation: number;
  fitness: number;
  morale: number;
  clubId: string;
  isStarter: boolean;
  tacticalPosition?: number;
  squad: SquadType;
  value: number;
  salary: number;
  transferStatus: 'NONE' | 'TRANSFERABLE' | 'LOANABLE';
  contractExpiry: Date;
  loyalty: number;
  negotiationAttempts: number;
  lastNegotiationDate?: Date;
  requestedSalary?: number;
  isUnhappyWithContract: boolean;
  developmentTrend?: 'RISING' | 'DECLINING' | 'STABLE';
  yellowCardsAccumulated: number;
  injury?: { type: string; daysLeft: number };
  suspension?: { matchesLeft: number };
  loanDetails?: { originalClubId: string; wageShare: number };
  lastMotiveInteraction?: Date;
  trainingSchedule?: TrainingSchedule;
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
  honours: { name: string; year: number }[];
  trainingFacilities: number;
  youthFacilities: number;
  qualifiedFor?: string | null;
  trainingDelegatedTo?: string;
}

export type CompetitionType = 'LEAGUE' | 'CUP' | 'CONTINENTAL_ELITE' | 'CONTINENTAL_SMALL' | 'GLOBAL';

export interface Competition {
  id: string;
  name: string;
  country: string;
  type: CompetitionType;
  tier: number;
}

export type MatchStage = 'REGULAR' | 'GROUP' | 'ROUND_OF_32' | 'ROUND_OF_16' | 'QUARTER_FINAL' | 'SEMI_FINAL' | 'FINAL';

export interface Fixture {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: Date;
  played: boolean;
  homeScore?: number;
  awayScore?: number;
  penaltyHome?: number;
  penaltyAway?: number;
  squadType: SquadType;
  stage: MatchStage;
  groupId?: number;
  isNeutral?: boolean;
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

export interface PlayerTacticSettings {
  mentality: number;
  creativeFreedom: number;
  passingStyle: number;
  closingDown: number;
  tackling: number;
  forwardRuns: 'RARELY' | 'MIXED' | 'OFTEN';
  runWithBall: 'RARELY' | 'MIXED' | 'OFTEN';
  longShots: 'RARELY' | 'MIXED' | 'OFTEN';
  throughBalls: 'RARELY' | 'MIXED' | 'OFTEN';
  crossBall: 'RARELY' | 'MIXED' | 'OFTEN';
  marking: 'ZONAL' | 'MAN';
  tightMarking: boolean;
  holdUpBall: boolean;
}

export interface TacticSettings {
  mentality: number;
  creativeFreedom: number;
  passingStyle: number;
  tempo: number;
  width: number;
  closingDown: number;
  timeWasting: number;
  defensiveLine: number;
  tackling: number;
  focusPassing: 'LEFT' | 'RIGHT' | 'CENTER' | 'MIXED';
  marking: 'ZONAL' | 'MAN';
  targetManSupply: 'HEAD' | 'FEET' | 'SPACE' | 'MIXED';
  tightMarking: boolean;
  useTargetMan: boolean;
  usePlaymaker: boolean;
  playOffside: boolean;
  counterAttack: boolean;
  setPieces: {
    cornersLeft: string;
    cornersRight: string;
    freeKicksLeft: string;
    freeKicksRight: string;
    throwInsLeft: string;
    throwInsRight: string;
  };
}

export interface Tactic {
  id: string;
  name: string;
  positions: number[];
  arrows: Record<number, number>;
  settings: TacticSettings;
  individualSettings: Record<number, PlayerTacticSettings>;
}

export type StaffRole = 'HEAD_COACH' | 'ASSISTANT_MANAGER' | 'PHYSIO' | 'FITNESS_COACH' | 'RESERVE_MANAGER' | 'YOUTH_MANAGER';
export type TacticalStyle = 'POSSESSION' | 'DIRECT' | 'COUNTER' | 'HIGH_PRESS' | 'BALANCED' | 'PARK_THE_BUS';

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
    adaptability: number;
    medical: number;
    physiotherapy: number;
    motivation: number;
    manManagement: number;
  };
  salary: number;
  contractExpiry: Date;
  history: { year: number; clubId: string; role: StaffRole }[];
}

export interface TransferOffer {
  id: string;
  playerId: string;
  fromClubId: string;
  toClubId: string;
  amount: number;
  wageShare: number;
  type: 'PURCHASE' | 'LOAN';
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTER_OFFER' | 'COMPLETED';
  date: Date;
  responseDate: Date;
  isViewed: boolean;
  counterAmount?: number;
}

export type MessageCategory = 'MARKET' | 'SQUAD' | 'STATEMENTS' | 'FINANCE' | 'COMPETITION';

export interface InboxMessage {
  id: string;
  date: Date;
  category: MessageCategory;
  subject: string;
  body: string;
  isRead: boolean;
  relatedId?: string;
}

export interface MatchLog {
  id: string;
  date: Date;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  competitionId: string;
}

export interface MatchSettings {
  pauseAtHalftime: boolean;
}

export type DialogueType = 'PRAISE_FORM' | 'CRITICIZE_FORM' | 'PRAISE_TRAINING' | 'WARN_CONDUCT' | 'DEMAND_MORE';
export type DialogueTone = 'MILD' | 'MODERATE' | 'AGGRESSIVE';

export interface DialogueResult {
  text: string;
  moraleChange: number;
  reactionType: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  canReplica?: boolean;
}

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'CHANCE' | 'MISS' | 'YELLOW_CARD' | 'RED_CARD' | 'WHISTLE' | 'INJURY';
  text: string;
  teamId?: string;
  playerId?: string;
  importance: 'LOW' | 'MEDIUM' | 'HIGH';
  intensity: number;
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
  halftimeTriggered: boolean;
}

export interface TacticalReport {
  title: string;
  summary: string;
  keyStrength?: string;
  keyWeakness?: string;
  suggestion: string;
}

export type TrainingCategory = 'STRENGTH' | 'AEROBIC' | 'TACTICAL' | 'BALL_CONTROL' | 'DEFENDING' | 'ATTACKING' | 'SHOOTING' | 'SET_PIECES';

export interface TrainingSchedule {
  STRENGTH: number;
  AEROBIC: number;
  TACTICAL: number;
  BALL_CONTROL: number;
  DEFENDING: number;
  ATTACKING: number;
  SHOOTING: number;
  SET_PIECES: number;
}

export type PitchZone = 'DEF_L' | 'DEF_C' | 'DEF_R' | 'MID_L' | 'MID_C' | 'MID_R' | 'ATT_L' | 'ATT_C' | 'ATT_R';

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
  teamwork: "Trabajo en Equipo",
  vision: "Visión",
  workRate: "Lucha",
  professionalism: "Profesionalidad",
  ambition: "Ambición",
  pressure: "Presión",
  temperament: "Temperamento",
  loyalty: "Lealtad",
  adaptability: "Adaptabilidad",
  sportsmanship: "Deportividad",
  corners: "Córners",
  crossing: "Centros",
  dribbling: "Regate",
  finishing: "Remate",
  firstTouch: "Primer Toque",
  freeKickTaking: "Sac. Faltas",
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
  jumpingReach: "Alcance de Salto",
  naturalFitness: "Forma Natural",
  pace: "Velocidad",
  stamina: "Resistencia",
  strength: "Fuerza",
  aerialReach: "Alcance Aéreo",
  commandOfArea: "Mando en Área",
  communication: "Comunicación",
  eccentricity: "Excentricidad",
  handling: "Blocaje",
  kicking: "Saques de Puerta",
  oneOnOnes: "Unos contra Unos",
  reflexes: "Reflejos",
  rushingOut: "Salidas (Área)",
  punching: "Despejes de Puño",
  throwing: "Saques de Mano",
  coaching: "Entrenamiento",
  judgingAbility: "Juzgar Habilidad",
  judgingPotential: "Juzgar Potencial",
  tacticalKnowledge: "Conocimiento Táctico",
  medical: "Médico",
  physiotherapy: "Fisioterapia",
  motivation: "Motivación",
  manManagement: "Gestión Personal"
};

export const POSITION_FULL_NAMES: Record<string, string> = {
  [Position.GK]: "Portero",
  [Position.SW]: "Líbero",
  [Position.DC]: "Defensa Central",
  [Position.DR]: "Lateral Derecho",
  [Position.DL]: "Lateral Izquierdo",
  [Position.DMR]: "Carrilero Derecho",
  [Position.DML]: "Carrilero Izquierdo",
  [Position.DM]: "Centrocampista Defensivo",
  [Position.MC]: "Mediocentro",
  [Position.AMC]: "Mediapunta",
  [Position.MR]: "Interior Derecho",
  [Position.ML]: "Interior Izquierdo",
  [Position.AMR]: "Extremo Derecho",
  [Position.AML]: "Extremo Izquierdo",
  [Position.STR]: "Wing Derecho",
  [Position.STL]: "Wing Izquierdo",
  [Position.ST]: "Delantero Centro"
};

// Order defined by user: P, LIB, DFC, LD, LI, CD, CI, MCD, MC, MPC, MD, MI, ED, EI, WD, WI, DC
export const POSITION_ORDER: Record<string, number> = {
  [Position.GK]: 0,
  [Position.SW]: 1,
  [Position.DC]: 2,
  [Position.DR]: 3,
  [Position.DL]: 4,
  [Position.DMR]: 5,
  [Position.DML]: 6,
  [Position.DMC]: 7,
  [Position.MC]: 8,
  [Position.AM]: 9,
  [Position.MR]: 10,
  [Position.ML]: 11,
  [Position.AMR]: 12,
  [Position.AML]: 13,
  [Position.STR]: 14,
  [Position.STL]: 15,
  [Position.ST]: 16,
};

export interface PlayerMatchStats {
  rating: number;
  goals: number;
  assists: number;
  condition: number;
  minutesPlayed: number;
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
  sustainedInjury?: { type: string; days: number };
}

export interface TeamMatchStats {
  possession: number;
  shots: number;
  shotsOnTarget: number;
  fouls: number;
  corners: number;
}
