import { useState } from 'react';
import { Prediction } from '../engine/types';

interface Props {
  onSubmit: (prediction: Prediction) => void;
}

type Direction = 'up' | 'neutral' | 'down' | 'unknown';

const directionOptions: { value: Direction; label: string; icon: string }[] = [
  { value: 'up', label: '上升', icon: '📈' },
  { value: 'neutral', label: '持平', icon: '➡️' },
  { value: 'down', label: '下降', icon: '📉' },
];

export function PredictionPanel({ onSubmit }: Props) {
  const [cash, setCash] = useState<Direction>('unknown');
  const [heartbeat, setHeartbeat] = useState<Direction>('unknown');
  const [roots, setRoots] = useState<Direction>('unknown');

  const lifelines = [
    { key: 'cash' as const, label: '現金動脈', icon: '💰', value: cash, setter: setCash },
    { key: 'heartbeat' as const, label: '組織心跳', icon: '💓', value: heartbeat, setter: setHeartbeat },
    { key: 'roots' as const, label: '市場根系', icon: '🌿', value: roots, setter: setRoots },
  ];

  const allSelected = cash !== 'unknown' && heartbeat !== 'unknown' && roots !== 'unknown';

  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <span className="text-3xl mb-2 block">🔮</span>
        <h2 className="text-xl font-bold text-slate-200">CEO 預測</h2>
        <p className="text-slate-500 text-sm mt-1">
          預測本季結算後各生命線的變化方向。準確預測可獲得額外分數。
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {lifelines.map((ll) => (
          <div key={ll.key} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <div className="flex items-center gap-2 mb-3">
              <span>{ll.icon}</span>
              <span className="font-medium text-slate-300">{ll.label}</span>
            </div>
            <div className="flex gap-2">
              {directionOptions.map((dir) => (
                <button
                  key={dir.value}
                  onClick={() => ll.setter(dir.value)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all border ${
                    ll.value === dir.value
                      ? dir.value === 'up'
                        ? 'bg-green-900/40 border-green-600 text-green-400'
                        : dir.value === 'down'
                          ? 'bg-red-900/40 border-red-600 text-red-400'
                          : 'bg-blue-900/40 border-blue-600 text-blue-400'
                      : 'bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-500'
                  }`}
                >
                  {dir.icon} {dir.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSubmit({ cash, heartbeat, roots })}
        className={`w-full py-3 rounded-xl font-medium transition-all ${
          allSelected
            ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white'
            : 'bg-slate-700 text-slate-400'
        }`}
      >
        {allSelected ? '提交預測 →' : '請選擇所有方向'}
      </button>

      <button
        onClick={() => onSubmit({ cash: 'unknown', heartbeat: 'unknown', roots: 'unknown' })}
        className="w-full py-2 mt-2 text-slate-500 hover:text-slate-400 text-sm transition-colors"
      >
        跳過預測
      </button>
    </div>
  );
}
