import React, { useState } from 'react';
import {
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Calendar,
  Clock,
  Activity,
} from 'lucide-react';
import {
  LAST_NIGHT_HYPNOGRAM,
  WEEKLY_TREND_DATA,
  MONTHLY_TREND_DATA,
} from '../utils/sleepCoachEngine';
import { DayRecoveryRecord } from '../utils/r90Engine';

interface ScreenAnalyticsProps {
  weeklyData: DayRecoveryRecord[];
  onUpdateDay: (dayId: string, updater: (prev: DayRecoveryRecord) => DayRecoveryRecord) => void;
}

export const ScreenAnalytics: React.FC<ScreenAnalyticsProps> = ({
  weeklyData,
  onUpdateDay,
}) => {
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const [selectedBarIdx, setSelectedBarIdx] = useState<number>(6);

  const trendData = period === 'week' ? WEEKLY_TREND_DATA : MONTHLY_TREND_DATA;
  const activePoint = trendData[selectedBarIdx] || trendData[0];

  const totalWeeklyR90Blocks = weeklyData.reduce(
    (sum, d) => sum + d.nightCycles + (d.middayCrp ? 1 : 0) + (d.eveningCrp ? 1 : 0),
    0
  );

  // Stage colors and heights for Hypnogram
  const stageMeta = {
    awake: { label: 'Пробудження', color: '#F4A261', row: 0 },
    rem: { label: 'REM (Сновидіння)', color: '#A390E4', row: 1 },
    light: { label: 'Легкий сон', color: '#6475B8', row: 2 },
    deep: { label: 'Глибокий NREM', color: '#3E4C8A', row: 3 },
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Core Metrics: Sleep Score, Regularity, Social Jetlag */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-[#161B2E] border border-[#262D47]">
          <span className="text-xs text-[#9FA4BC]">Індекс відновлення</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-extrabold text-[#A390E4] tabular-nums">
              88
            </span>
            <span className="text-xs text-[#9FA4BC]">/ 100 · Високий</span>
          </div>
          <p className="text-xs text-[#9FA4BC] mt-2">
            5 повних 90-хвилинних циклів без переривання глибокої фази.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#161B2E] border border-[#262D47]">
          <span className="text-xs text-[#9FA4BC]">Регулярність графіка</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-extrabold text-[#E4E6F0] tabular-nums">
              94%
            </span>
            <span className="text-xs text-[#A390E4]">Стабільний підйом</span>
          </div>
          <p className="text-xs text-[#9FA4BC] mt-2">
            Відхилення часу пробудження за останні 7 днів менше ±12 хв.
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-[#161B2E] border border-[#262D47]">
          <span className="text-xs text-[#9FA4BC]">«Соціальний джетлаг»</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-display text-3xl font-extrabold text-[#F4A261] tabular-nums">
              +22 хв
            </span>
            <span className="text-xs text-[#9FA4BC]">Будні vs Вихідні</span>
          </div>
          <p className="text-xs text-[#9FA4BC] mt-2">
            Норма до 30 хв. Ваші біологічні годинники не збиваються у вихідні.
          </p>
        </div>
      </div>

      {/* Section 2: Plain-Language Explanation & 2 Personal Daily Tips */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#A390E4]/40 p-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#A390E4]">
          <Sparkles className="w-4 h-4" />
          <span>Пояснення простою мовою та персональні поради на сьогодні</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-2">
          Ваше тіло отримало достатньо фізичного відновлення в першій половині ночі
        </h2>
        <p className="text-sm text-[#9FA4BC] mt-1 leading-relaxed">
          Минулої ночі ви заснули о 23:05 — вчасно для першого глибокого циклу. Саме між 23:30 та 02:30 відбулося 70% вашого глибокого сну (1г 46хв), коли відновлюються м’язи та імунітет. Соціальний джетлаг становить лише 22 хвилини, тому ранковий підйом о 06:30 пройшов легко.
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#A390E4] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#E4E6F0]">
                Порада 1: Збережіть вікно мікропаузи о 13:15
              </div>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                Оскільки в п’ятницю було 4 цикли замість 5, сьогоднішня 20-хвилинна ізоляція в полудень повністю закриє тижневий рахунок 35/35.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#F4A261] shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-[#E4E6F0]">
                Порада 2: Останній кофеїн не пізніше 14:30
              </div>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                Це дозволить зберегти 25% частку глибокого сну та уникнути мікро-пробуджень о 03:50 ранку.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Sleep Stages Graph (Глибокий / Легкий / REM) */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#262D47]">
          <div>
            <span className="text-xs text-[#9FA4BC]">Гіпнограма останньої ночі (23:05 – 06:18)</span>
            <h3 className="text-lg font-bold text-[#E4E6F0] mt-0.5">
              Графік фаз сну: Глибокий · Легкий · REM
            </h3>
          </div>
          <span className="font-mono text-xs text-[#A390E4]">
            Загальний час: 7г 12хв (5 циклів)
          </span>
        </div>

        {/* Visual Hypnogram Timeline */}
        <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-3">
          <div className="grid grid-cols-16 gap-1 h-28 items-end">
            {LAST_NIGHT_HYPNOGRAM.map((seg, idx) => {
              const heightMap = {
                awake: 'h-24 bg-[#F4A261]',
                rem: 'h-20 bg-[#A390E4]',
                light: 'h-14 bg-[#5B6DB2]',
                deep: 'h-8 bg-[#354482]',
              };
              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end group">
                  <div
                    className={`w-full rounded-t-md transition-opacity group-hover:opacity-100 opacity-90 ${heightMap[seg.stage]}`}
                    title={`${seg.timeLabel} — ${stageMeta[seg.stage].label} (${seg.durationMins} хв)`}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between font-mono text-[11px] text-[#9FA4BC] pt-1 border-t border-[#262D47]">
            <span>23:05</span>
            <span>01:00</span>
            <span>03:00</span>
            <span>05:00</span>
            <span>06:18</span>
          </div>
        </div>

        {/* Stage Breakdown Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Глибокий сон', val: '1г 46хв', pct: '25%', color: 'bg-[#354482]' },
            { label: 'REM (Сновидіння)', val: '1г 36хв', pct: '22%', color: 'bg-[#A390E4]' },
            { label: 'Легкий сон', val: '3г 32хв', pct: '49%', color: 'bg-[#5B6DB2]' },
            { label: 'Пробудження', val: '0г 18хв', pct: '4%', color: 'bg-[#F4A261]' },
          ].map((st) => (
            <div
              key={st.label}
              className="p-3.5 rounded-2xl bg-[#0F1220] border border-[#262D47]"
            >
              <div className="flex items-center gap-2 text-xs text-[#9FA4BC]">
                <span className={`w-2.5 h-2.5 rounded-full ${st.color}`} />
                <span className="truncate">{st.label}</span>
              </div>
              <div className="mt-1.5 flex items-baseline justify-between">
                <span className="font-mono text-base font-bold text-[#E4E6F0] tabular-nums">
                  {st.val}
                </span>
                <span className="font-mono text-xs text-[#9FA4BC]">{st.pct}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section 4: Weekly & Monthly Trend + R90 35/35 Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="text-xs text-[#9FA4BC]">Динаміка якості та тривалості</span>
              <h3 className="text-lg font-bold text-[#E4E6F0] mt-0.5">
                Тренд за тиждень і місяць
              </h3>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#0F1220] border border-[#262D47]">
              <button
                onClick={() => {
                  setPeriod('week');
                  setSelectedBarIdx(6);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  period === 'week'
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'text-[#9FA4BC]'
                }`}
              >
                Тиждень
              </button>
              <button
                onClick={() => {
                  setPeriod('month');
                  setSelectedBarIdx(3);
                }}
                className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  period === 'month'
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'text-[#9FA4BC]'
                }`}
              >
                Місяць
              </button>
            </div>
          </div>

          {/* Interactive Bar Chart */}
          <div className="grid grid-cols-7 gap-2 items-end h-44 pt-4 px-2">
            {trendData.map((pt, idx) => {
              const isSelected = idx === selectedBarIdx;
              const heightPct = Math.round((pt.score / 100) * 100);
              return (
                <button
                  key={pt.label}
                  onClick={() => setSelectedBarIdx(idx)}
                  className="h-full flex flex-col items-center justify-end gap-2 cursor-pointer group"
                >
                  <span className="font-mono text-[10px] text-[#9FA4BC] tabular-nums">
                    {pt.score}
                  </span>
                  <div className="w-full max-w-[38px] bg-[#0F1220] rounded-xl h-28 flex items-end p-1 border border-[#262D47]">
                    <div
                      className={`w-full rounded-lg transition-all ${
                        isSelected
                          ? 'bg-[#A390E4]'
                          : 'bg-[#354482] group-hover:bg-[#5B6DB2]'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-[#A390E4]' : 'text-[#9FA4BC]'
                    }`}
                  >
                    {pt.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-wrap items-center justify-between gap-2 text-xs">
            <span>
              Обраний період: <strong className="text-[#E4E6F0]">{activePoint.label}</strong>
            </span>
            <span className="font-mono text-[#A390E4]">
              Sleep Score: {activePoint.score} · Сон: {activePoint.sleepHours} год · Глибокий:{' '}
              {activePoint.deepMins} хв
            </span>
          </div>
        </div>

        {/* Right 5 Cols: R90 35/35 Weekly Cycle Balance */}
        <div className="lg:col-span-5 rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#9FA4BC]">Тижневий баланс R90</span>
              <span className="font-mono text-sm font-bold text-[#F4A261]">
                {totalWeeklyR90Blocks} / 35 блоків
              </span>
            </div>
            <h3 className="text-base font-bold text-[#E4E6F0] mt-1">
              Теплокаркас циклів та денних мікропауз
            </h3>
            <p className="text-xs text-[#9FA4BC] mt-1">
              Тапніть на день, щоб додати або зняти денну мікропаузу CRP для компенсації пізньої п’ятниці.
            </p>
          </div>

          <div className="space-y-2">
            {weeklyData.map((day) => {
              const dayBlocks =
                day.nightCycles + (day.middayCrp ? 1 : 0) + (day.eveningCrp ? 1 : 0);
              return (
                <div
                  key={day.id}
                  onClick={() =>
                    onUpdateDay(day.id, (prev) => ({
                      ...prev,
                      middayCrp: !prev.middayCrp,
                    }))
                  }
                  className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#0F1220] border border-[#262D47] hover:border-[#A390E4]/50 flex items-center justify-between gap-2 cursor-pointer"
                >
                  <span className="text-xs font-bold w-8">{day.dayShort}</span>
                  <div className="flex items-center gap-1 flex-1">
                    {Array.from({ length: day.nightCycles }).map((_, i) => (
                      <span
                        key={i}
                        className="h-3.5 w-5 rounded-xs bg-[#5B6DB2]"
                        title="Нічний 90-хв цикл"
                      />
                    ))}
                    {day.middayCrp && (
                      <span
                        className="h-3.5 w-5 rounded-xs bg-[#F4A261]"
                        title="CRP Полудень"
                      />
                    )}
                    {day.eveningCrp && (
                      <span
                        className="h-3.5 w-5 rounded-xs bg-[#A390E4]"
                        title="CRP Вечір"
                      />
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#9FA4BC] tabular-nums">
                    {dayBlocks} бл.
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
