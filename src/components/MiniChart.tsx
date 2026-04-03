import { useState } from 'react';

interface ChartLine {
  label: string;
  color: string;
  data: number[];
}

interface MiniChartProps {
  lines: ChartLine[];
  labels: string[];  // x-axis labels per data point
}

export function MiniChart({ lines, labels }: MiniChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  if (lines.length === 0 || lines[0].data.length === 0) {
    return <div className="text-slate-600 text-sm text-center py-8">尚無歷史資料</div>;
  }

  const W = 560, H = 200, PX = 40, PY = 20;
  const plotW = W - PX * 2, plotH = H - PY * 2;
  const allValues = lines.flatMap(l => l.data);
  const minV = Math.min(...allValues, 0);
  const maxV = Math.max(...allValues, 1);
  const range = maxV - minV || 1;
  const dataLen = lines[0].data.length;

  const toX = (i: number) => PX + (dataLen > 1 ? (i / (dataLen - 1)) * plotW : plotW / 2);
  const toY = (v: number) => PY + plotH - ((v - minV) / range) * plotH;

  const pathFor = (data: number[]) =>
    data.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ');

  // Y-axis ticks (5 ticks)
  const yTicks = Array.from({ length: 5 }, (_, i) => minV + (range * i) / 4);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        {/* Grid lines */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={PX} y1={toY(v)} x2={W - PX} y2={toY(v)} stroke="#334155" strokeWidth="0.5" />
            <text x={PX - 4} y={toY(v) + 3} textAnchor="end" className="fill-slate-600" fontSize="9">
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* Data lines */}
        {lines.map((line, li) => (
          <path key={li} d={pathFor(line.data)} fill="none" stroke={line.color} strokeWidth="2" strokeLinejoin="round" />
        ))}

        {/* Data points */}
        {lines.map((line, li) =>
          line.data.map((v, i) => (
            <circle key={`${li}-${i}`} cx={toX(i)} cy={toY(v)} r={hover === i ? 4 : 2.5}
              fill={hover === i ? line.color : '#0f172a'} stroke={line.color} strokeWidth="1.5" />
          ))
        )}

        {/* Hover zones */}
        {Array.from({ length: dataLen }, (_, i) => (
          <rect key={i} x={toX(i) - plotW / dataLen / 2} y={PY} width={plotW / dataLen} height={plotH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)} />
        ))}

        {/* Hover tooltip */}
        {hover !== null && (
          <g>
            <line x1={toX(hover)} y1={PY} x2={toX(hover)} y2={PY + plotH} stroke="#475569" strokeWidth="0.5" strokeDasharray="4" />
          </g>
        )}
      </svg>

      {/* Tooltip overlay */}
      {hover !== null && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs pointer-events-none shadow-lg">
          <div className="text-slate-400 mb-1">{labels[hover] || `Q${hover + 1}`}</div>
          {lines.map((line, li) => (
            <div key={li} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: line.color }} />
              <span className="text-slate-300">{line.label}:</span>
              <span className="font-mono text-slate-100">${line.data[hover]}萬</span>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        {lines.map((line, li) => (
          <div key={li} className="flex items-center gap-1 text-xs">
            <span className="w-3 h-1 rounded" style={{ backgroundColor: line.color }} />
            <span className="text-slate-400">{line.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
