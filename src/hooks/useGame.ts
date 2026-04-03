import { useState, useCallback, useRef } from 'react';
import {
  GameState, Prediction, CardOption, DecisionCard, SettlementStep, Attribution,
} from '../engine/types';
import {
  createInitialState, startQuarter, applyInvestment, drawEntropyCard,
  handleEntropy, selectDecisionCard, applyDecision, submitPrediction,
  runSettlement, checkGameOver, advanceQuarter, isOptionLocked, canAfford,
  applyOpportunityCard, tryDrawDeal, buyDeal, skipDeal,
  buyStock, sellStock, shouldAutoSkipMarket, payExpense, forceSkipDecision,
} from '../engine/gameEngine';
import { investmentOptions } from '../data/investments';
import { InvestmentOption } from '../engine/types';

export function useGame() {
  const [state, setState] = useState<GameState>(createInitialState());
  const [settlementSteps, setSettlementSteps] = useState<SettlementStep[]>([]);
  const [settlementAttributions, setSettlementAttributions] = useState<Attribution[]>([]);
  const [currentPrediction, setCurrentPrediction] = useState<Prediction>({
    cash: 'unknown', heartbeat: 'unknown', roots: 'unknown',
  });

  // Use ref to always have latest state for callbacks that need it
  const stateRef = useRef(state);
  stateRef.current = state;

  const newGame = useCallback(() => {
    setState(createInitialState());
    setSettlementSteps([]);
    setSettlementAttributions([]);
  }, []);

  const beginGame = useCallback(() => {
    setState(prev => {
      return startQuarter(prev);
    });
  }, []);

  const doPayExpense = useCallback(() => {
    setState(prev => payExpense(prev));
  }, []);

  const doInvestment = useCallback((inv: InvestmentOption) => {
    setState(prev => {
      if (!canAfford(prev, inv.cost)) return prev;
      return applyInvestment(prev, inv);
    });
  }, []);

  const finishInvestment = useCallback(() => {
    setState(prev => drawEntropyCard(prev));
  }, []);

  const doEntropy = useCallback((method: 'endure' | 'resolve') => {
    setState(prev => handleEntropy(prev, method));
  }, []);

  const doOpportunity = useCallback(() => {
    setState(prev => applyOpportunityCard(prev));
  }, []);

  const doSelectCard = useCallback((card: DecisionCard) => {
    setState(prev => selectDecisionCard(prev, card));
  }, []);

  const doDecision = useCallback((option: CardOption, side?: CardOption | null) => {
    setState(prev => {
      const lockCheck = isOptionLocked(option, prev.lifelines);
      if (lockCheck.locked) return prev;
      return applyDecision(prev, option, side);
    });
  }, []);

  const doForceSkipDecision = useCallback(() => {
    setState(prev => forceSkipDecision(prev));
  }, []);

  const doPrediction = useCallback((pred: Prediction) => {
    setCurrentPrediction(pred);
    setState(prev => submitPrediction(prev, pred));
  }, []);

  const doSettlement = useCallback(() => {
    setState(prev => {
      const { newState, steps, attributions } = runSettlement(prev);
      setSettlementSteps(steps);
      setSettlementAttributions(attributions);

      const goCheck = checkGameOver(newState);
      if (goCheck.isOver) {
        return { ...newState, phase: 'gameOver' as const, gameOverReason: goCheck.reason };
      }
      return newState;
    });
  }, []);

  const doAdvance = useCallback(() => {
    setState(prev => {
      // Attribution → Market phase (or auto-skip if nothing to do)
      if (shouldAutoSkipMarket(prev)) {
        // Auto-skip market, go straight to deal check
        const dealState = tryDrawDeal(prev);
        if (dealState.phase === 'deal') return dealState;
        const nextState = advanceQuarter(dealState);
        if (nextState.phase === 'victory') return nextState;
        return startQuarter(nextState);
      }
      return { ...prev, phase: 'market' as const };
    });
  }, []);

  const doBuyStock = useCallback((dealCardId: string) => {
    setState(prev => buyStock(prev, dealCardId));
  }, []);

  const doSellStock = useCallback((holdingId: string) => {
    setState(prev => sellStock(prev, holdingId));
  }, []);

  const doFinishMarket = useCallback(() => {
    setState(prev => {
      const dealState = tryDrawDeal(prev);
      if (dealState.phase === 'deal') return dealState;
      const nextState = advanceQuarter(dealState);
      if (nextState.phase === 'victory') return nextState;
      return startQuarter(nextState);
    });
  }, []);

  const doBuyDeal = useCallback(() => {
    setState(prev => {
      const bought = buyDeal(prev);
      const nextState = advanceQuarter(bought);
      if (nextState.phase === 'victory') {
        return nextState;
      }
      return startQuarter(nextState);
    });
  }, []);

  const doSkipDeal = useCallback(() => {
    setState(prev => {
      const skipped = skipDeal(prev);
      const nextState = advanceQuarter(skipped);
      if (nextState.phase === 'victory') {
        return nextState;
      }
      return startQuarter(nextState);
    });
  }, []);

  const goToReview = useCallback(() => {
    setState(prev => ({ ...prev, phase: 'review' as const }));
  }, []);

  return {
    state,
    settlementSteps,
    settlementAttributions,
    currentPrediction,
    investmentOptions,
    newGame,
    beginGame,
    doPayExpense,
    doInvestment,
    finishInvestment,
    doEntropy,
    doOpportunity,
    doSelectCard,
    doDecision,
    doForceSkipDecision,
    doPrediction,
    doSettlement,
    doAdvance,
    doBuyStock,
    doSellStock,
    doFinishMarket,
    doBuyDeal,
    doSkipDeal,
    goToReview,
  };
}
