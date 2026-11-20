import type { Stats, Status } from "../lib/cycle.ts";

/** Circular overview of the cycle: period, fertile window, ovulation and today. */
export function CycleRing({ status, stats, lutealLength, children }: {
  status: Status; stats: Stats; lutealLength: number; children: React.ReactNode;
}) {
  const total = Math.max(stats.avgCycle, status.cycleDay ?? 0);
  const size = 260, stroke = 18, r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const arc = (fromDay: number, days: number) => ({
    strokeDasharray: `${(Math.max(0, days) / total) * c} ${c}`,
    strokeDashoffset: -((fromDay - 1) / total) * c,
  });
  const ovulationDay = stats.avgCycle - lutealLength;
  const angle = (day: number) => ((day - 0.5) / total) * 2 * Math.PI - Math.PI / 2;
  const point = (day: number) => ({ x: size / 2 + r * Math.cos(angle(day)), y: size / 2 + r * Math.sin(angle(day)) });
  const today = status.cycleDay ? point(Math.min(status.cycleDay, total)) : null;
  const ov = point(ovulationDay);

  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke}>
          <circle cx={size / 2} cy={size / 2} r={r} className="ring-track" />
          {status.cycleDay && (
            <>
              <circle cx={size / 2} cy={size / 2} r={r} className="ring-period" style={arc(1, stats.avgPeriod)} />
              <circle cx={size / 2} cy={size / 2} r={r} className="ring-fertile" style={arc(ovulationDay - 5, 7)} />
            </>
          )}
        </g>
        {status.cycleDay && <circle cx={ov.x} cy={ov.y} r={5} className="ring-ovulation" />}
        {today && <circle cx={today.x} cy={today.y} r={stroke / 2 + 4} className="ring-today" />}
      </svg>
      <div className="ring-center">{children}</div>
    </div>
  );
}
