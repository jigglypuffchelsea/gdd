import { GameState, ExpenseCard } from '../engine/types';

interface ExpensePanelProps {
  card: ExpenseCard;
  state: GameState;
  onPay: () => void;
}

const tierConfig = {
  small: {
    label: '小意外',
    icon: '⚡',
    gradient: 'from-red-900/80 to-red-800/60',
    labelColor: 'text-red-300',
  },
  medium: {
    label: '中意外',
    icon: '⚡⚡',
    gradient: 'from-red-900 to-red-700',
    labelColor: 'text-red-200',
  },
  large: {
    label: '大意外',
    icon: '⚡⚡⚡',
    gradient: 'from-red-950 to-red-800',
    labelColor: 'text-red-100',
  },
};

export function ExpensePanel({ card, state, onPay }: ExpensePanelProps) {
  const config = tierConfig[card.tier];
  const canPayFull = state.financials.cash >= card.cost;

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <div className="text-4xl mb-2">🚨</div>
        <h2 className="text-xl font-bold text-red-300">意外支出</h2>
        <p className="text-slate-500 text-sm mt-1">一筆意外支出突然出現，必須立即處理！</p>
      </div>

      <div className="bg-slate-900/80 border border-red-900/50 rounded-2xl overflow-hidden mb-6">
        {/* Tier header */}
        <div className={`bg-gradient-to-r ${config.gradient} px-5 py-3 flex justify-between items-center`}>
          <span className={`${config.labelColor} text-xs font-semibold tracking-widest uppercase`}>
            {config.label}
          </span>
          <span className="text-red-200 text-sm">{config.icon}</span>
        </div>

        {/* Card body */}
        <div className="p-5">
          <h3 className="text-lg font-bold text-slate-200 mb-2">{card.name}</h3>
          <p className="text-slate-400 text-sm mb-5 leading-relaxed">{card.description}</p>

          {/* Cost display */}
          <div className="bg-red-950/40 border border-red-900/30 rounded-xl p-4 text-center">
            <div className="text-slate-500 text-xs mb-1">需要支付</div>
            <div className="text-red-400 text-3xl font-bold font-mono">-${card.cost}萬</div>
            {!canPayFull && (
              <div className="text-orange-400 text-xs mt-2">
                現金不足！現有 ${state.financials.cash}萬，將扣至 $0
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pay button */}
      <button
        onClick={onPay}
        className="w-full py-3 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white rounded-xl font-medium transition-all"
      >
        {canPayFull
          ? `支付 $${card.cost}萬 →`
          : `支付 $${card.cost}萬（將扣至 $0）→`
        }
      </button>

      <p className="text-center text-slate-600 text-xs mt-4">
        動脈越低，意外支出越容易發生
      </p>
    </div>
  );
}
