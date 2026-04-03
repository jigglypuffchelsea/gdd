import { OpportunityCard, GameState } from '../engine/types';

interface Props {
  card: OpportunityCard;
  state: GameState;
  onAccept: () => void;
}

export function OpportunityPanel({ card, state, onAccept }: Props) {
  // Calculate the actual cash for revenue-percent cards
  let cashDisplay = '';
  if (card.effects.cash) {
    cashDisplay = `+$${card.effects.cash}萬`;
  }
  if (card.effects.revenuePercent) {
    const bonus = Math.round(state.financials.quarterlyIncome * card.effects.revenuePercent);
    cashDisplay = cashDisplay ? `${cashDisplay} + $${bonus}萬` : `+$${bonus}萬`;
  }

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <div className="text-5xl mb-3">🎯</div>
        <h2 className="text-2xl font-bold text-amber-400">商機來了！</h2>
        <p className="text-slate-500 text-sm mt-1">營運季觸發商機牌</p>
      </div>

      <div className="bg-gradient-to-br from-amber-900/30 to-yellow-900/20 border border-amber-700/40 rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold text-amber-300 mb-2">{card.name}</h3>
        <p className="text-slate-300 mb-4">{card.description}</p>

        <div className="flex flex-wrap gap-3">
          {cashDisplay && (
            <div className="bg-amber-800/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-amber-500">💰</span>
              <span className="text-amber-200 font-mono font-bold">{cashDisplay}</span>
            </div>
          )}
          {card.effects.roots && (
            <div className="bg-green-800/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-green-500">🌿</span>
              <span className="text-green-200 font-mono font-bold">根系 +{card.effects.roots}</span>
            </div>
          )}
          {card.effects.heartbeat && (
            <div className="bg-red-800/30 rounded-lg px-3 py-2 flex items-center gap-2">
              <span className="text-red-500">💓</span>
              <span className="text-red-200 font-mono font-bold">心跳 +{card.effects.heartbeat}</span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={onAccept}
        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-bold text-lg transition-all"
      >
        收下商機 →
      </button>
    </div>
  );
}
