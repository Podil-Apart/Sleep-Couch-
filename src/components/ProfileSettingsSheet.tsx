import React, { useState } from 'react';
import {
  User,
  Crown,
  Eye,
  Code2,
  X,
  Check,
  Sparkles,
  PlayCircle,
  Smartphone,
  Apple,
  Copy,
  CheckCheck,
  UserPlus,
  Lock,
  Zap,
  Watch,
  Home,
  Shield,
  LogOut,
  LogIn,
  BookOpen,
  Star,
} from 'lucide-react';
import { Handedness } from '../utils/r90Engine';
import { UserAccount, isGuestUser } from '../utils/authEngine';
import { PlanTier, PLAN_FEATURES } from '../utils/subscriptionEngine';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
  currentUser: UserAccount;
  onOpenAuthModal: () => void;
  platformMode: 'android' | 'ios';
  onChangePlatformMode: (mode: 'android' | 'ios') => void;
  amberNightFilter: boolean;
  onToggleAmberNightFilter: () => void;
  largeFontScale: boolean;
  onToggleLargeFontScale: () => void;
  handedness: Handedness;
  onChangeHandedness: (h: Handedness) => void;
  planTier?: PlanTier;
  onChangePlanTier?: (tier: PlanTier) => void;
  onLogout?: () => void;
}

