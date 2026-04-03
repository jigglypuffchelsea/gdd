import { InvestmentOption, GameState } from '../engine/types';
import { canAfford } from '../engine/gameEngine';

interface Props {
  state: GameState;
  investments: InvestmentOption[];
  onInvest: (inv: InvestmentOption) => void;
  onFinish: () => void;
}

export function InvestmentPanel({ state, investments, onInvest, onFinish }: Props) {
  const maxPerQuarter = 2;
  const canStillInvest = state.investmentsMadeThisQuarter < maxPerQuarter;

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
            <span>📊</span> 季度投資
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            每季最多 2 項投資。投資可強化心跳或根系。
          </p>
        </div>
        <div className="text-sm text-slate-400">
          已投資 {state.investmentsMadeThisQuarter}/{maxPerQuarter}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {investments.map((inv) => {
          const affordable = canAfford(state, inv.cost);
          const disabled = !canStillInvest || !affordable;

          return (
            <button
              key={inv.id}
              onClick={() => !disabled && onInvest(inv)}
              disabled={disabled}
              className={`text-left p-3 rounded-xl border transition-all ${
                disabled
                  ? 'bg-slate-800/30 border-slate-700/30 opacity-50 cursor-not-allowed'
                  : 'bg-slate-800/60 border-slate-600/50 hover:border-amber-500/50 hover:bg-slate-700/60 cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm text-slate-200">{inv.name}</span>
                <span className={`text-xs font-mono ${affordable ? 'text-amber-400' : 'text-red-400'}`}>
                  ${inv.cost}萬
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {inv.target === 'heartbeat' ? '💓' : '🌿'}
                {' '}立即 +{inv.immediate[inv.target]}
                {inv.persistent && ` · 持續 ${inv.persistent.quarters} 季每季 +${inv.persistent.value}`}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onFinish}
        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all font-medium"
      >
        {canStillInvest ? '跳過投資，進入下一階段 →' : '繼續 →'}
      </button>
    </div>
  );
}
