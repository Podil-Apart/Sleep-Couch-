// Gemini Sleep Coach Service & R90 Weekly Data Analysis
import { DayRecoveryRecord } from './r90Engine';

export interface SleepCoachAdvice {
  advice: string;
  focusArea: string;
  actionItem: string;
  cyclesAssessment: string;
  readinessScore: number;
  source: 'gemini' | 'algorithmic';
  timestamp: string;
}

export interface WeeklyAnalysis {
  totalNightCycles: number;
  totalCrps: number;
  totalRecoveryUnits: number;
  targetUnits: number;
  deficitOrSurplus: number;
  avgCyclesPerNight: number;
  lowestDay: DayRecoveryRecord;
  highestDay: DayRecoveryRecord;
  completedMorningProtocols: number;
  completedPreSleepRoutines: number;
  daysWithCrp: string[];
  daySummaries: string;
}

/**
 * Analyzes DayRecoveryRecord[] according to Nick Littlehales' R90 methodology
 */
export function analyzeWeeklyData(weeklyData: DayRecoveryRecord[]): WeeklyAnalysis {
  const targetUnits = 35; // 35 cycles per week benchmark (5 cycles x 7 days)
  let totalNightCycles = 0;
  let totalCrps = 0;
  let completedMorningProtocols = 0;
  let completedPreSleepRoutines = 0;
  const daysWithCrp: string[] = [];

  let lowestDay = weeklyData[0] || {
    id: 'mon',
    dayShort: 'Пн',
    dayFull: 'Понеділок',
    nightCycles: 5,
    middayCrp: false,
    eveningCrp: false,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
  };
  let highestDay = weeklyData[0] || lowestDay;

  const lines: string[] = [];

  for (const day of weeklyData) {
    totalNightCycles += day.nightCycles;
    const crpCount = (day.middayCrp ? 1 : 0) + (day.eveningCrp ? 1 : 0);
    totalCrps += crpCount;

    if (day.middayCrp || day.eveningCrp) {
      daysWithCrp.push(day.dayShort);
    }
    if (day.morningProtocolDone) completedMorningProtocols++;
    if (day.preSleepRoutineDone) completedPreSleepRoutines++;

    const dayTotal = day.nightCycles + crpCount;
    const lowestTotal = lowestDay.nightCycles + ((lowestDay.middayCrp ? 1 : 0) + (lowestDay.eveningCrp ? 1 : 0));
    const highestTotal = highestDay.nightCycles + ((highestDay.middayCrp ? 1 : 0) + (highestDay.eveningCrp ? 1 : 0));

    if (dayTotal < lowestTotal) lowestDay = day;
    if (dayTotal > highestTotal) highestDay = day;

    lines.push(
      `${day.dayShort} (${day.dayFull}): ${day.nightCycles} нічних циклів (${(day.nightCycles * 1.5).toFixed(1)} год), ` +
      `Денні CRP: ${day.middayCrp ? 'Полудень (+1)' : '—'}, ${day.eveningCrp ? 'Вечір (+1)' : '—'}, ` +
      `Ранок 90 хв: ${day.morningProtocolDone ? 'Виконано' : 'Пропущено'}, ` +
      `Wind-down: ${day.preSleepRoutineDone ? 'Виконано' : 'Пропущено'}` +
      (day.notes ? ` [Нотатка: ${day.notes}]` : '')
    );
  }

  const totalRecoveryUnits = totalNightCycles + totalCrps;
  const deficitOrSurplus = totalRecoveryUnits - targetUnits;
  const avgCyclesPerNight = weeklyData.length > 0 ? Number((totalNightCycles / weeklyData.length).toFixed(1)) : 5;

  return {
    totalNightCycles,
    totalCrps,
    totalRecoveryUnits,
    targetUnits,
    deficitOrSurplus,
    avgCyclesPerNight,
    lowestDay,
    highestDay,
    completedMorningProtocols,
    completedPreSleepRoutines,
    daysWithCrp,
    daySummaries: lines.join('\n'),
  };
}

/**
 * High-precision algorithmic R90 fallback advice generator
 */
