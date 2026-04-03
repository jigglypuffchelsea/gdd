import { GameState } from '../engine/types';
import { calcNetWorth } from '../engine/gameEngine';
import { MiniChart } from './MiniChart';

interface FinancialDashboardProps {
  state: GameState;
  onClose: () => void;
}

export function FinancialDashboard({ state, onClose }: FinancialDashboardProps) {
  const netWorth = calcNetWorth(state);

  // Build chart data from quarter logs
  const cashHistory = state.quarterLogs.map(log => Math.round(log.endState.financials.cash));
  const netWorthHistory = state.netWorthHistory.map(v => Math.round(v));

  // Align lengths (both should correspond to completed quarters)
  const len = Math.min(cashHistory.length, netWorthHistory.length);
  const labels = state.quarterLogs.slice(0, len).map(log =>
    `Y${log.quarter.year}Q${log.quarter.quarter}`
  );

  // Income breakdown
  const baseIncome = state.financials.quarterlyIncome;
  const persistentIncome = state.persistentEffects
    .filter(pe => pe.type === 'income')
    .reduce((sum, pe) => sum + pe.value, 0);
  const passiveIncome = state.assets.reduce((sum, a) => sum + a.cashflow, 0);
  const totalIncome = baseIncome + persistentIncome + passiveIncome;

  // Expense breakdown
  const baseExpense = state.financials.quarterlyExpense;
  const persistentExpense = state.persistentEffects
    .filter(pe => pe.type === 'expense')
    .reduce((sum, pe) => sum + pe.value, 0);
  const totalExpense = baseExpense + persistentExpense;

  // Stock portfolio
  const stockValue = state.stocks.reduce((sum, s) => sum + (state.marketPrices[s.dealCardId] || 0), 0);
  const stockCost = state.stocks.reduce((sum, s) => sum + s.purchasePrice, 0);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-slate-700/50 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-200">📊 財務報表</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-2xl leading-none">&times;</button>
        </div>

        {/* Net worth highlight */}
        <div className="bg-gradient-to-r from-amber-900/30 to-amber-800/20 border border-amber-700/30 rounded-xl p-4 mb-6 text-center">
          <div className="text-xs text-amber-400/70 uppercase tracking-wider mb-1">淨資產</div>
          <div className="text-3xl font-bold font-mono text-amber-300">${netWorth}萬</div>
        </div>

        {/* Chart */}
        <div className="mb-6">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">歷史趨勢</h3>
          <div className="bg-slate-950/60 rounded-xl p-4">
            <MiniChart
              lines={[
                { label: '現金', color: '#60a5fa', data: cashHistory.slice(0, len) },
                { label: '淨資產', color: '#fbbf24', data: netWorthHistory.slice(0, len) },
              ]}
              labels={labels}
            />
          </div>
        </div>

        {/* Income / Expense breakdown */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/60 rounded-xl p-4">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">季收入</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">基礎收入</span>
                <span className="text-green-400 font-mono">${baseIncome}萬</span>
              </div>
              {persistentIncome > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">持續效果</span>
                  <span className="text-green-400 font-mono">+${persistentIncome}萬</span>
                </div>
              )}
              {passiveIncome > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">被動收入</span>
                  <span className="text-emerald-400 font-mono">+${passiveIncome}萬</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-300 font-medium">總收入</span>
                <span className="text-green-400 font-mono font-bold">${totalIncome}萬</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-xl p-4">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">季支出</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">基礎支出</span>
                <span className="text-red-400 font-mono">${baseExpense}萬</span>
              </div>
              {persistentExpense > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">持續效果</span>
                  <span className="text-red-400 font-mono">+${persistentExpense}萬</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-300 font-medium">總支出</span>
                <span className="text-red-400 font-mono font-bold">${totalExpense}萬</span>
              </div>
            </div>
          </div>
        </div>

        {/* Assets */}
        {state.assets.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">📦 資產明細</h3>
            <div className="bg-slate-950/60 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-800/50">
                    <th className="text-left p-3">名稱</th>
                    <th className="text-right p-3">成本</th>
                    <th className="text-right p-3">每季收入</th>
                    <th className="text-right p-3">持有</th>
                  </tr>
                </thead>
                <tbody>
                  {state.assets.map(asset => (
                    <tr key={asset.id} className="border-b border-slate-800/30">
                      <td className="p-3 text-slate-300">
                        {asset.type === 'big' ? '🏢' : '🏪'} {asset.name}
                      </td>
                      <td className="p-3 text-right text-slate-400 font-mono">${asset.cost}萬</td>
                      <td className="p-3 text-right text-green-400 font-mono">+${asset.cashflow}萬</td>
                      <td className="p-3 text-right text-slate-500">
                        {state.currentQuarter.index - asset.acquiredAt}季
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stocks */}
        {state.stocks.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">📈 持股明細</h3>
            <div className="bg-slate-950/60 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-800/50">
                    <th className="text-left p-3">名稱</th>
                    <th className="text-right p-3">買入價</th>
                    <th className="text-right p-3">現價</th>
                    <th className="text-right p-3">損益</th>
                  </tr>
                </thead>
                <tbody>
                  {state.stocks.map(stock => {
                    const currentPrice = state.marketPrices[stock.dealCardId] || 0;
                    const pnl = currentPrice - stock.purchasePrice;
                    const pnlPct = stock.purchasePrice > 0 ? ((pnl / stock.purchasePrice) * 100).toFixed(1) : '0';
                    return (
                      <tr key={stock.id} className="border-b border-slate-800/30">
                        <td className="p-3 text-slate-300">📈 {stock.name}</td>
                        <td className="p-3 text-right text-slate-400 font-mono">${stock.purchasePrice}萬</td>
                        <td className="p-3 text-right text-slate-200 font-mono">${currentPrice}萬</td>
                        <td className={`p-3 text-right font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnl >= 0 ? '+' : ''}{pnl}萬 ({pnl >= 0 ? '+' : ''}{pnlPct}%)
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex justify-between px-3 py-2 text-xs border-t border-slate-800/50">
                <span className="text-slate-500">持股市值</span>
                <span className={`font-mono font-bold ${stockValue - stockCost >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${stockValue}萬 ({stockValue - stockCost >= 0 ? '+' : ''}{stockValue - stockCost}萬)
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium transition-all"
        >
          關閉
        </button>
      </div>
    </div>
  );
}
