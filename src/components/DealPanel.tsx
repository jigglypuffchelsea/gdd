import { GameState, DealCard } from '../engine/types';
import { canBuyDeal } from '../engine/gameEngine';

interface DealPanelProps {
  card: DealCard;
  state: GameState;
  onBuy: () => void;
  onSkip: () => void;
}

const typeConfig = {
  small: {
    label: '小型交易',
    icon: '🏪 副業',
    gradient: 'from-emerald-900 to-emerald-700',
    labelColor: 'text-emerald-300',
    iconColor: 'text-emerald-200',
  },
  big: {
    label: '大型交易',
    icon: '🏢 併購',
    gradient: 'from-orange-900 to-orange-700',
    labelColor: 'text-orange-300',
    iconColor: 'text-orange-200',
  },
  stock: {
    label: '股票',
    icon: '📈 投機',
    gradient: 'from-blue-900 to-blue-600',
    labelColor: 'text-blue-300',
    iconColor: 'text-blue-200',
  },
};

export function DealPanel({ card, state, onBuy, onSkip }: DealPanelProps) {
  const config = typeConfig[card.type];
  const { canBuy, reason } = canBuyDeal(state, card);
  const payback = card.cashflow > 0 ? (card.cost / card.cashflow).toFixed(1) : '—';

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-200">交易機會</h2>
        <p className="text-slate-500 text-sm mt-1">一筆交易機會出現了，是否要買入？</p>
      </div>

      <div className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden mb-6">
        {/* Type header */}
        <div className={`bg-gradient-to-r ${config.gradient} px-5 py-3 flex justify-between items-center`}>
          <span className={`${config.labelColor} text-xs font-semibold tracking-widest uppercase`}>
            {config.label}
          </span>
          <span className={`${config.iconColor} text-xs`}>{config.icon}</span>
        </div>

        {/* Card body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-200 mb-2">{card.name}</h3>
          <p className="text-slate-400 text-sm mb-5 leading-relaxed">{card.description}</p>

          {/* Stats */}
          <div className="flex gap-3 mb-4">
            <div className="flex-1 bg-slate-950/60 rounded-xl p-3 text-center">
              <div className="text-slate-500 text-xs mb-1">買入成本</div>
              <div className="text-red-400 text-lg font-bold font-mono">${card.cost}萬</div>
            </div>
            <div className="flex-1 bg-slate-950/60 rounded-xl p-3 text-center">
              <div className="text-slate-500 text-xs mb-1">每季收入</div>
              <div className={`text-lg font-bold font-mono ${card.cashflow > 0 ? 'text-green-400' : 'text-slate-600'}`}>
                {card.cashflow > 0 ? `+$${card.cashflow}萬` : '$0'}
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="flex justify-between items-center text-xs">
            {card.cashflow > 0 && (
              <span className="text-slate-500">📊 {payback} 季回本</span>
            )}
            {card.arteryRequirement && (
              <span className={state.lifelines.cashPercent > card.arteryRequirement ? 'text-emerald-400' : 'text-orange-400'}>
                🔒 動脈 {'>'} {card.arteryRequirement}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        <button
          onClick={onBuy}
          disabled={!canBuy}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            canBuy
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white'
              : 'bg-slate-800 text-slate-600 cursor-not-allowed'
          }`}
        >
          {canBuy ? '💰 買入 →' : `🔒 ${reason}`}
        </button>
        <button
          onClick={onSkip}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-xl font-medium transition-all"
        >
          跳過這筆交易 →
        </button>
      </div>

      <p className="text-center text-slate-600 text-xs mt-4">
        買入後，每季結算自動產生被動收入
      </p>
    </div>
  );
}
