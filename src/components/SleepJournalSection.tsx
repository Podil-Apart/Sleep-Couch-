import React, { useState } from 'react';
import {
  BookOpen,
  Plus,
  Star,
  Sparkles,
  CloudMoon,
  AlertTriangle,
  Smile,
  Zap,
  Coffee,
  Smartphone,
  Volume2,
  Thermometer,
  Utensils,
  Briefcase,
  Dumbbell,
  Clock,
  Trash2,
  Edit3,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Heart,
  Moon,
} from 'lucide-react';
import {
  UserAccount,
  SleepJournalEntry,
  DreamType,
  MorningMood,
  addSleepJournalEntry,
  updateSleepJournalEntry,
  deleteSleepJournalEntry,
} from '../utils/authEngine';

interface SleepJournalSectionProps {
  currentUser: UserAccount;
  onUpdateCurrentUser: (user: UserAccount) => void;
  onShowToast?: (title: string, desc: string) => void;
  platformMode?: 'android' | 'ios';
}

const COMMON_STRESSORS = [
  { id: 'caffeine', label: 'Кофеїн після 14:00', icon: Coffee },
  { id: 'screens', label: 'Екрани перед сном', icon: Smartphone },
  { id: 'noise_light', label: 'Шум або вуличне світло', icon: Volume2 },
  { id: 'room_temp', label: 'Спекотно або душно (>19°C)', icon: Thermometer },
  { id: 'late_meal', label: 'Пізня вечеря / алкоголь', icon: Utensils },
  { id: 'work_stress', label: 'Робочий стрес / дедлайн', icon: Briefcase },
  { id: 'late_workout', label: 'Пізнє інтенсивне тренування', icon: Dumbbell },
];

const DREAM_TYPES: { id: DreamType; label: string; desc: string }[] = [
  { id: 'vivid', label: 'Яскраві', desc: 'Детальні, насичені емоціями' },
  { id: 'lucid', label: 'Люцидні', desc: 'Усвідомлене сновидіння' },
  { id: 'neutral', label: 'Нейтральні', desc: 'Звичайні повсякденні сюжети' },
  { id: 'nightmare', label: 'Тривожні', desc: 'Кошмари або неспокій' },
  { id: 'none', label: 'Без снів', desc: 'Не пам’ятаю сновидінь' },
];

const MOODS: { id: MorningMood; label: string; iconEmoji: string }[] = [
  { id: 'energized', label: 'Бадьорий', iconEmoji: '⚡' },
  { id: 'calm', label: 'Спокійний', iconEmoji: '🧘' },
  { id: 'groggy', label: 'Сонливий', iconEmoji: '😴' },
  { id: 'tired', label: 'Втомлений', iconEmoji: '🥱' },
  { id: 'anxious', label: 'Тривожний', iconEmoji: '🌪️' },
];

