import React, { useState, useEffect } from 'react';
import {
  Clock,
  Wind,
  CheckCircle2,
  Circle,
  Play,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
} from 'lucide-react';
import {
  CycleOption,
  Handedness,
  biometricAudio,
} from '../utils/r90Engine';
import { ReverseClockDial } from './ReverseClockDial';

interface SleepStartTrainerProps {
  wakeTime: string;
  onChangeWakeTime: (newTime: string) => void;
  selectedCycles: number;
  onSelectCycles: (cycles: number) => void;
  cycleOptions: CycleOption[];
  handedness: Handedness;
  onChangeHandedness: (h: Handedness) => void;
  preSleepCompleted: boolean;
  onTogglePreSleepCompleted: () => void;
  onLogNightCyclesToday: (cycles: number) => void;
  darkMode?: boolean;
}

export const SleepStartTrainer: React.FC<SleepStartTrainerProps> = ({
  wakeTime,
  onChangeWakeTime,
  selectedCycles,
  onSelectCycles,
  cycleOptions,
  handedness,
  onChangeHandedness,
  preSleepCompleted,
  onTogglePreSleepCompleted,
  onLogNightCyclesToday,
  darkMode = false,
}) => {
  // Pre-sleep 90-min checklist (Modules 1 & 3)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({
    posture: true,
    nasal: true,
    noPillow: false,
    coolRoom: true,
    bedSpace: false,
  });

  // Nasal breathing pacer state (Module 3, Page 12: "Дихання носом: Тренуйте носове дихання")
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathSeconds, setBreathSeconds] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(false);

  useEffect(() => {
    if (!breathingActive) return;
    const timer = setInterval(() => {
      setBreathSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [breathingActive]);

  useEffect(() => {
    return () => {
      biometricAudio.stop();
    };
  }, []);

  const toggleBreathingTrainer = () => {
    if (breathingActive) {
      setBreathingActive(false);
      setBreathSeconds(0);
      biometricAudio.stop();
      setAudioEnabled(false);
    } else {
      setBreathingActive(true);
      setBreathSeconds(0);
    }
  };

  const toggleAudio = () => {
    if (audioEnabled) {
      biometricAudio.stop();
      setAudioEnabled(false);
    } else {
      biometricAudio.startCrpSoundscape('alpha_drone');
      setAudioEnabled(true);
    }
  };

  // 14-second nasal breathing cycle: 4s Inhale (Вдих носом) -> 4s Hold (Пауза) -> 6s Exhale (Повільний видих носом)
  const cycleSec = breathSeconds % 14;
  let breathPhaseLabel = 'Вдих носом (4 с)';
  let breathProgress = (cycleSec / 4) * 100;
  if (cycleSec >= 4 && cycleSec < 8) {
    breathPhaseLabel = 'Затримка та релаксація (4 с)';
    breathProgress = 100;
  } else if (cycleSec >= 8) {
    breathPhaseLabel = 'Повільний видих носом (6 с)';
    breathProgress = ((14 - cycleSec) / 6) * 100;
  }

  const activeOption = cycleOptions.find((c) => c.cycles === selectedCycles) || cycleOptions[1];
  const sleepingSide = handedness === 'right' ? 'лівому боці' : 'правому боці';

  const cardSurface = darkMode
    ? 'bg-[#141C2B] border border-slate-800 text-slate-100'
    : 'bg-[#F8F6F1] border border-[#D6D0C4] text-[#1A1E26]';

  return (
    <div className="space-y-6">
      {/* Section 1: Reverse Engineering of the Evening (Модуль 1, Стор. 5) */}
      <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-current/10">
          <div>
            <p className="text-xs opacity-70">
              Модуль 1 · Математика 90-хвилинних циклів (NREM + REM)
            </p>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5">
              Зворотний інжиніринг вашого вечора
            </h2>
            <p className="text-sm opacity-80 mt-1">
              Переривання 90-хвилинного циклу гарантує втому. Плануйте старт сну, відштовхуючись від фіксованого часу підйому.
            </p>
          </div>

          {/* Constant Wake Time Picker */}
          <div className="flex items-center gap-3 shrink-0">
            <label htmlFor="wake-time-input" className="text-xs font-medium opacity-80">
              Фіксований підйом:
            </label>
            <input
              id="wake-time-input"
              type="time"
              value={wakeTime}
              onChange={(e) => onChangeWakeTime(e.target.value || '06:30')}
              className={`min-h-[44px] px-3 py-2 rounded-xl font-mono text-base font-bold border cursor-pointer ${
                darkMode
                  ? 'bg-[#0D131D] border-slate-700 text-amber-400'
                  : 'bg-white border-[#C59B40] text-[#1A3E72]'
              }`}
            />
          </div>
        </div>

        {/* Two-column layout on desktop: Interactive Clock Dial + Cycle Entry Selector */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-6">
            <ReverseClockDial
              wakeTime={wakeTime}
              cycles={cycleOptions}
              selectedCycles={selectedCycles}
              onSelectCycles={onSelectCycles}
              darkMode={darkMode}
            />
          </div>

          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between text-xs opacity-75 pb-1">
              <span>Оберіть вікно входу в цикл</span>
              <span>Підготовка за 90 хв: {activeOption.windDownStart}</span>
            </div>

            {cycleOptions.map((opt) => {
              const isSelected = opt.cycles === selectedCycles;
              return (
                <button
                  key={opt.cycles}
                  onClick={() => onSelectCycles(opt.cycles)}
                  className={`w-full min-h-[56px] p-3.5 rounded-xl text-left transition-all flex items-center justify-between gap-3 border cursor-pointer ${
                    isSelected
                      ? darkMode
                        ? 'bg-[#1A3E72]/40 border-[#4B83D8] text-white'
                        : 'bg-[#1A3E72] border-[#1A3E72] text-white'
                      : darkMode
                      ? 'bg-[#0D131D]/60 border-slate-800 hover:border-slate-700'
                      : 'bg-white/80 border-[#E2DDD2] hover:border-[#1A3E72]/50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold tabular-nums">
                        {opt.bedTime}
                      </span>
                      <span aria-hidden="true" className="opacity-50">·</span>
                      <span className="text-sm font-semibold truncate">
                        {opt.cycles} {opt.cycles === 1 ? 'цикл' : opt.cycles < 5 ? 'цикли' : 'циклів'} ({opt.hours} год)
                      </span>
                      {opt.isOptimal && (
                        <span className="text-xs underline underline-offset-2 opacity-90 shrink-0">
                          Стандарт R90
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-white/85' : 'opacity-70'}`}>
                      {opt.statusText}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className={`font-mono text-xs block ${isSelected ? 'text-white/90' : 'opacity-65'}`}>
                      Декомпресія
                    </span>
                    <span className="font-mono text-xs font-semibold tabular-nums">
                      {opt.windDownStart}
                    </span>
                  </div>
                </button>
              );
            })}

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs opacity-75">
                Заснули пізно? Не лягайте між фазами — оберіть наступне 90-хвилинне вікно.
              </div>
              <button
                onClick={() => onLogNightCyclesToday(selectedCycles)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#C83228] text-white text-xs font-semibold hover:bg-[#AD2820] transition-colors whitespace-nowrap cursor-pointer"
              >
                Записати {selectedCycles} циклів у сьогоднішній баланс
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Biomechanics of the Ideal Posture & Nasal Breathing Trainer (Модуль 3, Стор. 10-12) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Biomechanics & Fetal Position Trainer */}
        <div className={`lg:col-span-7 rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
          <p className="text-xs opacity-70">
            Модуль 3 · Обладнання та Анатомія (Стор. 10–12)
          </p>
          <h3 className="text-lg font-bold mt-0.5">
            Біомеханіка ідеальної позиції сну
          </h3>
          <p className="text-sm opacity-80 mt-1">
            Поза ембріона на недомінантній стороні зменшує тиск на домінантні м’язи та вирівнює шийний відділ хребта.
          </p>

          {/* Dominant Hand Selector */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-current/5">
            <span className="text-sm font-medium">Ваша робоча (домінантна) рука:</span>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-black/10">
              <button
                onClick={() => onChangeHandedness('right')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  handedness === 'right'
                    ? 'bg-[#1A3E72] text-white shadow-sm'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                Правша (Спати на лівому боці)
              </button>
              <button
                onClick={() => onChangeHandedness('left')}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  handedness === 'left'
                    ? 'bg-[#1A3E72] text-white shadow-sm'
                    : 'opacity-75 hover:opacity-100'
                }`}
              >
                Шульга (Спати на правому боці)
              </button>
            </div>
          </div>

          {/* Interactive Anatomical Diagram recreated from Page 12 of the PDF */}
          <div className="mt-5 p-4 rounded-xl border border-current/10 bg-current/[0.02]">
            <svg viewBox="0 0 500 220" className="w-full h-auto max-h-[220px]">
              {/* Mattress baseline */}
              <line
                x1="30"
                y1="195"
                x2="470"
                y2="195"
                stroke={darkMode ? '#475569' : '#94A3B8'}
                strokeWidth="2"
                strokeDasharray="6 4"
              />
              {/* Spine alignment line */}
              <path
                d="M 165 160 Q 250 152 345 122"
                fill="none"
                stroke="#C83228"
                strokeWidth="2.5"
                strokeDasharray="4 4"
              />
              {/* Stylized fetal sleep posture (Page 12) */}
              <path
                d="M 145 155 C 125 130, 155 70, 195 65 C 215 62, 230 110, 245 125 C 275 120, 315 95, 340 95 C 352 72, 385 68, 398 88 C 410 108, 392 132, 368 132 C 355 158, 310 182, 240 185 C 185 188, 160 175, 145 155 Z"
                fill={darkMode ? '#1E293B' : '#E5E0D5'}
                stroke={darkMode ? '#94A3B8' : '#1A1E26'}
                strokeWidth="2.5"
              />
              {/* 3 Biometric Focus Points from Page 12 */}
              {/* 1. Nasal Breathing Node */}
              <circle cx="356" cy="92" r="8" fill="#1A3E72" />
              <line x1="356" y1="92" x2="395" y2="42" stroke="#1A3E72" strokeWidth="1.5" />
              <text x="400" y="45" className="text-[11px] font-semibold fill-current">
                1. Дихання носом
              </text>

              {/* 2. Cervical Spine / No Bulky Pillow Node */}
              <circle cx="352" cy="122" r="8" fill="#1A3E72" />
              <line x1="352" y1="122" x2="395" y2="145" stroke="#1A3E72" strokeWidth="1.5" />
              <text x="400" y="148" className="text-[11px] font-semibold fill-current">
                2. Вирівнювання хребта
              </text>

              {/* 3. Non-dominant Shoulder & Knees Fetal Position Node */}
              <circle cx="312" cy="126" r="8" fill="#C83228" />
              <line x1="312" y1="126" x2="135" y2="42" stroke="#C83228" strokeWidth="1.5" />
              <text x="20" y="38" className="text-[11px] font-semibold fill-current">
                3. Поза ембріона ({sleepingSide})
              </text>
            </svg>

            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-current/5">
                <strong className="block text-[#1A3E72] dark:text-sky-400">
                  Поза ембріона ({sleepingSide})
                </strong>
                <span className="opacity-80 mt-0.5 block">
                  {handedness === 'right'
                    ? 'Ви правша: спіть на лівому боці, щоб зняти напругу з правої робочої сторони.'
                    : 'Ви шульга: спіть на правому боці, щоб розвантажити домінантні м’язи лівої сторони.'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-current/5">
                <strong className="block text-[#1A3E72] dark:text-sky-400">
                  Дихання носом
                </strong>
                <span className="opacity-80 mt-0.5 block">
                  Дихання ротом — головний тригер мікро-пробуджень, хропіння та зневоднення.
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-current/5">
                <strong className="block text-[#1A3E72] dark:text-sky-400">
                  Без масивної подушки
                </strong>
                <span className="opacity-80 mt-0.5 block">
                  Ідеальна лінія хребта на матраці без зламу шиї високими подушками.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Nasal Breathing Trainer + Pre-sleep Checklist */}
        <div className="lg:col-span-5 space-y-6">
          {/* Interactive Nasal Breathing Trainer */}
          <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs opacity-70">Тренажер перед сном · Модуль 3</p>
                <h3 className="text-base font-bold mt-0.5">Калібрування носового дихання</h3>
              </div>
              <Wind className="w-5 h-5 text-[#1A3E72] dark:text-sky-400" />
            </div>

            <p className="text-xs opacity-80 mt-2">
              Виконайте 3–5 хвилин ритмічного носового дихання (4-4-6), лежачи у позі ембріона на {sleepingSide}.
            </p>

            <div className="mt-4 p-4 rounded-xl bg-current/5 flex flex-col items-center text-center">
              <div className="font-mono text-2xl font-bold tabular-nums">
                {Math.floor(breathSeconds / 60)
                  .toString()
                  .padStart(2, '0')}
                :
                {(breathSeconds % 60).toString().padStart(2, '0')}
              </div>
              <div className="text-sm font-semibold mt-1 text-[#C83228]">
                {breathingActive ? breathPhaseLabel : 'Готовий до калібрування дихання'}
              </div>

              {/* Smooth compositor progress bar */}
              <div className="w-full h-2 rounded-full bg-current/10 mt-3 overflow-hidden">
                <div
                  className="h-full bg-[#1A3E72] transition-transform duration-300 origin-left"
                  style={{
                    transform: `scaleX(${breathingActive ? Math.max(0.08, breathProgress / 100) : 0})`,
                  }}
                />
              </div>

              <div className="mt-4 flex items-center gap-2 w-full">
                <button
                  onClick={toggleBreathingTrainer}
                  className={`flex-1 min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    breathingActive
                      ? 'bg-[#C83228] text-white hover:bg-[#A92820]'
                      : 'bg-[#1A3E72] text-white hover:bg-[#143059]'
                  }`}
                >
                  {breathingActive ? (
                    <>
                      <Square className="w-3.5 h-3.5" />
                      <span>Зупинити тренажер</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5" />
                      <span>Почати дихання носом</span>
                    </>
                  )}
                </button>

                <button
                  onClick={toggleAudio}
                  className={`min-h-[44px] min-w-[44px] px-3 rounded-xl border border-current/15 flex items-center justify-center gap-1.5 text-xs font-medium cursor-pointer ${
                    audioEnabled ? 'bg-[#1A3E72] text-white' : 'hover:bg-current/5'
                  }`}
                  title="Увімкнути заспокійливий тон 174 Гц"
                >
                  {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span>Звук</span>
                </button>
              </div>
            </div>
          </div>

          {/* Hardware & Evening Preparation Checklist (Page 11-12) */}
          <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold">Чек-лист підготовки спальні</h3>
              <span className="font-mono text-xs opacity-75">
                {Object.values(checklist).filter(Boolean).length}/5 виконано
              </span>
            </div>

            <div className="mt-3 space-y-2">
              {[
                {
                  key: 'posture',
                  title: `Поза ембріона на ${sleepingSide}`,
                  desc: 'Розвантаження домінантних м’язів (Стор. 12)',
                },
                {
                  key: 'nasal',
                  title: 'Носове дихання активовано',
                  desc: 'Захист від мікро-пробуджень вночі (Стор. 12)',
                },
                {
                  key: 'noPillow',
                  title: 'Відмова від масивної подушки',
                  desc: 'Природне вирівнювання шиї та хребта (Стор. 10, 12)',
                },
                {
                  key: 'coolRoom',
                  title: 'Терморегуляція та темрява (16–18°C)',
                  desc: `Вечірня декомпресія з ${activeOption.windDownStart}`,
                },
                {
                  key: 'bedSpace',
                  title: 'Максимальний простір для рухів (Super King)',
                  desc: 'Достатньо простору для терморегуляції та зміни фаз (Стор. 11)',
                },
              ].map((item) => {
                const checked = !!checklist[item.key];
                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      setChecklist((prev) => ({ ...prev, [item.key]: !prev[item.key] }))
                    }
                    className="w-full min-h-[48px] p-2.5 rounded-xl flex items-start gap-3 text-left hover:bg-current/5 transition-colors cursor-pointer"
                  >
                    {checked ? (
                      <CheckCircle2 className="w-5 h-5 text-[#1A3E72] dark:text-sky-400 shrink-0 mt-0.5" />
                    ) : (
                      <Circle className="w-5 h-5 opacity-40 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <div className={`text-xs font-semibold ${checked ? '' : 'opacity-80'}`}>
                        {item.title}
                      </div>
                      <div className="text-[11px] opacity-65">{item.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={onTogglePreSleepCompleted}
              className={`mt-4 w-full min-h-[44px] rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                preSleepCompleted
                  ? 'bg-emerald-700 text-white'
                  : 'bg-[#1A3E72] text-white hover:bg-[#143059]'
              }`}
            >
              {preSleepCompleted
                ? '✓ Вечірній протокол підготовки зафіксовано'
                : 'Зафіксувати готовність до старту сну'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
