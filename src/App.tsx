import { useState } from 'react';
import { useGame } from './hooks/useGame';
import { TitleScreen } from './components/TitleScreen';
import { GameHeader } from './components/GameHeader';
import { LifelineBar } from './components/LifelineBar';
import { InvestmentPanel } from './components/InvestmentPanel';
import { EntropyPanel } from './components/EntropyPanel';
import { CardSelectPanel, DecisionPanel } from './components/DecisionPanel';
import { OpportunityPanel } from './components/OpportunityPanel';
import { PredictionPanel } from './components/PredictionPanel';
import { SettlementPanel } from './components/SettlementPanel';
import { GameOverScreen } from './components/GameOverScreen';
import { ReviewScreen } from './components/ReviewScreen';
import { DealPanel } from './components/DealPanel';
import { MarketPanel } from './components/MarketPanel';
import { ExpensePanel } from './components/ExpensePanel';
import { FinancialDashboard } from './components/FinancialDashboard';
import { calcNetWorth } from './engine/gameEngine';

function App() {
  const game = useGame();
  const { state } = game;
  const [showDashboard, setShowDashboard] = useState(false);

  // Title screen
  if (state.phase === 'title') {
    return <TitleScreen onStart={game.beginGame} />;
  }

  // Game over / victory
  if (state.phase === 'gameOver' || state.phase === 'victory') {
    return (
      <GameOverScreen
        state={state}
        onRestart={game.newGame}
        onReview={game.goToReview}
      />
    );
  }

  // Review
  if (state.phase === 'review') {
    return (
      <ReviewScreen
        state={state}
        onBack={() => game.newGame()}
      />
    );
  }

  // Main game loop
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <GameHeader
        quarter={state.currentQuarter}
        financials={state.financials}
        fusesCount={state.activeFuses.length}
      />

      <div className="flex-1 flex">
        {/* Left sidebar: Lifelines */}
        <aside className="w-72 bg-slate-900/50 border-r border-slate-800/50 p-4 shrink-0 hidden lg:block">
          <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-4 font-medium">生命線</h3>

          <LifelineBar
            label="現金動脈"
            icon="💰"
            value={state.lifelines.cashPercent}
            subLabel={`$${state.financials.cash}萬`}
          />
          <LifelineBar
            label="組織心跳"
            icon="💓"
            value={state.lifelines.heartbeat}
          />
          <LifelineBar
            label="市場根系"
            icon="🌿"
            value={state.lifelines.roots}
          />

          {/* Financial summary */}
          <div className="mt-6 pt-4 border-t border-slate-800/50">
            <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">財務摘要</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">季收入</span>
                <span className="text-green-400 font-mono">${state.financials.quarterlyIncome}萬</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">季支出</span>
                <span className="text-red-400 font-mono">${state.financials.quarterlyExpense}萬</span>
              </div>
              {state.assets.reduce((s, a) => s + a.cashflow, 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">被動收入</span>
                  <span className="text-emerald-400 font-mono">+${state.assets.reduce((s, a) => s + a.cashflow, 0)}萬</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800/50 pt-2">
                <span className="text-slate-400">季淨額</span>
                <span className={`font-mono font-bold ${
                  state.financials.quarterlyIncome - state.financials.quarterlyExpense >= 0
                    ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${state.financials.quarterlyIncome - state.financials.quarterlyExpense}萬
                </span>
              </div>
              {state.financials.accountsReceivable > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-500">應收帳款</span>
                  <span className="text-slate-400 font-mono">${state.financials.accountsReceivable}萬</span>
                </div>
              )}
              <div className="flex justify-between items-center border-t border-slate-800/50 pt-2">
                <span className="text-amber-400/80">淨資產</span>
                <div className="flex items-center gap-2">
                  <span className="text-amber-300 font-mono font-bold">${calcNetWorth(state)}萬</span>
                  <button
                    onClick={() => setShowDashboard(true)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 px-2 py-0.5 rounded transition-colors"
                  >
                    📊
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active fuses */}
          {state.activeFuses.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/50">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium flex items-center gap-1">
                💣 伏筆 ({state.activeFuses.length})
              </h3>
              <div className="space-y-2">
                {state.activeFuses.map((fuse) => {
                  const remainQ = fuse.detonateAt - state.currentQuarter.index;
                  return (
                    <div key={fuse.id} className="bg-red-950/20 border border-red-900/30 rounded-lg p-2 text-xs">
                      <div className="text-slate-400 line-clamp-1">{fuse.description}</div>
                      <div className="text-red-400 mt-0.5">
                        {remainQ > 0 ? `${remainQ} 季後引爆` : '即將引爆！'}
                        {fuse.isRandom && ' 🎲'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Assets */}
          {state.assets.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/50">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
                📦 持有資產 ({state.assets.length})
              </h3>
              <div className="space-y-1">
                {state.assets.map((asset) => (
                  <div key={asset.id} className="text-xs flex items-center justify-between">
                    <span className="text-slate-500 truncate flex-1">
                      {asset.type === 'big' ? '🏢' : '🏪'} {asset.name}
                    </span>
                    <span className="text-green-400 font-mono">+${asset.cashflow}萬/季</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/30 text-xs flex justify-between">
                <span className="text-slate-500">被動收入合計</span>
                <span className="text-green-400 font-mono font-bold">
                  +${state.assets.reduce((sum, a) => sum + a.cashflow, 0)}萬/季
                </span>
              </div>
            </div>
          )}

          {/* Stocks */}
          {state.stocks.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/50">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
                📈 持股 ({state.stocks.length})
              </h3>
              <div className="space-y-1">
                {state.stocks.map((stock) => {
                  const currentPrice = state.marketPrices[stock.dealCardId] || 0;
                  const pnl = currentPrice - stock.purchasePrice;
                  return (
                    <div key={stock.id} className="text-xs flex items-center justify-between">
                      <span className="text-slate-500 truncate flex-1">📈 {stock.name}</span>
                      <span className={`font-mono ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        ${currentPrice}萬
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Persistent effects */}
          {state.persistentEffects.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-800/50">
              <h3 className="text-xs text-slate-500 uppercase tracking-wider mb-3 font-medium">
                🔄 持續效果
              </h3>
              <div className="space-y-1">
                {state.persistentEffects.map((pe, i) => (
                  <div key={i} className="text-xs flex items-center justify-between">
                    <span className="text-slate-500 truncate flex-1">{pe.description}</span>
                    <span className={pe.value > 0 && (pe.type === 'income' || pe.type === 'heartbeat' || pe.type === 'roots') ? 'text-green-400' : 'text-red-400'}>
                      {pe.type === 'expense' ? `-$${pe.value}萬` : pe.type === 'income' ? `+$${pe.value}萬` : `${pe.value > 0 ? '+' : ''}${pe.value}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            {/* Mobile lifeline summary */}
            <div className="lg:hidden mb-4">
              <LifelineBar label="動脈" icon="💰" value={state.lifelines.cashPercent} subLabel={`$${state.financials.cash}萬`} />
              <LifelineBar label="心跳" icon="💓" value={state.lifelines.heartbeat} />
              <LifelineBar label="根系" icon="🌿" value={state.lifelines.roots} />
            </div>

            {/* Phase content */}
            {state.phase === 'expense' && state.currentExpenseCard && (
              <ExpensePanel
                card={state.currentExpenseCard}
                state={state}
                onPay={game.doPayExpense}
              />
            )}

            {state.phase === 'investment' && (
              <InvestmentPanel
                state={state}
                investments={game.investmentOptions}
                onInvest={game.doInvestment}
                onFinish={game.finishInvestment}
              />
            )}

            {state.phase === 'entropy' && state.currentEntropyCard && (
              <EntropyPanel
                card={state.currentEntropyCard}
                state={state}
                onChoice={game.doEntropy}
              />
            )}

            {state.phase === 'decision' && state.currentDecisionCards && (
              <CardSelectPanel
                cards={state.currentDecisionCards}
                onSelect={(card) => {
                  game.doSelectCard(card);
                }}
              />
            )}

            {state.phase === 'decision' && state.selectedDecisionCard && (
              <DecisionPanel
                card={state.selectedDecisionCard}
                state={state}
                onDecide={game.doDecision}
                onForceSkip={game.doForceSkipDecision}
              />
            )}

            {state.phase === 'opportunity' && state.currentOpportunityCard && (
              <OpportunityPanel
                card={state.currentOpportunityCard}
                state={state}
                onAccept={game.doOpportunity}
              />
            )}

            {state.phase === 'prediction' && (
              <PredictionPanel onSubmit={game.doPrediction} />
            )}

            {state.phase === 'settlement' && (
              <SettlementWrap
                onRun={game.doSettlement}
              />
            )}

            {state.phase === 'attribution' && (
              <SettlementPanel
                steps={game.settlementSteps}
                onContinue={game.doAdvance}
              />
            )}

            {state.phase === 'market' && (
              <MarketPanel
                state={state}
                onBuyStock={game.doBuyStock}
                onSellStock={game.doSellStock}
                onFinish={game.doFinishMarket}
              />
            )}

            {state.phase === 'deal' && state.currentDealCard && (
              <DealPanel
                card={state.currentDealCard}
                state={state}
                onBuy={game.doBuyDeal}
                onSkip={game.doSkipDeal}
              />
            )}
          </div>
        </main>
      </div>

      {/* Financial Dashboard overlay */}
      {showDashboard && (
        <FinancialDashboard state={state} onClose={() => setShowDashboard(false)} />
      )}
    </div>
  );
}

// Wrapper to auto-trigger settlement
function SettlementWrap({ onRun }: { onRun: () => void }) {
  // Auto-run settlement on mount
  import('react').then(({ useEffect }) => {});

  return (
    <div className="text-center animate-slide-up">
      <div className="text-4xl mb-4">⚙️</div>
      <h2 className="text-xl font-bold text-slate-200 mb-4">準備結算本季</h2>
      <p className="text-slate-500 text-sm mb-6">
        系統將依序結算：基礎營收 → 持續效果 → 伏筆引爆 → 飛輪/螺旋 → 自然熵增
      </p>
      <button
        onClick={onRun}
        className="px-8 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium transition-all"
      >
        開始結算 →
      </button>
    </div>
  );
}

export default App;
