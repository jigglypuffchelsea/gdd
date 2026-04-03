import { EntropyCard, GameState } from '../engine/types';
import { canAfford } from '../engine/gameEngine';

interface Props {
  card: EntropyCard;
  state: GameState;
  onChoice: (method: 'endure' | 'resolve') => void;
}

const difficultyColors = {
  light: { bg: 'bg-blue-900/40', text: 'text-blue-400', border: 'border-blue-800/50', label: '輕度' },
  medium: { bg: 'bg-amber-900/40', text: 'text-amber-400', border: 'border-amber-800/50', label: '中度' },
  heavy: { bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-800/50', label: '重度' },
};

export function EntropyPanel({ card, state, onChoice }: Props) {
  const diff = difficultyColors[card.difficulty];

  // Check if resolve is locked
  const resolveCost = Math.abs(card.resolve.cash || 0);
  const canResolve = canAfford(state, resolveCost) && !(
    card.resolve.lockCondition &&
    state.lifelines[card.resolve.lockCondition.lifeline] < card.resolve.lockCondition.below
  );

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="text-center mb-4">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-3xl">⚡</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${diff.bg} ${diff.text} border ${diff.border}`}>
            {diff.label}熵事件
          </span>
        </div>
        <h2 className="text-2xl font-bold text-slate-100">{card.name}</h2>
        <p className="text-slate-500 text-xs mt-1">目標生命線：{card.targetLifeline}</p>
      </div>

      {/* Two options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Endure */}
        <button
          onClick={() => onChoice('endure')}
          className="text-left p-5 rounded-xl border border-red-800/40 bg-red-950/20 hover:bg-red-950/40 hover:border-red-700/60 transition-all group"
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🛡️</span>
            <span className="font-bold text-red-400">硬扛</span>
            <span className="text-xs text-slate-500">不花錢，但承受全部傷害</span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{card.endure.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {card.endure.heartbeat && (
              <span className={`px-2 py-0.5 rounded ${card.endure.heartbeat < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                💓 {card.endure.heartbeat > 0 ? '+' : ''}{card.endure.heartbeat}
              </span>
            )}
            {card.endure.roots && (
              <span className={`px-2 py-0.5 rounded ${card.endure.roots < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                🌿 {card.endure.roots > 0 ? '+' : ''}{card.endure.roots}
              </span>
            )}
            {card.endure.cash && (
              <span className="px-2 py-0.5 rounded bg-red-900/40 text-red-400">
                💰 {card.endure.cash}萬
              </span>
            )}
            {card.endure.expenseChange && (
              <span className="px-2 py-0.5 rounded bg-red-900/40 text-red-400">
                📈 季支出 +${card.endure.expenseChange}萬
              </span>
            )}
            {card.endure.plantsFuse && (
              <span className="px-2 py-0.5 rounded bg-purple-900/40 text-purple-400">
                💣 埋下伏筆
              </span>
            )}
          </div>
        </button>

        {/* Resolve */}
        <button
          onClick={() => canResolve && onChoice('resolve')}
          disabled={!canResolve}
          className={`text-left p-5 rounded-xl border transition-all ${
            canResolve
              ? 'border-green-800/40 bg-green-950/20 hover:bg-green-950/40 hover:border-green-700/60 cursor-pointer'
              : 'border-slate-700/30 bg-slate-800/20 opacity-50 cursor-not-allowed'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">💎</span>
            <span className="font-bold text-green-400">化解</span>
            <span className="text-xs text-slate-500">花錢降低傷害</span>
          </div>
          <p className="text-sm text-slate-300 mb-3">{card.resolve.description}</p>
          <div className="flex flex-wrap gap-2 text-xs">
            {card.resolve.cash && (
              <span className={`px-2 py-0.5 rounded ${card.resolve.cash < 0 ? 'bg-amber-900/40 text-amber-400' : 'bg-green-900/40 text-green-400'}`}>
                💰 {card.resolve.cash}萬
              </span>
            )}
            {card.resolve.heartbeat && (
              <span className={`px-2 py-0.5 rounded ${card.resolve.heartbeat < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                💓 {card.resolve.heartbeat > 0 ? '+' : ''}{card.resolve.heartbeat}
              </span>
            )}
            {card.resolve.roots && (
              <span className={`px-2 py-0.5 rounded ${card.resolve.roots < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                🌿 {card.resolve.roots > 0 ? '+' : ''}{card.resolve.roots}
              </span>
            )}
            {card.resolve.expenseChange !== undefined && card.resolve.expenseChange !== 0 && (
              <span className={`px-2 py-0.5 rounded ${card.resolve.expenseChange > 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                📊 季支出 {card.resolve.expenseChange > 0 ? '+' : ''}${card.resolve.expenseChange}萬
              </span>
            )}
          </div>
          {!canResolve && (
            <p className="text-red-500 text-xs mt-2">⚠️ 現金不足或條件不滿足</p>
          )}
        </button>
      </div>
    </div>
  );
}
