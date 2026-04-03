import {
  GameState, QuarterInfo, Lifelines, Financials, Fuse, FuseEffect, FuseTemplate,
  PersistentEffect, DecisionCard, EntropyCard, CardOption, OpportunityCard, ExpenseCard,
  DealCard, Asset, StockHolding, MarketPrices,
  Attribution, Prediction, QuarterLog, GameSnapshot, LifelineZone,
  InvestmentOption, SettlementStep
} from './types';
import { decisionCards } from '../data/decisionCards';
import { entropyCards } from '../data/entropyCards';
import { opportunityCards } from '../data/opportunityCards';
import { activeDealCards, stockDealCards } from '../data/dealCards';
import { expenseCards } from '../data/expenseCards';

// ============ CONSTANTS ============
const TOTAL_QUARTERS = 20;
const DEATH_THRESHOLD = 20;
const CRITICAL_THRESHOLD = 30;
const CRISIS_THRESHOLD = 45;
const SUBHEALTH_THRESHOLD = 60;
const HEALTHY_THRESHOLD = 75;

// ============ HELPERS ============
export function getZone(value: number): LifelineZone {
  if (value <= 0) return 'dead';
  if (value < DEATH_THRESHOLD) return 'critical';
  if (value < CRITICAL_THRESHOLD) return 'crisis';
  if (value < CRISIS_THRESHOLD) return 'subhealth';
  if (value < SUBHEALTH_THRESHOLD) return 'healthy';
  if (value < HEALTHY_THRESHOLD) return 'excellent';
  return 'excellent';
}

export function getZoneColor(zone: LifelineZone): string {
  switch (zone) {
    case 'excellent': return '#9b59b6';
    case 'healthy': return '#2ecc71';
    case 'subhealth': return '#f1c40f';
    case 'crisis': return '#e67e22';
    case 'critical': return '#e74c3c';
    case 'dead': return '#7f8c8d';
  }
}

export function getZoneLabel(zone: LifelineZone): string {
  switch (zone) {
    case 'excellent': return '卓越';
    case 'healthy': return '健康';
    case 'subhealth': return '亞健康';
    case 'crisis': return '危機';
    case 'critical': return '瀕危';
    case 'dead': return '死亡';
  }
}

