import React, { useState, useEffect, useCallback } from 'react';
import {
  Moon,
  Sun,
  Bell,
  Wind,
  Music,
  Lamp,
  Play,
  Square,
  CheckCircle2,
  Clock,
  ChevronRight,
  Volume2,
  Sparkles,
  RefreshCw,
  Zap,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  MelodyTrack,
  sleepCoachMedia,
} from '../utils/sleepCoachEngine';
import {
  DayRecoveryRecord,
  formatMinutesToTime,
  parseTimeToMinutes,
} from '../utils/r90Engine';
import {
  SleepCoachAdvice,
  fetchSleepAdvice,
  generateLocalSleepAdvice,
  analyzeWeeklyData,
} from '../utils/geminiSleepCoach';
import { IOSLiveActivity } from './IOSLiveActivity';

interface ScreenTodayProps {
  wakeTime: string;
  bedTime: string;
  targetCycles: number;
  sleepMelody: MelodyTrack;
  wakeMelody: MelodyTrack;
  windDownLeadMins: 30 | 60;
  nowTimeStr: string;
  weeklyData: DayRecoveryRecord[];
  onNavigateTab: (tab: 'today' | 'schedule' | 'analytics' | 'smarthome') => void;
  onTriggerSmartScene: (scene: 'bedtime' | 'morning') => void;
  activeSceneMessage: string | null;
  platformMode?: 'android' | 'ios';
}

