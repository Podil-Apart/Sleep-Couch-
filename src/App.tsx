/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Moon,
  Clock,
  BarChart3,
  Home,
  User,
  Bell,
  X,
  Sparkles,
  Apple,
  Smartphone,
  UserPlus,
  Crown,
  LogOut,
  LogIn,
} from 'lucide-react';
import {
  INITIAL_WEEKLY_DATA,
  DayRecoveryRecord,
  Handedness,
  formatMinutesToTime,
  parseTimeToMinutes,
} from './utils/r90Engine';
import {
  BUILTIN_MELODIES,
  INITIAL_SMARTHOME_DEVICES,
  INITIAL_WEARABLES,
  MelodyTrack,
  SmartHomeDevice,
  WearableDevice,
  FadeCurveType,
  sleepCoachMedia,
} from './utils/sleepCoachEngine';
import {
  getCurrentUser,
  UserAccount,
  updateUserPlan,
  logoutAccount,
  isGuestUser,
} from './utils/authEngine';
import { PlanTier, getStoredPlanTier, saveStoredPlanTier } from './utils/subscriptionEngine';
import { ScreenToday } from './components/ScreenToday';
import { ScreenSchedule } from './components/ScreenSchedule';
import { ScreenAnalytics } from './components/ScreenAnalytics';
import { ScreenSmartHome } from './components/ScreenSmartHome';
import { OnboardingModal } from './components/OnboardingModal';
import { ProfileSettingsSheet } from './components/ProfileSettingsSheet';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/PWAInstallButton';

type MainTab = 'today' | 'schedule' | 'analytics' | 'smarthome';

