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
  Crown,
  Lock,
  X,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  SmartHomeDevice,
  WearableDevice,
  INITIAL_SMARTHOME_DEVICES,
  INITIAL_WEARABLES,
  INITIAL_IOS_SMARTHOME_DEVICES,
  INITIAL_IOS_WEARABLES,
} from '../utils/sleepCoachEngine';
import { PlanTier, PLAN_FEATURES } from '../utils/subscriptionEngine';

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
  planTier?: PlanTier;
  onUpgradeToPro?: () => void;
  onTogglePlanTier?: () => void;
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
  planTier = 'pro',
  onUpgradeToPro = () => {},
  onTogglePlanTier,
}) => {
  const [ecosystem, setEcosystem] = useState<'apple' | 'google'>(
    platformMode === 'ios' ? 'apple' : 'google'
  );

  const [appleDevices, setAppleDevices] = useState<SmartHomeDevice[]>(INITIAL_IOS_SMARTHOME_DEVICES);
  const [appleWearables, setAppleWearables] = useState<WearableDevice[]>(INITIAL_IOS_WEARABLES);
  const [appleHomeKitAuth, setAppleHomeKitAuth] = useState<boolean>(true);
  const [siriShortcutStatus, setSiriShortcutStatus] = useState<string | null>(null);
  const [showProModal, setShowProModal] = useState<boolean>(false);
  const [proModalReason, setProModalReason] = useState<string>('Підключення гаджетів');
  const [showCompareModal, setShowCompareModal] = useState<boolean>(false);

  const [testedWearableResult, setTestedWearableResult] = useState<{
    name: string;
    restingHr: number;
    hrvMs: number;
    spo2Pct: number;
    deepSleepMins: number;
  } | null>(null);

  const isApple = ecosystem === 'apple';
  const isFree = planTier === 'free';
  const activeSmartDevices = isApple ? appleDevices : defaultAndroidDevices;
  const activeWearables = isApple ? appleWearables : defaultAndroidWearables;

  const requirePro = (featureName: string, action: () => void) => {
    if (isFree) {
      setProModalReason(featureName);
      setShowProModal(true);
      return;
    }
    action();
  };

  const handleToggleDevice = (id: string, name: string) => {
    requirePro(`Підключення ${name}`, () => {
      if (isApple) {
        setAppleDevices((prev) =>
          prev.map((d) => (d.id === id ? { ...d, connected: !d.connected } : d))
        );
      } else {
        onToggleSmartDevice(id);
      }
    });
  };

  const handleTestDevice = (id: string, name: string) => {
    requirePro(`Тест пристрою ${name}`, () => {
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
    });
  };

  const handleToggleWatch = (id: string, name: string) => {
    requirePro(`Підключення трекера ${name}`, () => {
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
    });
  };

  const handleTestWatch = (id: string, name: string) => {
    requirePro(`Тест біометрії ${name}`, () => {
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
    });
  };

  const handleAuthToggle = () => {
    const authName = isApple ? 'Apple HomeKit' : 'Google Home OAuth';
    requirePro(`Авторизація ${authName}`, () => {
      if (isApple) {
        setAppleHomeKitAuth((a) => !a);
      } else {
        onToggleGoogleHomeAuth();
      }
    });
  };

  const handleSceneTrigger = (scene: 'bedtime' | 'morning') => {
    const sceneName = scene === 'bedtime' ? 'Сцена «Відбій»' : 'Сцена «Ранок»';
    requirePro(sceneName, () => {
      onTriggerScene(scene);
    });
  };

  const getDeviceIcon = (type: SmartHomeDevice['type']) => {
    if (type === 'light') return Lamp;
    if (type === 'thermostat') return Thermometer;
    if (type === 'blinds') return Blinds;
    return Speaker;
  };

  const triggerSiriShortcut = (phrase: string) => {
    requirePro(`Siri Shortcut «${phrase}»`, () => {
      setSiriShortcutStatus(`Siri виконала команду «${phrase}»: Сцена запущена!`);
      onTriggerScene(phrase.includes('Good Night') ? 'bedtime' : 'morning');
      setTimeout(() => setSiriShortcutStatus(null), 4000);
    });
  };

  const activateProAndDismiss = () => {
    onUpgradeToPro();
    setShowProModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Plan Tier Status Banner: Free vs Pro Gadget Access */}
      {isFree ? (
        <div className="rounded-3xl bg-gradient-to-br from-[#1E253D] via-[#161B2E] to-[#2B1B42] border-2 border-[#A390E4]/40 p-5 sm:p-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#A390E4]/10 rounded-full blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4A261]/20 border border-[#F4A261]/50 text-[#F4A261] text-xs font-extrabold uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>Базовий тариф (Free) · Гаджети заблоковано</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0]">
                Підключення гаджетів та розумного дому доступне у Sleep Coach Pro
              </h2>
              <p className="text-xs sm:text-sm text-[#9FA4BC] leading-relaxed">
                У безкоштовному тарифі ви користуєтеся базовими функціями: розрахунком 90-хв циклів R90, розумним будильником та звуками. Щоб синхронізувати <span className="text-[#E4E6F0] font-semibold">Apple Watch, Garmin, Oura Ring, Google Home та Apple HomeKit</span>, перейдіть на Pro.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
              <button
                type="button"
                onClick={onUpgradeToPro}
                className="min-h-[46px] px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#A390E4] to-[#F4A261] hover:brightness-110 text-[#0F1220] font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer transition-all active:scale-[0.98]"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>Активувати Sleep Coach Pro</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCompareModal(true)}
                className="min-h-[46px] px-4 py-2.5 rounded-2xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] text-xs font-semibold text-[#E4E6F0] flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Info className="w-4 h-4 text-[#A390E4]" />
                <span>Порівняти тарифи</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl bg-[#161B2E] border border-[#A390E4]/40 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F4A261]/20 border border-[#F4A261]/40 flex items-center justify-center text-[#F4A261] shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-[#F4A261] uppercase tracking-wider">
                  Sleep Coach Pro Активний
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#52B788]/20 border border-[#52B788]/40 text-[#52B788] font-bold">
                  Гаджети розблоковано
                </span>
              </div>
              <p className="text-xs text-[#9FA4BC] mt-0.5">
                Повний доступ до синхронізації Apple Watch, Garmin, Oura, Google Home та Health Connect.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowCompareModal(true)}
              className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] text-xs font-medium text-[#9FA4BC] hover:text-[#E4E6F0] flex items-center gap-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Тарифи</span>
            </button>
            {onTogglePlanTier && (
              <button
                type="button"
                onClick={onTogglePlanTier}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] text-xs font-medium text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
                title="Перемкнути на Free для перевірки обмежень"
              >
                Тест Free
              </button>
            )}
          </div>
        </div>
      )}

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
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-lg sm:text-xl font-bold text-[#E4E6F0]">
                {isApple ? 'Apple Home: Сцени «Good Night» та «Good Morning»' : 'Розумний дім Google Home: Сцени «Відбій» та «Ранок»'}
              </h3>
              {isFree && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F4A261]/15 text-[#F4A261] border border-[#F4A261]/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              {isApple
                ? 'Керування освітленням Nanoleaf, термостатом Ecobee, шторами Eve та HomePod mini за допомогою Siri.'
                : 'Синхронізація освітлення спальні, термостата та штор із вашим будильником та ритуалом wind-down.'}
            </p>
          </div>

          <button
            onClick={handleAuthToggle}
            className={`min-h-[48px] px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shrink-0 cursor-pointer ${
              (isApple ? appleHomeKitAuth : googleHomeAuthorized)
                ? 'bg-[#1E253D] border border-[#A390E4] text-[#A390E4]'
                : 'bg-[#A390E4] text-[#0F1220]'
            }`}
          >
            {isFree ? <Lock className="w-4 h-4 text-[#F4A261]" /> : <ShieldCheck className="w-4 h-4" />}
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
              <span className="text-[11px] text-[#9FA4BC]">
                {isFree ? 'Потрібна підписка Pro' : 'Працює на iPhone, Apple Watch та HomePod'}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerSiriShortcut('Hey Siri, Good Night (Wind-Down)')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#161B2E] hover:bg-[#222944] text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                {isFree && <Lock className="w-3 h-3 text-[#F4A261]" />}
                <span>«Hey Siri, Good Night»</span>
                <span className="text-[11px] text-[#A390E4]">Запустити</span>
              </button>
              <button
                onClick={() => triggerSiriShortcut('Hey Siri, Sleep Coach Morning')}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#161B2E] hover:bg-[#222944] text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 border border-white/10 cursor-pointer"
              >
                {isFree && <Lock className="w-3 h-3 text-[#F4A261]" />}
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
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#A390E4]">СЦЕНА 01 · ВЕЧІР</span>
                {isFree && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4A261]/15 text-[#F4A261] border border-[#F4A261]/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-[#E4E6F0] mt-1">
                {isApple ? 'Сцена «Good Night» (HomeKit)' : 'Сцена «Відбій» (Google Home)'}
              </h4>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                Світло переводиться в бурштиновий спектр 1800K (яскравість 8%), спальня охолоджується до 18.0°C, штори закриваються на 100%.
              </p>
            </div>
            <button
              onClick={() => handleSceneTrigger('bedtime')}
              className="min-h-[48px] w-full rounded-xl bg-[#A390E4] text-[#0F1220] text-xs font-bold hover:bg-[#B3A2EC] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isFree && <Lock className="w-3.5 h-3.5" />}
              <span>Запустити сцену «{isApple ? 'Good Night' : 'Відбій'}» (Тест)</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-[#F4A261]">СЦЕНА 02 · СВІТАНОК</span>
                {isFree && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#F4A261]/15 text-[#F4A261] border border-[#F4A261]/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> PRO
                  </span>
                )}
              </div>
              <h4 className="text-base font-bold text-[#E4E6F0] mt-1">
                {isApple ? 'Сцена «Good Morning» (HomeKit)' : 'Сцена «Ранок» (Google Home)'}
              </h4>
              <p className="text-xs text-[#9FA4BC] mt-1 leading-relaxed">
                За 20 хв до пробудження світло наростає синхронно з кривою мелодії, штори відкриваються, а термостат підігріває спальню до 21.0°C.
              </p>
            </div>
            <button
              onClick={() => handleSceneTrigger('morning')}
              className="min-h-[48px] w-full rounded-xl bg-[#F4A261] text-[#0F1220] text-xs font-bold hover:bg-[#FFAF73] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              {isFree && <Lock className="w-3.5 h-3.5" />}
              <span>Запустити сцену «{isApple ? 'Good Morning' : 'Ранок'}» (Тест)</span>
            </button>
          </div>
        </div>

        {/* Connected Smart Devices Grid */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-[#9FA4BC]">
            <span>Пристрої розумного дому ({isApple ? 'Apple HomeKit / Matter' : 'Google Home'})</span>
            {isFree && (
              <span className="text-[#F4A261] flex items-center gap-1">
                <Lock className="w-3 h-3" /> Доступно в тарифі Pro
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSmartDevices.map((dev) => {
              const IconComponent = getDeviceIcon(dev.type);
              return (
                <div
                  key={dev.id}
                  className={`p-4 rounded-2xl border transition-colors flex flex-col justify-between space-y-3 ${
                    dev.connected && !isFree
                      ? 'bg-[#0F1220] border-[#262D47]'
                      : 'bg-[#0F1220]/50 border-[#262D47]/50 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          dev.connected && !isFree
                            ? 'bg-[#A390E4]/20 text-[#A390E4]'
                            : 'bg-[#1E253D] text-[#9FA4BC]'
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-[#E4E6F0] flex items-center gap-1.5">
                          <span>{dev.name}</span>
                          {isFree && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F4A261]/20 text-[#F4A261]">PRO</span>
                          )}
                        </div>
                        <div className="text-xs text-[#9FA4BC]">{dev.room}</div>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        isFree
                          ? 'bg-[#1E253D] text-[#9FA4BC]'
                          : dev.connected
                          ? 'bg-[#A390E4]/15 text-[#A390E4]'
                          : 'bg-[#1E253D] text-[#9FA4BC]'
                      }`}
                    >
                      {isFree ? 'Потрібен Pro' : dev.connected ? 'Підключено' : 'Вимкнено'}
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
                      onClick={() => handleToggleDevice(dev.id, dev.name)}
                      className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isFree
                          ? 'bg-[#1E253D] text-[#E4E6F0] hover:bg-[#293252]'
                          : dev.connected
                          ? 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#232B47]'
                          : 'bg-[#A390E4] text-[#0F1220]'
                      }`}
                    >
                      {isFree && <Lock className="w-3.5 h-3.5 text-[#F4A261]" />}
                      <span>{isFree ? 'Підключити (Pro)' : dev.connected ? 'Відключити' : 'Підключити'}</span>
                    </button>

                    <button
                      onClick={() => handleTestDevice(dev.id, dev.name)}
                      className="min-h-[48px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#2A3354] text-xs font-bold text-[#F4A261] flex items-center gap-1 cursor-pointer"
                    >
                      {isFree && <Lock className="w-3 h-3 text-[#F4A261]" />}
                      <span>Тест</span>
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
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-lg sm:text-xl font-bold text-[#E4E6F0]">
                {isApple
                  ? 'Apple Watch та сумісні біометричні трекери (HealthKit)'
                  : 'Гаджети та трекери сну (Wear OS, Garmin, Fitbit, Xiaomi)'}
              </h3>
              {isFree && (
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F4A261]/15 text-[#F4A261] border border-[#F4A261]/30 flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> PRO
                </span>
              )}
            </div>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              {isApple
                ? 'Синхронізація фаз сну (Core / Deep / REM), варіабельності пульсу (HRV) та температури запʼястя з Apple Watch.'
                : 'Керуйте джерелами біометричних даних для точного визначення фази пробудження.'}
            </p>
          </div>
        </div>

        {/* Live Telemetry Test Output Box */}
        {testedWearableResult && (
          <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#A390E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
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
                w.connected && !isFree
                  ? 'bg-[#0F1220] border-[#262D47]'
                  : 'bg-[#0F1220]/50 border-[#262D47]/50 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      w.connected && !isFree
                        ? 'bg-[#F4A261]/20 text-[#F4A261]'
                        : 'bg-[#1E253D] text-[#9FA4BC]'
                    }`}
                  >
                    <Watch className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[#E4E6F0] flex items-center gap-1.5">
                      <span>{w.name}</span>
                      {isFree && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F4A261]/20 text-[#F4A261]">PRO</span>
                      )}
                    </div>
                    <div className="text-xs text-[#9FA4BC]">{w.brand}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      isFree
                        ? 'bg-[#1E253D] text-[#9FA4BC]'
                        : w.connected
                        ? 'bg-[#A390E4]/15 text-[#A390E4]'
                        : 'bg-[#1E253D] text-[#9FA4BC]'
                    }`}
                  >
                    {isFree ? 'Потрібен Pro' : w.connected ? 'Синхронізовано' : 'Відключено'}
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
                  onClick={() => handleToggleWatch(w.id, w.name)}
                  className={`flex-1 min-h-[48px] px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                    isFree
                      ? 'bg-[#1E253D] text-[#E4E6F0] hover:bg-[#293252]'
                      : w.connected
                      ? 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#232B47]'
                      : 'bg-[#F4A261] text-[#0F1220]'
                  }`}
                >
                  {isFree && <Lock className="w-3.5 h-3.5 text-[#F4A261]" />}
                  <span>{isFree ? 'Синхронізувати (Pro)' : w.connected ? 'Відключити' : 'Підключити'}</span>
                </button>

                <button
                  onClick={() => handleTestWatch(w.id, w.name)}
                  className="min-h-[48px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#2A3354] text-xs font-bold text-[#A390E4] flex items-center gap-1 cursor-pointer"
                >
                  {isFree && <Lock className="w-3 h-3 text-[#F4A261]" />}
                  <span>Тест біометрії</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro Upgrade Trigger Modal */}
      {showProModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <div className="bg-[#161B2E] border-2 border-[#A390E4]/60 rounded-3xl max-w-md w-full p-6 shadow-2xl relative space-y-5 animate-scaleUp">
            <button
              onClick={() => setShowProModal(false)}
              className="absolute top-4 right-4 text-[#9FA4BC] hover:text-[#E4E6F0] p-2 rounded-xl bg-[#0F1220] cursor-pointer"
              aria-label="Закрити модальне вікно"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#F4A261]/20 border border-[#F4A261]/50 flex items-center justify-center text-[#F4A261] shrink-0">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-mono text-[#F4A261] uppercase tracking-wider font-bold">
                  Sleep Coach Pro
                </span>
                <h3 className="text-lg font-bold text-[#E4E6F0] leading-tight">
                  {proModalReason} доступно у Pro
                </h3>
              </div>
            </div>

            <p className="text-xs text-[#9FA4BC] leading-relaxed">
              У <strong className="text-[#E4E6F0]">Безкоштовному тарифі</strong> доступні розклад 90-хв циклів сну R90, розумний будильник та вбудовані аудіотреки.
              Синхронізація носимих гаджетів та розумного дому входить у підписку <strong className="text-[#F4A261]">Sleep Coach Pro</strong>.
            </p>

            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="text-xs font-bold text-[#E4E6F0] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#A390E4]" />
                <span>Що відкриває Sleep Coach Pro:</span>
              </div>
              <ul className="text-xs text-[#9FA4BC] space-y-1.5 pt-1">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                  <span>Синхронізація Apple Watch, Garmin, Oura, Whoop</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                  <span>Біометрія в реальному часі: HRV, пульс спокою, SpO2</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                  <span>Розумний дім: Google Home, Apple HomeKit & Matter</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#52B788] shrink-0" />
                  <span>Швидкі команди Siri та автоматичні сцени світла/клімату</span>
                </li>
              </ul>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={activateProAndDismiss}
                className="w-full min-h-[48px] rounded-2xl bg-gradient-to-r from-[#A390E4] to-[#F4A261] hover:brightness-110 text-[#0F1220] font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-transform active:scale-[0.99]"
              >
                <Crown className="w-4 h-4 fill-current" />
                <span>Активувати Sleep Coach Pro зараз</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProModal(false);
                  setShowCompareModal(true);
                }}
                className="w-full min-h-[44px] rounded-xl bg-[#0F1220] hover:bg-[#1E253D] text-xs font-semibold text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
              >
                Детальне порівняння тарифів
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Free vs Pro Comparison Modal */}
      {showCompareModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <div className="bg-[#161B2E] border border-[#262D47] rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative my-8 space-y-6">
            <button
              onClick={() => setShowCompareModal(false)}
              className="absolute top-5 right-5 text-[#9FA4BC] hover:text-[#E4E6F0] p-2 rounded-xl bg-[#0F1220] cursor-pointer"
              aria-label="Закрити порівняння"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#A390E4]/20 border border-[#A390E4]/40 text-[#A390E4] text-xs font-mono uppercase tracking-wider mb-2">
                <span>Порівняння тарифів</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-[#E4E6F0]">
                Безкоштовний тариф vs Sleep Coach Pro
              </h2>
              <p className="text-xs sm:text-sm text-[#9FA4BC] mt-1">
                Базові функції сну доступні всім безкоштовно. Функції синхронізації з зовнішніми гаджетами та розумним домом входять у Pro.
              </p>
            </div>

            {/* Comparison Table */}
            <div className="rounded-2xl border border-[#262D47] overflow-hidden bg-[#0F1220]">
              <div className="grid grid-cols-12 bg-[#1A2035] p-3 text-xs font-bold border-b border-[#262D47]">
                <div className="col-span-6 sm:col-span-7 text-[#E4E6F0]">Функція</div>
                <div className="col-span-3 sm:col-span-2 text-center text-[#9FA4BC]">Free</div>
                <div className="col-span-3 sm:col-span-3 text-center text-[#F4A261] flex items-center justify-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>Pro</span>
                </div>
              </div>

              <div className="divide-y divide-[#262D47] text-xs">
                {PLAN_FEATURES.map((feat, idx) => (
                  <div key={idx} className="grid grid-cols-12 p-3 items-center hover:bg-[#161B2E]/50">
                    <div className="col-span-6 sm:col-span-7 pr-2">
                      <div className="font-semibold text-[#E4E6F0]">{feat.title}</div>
                      <div className="text-[11px] text-[#9FA4BC] line-clamp-1">{feat.description}</div>
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-center">
                      {feat.free ? (
                        <Check className="w-4 h-4 text-[#52B788] mx-auto" />
                      ) : (
                        <span className="text-[#9FA4BC] font-mono">—</span>
                      )}
                    </div>
                    <div className="col-span-3 sm:col-span-3 text-center">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F4A261]/15 text-[#F4A261] font-bold">
                        <Check className="w-3.5 h-3.5" />
                        <span>Є</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <div className="text-xs text-[#9FA4BC]">
                Поточний активний тариф: <span className="font-bold text-[#E4E6F0]">{isFree ? 'Безкоштовний (Free)' : 'Sleep Coach Pro'}</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {isFree ? (
                  <button
                    type="button"
                    onClick={() => {
                      onUpgradeToPro();
                      setShowCompareModal(false);
                    }}
                    className="w-full sm:w-auto min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#A390E4] to-[#F4A261] text-[#0F1220] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                  >
                    <Crown className="w-4 h-4 fill-current" />
                    <span>Перейти на Sleep Coach Pro</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowCompareModal(false)}
                    className="w-full sm:w-auto min-h-[44px] px-5 py-2.5 rounded-xl bg-[#A390E4] text-[#0F1220] font-bold text-xs cursor-pointer"
                  >
                    Зрозуміло
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