export const ScreenToday: React.FC<ScreenTodayProps> = ({
  wakeTime,
  bedTime,
  targetCycles,
  sleepMelody,
  wakeMelody,
  windDownLeadMins,
  nowTimeStr,
  weeklyData,
  onNavigateTab,
  onTriggerSmartScene,
  activeSceneMessage,
  platformMode = 'android',
}) => {
  // Circle mode: 'countdown' (Час до відбою) or 'summary' (Ви спали 7г 12хв з оцінкою якості)
  const [circleMode, setCircleMode] = useState<'countdown' | 'summary'>('summary');

  // Wind-down ritual modal / active session state
  const [windDownActive, setWindDownActive] = useState(false);
  const [windDownSeconds, setWindDownSeconds] = useState(0);
  const [playingSleepTrack, setPlayingSleepTrack] = useState(false);
  const [smartLightDimmed, setSmartLightDimmed] = useState(true);

  // Quick 30-min CRP / Morning Dawn preview state
  const [crpQuickTimer, setCrpQuickTimer] = useState<number | null>(null);

  // Gemini AI Sleep Advice State
  const [adviceData, setAdviceData] = useState<SleepCoachAdvice | null>(() => {
    return generateLocalSleepAdvice(weeklyData);
  });
  const [adviceLoading, setAdviceLoading] = useState<boolean>(false);
  const [adviceError, setAdviceError] = useState<string | null>(null);
  const [actionDone, setActionDone] = useState<boolean>(false);

  // Function that triggers analysis of weeklyData via Gemini API
  const handleGenerateAdvice = useCallback(
    async (force: boolean = false) => {
      setAdviceLoading(true);
      setAdviceError(null);
      try {
        const result = await fetchSleepAdvice(weeklyData, wakeTime, targetCycles, force);
        setAdviceData(result);
      } catch (err: any) {
        setAdviceError(err?.message || 'Не вдалося оновити пораду');
        setAdviceData(generateLocalSleepAdvice(weeklyData));
      } finally {
        setAdviceLoading(false);
      }
    },
    [weeklyData, wakeTime, targetCycles]
  );

  // Automatically fetch / synchronize advice on mount or when weeklyData changes
  useEffect(() => {
    handleGenerateAdvice(false);
  }, [handleGenerateAdvice]);

  useEffect(() => {
    if (!windDownActive) return;
    const t = setInterval(() => {
      setWindDownSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [windDownActive]);

  useEffect(() => {
    if (crpQuickTimer === null) return;
    const t = setInterval(() => {
      setCrpQuickTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(t);
  }, [crpQuickTimer]);

  // Calculate time remaining until bedTime
  const nowMins = parseTimeToMinutes(nowTimeStr);
  const bedMins = parseTimeToMinutes(bedTime);
  let diffMins = bedMins - nowMins;
  if (diffMins <= 0) diffMins += 1440;
  const hoursToBed = Math.floor(diffMins / 60);
  const minsToBed = diffMins % 60;

  const windDownStartTime = formatMinutesToTime(bedMins - windDownLeadMins);
  const wakeWindowStart = formatMinutesToTime(parseTimeToMinutes(wakeTime) - 20);

  // Breathing phase inside wind-down ritual (4s inhale - 4s hold - 6s exhale)
  const breathCycleSec = windDownSeconds % 14;
  let breathInstruction = 'Вдих носом (4 с)';
  let breathScale = 1.06;
  if (breathCycleSec >= 4 && breathCycleSec < 8) {
    breathInstruction = 'Спокійна затримка (4 с)';
    breathScale = 1.08;
  } else if (breathCycleSec >= 8) {
    breathInstruction = 'Повільний видих носом (6 с)';
    breathScale = 0.96;
  }

  const startWindDownRitual = () => {
    setWindDownActive(true);
    setWindDownSeconds(0);
    setSmartLightDimmed(true);
    onTriggerSmartScene('bedtime');
    const started = sleepCoachMedia.playTrack(sleepMelody, 'sigmoid');
    setPlayingSleepTrack(started);
  };

  const stopWindDownRitual = () => {
    setWindDownActive(false);
    sleepCoachMedia.stop();
    setPlayingSleepTrack(false);
  };

  return (
    <div className="space-y-6">
      {/* Apple Dynamic Island & Live Activity (iOS Mode Exclusive) */}
      {platformMode === 'ios' && (
        <IOSLiveActivity
          bedTime={bedTime}
          wakeTime={wakeTime}
          targetCycles={targetCycles}
          nowTimeStr={nowTimeStr}
          windDownActive={windDownActive}
          onToggleWindDown={() => (windDownActive ? stopWindDownRitual() : startWindDownRitual())}
          sleepMelodyTitle={sleepMelody.title}
        />
      )}

      {/* Top Grid: Hero Biometric Circle + Today's Plan Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left 6 Cols: Large Center Circle (Час до відбою OR Ви спали 7г 12хв з оцінкою якості) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 flex flex-col items-center justify-between">
          {/* Mode Switcher */}
          <div className="w-full flex items-center justify-between gap-2">
            <span className="text-xs text-[#9FA4BC]">Головний індикатор сну</span>
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0F1220] border border-[#262D47]">
              <button
                onClick={() => setCircleMode('summary')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  circleMode === 'summary'
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
                }`}
              >
                Підсумок ночі
              </button>
              <button
                onClick={() => setCircleMode('countdown')}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                  circleMode === 'countdown'
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
                }`}
              >
                Час до відбою
              </button>
            </div>
          </div>

          {/* Large SVG Sleep Ring */}
          <div
            onClick={() =>
              setCircleMode((m) => (m === 'summary' ? 'countdown' : 'summary'))
            }
            className="relative my-4 w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center cursor-pointer select-none"
            role="button"
            tabIndex={0}
            aria-label="Перемкнути вигляд кола сну: підсумок ночі або час до відбою"
          >
            <svg viewBox="0 0 260 260" className="w-full h-full -rotate-90">
              {/* Background ring */}
              <circle
                cx="130"
                cy="130"
                r="106"
                fill="none"
                stroke="#232942"
                strokeWidth="14"
              />
              {/* Secondary warm amber morning arc */}
              <circle
                cx="130"
                cy="130"
                r="106"
                fill="none"
                stroke="#F4A261"
                strokeWidth="14"
                strokeDasharray="666"
                strokeDashoffset={circleMode === 'summary' ? '560' : '590'}
                strokeLinecap="round"
                opacity="0.45"
              />
              {/* Primary Muted Lavender Progress Arc */}
              <circle
                cx="130"
                cy="130"
                r="106"
                fill="none"
                stroke="#A390E4"
                strokeWidth="14"
                strokeDasharray="666"
                strokeDashoffset={circleMode === 'summary' ? '82' : '165'}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>

            {/* Center Typography */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              {circleMode === 'summary' ? (
                <>
                  <span className="text-xs font-medium text-[#9FA4BC]">
                    Ви спали сьогодні
                  </span>
                  <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#E4E6F0] mt-1 tabular-nums">
                    7г 12хв
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#A390E4]">
                    Якість сну: 88 / 100 · Відмінно
                  </div>
                  <div className="mt-1 text-[11px] text-[#9FA4BC]">
                    5 циклів R90 · Глибокий 1г 46хв
                  </div>
                </>
              ) : (
                <>
                  <span className="text-xs font-medium text-[#9FA4BC]">
                    Час до відбою ({bedTime})
                  </span>
                  <div className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-[#E4E6F0] mt-1 tabular-nums">
                    {hoursToBed}г {String(minsToBed).padStart(2, '0')}хв
                  </div>
                  <div className="mt-2 text-xs font-semibold text-[#F4A261]">
                    Згортання о {windDownStartTime}
                  </div>
                  <div className="mt-1 text-[11px] text-[#9FA4BC]">
                    Ціль: {targetCycles} циклів ({(targetCycles * 1.5).toFixed(1)} год)
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Primary Wind-Down Button with Breathing Effect (min 56dp touch zone) */}
          <div className="w-full space-y-2.5">
            <button
              onClick={windDownActive ? stopWindDownRitual : startWindDownRitual}
              className={`w-full min-h-[56px] px-6 py-3.5 rounded-2xl font-display text-sm sm:text-base font-bold flex items-center justify-center gap-3 transition-all cursor-pointer ${
                windDownActive
                  ? 'bg-[#F4A261] text-[#0F1220]'
                  : 'bg-[#A390E4] text-[#0F1220] animate-winddown-breathe hover:bg-[#B3A2EC]'
              }`}
            >
              <Moon className="w-5 h-5 shrink-0" />
              <span>
                {windDownActive
                  ? 'Зупинити вечірній ритуал Wind-down'
                  : 'Почати wind-down (світло, музика, дихання)'}
              </span>
            </button>

            <p className="text-center text-xs text-[#9FA4BC]">
              Плавне занурення без білих спалахів · Тапніть на коло для зміни режиму
            </p>
          </div>
        </div>

        {/* Right 6 Cols: Card "Сьогоднішній план" (Відбій, пробудження, нагадування, мікропаузи) */}
        <div className="lg:col-span-6 rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-[#262D47]">
              <div>
                <span className="text-xs text-[#9FA4BC]">Персональний розклад</span>
                <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-0.5">
                  Сьогоднішній план
                </h2>
              </div>
              <button
                onClick={() => onNavigateTab('schedule')}
                className="min-h-[48px] px-3.5 py-2 rounded-xl bg-[#1E253D] hover:bg-[#27304F] text-xs font-semibold text-[#A390E4] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Змінити режим</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 2 Primary Time Blocks: Bedtime & Wake-up */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div
                onClick={() => onNavigateTab('schedule')}
                className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] hover:border-[#A390E4]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-[#9FA4BC]">
                  <span>Відбій ({targetCycles} циклів)</span>
                  <Moon className="w-4 h-4 text-[#A390E4]" />
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#E4E6F0] mt-1 tabular-nums">
                  {bedTime}
                </div>
                <div className="text-xs text-[#9FA4BC] mt-1 truncate">
                  Мелодія: {sleepMelody.title}
                </div>
              </div>

              <div
                onClick={() => onNavigateTab('schedule')}
                className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] hover:border-[#F4A261]/50 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between text-xs text-[#9FA4BC]">
                  <span>Пробудження (вікно 20 хв)</span>
                  <Sun className="w-4 h-4 text-[#F4A261]" />
                </div>
                <div className="font-display text-2xl sm:text-3xl font-extrabold text-[#F4A261] mt-1 tabular-nums">
                  {wakeTime}
                </div>
                <div className="text-xs text-[#9FA4BC] mt-1 truncate">
                  Світанок з {wakeWindowStart} · {wakeMelody.title}
                </div>
              </div>
            </div>

            {/* Scheduled Reminders List */}
            <div className="mt-5 space-y-2.5">
              <div className="text-xs font-semibold text-[#9FA4BC]">
                Активні нагадування та мікропаузи сьогодні
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0F1220]/80 border border-[#262D47] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#A390E4]">
                    <Bell className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono font-semibold tabular-nums">
                      {windDownStartTime}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>За {windDownLeadMins} хв до сну</span>
                  </div>
                  <div className="text-sm font-semibold text-[#E4E6F0] mt-0.5 truncate">
                    Нагадування «Час згортатися» та режим Не турбувати
                  </div>
                </div>
                <span className="text-xs text-[#9FA4BC] shrink-0">Активно</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#0F1220]/80 border border-[#262D47] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[#F4A261]">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-mono font-semibold tabular-nums">
                      13:00 та 17:30
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Денні мікропаузи CRP</span>
                  </div>
                  <div className="text-sm font-semibold text-[#E4E6F0] mt-0.5 truncate">
                    Розвантаження нейронів (30 хв ізоляції без смартфонів)
                  </div>
                </div>
                <button
                  onClick={() =>
                    setCrpQuickTimer((prev) => (prev ? null : 1800))
                  }
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1E253D] hover:bg-[#283152] text-xs font-semibold text-[#E4E6F0] shrink-0 cursor-pointer"
                >
                  {crpQuickTimer
                    ? `${Math.floor(crpQuickTimer / 60)}:${String(
                        crpQuickTimer % 60
                      ).padStart(2, '0')}`
                    : 'Старт 30 хв'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Smart Home Scene Triggers */}
          <div className="pt-4 border-t border-[#262D47] flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-[#9FA4BC]">
              {activeSceneMessage || 'Сцени Google Home готові до запуску'}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onTriggerSmartScene('bedtime')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1E253D] hover:bg-[#283152] text-xs font-semibold text-[#A390E4] cursor-pointer"
              >
                Сцена «Відбій»
              </button>
              <button
                onClick={() => onTriggerSmartScene('morning')}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#1E253D] hover:bg-[#283152] text-xs font-semibold text-[#F4A261] cursor-pointer"
              >
                Сцена «Ранок»
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gemini AI Personalized Sleep Coach Advice Card */}
      <section
        className="rounded-3xl bg-[#161B2E] border border-[#A390E4]/30 p-6 relative overflow-hidden transition-all shadow-lg"
        aria-label="Персональна порада тренера сну на сьогодні"
      >
        {/* Soft background ambient gradient */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 rounded-full bg-[#A390E4]/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 rounded-full bg-[#F4A261]/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Header row with badges and action button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#262D47]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0F1220] border border-[#A390E4]/40 flex items-center justify-center text-[#A390E4] shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#A390E4]">
                    Gemini Sleep Coach
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
                      adviceData?.source === 'gemini'
                        ? 'bg-[#A390E4]/15 border-[#A390E4]/40 text-[#A390E4]'
                        : 'bg-[#F4A261]/15 border-[#F4A261]/40 text-[#F4A261]'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{adviceData?.source === 'gemini' ? 'Gemini 3.8 AI' : 'R90 Engine'}</span>
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#E4E6F0] mt-0.5">
                  Персональна порада тренера на сьогодні
                </h3>
              </div>
            </div>

            {/* Refresh Advice Button */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {adviceData?.timestamp && (
                <span className="text-[11px] text-[#9FA4BC] hidden md:inline">
                  Оновлено о {adviceData.timestamp}
                </span>
              )}
              <button
                onClick={() => handleGenerateAdvice(true)}
                disabled={adviceLoading}
                className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] hover:border-[#A390E4]/40 text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                title="Перегенерувати пораду за тижневими даними сну"
                aria-label="Оновити персональну пораду"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-[#A390E4] ${adviceLoading ? 'animate-spin' : ''}`}
                />
                <span>{adviceLoading ? 'Аналіз даних...' : 'Оновити пораду'}</span>
              </button>
            </div>
          </div>

          {/* Quick Biometric Tags & Focus */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-[#0F1220] border border-[#262D47] text-xs font-semibold text-[#A390E4]">
              Фокус: {adviceData?.focusArea || 'Оптимізація відновлення'}
            </span>
            <span className="px-3 py-1 rounded-xl bg-[#0F1220] border border-[#262D47] text-xs font-mono text-[#9FA4BC]">
              Баланс: {adviceData?.cyclesAssessment || '35 / 35 циклів'}
            </span>
            {adviceData?.readinessScore && (
              <span className="px-3 py-1 rounded-xl bg-[#0F1220] border border-[#262D47] text-xs font-semibold text-[#F4A261] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Індекс готовності: {adviceData.readinessScore}%</span>
              </span>
            )}
          </div>

          {/* Advice Text Content */}
          <div className="p-4 rounded-2xl bg-[#0F1220]/70 border border-[#262D47] leading-relaxed">
            {adviceLoading ? (
              <div className="flex items-center gap-3 py-2 text-[#9FA4BC] text-sm animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-[#A390E4]" />
                <span>Gemini API аналізує 7 днів відновлення та матрицю 35/35...</span>
              </div>
            ) : (
              <p className="text-sm sm:text-base text-[#E4E6F0] font-medium leading-relaxed">
                {adviceData?.advice}
              </p>
            )}
          </div>

          {/* Practical Action Item for Today */}
          {adviceData?.actionItem && (
            <div className="p-3.5 rounded-2xl bg-[#1E253D]/80 border border-[#A390E4]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-1 rounded-lg bg-[#A390E4]/20 text-[#A390E4] shrink-0 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#A390E4] uppercase tracking-wider">
                    Дія на сьогодні від тренера:
                  </div>
                  <div className="text-xs sm:text-sm text-[#E4E6F0] mt-0.5 font-medium">
                    {adviceData.actionItem}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActionDone((prev) => !prev)}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer ${
                  actionDone
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'bg-[#0F1220] hover:bg-[#283152] text-[#E4E6F0] border border-[#262D47]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{actionDone ? 'Виконано' : 'Запланувати'}</span>
              </button>
            </div>
          )}

          {/* Footer note: explain connection with weeklyData and Analytics tab */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] text-[#9FA4BC]">
            <div className="flex items-center gap-2">
              <span>
                Джерело аналізу: 7 днів з тижневої матриці ({weeklyData.reduce((acc, d) => acc + d.nightCycles, 0)} нічних циклів + {weeklyData.filter(d => d.middayCrp || d.eveningCrp).length} CRP)
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('analytics')}
              className="text-[#A390E4] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Переглянути графіки у вкладці «Аналітика»</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Wind-Down Ritual Panel (Expands smoothly when "Почати wind-down" is clicked) */}
      {windDownActive && (
        <div className="rounded-3xl bg-[#131728] border-2 border-[#A390E4]/60 p-6 space-y-6 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262D47]">
            <div>
              <div className="text-xs font-mono text-[#A390E4]">
                ВЕЧІРНІЙ РИТУАЛ WIND-DOWN АКТИВНИЙ ·{' '}
                {Math.floor(windDownSeconds / 60)
                  .toString()
                  .padStart(2, '0')}
                :{(windDownSeconds % 60).toString().padStart(2, '0')}
              </div>
              <h3 className="text-xl font-bold text-[#E4E6F0] mt-1">
                Підготовка нервової системи до першого 90-хвилинного циклу
              </h3>
            </div>
            <button
              onClick={stopWindDownRitual}
              className="min-h-[48px] px-5 py-2.5 rounded-xl bg-[#262D47] hover:bg-[#323B5C] text-xs font-bold text-[#E4E6F0] flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Square className="w-4 h-4" />
              <span>Завершити ритуал</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Step 1: Smart Lighting & Warm Amber Shield */}
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-[#F4A261]">
                  <span>01. Світло та температура</span>
                  <Lamp className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-[#E4E6F0] mt-2">
                  Приглушення Google Home
                </h4>
                <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                  Світло спальні переведено в бурштиновий спектр 2000K (8%), термостат встановлено на 18.0°C, штори закрито.
                </p>
              </div>
              <button
                onClick={() => {
                  setSmartLightDimmed((d) => !d);
                  onTriggerSmartScene('bedtime');
                }}
                className="min-h-[48px] w-full rounded-xl bg-[#1E253D] text-xs font-semibold text-[#F4A261] flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{smartLightDimmed ? 'Сцена «Відбій» активована' : 'Увімкнути сцену «Відбій»'}</span>
              </button>
            </div>

            {/* Step 2: Sleep Melody Audio Player */}
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-[#A390E4]">
                  <span>02. Акустичний купол</span>
                  <Music className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-[#E4E6F0] mt-2">
                  {sleepMelody.title}
                </h4>
                <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                  {sleepMelody.subtitle}. Плавний Media3 fade-out через 45 хвилин після засинання.
                </p>
              </div>
              <button
                onClick={() => {
                  const nowPlaying = sleepCoachMedia.playTrack(sleepMelody, 'sigmoid');
                  setPlayingSleepTrack(nowPlaying);
                }}
                className={`min-h-[48px] w-full rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                  playingSleepTrack
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'bg-[#1E253D] text-[#E4E6F0]'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>{playingSleepTrack ? 'Мелодія лунає (Натисніть для паузи)' : 'Увімкнути мелодію сну'}</span>
              </button>
            </div>

            {/* Step 3: Nasal Breathing Pacer (4-4-6) */}
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs text-[#A390E4]">
                  <span>03. Носове дихання 4–4–6</span>
                  <Wind className="w-4 h-4" />
                </div>
                <h4 className="text-base font-bold text-[#E4E6F0] mt-2">
                  {breathInstruction}
                </h4>
                <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                  Ляжте у позу ембріона на недомінантний бік. Дихайте виключно носом для усунення нічних мікро-пробуджень.
                </p>
              </div>
              <div className="h-12 rounded-xl bg-[#161B2E] border border-[#262D47] flex items-center justify-center overflow-hidden">
                <div
                  className="px-4 py-1.5 rounded-full bg-[#A390E4]/20 text-[#A390E4] text-xs font-mono font-bold transition-transform duration-700"
                  style={{ transform: `scale(${breathScale})` }}
                >
                  Ритм дихання: {14 - breathCycleSec} с
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
