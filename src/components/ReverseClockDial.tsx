import React from 'react';
import { CycleOption, parseTimeToMinutes } from '../utils/r90Engine';

interface ReverseClockDialProps {
  wakeTime: string;
  cycles: CycleOption[];
  selectedCycles: number;
  onSelectCycles: (cycles: number) => void;
  darkMode?: boolean;
}

export const ReverseClockDial: React.FC<ReverseClockDialProps> = ({
  wakeTime,
  cycles,
  selectedCycles,
  onSelectCycles,
  darkMode = false,
}) => {
  // Convert 24-hour time (0..1440) to angle on a 12-hour or 24-hour clock dial
  // On Page 5 of the PDF, the dial has 24 at top (0 deg), 6 at right (90 deg), 18 at bottom (180 deg) -> custom schematic,
  // Let's render a true 24-hour precision biometric dial where 24:00/00:00 is at top (0°), 06:00 is at right (90°), 12:00 is at bottom (180°), 18:00 is at left (270°),
  // OR match the exact visual clarity so every cycle time node (21:30, 23:00, 00:30, 02:00, 03:30, 05:00) and fixed wake time (06:30) are clearly spaced and clickable!
  const cx = 180;
  const cy = 180;
  const radius = 112;
  const outerTrackRadius = 128;

  const timeToAngleDeg = (timeStr: string) => {
    const mins = parseTimeToMinutes(timeStr);
    // 24h dial: 00:00 at top (-90 deg in standard SVG polar coordinates)
    return (mins / 1440) * 360 - 90;
  };

  const polarToCartesian = (centerX: number, centerY: number, r: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees * Math.PI) / 180.0;
    return {
      x: centerX + r * Math.cos(angleInRadians),
      y: centerY + r * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    let normEnd = endAngle;
    while (normEnd < startAngle) normEnd += 360;
    const largeArcFlag = normEnd - startAngle <= 180 ? '0' : '1';
    const start = polarToCartesian(x, y, r, normEnd);
    const end = polarToCartesian(x, y, r, startAngle);
    return ['M', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  const describeSector = (x: number, y: number, r: number, startAngle: number, endAngle: number) => {
    let normEnd = endAngle;
    while (normEnd < startAngle) normEnd += 360;
    const largeArcFlag = normEnd - startAngle <= 180 ? '0' : '1';
    const start = polarToCartesian(x, y, r, normEnd);
    const end = polarToCartesian(x, y, r, startAngle);
    return ['M', x, y, 'L', start.x, start.y, 'A', r, r, 0, largeArcFlag, 0, end.x, end.y, 'Z'].join(' ');
  };

  const selectedOption = cycles.find((c) => c.cycles === selectedCycles) || cycles[1];
  const sleepStartAngle = timeToAngleDeg(selectedOption.bedTime);
  const wakeAngle = timeToAngleDeg(wakeTime);

  // Midday CRP window: 12:00 - 14:00
  const middayStartAngle = timeToAngleDeg('12:00');
  const middayEndAngle = timeToAngleDeg('14:00');

  // Evening CRP window: 17:00 - 19:00
  const eveningStartAngle = timeToAngleDeg('17:00');
  const eveningEndAngle = timeToAngleDeg('19:00');

  const wakePos = polarToCartesian(cx, cy, outerTrackRadius, wakeAngle);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-full max-w-[360px] aspect-square select-none">
        <svg viewBox="0 0 360 360" className="w-full h-full overflow-visible">
          {/* Daytime Circadian Dip Sectors (Page 8: Полудень 12:00-14:00 & Ранній вечір 17:00-19:00) */}
          <path
            d={describeSector(cx, cy, radius - 2, middayStartAngle, middayEndAngle)}
            fill="#C83228"
            fillOpacity={darkMode ? 0.25 : 0.18}
          />
          <path
            d={describeSector(cx, cy, radius - 2, eveningStartAngle, eveningEndAngle)}
            fill="#C83228"
            fillOpacity={darkMode ? 0.32 : 0.24}
          />

          {/* Active Night Sleep Arc (Selected bedTime -> Fixed WakeTime) */}
          <path
            d={describeSector(cx, cy, radius - 2, sleepStartAngle, wakeAngle)}
            fill="#1A3E72"
            fillOpacity={darkMode ? 0.35 : 0.16}
          />

          {/* Dashed Outer Reverse-Engineering Track (Page 5 of PDF) */}
          <path
            d={describeArc(cx, cy, outerTrackRadius, sleepStartAngle, wakeAngle)}
            fill="none"
            stroke={darkMode ? '#4B83D8' : '#1A3E72'}
            strokeWidth="3.5"
            strokeDasharray="6 5"
          />

          {/* Main 24-Hour Clock Circle */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={darkMode ? '#334155' : '#1A1E26'}
            strokeWidth="3"
          />

          {/* 24-Hour Tick Marks */}
          {Array.from({ length: 48 }).map((_, idx) => {
            const deg = (idx / 48) * 360 - 90;
            const isMajor = idx % 6 === 0;
            const isHour = idx % 2 === 0;
            const innerR = isMajor ? radius - 12 : isHour ? radius - 7 : radius - 4;
            const p1 = polarToCartesian(cx, cy, innerR, deg);
            const p2 = polarToCartesian(cx, cy, radius, deg);
            return (
              <line
                key={idx}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={darkMode ? '#64748B' : '#1A1E26'}
                strokeWidth={isMajor ? 2.2 : isHour ? 1.2 : 0.7}
                opacity={isMajor ? 0.9 : 0.5}
              />
            );
          })}

          {/* Major 24h Reference Labels Inside Dial */}
          {[
            { label: '00:00', time: '00:00' },
            { label: '06:00', time: '06:00' },
            { label: '12:00', time: '12:00' },
            { label: '18:00', time: '18:00' },
          ].map((mark) => {
            const pos = polarToCartesian(cx, cy, radius - 24, timeToAngleDeg(mark.time));
            return (
              <text
                key={mark.label}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                className="font-mono text-[10px] font-semibold fill-current opacity-60"
              >
                {mark.label}
              </text>
            );
          })}

          {/* CRP Labels inside sectors */}
          {(() => {
            const pMid = polarToCartesian(cx, cy, radius - 52, timeToAngleDeg('13:00'));
            const pEve = polarToCartesian(cx, cy, radius - 52, timeToAngleDeg('18:00'));
            return (
              <>
                <text
                  x={pMid.x}
                  y={pMid.y}
                  textAnchor="middle"
                  className="font-mono text-[8.5px] font-semibold"
                  fill="#C83228"
                >
                  CRP 12-14
                </text>
                <text
                  x={pEve.x}
                  y={pEve.y}
                  textAnchor="middle"
                  className="font-mono text-[8.5px] font-semibold"
                  fill="#C83228"
                >
                  CRP 17-19
                </text>
              </>
            );
          })()}

          {/* Fixed Wake Time Gold Marker (Page 5: Фіксований час підйому) */}
          <g>
            <line
              x1={polarToCartesian(cx, cy, radius - 14, wakeAngle).x}
              y1={polarToCartesian(cx, cy, radius - 14, wakeAngle).y}
              x2={polarToCartesian(cx, cy, outerTrackRadius + 8, wakeAngle).x}
              y2={polarToCartesian(cx, cy, outerTrackRadius + 8, wakeAngle).y}
              stroke="#C59B40"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <text
              x={polarToCartesian(cx, cy, outerTrackRadius + 28, wakeAngle).x}
              y={polarToCartesian(cx, cy, outerTrackRadius + 28, wakeAngle).y}
              textAnchor="middle"
              dominantBaseline="central"
              className="font-mono text-[11px] font-bold"
              fill={darkMode ? '#FBBF24' : '#9A6F18'}
            >
              Підйом {wakeTime}
            </text>
          </g>

          {/* Interactive 90-Minute Cycle Entry Nodes along the Outer Arc */}
          {cycles.map((opt) => {
            const angle = timeToAngleDeg(opt.bedTime);
            const nodePos = polarToCartesian(cx, cy, outerTrackRadius, angle);
            const labelPos = polarToCartesian(cx, cy, outerTrackRadius + 28, angle);
            const isSelected = opt.cycles === selectedCycles;

            return (
              <g
                key={opt.cycles}
                onClick={() => onSelectCycles(opt.cycles)}
                className="cursor-pointer group"
                role="button"
                tabIndex={0}
                aria-label={`${opt.cycles} циклів, старт о ${opt.bedTime}`}
              >
                {/* Invisible 44px touch target circle for mobile ergonomics */}
                <circle cx={nodePos.x} cy={nodePos.y} r={22} fill="transparent" />
                {isSelected && (
                  <circle
                    cx={nodePos.x}
                    cy={nodePos.y}
                    r={13}
                    fill={darkMode ? '#4B83D8' : '#1A3E72'}
                    fillOpacity={0.25}
                  />
                )}
                <circle
                  cx={nodePos.x}
                  cy={nodePos.y}
                  r={isSelected ? 8.5 : 6.5}
                  fill={isSelected ? '#C83228' : darkMode ? '#4B83D8' : '#1A3E72'}
                  stroke={darkMode ? '#0D131D' : '#EFECE4'}
                  strokeWidth="2"
                />
                <text
                  x={labelPos.x}
                  y={labelPos.y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`font-mono text-[11px] transition-all ${
                    isSelected ? 'font-bold underline' : 'font-medium opacity-80'
                  }`}
                  fill={isSelected ? '#C83228' : darkMode ? '#E2E8F0' : '#1A1E26'}
                >
                  {opt.bedTime}
                </text>
              </g>
            );
          })}

          {/* Center Pivot & Summary */}
          <circle cx={cx} cy={cy} r={5} fill={darkMode ? '#E2E8F0' : '#1A1E26'} />
          <text
            x={cx}
            y={cy - 18}
            textAnchor="middle"
            className="font-mono text-[11px] font-semibold fill-current opacity-75"
          >
            СТАРТ СНУ
          </text>
          <text
            x={cx}
            y={cy + 16}
            textAnchor="middle"
            className="font-mono text-lg font-bold"
            fill={darkMode ? '#60A5FA' : '#1A3E72'}
          >
            {selectedOption.bedTime}
          </text>
          <text
            x={cx}
            y={cy + 32}
            textAnchor="middle"
            className="font-mono text-[10px] fill-current opacity-70"
          >
            {selectedOption.cycles} циклів · {selectedOption.hours} год
          </text>
        </svg>
      </div>

      {/* Legend under dial */}
      <div className="mt-1 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs opacity-80">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E72] inline-block" />
          <span>Точки входу (крок 90 хв)</span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C83228] inline-block" />
          <span>Вікна CRP (12–14 та 17–19)</span>
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C59B40] inline-block" />
          <span>Фіксований підйом ({wakeTime})</span>
        </span>
      </div>
    </div>
  );
};
