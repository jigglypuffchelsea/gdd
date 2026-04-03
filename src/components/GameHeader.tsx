import { QuarterInfo, Financials } from '../engine/types';

interface Props {
  quarter: QuarterInfo;
  financials: Financials;
  fusesCount: number;
}

export function GameHeader({ quarter, financials, fusesCount }: Props) {
  return (
    <div className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-700/50 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        {/* Left: Quarter info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 text-lg">🏢</span>
            <span className="text-slate-300 font-bold">第 {quarter.year} 年</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Q{quarter.quarter}</span>
          </div>
          <div className={`px-2 py-0.5 rounded text-xs font-medium ${
            quarter.type === 'decision'
              ? 'bg-amber-900/40 text-amber-400 border border-amber-800/50'
              : 'bg-blue-900/40 text-blue-400 border border-blue-800/50'
          }`}>
            {quarter.type === 'decision' ? '📋 決策季' : '⚙️ 營運季'}
          </div>
        </div>

        {/* Center: Timeline */}
        <div className="hidden md:flex items-center gap-0.5">
          {Array.from({ length: 20 }, (_, i) => (
            <div
              key={i}
              className={`w-3 h-2 rounded-sm transition-all ${
                i < quarter.index
                  ? 'bg-amber-500'
                  : i === quarter.index
                    ? 'bg-amber-400 animate-pulse-glow'
                    : 'bg-slate-700'
              }`}
              title={`Y${Math.floor(i/4)+1} Q${(i%4)+1}`}
            />
          ))}
        </div>

        {/* Right: Quick stats */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span>💰</span>
            <span className="text-amber-300 font-mono">${financials.cash}萬</span>
          </div>
          {financials.accountsReceivable > 0 && (
            <div className="flex items-center gap-1 text-slate-500">
              <span>📄</span>
              <span className="font-mono">AR ${financials.accountsReceivable}萬</span>
            </div>
          )}
          {fusesCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="animate-pulse-glow">💣</span>
              <span className="text-red-400 font-mono text-xs">{fusesCount}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
