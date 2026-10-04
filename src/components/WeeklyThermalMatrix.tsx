import React, { useState } from 'react';
import { Plus, Minus, RotateCcw, Check } from 'lucide-react';
import { DayRecoveryRecord } from '../utils/r90Engine';

interface WeeklyThermalMatrixProps {
  weeklyData: DayRecoveryRecord[];
  onUpdateDay: (dayId: string, updater: (prev: DayRecoveryRecord) => DayRecoveryRecord) => void;
  onResetIdealWeek: () => void;
  darkMode?: boolean;
}

export const WeeklyThermalMatrix: React.FC<WeeklyThermalMatrixProps> = ({
  weeklyData,
  onUpdateDay,
  onResetIdealWeek,
  darkMode = false,
}) => {
  const [selectedDayId, setSelectedDayId] = useState<string>('fri');

  // Calculate total weekly recovery units (Night cycles + Midday CRP + Evening CRP)
  const totalUnits = weeklyData.reduce(
    (sum, d) => sum + d.nightCycles + (d.middayCrp ? 1 : 0) + (d.eveningCrp ? 1 : 0),
    0
  );
  const totalNightCycles = weeklyData.reduce((sum, d) => sum + d.nightCycles, 0);
  const totalCrpSessions = weeklyData.reduce(
    (sum, d) => sum + (d.middayCrp ? 1 : 0) + (d.eveningCrp ? 1 : 0),
    0
  );

  const selectedDay = weeklyData.find((d) => d.id === selectedDayId) || weeklyData[0];

  const cardSurface = darkMode
    ? 'bg-[#141C2B] border border-slate-800 text-slate-100'
    : 'bg-[#F8F6F1] border border-[#D6D0C4] text-[#1A1E26]';

  return (
    <div className="space-y-6">
      {/* Main Weekly Thermal Matrix Card (Page 6 & Page 15 of PDF) */}
      <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-current/10">
          <div>
            <p className="text-xs opacity-70">
              Синтез системи · Метрика 35 замість щоденної тривоги (Стор. 6, 15)
            </p>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5">
              Тижневий теплокаркас відновлення
            </h2>
            <p className="text-sm opacity-80 mt-1">
              Оцінюйте якість сну не за одну ніч, а за 7 днів. Оптимальна ціль — 35 блоків відновлення на тиждень (у середньому 5 на добу).
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="font-display text-2xl sm:text-3xl font-bold tabular-nums">
                <span className="text-[#C83228]">{totalUnits}</span>
                <span className="opacity-50">/35</span>
              </div>
              <div className="text-xs opacity-75">
                {totalUnits >= 35
                  ? 'Ідеальний тижневий баланс'
                  : totalUnits >= 28
                  ? 'Стабільна робоча зона (28–35)'
                  : `Дефіцит: додайте ${35 - totalUnits} циклів/CRP`}
              </div>
            </div>
            <button
              onClick={onResetIdealWeek}
              className="min-h-[44px] px-3 py-2 rounded-xl border border-current/15 text-xs font-medium flex items-center gap-1.5 hover:bg-current/5 cursor-pointer"
              title="Відновити еталонний тиждень зі Стор. 15"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Еталон 35/35</span>
            </button>
          </div>
        </div>

        {/* 35-Block Linear Bar from Page 6 of PDF */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-semibold">
              [ {totalUnits} / 35 ] {totalUnits >= 35 ? 'Ідеальний баланс' : 'Поточний рахунок тижня'}
            </span>
            <span className="opacity-70">
              Нічні цикли: {totalNightCycles} · Денні паузи CRP: {totalCrpSessions}
            </span>
          </div>
          <div className="grid grid-cols-35 gap-0.5 sm:gap-1 h-5 rounded overflow-hidden">
            {Array.from({ length: 35 }).map((_, idx) => {
              const isFilled = idx < totalUnits;
              const isCrpCompensation = idx >= totalNightCycles && idx < totalUnits;
              return (
                <div
                  key={idx}
                  className={`h-full transition-colors ${
                    !isFilled
                      ? 'bg-current/10'
                      : isCrpCompensation
                      ? 'bg-[#C83228]'
                      : 'bg-[#1A3E72]'
                  }`}
                  title={
                    !isFilled
                      ? 'Вільний слот'
                      : isCrpCompensation
                      ? 'Тактичне відновлення CRP (30 хв)'
                      : 'Нічний 90-хвилинний цикл'
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Interactive 7-Day Thermal Matrix Grid (Exact layout from Page 15: Пн Вт Ср Чт Пт Сб Нд) */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 overflow-x-auto">
            <div className="min-w-[420px]">
              {/* Column Headers: Пн Вт Ср Чт Пт Сб Нд */}
              <div className="grid grid-cols-8 gap-2 pb-2 border-b border-current/10 items-center">
                <div className="text-xs font-semibold opacity-60">Період</div>
                {weeklyData.map((day) => {
                  const isSelected = day.id === selectedDayId;
                  return (
                    <button
                      key={day.id}
                      onClick={() => setSelectedDayId(day.id)}
                      className={`min-h-[44px] rounded-xl font-display text-xs sm:text-sm font-bold flex flex-col items-center justify-center transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#1A3E72] text-white'
                          : 'hover:bg-current/5'
                      }`}
                    >
                      <span>{day.dayShort}</span>
                      <span className="font-mono text-[10px] opacity-80">
                        {day.nightCycles + (day.middayCrp ? 1 : 0) + (day.eveningCrp ? 1 : 0)} бл.
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Row 1: Ніч (Up to 5-6 vertical blue blocks per day, just like Page 15) */}
              <div className="grid grid-cols-8 gap-2 py-4 border-b border-current/10 items-start">
                <div className="text-xs font-semibold pt-1">
                  Ніч
                  <span className="block text-[10px] font-normal opacity-65">Цикли 90 хв</span>
                </div>
                {weeklyData.map((day) => (
                  <div
                    key={day.id}
                    onClick={() => setSelectedDayId(day.id)}
                    className="flex flex-col gap-1.5 items-center cursor-pointer"
                  >
                    {Array.from({ length: 5 }).map((_, slotIdx) => {
                      const active = slotIdx < day.nightCycles;
                      return (
                        <div
                          key={slotIdx}
                          className={`w-9 sm:w-11 h-5 rounded-sm transition-all ${
                            active
                              ? 'bg-[#1A3E72] shadow-xs'
                              : 'border border-dashed border-current/20 bg-transparent'
                          }`}
                        />
                      );
                    })}
                    {day.nightCycles > 5 && (
                      <div className="w-9 sm:w-11 h-5 rounded-sm bg-[#1A3E72] text-white text-[10px] font-mono flex items-center justify-center font-bold">
                        +6
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Row 2: Полудень (12:00 - 14:00) */}
              <div className="grid grid-cols-8 gap-2 py-3.5 border-b border-current/10 items-center">
                <div className="text-xs font-semibold">
                  Полудень
                  <span className="block text-[10px] font-normal opacity-65">12:00–14:00</span>
                </div>
                {weeklyData.map((day) => (
                  <div key={day.id} className="flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedDayId(day.id);
                        onUpdateDay(day.id, (prev) => ({
                          ...prev,
                          middayCrp: !prev.middayCrp,
                        }));
                      }}
                      className={`w-9 sm:w-11 h-6 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                        day.middayCrp
                          ? 'bg-[#C83228] text-white'
                          : 'border border-dashed border-current/25 hover:border-[#C83228]'
                      }`}
                      title={`${day.dayFull}: CRP Полудень (12:00–14:00)`}
                    >
                      {day.middayCrp && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Row 3: Вечір (17:00 - 19:00) */}
              <div className="grid grid-cols-8 gap-2 py-3.5 items-center">
                <div className="text-xs font-semibold">
                  Вечір
                  <span className="block text-[10px] font-normal opacity-65">17:00–19:00</span>
                </div>
                {weeklyData.map((day) => (
                  <div key={day.id} className="flex justify-center">
                    <button
                      onClick={() => {
                        setSelectedDayId(day.id);
                        onUpdateDay(day.id, (prev) => ({
                          ...prev,
                          eveningCrp: !prev.eveningCrp,
                        }));
                      }}
                      className={`w-9 sm:w-11 h-6 rounded-sm transition-all cursor-pointer flex items-center justify-center ${
                        day.eveningCrp
                          ? 'bg-[#C83228] text-white'
                          : 'border border-dashed border-current/25 hover:border-[#C83228]'
                      }`}
                      title={`${day.dayFull}: CRP Вечір (17:00–19:00)`}
                    >
                      {day.eveningCrp && <Check className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right 4 Cols: Selected Day Editor & Tactical Explanation */}
          <div className={`lg:col-span-4 rounded-xl p-4 border border-current/15 ${darkMode ? 'bg-[#0D131D]' : 'bg-white'}`}>
            <div className="flex items-center justify-between pb-3 border-b border-current/10">
              <div>
                <span className="text-xs opacity-65">Налаштування дня</span>
                <h3 className="text-base font-bold">{selectedDay.dayFull}</h3>
              </div>
              <span className="font-mono text-sm font-bold text-[#1A3E72] dark:text-sky-400">
                {selectedDay.nightCycles +
                  (selectedDay.middayCrp ? 1 : 0) +
                  (selectedDay.eveningCrp ? 1 : 0)}{' '}
                блоків
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {/* Adjust Night Cycles */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-medium">Нічні 90-хвилинні цикли:</span>
                  <span className="font-mono font-bold">
                    {selectedDay.nightCycles} ({selectedDay.nightCycles * 1.5} год)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      onUpdateDay(selectedDay.id, (prev) => ({
                        ...prev,
                        nightCycles: Math.max(1, prev.nightCycles - 1),
                      }))
                    }
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-current/15 flex items-center justify-center hover:bg-current/5 cursor-pointer"
                    aria-label="Зменшити кількість нічних циклів"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex-1 text-center font-mono text-sm font-bold">
                    {selectedDay.nightCycles} циклів
                  </div>
                  <button
                    onClick={() =>
                      onUpdateDay(selectedDay.id, (prev) => ({
                        ...prev,
                        nightCycles: Math.min(6, prev.nightCycles + 1),
                      }))
                    }
                    className="min-h-[44px] min-w-[44px] rounded-xl border border-current/15 flex items-center justify-center hover:bg-current/5 cursor-pointer"
                    aria-label="Збільшити кількість нічних циклів"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Toggle Daytime CRP Blocks */}
              <div className="space-y-2 pt-2 border-t border-current/10">
                <button
                  onClick={() =>
                    onUpdateDay(selectedDay.id, (prev) => ({
                      ...prev,
                      middayCrp: !prev.middayCrp,
                    }))
                  }
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    selectedDay.middayCrp
                      ? 'bg-[#C83228] text-white border-[#C83228]'
                      : 'border-current/15 hover:bg-current/5'
                  }`}
                >
                  <span>CRP Полудень (12:00–14:00)</span>
                  <span>{selectedDay.middayCrp ? '+1 блок' : 'Додати'}</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateDay(selectedDay.id, (prev) => ({
                      ...prev,
                      eveningCrp: !prev.eveningCrp,
                    }))
                  }
                  className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border cursor-pointer ${
                    selectedDay.eveningCrp
                      ? 'bg-[#C83228] text-white border-[#C83228]'
                      : 'border-current/15 hover:bg-current/5'
                  }`}
                >
                  <span>CRP Ранній вечір (17:00–19:00)</span>
                  <span>{selectedDay.eveningCrp ? '+1 блок' : 'Додати'}</span>
                </button>
              </div>

              {selectedDay.notes && (
                <p className="text-xs opacity-75 italic pt-2 border-t border-current/10">
                  Нотатка тренера: {selectedDay.notes}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Paradigm Shift Comparison Table from Page 2 & Page 3 of the PDF */}
      <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
        <p className="text-xs opacity-70">
          Джерело системи: Нік Літлхелс · Манчестер Юнайтед (1992) та Збірна Англії (Стор. 2–3)
        </p>
        <h3 className="text-lg font-bold mt-0.5">
          Зміна парадигми: Традиційний підхід проти Підходу чемпіонів
        </h3>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#C83228]/10 border border-[#C83228]/25 space-y-2.5">
            <h4 className="text-sm font-bold text-[#C83228]">Традиційний підхід (Міф про 8 годин)</h4>
            <ul className="text-xs space-y-2 opacity-90">
              <li>• <strong>Метрика успіху:</strong> 8 безперервних годин у ліжку.</li>
              <li>• <strong>Таймлайн:</strong> Планування на одну ніч (тривога через кожне безсоння).</li>
              <li>• <strong>Формат:</strong> Строго монофазний (лише вночі).</li>
              <li>• <strong>Пробудження:</strong> Різкий сигнал будильника посеред фази сну.</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-[#1A3E72]/10 border border-[#1A3E72]/30 space-y-2.5">
            <h4 className="text-sm font-bold text-[#1A3E72] dark:text-sky-400">
              Підхід чемпіонів (Система R90)
            </h4>
            <ul className="text-xs space-y-2 opacity-90">
              <li>• <strong>Метрика успіху:</strong> 90-хвилинні фізіологічні цикли.</li>
              <li>• <strong>Таймлайн:</strong> Планування на 7 днів (35 циклів на тиждень).</li>
              <li>• <strong>Формат:</strong> Поліфазний (нічні цикли + стратегічні денні паузи CRP).</li>
              <li>• <strong>Пробудження:</strong> Симуляція світанку та 90-хвилинний протокол запуску.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
