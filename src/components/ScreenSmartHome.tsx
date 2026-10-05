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
  Apple,
  Smartphone,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  SmartHomeDevice,
  WearableDevice,
  INITIAL_SMARTHOME_DEVICES,
  INITIAL_WEARABLES,
  INITIAL_IOS_SMARTHOME_DEVICES,
  INITIAL_IOS_WEARABLES,
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
  platformMode?: 'android' | 'ios';
}

export const ScreenSmartHome: React.FC<ScreenSmartHomeProps> = ({
  smartDevices: defaultAndroidDevices,
  onToggleSmartDevice,
  onTestSmartDevice,
  wearables: defaultAndroidWearables,
  onToggleWearable,
  onTestWearable,
  googleHomeAuthorized,
  onToggleGoogleHomeAuth,
  onTriggerScene,
  activeSceneBanner,
  platformMode = 'android',
}) => {
  const [ecosystem, setEcosystem] = useState<'apple' | 'google'>(
    platformMode === 'ios' ? 'apple' : 'google'
  );

  const [appleDevices, setAppleDevices] = useState<SmartHomeDevice[]>(INITIAL_IOS_SMARTHOME_DEVICES);
  const [appleWearables, setAppleWearables] = useState<WearableDevice[]>(INITIAL_IOS_WEARABLES);
  const [appleHomeKitAuth, setAppleHomeKitAuth] = useState<boolean>(true);
  const [siriShortcutStatus, setSiriShortcutStatus] = useState<string | null>(null);

  const [testedWearableResult, setTestedWearableResult] = useState<{
    name: string;
    restingHr: number;
    hrvMs: number;
    spo2Pct: number;
    deepSleepMins: number;
  } | null>(null);

  const isApple = ecosystem === 'apple';
  const activeSmartDevices = isApple ? appleDevices : defaultAndroidDevices;
  const activeWearables = isApple ? appleWearables : defaultAndroidWearables;

  const handleToggleDevice = (id: string) => {
    if (isApple) {
      setAppleDevices((prev) =>
        prev.map((d) => (d.id === id ? { ...d, connected: !d.connected } : d))
      );
    } else {
      onToggleSmartDevice(id);
    }
  };

  const handleTestDevice = (id: string) => {
    if (isApple) {
      setAppleDevices((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, connected: true, lastTested: `Щойно через Apple HomeKit` }
            : d
        )
      );
    } else {
      onTestSmartDevice(id);
    }
  };

  const handleToggleWatch = (id: string) => {
    if (isApple) {
      setAppleWearables((prev) =>
        prev.map((w) =>
          w.id === id
            ? { ...w, connected: !w.connected, lastSync: !w.connected ? 'Щойно (Apple Health)' : w.lastSync }
            : w
        )
      );
    } else {
      onToggleWearable(id);
    }
  };

  const handleTestWatch = (id: string) => {
    const list = isApple ? appleWearables : defaultAndroidWearables;
    const dev = list.find((w) => w.id === id);
    if (dev) {
      setTestedWearableResult({
        name: dev.name,
        restingHr: dev.testSample.restingHr,
        hrvMs: dev.testSample.hrvMs,
        spo2Pct: dev.testSample.spo2Pct,
        deepSleepMins: dev.testSample.deepSleepMins,
      });
    }
    if (!isApple) {
      onTestWearable(id);
    }
  };

  const getDeviceIcon = (type: SmartHomeDevice['type']) => {
    if (type === 'light') return Lamp;
    if (type === 'thermostat') return Thermometer;
    if (type === 'blinds') return Blinds;
    return Speaker;
  };

  const triggerSiriShortcut = (phrase: string) => {
    setSiriShortcutStatus(`Siri виконала команду «${phrase}»: Сцена запущена!`);
    onTriggerScene(phrase.includes('Good Night') ? 'bedtime' : 'morning');
    setTimeout(() => setSiriShortcutStatus(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Ecosystem Selector Header */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#A390E4]">
            <span>Екосистема розумного дому та гаджетів</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#E4E6F0] mt-0.5">
            {isApple ? 'Apple HomeKit & HealthKit (iOS)' : 'Google Home & Health Connect (Android)'}
          </h2>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0F1220] border border-[#262D47] self-start sm:self-auto">
          <button
            onClick={() => setEcosystem('apple')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              isApple
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>Apple HomeKit</span>
          </button>
          <button
            onClick={() => setEcosystem('google')}
            className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
              !isApple
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Google Home</span>
          </button>
        </div>
      </div>

      {/* Section 1: Smart Home Automation */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#262D47]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#A390E4]">
              {isApple ? <Apple className="w-4 h-4" /> : <Home className="w-4 h-4" />}
              <span>{isApple ? 'Apple HomeKit & Matter · Siri Shortcuts' : 'Google Home APIs · OAuth 2.0 Automation'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-1">
              {isApple ? 'Apple Home: Сцени «Good Night» та «Good Morning»' : 'Розумний дім Google Home: Сцени «Відбій» та «Ранок»'}
            </h3>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              {isApple
                ? 'Керування освітленням Nanoleaf, термостатом Ecobee, шторами Eve та HomePod mini за допомогою Siri.'
                : 'Синхронізація освітлення спальні, термостата та штор із вашим будильником та ритуалом wind-down.'}
            </p>
          </div>

          <button
            onClick={isApple ? () => setAppleHomeKitAuth((a) => !a) : onToggleGoogleHomeAuth}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer ${
              (isApple ? appleHomeKitAuth : googleHomeAuthorized)
                ? 'bg-[#1E253D] border border-[#A390E4] text-[#A390E4]'
                : 'bg-[#A390E4] text-[#0F1220]'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {(isApple ? appleHomeKitAuth : googleHomeAuthorized)
                ? (isApple ? 'Apple HomeKit Авторизовано' : 'Google Home OAuth Підключено')
                : (isApple ? 'Авторизувати HomeKit' : 'Авторизувати Google Home')}
            </span>
          </button>
        </div>

        {/* Siri Shortcuts or Scene Banner */}
        {(activeSceneBanner || siriShortcutStatus) && (
          <div className="p-4 rounded-2xl bg-[#1E253D] border border-[#F4A261]/60 text-xs font-semibold text-[#F4A261] flex items-center justify-between">
            <span>{siriShortcutStatus || activeSceneBanner}</span>
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          </div>
        )}

        {/* Siri Shortcuts bar for iOS */}
        {isApple && (
          <div className="p-4 rounded-2xl bg-[#0F1220] border border-white/10 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-[#A390E4] font-bold">
              <span className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#F4A261]" />
                Швидкі команди Siri (Apple AppIntents):
              </span>
              <span className="text-[11px] text-[#9FA4BC]">Працює на iPhone, Apple Watch та HomePod</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerSiriShortcut('Hey Siri, Good Night (Wind-Down)')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#161B2E] hover:bg-[#222944] text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                <span>«Hey Siri, Good Night»</span>
                <span className="text-[11px] text-[#A390E4]">Запустити</span>
              </button>
              <button
                onClick={() => triggerSiriShortcut('Hey Siri, Sleep Coach Morning')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#161B2E] hover:bg-[#222944] text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                <span>«Hey Siri, Sleep Coach Morning»</span>
                <span className="text-[11px] text-[#F4A261]">Запустити</span>
              </button>
            </div>
          </div>
        )}

        {/* Master Scenes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono text-[#A390E4]">СЦЕНА 01 · ВЕЧІР</span>
              <h4 className="text-base font-bold text-[#E4E6F0] mt-1">
                {isApple ? 'Сцена «Good Night» (HomeKit)' : 'Сцена «Відбій» (Google Home)'}
              </h4>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                Світло переводиться в бурштиновий спектр 1800K (яскравість 8%), спальня охолоджується до 18.0°C, штори закриваються на 100%.
              </p>
            </div>
            <button
              onClick={() => onTriggerScene('bedtime')}
              className="min-h-[48px] w-full rounded-xl bg-[#A390E4] text-[#0F1220] text-xs font-bold hover:bg-[#B3A2EC] transition-colors cursor-pointer"
            >
              Запустити сцену «{isApple ? 'Good Night' : 'Відбій'}» (Тест)
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono text-[#F4A261]">СЦЕНА 02 · СВІТАНОК</span>
              <h4 className="text-base font-bold text-[#E4E6F0] mt-1">
                {isApple ? 'Сцена «Good Morning» (HomeKit)' : 'Сцена «Ранок» (Google Home)'}
              </h4>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                За 20 хв до пробудження світло наростає синхронно з кривою мелодії, штори відкриваються, а термостат підігріває спальню до 21.0°C.
              </p>
            </div>
            <button
              onClick={() => onTriggerScene('morning')}
              className="min-h-[48px] w-full rounded-xl bg-[#F4A261] text-[#0F1220] text-xs font-bold hover:bg-[#FFAF73] transition-colors cursor-pointer"
            >
              Запустити сцену «{isApple ? 'Good Morning' : 'Ранок'}» (Тест)
            </button>
          </div>
        </div>

        {/* Connected Smart Devices Grid */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-[#9FA4BC]">
            Пристрої розумного дому ({isApple ? 'Apple HomeKit / Matter' : 'Google Home'})
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSmartDevices.map((dev) => {
              const IconComponent = getDeviceIcon(dev.type);
              return (
                <div
                  key={dev.id}
                  className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between space-y-3 ${
                    dev.connected
                      ? 'bg-[#0F1220] border-[#262D47]'
                      : 'bg-[#0F1220]/50 border-[#262D47]/50 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          dev.connected
                            ? 'bg-[#A390E4]/20 text-[#A390E4]'
                            : 'bg-[#1E253D] text-[#9FA4BC]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#E4E6F0]">
                          {dev.name}
                        </div>
                        <div className="text-xs text-[#9FA4BC]">{dev.room}</div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        dev.connected
                          ? 'bg-[#A390E4]/15 text-[#A390E4]'
                          : 'bg-[#1E253D] text-[#9FA4BC]'
                      }`}
                    >
                      {dev.connected ? 'Підключено' : 'Вимкнено'}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="text-[#9FA4BC]">
                      <span className="font-semibold text-[#E4E6F0]">Відбій:</span>{' '}
                      {dev.bedtimeState}
                    </div>
                    <div className="text-[#9FA4BC]">
                      <span className="font-semibold text-[#F4A261]">Ранок:</span>{' '}
                      {dev.morningState}
                    </div>
                    {dev.lastTested && (
                      <div className="text-[11px] text-[#A390E4] font-mono">
                        Перевірено: {dev.lastTested}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#262D47]">
                    <button
                      onClick={() => handleToggleDevice(dev.id)}
                      className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        dev.connected
                          ? 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#232B47]'
                          : 'bg-[#A390E4] text-[#0F1220]'
                      }`}
                    >
                      {dev.connected ? 'Відключити' : 'Підключити'}
                    </button>

                    <button
                      onClick={() => handleTestDevice(dev.id)}
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

      {/* Section 2: Wearables (Apple HealthKit vs Android Health Connect) */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262D47]">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#F4A261]">
              <Watch className="w-4 h-4" />
              <span>{isApple ? 'Apple HealthKit API · watchOS 11 Sync' : 'Android Health Connect API · Wearables Sync'}</span>
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-1">
              {isApple
                ? 'Apple Watch та сумісні біометричні трекери (HealthKit)'
                : 'Гаджети та трекери сну (Wear OS, Garmin, Fitbit, Xiaomi)'}
            </h3>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              {isApple
                ? 'Синхронізація фаз сну (Core / Deep / REM), варіабельності пульсу (HRV) та температури запʼястя з Apple Watch.'
                : 'Керуйте джерелами біометричних даних для точного визначення фази пробудження.'}
            </p>
          </div>
        </div>

        {/* Live Telemetry Test Output Box */}
        {testedWearableResult && (
          <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#A390E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono text-[#A390E4]">
                ТЕСТ СИНХРОНІЗАЦІЇ {isApple ? 'APPLE HEALTH' : 'HEALTH CONNECT'} · {testedWearableResult.name}
              </div>
              <div className="text-sm font-bold text-[#E4E6F0] mt-0.5">
                Біометрія отримана: ЧСС {testedWearableResult.restingHr} уд/хв · HRV {testedWearableResult.hrvMs} мс · SpO2 {testedWearableResult.spo2Pct}% · Глибокий сон {testedWearableResult.deepSleepMins} хв
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

        {/* Wearables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeWearables.map((w) => (
            <div
              key={w.id}
              className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between space-y-3 ${
                w.connected
                  ? 'bg-[#0F1220] border-[#262D47]'
                  : 'bg-[#0F1220]/50 border-[#262D47]/50 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      w.connected
                        ? 'bg-[#F4A261]/20 text-[#F4A261]'
                        : 'bg-[#1E253D] text-[#9FA4BC]'
                    }`}
                  >
                    <Watch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#E4E6F0]">
                      {w.name}
                    </div>
                    <div className="text-xs text-[#9FA4BC]">{w.brand}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      w.connected
                        ? 'bg-[#A390E4]/15 text-[#A390E4]'
                        : 'bg-[#1E253D] text-[#9FA4BC]'
                    }`}
                  >
                    {w.connected ? 'Синхронізовано' : 'Відключено'}
                  </span>
                  <div className="text-[11px] text-[#9FA4BC] font-mono mt-1">
                    АКБ {w.batteryPct}%
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs text-[#9FA4BC]">
                  Остання передача даних: <span className="text-[#E4E6F0]">{w.lastSync}</span>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  {w.metricsProvided.map((m, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] px-2 py-0.5 rounded-lg bg-[#161B2E] border border-[#262D47] text-[#A390E4]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#262D47]">
                <button
                  onClick={() => handleToggleWatch(w.id)}
                  className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    w.connected
                      ? 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#232B47]'
                      : 'bg-[#F4A261] text-[#0F1220]'
                  }`}
                >
                  {w.connected ? 'Відключити' : 'Підключити'}
                </button>

                <button
                  onClick={() => handleTestWatch(w.id)}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#2A3354] text-xs font-bold text-[#A390E4] cursor-pointer"
                >
                  Тест синхронізації
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
