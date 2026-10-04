import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Music,
  Home,
  Watch,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  Play,
} from 'lucide-react';
import {
  MelodyTrack,
  sleepCoachMedia,
} from '../utils/sleepCoachEngine';
import { formatMinutesToTime, parseTimeToMinutes } from '../utils/r90Engine';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCycles: number;
  onChangeTargetCycles: (c: number) => void;
  wakeTime: string;
  onChangeWakeTime: (t: string) => void;
  melodies: MelodyTrack[];
  wakeMelodyId: string;
  onSelectWakeMelody: (id: string) => void;
  googleHomeAuthorized: boolean;
  onConnectGoogleHome: () => void;
  wearableConnected: boolean;
  onConnectPrimaryWearable: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  targetCycles,
  onChangeTargetCycles,
  wakeTime,
  onChangeWakeTime,
  melodies,
  wakeMelodyId,
  onSelectWakeMelody,
  googleHomeAuthorized,
  onConnectGoogleHome,
  wearableConnected,
  onConnectPrimaryWearable,
}) => {
  const [step, setStep] = useState<number>(1);

  if (!isOpen) return null;

  const wakeMins = parseTimeToMinutes(wakeTime);
  const bedTime = formatMinutesToTime(wakeMins - targetCycles * 90);

  const handleFinish = () => {
    sleepCoachMedia.stop();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4"
      onClick={handleFinish}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 sm:p-7 text-[#E4E6F0] shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Step Indicator Header */}
        <div className="flex items-center justify-between border-b border-[#262D47] pb-4">
          <div>
            <span className="text-xs font-mono text-[#A390E4]">
              ОНБОРДИНГ SLEEP COACH · КРОК {step} З 5
            </span>
            <div className="flex items-center gap-1.5 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-9 rounded-full transition-colors ${
                    s <= step ? 'bg-[#A390E4]' : 'bg-[#262D47]'
                  }`}
                />
              ))}
            </div>
          </div>
          <button
            onClick={handleFinish}
            className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0F1220] flex items-center justify-center text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
            aria-label="Закрити онбординг"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Ціль сну */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#A390E4]/15 flex items-center justify-center text-[#A390E4]">
              <Moon className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">1. Оберіть вашу ціль сну</h2>
            <p className="text-xs text-[#9FA4BC] leading-relaxed">
              Замість міфу про «8 годин» ми використовуємо 90-хвилинні фізіологічні цикли. Оберіть комфортну ціль на ніч:
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                { cycles: 4, label: '6 год 00 хв', desc: '4 цикли · Активний будній режим' },
                { cycles: 5, label: '7 год 30 хв', desc: '5 циклів · Золотий стандарт R90' },
                { cycles: 5.5, label: '8 год 15 хв', desc: 'Розширене відновлення' },
                { cycles: 6, label: '9 год 00 хв', desc: '6 циклів · Спорт та навантаження' },
              ].map((opt) => (
                <button
                  key={opt.cycles}
                  onClick={() => onChangeTargetCycles(opt.cycles)}
                  className={`min-h-[68px] p-3.5 rounded-2xl border text-left transition-colors cursor-pointer ${
                    targetCycles === opt.cycles
                      ? 'bg-[#A390E4] text-[#0F1220] border-[#A390E4] font-bold'
                      : 'bg-[#0F1220] border-[#262D47] text-[#E4E6F0]'
                  }`}
                >
                  <div className="font-mono text-sm font-bold">{opt.label}</div>
                  <div className="text-[11px] opacity-80 mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Бажаний час пробудження */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F4A261]/15 flex items-center justify-center text-[#F4A261]">
              <Sun className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">2. Бажаний час пробудження</h2>
            <p className="text-xs text-[#9FA4BC] leading-relaxed">
              Фіксований час підйому — головний якір вашого біоритму. Sleep Coach автоматично розрахує ідеальний час відбою ({bedTime}).
            </p>
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between">
              <div>
                <span className="text-xs text-[#9FA4BC] block">Час підйому</span>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => onChangeWakeTime(e.target.value || '06:30')}
                  className="mt-1 bg-transparent font-display text-3xl font-extrabold text-[#F4A261] focus:outline-none cursor-pointer tabular-nums"
                />
              </div>
              <div className="text-right">
                <span className="text-xs text-[#9FA4BC] block">Розрахунковий відбій</span>
                <span className="font-display text-2xl font-bold text-[#A390E4] tabular-nums">
                  {bedTime}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Вибір мелодії */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#A390E4]/15 flex items-center justify-center text-[#A390E4]">
              <Music className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">3. Вибір мелодії пробудження</h2>
            <p className="text-xs text-[#9FA4BC] leading-relaxed">
              Мелодія будильника плавно наростатиме за 20 хвилин до {wakeTime} за сигмоїдною кривою:
            </p>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {melodies.slice(0, 4).map((m) => {
                const selected = m.id === wakeMelodyId;
                return (
                  <div
                    key={m.id}
                    onClick={() => onSelectWakeMelody(m.id)}
                    className={`min-h-[56px] p-3.5 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer ${
                      selected
                        ? 'bg-[#1E253D] border-[#A390E4]'
                        : 'bg-[#0F1220] border-[#262D47]'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold truncate">{m.title}</div>
                      <div className="text-xs text-[#9FA4BC] truncate">{m.subtitle}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sleepCoachMedia.playTrack(m, 'sigmoid');
                      }}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#161B2E] text-xs font-semibold text-[#F4A261] flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Тест</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Підключення Google Home (можна пропустити) */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#A390E4]/15 flex items-center justify-center text-[#A390E4]">
              <Home className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">4. Підключення Google Home</h2>
            <p className="text-xs text-[#9FA4BC] leading-relaxed">
              Дозвольте Sleep Coach автоматично приглушувати розумне світло у сцені «Відбій» та плавно вмикати світанок у сцені «Ранок». Цей крок можна пропустити.
            </p>
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Google Home APIs (OAuth 2.0)</div>
                <div className="text-xs text-[#9FA4BC] mt-0.5">
                  Світло Philips Hue · Термостат Nest · Штори
                </div>
              </div>
              <button
                onClick={onConnectGoogleHome}
                className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  googleHomeAuthorized
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#A390E4] text-[#0F1220]'
                }`}
              >
                {googleHomeAuthorized ? '✓ Підключено' : 'Підключити'}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Підключення гаджета (можна пропустити) */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#F4A261]/15 flex items-center justify-center text-[#F4A261]">
              <Watch className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold">5. Підключення гаджета (Health Connect)</h2>
            <p className="text-xs text-[#9FA4BC] leading-relaxed">
              Синхронізуйте годинник або браслет (Wear OS, Garmin, Fitbit, Xiaomi) через Android Health Connect для аналізу фаз сну та пульсу. Можна пропустити.
            </p>
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between">
              <div>
                <div className="text-sm font-bold">Health Connect · Wearables</div>
                <div className="text-xs text-[#9FA4BC] mt-0.5">
                  Читання фаз REM/Глибокого сну, HRV та ЧСС
                </div>
              </div>
              <button
                onClick={onConnectPrimaryWearable}
                className={`min-h-[48px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  wearableConnected
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-[#F4A261] text-[#0F1220]'
                }`}
              >
                {wearableConnected ? '✓ Підключено' : 'Підключити'}
              </button>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-4 border-t border-[#262D47] flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="min-h-[48px] px-4 py-2.5 rounded-xl bg-[#0F1220] border border-[#262D47] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Назад</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {(step === 4 || step === 5) && (
              <button
                onClick={() => (step === 5 ? handleFinish() : setStep(step + 1))}
                className="min-h-[48px] px-4 py-2.5 rounded-xl text-xs font-semibold text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
              >
                Пропустити
              </button>
            )}

            <button
              onClick={() => (step < 5 ? setStep(step + 1) : handleFinish())}
              className="min-h-[48px] px-6 py-2.5 rounded-xl bg-[#A390E4] text-[#0F1220] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span>{step < 5 ? 'Далі' : 'Завершити налаштування'}</span>
              {step < 5 ? <ChevronRight className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