export function clamp(v: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * Artery formula v4.1: 可動用現金 / (季均固定支出 × 4) × 100
 * Capped at 100, floored at 0
 */
function calcArtery(cash: number, quarterlyExpense: number): number {
  if (quarterlyExpense <= 0) return cash > 0 ? 100 : 0;
  return clamp((cash / (quarterlyExpense * 4)) * 100);
}

/**
 * Get the effective quarterly expense considering persistent expense effects
 */
function getEffectiveExpense(state: GameState): number {
  let expense = state.financials.quarterlyExpense;
  for (const pe of state.persistentEffects) {
    if (pe.type === 'expense') {
      expense += pe.value;
    }
  }
  return Math.max(0, expense);
}

/**
 * Get the effective quarterly income considering persistent income effects
 */
function getEffectiveIncome(state: GameState): number {
  let income = state.financials.quarterlyIncome;
  for (const pe of state.persistentEffects) {
    if (pe.type === 'income') {
      income += pe.value;
    }
  }
  return Math.max(0, income);
}

function getQuarterInfo(index: number): QuarterInfo {
  const year = Math.floor(index / 4) + 1;
  const quarter = (index % 4) + 1;
  // Decision quarters: Q1 and Q3 of each year (indices 0,2,4,6,...)
  const type = index % 2 === 0 ? 'decision' : 'operation';
  return { year, quarter, type, index };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ============ INITIAL STATE (v4.1 fix) ============
export function createInitialState(): GameState {
  const shuffledDecisions = shuffle(decisionCards.map(c => c.id));
  const shuffledEntropy = shuffle(entropyCards.map(c => c.id));

  return {
    phase: 'title',
    currentQuarter: getQuarterInfo(0),
    lifelines: { cashPercent: 70, heartbeat: 70, roots: 55 },
    financials: {
      cash: 392,
      quarterlyIncome: 180,
      quarterlyExpense: 140,
      accountsReceivable: 0,
    },
    persistentEffects: [],
    activeFuses: [],
    quarterLogs: [],
    decisionDeck: shuffledDecisions,
    entropyDeck: shuffledEntropy,
    usedDecisionCards: [],
    usedEntropyCards: [],
    currentDecisionCards: null,
    currentEntropyCard: null,
    currentOpportunityCard: null,
    currentExpenseCard: null,
    currentDealCard: null,
    selectedDecisionCard: null,
    assets: [],
    stocks: [],
    marketPrices: Object.fromEntries(stockDealCards.map(c => [c.id, c.marketValue || 0])),
    marketPriceHistory: [],
    netWorthHistory: [],
    marketTradesThisQuarter: { bought: false, sold: false },
    investmentsMadeThisQuarter: 0,
    predictionHistory: [],
    worsenedCards: new Map(),
    score: 0,
    rating: '',
    ceoStyle: '',
  };
}

// ============ QUARTER FLOW ============

export function startQuarter(state: GameState): GameState {
  const qi = state.currentQuarter;
  const newState = { ...state };

  if (qi.type === 'decision') {
    // Draw 2 decision cards, let player pick 1
    const eligible = state.decisionDeck.filter(id => {
      const card = decisionCards.find(c => c.id === id)!;
      return qi.year >= card.yearRange[0] && qi.year <= card.yearRange[1];
    });

    const drawn = eligible.slice(0, 2);
    if (drawn.length > 0) {
      newState.currentDecisionCards = drawn.map(id => decisionCards.find(c => c.id === id)!);
    }
  }

  // Try drawing an expense card before investment phase
  const withExpense = tryDrawExpense(newState);
  if (withExpense.phase === 'expense') {
    return withExpense;
  }

  newState.phase = 'investment';
  return newState;
}

export function applyInvestment(state: GameState, inv: InvestmentOption): GameState {
  const newState = { ...state };
  newState.financials = { ...state.financials, cash: state.financials.cash - inv.cost };
  newState.lifelines = { ...state.lifelines };

  if (inv.immediate.heartbeat) {
    newState.lifelines.heartbeat = clamp(state.lifelines.heartbeat + inv.immediate.heartbeat);
  }
  if (inv.immediate.roots) {
    newState.lifelines.roots = clamp(state.lifelines.roots + inv.immediate.roots);
  }
  const effExpense = getEffectiveExpense(newState);
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, effExpense);

  if (inv.persistent) {
    newState.persistentEffects = [...state.persistentEffects, {
      id: `inv-${Date.now()}-${Math.random()}`,
      description: inv.name,
      type: inv.persistent.type,
      value: inv.persistent.value,
      remainingQuarters: inv.persistent.quarters,
      source: inv.name,
    }];
  }

  newState.investmentsMadeThisQuarter = state.investmentsMadeThisQuarter + 1;
  return newState;
}

export function drawEntropyCard(state: GameState): GameState {
  const qi = state.currentQuarter;
  const eligible = state.entropyDeck.filter(id => {
    const card = entropyCards.find(c => c.id === id)!;
    return qi.year >= card.yearRange[0] && qi.year <= card.yearRange[1];
  });

  if (eligible.length === 0) {
    // No entropy card available, skip to next phase
    if (state.currentQuarter.type === 'operation') {
      return drawOpportunityCard({ ...state, currentEntropyCard: null });
    }
    return {
      ...state,
      currentEntropyCard: null,
      phase: state.currentQuarter.type === 'decision' ? 'decision' : 'prediction',
    };
  }

  const drawnId = eligible[0];
  const card = entropyCards.find(c => c.id === drawnId)!;

  return {
    ...state,
    currentEntropyCard: card,
    entropyDeck: state.entropyDeck.filter(id => id !== drawnId),
    usedEntropyCards: [...state.usedEntropyCards, drawnId],
    phase: 'entropy',
  };
}

export function handleEntropy(state: GameState, method: 'endure' | 'resolve'): GameState {
  const card = state.currentEntropyCard!;
  const effects = method === 'endure' ? card.endure : card.resolve;
  const newState = { ...state };
  newState.lifelines = { ...state.lifelines };
  newState.financials = { ...state.financials };
  newState.persistentEffects = [...state.persistentEffects];
  newState.activeFuses = [...state.activeFuses];

  // Check lock for resolve
  if (method === 'resolve' && card.resolve.lockCondition) {
    const { lifeline, below } = card.resolve.lockCondition;
    if (state.lifelines[lifeline] < below) {
      return handleEntropy(state, 'endure');
    }
  }

  if (effects.cash) newState.financials.cash += effects.cash;
  if (effects.heartbeat) newState.lifelines.heartbeat = clamp(state.lifelines.heartbeat + effects.heartbeat);
  if (effects.roots) newState.lifelines.roots = clamp(state.lifelines.roots + effects.roots);
  if (effects.expenseChange) {
    newState.persistentEffects.push({
      id: `entropy-${card.id}-${Date.now()}`,
      description: `${card.name}（${method === 'endure' ? '硬扛' : '化解'}）`,
      type: 'expense',
      value: effects.expenseChange,
      remainingQuarters: -1,
      source: card.name,
    });
  }
  if (effects.incomeChange) {
    newState.persistentEffects.push({
      id: `entropy-inc-${card.id}-${Date.now()}`,
      description: `${card.name}（${method === 'endure' ? '硬扛' : '化解'}）`,
      type: 'income',
      value: effects.incomeChange,
      remainingQuarters: -1,
      source: card.name,
    });
  }

  // Handle planted fuse from endure
  if (method === 'endure' && 'plantsFuse' in effects && effects.plantsFuse) {
    const fuseTemplate = effects.plantsFuse;
    newState.activeFuses.push({
      id: `fuse-${card.id}-${Date.now()}`,
      sourceCardId: card.id,
      sourceOption: 'endure',
      plantedAt: state.currentQuarter.index,
      detonateAt: state.currentQuarter.index + fuseTemplate.detonateAt,
      isRandom: fuseTemplate.isRandom || false,
      successRate: fuseTemplate.successRate,
      description: fuseTemplate.description,
      attribution: fuseTemplate.attribution,
      effects: fuseTemplate.effects,
    });
  }

  const effExpense = getEffectiveExpense(newState);
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, effExpense);
  newState.currentEntropyCard = null;

  // Move to next phase based on quarter type
  if (state.currentQuarter.type === 'decision' && state.currentDecisionCards) {
    newState.phase = 'decision';
  } else if (state.currentQuarter.type === 'operation') {
    // Operation quarter: check for opportunity card
    return drawOpportunityCard(newState);
  } else {
    newState.phase = 'prediction';
  }

  return newState;
}

// ============ OPPORTUNITY CARD SYSTEM (v4.1 新增：商機牌) ============

