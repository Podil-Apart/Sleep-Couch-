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
} from 'lucide-react';
import { Handedness } from '../utils/r90Engine';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
  platformMode: 'android' | 'ios';
  onChangePlatformMode: (mode: 'android' | 'ios') => void;
  amberNightFilter: boolean;
  onToggleAmberNightFilter: () => void;
  largeFontScale: boolean;
  onToggleLargeFontScale: () => void;
  handedness: Handedness;
  onChangeHandedness: (h: Handedness) => void;
}

export const ProfileSettingsSheet: React.FC<ProfileSettingsSheetProps> = ({
  isOpen,
  onClose,
  onOpenOnboarding,
  platformMode,
  onChangePlatformMode,
  amberNightFilter,
  onToggleAmberNightFilter,
  largeFontScale,
  onToggleLargeFontScale,
  handedness,
  onChangeHandedness,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'ios' | 'android'>('profile');
  const [planTier, setPlanTier] = useState<'pro' | 'free'>('pro');
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

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
            {/* Subscription Card */}
            <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#A390E4]/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-[#F4A261]">
                  <Crown className="w-4 h-4" />
                  <span>ПІДПИСКА SLEEP COACH PRO</span>
                </div>
                <span className="font-mono text-xs text-[#A390E4]">Активна</span>
              </div>
              <p className="text-xs text-[#9FA4BC] leading-relaxed">
                Повний доступ до 90-хвилинної аналітики R90, розумних сцен Apple HomeKit та Google Home, інтеграції Apple Watch, Garmin, Oura Ring та бібліотеки мелодій.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setPlanTier(planTier === 'pro' ? 'free' : 'pro')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#161B2E] border border-[#262D47] text-xs font-semibold text-[#E4E6F0] cursor-pointer"
                >
                  Тариф: {planTier === 'pro' ? 'Річний Pro (Активний)' : 'Базовий безкоштовний'}
                </button>
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
