import React, { useState, useRef } from 'react';
import {
  Clock,
  Sliders,
  Volume2,
  Play,
  Square,
  FolderOpen,
  Music2,
  Bell,
  ShieldAlert,
  Check,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react';
import {
  MelodyTrack,
  MelodyCategory,
  FadeCurveType,
  sleepCoachMedia,
} from '../utils/sleepCoachEngine';
import {
  formatMinutesToTime,
  parseTimeToMinutes,
} from '../utils/r90Engine';

interface ScreenScheduleProps {
  wakeTime: string;
  onChangeWakeTime: (val: string) => void;
  targetCycles: number;
  onChangeTargetCycles: (cycles: number) => void;
  shiftMinutesStep: number;
  onChangeShiftMinutesStep: (mins: number) => void;
  shiftDaysInterval: number;
  onChangeShiftDaysInterval: (days: number) => void;
  alarmWindowMins: number;
  onChangeAlarmWindowMins: (mins: number) => void;
  fadeCurve: FadeCurveType;
  onChangeFadeCurve: (curve: FadeCurveType) => void;
  melodies: MelodyTrack[];
  onAddCustomMelody: (track: MelodyTrack) => void;
  sleepMelodyId: string;
  onSelectSleepMelody: (id: string) => void;
  wakeMelodyId: string;
  onSelectWakeMelody: (id: string) => void;
  windDownLeadMins: 30 | 60;
  onChangeWindDownLeadMins: (mins: 30 | 60) => void;
  dndEnabled: boolean;
  onToggleDnd: () => void;
  onTestReminder: (title: string, desc: string) => void;
}

export const ScreenSchedule: React.FC<ScreenScheduleProps> = ({
  wakeTime,
  onChangeWakeTime,
  targetCycles,
  onChangeTargetCycles,
  shiftMinutesStep,
  onChangeShiftMinutesStep,
  shiftDaysInterval,
  onChangeShiftDaysInterval,
  alarmWindowMins,
  onChangeAlarmWindowMins,
  fadeCurve,
  onChangeFadeCurve,
  melodies,
  onAddCustomMelody,
  sleepMelodyId,
  onSelectSleepMelody,
  wakeMelodyId,
  onSelectWakeMelody,
  windDownLeadMins,
  onChangeWindDownLeadMins,
  dndEnabled,
  onToggleDnd,
  onTestReminder,
}) => {
  const [melodyTarget, setMelodyTarget] = useState<'sleep' | 'wake'>('wake');
  const [categoryFilter, setCategoryFilter] = useState<'all' | MelodyCategory>('all');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const [previewingAlarm, setPreviewingAlarm] = useState(false);

  // DND Exceptions state
  const [dndExceptions, setDndExceptions] = useState({
    starredContacts: true,
    repeatCallers: true,
    alarmsOnly: true,
    crpMicroPauses: true,
  });

  // Gradual permission explanation banner (Android best practice from spec)
  const [permissionNotice, setPermissionNotice] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const wakeMins = parseTimeToMinutes(wakeTime);
  const sleepDurationMins = targetCycles * 90;
  const bedTime = formatMinutesToTime(wakeMins - sleepDurationMins);
  const alarmWindowStart = formatMinutesToTime(wakeMins - alarmWindowMins);

  const handlePlayPreview = (track: MelodyTrack) => {
    const started = sleepCoachMedia.playTrack(track, fadeCurve);
    setPlayingTrackId(started ? track.id : null);
    setPreviewingAlarm(false);
  };

  const handleAlarmPreview = () => {
    const wakeTrack = melodies.find((m) => m.id === wakeMelodyId) || melodies[2];
    if (previewingAlarm) {
      sleepCoachMedia.stop();
      setPreviewingAlarm(false);
      setPlayingTrackId(null);
    } else {
      const started = sleepCoachMedia.playTrack(wakeTrack, fadeCurve);
      setPreviewingAlarm(started);
      setPlayingTrackId(started ? wakeTrack.id : null);
    }
  };

  const handleSafFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    const cleanName = file.name.replace(/\.[^/.]+$/, '');
    const newTrack: MelodyTrack = {
      id: `saf_${Date.now()}`,
      title: cleanName,
      subtitle: 'Додано зі сховища пристрою (SAF File Picker)',
      category: 'storage',
      categoryLabel: 'Сховище SAF',
      durationLabel: 'Локальний файл',
      recommendedFor: 'both',
      synthType: 'custom_file',
      customObjectUrl: objectUrl,
    };
    onAddCustomMelody(newTrack);
    if (melodyTarget === 'sleep') {
      onSelectSleepMelody(newTrack.id);
    } else {
      onSelectWakeMelody(newTrack.id);
    }
    handlePlayPreview(newTrack);
  };

  const filteredMelodies = melodies.filter((m) =>
    categoryFilter === 'all' ? true : m.category === categoryFilter
  );

  // SVG path for fade-in curve visualization
  const getCurvePath = (curve: FadeCurveType) => {
    if (curve === 'linear') {
      return 'M 10 80 L 290 15';
    }
    if (curve === 'exponential') {
      return 'M 10 80 Q 210 78 290 15';
    }
    // sigmoid
    return 'M 10 80 C 120 80, 160 15, 290 15';
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Sleep Goal & Gradual Schedule Shift */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Goal Card */}
        <div className="lg:col-span-6 rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
          <div>
            <span className="text-xs text-[#9FA4BC]">Ціль та біоритм</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-0.5">
              Бажаний час пробудження та тривалість
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47]">
              <label
                htmlFor="schedule-wake-input"
                className="text-xs text-[#9FA4BC] block"
              >
                Час пробудження
              </label>
              <input
                id="schedule-wake-input"
                type="time"
                value={wakeTime}
                onChange={(e) => onChangeWakeTime(e.target.value || '06:30')}
                className="mt-1.5 w-full min-h-[48px] bg-transparent font-display text-2xl font-extrabold text-[#F4A261] focus:outline-none cursor-pointer tabular-nums"
              />
              <span className="text-[11px] text-[#9FA4BC] block mt-1">
                Константа циркадного ритму
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47]">
              <span className="text-xs text-[#9FA4BC] block">
                Рекомендований відбій
              </span>
              <div className="mt-1.5 font-display text-2xl font-extrabold text-[#A390E4] min-h-[48px] flex items-center tabular-nums">
                {bedTime}
              </div>
              <span className="text-[11px] text-[#9FA4BC] block mt-1">
                {targetCycles} циклів · {(targetCycles * 1.5).toFixed(1)} год сну
              </span>
            </div>
          </div>

          {/* Duration Selector in 90-min Cycles */}
          <div>
            <div className="flex items-center justify-between text-xs text-[#9FA4BC] mb-2">
              <span>Тривалість сну (90-хвилинні цикли)</span>
              <span className="font-mono text-[#E4E6F0] font-semibold">
                {Math.floor((targetCycles * 90) / 60)}г {(targetCycles * 90) % 60}хв
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { cycles: 4, label: '6г 00хв', sub: '4 цикли' },
                { cycles: 5, label: '7г 30хв', sub: '5 циклів' },
                { cycles: 5.5, label: '8г 15хв', sub: 'Адаптивний' },
                { cycles: 6, label: '9г 00хв', sub: '6 циклів' },
              ].map((opt) => {
                const active = targetCycles === opt.cycles;
                return (
                  <button
                    key={opt.cycles}
                    onClick={() => onChangeTargetCycles(opt.cycles)}
                    className={`min-h-[52px] p-2 rounded-2xl border text-center transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#A390E4] text-[#0F1220] border-[#A390E4] font-bold'
                        : 'bg-[#0F1220] border-[#262D47] text-[#E4E6F0] hover:border-[#A390E4]/50'
                    }`}
                  >
                    <div className="text-xs font-mono font-bold">{opt.label}</div>
                    <div className="text-[10px] opacity-80">{opt.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Gradual Schedule Shift Slider Card */}
        <div className="lg:col-span-6 rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 flex flex-col justify-between space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#9FA4BC]">М’яка адаптація хронотипу</span>
                <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-0.5">
                  Поступовий зсув розкладу
                </h2>
              </div>
              <Sliders className="w-5 h-5 text-[#A390E4]" />
            </div>
            <p className="text-xs text-[#9FA4BC] mt-1">
              Зсувайте відбій та підйом поступово без стресу для нервової системи: на <strong>{shiftMinutesStep} хв раніше кожні {shiftDaysInterval} дні</strong>.
            </p>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#9FA4BC]">Крок зсуву часу:</span>
                <span className="font-mono font-bold text-[#A390E4]">
                  на {shiftMinutesStep} хв раніше
                </span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={5}
                value={shiftMinutesStep}
                onChange={(e) => onChangeShiftMinutesStep(Number(e.target.value))}
                className="w-full h-2 rounded-lg accent-[#A390E4] cursor-pointer"
                aria-label="Крок зсуву часу в хвилинах"
              />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[#9FA4BC]">Періодичність закріплення:</span>
                <span className="font-mono font-bold text-[#F4A261]">
                  кожні {shiftDaysInterval} дні
                </span>
              </div>
              <input
                type="range"
                min={2}
                max={5}
                step={1}
                value={shiftDaysInterval}
                onChange={(e) => onChangeShiftDaysInterval(Number(e.target.value))}
                className="w-full h-2 rounded-lg accent-[#F4A261] cursor-pointer"
                aria-label="Інтервал днів для зсуву розкладу"
              />
            </div>
          </div>

          {/* 4-Step Schedule Shift Preview */}
          <div className="p-3.5 rounded-2xl bg-[#0F1220] border border-[#262D47] grid grid-cols-4 gap-2 text-center">
            {[3, 2, 1, 0].map((stepIdx) => {
              const offset = stepIdx * shiftMinutesStep;
              const stepWake = formatMinutesToTime(wakeMins + offset);
              const dayNum = (3 - stepIdx) * shiftDaysInterval + 1;
              return (
                <div key={stepIdx} className="space-y-0.5">
                  <div className="text-[10px] text-[#9FA4BC]">
                    {stepIdx === 0 ? 'Ціль' : `День ${dayNum}`}
                  </div>
                  <div
                    className={`font-mono text-xs font-bold tabular-nums ${
                      stepIdx === 0 ? 'text-[#F4A261]' : 'text-[#E4E6F0]'
                    }`}
                  >
                    {stepWake}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Section 2: Smart Alarm with Smooth Fade-in Window & Curve */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#262D47]">
          <div>
            <span className="text-xs text-[#F4A261]">
              AlarmManager Exact Alarms + Foreground Service · Media3 ExoPlayer
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-0.5">
              Будильник із плавним пробудженням ({alarmWindowStart} – {wakeTime})
            </h2>
            <p className="text-xs text-[#9FA4BC] mt-1">
              Світло та мелодія наростають у легкому або REM-сні, щоб уникнути ранкової інерції.
            </p>
          </div>

          <button
            onClick={handleAlarmPreview}
            className={`min-h-[48px] px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-colors shrink-0 cursor-pointer ${
              previewingAlarm
                ? 'bg-[#F4A261] text-[#0F1220]'
                : 'bg-[#A390E4] text-[#0F1220] hover:bg-[#B4A3EC]'
            }`}
          >
            {previewingAlarm ? (
              <>
                <Square className="w-4 h-4" />
                <span>Зупинити попередній перегляд</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Попередній перегляд пробудження</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Window Selector & Curve Type */}
          <div className="lg:col-span-7 space-y-5">
            <div>
              <span className="text-xs text-[#9FA4BC] block mb-2">
                Вікно плавного пробудження до {wakeTime}:
              </span>
              <div className="grid grid-cols-4 gap-2.5">
                {[10, 15, 20, 30].map((win) => (
                  <button
                    key={win}
                    onClick={() => onChangeAlarmWindowMins(win)}
                    className={`min-h-[48px] rounded-xl font-mono text-xs font-bold border transition-colors cursor-pointer ${
                      alarmWindowMins === win
                        ? 'bg-[#F4A261] text-[#0F1220] border-[#F4A261]'
                        : 'bg-[#0F1220] border-[#262D47] text-[#E4E6F0] hover:border-[#F4A261]/50'
                    }`}
                  >
                    {win} хв
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs text-[#9FA4BC] block mb-2">
                Крива наростання гучності (Media3 Fade-in):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'sigmoid',
                    label: 'Сигмоїдна (Природна)',
                    desc: 'Тихий старт, плавний підйом',
                  },
                  {
                    id: 'exponential',
                    label: 'Експоненційна (М’яка)',
                    desc: 'Повільне наростання до фіналу',
                  },
                  {
                    id: 'linear',
                    label: 'Лінійна (Рівномірна)',
                    desc: 'Стабільний приріст гучності',
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onChangeFadeCurve(c.id as FadeCurveType)}
                    className={`min-h-[56px] p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                      fadeCurve === c.id
                        ? 'bg-[#1E253D] border-[#A390E4] text-[#E4E6F0]'
                        : 'bg-[#0F1220] border-[#262D47] text-[#9FA4BC] hover:text-[#E4E6F0]'
                    }`}
                  >
                    <div className="text-xs font-bold">{c.label}</div>
                    <div className="text-[10px] opacity-80 mt-0.5">{c.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Visualization of the Volume & Sunrise Fade-in Curve */}
          <div className="lg:col-span-5 p-4 rounded-2xl bg-[#0F1220] border border-[#262D47]">
            <div className="flex items-center justify-between text-xs text-[#9FA4BC] mb-2">
              <span>Графік гучності та світла ({alarmWindowMins} хв)</span>
              <span className="font-mono text-[#F4A261]">0% → 100%</span>
            </div>
            <svg viewBox="0 0 300 95" className="w-full h-24 overflow-visible">
              <line x1="10" y1="80" x2="290" y2="80" stroke="#262D47" strokeWidth="1.5" />
              <line x1="10" y1="15" x2="290" y2="15" stroke="#262D47" strokeWidth="1" strokeDasharray="4 4" />
              <path
                d={getCurvePath(fadeCurve)}
                fill="none"
                stroke="#F4A261"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="10" cy="80" r="4" fill="#A390E4" />
              <circle cx="290" cy="15" r="5" fill="#F4A261" />
            </svg>
            <div className="flex items-center justify-between text-[11px] font-mono text-[#9FA4BC] mt-1">
              <span>Старт fade-in: {alarmWindowStart}</span>
              <span>Пік пробудження: {wakeTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Melody Library (Separate for Sleep & Wake + SAF File Picker + Spotify/YouTube Music) */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#262D47]">
          <div>
            <span className="text-xs text-[#9FA4BC]">Аудіотека сну та ранку</span>
            <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-0.5">
              Бібліотека мелодій
            </h2>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              Оберіть окрему звукову сцену для вечірнього засинання та ранкового будильника.
            </p>
          </div>

          {/* Target Switcher: Sleep vs Wake Melody */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#0F1220] border border-[#262D47] self-start md:self-auto">
            <button
              onClick={() => setMelodyTarget('wake')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                melodyTarget === 'wake'
                  ? 'bg-[#F4A261] text-[#0F1220]'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span>Для пробудження</span>
            </button>
            <button
              onClick={() => setMelodyTarget('sleep')}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer ${
                melodyTarget === 'sleep'
                  ? 'bg-[#A390E4] text-[#0F1220]'
                  : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span>Для засинання</span>
            </button>
          </div>
        </div>

        {/* Category Filters + SAF File Picker Button + Streaming Button */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Усі категорії' },
              { id: 'nature', label: 'Природа' },
              { id: 'soft_tones', label: 'М’які тони' },
              { id: 'ambient', label: 'Ambient' },
              { id: 'streaming', label: 'Spotify / YT Music' },
              { id: 'storage', label: 'Зі сховища' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id as 'all' | MelodyCategory)}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-[#262D47] text-[#E4E6F0]'
                    : 'bg-[#0F1220] text-[#9FA4BC] hover:text-[#E4E6F0]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Hidden SAF file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleSafFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#283152] border border-[#A390E4]/40 text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 text-[#A390E4]" />
              <span>Додати зі сховища (SAF)</span>
            </button>

            <button
              onClick={() => setCategoryFilter('streaming')}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1E253D] hover:bg-[#283152] border border-[#F4A261]/40 text-xs font-semibold text-[#E4E6F0] flex items-center gap-2 cursor-pointer"
            >
              <Music2 className="w-4 h-4 text-[#F4A261]" />
              <span>З Spotify / YouTube Music</span>
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredMelodies.map((track) => {
            const isSelectedForWake = track.id === wakeMelodyId;
            const isSelectedForSleep = track.id === sleepMelodyId;
            const isPlaying = playingTrackId === track.id;

            return (
              <div
                key={track.id}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                  (melodyTarget === 'wake' && isSelectedForWake) ||
                  (melodyTarget === 'sleep' && isSelectedForSleep)
                    ? 'bg-[#1E253D] border-[#A390E4]'
                    : 'bg-[#0F1220] border-[#262D47]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => handlePlayPreview(track)}
                    className={`min-h-[48px] min-w-[48px] rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                      isPlaying
                        ? 'bg-[#F4A261] text-[#0F1220]'
                        : 'bg-[#161B2E] text-[#A390E4] hover:bg-[#232B47]'
                    }`}
                    aria-label={`Прослухати ${track.title}`}
                  >
                    {isPlaying ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#E4E6F0] truncate">
                      {track.title}
                    </div>
                    <div className="text-xs text-[#9FA4BC] truncate mt-0.5">
                      {track.subtitle}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-[#9FA4BC] mt-1">
                      <span>{track.categoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{track.durationLabel}</span>
                      {isSelectedForSleep && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#A390E4] font-semibold">На відбій</span>
                        </>
                      )}
                      {isSelectedForWake && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#F4A261] font-semibold">На підйом</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (melodyTarget === 'wake') {
                      onSelectWakeMelody(track.id);
                    } else {
                      onSelectSleepMelody(track.id);
                    }
                  }}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold shrink-0 cursor-pointer ${
                    (melodyTarget === 'wake' && isSelectedForWake) ||
                    (melodyTarget === 'sleep' && isSelectedForSleep)
                      ? 'bg-[#A390E4] text-[#0F1220]'
                      : 'bg-[#161B2E] text-[#E4E6F0] hover:bg-[#262D47]'
                  }`}
                >
                  {(melodyTarget === 'wake' && isSelectedForWake) ||
                  (melodyTarget === 'sleep' && isSelectedForSleep)
                    ? 'Обрано'
                    : 'Обрати'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: Rest Reminders & Do Not Disturb (DND) with Exceptions */}
      <div className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-5">
        <div>
          <span className="text-xs text-[#9FA4BC]">WorkManager & Notification Policy</span>
          <h2 className="text-lg sm:text-xl font-bold text-[#E4E6F0] mt-0.5">
            Нагадування про відпочинок та режим «Не турбувати»
          </h2>
        </div>

        {permissionNotice && (
          <div className="p-4 rounded-2xl bg-[#1E253D] border border-[#A390E4] flex items-start justify-between gap-3">
            <div className="text-xs text-[#E4E6F0] leading-relaxed">
              <strong className="text-[#A390E4] block mb-0.5">
                Поступовий запит дозволу Android ( Контекстне пояснення ):
              </strong>
              {permissionNotice}
            </div>
            <button
              onClick={() => setPermissionNotice(null)}
              className="min-h-[40px] px-3 py-1 rounded-lg bg-[#A390E4] text-[#0F1220] text-xs font-bold shrink-0 cursor-pointer"
            >
              Надати дозвіл
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Wind-down Lead Time: 60 or 30 min before sleep */}
          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#E4E6F0]">
                  Нагадування «Час згортатися»
                </h3>
                <p className="text-xs text-[#9FA4BC] mt-0.5">
                  Сповіщення про підготовку до сну о{' '}
                  {formatMinutesToTime(wakeMins - sleepDurationMins - windDownLeadMins)}
                </p>
              </div>
              <Bell className="w-5 h-5 text-[#A390E4]" />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[60, 30].map((mins) => (
                <button
                  key={mins}
                  onClick={() => onChangeWindDownLeadMins(mins as 30 | 60)}
                  className={`min-h-[48px] rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    windDownLeadMins === mins
                      ? 'bg-[#A390E4] text-[#0F1220] border-[#A390E4]'
                      : 'bg-[#161B2E] border-[#262D47] text-[#E4E6F0]'
                  }`}
                >
                  За {mins} хв до сну
                </button>
              ))}
            </div>

            <button
              onClick={() =>
                onTestReminder(
                  `Час згортатися (${windDownLeadMins} хв до сну)`,
                  'Відкладіть яскраві екрани, увімкніть бурштинове світло та підготуйте спальню.'
                )
              }
              className="w-full min-h-[44px] rounded-xl bg-[#161B2E] hover:bg-[#1E253D] text-xs font-semibold text-[#A390E4] cursor-pointer"
            >
              Перевірити сповіщення зараз
            </button>
          </div>

          {/* Do Not Disturb with Exceptions */}
          <div className="p-5 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#E4E6F0]">
                  Режим «Не турбувати» з винятками
                </h3>
                <p className="text-xs text-[#9FA4BC] mt-0.5">
                  Автоматично під час wind-down, нічного сну та денних мікропауз CRP
                </p>
              </div>
              <button
                onClick={() => {
                  if (!dndEnabled) {
                    setPermissionNotice(
                      'Дозвіл NotificationPolicyAccess потрібен, щоб автоматично вимикати сторонні звуки під час сну, пропускаючи лише дзвінки від обраних близьких контактів.'
                    );
                  }
                  onToggleDnd();
                }}
                className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  dndEnabled
                    ? 'bg-[#A390E4] text-[#0F1220]'
                    : 'bg-[#161B2E] text-[#9FA4BC]'
                }`}
              >
                {dndEnabled ? 'Увімкнено' : 'Вимкнено'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { key: 'starredContacts', label: 'Обрані контакти (Сім’я)' },
                { key: 'repeatCallers', label: 'Повторні дзвінки (за 15 хв)' },
                { key: 'alarmsOnly', label: 'Будильник та світанок' },
                { key: 'crpMicroPauses', label: 'Денні мікропаузи (13:00, 17:30)' },
              ].map((item) => {
                const active =
                  dndExceptions[item.key as keyof typeof dndExceptions];
                return (
                  <button
                    key={item.key}
                    onClick={() =>
                      setDndExceptions((prev) => ({
                        ...prev,
                        [item.key]: !prev[item.key as keyof typeof dndExceptions],
                      }))
                    }
                    className="min-h-[44px] px-3 py-2 rounded-xl bg-[#161B2E] border border-[#262D47] flex items-center justify-between text-xs text-left cursor-pointer"
                  >
                    <span className="truncate pr-2">{item.label}</span>
                    {active && <Check className="w-4 h-4 text-[#F4A261] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