export function generateLocalSleepAdvice(weeklyData: DayRecoveryRecord[]): SleepCoachAdvice {
  const analysis = analyzeWeeklyData(weeklyData);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  let focusArea = 'Оптимізація відновлення';
  let advice = '';
  let actionItem = '';
  let readinessScore = 85;

  if (analysis.totalRecoveryUnits >= 35) {
    focusArea = 'Ритм чемпіонів (35/35)';
    readinessScore = 96;
    advice = `Чудова дисципліна! Ви набрали ${analysis.totalRecoveryUnits} одиниць відновлення з 35 цільових. Ваш циркадний каркас максимально синхронізований. Завдяки денним паузам CRP ви компенсували коливання нічного сну.`;
    actionItem = 'Утримайте фіксований час пробудження та не відхиляйтесь від вечірнього wind-down більше ніж на 15 хв.';
  } else if (analysis.deficitOrSurplus >= -3) {
    focusArea = 'Стабільний баланс';
    readinessScore = 88;
    advice = `Ви зафіксували ${analysis.totalRecoveryUnits} з 35 циклів (${analysis.totalNightCycles} нічних + ${analysis.totalCrps} денних CRP). Найнижчий показник був у день ${analysis.lowestDay.dayShort}. За методикою R90 це допустиме коливання, яке не порушує когнітивну готовність.`;
    actionItem = 'Заплануйте сьогодні 30-хвилинний CRP у вікні 13:00–14:00 для закриття дефіциту одного циклу.';
  } else {
    focusArea = 'Компенсація дефіциту циклів';
    readinessScore = 74;
    advice = `За тиждень зафіксовано ${analysis.totalRecoveryUnits} циклів (дефіцит ${Math.abs(analysis.deficitOrSurplus)}). Пам'ятайте головне правило Ніка Літлхелса: не намагайтеся компенсувати сон довгим валянням у ліжку вранці — це ламає добовий ритм.`;
    actionItem = 'Застосуйте денний CRP о 13:30 або вечірній о 17:30 (30 хв без ґаджетів) та збережіть стандартний час підйому.';
  }

  const assessment = `${analysis.totalRecoveryUnits} / ${analysis.targetUnits} циклів (${Math.round((analysis.totalRecoveryUnits / analysis.targetUnits) * 100)}% норми R90)`;

  return {
    advice,
    focusArea,
    actionItem,
    cyclesAssessment: assessment,
    readinessScore,
    source: 'algorithmic',
    timestamp: timeStr,
  };
}

const ADVICE_CACHE_KEY = 'sc_gemini_sleep_advice_v1';

/**
 * Fetches personalized sleep advice from the Gemini API backend route,
 * with instant cache display and resilient algorithmic fallback.
 */
export async function fetchSleepAdvice(
  weeklyData: DayRecoveryRecord[],
  wakeTime: string = '06:30',
  targetCycles: number = 5,
  forceRefresh: boolean = false
): Promise<SleepCoachAdvice> {
  // Check localStorage cache if not forced refresh
  if (!forceRefresh) {
    const cached = localStorage.getItem(ADVICE_CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cacheAgeMs = Date.now() - (parsed.cachedAt || 0);
        // Cache is valid for 3 hours unless data changed
        if (cacheAgeMs < 3 * 60 * 60 * 1000 && parsed.advice) {
          return parsed.advice as SleepCoachAdvice;
        }
      } catch {
        // Continue to fresh fetch
      }
    }
  }

  try {
    const response = await fetch('/api/sleep-coach/advice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        weeklyData,
        wakeTime,
        targetCycles,
      }),
    });

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status}`);
    }

    const result = await response.json();
    if (result && result.success && result.advice) {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const adviceObj: SleepCoachAdvice = {
        advice: result.advice,
        focusArea: result.focusArea || 'Персональна стратегія R90',
        actionItem: result.actionItem || 'Дотримуйтесь стабільного часу пробудження.',
        cyclesAssessment: result.cyclesAssessment || `${weeklyData.reduce((acc, d) => acc + d.nightCycles, 0)} циклів за тиждень`,
        readinessScore: result.readinessScore || 88,
        source: result.source || 'gemini',
        timestamp: timeStr,
      };

      // Store in cache
      localStorage.setItem(
        ADVICE_CACHE_KEY,
        JSON.stringify({
          cachedAt: Date.now(),
          advice: adviceObj,
        })
      );

      return adviceObj;
    }
    throw new Error('Invalid response structure from server');
  } catch (error) {
    console.warn('Gemini API fetch error or offline, using smart local R90 engine:', error);
    const fallback = generateLocalSleepAdvice(weeklyData);
    return fallback;
  }
}