export function drawOpportunityCard(state: GameState): GameState {
  // Trigger on operation quarters — draw a random opportunity card
  if (state.currentQuarter.type !== 'operation') {
    return { ...state, phase: 'prediction' };
  }

  // Draw a random opportunity card
  const card = opportunityCards[Math.floor(Math.random() * opportunityCards.length)];

  return {
    ...state,
    currentOpportunityCard: card,
    phase: 'opportunity',
  };
}

export function applyOpportunityCard(state: GameState): GameState {
  const card = state.currentOpportunityCard;
  if (!card) return { ...state, phase: 'prediction' };

  const newState = { ...state };
  newState.lifelines = { ...state.lifelines };
  newState.financials = { ...state.financials };

  if (card.effects.cash) {
    newState.financials.cash += card.effects.cash;
  }
  if (card.effects.revenuePercent) {
    // Revenue-proportional cash bonus (e.g., 旺季 = 30% of quarterly revenue)
    const bonus = Math.round(state.financials.quarterlyIncome * card.effects.revenuePercent);
    newState.financials.cash += bonus;
  }
  if (card.effects.roots) {
    newState.lifelines.roots = clamp(state.lifelines.roots + card.effects.roots);
  }
  if (card.effects.heartbeat) {
    newState.lifelines.heartbeat = clamp(state.lifelines.heartbeat + card.effects.heartbeat);
  }

  const effExpense = getEffectiveExpense(newState);
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, effExpense);
  newState.currentOpportunityCard = null;
  newState.phase = 'prediction';

  return newState;
}

// ============ DECISION CARDS ============

export function selectDecisionCard(state: GameState, card: DecisionCard): GameState {
  return {
    ...state,
    selectedDecisionCard: card,
    currentDecisionCards: null,
  };
}

export function applyDecision(
  state: GameState,
  option: CardOption,
  sideOption?: CardOption | null
): GameState {
  const card = state.selectedDecisionCard!;
  const newState = { ...state };
  newState.lifelines = { ...state.lifelines };
  newState.financials = { ...state.financials };
  newState.persistentEffects = [...state.persistentEffects];
  newState.activeFuses = [...state.activeFuses];

  const applyImmediate = (opt: CardOption) => {
    if (opt.immediate.cash) newState.financials.cash += opt.immediate.cash;
    if (opt.immediate.ar) newState.financials.accountsReceivable += opt.immediate.ar;
    if (opt.immediate.heartbeat) newState.lifelines.heartbeat = clamp(newState.lifelines.heartbeat + opt.immediate.heartbeat);
    if (opt.immediate.roots) newState.lifelines.roots = clamp(newState.lifelines.roots + opt.immediate.roots);
    if (opt.immediate.incomeChange) {
      newState.persistentEffects.push({
        id: `decision-inc-${card.id}-${Date.now()}-${Math.random()}`,
        description: `${card.name}`,
        type: 'income',
        value: opt.immediate.incomeChange,
        remainingQuarters: -1,
        source: card.name,
      });
    }
    if (opt.immediate.expenseChange) {
      newState.persistentEffects.push({
        id: `decision-exp-${card.id}-${Date.now()}-${Math.random()}`,
        description: `${card.name}`,
        type: 'expense',
        value: opt.immediate.expenseChange,
        remainingQuarters: -1,
        source: card.name,
      });
    }
  };

  applyImmediate(option);
  if (sideOption) applyImmediate(sideOption);

  // Plant fuse
  if (option.fuse) {
    const f = option.fuse;
    newState.activeFuses.push({
      id: `fuse-${card.id}-${option.id}-${Date.now()}`,
      sourceCardId: card.id,
      sourceOption: option.id,
      plantedAt: state.currentQuarter.index,
      detonateAt: state.currentQuarter.index + f.detonateAt,
      isRandom: f.isRandom || false,
      successRate: f.successRate,
      description: f.description,
      attribution: f.attribution,
      effects: f.effects,
    });
  }

  newState.decisionDeck = state.decisionDeck.filter(id => id !== card.id);
  newState.usedDecisionCards = [...state.usedDecisionCards, card.id];
  const effExpense = getEffectiveExpense(newState);
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, effExpense);
  newState.selectedDecisionCard = null;
  newState.phase = 'prediction';

  return newState;
}

/**
 * Force-skip a decision when all options are locked/unaffordable.
 * Applies a small penalty: heartbeat -2, roots -2.
 */
export function forceSkipDecision(state: GameState): GameState {
  const newState = { ...state };
  newState.lifelines = { ...state.lifelines };
  newState.lifelines.heartbeat = clamp(state.lifelines.heartbeat - 2);
  newState.lifelines.roots = clamp(state.lifelines.roots - 2);
  newState.selectedDecisionCard = null;
  newState.phase = 'prediction';
  return newState;
}

export function submitPrediction(state: GameState, prediction: Prediction): GameState {
  return { ...state, phase: 'settlement' };
}

