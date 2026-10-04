import React, { useState, useEffect } from 'react';
import {
  Bell,
  DoorClosed,
  Headphones,
  Activity,
  Play,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  CheckCircle2,
  Send,
} from 'lucide-react';
import { ReminderRule, biometricAudio } from '../utils/r90Engine';

interface DaytimeCrpTrainerProps {
  reminders: ReminderRule[];
  onToggleReminder: (id: string) => void;
  onUpdateReminderTime: (id: string, newTime: string) => void;
  onTriggerTestNotification: (rule: ReminderRule) => void;
  onCompleteCrpSession: (slot: 'midday' | 'evening') => void;
  todayMiddayDone: boolean;
  todayEveningDone: boolean;
  darkMode?: boolean;
}

export const DaytimeCrpTrainer: React.FC<DaytimeCrpTrainerProps> = ({
  reminders,
  onToggleReminder,
  onUpdateReminderTime,
  onTriggerTestNotification,
  onCompleteCrpSession,
  todayMiddayDone,
  todayEveningDone,
  darkMode = false,
}) => {
  // 30-Minute CRP Timer (1800 seconds = 30 minutes = 1/3 standard 90-min cycle, Page 9 of PDF)
  const [selectedSlot, setSelectedSlot] = useState<'midday' | 'evening'>('midday');
  const [crpRunning, setCrpRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(1800);
  const [soundMode, setSoundMode] = useState<'silence' | 'pink_noise' | 'alpha_drone'>('pink_noise');

  useEffect(() => {
    if (!crpRunning) return;
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setCrpRunning(false);
          biometricAudio.stop();
          biometricAudio.playDawnHarmonicChime();
          onCompleteCrpSession(selectedSlot);
          return 1800;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [crpRunning, selectedSlot, onCompleteCrpSession]);

  useEffect(() => {
    return () => {
      biometricAudio.stop();
    };
  }, []);

  const handleStartStopCrp = () => {
    if (crpRunning) {
      setCrpRunning(false);
      biometricAudio.stop();
    } else {
      setCrpRunning(true);
      if (soundMode !== 'silence') {
        biometricAudio.startCrpSoundscape(soundMode);
      }
    }
  };

  const handleChangeSoundMode = (mode: 'silence' | 'pink_noise' | 'alpha_drone') => {
    setSoundMode(mode);
    if (crpRunning) {
      if (mode === 'silence') {
        biometricAudio.stop();
      } else {
        biometricAudio.startCrpSoundscape(mode);
      }
    }
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const progressPct = ((1800 - secondsLeft) / 1800) * 100;

  const cardSurface = darkMode
    ? 'bg-[#141C2B] border border-slate-800 text-slate-100'
    : 'bg-[#F8F6F1] border border-[#D6D0C4] text-[#1A1E26]';

  return (
    <div className="space-y-6">
      {/* Module 2: CRP 30-Minute Tactical Recovery Trainer (Pages 7, 8, 9 of PDF) */}
      <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-current/10">
          <div>
            <p className="text-xs opacity-70">
              Модуль 2 · Біоробочий ритм та експлуатація природних спадів енергії
            </p>
            <h2 className="text-lg sm:text-xl font-bold mt-0.5">
              Контрольовані періоди відновлення (CRP — 30 хвилин)
            </h2>
            <p className="text-sm opacity-80 mt-1">
              Відновлення ≠ Сон. CRP — це тактична 30-хвилинна пауза (1/3 стандартного циклу) для розвантаження нейронів, яка зараховується як повноцінний блок у тижневий баланс 35/35.
            </p>
          </div>

          {/* Slot Selector: Midday (12:00-14:00) vs Early Evening (17:00-19:00) */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/10 shrink-0">
            <button
              onClick={() => setSelectedSlot('midday')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedSlot === 'midday'
                  ? 'bg-[#C83228] text-white shadow-sm'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              Полудень (12:00–14:00) {todayMiddayDone ? '✓' : ''}
            </button>
            <button
              onClick={() => setSelectedSlot('evening')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                selectedSlot === 'evening'
                  ? 'bg-[#C83228] text-white shadow-sm'
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              Ранній вечір (17:00–19:00) {todayEveningDone ? '✓' : ''}
            </button>
          </div>
        </div>

        {/* 3 Pillars of CRP Formula recreated from Page 9 of the PDF + Live 30-Min Timer */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left 7 Cols: Formula CRP (30 хвилин безперервної ізоляції) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-[#1A3E72] dark:text-sky-400">
              Формула CRP: 30 хвилин безперервної ізоляції (Стор. 9)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className={`p-4 rounded-xl border border-current/15 ${darkMode ? 'bg-[#0D131D]' : 'bg-white'}`}>
                <DoorClosed className="w-7 h-7 text-[#1A3E72] dark:text-sky-400" />
                <h3 className="text-sm font-bold mt-3">1. Ізоляція</h3>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">
                  Знайдіть тихе місце. Ізолюйте себе від візуальних подразників (маска на очі або темна кімната).
                </p>
              </div>

              <div className={`p-4 rounded-xl border border-current/15 ${darkMode ? 'bg-[#0D131D]' : 'bg-white'}`}>
                <Headphones className="w-7 h-7 text-[#1A3E72] dark:text-sky-400" />
                <h3 className="text-sm font-bold mt-3">2. Інструменти</h3>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">
                  Спокійна музика, рожевий шум, медитація або повна тиша в навушниках із шумозаглушенням.
                </p>
              </div>

              <div className={`p-4 rounded-xl border border-current/15 ${darkMode ? 'bg-[#0D131D]' : 'bg-white'}`}>
                <Activity className="w-7 h-7 text-[#C83228]" />
                <h3 className="text-sm font-bold mt-3">3. Мета</h3>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">
                  Не намагайтеся заснути. Просто зупиніть обробку інформації та зніміть тривогу.
                </p>
              </div>
            </div>

            {/* Circadian Windows Explanation from Page 8 */}
            <div className="p-4 rounded-xl bg-current/5 text-xs space-y-1.5">
              <div className="font-bold">
                Спіть двічі або тричі на добу: менше вночі, більше вдень (Стор. 8)
              </div>
              <p className="opacity-80">
                • <strong>Полудень (12:00 – 14:00)</strong>: Другий природний біологічний період для сну та перезавантаження.
                <br />• <strong>Ранній вечір (17:00 – 19:00)</strong>: Критичне вікно для мікро-відновлення після робочого дня, щоб не заснути занадто рано перед вечірнім циклом.
              </p>
            </div>
          </div>

          {/* Right 5 Cols: Interactive 30-Minute CRP Isolation Timer & Audio Generator */}
          <div
            className={`lg:col-span-5 rounded-2xl p-5 border-2 flex flex-col justify-between ${
              crpRunning
                ? 'border-[#C83228] bg-[#C83228]/5'
                : 'border-[#1A3E72]/40 bg-current/[0.03]'
            }`}
          >
            <div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold">
                  {selectedSlot === 'midday'
                    ? 'Сесія CRP: Полудень (12:00–14:00)'
                    : 'Сесія CRP: Ранній вечір (17:00–19:00)'}
                </span>
                <span className="font-mono opacity-75">1/3 циклу</span>
              </div>

              <div className="my-5 text-center">
                <div className="font-mono text-4xl sm:text-5xl font-bold tabular-nums tracking-tight">
                  {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </div>
                <p className="text-xs opacity-75 mt-1">
                  {crpRunning
                    ? 'Йде розвантаження нейронів — відкладіть смартфон'
                    : 'Натисніть старт для 30-хвилинної паузи відновлення'}
                </p>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-current/10 overflow-hidden mb-4">
                <div
                  className="h-full bg-[#C83228] transition-transform duration-300 origin-left"
                  style={{ transform: `scaleX(${Math.max(0.02, progressPct / 100)})` }}
                />
              </div>

              {/* Audio Isolation Selector */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium opacity-80 block">
                  Аудіо-інструмент ізоляції:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'pink_noise', label: 'Рожевий шум' },
                    { id: 'alpha_drone', label: 'Тон 174 Гц' },
                    { id: 'silence', label: 'Повна тиша' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() =>
                        handleChangeSoundMode(m.id as 'silence' | 'pink_noise' | 'alpha_drone')
                      }
                      className={`min-h-[40px] px-2 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        soundMode === m.id
                          ? 'bg-[#1A3E72] text-white'
                          : 'bg-current/5 hover:bg-current/10'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStartStopCrp}
                  className={`flex-1 min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    crpRunning ? 'bg-[#C83228] hover:bg-[#A8251D]' : 'bg-[#1A3E72] hover:bg-[#143059]'
                  }`}
                >
                  {crpRunning ? (
                    <>
                      <Square className="w-4 h-4" />
                      <span>Пауза CRP</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Запустити 30 хв CRP</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCrpRunning(false);
                    biometricAudio.stop();
                    setSecondsLeft(1800);
                  }}
                  className="min-h-[44px] min-w-[44px] rounded-xl border border-current/15 flex items-center justify-center hover:bg-current/5 cursor-pointer"
                  title="Скинути таймер"
                  aria-label="Скинути таймер"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => onCompleteCrpSession(selectedSlot)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-current/20 text-xs font-semibold flex items-center justify-center gap-2 hover:bg-current/5 transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {(selectedSlot === 'midday' && todayMiddayDone) ||
                  (selectedSlot === 'evening' && todayEveningDone)
                    ? '✓ Цю паузу CRP вже зараховано в сьогоднішній баланс'
                    : 'Відмітити завершення CRP (+1 блок до тижневого рахунку 35)'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daytime & Circadian Reminders Schedule Engine */}
      <div className={`rounded-2xl p-5 sm:p-6 ${cardSurface}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-current/10">
          <div>
            <p className="text-xs opacity-70">Автоматичний розклад сповіщень Android / Web</p>
            <h3 className="text-lg font-bold mt-0.5">
              Нагадування про відпочинок та цикли впродовж дня
            </h3>
            <p className="text-xs opacity-80 mt-0.5">
              Налаштуйте точний час спрацьовування для кожного циркадного вікна згідно правил системи.
            </p>
          </div>
        </div>

        <div className="mt-4 divide-y divide-current/10">
          {reminders.map((rule) => (
            <div
              key={rule.id}
              className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                  <span>{rule.moduleRef}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono font-semibold text-[#C83228]">
                    Вікно: {rule.timeWindow}
                  </span>
                </div>
                <div className="text-sm font-bold">{rule.title}</div>
                <p className="text-xs opacity-80 max-w-2xl">{rule.description}</p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <input
                  type="time"
                  value={rule.triggerTime}
                  onChange={(e) => onUpdateReminderTime(rule.id, e.target.value)}
                  aria-label={`Час нагадування для ${rule.title}`}
                  className={`min-h-[44px] px-2.5 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                    darkMode
                      ? 'bg-[#0D131D] border-slate-700 text-slate-100'
                      : 'bg-white border-[#D6D0C4] text-[#1A1E26]'
                  }`}
                />

                <button
                  onClick={() => onTriggerTestNotification(rule)}
                  className="min-h-[44px] px-3 py-2 rounded-xl border border-current/15 text-xs font-medium flex items-center gap-1.5 hover:bg-current/5 transition-colors cursor-pointer"
                  title="Перевірити сповіщення зараз"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Тест</span>
                </button>

                <button
                  onClick={() => onToggleReminder(rule.id)}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                    rule.enabled
                      ? 'bg-[#1A3E72] text-white'
                      : 'bg-current/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  {rule.enabled ? 'Увімкнено' : 'Вимкнено'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
