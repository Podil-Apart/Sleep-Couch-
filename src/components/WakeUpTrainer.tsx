import React, { useState, useEffect } from 'react';
import {
  Sun,
  Droplets,
  Activity,
  Smartphone,
  Play,
  Square,
  Volume2,
  CheckCircle2,
  Circle,
  Maximize2,
  X,
} from 'lucide-react';
import { biometricAudio, formatMinutesToTime, parseTimeToMinutes } from '../utils/r90Engine';

interface WakeUpTrainerProps {
  wakeTime: string;
  morningProtocolDone: boolean;
  onCompleteMorningProtocol: () => void;
  darkMode?: boolean;
}

export const WakeUpTrainer: React.FC<WakeUpTrainerProps> = ({
  wakeTime,
  morningProtocolDone,
  onCompleteMorningProtocol,
  darkMode = false,
}) => {
  // Dawn Simulator State (0 to 100% illumination)
  const [dawnActive, setDawnActive] = useState(false);
  const [dawnLevel, setDawnLevel] = useState(25);
  const [fullscreenDawn, setFullscreenDawn] = useState(false);

  // 90-Minute Launch Protocol Timer (5400 seconds = 90 minutes)
  const [protocolRunning, setProtocolRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // 4-step Launch Protocol Checklist from Page 14 of PDF
  const [stepsDone, setStepsDone] = useState<Record<string, boolean>>({
    light: true,
    hydration: false,
    movement: false,
    screenDetox: true,
  });

  useEffect(() => {
    if (!dawnActive) return;
    const t = setInterval(() => {
      setDawnLevel((prev) => {
        if (prev >= 100) {
          biometricAudio.playDawnHarmonicChime();
          setDawnActive(false);
          return 100;
        }
        return prev + 5;
      });
    }, 800);
    return () => clearInterval(t);
  }, [dawnActive]);

  useEffect(() => {
    if (!protocolRunning) return;
    const t = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= 5400) {
          setProtocolRunning(false);
          return 5400;
        }
        return prev + 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [protocolRunning]);

  const wakeMins = parseTimeToMinutes(wakeTime);
  const windowEnd = formatMinutesToTime(wakeMins + 90);

  const toggleStep = (key: string) => {
    setStepsDone((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const remainingSeconds = Math.max(0, 5400 - elapsedSeconds);
  const remMins = Math.floor(remainingSeconds / 60);
  const remSecs = remainingSeconds % 60;

  const cardSurface = darkMode
    ? 'bg-[#141C2B] border border-slate-800 text-slate-100'
    : 'bg-[#F8F6F1] border border-[#D6D0C4] text-[#1A1E26]';

  // Dynamic Sunrise Gradient based on dawnLevel (0..100)
  const dawnStyle = {
    background: `linear-gradient(135deg, 
      rgba(26, 62, 114, ${Math.max(0.1, 1 - dawnLevel / 100)}) 0%, 
      rgba(200, 50, 40, ${0.25 + (dawnLevel / 100) * 0.35}) 45%, 
      rgba(245, 166, 35, ${0.2 + (dawnLevel / 100) * 0.75}) 100%)`,
  };

  return (
    <div className="space-y-6">
      {/* Fullscreen Dawn Lamp Modal for Bedside Android Use */}
      {fullscreenDawn && (
        <div
          className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 text-white transition-colors duration-700"
          style={{
            background: `radial-gradient(circle at center, rgba(255, 224, 150, ${
              0.3 + (dawnLevel / 100) * 0.7
            }) 0%, rgba(217, 119, 6, ${0.4 + (dawnLevel / 100) * 0.5}) 55%, #1A3E72 100%)`,
          }}
        >
          <div className="w-full flex items-center justify-between">
            <span className="font-mono text-sm font-semibold">
              СИМУЛЯТОР СВІТАНКУ R90 · {dawnLevel}% ЯСКРАВОСТІ
            </span>
            <button
              onClick={() => setFullscreenDawn(false)}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-black/30 flex items-center justify-center cursor-pointer"
              aria-label="Закрити повноекранний світанок"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="text-center max-w-md space-y-4">
            <Sun className="w-20 h-20 mx-auto text-amber-100" />
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-950">
              Природна заміна мелатоніну серотоніном
            </h2>
            <p className="text-sm text-slate-900 font-medium">
              М’яке світло сигналізує оптичним рецепторам про завершення нічних циклів без кортизолового шоку.
            </p>
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                onClick={() => biometricAudio.playDawnHarmonicChime()}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-slate-950 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>М’який гармонійний сигнал</span>
              </button>
            </div>
          </div>

          <div className="w-full max-w-md">
            <input
              type="range"
              min={10}
              max={100}
              value={dawnLevel}
              onChange={(e) => setDawnLevel(Number(e.target.value))}
              className="w-full accent-slate-900 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Header & Dawn Simulator Card (Модуль 4, Стор. 13-14) */}
      <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-current/10">
          <div>
            <p className="text-xs opacity-70">
              Модуль 4 · Критичне вікно ({wakeTime} – {windowEnd})
            </p>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5">
              Протокол запуску: Перші 90 хвилин після сну
            </h2>
            <p className="text-sm opacity-80 mt-1">
              Перші 90 хвилин після пробудження важливіші за 90 хвилин до сну. Саме вони визначають якість вашого наступного відновлення.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setProtocolRunning((r) => !r)}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
                protocolRunning
                  ? 'bg-[#C83228] text-white'
                  : 'bg-[#1A3E72] text-white hover:bg-[#143059]'
              }`}
            >
              {protocolRunning ? (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Зупинити 90-хв таймер ({remMins}:{String(remSecs).padStart(2, '0')})</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Запустити 90-хв вікно ранку</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dawn Simulator Interactive Panel */}
        <div
          className="mt-5 rounded-2xl p-5 text-white relative overflow-hidden border border-amber-500/30"
          style={dawnStyle}
        >
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-100">
                <Sun className="w-4 h-4" />
                <span>Симулятор світанку · Інтенсивність {dawnLevel}%</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold">
                Плавне пробудження замість різкого будильника
              </h3>
              <p className="text-xs sm:text-sm text-white/90">
                Поступове наростання теплого спектру та гармонійний акорд переводять мозок із фази REM у бадьорість.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => {
                  if (!dawnActive) {
                    setDawnLevel(15);
                    setDawnActive(true);
                  } else {
                    setDawnActive(false);
                  }
                }}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-slate-950/80 hover:bg-slate-950 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
              >
                <Sun className="w-4 h-4 text-amber-400" />
                <span>{dawnActive ? 'Зупинити світанок' : 'Симуляція світанку'}</span>
              </button>

              <button
                onClick={() => biometricAudio.playDawnHarmonicChime()}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Volume2 className="w-4 h-4" />
                <span>Акорд світанку</span>
              </button>

              <button
                onClick={() => setFullscreenDawn(true)}
                className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                title="Повноекранне світло світанку"
              >
                <Maximize2 className="w-4 h-4" />
                <span className="hidden sm:inline">На весь екран</span>
              </button>
            </div>
          </div>

          <div className="relative z-10 mt-4 flex items-center gap-3">
            <span className="font-mono text-xs text-white/80">Темрява</span>
            <input
              type="range"
              min={5}
              max={100}
              value={dawnLevel}
              onChange={(e) => setDawnLevel(Number(e.target.value))}
              className="flex-1 accent-amber-300 cursor-pointer"
            />
            <span className="font-mono text-xs text-white/90">Повний світанок</span>
          </div>
        </div>

        {/* 4 Sequential Columns Recreated from Page 14 of the PDF: Світло -> Гідратація -> Рух -> Блокування */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              key: 'light',
              stepNum: '01',
              header: 'Світло',
              sub: 'Симулятор світанку',
              body: 'Мелатонін заміщується серотоніном природним шляхом. Відкрийте штори або увімкніть світловий будильник.',
              accent: 'bg-[#1A3E72]',
              borderAccent: 'border-[#1A3E72]',
              icon: Sun,
              timeRange: 'Хвилини 0 – 15',
            },
            {
              key: 'hydration',
              stepNum: '02',
              header: 'Гідратація',
              sub: 'Вода та перекус',
              body: 'Миттєвий запуск метаболізму після нічного дихання. Склянка води кімнатної температури та легкий білково-вуглеводний перекус.',
              accent: 'bg-[#C83228]',
              borderAccent: 'border-[#C83228]',
              icon: Droplets,
              timeRange: 'Хвилини 15 – 35',
            },
            {
              key: 'movement',
              stepNum: '03',
              header: 'Рух',
              sub: 'Легкі вправи',
              body: 'Стимуляція кровообігу та лімфодренажу. Мобільність суглобів, розтяжка хребта або коротка прогулянка на свіжому повітрі.',
              accent: 'bg-[#1A3E72]',
              borderAccent: 'border-[#1A3E72]',
              icon: Activity,
              timeRange: 'Хвилини 35 – 65',
            },
            {
              key: 'screenDetox',
              stepNum: '04',
              header: 'Блокування',
              sub: 'Детокс від екранів',
              body: 'Жодних смартфонів, новин та робочих чатів у перші хвилини після сну для захисту мозку від кортизолового шоку.',
              accent: 'bg-[#C83228]',
              borderAccent: 'border-[#C83228]',
              icon: Smartphone,
              timeRange: 'Усі 90 хвилин',
            },
          ].map((card) => {
            const IconComponent = card.icon;
            const isChecked = !!stepsDone[card.key];
            return (
              <div
                key={card.key}
                onClick={() => toggleStep(card.key)}
                className={`rounded-xl overflow-hidden border-2 transition-all flex flex-col justify-between cursor-pointer ${
                  isChecked ? card.borderAccent : 'border-current/15 opacity-80'
                } ${darkMode ? 'bg-[#0D131D]' : 'bg-white'}`}
              >
                <div>
                  <div className={`${card.accent} text-white px-4 py-2.5 flex items-center justify-between`}>
                    <span className="font-display text-sm font-bold">
                      {card.stepNum}. {card.header}
                    </span>
                    <IconComponent className="w-4 h-4" />
                  </div>
                  <div className="p-4">
                    <div className="text-xs font-mono opacity-65">{card.timeRange}</div>
                    <h4 className="text-sm font-bold mt-1">{card.sub}</h4>
                    <p className="text-xs opacity-80 mt-1.5 leading-relaxed">{card.body}</p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-current/10 flex items-center justify-between text-xs font-semibold">
                  <span>{isChecked ? 'Виконано' : 'Відмітити виконання'}</span>
                  {isChecked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Circle className="w-4 h-4 opacity-40" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Action */}
        <div className="mt-5 pt-4 border-t border-current/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs opacity-75">
            Виконано кроків протоколу запуску: {Object.values(stepsDone).filter(Boolean).length} з 4
          </div>
          <button
            onClick={onCompleteMorningProtocol}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              morningProtocolDone
                ? 'bg-emerald-700 text-white'
                : 'bg-[#1A3E72] text-white hover:bg-[#143059]'
            }`}
          >
            {morningProtocolDone
              ? '✓ Ранковий протокол 90 хвилин зараховано сьогодні'
              : 'Зарахувати ранковий протокол у щоденний звіт'}
          </button>
        </div>
      </div>
    </div>
  );
};
