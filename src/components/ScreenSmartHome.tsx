import React, { useState } from 'react';
import {
  Home,
  Watch,
  Lamp,
  Thermometer,
  Blinds,
  Speaker,
  CheckCircle2,
  Activity,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  SmartHomeDevice,
  WearableDevice,
  sleepCoachMedia,
  BUILTIN_MELODIES,
} from '../utils/sleepCoachEngine';

interface ScreenSmartHomeProps {
  smartDevices: SmartHomeDevice[];
  onToggleSmartDevice: (id: string) => void;
  onTestSmartDevice: (id: string) => void;
  wearables: WearableDevice[];
  onToggleWearable: (id: string) => void;
  onTestWearable: (id: string) => void;
  googleHomeAuthorized: boolean;
  onToggleGoogleHomeAuth: () => void;
  onTriggerScene: (scene: 'bedtime' | 'morning') => void;
  activeSceneBanner: string | null;
}

export const ScreenSmartHome: React.FC<ScreenSmartHomeProps> = ({
  smartDevices,
  onToggleSmartDevice,
  onTestSmartDevice,
  wearables,
  onToggleWearable,
  onTestWearable,
  googleHomeAuthorized,
  onToggleGoogleHomeAuth,
  onTriggerScene,
  activeSceneBanner,
}) => {
  const [testedWearableResult, setTestedWearableResult] = useState<{
    name: string;
    restingHr: number;
    hrvMs: number;
    spo2Pct: number;
    deepSleepMins: number;
  } | null>(null);

  const [selectedSources, setSelectedSources] = useState({
    sleepStages: 'Wear OS · Pixel Watch 3',
    hrvAndHr: 'Wear OS · Pixel Watch 3',
    respiration: 'Автоматичний пріоритет Health Connect',
  });

  const getDeviceIcon = (type: SmartHomeDevice['type']) => {
    if (type === 'light') return Lamp;
    if (type === 'thermostat') return Thermometer;
    if (type === 'blinds') return Blinds;
    return Speaker;
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Google Home OAuth & Smart Scenes ("Відбій" and "Ранок") */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#262D47]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A390E4]">
              <Home className="w-4 h-4" />
              <span>Google Home APIs · OAuth 2.0 Automation</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-1">
              Розумний дім Google Home: Сцени «Відбій» та «Ранок»
            </h2>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              Синхронізація освітлення спальні, термостата та штор із вашим будильником та ритуалом wind-down.
            </p>
          </div>

          <button
            onClick={onToggleGoogleHomeAuth}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer ${
              googleHomeAuthorized
                ? 'bg-[#1E253D] border border-[#A390E4] text-[#A390E4]'
                : 'bg-[#A390E4] text-[#0F1220]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {googleHomeAuthorized
                ? 'Google Home OAuth Підключено'
                : 'Авторизувати Google Home OAuth'}
            </span>
          </button>
        </div>

        {activeSceneBanner && (
          <div className="p-4 rounded-2xl bg-[#1E253D] border border-[#F4A261]/60 text-xs font-semibold text-[#F4A261] flex items-center justify-between">
            <span>{activeSceneBanner}</span>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          </div>
        )}

        {/* Two Master Scenes: "Відбій" and "Ранок" */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono text-[#A390E4]">СЦЕНА 01 · ВЕЧІР</span>
              <h3 className="text-base font-bold text-[#E4E6F0] mt-1">
                Сцена «Відбій» (Приглушення та прохолода)
              </h3>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                Світло плавно приглушується до теплого бурштинового (8%), термостат знижує температуру спальні до 18.0°C, моторизовані штори закриваються на 100%.
              </p>
            </div>
            <button
              onClick={() => onTriggerScene('bedtime')}
              className="min-h-[48px] w-full rounded-xl bg-[#A390E4] text-[#0F1220] text-xs font-bold hover:bg-[#B3A2EC] transition-colors cursor-pointer"
            >
              Запустити сцену «Відбій» (Тест)
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono text-[#F4A261]">СЦЕНА 02 · СВІТАНОК</span>
              <h3 className="text-base font-bold text-[#E4E6F0] mt-1">
                Сцена «Ранок» (Синхронно з мелодією будильника)
              </h3>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                За 20 хв до пробудження світло наростає синхронно з fade-in кривою мелодії, штори відкриваються, а термостат підігріває спальню до 21.0°C.
              </p>
            </div>
            <button
              onClick={() => {
                onTriggerScene('morning');
                sleepCoachMedia.playTrack(BUILTIN_MELODIES[2], 'sigmoid');
              }}
              className="min-h-[48px] w-full rounded-xl bg-[#F4A261] text-[#0F1220] text-xs font-bold hover:bg-[#F6B17A] transition-colors cursor-pointer"
            >
              Запустити сцену «Ранок» зі звуком (Тест)
            </button>
          </div>
        </div>

        {/* Smart Home Devices List with Connect / Disconnect / Test buttons */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-[#9FA4BC]">
            Пристрої спальні Google Home (Підключити / Відключити / Тест)
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {smartDevices.map((dev) => {
              const IconComp = getDeviceIcon(dev.type);
              return (
                <div
                  key={dev.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between gap-4 ${
                    dev.connected
                      ? 'bg-[#0F1220] border-[#262D47]'
                      : 'bg-[#0F1220]/50 border-[#1D2238] opacity-75'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#161B2E] flex items-center justify-center text-[#A390E4] shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#E4E6F0]">{dev.name}</div>
                        <div className="text-xs text-[#9FA4BC] mt-0.5">
                          Відбій: {dev.bedtimeState}
                        </div>
                        <div className="text-xs text-[#9FA4BC]">
                          Ранок: {dev.morningState}
                        </div>
                        {dev.lastTested && (
                          <div className="text-[11px] font-mono text-[#F4A261] mt-1">
                            ✓ Перевірено: {dev.lastTested}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons: Підключити / Відключити + Тест (min 48dp touch height) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-[#262D47]">
                    <button
                      onClick={() => onToggleSmartDevice(dev.id)}
                      className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        dev.connected
                          ? 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#232B47]'
                          : 'bg-[#A390E4] text-[#0F1220]'
                      }`}
                    >
                      {dev.connected ? 'Відключити' : 'Підключити'}
                    </button>

                    <button
                      onClick={() => onTestSmartDevice(dev.id)}
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#2A3354] text-xs font-bold text-[#F4A261] cursor-pointer"
                    >
                      Тест
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Health Connect Wearables (Wear OS, Fitbit, Garmin, Xiaomi) */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262D47]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#F4A261]">
              <Watch className="w-4 h-4" />
              <span>Android Health Connect API · Wearables Sync</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-1">
              Гаджети та трекери сну (Wear OS, Garmin, Fitbit, Xiaomi)
            </h2>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              Керуйте джерелами біометричних даних для точного визначення фази пробудження.
            </p>
          </div>
        </div>

        {/* Live Telemetry Test Output Box */}
        {testedWearableResult && (
          <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#A390E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-[#A390E4]">
                ТЕСТ СИНХРОНІЗАЦІЇ HEALTH CONNECT · {testedWearableResult.name}
              </div>
              <div className="text-sm font-bold text-[#E4E6F0] mt-0.5">
                Пакет біометрії успішно отримано: ЧСС у спокої {testedWearableResult.restingHr} уд/хв · HRV{' '}
                {testedWearableResult.hrvMs} мс · SpO2 {testedWearableResult.spo2Pct}% · Глибокий сон{' '}
                {testedWearableResult.deepSleepMins} хв
              </div>
            </div>
            <button
              onClick={() => setTestedWearableResult(null)}
              className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#161B2E] text-xs font-semibold text-[#9FA4BC] self-start sm:self-auto cursor-pointer"
            >
              Сховати
            </button>
          </div>
        )}

        {/* Wearables Grid with Connect / Disconnect / Test */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {wearables.map((w) => (
            <div
              key={w.id}
              className={`p-5 rounded-2xl border flex flex-col justify-between gap-4 ${
                w.connected
                  ? 'bg-[#0F1220] border-[#A390E4]/60'
                  : 'bg-[#0F1220]/60 border-[#262D47]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-[#9FA4BC]">{w.brand}</span>
                  <span className="font-mono text-xs text-[#A390E4]">
                    Заряд {w.batteryPct}%
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#E4E6F0] mt-1">{w.name}</h3>
                <p className="text-xs text-[#9FA4BC] mt-0.5">
                  Синхронізація: {w.lastSync}
                </p>
                <div className="mt-2 text-xs text-[#9FA4BC]">
                  Дані: {w.metricsProvided.join(' · ')}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[#262D47]">
                <button
                  onClick={() => onToggleWearable(w.id)}
                  className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    w.connected
                      ? 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#232B47]'
                      : 'bg-[#A390E4] text-[#0F1220]'
                  }`}
                >
                  {w.connected ? 'Відключити' : 'Підключити'}
                </button>

                <button
                  onClick={() => {
                    onTestWearable(w.id);
                    setTestedWearableResult({
                      name: w.name,
                      ...w.testSample,
                    });
                  }}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#293252] text-xs font-bold text-[#F4A261] cursor-pointer"
                >
                  Тест
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Health Connect Data Source Priority Selector */}
        <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <span className="text-[#9FA4BC] block">Джерело фаз сну:</span>
            <strong className="text-[#E4E6F0] mt-0.5 block">
              {selectedSources.sleepStages}
            </strong>
          </div>
          <div>
            <span className="text-[#9FA4BC] block">Джерело пульсу та HRV:</span>
            <strong className="text-[#E4E6F0] mt-0.5 block">
              {selectedSources.hrvAndHr}
            </strong>
          </div>
          <div>
            <span className="text-[#9FA4BC] block">Пріоритет Health Connect:</span>
            <strong className="text-[#A390E4] mt-0.5 block">
              {selectedSources.respiration}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
};
