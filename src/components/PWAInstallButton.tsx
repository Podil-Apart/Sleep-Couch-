import React, { useState } from 'react';
import { Download, Smartphone, X, WifiOff, Check } from 'lucide-react';
import { usePWAInstall, useOnlineStatus } from '../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  darkMode?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ darkMode = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={async () => {
          if (isInstallable) {
            await install();
          } else {
            setShowGuide(true);
          }
        }}
        className={`min-h-[40px] px-3.5 py-2 rounded-lg text-xs font-medium flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          darkMode
            ? 'bg-[#2A5CAA] text-white hover:bg-[#346BC2]'
            : 'bg-[#1A3E72] text-white hover:bg-[#143059]'
        }`}
        title="Встановити додаток R90 на Android або головний екран"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>Встановити Android</span>
      </button>

      {showGuide && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowGuide(false)}
        >
          <div
            className={`w-full max-w-md rounded-2xl p-6 shadow-xl border ${
              darkMode
                ? 'bg-[#141C2B] border-slate-800 text-slate-100'
                : 'bg-[#F7F5F0] border-[#D5CFC2] text-[#1A1E26]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-current/10">
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-5 h-5 text-[#C83228]" />
                <h3 className="text-base font-semibold">Встановлення додатку на смартфон</h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg hover:bg-black/5 cursor-pointer"
                aria-label="Закрити"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm leading-relaxed">
              {isIOS ? (
                <>
                  <p className="font-medium">Для встановлення на iOS (Safari):</p>
                  <ol className="list-decimal list-inside space-y-2 opacity-90">
                    <li>Натисніть кнопку <strong>«Поділитися» (Share)</strong> на панелі браузера.</li>
                    <li>Оберіть пункт <strong>«На Початковий екран» (Add to Home Screen)</strong>.</li>
                    <li>Підтвердіть додавання іконки <strong>R90 Сон</strong>.</li>
                  </ol>
                </>
              ) : (
                <>
                  <p className="font-medium">Для встановлення на Android (Chrome / Samsung Internet):</p>
                  <ol className="list-decimal list-inside space-y-2 opacity-90">
                    <li>Натисніть меню браузера <strong>(⋮)</strong> у правому верхньому куті.</li>
                    <li>Оберіть <strong>«Встановити додаток»</strong> або <strong>«Додати на головний екран»</strong>.</li>
                    <li>Запускайте <strong>R90 Сон</strong> у повноекранному режимі без адресного рядка.</li>
                  </ol>
                </>
              )}
              <div className="pt-2 text-xs opacity-75 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Працює офлайн · Локальне збереження тижневого теплокаркасу 35/35</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full min-h-[44px] rounded-xl bg-[#1A3E72] text-white text-sm font-medium hover:bg-[#143059] transition-colors cursor-pointer"
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
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-lg bg-[#C83228] px-3.5 py-2 text-xs font-medium text-white shadow-lg">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>Автономний режим — використовується локальний кеш R90</span>
    </div>
  );
};