export const SleepJournalSection: React.FC<SleepJournalSectionProps> = ({
  currentUser,
  onUpdateCurrentUser,
  onShowToast,
  platformMode = 'android',
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Form State
  const todayDateStr = new Date().toISOString().split('T')[0];
  const [entryDate, setEntryDate] = useState(todayDateStr);
  const [sleepQuality, setSleepQuality] = useState<number>(5);
  const [qualityNotes, setQualityNotes] = useState('');
  const [dreams, setDreams] = useState('');
  const [dreamType, setDreamType] = useState<DreamType>('neutral');
  const [selectedStressors, setSelectedStressors] = useState<string[]>([]);
  const [stressorsNotes, setStressorsNotes] = useState('');
  const [moodOnWaking, setMoodOnWaking] = useState<MorningMood>('energized');
  const [wakeEase, setWakeEase] = useState<number>(4);

  const entries: SleepJournalEntry[] = currentUser.sleepJournal || [];

  // Check if today's entry already exists
  const todayEntry = entries.find((e) => e.date === todayDateStr);

  const resetForm = () => {
    setEntryDate(todayDateStr);
    setSleepQuality(5);
    setQualityNotes('');
    setDreams('');
    setDreamType('neutral');
    setSelectedStressors([]);
    setStressorsNotes('');
    setMoodOnWaking('energized');
    setWakeEase(4);
    setEditingEntryId(null);
  };

  const handleOpenNewEntry = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (entry: SleepJournalEntry) => {
    setEditingEntryId(entry.id);
    setEntryDate(entry.date);
    setSleepQuality(entry.sleepQuality);
    setQualityNotes(entry.qualityNotes || '');
    setDreams(entry.dreams || '');
    setDreamType(entry.dreamType || 'neutral');
    setSelectedStressors(entry.stressors || []);
    setStressorsNotes(entry.stressorsNotes || '');
    setMoodOnWaking(entry.moodOnWaking || 'calm');
    setWakeEase(entry.wakeEase || 3);
    setIsFormOpen(true);
  };

  const handleToggleStressor = (stressorLabel: string) => {
    setSelectedStressors((prev) =>
      prev.includes(stressorLabel)
        ? prev.filter((s) => s !== stressorLabel)
        : [...prev, stressorLabel]
    );
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingEntryId) {
      // Update existing
      const updatedUser = updateSleepJournalEntry(currentUser.id, editingEntryId, {
        date: entryDate,
        sleepQuality,
        qualityNotes,
        dreams,
        dreamType,
        stressors: selectedStressors,
        stressorsNotes,
        moodOnWaking,
        wakeEase,
      });
      if (updatedUser) {
        onUpdateCurrentUser(updatedUser);
        onShowToast?.(
          'Щоденник оновлено',
          `Запис за ${entryDate} збережено в профілі користувача ${updatedUser.name}.`
        );
      }
    } else {
      // Add new
      const res = addSleepJournalEntry(currentUser.id, {
        date: entryDate,
        sleepQuality,
        qualityNotes,
        dreams,
        dreamType,
        stressors: selectedStressors,
        stressorsNotes,
        moodOnWaking,
        wakeEase,
      });
      if (res.success && res.user) {
        onUpdateCurrentUser(res.user);
        onShowToast?.(
          'Запис збережено в профіль',
          `Ранкові спостереження за ${entryDate} успішно зафіксовані.`
        );
      }
    }

    setIsFormOpen(false);
    resetForm();
  };

  const handleDeleteEntry = (entryId: string) => {
    const updatedUser = deleteSleepJournalEntry(currentUser.id, entryId);
    if (updatedUser) {
      onUpdateCurrentUser(updatedUser);
      onShowToast?.('Запис видалено', 'Запис щоденника видалено з вашого профілю.');
    }
  };

  const averageQuality =
    entries.length > 0
      ? (
          entries.reduce((acc, curr) => acc + curr.sleepQuality, 0) /
          entries.length
        ).toFixed(1)
      : null;

  return (
    <section
      className="rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 space-y-6"
      aria-label="Ранковий щоденник сну"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#262D47]">
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#0F1220] border border-[#A390E4]/40 flex items-center justify-center text-[#A390E4] shrink-0 mt-0.5 shadow-inner">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono uppercase tracking-wider text-[#A390E4]">
                Ранкова фіксація
              </span>
              <span className="text-xs text-[#9FA4BC]">·</span>
              <span className="text-xs text-[#9FA4BC]">
                Зберігається у профілі: <strong className="text-[#E4E6F0]">{currentUser.name}</strong>
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#E4E6F0] mt-0.5">
              Ранковий щоденник сну (Sleep Journal)
            </h3>
            <p className="text-xs text-[#9FA4BC] mt-0.5">
              Фіксуйте якість відновлення, сновидіння та зовнішні стресори щоранку для оптимізації циклів R90.
            </p>
          </div>
        </div>

        {/* Right Action Button & Meta Stats */}
        <div className="flex items-center gap-3 self-start sm:self-auto shrink-0">
          {averageQuality && (
            <div className="hidden md:flex flex-col items-end text-xs">
              <span className="text-[#9FA4BC]">Сер. якість сну</span>
              <span className="font-bold text-[#F4A261] flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#F4A261]" />
                <span>{averageQuality} / 5</span>
              </span>
            </div>
          )}

          {!isFormOpen && (
            <button
              onClick={handleOpenNewEntry}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#A390E4] hover:bg-[#b2a2ea] text-[#0F1220] text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>{todayEntry ? 'Додати ще один запис' : 'Записати спостереження'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Today's Entry Quick Status Card (if recorded) */}
      {!isFormOpen && todayEntry && (
        <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#52B788]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-[#52B788] font-semibold">
              <Check className="w-4 h-4 shrink-0" />
              <span>Сьогоднішній ранковий запис збережено</span>
              <span className="text-[#9FA4BC]">·</span>
              <span className="text-[#9FA4BC] font-mono">{todayEntry.createdAt}</span>
            </div>
            <div className="text-sm font-semibold text-[#E4E6F0] flex items-center gap-2 flex-wrap">
              <span>Оцінка якості:</span>
              <span className="text-[#F4A261] font-bold flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-[#F4A261]" />
                {todayEntry.sleepQuality}/5
              </span>
              <span className="text-[#9FA4BC]">·</span>
              <span>Самопочуття: {MOODS.find((m) => m.id === todayEntry.moodOnWaking)?.iconEmoji} {MOODS.find((m) => m.id === todayEntry.moodOnWaking)?.label}</span>
              {todayEntry.dreamType && todayEntry.dreamType !== 'none' && (
                <>
                  <span className="text-[#9FA4BC]">·</span>
                  <span className="text-[#A390E4]">Сни: {DREAM_TYPES.find((d) => d.id === todayEntry.dreamType)?.label}</span>
                </>
              )}
            </div>
            {todayEntry.qualityNotes && (
              <p className="text-xs text-[#9FA4BC] italic line-clamp-1">
                «{todayEntry.qualityNotes}»
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleStartEdit(todayEntry)}
              className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-[#1E253D] hover:bg-[#283254] text-xs font-semibold text-[#E4E6F0] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 text-[#A390E4]" />
              <span>Редагувати</span>
            </button>
          </div>
        </div>
      )}

      {/* Interactive Form for New / Edit Entry */}
      {isFormOpen && (
        <form
          onSubmit={handleSaveEntry}
          className="p-5 sm:p-6 rounded-2xl bg-[#0F1220] border-2 border-[#A390E4]/40 space-y-5 animate-in fade-in"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#262D47]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#A390E4]" />
              <h4 className="text-base font-bold text-[#E4E6F0]">
                {editingEntryId ? 'Редагування запису щоденника' : 'Новий запис у щоденник сну'}
              </h4>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="min-h-[36px] min-w-[36px] rounded-lg bg-[#161B2E] text-[#9FA4BC] hover:text-[#E4E6F0] flex items-center justify-center cursor-pointer"
              aria-label="Закрити форму"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Date & Sleep Quality Rating */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9FA4BC] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#A390E4]" />
                  <span>Дата ночі / пробудження</span>
                </label>
                <input
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  className="w-full min-h-[44px] px-3.5 rounded-xl bg-[#161B2E] border border-[#262D47] text-sm text-[#E4E6F0] focus:outline-none focus:border-[#A390E4]"
                />
              </div>

              {/* 5-Star Sleep Quality Rating */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9FA4BC] flex items-center justify-between">
                  <span>Суб’єктивна якість сну (1–5)</span>
                  <span className="text-xs font-bold text-[#F4A261]">
                    {sleepQuality === 5 && '5 — Ідеальний R90'}
                    {sleepQuality === 4 && '4 — Добре відновлення'}
                    {sleepQuality === 3 && '3 — Посередній сон'}
                    {sleepQuality === 2 && '2 — Часті пробудження'}
                    {sleepQuality === 1 && '1 — Дуже неспокійний'}
                  </span>
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSleepQuality(star)}
                      className={`min-h-[44px] rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                        sleepQuality >= star
                          ? 'bg-[#F4A261]/20 border-[#F4A261] text-[#F4A261]'
                          : 'bg-[#161B2E] border-[#262D47] text-[#9FA4BC] hover:border-white/20'
                      }`}
                    >
                      <Star
                        className={`w-4 h-4 ${
                          sleepQuality >= star ? 'fill-[#F4A261]' : ''
                        }`}
                      />
                      <span className="text-[10px] font-bold mt-0.5">{star}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9FA4BC]">
                  Нотатки про сон та відчуття після пробудження
                </label>
                <textarea
                  rows={3}
                  value={qualityNotes}
                  onChange={(e) => setQualityNotes(e.target.value)}
                  placeholder="Як швидко заснули? Чи були мікро-пробудження посеред ночі? Наскільки глибоким відчувався сон..."
                  className="w-full p-3 rounded-xl bg-[#161B2E] border border-[#262D47] text-xs text-[#E4E6F0] placeholder-[#9FA4BC]/40 focus:outline-none focus:border-[#A390E4] resize-none"
                />
              </div>
            </div>

            {/* 2. Dreams & Morning Mood */}
            <div className="space-y-3">
              {/* Dream Type Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9FA4BC] flex items-center gap-1.5">
                  <CloudMoon className="w-3.5 h-3.5 text-[#A390E4]" />
                  <span>Категорія сновидінь</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {DREAM_TYPES.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDreamType(d.id)}
                      className={`min-h-[40px] px-2 py-1 rounded-xl text-xs font-semibold transition-all border text-center cursor-pointer ${
                        dreamType === d.id
                          ? 'bg-[#A390E4] border-[#A390E4] text-[#0F1220]'
                          : 'bg-[#161B2E] border-[#262D47] text-[#9FA4BC] hover:text-[#E4E6F0]'
                      }`}
                      title={d.desc}
                    >
                      <span className="truncate">{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dream Story / Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9FA4BC]">
                  Сюжет сновидіння або ключові образи
                </label>
                <textarea
                  rows={3}
                  value={dreams}
                  onChange={(e) => setDreams(e.target.value)}
                  placeholder="Що снилося? Сюжет, яскраві деталі, емоції чи персонажі..."
                  className="w-full p-3 rounded-xl bg-[#161B2E] border border-[#262D47] text-xs text-[#E4E6F0] placeholder-[#9FA4BC]/40 focus:outline-none focus:border-[#A390E4] resize-none"
                />
              </div>

              {/* Morning Mood / Energy */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#9FA4BC] flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-[#F4A261]" />
                  <span>Самопочуття при підйомі</span>
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {MOODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMoodOnWaking(m.id)}
                      className={`min-h-[42px] px-1 py-1 rounded-xl text-xs font-semibold transition-all border flex flex-col items-center justify-center cursor-pointer ${
                        moodOnWaking === m.id
                          ? 'bg-[#F4A261] border-[#F4A261] text-[#0F1220]'
                          : 'bg-[#161B2E] border-[#262D47] text-[#9FA4BC] hover:text-[#E4E6F0]'
                      }`}
                    >
                      <span className="text-sm">{m.iconEmoji}</span>
                      <span className="text-[10px] mt-0.5 truncate">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 3. External Stressors (Full Width) */}
          <div className="space-y-2 pt-2 border-t border-[#262D47]">
            <label className="text-xs font-semibold text-[#9FA4BC] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-[#F4A261]" />
              <span>Зовнішні фактори та стресори минулої доби (оберіть наявні)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {COMMON_STRESSORS.map((s) => {
                const IconComp = s.icon;
                const active = selectedStressors.includes(s.label);
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleToggleStressor(s.label)}
                    className={`min-h-[42px] px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all border cursor-pointer text-left ${
                      active
                        ? 'bg-[#F4A261]/20 border-[#F4A261] text-[#F4A261]'
                        : 'bg-[#161B2E] border-[#262D47] text-[#9FA4BC] hover:border-white/20'
                    }`}
                  >
                    <IconComp className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>

            <input
              type="text"
              value={stressorsNotes}
              onChange={(e) => setStressorsNotes(e.target.value)}
              placeholder="Додаткові фактори (наприклад: ліки, переїзд, домашній улюбленець розбудив...)"
              className="w-full min-h-[40px] px-3.5 rounded-xl bg-[#161B2E] border border-[#262D47] text-xs text-[#E4E6F0] placeholder-[#9FA4BC]/40 focus:outline-none focus:border-[#A390E4] mt-1"
            />
          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#262D47]">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
                resetForm();
              }}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#161B2E] hover:bg-[#202742] text-xs font-semibold text-[#9FA4BC] transition-colors cursor-pointer"
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="min-h-[44px] px-6 py-2 rounded-xl bg-[#A390E4] hover:bg-[#b2a2ea] text-[#0F1220] text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Зберегти в профіль</span>
            </button>
          </div>
        </form>
      )}

      {/* Entries List / History (Sorted by Date descending) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-[#9FA4BC]">
          <span className="font-semibold">
            Історія записів у щоденнику ({entries.length})
          </span>
          <span>Останні спостереження зберігаються в локальному профілі</span>
        </div>

        {entries.length === 0 ? (
          <div className="p-8 rounded-2xl bg-[#0F1220] border border-[#262D47] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#161B2E] text-[#A390E4] flex items-center justify-center mx-auto">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="text-sm font-bold text-[#E4E6F0]">
              Щоденник сну поки порожній
            </div>
            <p className="text-xs text-[#9FA4BC] max-w-md mx-auto leading-relaxed">
              Запишіть свої перші ранкові спостереження: оцініть якість сну, опишіть сновидіння або зазначте зовнішні фактори для аналізу кореляцій.
            </p>
            <button
              onClick={handleOpenNewEntry}
              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#A390E4] text-[#0F1220] text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow"
            >
              <Plus className="w-4 h-4" />
              <span>Створити перший запис</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {entries.map((entry) => {
              const isExpanded = expandedEntryId === entry.id;
              const moodItem = MOODS.find((m) => m.id === entry.moodOnWaking);
              const dreamItem = DREAM_TYPES.find((d) => d.id === entry.dreamType);

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl bg-[#0F1220] border border-[#262D47] hover:border-white/20 transition-all overflow-hidden"
                >
                  {/* Summary Bar */}
                  <div
                    onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#161B2E] border border-[#262D47] flex flex-col items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-[#F4A261]">
                          {entry.sleepQuality}
                        </span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(entry.sleepQuality)].map((_, i) => (
                            <div
                              key={i}
                              className="w-1 h-1 rounded-full bg-[#F4A261]"
                            />
                          ))}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#E4E6F0]">
                            {entry.date}
                          </span>
                          <span className="text-xs text-[#9FA4BC]">·</span>
                          <span className="text-xs text-[#9FA4BC] font-mono">
                            {entry.createdAt}
                          </span>
                          {moodItem && (
                            <>
                              <span className="text-xs text-[#9FA4BC]">·</span>
                              <span className="text-xs text-[#E4E6F0] flex items-center gap-1">
                                <span>{moodItem.iconEmoji}</span>
                                <span>{moodItem.label}</span>
                              </span>
                            </>
                          )}
                          {dreamItem && dreamItem.id !== 'none' && (
                            <>
                              <span className="text-xs text-[#9FA4BC]">·</span>
                              <span className="text-xs text-[#A390E4]">
                                Сни: {dreamItem.label}
                              </span>
                            </>
                          )}
                        </div>

                        {entry.qualityNotes ? (
                          <div className="text-xs text-[#9FA4BC] mt-0.5 truncate max-w-xl">
                            {entry.qualityNotes}
                          </div>
                        ) : entry.dreams ? (
                          <div className="text-xs text-[#9FA4BC] mt-0.5 truncate max-w-xl">
                            Сон: {entry.dreams}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      {entry.stressors && entry.stressors.length > 0 && (
                        <span className="text-[11px] text-[#F4A261] font-mono">
                          {entry.stressors.length} стресор(ів)
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartEdit(entry);
                        }}
                        className="min-h-[34px] min-w-[34px] rounded-lg bg-[#161B2E] hover:bg-[#202742] text-[#9FA4BC] hover:text-[#A390E4] flex items-center justify-center cursor-pointer transition-colors"
                        title="Редагувати запис"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEntry(entry.id);
                        }}
                        className="min-h-[34px] min-w-[34px] rounded-lg bg-[#161B2E] hover:bg-rose-950/60 text-[#9FA4BC] hover:text-rose-400 flex items-center justify-center cursor-pointer transition-colors"
                        title="Видалити запис"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div className="text-[#9FA4BC] pl-1">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Detail View */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#262D47] space-y-3.5 bg-[#0A0D16]/50 text-xs text-[#E4E6F0]">
                      {entry.qualityNotes && (
                        <div>
                          <div className="font-semibold text-[#9FA4BC] mb-1">
                            Якість сну та відчуття:
                          </div>
                          <p className="bg-[#161B2E] p-3 rounded-xl text-[#E4E6F0] leading-relaxed">
                            {entry.qualityNotes}
                          </p>
                        </div>
                      )}

                      {entry.dreams && (
                        <div>
                          <div className="font-semibold text-[#A390E4] mb-1 flex items-center gap-1.5">
                            <CloudMoon className="w-3.5 h-3.5" />
                            <span>Сновидіння ({dreamItem?.label || 'Зафіксовано'}):</span>
                          </div>
                          <p className="bg-[#161B2E] p-3 rounded-xl text-[#E4E6F0] leading-relaxed">
                            {entry.dreams}
                          </p>
                        </div>
                      )}

                      {((entry.stressors && entry.stressors.length > 0) || entry.stressorsNotes) && (
                        <div>
                          <div className="font-semibold text-[#F4A261] mb-1 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Зовнішні фактори та стресори:</span>
                          </div>
                          <div className="bg-[#161B2E] p-3 rounded-xl space-y-2">
                            {entry.stressors && entry.stressors.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {entry.stressors.map((s, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2.5 py-1 rounded-lg bg-[#F4A261]/15 text-[#F4A261] border border-[#F4A261]/30 font-medium text-[11px]"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            )}
                            {entry.stressorsNotes && (
                              <p className="text-xs text-[#9FA4BC] leading-relaxed pt-1">
                                {entry.stressorsNotes}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
