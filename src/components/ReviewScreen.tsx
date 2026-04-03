import { GameState } from '../engine/types';
import { getZone, getZoneColor, getZoneLabel } from '../engine/gameEngine';
import { decisionCards } from '../data/decisionCards';
import { entropyCards } from '../data/entropyCards';

interface Props {
  state: GameState;
  onBack: () => void;
}

export function ReviewScreen({ state, onBack }: Props) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-amber-300 flex items-center gap-2">
              📊 覆盤回顧
            </h1>
            <p className="text-slate-500 text-sm mt-1">回顧你的經營歷程</p>
          </div>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors"
          >
            ← 返回
          </button>
        </div>

        {/* Decision history */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            📋 決策回顧
          </h2>
          <div className="space-y-3">
            {state.usedDecisionCards.map((cardId) => {
              const card = decisionCards.find(c => c.id === cardId);
              if (!card) return null;
              return (
                <div key={cardId} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">#{card.id}</span>
                    <span className="font-medium text-slate-200">{card.name}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{card.description}</p>
                </div>
              );
            })}
            {state.usedDecisionCards.length === 0 && (
              <p className="text-slate-600 text-sm">尚無決策記錄</p>
            )}
          </div>
        </section>

        {/* Entropy history */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            ⚡ 熵事件回顧
          </h2>
          <div className="space-y-3">
            {state.usedEntropyCards.map((cardId) => {
              const card = entropyCards.find(c => c.id === cardId);
              if (!card) return null;
              return (
                <div key={cardId} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">{card.id}</span>
                    <span className={`text-xs ${
                      card.difficulty === 'heavy' ? 'text-red-400' :
                      card.difficulty === 'medium' ? 'text-amber-400' : 'text-blue-400'
                    }`}>{card.difficulty === 'heavy' ? '重度' : card.difficulty === 'medium' ? '中度' : '輕度'}</span>
                    <span className="font-medium text-slate-200">{card.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Active fuses */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            💣 伏筆狀態
          </h2>
          {state.activeFuses.length > 0 ? (
            <div className="space-y-2">
              {state.activeFuses.map((fuse) => (
                <div key={fuse.id} className="bg-slate-800/40 rounded-xl p-3 border border-red-900/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">{fuse.description}</span>
                    <span className="text-xs text-red-400">
                      預計 Q{Math.floor(fuse.detonateAt / 4) + 1}Y{(fuse.detonateAt % 4) + 1} 引爆
                    </span>
                  </div>
                  {fuse.isRandom && (
                    <span className="text-xs text-purple-400">🎲 隨機結果 · {Math.round((fuse.successRate || 0.5) * 100)}% 成功率</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">所有伏筆已引爆或已消散</p>
          )}
        </section>

        {/* Persistent effects */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-slate-300 mb-4 flex items-center gap-2">
            🔄 持續效果
          </h2>
          {state.persistentEffects.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {state.persistentEffects.map((pe, i) => (
                <div key={i} className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/30 text-xs">
                  <div className="text-slate-300 mb-1">{pe.description}</div>
                  <div className={pe.value > 0 ? 'text-green-400' : 'text-red-400'}>
                    {pe.type === 'income' || pe.type === 'expense' ? '💰' : pe.type === 'heartbeat' ? '💓' : '🌿'}
                    {' '}{pe.value > 0 ? '+' : ''}{pe.value} / 季
                    {pe.remainingQuarters > 0 && ` (剩 ${pe.remainingQuarters} 季)`}
                    {pe.remainingQuarters === -1 && ' (永久)'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-600 text-sm">無持續效果</p>
          )}
        </section>

        {/* Final state summary */}
        <section className="bg-gradient-to-r from-slate-800/60 to-slate-800/30 rounded-2xl p-6 border border-slate-700/30">
          <h2 className="text-lg font-bold text-slate-300 mb-4">📈 最終狀態</h2>
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { label: '現金動脈', value: state.lifelines.cashPercent, icon: '💰' },
              { label: '組織心跳', value: state.lifelines.heartbeat, icon: '💓' },
              { label: '市場根系', value: state.lifelines.roots, icon: '🌿' },
            ].map((ll) => {
              const zone = getZone(ll.value);
              const color = getZoneColor(zone);
              return (
                <div key={ll.label}>
                  <div className="text-3xl mb-1">{ll.icon}</div>
                  <div className="text-3xl font-bold" style={{ color }}>{Math.round(ll.value)}%</div>
                  <div className="text-xs mt-1" style={{ color }}>{getZoneLabel(zone)}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{ll.label}</div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-700/30 grid grid-cols-2 gap-4 text-center text-sm">
            <div>
              <div className="text-amber-300 font-bold text-xl">${state.financials.cash}萬</div>
              <div className="text-slate-500 text-xs">剩餘現金</div>
            </div>
            <div>
              <div className="text-slate-300 font-bold text-xl">
                +${state.financials.quarterlyIncome - state.financials.quarterlyExpense}萬/季
              </div>
              <div className="text-slate-500 text-xs">季淨額</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
