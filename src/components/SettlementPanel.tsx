import { SettlementStep } from '../engine/types';

interface Props {
  steps: SettlementStep[];
  onContinue: () => void;
}

export function SettlementPanel({ steps, onContinue }: Props) {
  return (
    <div className="animate-slide-up">
      <div className="text-center mb-6">
        <span className="text-3xl mb-2 block">⚙️</span>
        <h2 className="text-xl font-bold text-slate-200">季度結算</h2>
      </div>

      <div className="space-y-3 mb-6">
        {steps.map((step, i) => (
          <div key={i} className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/30">
            <h3 className="text-sm font-bold text-amber-400 mb-2">
              Step {i + 1}: {step.name}
            </h3>
            {step.changes.length === 0 ? (
              <p className="text-xs text-slate-500">無變化</p>
            ) : (
              <div className="space-y-1">
                {step.changes.map((c, j) => {
                  const delta = c.after - c.before;
                  const isPositive = delta > 0;
                  const lifelineIcons: Record<string, string> = {
                    cash: '💰', cashPercent: '💰', heartbeat: '💓', roots: '🌿',
                  };
                  return (
                    <div key={j} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{lifelineIcons[c.lifeline] || '📊'}</span>
                        <span>{c.reason}</span>
                      </div>
                      <span className={isPositive ? 'text-green-400' : 'text-red-400'}>
                        {isPositive ? '+' : ''}{Math.round(delta * 10) / 10}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={onContinue}
        className="w-full py-3 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-medium transition-all"
      >
        繼續 →
      </button>
    </div>
  );
}