export default function App() {
  const [activeTab, setActiveTab] = useState<MainTab>('today');

  // Core Schedule State (DataStore persistence)
  const [wakeTime, setWakeTime] = useState<string>(() => {
    return localStorage.getItem('sc_wake_time') || '06:30';
  });
  const [targetCycles, setTargetCycles] = useState<number>(() => {
    const saved = localStorage.getItem('sc_target_cycles');
    return saved ? Number(saved) : 5;
  });
  const [shiftMinutesStep, setShiftMinutesStep] = useState<number>(15);
  const [shiftDaysInterval, setShiftDaysInterval] = useState<number>(3);
  const [alarmWindowMins, setAlarmWindowMins] = useState<number>(20);
  const [fadeCurve, setFadeCurve] = useState<FadeCurveType>('sigmoid');
  const [windDownLeadMins, setWindDownLeadMins] = useState<30 | 60>(60);
  const [dndEnabled, setDndEnabled] = useState<boolean>(true);

  // Melody Library State
  const [melodies, setMelodies] = useState<MelodyTrack[]>(BUILTIN_MELODIES);
  const [sleepMelodyId, setSleepMelodyId] = useState<string>('nature_rain');
  const [wakeMelodyId, setWakeMelodyId] = useState<string>('tone_432');

  // Smart Home & Wearables State
  const [smartDevices, setSmartDevices] = useState<SmartHomeDevice[]>(
    INITIAL_SMARTHOME_DEVICES
  );
  const [wearables, setWearables] = useState<WearableDevice[]>(INITIAL_WEARABLES);
  const [googleHomeAuthorized, setGoogleHomeAuthorized] = useState<boolean>(true);
  const [activeSceneMessage, setActiveSceneMessage] = useState<string | null>(null);

  // Weekly R90 & Analytics State
  const [weeklyData, setWeeklyData] = useState<DayRecoveryRecord[]>(() => {
    const saved = localStorage.getItem('r90_weekly_data');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_WEEKLY_DATA;
      }
    }
    return INITIAL_WEEKLY_DATA;
  });

  // User Authentication & Profile State
  const [currentUser, setCurrentUser] = useState<UserAccount>(() => getCurrentUser());
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);

  // Subscription Plan Tier (Free vs Pro)
  const [planTier, setPlanTier] = useState<PlanTier>(() => getStoredPlanTier());

  useEffect(() => {
    saveStoredPlanTier(planTier);
  }, [planTier]);

  const handleUpgradeToPro = () => {
    setPlanTier('pro');
    saveStoredPlanTier('pro');
    if (currentUser?.id) {
      const updated = updateUserPlan(currentUser.id, 'pro');
      if (updated) setCurrentUser(updated);
    }
    setToastAlert({
      title: 'Sleep Coach Pro Активовано 👑',
      desc: 'Підключення гаджетів (Apple Watch, Garmin, Oura, Google Home) розблоковано!',
    });
  };

  const handleChangePlanTier = (tier: PlanTier) => {
    setPlanTier(tier);
    saveStoredPlanTier(tier);
    if (currentUser?.id) {
      const updated = updateUserPlan(currentUser.id, tier);
      if (updated) setCurrentUser(updated);
    }
    setToastAlert({
      title: tier === 'pro' ? 'Sleep Coach Pro Активовано 👑' : 'Базовий тариф (Free) активовано',
      desc:
        tier === 'pro'
          ? 'Усі функції синхронізації гаджетів та розумного дому розблоковано!'
          : 'У базовому тарифі доступні розклад R90, розумний будильник та аудіо-ритуали.',
    });
  };

  const handleLogout = () => {
    const guestUser = logoutAccount();
    setCurrentUser(guestUser);
    setPlanTier('free');
    saveStoredPlanTier('free');
    setShowProfileSheet(false);
    setShowAuthModal(false);
    setToastAlert({
      title: 'Вихід з акаунту виконано',
      desc: 'Ви успішно вийшли з облікового запису. Активовано гостьовий режим із базовим тарифом.',
    });
  };

  // Accessibility, Platform & Profile State
  const [platformMode, setPlatformMode] = useState<'android' | 'ios'>(() => {
    const saved = localStorage.getItem('sc_platform_mode');
    if (saved === 'ios' || saved === 'android') return saved;
    return 'ios'; // Default to iOS mode as requested
  });
  const [amberNightFilter, setAmberNightFilter] = useState<boolean>(false);
  const [largeFontScale, setLargeFontScale] = useState<boolean>(false);
  const [handedness, setHandedness] = useState<Handedness>('right');
  const [showProfileSheet, setShowProfileSheet] = useState<boolean>(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(false);

  // In-app reminder toast state
  const [toastAlert, setToastAlert] = useState<{ title: string; desc: string } | null>(
    null
  );
  const [nowTimeStr, setNowTimeStr] = useState<string>('21:45');

  useEffect(() => {
    localStorage.setItem('sc_platform_mode', platformMode);
  }, [platformMode]);

  useEffect(() => {
    localStorage.setItem('sc_wake_time', wakeTime);
  }, [wakeTime]);

  useEffect(() => {
    localStorage.setItem('sc_target_cycles', String(targetCycles));
  }, [targetCycles]);

  useEffect(() => {
    localStorage.setItem('r90_weekly_data', JSON.stringify(weeklyData));
  }, [weeklyData]);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      setNowTimeStr(`${hh}:${mm}`);
    };
    updateClock();
    const t = setInterval(updateClock, 15000);
    return () => clearInterval(t);
  }, []);

  const wakeMins = parseTimeToMinutes(wakeTime);
  const bedTime = formatMinutesToTime(wakeMins - targetCycles * 90);

  const sleepMelody =
    melodies.find((m) => m.id === sleepMelodyId) || melodies[0];
  const wakeMelody =
    melodies.find((m) => m.id === wakeMelodyId) || melodies[3];

  const handleTriggerSmartScene = (scene: 'bedtime' | 'morning') => {
    if (scene === 'bedtime') {
      setActiveSceneMessage(
        'Сцена Google Home «Відбій» активована: Світло 8% (2000K), Термостат 18.0°C, Штори закрито'
      );
    } else {
      setActiveSceneMessage(
        `Сцена Google Home «Ранок» активована: Плавний світанок 0→100% за ${alarmWindowMins} хв, Термостат 21.0°C`
      );
    }
  };

  const handleToggleSmartDevice = (id: string) => {
    setSmartDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, connected: !d.connected } : d))
    );
  };

  const handleTestSmartDevice = (id: string) => {
    setSmartDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? { ...d, connected: true, lastTested: `Щойно (${nowTimeStr})` }
          : d
      )
    );
  };

  const handleToggleWearable = (id: string) => {
    setWearables((prev) =>
      prev.map((w) =>
        w.id === id
          ? {
              ...w,
              connected: !w.connected,
              lastSync: !w.connected ? `Сьогодні, ${nowTimeStr}` : w.lastSync,
            }
          : w
      )
    );
  };

  const handleTestWearable = (id: string) => {
    setWearables((prev) =>
      prev.map((w) =>
        w.id === id
          ? { ...w, connected: true, lastSync: `Щойно (${nowTimeStr})` }
          : w
      )
    );
  };

  return (
    <div
      className={`min-h-screen bg-[#0F1220] text-[#E4E6F0] pb-24 md:pb-12 transition-all ${
        largeFontScale ? 'text-[106%]' : ''
      }`}
    >
      {/* Optional Post-20:00 Warm Amber Melatonin Shield Overlay */}
      {amberNightFilter && (
        <div
          className="pointer-events-none fixed inset-0 z-40 bg-[#F4A261]/[0.06] mix-blend-multiply"
          aria-hidden="true"
        />
      )}

      {/* Top Bar Contract: 3 Zones (1. Single-element Brand Wordmark, 2. 4 Nav Links, 3. Onboarding + Profile Icon) */}
      <header className="sticky top-0 z-30 h-14 px-4 sm:px-6 bg-[#0F1220]/90 backdrop-blur-md border-b border-[#262D47] flex items-center justify-between">
        {/* Zone 1: Single text element Brand Wordmark */}
        <a
          href="#today"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('today');
          }}
          className="font-display text-base sm:text-lg font-extrabold tracking-tight text-[#E4E6F0] whitespace-nowrap"
        >
          Sleep Coach
        </a>

        {/* Zone 2: 4 Clean Navigation Links on Desktop */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
          {[
            { id: 'today', label: 'Сьогодні' },
            { id: 'schedule', label: 'Режим' },
            { id: 'analytics', label: 'Аналітика' },
            { id: 'smarthome', label: 'Дім і гаджети', badge: planTier === 'free' ? 'PRO' : null },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as MainTab)}
              className={`py-1 transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === item.id
                  ? 'text-[#A390E4] font-bold underline underline-offset-8 decoration-2 decoration-[#A390E4]'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded-full bg-[#F4A261]/20 text-[#F4A261] border border-[#F4A261]/40">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* Zone 3: Platform Switcher + Onboarding + Profile Icon + Subscription Tier */}
        <div className="flex items-center gap-2">
          {/* Subscription Tier Badge */}
          <button
            onClick={() => setShowProfileSheet(true)}
            className={`min-h-[34px] px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              planTier === 'pro'
                ? 'bg-[#F4A261]/20 border border-[#F4A261]/50 text-[#F4A261] hover:bg-[#F4A261]/30'
                : 'bg-[#161B2E] border border-[#262D47] text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
            title={planTier === 'pro' ? 'Тариф Sleep Coach Pro: Гаджети підключено' : 'Базовий тариф Free: Натисніть для переходу на Pro'}
          >
            <Crown className="w-3.5 h-3.5 text-[#F4A261]" />
            <span className="uppercase text-[11px] font-extrabold">{planTier === 'pro' ? 'PRO' : 'FREE'}</span>
          </button>

          {/* iOS / Android Platform Toggle Pill */}
          <div className="flex items-center p-0.5 rounded-xl bg-[#161B2E] border border-[#262D47]">
            <button
              onClick={() => setPlatformMode('android')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                platformMode === 'android'
                  ? 'bg-[#A390E4] text-[#0F1220] shadow-sm'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
              title="Перемкнути інтерфейс на Android (Material 3)"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Android</span>
            </button>
            <button
              onClick={() => setPlatformMode('ios')}
              className={`min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                platformMode === 'ios'
                  ? 'bg-[#A390E4] text-[#0F1220] shadow-sm'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
              title="Перемкнути інтерфейс на Apple iOS (Human Interface Guidelines)"
            >
              <Apple className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">iOS</span>
            </button>
          </div>

          {/* User Account / Register Button */}
          <button
            onClick={() => setShowAuthModal(true)}
            className="min-h-[36px] px-2.5 py-1 rounded-xl bg-[#161B2E] hover:bg-[#202742] border border-[#262D47] flex items-center gap-2 text-xs font-semibold text-[#E4E6F0] transition-colors cursor-pointer"
            title={isGuestUser(currentUser) ? 'Увійти або зареєструватися' : `Акаунт: ${currentUser.name} (${currentUser.email})`}
          >
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold text-white shrink-0"
              style={{ backgroundColor: currentUser.avatarColor || '#A390E4' }}
            >
              {currentUser.avatarInitials}
            </div>
            <span className="hidden md:inline truncate max-w-[90px]">
              {isGuestUser(currentUser) ? 'Увійти' : currentUser.name.split(' ')[0]}
            </span>
          </button>

          {/* Quick Logout Button when authenticated */}
          {!isGuestUser(currentUser) && (
            <button
              onClick={handleLogout}
              className="min-h-[36px] px-2 py-1 rounded-xl bg-[#161B2E] hover:bg-rose-950/60 hover:border-rose-500/50 hover:text-rose-300 border border-[#262D47] flex items-center gap-1.5 text-xs text-[#9FA4BC] transition-colors cursor-pointer"
              title={`Вийти з акаунту (${currentUser.name})`}
              aria-label="Вийти з акаунту"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden xl:inline text-[11px] font-medium text-rose-300">Вийти</span>
            </button>
          )}

          <button
            onClick={() => setShowOnboarding(true)}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-[#161B2E] hover:bg-[#1F2640] border border-[#262D47] text-xs font-semibold text-[#A390E4] hidden sm:flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Онбординг</span>
          </button>

          <button
            onClick={() => setShowProfileSheet(true)}
            className="min-h-[40px] min-w-[40px] rounded-2xl bg-[#161B2E] hover:bg-[#222944] border border-[#A390E4]/40 flex items-center justify-center text-[#E4E6F0] transition-colors cursor-pointer"
            title="Налаштування, архітектура Swift/Kotlin та підписка"
            aria-label="Налаштування, архітектура Swift/Kotlin та підписка"
          >
            {platformMode === 'ios' ? <Apple className="w-4 h-4 text-[#A390E4]" /> : <User className="w-4 h-4 text-[#A390E4]" />}
          </button>
        </div>
      </header>

      {/* Active Reminder Toast Notification */}
      {toastAlert && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4">
          <div className="rounded-2xl p-4 bg-[#1E253D] border border-[#A390E4] text-[#E4E6F0] shadow-xl flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Bell className="w-5 h-5 text-[#F4A261] shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-bold">{toastAlert.title}</div>
                <p className="text-xs text-[#9FA4BC] mt-0.5">{toastAlert.desc}</p>
              </div>
            </div>
            <button
              onClick={() => setToastAlert(null)}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0F1220] flex items-center justify-center text-[#9FA4BC] cursor-pointer"
              aria-label="Закрити сповіщення"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 space-y-6">
        {/* Quiet Unboxed Context Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9FA4BC] px-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              {platformMode === 'ios' ? <Apple className="w-3.5 h-3.5 text-[#A390E4]" /> : <Smartphone className="w-3.5 h-3.5 text-[#F4A261]" />}
              <span>{platformMode === 'ios' ? 'iOS HIG режим' : 'Android M3'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Поточний час {nowTimeStr}</span>
            <span aria-hidden="true">·</span>
            <span>Відбій {bedTime}</span>
            <span aria-hidden="true">·</span>
            <span>Підйом {wakeTime}</span>
          </div>

          <button
            onClick={() => setShowProfileSheet(true)}
            className="hover:text-[#E4E6F0] underline underline-offset-4 cursor-pointer"
          >
            {platformMode === 'ios' ? 'SwiftUI · Apple Health · Підписка' : 'Профіль · Підписка · Доступність'}
          </button>
        </div>

        {/* Tab 1: Сьогодні (feature-today) */}
        {activeTab === 'today' && (
          <ScreenToday
            wakeTime={wakeTime}
            bedTime={bedTime}
            targetCycles={targetCycles}
            sleepMelody={sleepMelody}
            wakeMelody={wakeMelody}
            windDownLeadMins={windDownLeadMins}
            nowTimeStr={nowTimeStr}
            weeklyData={weeklyData}
            onNavigateTab={setActiveTab}
            onTriggerSmartScene={handleTriggerSmartScene}
            activeSceneMessage={activeSceneMessage}
            platformMode={platformMode}
            planTier={planTier}
            currentUser={currentUser}
            onUpdateCurrentUser={(updated) => setCurrentUser(updated)}
            onShowToast={(title, desc) => setToastAlert({ title, desc })}
          />
        )}

        {/* Tab 2: Режим (feature-alarm) */}
        {activeTab === 'schedule' && (
          <ScreenSchedule
            wakeTime={wakeTime}
            onChangeWakeTime={setWakeTime}
            targetCycles={targetCycles}
            onChangeTargetCycles={setTargetCycles}
            shiftMinutesStep={shiftMinutesStep}
            onChangeShiftMinutesStep={setShiftMinutesStep}
            shiftDaysInterval={shiftDaysInterval}
            onChangeShiftDaysInterval={setShiftDaysInterval}
            alarmWindowMins={alarmWindowMins}
            onChangeAlarmWindowMins={setAlarmWindowMins}
            fadeCurve={fadeCurve}
            onChangeFadeCurve={setFadeCurve}
            melodies={melodies}
            onAddCustomMelody={(newTrack) =>
              setMelodies((prev) => [newTrack, ...prev])
            }
            sleepMelodyId={sleepMelodyId}
            onSelectSleepMelody={setSleepMelodyId}
            wakeMelodyId={wakeMelodyId}
            onSelectWakeMelody={setWakeMelodyId}
            windDownLeadMins={windDownLeadMins}
            onChangeWindDownLeadMins={setWindDownLeadMins}
            dndEnabled={dndEnabled}
            onToggleDnd={() => setDndEnabled((d) => !d)}
            onTestReminder={(title, desc) => setToastAlert({ title, desc })}
          />
        )}

        {/* Tab 3: Аналітика (feature-analytics) */}
        {activeTab === 'analytics' && (
          <ScreenAnalytics
            weeklyData={weeklyData}
            onUpdateDay={(dayId, updater) =>
              setWeeklyData((prev) =>
                prev.map((d) => (d.id === dayId ? updater(d) : d))
              )
            }
          />
        )}

        {/* Tab 4: Дім і гаджети (feature-smarthome) */}
        {activeTab === 'smarthome' && (
          <ScreenSmartHome
            smartDevices={smartDevices}
            onToggleSmartDevice={handleToggleSmartDevice}
            onTestSmartDevice={handleTestSmartDevice}
            wearables={wearables}
            onToggleWearable={handleToggleWearable}
            onTestWearable={handleTestWearable}
            googleHomeAuthorized={googleHomeAuthorized}
            onToggleGoogleHomeAuth={() => setGoogleHomeAuthorized((a) => !a)}
            onTriggerScene={handleTriggerSmartScene}
            activeSceneBanner={activeSceneMessage}
            platformMode={platformMode}
            planTier={planTier}
            onUpgradeToPro={handleUpgradeToPro}
            onTogglePlanTier={() => handleChangePlanTier(planTier === 'pro' ? 'free' : 'pro')}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <nav
        aria-label="Основна навігація Sleep Coach"
        className={`fixed bottom-0 left-0 right-0 z-40 max-w-6xl mx-auto transition-all ${
          platformMode === 'ios'
            ? 'h-20 bg-[#0F1220]/85 backdrop-blur-2xl border-t border-white/10'
            : 'h-16 bg-[#0F1220]/95 backdrop-blur-md border-t border-[#262D47]'
        }`}
      >
        <div className="grid grid-cols-4 items-center h-14 px-2">
          {[
            { id: 'today', label: 'Сьогодні', icon: Moon },
            { id: 'schedule', label: 'Режим', icon: Clock },
            { id: 'analytics', label: 'Аналітика', icon: BarChart3 },
            { id: 'smarthome', label: 'Дім і гаджети', icon: Home, isProFeature: planTier === 'free' },
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as MainTab);
                  if (platformMode === 'ios' && 'vibrate' in navigator) {
                    try { navigator.vibrate(10); } catch {}
                  }
                }}
                className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer relative ${
                  active
                    ? 'text-[#A390E4] font-bold'
                    : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
                }`}
              >
                <div
                  className={`px-3.5 py-1 rounded-full transition-all relative ${
                    active ? (platformMode === 'ios' ? 'bg-[#A390E4]/20 scale-105' : 'bg-[#A390E4]/15') : ''
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                  {tab.isProFeature && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-extrabold px-1 py-0.2 rounded-full bg-[#F4A261] text-[#0F1220]">
                      PRO
                    </span>
                  )}
                </div>
                <span className={`text-[11px] mt-0.5 tracking-tight whitespace-nowrap ${platformMode === 'ios' ? 'font-medium' : ''}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
        {/* iOS Home Indicator Bar */}
        {platformMode === 'ios' && (
          <div className="w-32 h-1 rounded-full bg-white/25 mx-auto -mt-1" />
        )}
      </nav>

      {/* 5-Step Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        targetCycles={targetCycles}
        onChangeTargetCycles={setTargetCycles}
        wakeTime={wakeTime}
        onChangeWakeTime={setWakeTime}
        melodies={melodies}
        wakeMelodyId={wakeMelodyId}
        onSelectWakeMelody={setWakeMelodyId}
        googleHomeAuthorized={googleHomeAuthorized}
        onConnectGoogleHome={() => setGoogleHomeAuthorized(true)}
        wearableConnected={wearables[0]?.connected ?? true}
        onConnectPrimaryWearable={() => handleToggleWearable('pixel_watch')}
      />

      {/* Profile, Settings, Subscription & Native Architecture Sheet */}
      <ProfileSettingsSheet
        isOpen={showProfileSheet}
        onClose={() => setShowProfileSheet(false)}
        onOpenOnboarding={() => setShowOnboarding(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => {
          setShowProfileSheet(false);
          setShowAuthModal(true);
        }}
        platformMode={platformMode}
        onChangePlatformMode={setPlatformMode}
        amberNightFilter={amberNightFilter}
        onToggleAmberNightFilter={() => setAmberNightFilter((f) => !f)}
        largeFontScale={largeFontScale}
        onToggleLargeFontScale={() => setLargeFontScale((s) => !s)}
        handedness={handedness}
        onChangeHandedness={setHandedness}
        planTier={planTier}
        onChangePlanTier={handleChangePlanTier}
        onLogout={handleLogout}
      />

      {/* Account Registration, Login & Multi-User Switcher Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={currentUser}
        onUserChanged={(u) => {
          setCurrentUser(u);
          setWakeTime(u.wakeTime);
          setTargetCycles(u.targetCycles);
          if (u.plan) {
            setPlanTier(u.plan);
            saveStoredPlanTier(u.plan);
          }
          setToastAlert({
            title: 'Акаунт активовано',
            desc: `Увійшли як ${u.name} (${u.email}) · Тариф: ${u.plan === 'pro' ? 'Sleep Coach Pro 👑' : 'Базовий (Free)'}`,
          });
        }}
        platformMode={platformMode}
        onLogout={handleLogout}
      />

      <OfflineIndicator />
    </div>
  );
}
