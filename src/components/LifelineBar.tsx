import { getZone, getZoneColor, getZoneLabel } from '../engine/gameEngine';

interface Props {
  label: string;
  icon: string;
  value: number;
  maxValue?: number;
  subLabel?: string;
}

export function LifelineBar({ label, icon, value, maxValue = 100, subLabel }: Props) {
  const pct = Math.max(0, Math.min(100, (value / maxValue) * 100));
  const zone = getZone(value);
  const color = getZoneColor(zone);
  const zoneLabel = getZoneLabel(zone);

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="text-sm font-medium text-slate-300">{label}</span>
          {subLabel && <span className="text-xs text-slate-500">{subLabel}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: color + '30', color }}>{zoneLabel}</span>
          <span className="text-sm font-bold" style={{ color }}>{Math.round(value)}%</span>
        </div>
      </div>
      <div className="h-3 bg-slate-700 rounded-full overflow-hidden relative">
        {/* Zone markers */}
        <div className="absolute top-0 bottom-0 left-[20%] w-px bg-red-900/50 z-10" />
        <div className="absolute top-0 bottom-0 left-[35%] w-px bg-yellow-900/50 z-10" />
        <div className="absolute top-0 bottom-0 left-[60%] w-px bg-green-900/50 z-10" />
        <div className="absolute top-0 bottom-0 left-[75%] w-px bg-purple-900/50 z-10" />
        {/* Fill */}
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}88, ${color})`,
            boxShadow: `0 0 10px ${color}60`,
          }}
        />
      </div>
    </div>
  );
}