// ============ SETTLEMENT ENGINE (8 Steps) ============
export function runSettlement(state: GameState): { newState: GameState; steps: SettlementStep[]; attributions: Attribution[] } {
  let s = { ...state };
  s.lifelines = { ...state.lifelines };
  s.financials = { ...state.financials };
  s.persistentEffects = [...state.persistentEffects];
  s.activeFuses = [...state.activeFuses];

  const steps: SettlementStep[] = [];
  const attributions: Attribution[] = [];
  const snapshot = (): GameSnapshot => ({
    lifelines: { ...s.lifelines },
    financials: { ...s.financials },
  });

  const before = snapshot();

  // Step 1: Base income/expense
  const baseNet = s.financials.quarterlyIncome - s.financials.quarterlyExpense;
  const oldCash = s.financials.cash;
  s.financials.cash += baseNet;
  steps.push({
    name: '基礎營收結算',
    changes: [{ lifeline: 'cash', before: oldCash, after: s.financials.cash, reason: `季收入 $${s.financials.quarterlyIncome}萬 - 季支出 $${s.financials.quarterlyExpense}萬` }],
  });

  // Step 1.5: Asset passive income
  if (s.assets && s.assets.length > 0) {
    const assetStep: SettlementStep = { name: '資產被動收入', changes: [] };
    for (const asset of s.assets) {
      if (asset.cashflow > 0) {
        const bc = s.financials.cash;
        s.financials.cash += asset.cashflow;
        assetStep.changes.push({
          lifeline: 'cash',
          before: bc,
          after: s.financials.cash,
          reason: asset.name,
        });
      }
    }
    if (assetStep.changes.length > 0) steps.push(assetStep);
  }

  // Step 1.7: Market price fluctuation
  {
    const marketStep: SettlementStep = { name: '股市行情', changes: [] };
    const newPrices = { ...s.marketPrices };
    for (const stock of stockDealCards) {
      const oldPrice = newPrices[stock.id] || stock.marketValue || 0;
      // Base random fluctuation
      let minPct: number, maxPct: number;
      if (stock.volatility === 'low') {
        minPct = -0.08; maxPct = 0.12;
      } else {
        minPct = -0.20; maxPct = 0.25;
      }
      let change = minPct + Math.random() * (maxPct - minPct);
      // Roots bonus
      if (s.lifelines.roots > 60) change += 0.05;
      else if (s.lifelines.roots < 30) change -= 0.10;
      // Heartbeat bonus for tech stock
      if (s.lifelines.heartbeat > 70 && stock.id === 'deal-x1') change += 0.08;
      const newPrice = Math.max(5, Math.min(500, Math.floor(oldPrice * (1 + change))));
      newPrices[stock.id] = newPrice;
      const diff = newPrice - oldPrice;
      if (diff !== 0) {
        marketStep.changes.push({
          lifeline: 'market',
          before: oldPrice,
          after: newPrice,
          reason: `${stock.name} ${diff > 0 ? '📈' : '📉'} $${oldPrice}→$${newPrice}萬`,
        });
      }
    }
    s.marketPrices = newPrices;
    s.marketPriceHistory = [...s.marketPriceHistory, { ...newPrices }];
    if (marketStep.changes.length > 0) steps.push(marketStep);
  }

  // Step 2: Persistent effects
  const persistStep: SettlementStep = { name: '持續效果結算', changes: [] };
  const newPersistent: PersistentEffect[] = [];
  for (const pe of s.persistentEffects) {
    switch (pe.type) {
      case 'income':
        s.financials.cash += pe.value;
        persistStep.changes.push({ lifeline: 'cash', before: s.financials.cash - pe.value, after: s.financials.cash, reason: pe.description });
        break;
      case 'expense':
        s.financials.cash -= pe.value;
        persistStep.changes.push({ lifeline: 'cash', before: s.financials.cash + pe.value, after: s.financials.cash, reason: pe.description });
        break;
      case 'heartbeat': {
        const bh = s.lifelines.heartbeat;
        s.lifelines.heartbeat = clamp(s.lifelines.heartbeat + pe.value);
        persistStep.changes.push({ lifeline: 'heartbeat', before: bh, after: s.lifelines.heartbeat, reason: pe.description });
        break;
      }
      case 'roots': {
        const br = s.lifelines.roots;
        s.lifelines.roots = clamp(s.lifelines.roots + pe.value);
        persistStep.changes.push({ lifeline: 'roots', before: br, after: s.lifelines.roots, reason: pe.description });
        break;
      }
    }
    if (pe.remainingQuarters === -1) {
      newPersistent.push(pe);
    } else if (pe.remainingQuarters > 1) {
      newPersistent.push({ ...pe, remainingQuarters: pe.remainingQuarters - 1 });
    }
  }
  s.persistentEffects = newPersistent;
  if (persistStep.changes.length > 0) steps.push(persistStep);

  // Step 3: Fuse detonation
  const fuseStep: SettlementStep = { name: '伏筆引爆', changes: [] };
  const remainingFuses: Fuse[] = [];
  const newFusesToAdd: Fuse[] = [];

  for (const fuse of s.activeFuses) {
    if (fuse.detonateAt <= s.currentQuarter.index) {
      let effects: FuseEffect;
      if (fuse.isRandom && fuse.successRate !== undefined) {
        const roll = Math.random();
        effects = roll < fuse.successRate ? fuse.effects.success : (fuse.effects.failure || fuse.effects.success);
        const resultLabel = roll < fuse.successRate ? '成功' : '失敗';
        attributions.push({
          source: `${fuse.attribution}（${resultLabel}）`,
          lifeline: 'cash',
          direction: (effects.cash || 0) >= 0 ? 'up' : 'down',
          magnitude: 'large',
          isPlayerDecision: true,
        });
      } else {
        effects = fuse.effects.success;
      }

      if (effects.cash) {
        const bc = s.financials.cash;
        s.financials.cash += effects.cash;
        fuseStep.changes.push({ lifeline: 'cash', before: bc, after: s.financials.cash, reason: fuse.attribution });
      }
      if (effects.heartbeat) {
        const bh = s.lifelines.heartbeat;
        s.lifelines.heartbeat = clamp(s.lifelines.heartbeat + effects.heartbeat);
        fuseStep.changes.push({ lifeline: 'heartbeat', before: bh, after: s.lifelines.heartbeat, reason: fuse.attribution });
      }
      if (effects.roots) {
        const br = s.lifelines.roots;
        s.lifelines.roots = clamp(s.lifelines.roots + effects.roots);
        fuseStep.changes.push({ lifeline: 'roots', before: br, after: s.lifelines.roots, reason: fuse.attribution });
      }
      if (effects.incomeChange) {
        s.persistentEffects.push({
          id: `fuse-income-${fuse.id}`,
          description: fuse.attribution,
          type: 'income',
          value: effects.incomeChange,
          remainingQuarters: -1,
          source: fuse.attribution,
        });
      }
      if (effects.expenseChange) {
        s.persistentEffects.push({
          id: `fuse-expense-${fuse.id}`,
          description: fuse.attribution,
          type: 'expense',
          value: effects.expenseChange,
          remainingQuarters: -1,
          source: fuse.attribution,
        });
      }

      // Chained fuse
      if (effects.chainedFuse) {
        const cf = effects.chainedFuse;
        let shouldChain = true;
        if (cf.condition) {
          const val = s.lifelines[cf.condition.lifeline];
          if (val >= cf.condition.below) shouldChain = false;
        }
        if (shouldChain) {
          newFusesToAdd.push({
            id: `chain-${fuse.id}-${Date.now()}`,
            sourceCardId: fuse.sourceCardId,
            sourceOption: cf.sourceOption,
            plantedAt: s.currentQuarter.index,
            detonateAt: s.currentQuarter.index + cf.detonateAt,
            isRandom: cf.isRandom || false,
            successRate: cf.successRate,
            description: cf.description,
            attribution: cf.attribution,
            effects: cf.effects,
          });
        }
      }
    } else {
      remainingFuses.push(fuse);
    }
  }
  s.activeFuses = [...remainingFuses, ...newFusesToAdd];
  if (fuseStep.changes.length > 0) steps.push(fuseStep);

  // Step 4: Flywheel / Death Spiral (v4.1: 6-path system)
  const flywheelStep: SettlementStep = { name: '飛輪/螺旋效應', changes: [] };

  // --- Positive Flywheel (6 paths) ---
  // ① 心跳→根系: H > 65 → R +2
  if (s.lifelines.heartbeat > 65) {
    const br = s.lifelines.roots;
    s.lifelines.roots = clamp(s.lifelines.roots + 2);
    if (s.lifelines.roots !== br) {
      flywheelStep.changes.push({ lifeline: 'roots', before: br, after: s.lifelines.roots, reason: '正向飛輪：心跳→根系 +2' });
    }
  }
  // ② 根系→心跳: R > 65 → H +2
  if (s.lifelines.roots > 65) {
    const bh = s.lifelines.heartbeat;
    s.lifelines.heartbeat = clamp(s.lifelines.heartbeat + 2);
    if (s.lifelines.heartbeat !== bh) {
      flywheelStep.changes.push({ lifeline: 'heartbeat', before: bh, after: s.lifelines.heartbeat, reason: '正向飛輪：根系→心跳 +2' });
    }
  }
  // ③ 根系→現金: R > 55 → 季收入 +10% (applied as one-time cash bonus this quarter)
  if (s.lifelines.roots > 55) {
    const incomeBonus = Math.round(s.financials.quarterlyIncome * 0.10);
    const bc = s.financials.cash;
    s.financials.cash += incomeBonus;
    flywheelStep.changes.push({ lifeline: 'cash', before: bc, after: s.financials.cash, reason: `正向飛輪：根系→營收 +10%（+$${incomeBonus}萬）` });
  }
  // ⑥ 心跳→現金: H > 75 → 運營成本 -5% (applied as one-time cash saving this quarter)
  if (s.lifelines.heartbeat > 75) {
    const costSaving = Math.round(s.financials.quarterlyExpense * 0.05);
    const bc = s.financials.cash;
    s.financials.cash += costSaving;
    flywheelStep.changes.push({ lifeline: 'cash', before: bc, after: s.financials.cash, reason: `正向飛輪：心跳→降本 -5%（+$${costSaving}萬）` });
  }
  // ④⑤ are investment-driven (handled in investment system)

  if (flywheelStep.changes.length > 0) {
    attributions.push({ source: '正向飛輪', lifeline: 'heartbeat', direction: 'up', magnitude: 'small', isPlayerDecision: false });
  }

  // --- Death Spiral (6 paths) ---
  // ① 心跳↓→根系↓: H < 35 → R -4
  if (s.lifelines.heartbeat < 35) {
    const br = s.lifelines.roots;
    s.lifelines.roots = clamp(s.lifelines.roots - 4);
    if (s.lifelines.roots !== br) {
      flywheelStep.changes.push({ lifeline: 'roots', before: br, after: s.lifelines.roots, reason: '死亡螺旋：心跳↓→根系 -4' });
    }
  }
  // ② 根系↓→心跳↓: R < 25 → H -3
  if (s.lifelines.roots < 25) {
    const bh = s.lifelines.heartbeat;
    s.lifelines.heartbeat = clamp(s.lifelines.heartbeat - 3);
    if (s.lifelines.heartbeat !== bh) {
      flywheelStep.changes.push({ lifeline: 'heartbeat', before: bh, after: s.lifelines.heartbeat, reason: '死亡螺旋：根系↓→心跳 -3' });
    }
  }
  // ③ 根系↓→現金↓: R < 25 → 季收入 -15%
  if (s.lifelines.roots < 25) {
    const incomeLoss = Math.round(s.financials.quarterlyIncome * 0.15);
    const bc = s.financials.cash;
    s.financials.cash -= incomeLoss;
    flywheelStep.changes.push({ lifeline: 'cash', before: bc, after: s.financials.cash, reason: `死亡螺旋：根系↓→營收 -15%（-$${incomeLoss}萬）` });
  }
  // ④ 現金↓→心跳↓: A < 30% → H -5
  const currentArtery = calcArtery(s.financials.cash, getEffectiveExpense(s));
  if (currentArtery < 30) {
    const bh = s.lifelines.heartbeat;
    s.lifelines.heartbeat = clamp(s.lifelines.heartbeat - 5);
    if (s.lifelines.heartbeat !== bh) {
      flywheelStep.changes.push({ lifeline: 'heartbeat', before: bh, after: s.lifelines.heartbeat, reason: '死亡螺旋：動脈↓→心跳 -5' });
    }
  }
  // ⑤ 現金↓→根系↓: A < 25% → R -3
  if (currentArtery < 25) {
    const br = s.lifelines.roots;
    s.lifelines.roots = clamp(s.lifelines.roots - 3);
    if (s.lifelines.roots !== br) {
      flywheelStep.changes.push({ lifeline: 'roots', before: br, after: s.lifelines.roots, reason: '死亡螺旋：動脈↓→根系 -3' });
    }
  }
  // ⑥ 心跳↓→現金↓: H < 25 → 運營成本 +8%
  if (s.lifelines.heartbeat < 25) {
    const costIncrease = Math.round(s.financials.quarterlyExpense * 0.08);
    const bc = s.financials.cash;
    s.financials.cash -= costIncrease;
    flywheelStep.changes.push({ lifeline: 'cash', before: bc, after: s.financials.cash, reason: `死亡螺旋：心跳↓→成本 +8%（-$${costIncrease}萬）` });
  }

  if (flywheelStep.changes.some(c => c.reason.startsWith('死亡螺旋'))) {
    attributions.push({ source: '死亡螺旋', lifeline: 'heartbeat', direction: 'down', magnitude: 'large', isPlayerDecision: false });
  }

  if (flywheelStep.changes.length > 0) steps.push(flywheelStep);

  // Step 5: Update artery
  const effExpense = getEffectiveExpense(s);
  s.lifelines.cashPercent = calcArtery(s.financials.cash, effExpense);

  // Step 6: Natural decay (v4.1: H-2, R-1)
  const decayStep: SettlementStep = { name: '自然熵增', changes: [] };
  {
    const bh = s.lifelines.heartbeat;
    s.lifelines.heartbeat = clamp(s.lifelines.heartbeat - 2);
    decayStep.changes.push({ lifeline: 'heartbeat', before: bh, after: s.lifelines.heartbeat, reason: '自然熵增 -2' });
  }
  {
    const br = s.lifelines.roots;
    s.lifelines.roots = clamp(s.lifelines.roots - 1);
    decayStep.changes.push({ lifeline: 'roots', before: br, after: s.lifelines.roots, reason: '自然熵增 -1' });
  }
  steps.push(decayStep);

  // Step 7: Revenue Growth Engine (v4.1: 營收成長引擎 — Q4 year-end)
  if (s.currentQuarter.quarter === 4) {
    const avgHR = (s.lifelines.heartbeat + s.lifelines.roots) / 2;
    let revenueGrowth = 0;
    if (avgHR >= 70) {
      revenueGrowth = 20;
    } else if (avgHR >= 50) {
      revenueGrowth = 10;
    }

    if (revenueGrowth > 0) {
      const oldIncome = s.financials.quarterlyIncome;
      s.financials.quarterlyIncome += revenueGrowth;
      const growthStep: SettlementStep = {
        name: '營收成長引擎',
        changes: [{
          lifeline: 'income',
          before: oldIncome,
          after: s.financials.quarterlyIncome,
          reason: `年度成長：季收入 +$${revenueGrowth}萬（均H${Math.round(s.lifelines.heartbeat)}/R${Math.round(s.lifelines.roots)}）`,
        }],
      };
      steps.push(growthStep);
      attributions.push({
        source: '營收成長引擎',
        lifeline: 'cash',
        direction: 'up',
        magnitude: revenueGrowth >= 20 ? 'large' : 'small',
        isPlayerDecision: false,
      });
    }
  }

  // Final artery recalc
  s.lifelines.cashPercent = calcArtery(s.financials.cash, getEffectiveExpense(s));

  const after = snapshot();

  // Build attributions from state diff
  if (after.lifelines.heartbeat > before.lifelines.heartbeat) {
    attributions.push({ source: '本季總計', lifeline: 'heartbeat', direction: 'up', magnitude: Math.abs(after.lifelines.heartbeat - before.lifelines.heartbeat) > 5 ? 'large' : 'small', isPlayerDecision: false });
  } else if (after.lifelines.heartbeat < before.lifelines.heartbeat) {
    attributions.push({ source: '本季總計', lifeline: 'heartbeat', direction: 'down', magnitude: Math.abs(after.lifelines.heartbeat - before.lifelines.heartbeat) > 5 ? 'large' : 'small', isPlayerDecision: false });
  }

  // Record net worth history (after all steps)
  s.netWorthHistory = [...s.netWorthHistory, calcNetWorth(s)];

  s.phase = 'attribution';
  return { newState: s, steps, attributions };
}

