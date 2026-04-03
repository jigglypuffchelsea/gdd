import { GameState } from '../engine/types';
import { stockDealCards } from '../data/dealCards';

interface MarketPanelProps {
  state: GameState;
  onBuyStock: (dealCardId: string) => void;
  onSellStock: (holdingId: string) => void;
  onFinish: () => void;
}

export function MarketPanel({ state, onBuyStock, onSellStock, onFinish }: MarketPanelProps) {
  const { marketPrices, marketPriceHistory, stocks, marketTradesThisQuarter } = state;

  // Previous prices for showing change
  const prevPrices = marketPriceHistory.length >= 2
    ? marketPriceHistory[marketPriceHistory.length - 2]
    : null;

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-200">📈 股票市場</h2>
        <p className="text-slate-500 text-sm mt-1">查看行情，買入或賣出股票（每季各限 1 次）</p>
      </div>

      <div className="space-y-4 mb-6">
        {stockDealCards.map((card) => {
          const price = marketPrices[card.id] || 0;
          const prevPrice = prevPrices ? prevPrices[card.id] : (card.marketValue || 0);
          const diff = price - prevPrice;
          const pctChange = prevPrice > 0 ? ((diff / prevPrice) * 100).toFixed(1) : '0.0';
          const holdings = stocks.filter(s => s.dealCardId === card.id);
          const canBuy = !marketTradesThisQuarter.bought && state.financials.cash >= price;
          const canSell = !marketTradesThisQuarter.sold && holdings.length > 0;

          return (
            <div key={card.id} className="bg-slate-900/80 border border-slate-700/50 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-5 py-3 flex justify-between items-center">
                <span className="text-blue-200 text-xs font-semibold tracking-widest uppercase">
                  {card.volatility === 'high' ? '高波動' : '低波動'}
                </span>
                <span className={`text-sm font-bold font-mono ${diff > 0 ? 'text-green-300' : diff < 0 ? 'text-red-300' : 'text-slate-300'}`}>
                  {diff > 0 ? '▲' : diff < 0 ? '▼' : '—'} {diff > 0 ? '+' : ''}{pctChange}%
                </span>
              </div>

              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-slate-200">{card.name}</h3>
                  <div className="text-right">
                    <div className="text-2xl font-bold font-mono text-slate-100">${price}萬</div>
                    <div className="text-xs text-slate-500">當前市價</div>
                  </div>
                </div>

                <p className="text-slate-400 text-sm mb-4">{card.description}</p>

                {/* Holdings info */}
                {holdings.length > 0 && (
                  <div className="bg-slate-950/60 rounded-xl p-3 mb-4">
                    <div className="text-xs text-slate-500 mb-1">持有 {holdings.length} 股</div>
                    {holdings.map(h => {
                      const pnl = price - h.purchasePrice;
                      const pnlPct = h.purchasePrice > 0 ? ((pnl / h.purchasePrice) * 100).toFixed(1) : '0';
                      return (
                        <div key={h.id} className="flex justify-between text-sm">
                          <span className="text-slate-400">買入 ${h.purchasePrice}萬</span>
                          <span className={`font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}{pnl}萬 ({pnl >= 0 ? '+' : ''}{pnlPct}%)
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onBuyStock(card.id)}
                    disabled={!canBuy}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      canBuy
                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {marketTradesThisQuarter.bought ? '已買入' : `買入 $${price}萬`}
                  </button>
                  <button
                    onClick={() => canSell && onSellStock(holdings[0].id)}
                    disabled={!canSell}
                    className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                      canSell
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white'
                        : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    {marketTradesThisQuarter.sold ? '已賣出' : holdings.length > 0 ? `賣出 $${price}萬` : '未持有'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={onFinish}
        className="w-full py-3 bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 text-white rounded-xl font-medium transition-all"
      >
        完成股市操作 →
      </button>
    </div>
  );
}
