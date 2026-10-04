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
} from 'lucide-react';
import { Handedness } from '../utils/r90Engine';
import { PWAInstallButton } from './PWAInstallButton';

interface ProfileSettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenOnboarding: () => void;
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
  amberNightFilter,
  onToggleAmberNightFilter,
  largeFontScale,
  onToggleLargeFontScale,
  handedness,
  onChangeHandedness,
}) => {
  const [activeSection, setActiveSection] = useState<'profile' | 'architecture'>('profile');
  const [planTier, setPlanTier] = useState<'pro' | 'free'>('pro');

  if (!isOpen) return null;

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
              SC
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Профіль, Налаштування та Підписка
              </h2>
              <p className="text-xs text-[#9FA4BC]">
                Sleep Coach Pro · Синхронізовано з Health Connect
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

        {/* Section Switcher */}
        <div className="flex items-center gap-2 p-1 rounded-2xl bg-[#0F1220] border border-[#262D47]">
          <button
            onClick={() => setActiveSection('profile')}
            className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'profile'
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC]'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Налаштування та Підписка</span>
          </button>
          <button
            onClick={() => setActiveSection('architecture')}
            className={`flex-1 min-h-[44px] rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer ${
              activeSection === 'architecture'
                ? 'bg-[#A390E4] text-[#0F1220]'
                : 'text-[#9FA4BC]'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Архітектура Android (Compose)</span>
          </button>
        </div>

        {activeSection === 'profile' ? (
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
                Повний доступ до 90-хвилинної аналітики R90, розумних сцен Google Home («Відбій» і «Ранок»), інтеграції Garmin/Wear OS та бібліотеки ambient-мелодій.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  onClick={() => setPlanTier(planTier === 'pro' ? 'free' : 'pro')}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#161B2E] border border-[#262D47] text-xs font-semibold text-[#E4E6F0] cursor-pointer"
                >
                  Тариф: {planTier === 'pro' ? 'Річний Pro (Активний)' : 'Базовий безкоштовний'}
                </button>
                <PWAInstallButton darkMode={true} />
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
                    Збільшений масштаб шрифту та TalkBack-орієнтири
                  </div>
                  <div className="text-xs text-[#9FA4BC] mt-0.5">
                    Покращена читабельність без окулярів у ліжку (мін. 48dp зони дотику)
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
        ) : (
          /* Kotlin + Jetpack Compose + Clean Architecture Blueprint */
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-2">
              <div className="font-mono font-bold text-[#A390E4]">
                Модульна структура MVVM + Clean Architecture
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
              <pre className="font-mono text-[11px] text-[#E4E6F0] overflow-x-auto leading-relaxed">
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