// ============ GAME OVER CHECK ============
export function checkGameOver(state: GameState): { isOver: boolean; reason?: string } {
  if (state.lifelines.cashPercent <= 0 || state.financials.cash <= 0) {
    return { isOver: true, reason: '現金歸零——公司破產了。' };
  }
  if (state.lifelines.heartbeat <= DEATH_THRESHOLD) {
    return { isOver: true, reason: '團隊心跳停止——核心人才全部離開。' };
  }
  if (state.lifelines.roots <= DEATH_THRESHOLD) {
    return { isOver: true, reason: '市場根系枯死——客戶全部流失。' };
  }
  // Two lifelines below critical
  const critCount = [state.lifelines.cashPercent, state.lifelines.heartbeat, state.lifelines.roots]
    .filter(v => v < CRITICAL_THRESHOLD).length;
  if (critCount >= 2) {
    return { isOver: true, reason: '雙線瀕危——公司已無力回天。' };
  }
  return { isOver: false };
}

// ============ ADVANCE QUARTER ============
export function advanceQuarter(state: GameState): GameState {
  const nextIndex = state.currentQuarter.index + 1;

  if (nextIndex >= TOTAL_QUARTERS) {
    return calculateFinalScore(state);
  }

  const nextQuarter = getQuarterInfo(nextIndex);
  return {
    ...state,
    currentQuarter: nextQuarter,
    investmentsMadeThisQuarter: 0,
    marketTradesThisQuarter: { bought: false, sold: false },
    currentDecisionCards: null,
    currentEntropyCard: null,
    currentOpportunityCard: null,
    currentExpenseCard: null,
    currentDealCard: null,
    selectedDecisionCard: null,
  };
}

