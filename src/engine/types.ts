// === Core Game Types ===

export type LifelineZone = 'excellent' | 'healthy' | 'subhealth' | 'crisis' | 'critical' | 'dead';

export interface Lifelines {
  cashPercent: number;    // 0-100
  heartbeat: number;      // 0-100
  roots: number;          // 0-100
}

export interface Financials {
  cash: number;           // 萬 units
  quarterlyIncome: number;
  quarterlyExpense: number;
  accountsReceivable: number;
}

export interface PersistentEffect {
  id: string;
  description: string;
  type: 'income' | 'expense' | 'heartbeat' | 'roots';
  value: number;          // per quarter
  remainingQuarters: number; // -1 = permanent
  source: string;
}

export interface Fuse {
  id: string;
  sourceCardId: string;
  sourceOption: string;
  plantedAt: number;      // quarter index when planted
  detonateAt: number;     // quarter index when it explodes
  isRandom: boolean;
  successRate?: number;
  effects: {
    success: FuseEffect;
    failure?: FuseEffect;
  };
  description: string;
  attribution: string;
}

export interface FuseEffect {
  cash?: number;
  heartbeat?: number;
  roots?: number;
  incomeChange?: number;  // persistent
  expenseChange?: number; // persistent
  chainedFuse?: FuseTemplate;
  condition?: { lifeline: keyof Lifelines; below: number };
}

export interface FuseTemplate {
  sourceOption: string;
  detonateAt: number;
  isRandom?: boolean;
  successRate?: number;
  description: string;
  attribution: string;
  effects: {
    success: FuseEffect;
    failure?: FuseEffect;
  };
  condition?: { lifeline: keyof Lifelines; below: number };
}

export interface InvestmentOption {
  id: string;
  name: string;
  cost: number;
  immediate: { heartbeat?: number; roots?: number };
  persistent?: { type: 'heartbeat' | 'roots'; value: number; quarters: number };
  target: 'heartbeat' | 'roots';
}

export interface CardOption {
  id: string;
  label: string;
  description: string;
  immediate: {
    cash?: number;
    heartbeat?: number;
    roots?: number;
    ar?: number;
    incomeChange?: number;
    expenseChange?: number;
  };
  lockConditions?: LockCondition[];
  fuse?: FuseTemplate;
  effectMultiplierConditions?: {
    lifeline: keyof Lifelines;
    below: number;
    multiplier: number;
  }[];
}

export interface LockCondition {
  lifeline: 'cashPercent' | 'heartbeat' | 'roots';
  above?: number;
  below?: number;
  reason: string;
}

export interface DecisionCard {
  id: string;
  name: string;
  type: 'event' | 'crisis' | 'chronic';
  yearRange: [number, number];
  description: string;
  options: CardOption[];
  sideOption?: CardOption;  // For crisis cards
  triggerConditions?: LockCondition[];
  isPredictionTarget?: boolean;
}

export interface EntropyCard {
  id: string;
  name: string;
  difficulty: 'light' | 'medium' | 'heavy';
  yearRange: [number, number];
  targetLifeline: string;
  endure: {
    description: string;
    cash?: number;
    heartbeat?: number;
    roots?: number;
    expenseChange?: number;
    incomeChange?: number;
    plantsFuse?: FuseTemplate;
  };
  resolve: {
    description: string;
    cash?: number;
    heartbeat?: number;
    roots?: number;
    expenseChange?: number;
    incomeChange?: number;
    lockCondition?: { lifeline: 'cashPercent'; below: number };
  };
}

export type QuarterType = 'decision' | 'operation';

export interface QuarterInfo {
  year: number;       // 1-5
  quarter: number;    // 1-4
  type: QuarterType;
  index: number;      // 0-19
}

export interface Attribution {
  source: string;
  lifeline: keyof Lifelines | 'cash';
  direction: 'up' | 'down';
  magnitude: 'large' | 'medium' | 'small';
  isPlayerDecision: boolean;
}

export interface Prediction {
  cash: 'up' | 'neutral' | 'down' | 'unknown';
  heartbeat: 'up' | 'neutral' | 'down' | 'unknown';
  roots: 'up' | 'neutral' | 'down' | 'unknown';
}

export interface QuarterLog {
  quarter: QuarterInfo;
  startState: GameSnapshot;
  endState: GameSnapshot;
  attributions: Attribution[];
  decisionMade?: { cardId: string; optionId: string };
  entropyHandled?: { cardId: string; method: 'endure' | 'resolve' };
  expensePaid?: { cardId: string; cost: number };
  investments?: string[];
  fusesDetonated?: string[];
  prediction?: Prediction;
  actualDirection?: Prediction;
}

export interface GameSnapshot {
  lifelines: Lifelines;
  financials: Financials;
}

export interface DealCard {
  id: string;
  name: string;
  description: string;
  type: 'small' | 'big' | 'stock';
  cost: number;
  cashflow: number;
  marketValue?: number;
  arteryRequirement?: number;
  volatility?: 'high' | 'low';
}

export interface StockHolding {
  id: string;
  dealCardId: string;
  name: string;
  purchasePrice: number;
  acquiredAt: number;
}

export interface MarketPrices {
  [dealCardId: string]: number;
}

export interface Asset {
  id: string;
  dealCardId: string;
  name: string;
  type: 'small' | 'big' | 'stock';
  cost: number;
  cashflow: number;
  acquiredAt: number;
}

export interface ExpenseCard {
  id: string;
  name: string;
  description: string;
  tier: 'small' | 'medium' | 'large';
  cost: number;
}

export interface OpportunityCard {
  id: string;
  name: string;
  description: string;
  effects: {
    cash?: number;
    roots?: number;
    heartbeat?: number;
    revenuePercent?: number; // e.g., 0.3 means +30% of current quarterly revenue
  };
}

export type GamePhase =
  | 'title'
  | 'investment'
  | 'entropy'
  | 'opportunity'
  | 'decision'
  | 'prediction'
  | 'settlement'
  | 'attribution'
  | 'deal'
  | 'market'
  | 'expense'
  | 'yearEnd'
  | 'gameOver'
  | 'victory'
  | 'review';

export interface GameState {
  phase: GamePhase;
  currentQuarter: QuarterInfo;
  lifelines: Lifelines;
  financials: Financials;
  persistentEffects: PersistentEffect[];
  activeFuses: Fuse[];
  quarterLogs: QuarterLog[];
  decisionDeck: string[];   // remaining card IDs
  entropyDeck: string[];    // remaining card IDs
  usedDecisionCards: string[];
  usedEntropyCards: string[];
  currentDecisionCards: DecisionCard[] | null;  // 2 drawn, pick 1
  currentEntropyCard: EntropyCard | null;
  currentOpportunityCard: OpportunityCard | null;
  currentExpenseCard: ExpenseCard | null;
  currentDealCard: DealCard | null;
  selectedDecisionCard: DecisionCard | null;
  assets: Asset[];
  stocks: StockHolding[];
  marketPrices: MarketPrices;
  marketPriceHistory: MarketPrices[];
  netWorthHistory: number[];
  marketTradesThisQuarter: { bought: boolean; sold: boolean };
  investmentsMadeThisQuarter: number;
  predictionHistory: { prediction: Prediction; actual: Prediction }[];
  worsenedCards: Map<string, number>; // cardId -> times worsened
  score: number;
  rating: string;
  ceoStyle: string;
  gameOverReason?: string;
}

export interface SettlementStep {
  name: string;
  changes: { lifeline: string; before: number; after: number; reason: string }[];
}
