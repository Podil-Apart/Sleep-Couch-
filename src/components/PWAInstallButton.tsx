import React, { useState } from 'react';
import { Download, Smartphone, X, WifiOff, Check, Apple, Share } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  darkMode?: boolean;
  platformMode?: 'android' | 'ios';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  darkMode = false,
  platformMode = 'android',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  const effectiveIsIOS = platformMode === 'ios' || isIOS;

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={async () => {
          if (!effectiveIsIOS && isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          effectiveIsIOS
            ? 'bg-black/90 hover:bg-black text-white border border-white/20'
            : darkMode
            ? 'bg-[#2A5CAA] text-white hover:bg-[#346BC2]'
            : 'bg-[#1A3E72] text-white hover:bg-[#143059]'
        }`}
        title={effectiveIsIOS ? 'Встановити Sleep Coach на iPhone / iPad' : 'Встановити додаток Sleep Coach на Android'}
      >
        {effectiveIsIOS ? <Apple className="w-3.5 h-3.5 shrink-0" /> : <Download className="w-3.5 h-3.5 shrink-0" />}
        <span>{effectiveIsIOS ? 'Встановити на iOS (PWA)' : 'Встановити на Android'}</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-md p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border ${
              effectiveIsIOS
                ? 'bg-[#161B2E] border-[#A390E4]/40 text-[#E4E6F0]'
                : darkMode
                ? 'bg-[#141C2B] border-slate-800 text-slate-100'
                : 'bg-[#F7F5F0] border-[#D5CFC2] text-[#1A1E26]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                {effectiveIsIOS ? (
                  <Apple className="w-5 h-5 text-[#A390E4]" />
                ) : (
                  <Smartphone className="w-5 h-5 text-[#F4A261]" />
                )}
                <h3 className="text-base font-bold">
                  {effectiveIsIOS ? 'Встановлення на iPhone та iPad' : 'Встановлення на Android'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-[#0F1220] text-[#9FA4BC] hover:text-white cursor-pointer"
                aria-label="Закрити інструкцію"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5 text-xs sm:text-sm leading-relaxed">
              {effectiveIsIOS ? (
                <>
                  <p className="font-semibold text-white">Як додати Sleep Coach на початковий екран iOS (Safari):</p>
                  <div className="space-y-2.5 rounded-2xl bg-[#0F1220] p-4 border border-white/10">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#A390E4]/20 text-[#A390E4] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        1
                      </span>
                      <span>
                        У нижньому меню Safari натисніть кнопку <strong>«Поділитися»</strong> (квадрат зі стрілкою вгору).
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#A390E4]/20 text-[#A390E4] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        2
                      </span>
                      <span>
                        Прокрутіть список та оберіть пункт <strong>«На Початковий екран» (Add to Home Screen)</strong>.
                      </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#A390E4]/20 text-[#A390E4] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        3
                      </span>
                      <span>
                        Натисніть <strong>«Додати»</strong> у правому верхньому куті.
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#9FA4BC]">
                    Додаток відкриватиметься на повний екран без панелей Safari, підтримує автономну роботу та темну тему без білих спалахів.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-white">Для встановлення на Android (Chrome / Samsung Internet):</p>
                  <ol className="list-decimal list-inside space-y-2 text-[#9FA4BC]">
                    <li>Натисніть меню браузера <strong>(⋮)</strong> у правому верхньому куті.</li>
                    <li>Оберіть <strong>«Встановити додаток»</strong> або <strong>«Додати на головний екран»</strong>.</li>
                    <li>Запускайте <strong>Sleep Coach</strong> у повноекранному режимі без адресного рядка.</li>
                  </ol>
                </>
              )}
              <div className="pt-2 text-xs text-[#9FA4BC] flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Офлайн-кеш R90 · Збереження щоденного розкладу</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[46px] rounded-2xl bg-[#A390E4] text-[#0F1220] text-sm font-bold hover:bg-[#b2a2ea] transition-colors cursor-pointer"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-2xl bg-[#C83228] px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-white/20">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Автономний режим — локальний кеш R90</span>
    </div>
  );
};