export const ProfileSettingsSheet: React.FC<ProfileSettingsSheetProps> = ({
  isOpen,
  onClose,
  onOpenOnboarding,
  currentUser,
  onOpenAuthModal,
  platformMode,
  onChangePlatformMode,
  amberNightFilter,
  onToggleAmberNightFilter,
  largeFontScale,
  onToggleLargeFontScale,
  handedness,
  onChangeHandedness,
  planTier = 'pro',
  onChangePlanTier,
  onLogout,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'ios' | 'android'>('profile');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [showAllFeatures, setShowAllFeatures] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const swiftUICode = `import SwiftUI
import HealthKit
import ActivityKit
import AVFoundation

// MARK: - App Entry Point with Live Activities
@main
struct SleepCoachApp: App {
    @State private var sleepManager = SleepCoachManager()
    
    var body: some Scene {
        WindowGroup {
            TodayView()
                .environment(sleepManager)
                .preferredColorScheme(.dark)
        }
    }
}

// MARK: - Today Screen (SwiftUI + Dynamic Island)
struct TodayView: View {
    @Environment(SleepCoachManager.self) private var coach
    @State private var isBreathing = false
    
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Big Biometric Sleep Dial
                    ZStack {
                        Circle()
                            .stroke(Color(hex: 0x232942), lineWidth: 14)
                        
                        Circle()
                            .trim(from: 0, to: coach.sleepProgress)
                            .stroke(
                                Color(hex: 0xA390E4),
                                style: StrokeStyle(lineWidth: 14, lineCap: .round)
                            )
                            .rotationEffect(.degrees(-90))
                            .animation(.smooth(duration: 0.8), value: coach.sleepProgress)
                        
                        VStack(spacing: 6) {
                            Text("Час до відбою")
                                .font(.system(size: 13, weight: .medium, design: .rounded))
                                .foregroundStyle(Color(hex: 0x9FA4BC))
                            Text(coach.timeToBedFormatted)
                                .font(.system(size: 38, weight: .heavy, design: .rounded))
                                .monospacedDigit()
                            Text("Відбій о \\(coach.bedTime)")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(Color(hex: 0xF4A261))
                        }
                    }
                    .frame(width: 270, height: 270)
                    .padding(.top, 12)
                    
                    // Wind-down breathing action button (56pt target)
                    Button {
                        coach.toggleWindDown()
                    } label: {
                        HStack(spacing: 12) {
                            Image(systemName: "moon.stars.fill")
                            Text(coach.isWindDownActive ? "Зупинити Wind-down" : "Почати Wind-down (Apple Home + Звук)")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 56)
                        .background(Color(hex: coach.isWindDownActive ? 0xF4A261 : 0xA390E4))
                        .foregroundStyle(Color(hex: 0x0F1220))
                        .clipShape(RoundedRectangle(cornerRadius: 20, style: .continuous))
                        .scaleEffect(isBreathing ? 1.025 : 0.98)
                    }
                    .sensoryFeedback(.impact(weight: .medium), trigger: coach.isWindDownActive)
                }
                .padding(20)
            }
            .background(Color(hex: 0x0F1220).ignoresSafeArea())
            .navigationTitle("Сьогодні")
        }
    }
}`;

  const swiftHealthKitCode = `import HealthKit

// MARK: - Native Apple HealthKit Sleep Manager
actor HealthKitSleepManager {
    private let healthStore = HKHealthStore()
    
    func requestPermissions() async throws {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        let sleepType = HKCategoryType(.sleepAnalysis)
        let hrvType = HKQuantityType(.heartRateVariabilitySDNN)
        let restingHRType = HKQuantityType(.restingHeartRate)
        
        try await healthStore.requestAuthorization(
            toShare: [sleepType],
            read: [sleepType, hrvType, restingHRType]
        )
    }
    
    func fetchLastNightSleepStages() async throws -> [SleepStageSegment] {
        let sleepType = HKCategoryType(.sleepAnalysis)
        let calendar = Calendar.current
        let now = Date()
        let startOfDay = calendar.date(byAdding: .day, value: -1, to: now)!
        
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.categorySample(type: sleepType, predicate: predicate)],
            sortDescriptors: [SortDescriptor(\\.startDate, order: .forward)]
        )
        
        let samples = try await descriptor.result(for: healthStore)
        return samples.compactMap { sample in
            guard let val = HKCategoryValueSleepAnalysis(rawValue: sample.value) else { return nil }
            let duration = sample.endDate.timeIntervalSince(sample.startDate) / 60
            switch val {
            case .asleepCore: return SleepStageSegment(stage: .light, durationMins: duration)
            case .asleepDeep: return SleepStageSegment(stage: .deep, durationMins: duration)
            case .asleepREM: return SleepStageSegment(stage: .rem, durationMins: duration)
            case .awake: return SleepStageSegment(stage: .awake, durationMins: duration)
            default: return nil
            }
        }
    }
}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 text-[#E4E6F0] shadow-2xl space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#262D47]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#A390E4]/20 border border-[#A390E4]/50 flex items-center justify-center text-[#A390E4] font-bold">
              {platformMode === 'ios' ? <Apple className="w-6 h-6" /> : 'SC'}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                {platformMode === 'ios' ? 'Sleep Coach для iOS (Apple HIG)' : 'Профіль, Налаштування та Підписка'}
              </h2>
              <p className="text-xs text-[#9FA4BC]">
                {platformMode === 'ios'
                  ? 'Підтримка iOS 17/18 · Apple Health · HomeKit · Live Activities'
                  : 'Sleep Coach Pro · Синхронізовано з Health Connect'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="min-h-[48px] min-w-[48px] rounded-xl bg-[#0F1220] flex items-center justify-center text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
            aria-label="Закрити профіль"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Platform Selector Switcher (Android M3 vs Apple iOS HIG) */}
        <div className="p-3 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[#E4E6F0] flex items-center gap-1.5">
              <span>Режим платформи інтерфейсу:</span>
              <span className="text-[#A390E4] font-mono">
                {platformMode === 'ios' ? 'Apple iOS' : 'Google Android'}
              </span>
            </div>
            <div className="text-[11px] text-[#9FA4BC] mt-0.5">
              Перемикає вигляд між Apple Human Interface Guidelines та Android Material 3
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-[#161B2E] border border-[#262D47]">
            <button
              onClick={() => onChangePlatformMode('android')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                platformMode === 'android'
                  ? 'bg-[#A390E4] text-[#0F1220]'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android</span>
            </button>
            <button
              onClick={() => onChangePlatformMode('ios')}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                platformMode === 'ios'
                  ? 'bg-[#A390E4] text-[#0F1220]'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iOS</span>
            </button>
          </div>
        </div>

        {/* Section Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#0F1220] border border-[#262D47]">
          <button
            onClick={() => setActiveSection('profile')}
            className={`min-h-[42px] px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span className="truncate">Налаштування</span>
          </button>
          <button
            onClick={() => setActiveSection('ios')}
            className={`min-h-[42px] px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'ios'
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span className="truncate">SwiftUI (iOS)</span>
          </button>
          <button
            onClick={() => setActiveSection('android')}
            className={`min-h-[42px] px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              activeSection === 'android'
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span className="truncate">Compose (Android)</span>
          </button>
        </div>

        {/* Content based on Active Section */}
        {activeSection === 'profile' && (
          <div className="space-y-5">
            {/* User Account Identity Card */}
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base shadow-md"
                    style={{ backgroundColor: currentUser.avatarColor || '#A390E4' }}
                  >
                    {currentUser.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-[#E4E6F0]">{currentUser.name}</h3>
                      {currentUser.role === 'admin' ? (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F4A261]/20 border border-[#F4A261]/40 text-[#F4A261]">
                          Адміністратор
                        </span>
                      ) : isGuestUser(currentUser) ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-700/60 border border-slate-600/50 text-[#9FA4BC]">
                          Гість
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#A390E4]/15 border border-[#A390E4]/40 text-[#A390E4]">
                          Клієнт
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[#9FA4BC] mt-0.5">{currentUser.email}</div>
                    <div className="text-[11px] text-[#A390E4] font-mono mt-0.5">
                      {isGuestUser(currentUser)
                        ? 'Гостьовий сеанс · Базовий тариф сну'
                        : `Зареєстровано ${currentUser.registeredAt} · Ціль: ${currentUser.targetCycles} циклів R90`}
                    </div>
                  </div>
                </div>

                {!isGuestUser(currentUser) && onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                    title="Вийти з поточного акаунту"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Вийти з акаунту</span>
                  </button>
                )}
              </div>

              <div className="pt-2 border-t border-[#262D47] flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#A390E4] hover:bg-[#b2a2ea] text-[#0F1220] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  {isGuestUser(currentUser) ? (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Увійти / Зареєструватися</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Змінити акаунт / Реєстрація</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#283254] text-[#E4E6F0] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Shield className="w-4 h-4 text-[#F4A261]" />
                  <span>Керування / Панель адміна</span>
                </button>

                {!isGuestUser(currentUser) && onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="sm:hidden w-full min-h-[44px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Вийти з акаунту</span>
                  </button>
                )}
              </div>
            </div>

            {/* Sleep Journal in Profile Overview */}
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold text-[#E4E6F0]">
                  <BookOpen className="w-4 h-4 text-[#A390E4]" />
                  <span>Ранковий щоденник сну в профілі</span>
                </div>
                <span className="text-[#9FA4BC] font-mono text-[11px]">
                  {currentUser.sleepJournal && currentUser.sleepJournal.length > 0
                    ? `${currentUser.sleepJournal.length} запис(ів)`
                    : 'Немає записів'}
                </span>
              </div>
              {currentUser.sleepJournal && currentUser.sleepJournal.length > 0 ? (
                <div className="text-xs text-[#9FA4BC] space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[#E4E6F0]">
                      Останній запис за {currentUser.sleepJournal[0].date}
                    </span>
                    <span className="text-[#F4A261] font-bold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#F4A261]" />
                      {currentUser.sleepJournal[0].sleepQuality}/5
                    </span>
                    {currentUser.sleepJournal[0].stressors && currentUser.sleepJournal[0].stressors.length > 0 && (
                      <span className="text-[11px] text-[#A390E4]">
                        · {currentUser.sleepJournal[0].stressors.join(', ')}
                      </span>
                    )}
                  </div>
                  {currentUser.sleepJournal[0].qualityNotes && (
                    <p className="italic text-[#9FA4BC] line-clamp-1">
                      «{currentUser.sleepJournal[0].qualityNotes}»
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[#9FA4BC]">
                  Ви можете додавати спостереження щоранку у вкладці «Сьогодні».
                </p>
              )}
            </div>

            {/* Subscription Plans: Free vs Pro Division */}
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#A390E4]/40 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-[#F4A261]">
                    <Crown className="w-4 h-4" />
                    <span>ТАРИФНІ ПЛАНИ: БЕЗКОШТОВНИЙ ТА PRO</span>
                  </div>
                  <div className="text-xs text-[#9FA4BC] mt-0.5">
                    У безкоштовному плані — базові функції сну. У Pro — підключення гаджетів та розумного дому.
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold self-start sm:self-auto ${
                  planTier === 'pro'
                    ? 'bg-[#F4A261]/20 border border-[#F4A261]/50 text-[#F4A261]'
                    : 'bg-[#A390E4]/15 border border-[#A390E4]/40 text-[#A390E4]'
                }`}>
                  {planTier === 'pro' ? 'Активний Pro 👑' : 'Активний Free'}
                </span>
              </div>

              {/* Two Plan Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Plan 1: Free */}
                <div
                  onClick={() => onChangePlanTier && onChangePlanTier('free')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    planTier === 'free'
                      ? 'bg-[#161B2E] border-[#A390E4] shadow-md ring-1 ring-[#A390E4]'
                      : 'bg-[#0B0E18] border-[#262D47] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-[#E4E6F0]">Базовий (Free)</span>
                      <span className="text-xs font-mono font-bold text-[#9FA4BC]">0 ₴ / завжди</span>
                    </div>
                    <p className="text-[11px] text-[#9FA4BC] leading-relaxed">
                      Для щоденного ритму за методикою R90 без підключення зовнішніх пристроїв.
                    </p>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#52B788]">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Цикли сну R90 (90 хв)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#52B788]">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Розумний будильник із наростанням</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#52B788]">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Бібліотека мелодій сну та SAF</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#52B788]">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Вечірній Wind-Down ритуал</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#9FA4BC] pt-1">
                        <Lock className="w-3.5 h-3.5 shrink-0 text-[#F4A261]" />
                        <span>Підключення гаджетів недоступне</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangePlanTier && onChangePlanTier('free');
                    }}
                    className={`w-full min-h-[38px] rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      planTier === 'free'
                        ? 'bg-[#1E253D] text-[#A390E4] border border-[#A390E4]/40'
                        : 'bg-[#161B2E] text-[#9FA4BC] hover:text-[#E4E6F0]'
                    }`}
                  >
                    {planTier === 'free' ? 'Поточний тариф' : 'Перемкнути на Free'}
                  </button>
                </div>

                {/* Plan 2: Pro */}
                <div
                  onClick={() => onChangePlanTier && onChangePlanTier('pro')}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden ${
                    planTier === 'pro'
                      ? 'bg-gradient-to-b from-[#1C2038] to-[#161B2E] border-[#F4A261] shadow-lg ring-1 ring-[#F4A261]'
                      : 'bg-[#0B0E18] border-[#262D47] opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Crown className="w-4 h-4 text-[#F4A261]" />
                        <span className="text-sm font-extrabold text-[#E4E6F0]">Sleep Coach Pro</span>
                      </div>
                      <span className="text-xs font-mono font-bold text-[#F4A261]">199 ₴ / міс</span>
                    </div>
                    <p className="text-[11px] text-[#9FA4BC] leading-relaxed">
                      Повне підключення гаджетів, HealthKit, розумного дому Google Home та Apple HomeKit.
                    </p>
                    <div className="space-y-1.5 pt-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-[#52B788]">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0] font-semibold">Усі функції базового плану</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#F4A261]">
                        <Watch className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0] font-bold">Підключення трекерів (Apple Watch, Garmin, Oura)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#F4A261]">
                        <Zap className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Біометрія (HRV, пульс спокою, SpO2)</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#F4A261]">
                        <Home className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Розумний дім: Google Home & Apple HomeKit</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#F4A261]">
                        <Sparkles className="w-3.5 h-3.5 shrink-0" />
                        <span className="text-[#E4E6F0]">Сцени сну, Siri Shortcuts & AI порадник</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onChangePlanTier && onChangePlanTier('pro');
                    }}
                    className={`w-full min-h-[38px] rounded-lg text-xs font-bold transition-all cursor-pointer shadow-md ${
                      planTier === 'pro'
                        ? 'bg-gradient-to-r from-[#A390E4] to-[#F4A261] text-[#0F1220]'
                        : 'bg-[#A390E4] hover:bg-[#b2a2ea] text-[#0F1220]'
                    }`}
                  >
                    {planTier === 'pro' ? 'Активний Pro (Підключено)' : 'Активувати Sleep Coach Pro'}
                  </button>
                </div>
              </div>

              {/* Collapsible Feature Comparison Table */}
              <div className="pt-2 border-t border-[#262D47]">
                <button
                  type="button"
                  onClick={() => setShowAllFeatures(!showAllFeatures)}
                  className="text-xs text-[#A390E4] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>{showAllFeatures ? 'Згорнути порівняння тарифів' : 'Повний список відмінностей Free та Pro'}</span>
                </button>

                {showAllFeatures && (
                  <div className="mt-3 rounded-xl border border-[#262D47] bg-[#0B0E18] divide-y divide-[#262D47] text-xs">
                    {PLAN_FEATURES.map((feat, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between gap-3">
                        <div className="min-w-0 pr-2">
                          <div className="font-semibold text-[#E4E6F0]">{feat.title}</div>
                          <div className="text-[10px] text-[#9FA4BC]">{feat.description}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-center font-mono text-[11px]">
                          <span className={`w-12 px-1 py-0.5 rounded ${feat.free ? 'bg-[#52B788]/20 text-[#52B788]' : 'text-[#9FA4BC]'}`}>
                            {feat.free ? 'Free ✓' : '—'}
                          </span>
                          <span className="w-12 px-1 py-0.5 rounded bg-[#F4A261]/20 text-[#F4A261] font-bold">
                            Pro ✓
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-[#9FA4BC]">
                <span>PWA встановлення на пристрій:</span>
                <PWAInstallButton darkMode={true} platformMode={platformMode} />
              </div>
            </div>

            {/* Accessibility & Night Display Rules */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-[#9FA4BC]">
                Доступність, гігієна екрана після 20:00 та біомеханіка
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold">
                    Захист від білих плям після 20:00 (Бурштиновий фільтр)
                  </div>
                  <div className="text-xs text-[#9FA4BC] mt-0.5">
                    Додаткове приглушення холодного спектру для збереження мелатоніну
                  </div>
                </div>
                <button
                  onClick={onToggleAmberNightFilter}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    amberNightFilter
                      ? 'bg-[#F4A261] text-[#0F1220]'
                      : 'bg-[#161B2E] text-[#9FA4BC]'
                  }`}
                >
                  {amberNightFilter ? 'Увімкнено' : 'Вимкнено'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold">
                    Збільшений масштаб шрифту та доступність
                  </div>
                  <div className="text-xs text-[#9FA4BC] mt-0.5">
                    Apple Dynamic Type / TalkBack зони дотику (мін. 48pt)
                  </div>
                </div>
                <button
                  onClick={onToggleLargeFontScale}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                    largeFontScale
                      ? 'bg-[#A390E4] text-[#0F1220]'
                      : 'bg-[#161B2E] text-[#9FA4BC]'
                  }`}
                >
                  {largeFontScale ? 'Збільшений' : 'Стандартний'}
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold">
                    Робоча рука (Поза ембріона на недомінантній стороні)
                  </div>
                  <div className="text-xs text-[#9FA4BC] mt-0.5">
                    {handedness === 'right'
                      ? 'Правша → Рекомендований сон на лівому боці'
                      : 'Шульга → Рекомендований сон на правому боці'}
                  </div>
                </div>
                <button
                  onClick={() =>
                    onChangeHandedness(handedness === 'right' ? 'left' : 'right')
                  }
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#161B2E] border border-[#262D47] text-xs font-bold text-[#A390E4] cursor-pointer"
                >
                  {handedness === 'right' ? 'Правша' : 'Шульга'}
                </button>
              </div>
            </div>

            {/* Account Session Logout Section */}
            {!isGuestUser(currentUser) && onLogout && (
              <div className="p-4 rounded-2xl bg-[#0F1220] border border-rose-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-bold text-[#E4E6F0] flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Вихід із системи</span>
                  </div>
                  <div className="text-xs text-[#9FA4BC] mt-0.5">
                    Вихід з акаунту {currentUser.name} ({currentUser.email}). Ваші налаштування залишаться збереженими.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Вийти з акаунту</span>
                </button>
              </div>
            )}

            {/* Re-run 5-step Onboarding */}
            <button
              onClick={() => {
                onClose();
                onOpenOnboarding();
              }}
              className="w-full min-h-[48px] rounded-2xl bg-[#1E253D] hover:bg-[#283152] text-xs font-bold text-[#A390E4] flex items-center justify-center gap-2 cursor-pointer"
            >
              <PlayCircle className="w-4 h-4" />
              <span>Пройти 5-кроковий Онбординг повторно</span>
            </button>
          </div>
        )}

        {/* Section 2: iOS Native Architecture (Swift + SwiftUI + HealthKit) */}
        {activeSection === 'ios' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-mono font-bold text-[#A390E4] flex items-center gap-2">
                  <Apple className="w-4 h-4" />
                  <span>Архітектура iOS (SwiftUI + Apple HealthKit + HomeKit)</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#A390E4]/20 text-[#A390E4]">
                  iOS 17+ / iOS 18
                </span>
              </div>
              <ul className="space-y-1.5 text-[#9FA4BC] font-mono leading-relaxed">
                <li>• <strong>UI & Navigation:</strong> SwiftUI з Observation framework (`@Observable`), Cupertino Tabs</li>
                <li>• <strong>Apple HealthKit:</strong> Читання фаз `asleepCore`, `asleepDeep`, `asleepREM`, `awake`, HRV (SDNN)</li>
                <li>• <strong>Live Activities:</strong> ActivityKit + Dynamic Island для відліку 90-хвилинного циклу</li>
                <li>• <strong>HomeKit & Siri:</strong> AppIntents для швидких команд («Hey Siri, start wind-down»)</li>
                <li>• <strong>Audio:</strong> AVFoundation (`AVAudioPlayer`) з сигмоїдною кривою наростання гучності</li>
              </ul>
            </div>

            {/* Code Snippet 1: SwiftUI Screen */}
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#F4A261]">
                  TodayView.swift (SwiftUI + Dial + Wind-down)
                </span>
                <button
                  onClick={() => handleCopyCode('swift_ui', swiftUICode)}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#161B2E] hover:bg-[#202742] text-[#A390E4] text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedIndex === 'swift_ui' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'swift_ui' ? 'Скопійовано' : 'Копіювати Swift'}</span>
                </button>
              </div>
              <pre className="font-mono text-[11px] text-[#E4E6F0] overflow-x-auto leading-relaxed max-h-60 p-2 rounded-xl bg-black/40">
                {swiftUICode}
              </pre>
            </div>

            {/* Code Snippet 2: HealthKit */}
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[#A390E4]">
                  HealthKitSleepManager.swift (Apple Watch Sync)
                </span>
                <button
                  onClick={() => handleCopyCode('swift_health', swiftHealthKitCode)}
                  className="min-h-[36px] px-3 py-1 rounded-lg bg-[#161B2E] hover:bg-[#202742] text-[#A390E4] text-[11px] flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedIndex === 'swift_health' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedIndex === 'swift_health' ? 'Скопійовано' : 'Копіювати Swift'}</span>
                </button>
              </div>
              <pre className="font-mono text-[11px] text-[#E4E6F0] overflow-x-auto leading-relaxed max-h-60 p-2 rounded-xl bg-black/40">
                {swiftHealthKitCode}
              </pre>
            </div>
          </div>
        )}

        {/* Section 3: Android Native Architecture (Kotlin + Compose) */}
        {activeSection === 'android' && (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="font-mono font-bold text-[#A390E4]">
                Модульна структура Android (MVVM + Clean Architecture)
              </div>
              <ul className="space-y-1.5 text-[#9FA4BC] font-mono">
                <li>• :app (Навігація BottomBar, Онбординг, DI Hilt, Профіль)</li>
                <li>• :feature-today (Коло відбою/сну, План дня, Ритуал Wind-down)</li>
                <li>• :feature-alarm (AlarmManager, ForegroundService, Media3 Fade-in, SAF)</li>
                <li>• :feature-analytics (Гіпнограма фаз, Sleep Score, Соціальний джетлаг)</li>
                <li>• :feature-smarthome (Google Home OAuth APIs, Health Connect SDK)</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="font-mono font-bold text-[#F4A261]">
                Приклад Kotlin + Jetpack Compose (Media3 Sigmoid Fade-In & Exact Alarm)
              </div>
              <pre className="font-mono text-[11px] text-[#E4E6F0] overflow-x-auto leading-relaxed p-2 rounded-xl bg-black/40">
{`@Composable
fun WindDownButton(onStartRitual: () -> Unit) {
    val infiniteTransition = rememberInfiniteTransition(label = "breathe")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1.0f,
        targetValue = 1.025f,
        animationSpec = infiniteRepeatable(
            animation = tween(2250, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ), label = "scale"
    )
    Button(
        onClick = onStartRitual,
        modifier = Modifier.fillMaxWidth().heightIn(min = 56.dp).scale(scale),
        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFA390E4))
    ) {
        Text("Почати wind-down", color = Color(0xFF0F1220))
    }
}`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