// ============ SCORING ============
export function calculateFinalScore(state: GameState): GameState {
  // Handle overflow fuses (x0.7 modifier)
  let overflowBonus = 0;
  for (const fuse of state.activeFuses) {
    const effects = fuse.effects.success;
    const val = ((effects.cash || 0) + (effects.heartbeat || 0) + (effects.roots || 0)) * 0.7;
    overflowBonus += val;
  }

  const lifelineScore = (state.lifelines.cashPercent + state.lifelines.heartbeat + state.lifelines.roots) / 3;
  const survivalBonus = 20;
  const financialScore = Math.min(30, state.financials.cash / 20);

  const predScore = state.predictionHistory.reduce((acc, p) => {
    let hits = 0;
    if (p.prediction.cash === p.actual.cash) hits++;
    if (p.prediction.heartbeat === p.actual.heartbeat) hits++;
    if (p.prediction.roots === p.actual.roots) hits++;
    return acc + hits;
  }, 0);
  const predBonus = Math.min(15, predScore * 2);

  const totalScore = Math.round(lifelineScore + survivalBonus + financialScore + predBonus + overflowBonus * 0.1);

  let rating = 'C';
  let ceoStyle = '存活者';
  if (totalScore >= 90) { rating = 'S'; ceoStyle = '傳奇 CEO'; }
  else if (totalScore >= 80) { rating = 'A'; ceoStyle = '卓越經營者'; }
  else if (totalScore >= 70) { rating = 'B+'; ceoStyle = '穩健舵手'; }
  else if (totalScore >= 60) { rating = 'B'; ceoStyle = '務實管理者'; }
  else if (totalScore >= 50) { rating = 'C+'; ceoStyle = '生存主義者'; }

  return {
    ...state,
    phase: 'victory',
    score: totalScore,
    rating,
    ceoStyle,
  };
}

