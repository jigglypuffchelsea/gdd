import { GameState } from '../engine/types';

interface Props {
  state: GameState;
  onRestart: () => void;
  onReview: () => void;
}

export function GameOverScreen({ state, onRestart, onReview }: Props) {
  const isVictory = state.phase === 'victory';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="text-center animate-slide-up max-w-lg mx-auto px-4">
        {isVictory ? (
          <>
            <div className="text-6xl mb-4">🏆</div>
            <h1 className="text-4xl font-bold text-amber-300 mb-2">恭喜存活！</h1>
            <p className="text-slate-400 mb-8">你帶領公司走過了五年的風雨</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">💀</div>
            <h1 className="text-4xl font-bold text-red-400 mb-2">公司倒閉</h1>
            <p className="text-slate-400 mb-4">{state.gameOverReason}</p>
            <p className="text-slate-500 text-sm mb-8">
              在第 {state.currentQuarter.year} 年 Q{state.currentQuarter.quarter} 結束了旅程
            </p>
          </>
        )}

        {/* Score card */}
        <div className="bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-slate-700/50 mb-8">
          <div className="text-5xl font-bold text-amber-300 mb-2">{state.score}</div>
          <div className="text-sm text-slate-400 mb-4">最終評分</div>

          {isVictory && (
            <>
              <div className="inline-flex items-center gap-2 bg-slate-700/50 rounded-full px-4 py-2 mb-4">
                <span className="text-2xl font-bold text-purple-400">{state.rating}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-300">{state.ceoStyle}</span>
              </div>
            </>
          )}

          {/* Final lifelines */}
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="text-amber-400 text-2xl font-bold">{Math.round(state.lifelines.cashPercent)}%</div>
              <div className="text-xs text-slate-500">現金動脈</div>
            </div>
            <div>
              <div className="text-red-400 text-2xl font-bold">{Math.round(state.lifelines.heartbeat)}%</div>
              <div className="text-xs text-slate-500">組織心跳</div>
            </div>
            <div>
              <div className="text-green-400 text-2xl font-bold">{Math.round(state.lifelines.roots)}%</div>
              <div className="text-xs text-slate-500">市場根系</div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="text-lg font-bold text-slate-200">{state.usedDecisionCards.length}</div>
            <div className="text-xs text-slate-500">決策牌</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="text-lg font-bold text-slate-200">{state.usedEntropyCards.length}</div>
            <div className="text-xs text-slate-500">熵事件</div>
          </div>
          <div className="bg-slate-800/40 rounded-xl p-3 border border-slate-700/30">
            <div className="text-lg font-bold text-slate-200">{state.activeFuses.length}</div>
            <div className="text-xs text-slate-500">未引爆伏筆</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={onReview}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl transition-all font-medium"
          >
            📊 覆盤回顧
          </button>
          <button
            onClick={onRestart}
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium transition-all"
          >
            🔄 再來一局
          </button>
        </div>
      </div>
    </div>
  );
}
