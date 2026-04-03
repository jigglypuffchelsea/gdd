import { useState } from 'react';
import { DecisionCard, CardOption, GameState } from '../engine/types';
import { isOptionLocked, canAfford } from '../engine/gameEngine';

interface SelectProps {
  cards: DecisionCard[];
  onSelect: (card: DecisionCard) => void;
}

export function CardSelectPanel({ cards, onSelect }: SelectProps) {
  return (
    <div className="animate-slide-up">
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold text-slate-200">📋 選擇一張決策牌</h2>
        <p className="text-slate-500 text-sm mt-1">抽到 {cards.length} 張牌，選擇一張面對</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const typeLabel = card.type === 'event' ? '事件' : card.type === 'crisis' ? '危機' : '慢性';
          const typeColor = card.type === 'event' ? 'text-blue-400' : card.type === 'crisis' ? 'text-red-400' : 'text-amber-400';

          return (
            <button
              key={card.id}
              onClick={() => onSelect(card)}
              className="text-left p-5 rounded-xl border border-slate-600/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-amber-500/50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">#{card.id}</span>
                <span className={`text-xs ${typeColor}`}>{typeLabel}</span>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2 group-hover:text-amber-300 transition-colors">{card.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed line-clamp-3">{card.description}</p>
              {card.sideOption && (
                <div className="mt-2 text-xs text-purple-400">🔀 含附加決策</div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DecisionProps {
  card: DecisionCard;
  state: GameState;
  onDecide: (option: CardOption, side?: CardOption | null) => void;
  onForceSkip: () => void;
}

export function DecisionPanel({ card, state, onDecide, onForceSkip }: DecisionProps) {
  const [selectedSide, setSelectedSide] = useState(false);
  const typeLabel = card.type === 'event' ? '事件' : card.type === 'crisis' ? '危機' : '慢性';

  // Check if ALL options are locked/unaffordable
  const allLocked = card.options.every((option) => {
    const lock = isOptionLocked(option, state.lifelines);
    const cost = Math.abs(option.immediate.cash || 0);
    const affordable = cost === 0 || canAfford(state, cost);
    return lock.locked || !affordable;
  });

  return (
    <div className="animate-slide-up">
      {/* Card header */}
      <div className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 rounded-xl p-5 mb-4 border border-slate-700/50">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded">#{card.id}</span>
          <span className="text-xs text-amber-400">{typeLabel}</span>
          {card.type === 'chronic' && <span className="text-xs text-orange-400">⚠️ 觀察 = 惡化</span>}
        </div>
        <h2 className="text-2xl font-bold text-slate-100 mb-2">{card.name}</h2>
        <p className="text-sm text-slate-400 leading-relaxed">{card.description}</p>
      </div>

      {/* Side option (for crisis cards) */}
      {card.sideOption && (
        <div className="mb-4 p-3 rounded-xl border border-purple-800/40 bg-purple-950/20">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedSide}
              onChange={(e) => setSelectedSide(e.target.checked)}
              className="w-4 h-4 rounded border-purple-600 text-purple-500 focus:ring-purple-500"
            />
            <div>
              <span className="text-sm font-medium text-purple-300">🔀 {card.sideOption.label}</span>
              <p className="text-xs text-slate-500 mt-0.5">{card.sideOption.description}</p>
              {card.sideOption.immediate.cash && (
                <span className="text-xs text-amber-400">💰 {card.sideOption.immediate.cash}萬</span>
              )}
            </div>
          </label>
        </div>
      )}

      {/* Main options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {card.options.map((option) => {
          const lock = isOptionLocked(option, state.lifelines);
          const cost = Math.abs(option.immediate.cash || 0);
          const affordable = cost === 0 || canAfford(state, cost);
          const disabled = lock.locked || !affordable;

          return (
            <button
              key={option.id}
              onClick={() => !disabled && onDecide(option, selectedSide ? card.sideOption : null)}
              disabled={disabled}
              className={`text-left p-5 rounded-xl border transition-all ${
                disabled
                  ? 'border-slate-700/30 bg-slate-800/20 opacity-50 cursor-not-allowed'
                  : 'border-slate-600/50 bg-slate-800/40 hover:bg-slate-700/60 hover:border-amber-500/50 cursor-pointer'
              }`}
            >
              <h3 className="font-bold text-slate-100 mb-2">{option.label}</h3>
              <p className="text-sm text-slate-400 mb-3">{option.description}</p>

              {/* Effects */}
              <div className="flex flex-wrap gap-2 text-xs mb-2">
                {option.immediate.cash && (
                  <span className={`px-2 py-0.5 rounded ${option.immediate.cash < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                    💰 {option.immediate.cash > 0 ? '+' : ''}{option.immediate.cash}萬
                  </span>
                )}
                {option.immediate.heartbeat && (
                  <span className={`px-2 py-0.5 rounded ${option.immediate.heartbeat < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                    💓 {option.immediate.heartbeat > 0 ? '+' : ''}{option.immediate.heartbeat}
                  </span>
                )}
                {option.immediate.roots && (
                  <span className={`px-2 py-0.5 rounded ${option.immediate.roots < 0 ? 'bg-red-900/40 text-red-400' : 'bg-green-900/40 text-green-400'}`}>
                    🌿 {option.immediate.roots > 0 ? '+' : ''}{option.immediate.roots}
                  </span>
                )}
                {option.immediate.ar && (
                  <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-400">
                    📄 AR +${option.immediate.ar}萬
                  </span>
                )}
              </div>

              {/* Fuse indicator */}
              {option.fuse && (
                <div className="text-xs text-purple-400 mt-1">
                  💣 伏筆：{option.fuse.detonateAt} 季後引爆
                  {option.fuse.isRandom && ` · ${Math.round((option.fuse.successRate || 0.5) * 100)}% 成功率`}
                </div>
              )}

              {/* Lock reason */}
              {lock.locked && (
                <div className="text-xs text-red-500 mt-2">🔒 {lock.reason}</div>
              )}
              {!affordable && !lock.locked && (
                <div className="text-xs text-red-500 mt-2">⚠️ 現金不足</div>
              )}
            </button>
          );
        })}
      </div>

      {/* Forced skip when all options are locked */}
      {allLocked && (
        <div className="mt-5 p-4 rounded-xl border border-orange-900/50 bg-orange-950/20">
          <p className="text-sm text-orange-300 mb-3">
            ⚠️ 所有選項都無法執行。你只能被迫放棄這次決策，心跳和根系將各 -2。
          </p>
          <button
            onClick={onForceSkip}
            className="w-full py-3 bg-gradient-to-r from-orange-800 to-orange-700 hover:from-orange-700 hover:to-orange-600 text-white rounded-xl font-medium transition-all"
          >
            被迫放棄 →
          </button>
        </div>
      )}
    </div>
  );
}