// ============ OPTION LOCK CHECK ============
export function isOptionLocked(option: CardOption, lifelines: Lifelines): { locked: boolean; reason: string } {
  if (!option.lockConditions || option.lockConditions.length === 0) {
    return { locked: false, reason: '' };
  }
  for (const cond of option.lockConditions) {
    const value = lifelines[cond.lifeline];
    if (cond.above !== undefined && value < cond.above) {
      return { locked: true, reason: `${cond.reason}（需要 ${cond.lifeline === 'cashPercent' ? '動脈' : cond.lifeline === 'heartbeat' ? '心跳' : '根系'} > ${cond.above}%）` };
    }
    if (cond.below !== undefined && value > cond.below) {
      return { locked: true, reason: cond.reason };
    }
  }
  return { locked: false, reason: '' };
}

// Can afford
export function canAfford(state: GameState, cost: number): boolean {
  return state.financials.cash >= cost;
}

// ============ DEAL SYSTEM (資產/被動收入) ============

/**
 * Try to draw a deal card after attribution phase.
 * Trigger probability depends on current artery:
 *   > 60% → 80%, 40-60% → 50%, < 40% → 20%
 * Returns updated state with either a deal card or advanced quarter.
 */
export function tryDrawDeal(state: GameState): GameState {
  const artery = state.lifelines.cashPercent;
  let triggerChance: number;
  if (artery > 60) triggerChance = 0.8;
  else if (artery >= 40) triggerChance = 0.5;
  else triggerChance = 0.2;

  if (Math.random() < triggerChance) {
    const card = activeDealCards[Math.floor(Math.random() * activeDealCards.length)];
    return { ...state, currentDealCard: card, phase: 'deal' };
  }

  // No deal triggered
  return state;
}

/**
 * Player buys the current deal card.
 */
