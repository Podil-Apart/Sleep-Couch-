import React, { useState } from 'react';
import { Moon, Sun, Sparkles, Volume2, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

interface IOSLiveActivityProps {
  bedTime: string;
  wakeTime: string;
  targetCycles: number;
  nowTimeStr: string;
  windDownActive: boolean;
  onToggleWindDown: () => void;
  sleepMelodyTitle: string;
}

export const IOSLiveActivity: React.FC<IOSLiveActivityProps> = ({
  bedTime,
  wakeTime,
  targetCycles,
  nowTimeStr,
  windDownActive,
  onToggleWindDown,
  sleepMelodyTitle,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full space-y-2 select-none">
      {/* 1. Apple Dynamic Island Capsule */}
      <div className="flex justify-center">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="group relative px-4 py-2 rounded-full bg-black/95 hover:bg-black border border-white/10 text-white flex items-center gap-3 shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          title="Apple Dynamic Island (Натисніть для перегляду Live Activity)"
          aria-label="Apple Dynamic Island"
        >
          {/* Left indicator icon */}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#A390E4] animate-ping" />
            <Moon className="w-3.5 h-3.5 text-[#A390E4]" />
          </div>

          {/* Center text status */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-white/70">R90 iOS Live:</span>
            <span className="font-semibold text-white">
              {windDownActive ? 'Wind-down активний' : `Відбій ${bedTime}`}
            </span>
            <span className="text-white/40">·</span>
            <span className="text-[#F4A261] font-bold">{wakeTime}</span>
          </div>

          {/* Right dynamic icon */}
          <div className="flex items-center gap-1 pl-1">
            {windDownActive ? (
              <Volume2 className="w-3.5 h-3.5 text-[#A390E4] animate-pulse" />
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/80">
                {targetCycles}c
              </span>
            )}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5 text-white/50" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-white/50" />
            )}
          </div>
        </button>
      </div>

      {/* 2. Expanded iOS Live Activity Lock Screen Widget */}
      {expanded && (
        <div className="animate-in fade-in slide-in-from-top-2 duration-300 rounded-3xl bg-black/85 backdrop-blur-2xl border border-white/15 p-4 text-white shadow-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#A390E4]/20 border border-[#A390E4]/40 flex items-center justify-center text-[#A390E4]">
                <Moon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-white/60">
                  iOS Live Activity · Apple Health
                </div>
                <div className="text-sm font-bold text-white">
                  Нічний цикл відновлення R90
                </div>
              </div>
            </div>

            <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/10 text-[#F4A261]">
              Підйом о {wakeTime}
            </span>
          </div>

          {/* Progress bar of sleep/wind-down */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-white/70">
              <span>{windDownActive ? 'Акустичний купол: ' + sleepMelodyTitle : 'Час до відбою'}</span>
              <span className="font-mono">{targetCycles} циклів по 90 хв ({(targetCycles * 1.5).toFixed(1)} год)</span>
            </div>
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#A390E4] to-[#F4A261] transition-all duration-700"
                style={{ width: windDownActive ? '65%' : '40%' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <ShieldCheck className="w-3.5 h-3.5 text-[#A390E4]" />
              <span>Apple Watch Ultra: Моніторинг фаз сну готовий</span>
            </div>

            <button
              onClick={onToggleWindDown}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                windDownActive
                  ? 'bg-[#F4A261] text-[#0F1220]'
                  : 'bg-[#A390E4] text-[#0F1220] hover:bg-[#b2a2ea]'
              }`}
            >
              {windDownActive ? 'Зупинити Wind-down' : 'Запустити Wind-down'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