export function buyDeal(state: GameState): GameState {
  const card = state.currentDealCard;
  if (!card) return advanceQuarter(state);

  const newAsset: Asset = {
    id: `asset-${card.id}-${Date.now()}-${Math.random()}`,
    dealCardId: card.id,
    name: card.name,
    type: card.type,
    cost: card.cost,
    cashflow: card.cashflow,
    acquiredAt: state.currentQuarter.index,
  };

  const newState = { ...state };
  newState.financials = { ...state.financials, cash: state.financials.cash - card.cost };
  newState.assets = [...state.assets, newAsset];
  newState.lifelines = { ...state.lifelines };
  const effExpense = getEffectiveExpense(newState);
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, effExpense);
  newState.currentDealCard = null;

  return newState;
}

/**
 * Player skips the current deal.
 */
export function skipDeal(state: GameState): GameState {
  return { ...state, currentDealCard: null };
}

/**
 * Check if a deal card can be purchased.
 */
export function canBuyDeal(state: GameState, card: DealCard): { canBuy: boolean; reason: string } {
  if (state.financials.cash < card.cost) {
    return { canBuy: false, reason: `現金不足（需要 $${card.cost}萬）` };
  }
  if (card.arteryRequirement && state.lifelines.cashPercent <= card.arteryRequirement) {
    return { canBuy: false, reason: `動脈不足（需要 > ${card.arteryRequirement}%）` };
  }
  return { canBuy: true, reason: '' };
}

// ============ UNEXPECTED EXPENSE SYSTEM ============

/**
 * Try to draw an expense card at the start of each quarter.
 * Q1Y1 (index 0) is exempt. Trigger probability inversely linked to artery.
 */
export function tryDrawExpense(state: GameState): GameState {
  // Q1Y1 exempt
  if (state.currentQuarter.index === 0) return state;

  const artery = state.lifelines.cashPercent;
  let triggerChance: number;
  if (artery > 60) triggerChance = 0.3;
  else if (artery >= 40) triggerChance = 0.5;
  else triggerChance = 0.8;

  if (Math.random() < triggerChance) {
    const card = expenseCards[Math.floor(Math.random() * expenseCards.length)];
    return { ...state, currentExpenseCard: card, phase: 'expense' };
  }

  return state;
}

/**
 * Pay the current expense card. Deducts cash (floor 0), recalcs artery, checks game over.
 */
export function payExpense(state: GameState): GameState {
  const card = state.currentExpenseCard;
  if (!card) return { ...state, phase: 'investment' };

  const newState = { ...state };
  newState.financials = { ...state.financials };
  newState.lifelines = { ...state.lifelines };

  // Deduct cash (floor at 0)
  newState.financials.cash = Math.max(0, state.financials.cash - card.cost);

  // Recalc artery
  const effExpense = getEffectiveExpense(newState);
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, effExpense);

  // Clear expense card
  newState.currentExpenseCard = null;

  // Check game over
  const goCheck = checkGameOver(newState);
  if (goCheck.isOver) {
    return { ...newState, phase: 'gameOver' as const, gameOverReason: goCheck.reason };
  }

  newState.phase = 'investment';
  return newState;
}

// ============ MARKET / STOCK SYSTEM ============

/**
 * Calculate net worth: cash + asset costs + stock market values + AR
 */
export function calcNetWorth(state: GameState): number {
  const assetValue = state.assets.reduce((sum, a) => sum + a.cost, 0);
  const stockValue = state.stocks.reduce((sum, s) => sum + (state.marketPrices[s.dealCardId] || 0), 0);
  return state.financials.cash + assetValue + stockValue + state.financials.accountsReceivable;
}

/**
 * Buy a stock at current market price.
 */
export function buyStock(state: GameState, dealCardId: string): GameState {
  const price = state.marketPrices[dealCardId];
  if (!price || state.financials.cash < price || state.marketTradesThisQuarter.bought) return state;

  const card = stockDealCards.find(c => c.id === dealCardId);
  if (!card) return state;

  const holding: StockHolding = {
    id: `stock-${dealCardId}-${Date.now()}-${Math.random()}`,
    dealCardId,
    name: card.name,
    purchasePrice: price,
    acquiredAt: state.currentQuarter.index,
  };

  const newState = { ...state };
  newState.financials = { ...state.financials, cash: state.financials.cash - price };
  newState.stocks = [...state.stocks, holding];
  newState.marketTradesThisQuarter = { ...state.marketTradesThisQuarter, bought: true };
  newState.lifelines = { ...state.lifelines };
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, getEffectiveExpense(newState));
  return newState;
}

/**
 * Sell a stock holding at current market price.
 */
export function sellStock(state: GameState, holdingId: string): GameState {
  const holding = state.stocks.find(s => s.id === holdingId);
  if (!holding || state.marketTradesThisQuarter.sold) return state;

  const price = state.marketPrices[holding.dealCardId] || 0;

  const newState = { ...state };
  newState.financials = { ...state.financials, cash: state.financials.cash + price };
  newState.stocks = state.stocks.filter(s => s.id !== holdingId);
  newState.marketTradesThisQuarter = { ...state.marketTradesThisQuarter, sold: true };
  newState.lifelines = { ...state.lifelines };
  newState.lifelines.cashPercent = calcArtery(newState.financials.cash, getEffectiveExpense(newState));
  return newState;
}

/**
 * Check if market phase should auto-skip (no stocks held and can't afford any).
 */
export function shouldAutoSkipMarket(state: GameState): boolean {
  if (state.stocks.length > 0) return false;
  const cheapest = Math.min(...Object.values(state.marketPrices));
  return state.financials.cash < cheapest;
}
