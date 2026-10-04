// R90 Biometric Sleep & Recovery System Engine (Nick Littlehales Methodology)

export type Handedness = 'right' | 'left';

export interface DayRecoveryRecord {
  id: string;
  dayShort: string;
  dayFull: string;
  nightCycles: number; // 1 to 6 cycles (each 90 min)
  middayCrp: boolean; // 12:00 - 14:00 (counts as 1 recovery unit in the 35/35 matrix, per Page 15 of PDF)
  eveningCrp: boolean; // 17:00 - 19:00 (counts as 1 recovery unit in the 35/35 matrix, per Page 15 of PDF)
  morningProtocolDone: boolean;
  preSleepRoutineDone: boolean;
  notes?: string;
}

export interface ReminderRule {
  id: string;
  title: string;
  timeWindow: string;
  triggerTime: string; // HH:MM
  category: 'wake' | 'crp_midday' | 'crp_evening' | 'winddown' | 'sleep_start';
  description: string;
  moduleRef: string;
  enabled: boolean;
}

export interface CycleOption {
  cycles: number;
  hours: number;
  bedTime: string;
  windDownStart: string;
  label: string;
  statusText: string;
  isOptimal: boolean;
  isRecommendedFallback?: boolean;
}

// Default weekly data matching Page 15 of the PDF ("Синтез: Тижневий теплокаркас відновлення — Рахунок: 35/35")
// Notice on Page 15:
// Пн: 5 blue (Night/Midday) + 1 red (Evening) = 6
// Вт: 5 blue + 1 red = 6
// Ср: 5 blue + 1 red = 6
// Чт: 5 blue + 1 red = 6
// Пт: 3 blue (пізня п'ятниця!) + 0 red = 3
// Сб: 3 blue + 1 red = 4
// Нд: 3 blue + 1 red = 4
// Total blocks on Page 15 = 6 + 6 + 6 + 6 + 3 + 4 + 4 = 35 / 35!
export const INITIAL_WEEKLY_DATA: DayRecoveryRecord[] = [
  {
    id: 'mon',
    dayShort: 'Пн',
    dayFull: 'Понеділок',
    nightCycles: 5,
    middayCrp: false,
    eveningCrp: true,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
    notes: 'Стабільний старт тижня + вечірній CRP о 17:30',
  },
  {
    id: 'tue',
    dayShort: 'Вт',
    dayFull: 'Вівторок',
    nightCycles: 5,
    middayCrp: false,
    eveningCrp: true,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
    notes: '5 нічних циклів + 30 хв розвантаження нейронів увечері',
  },
  {
    id: 'wed',
    dayShort: 'Ср',
    dayFull: 'Середа',
    nightCycles: 5,
    middayCrp: false,
    eveningCrp: true,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
    notes: 'Екватор тижня без боргу сну',
  },
  {
    id: 'thu',
    dayShort: 'Чт',
    dayFull: 'Четвер',
    nightCycles: 5,
    middayCrp: false,
    eveningCrp: true,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
    notes: 'Підготовка до високого навантаження в п’ятницю',
  },
  {
    id: 'fri',
    dayShort: 'Пт',
    dayFull: 'П’ятниця',
    nightCycles: 3,
    middayCrp: false,
    eveningCrp: false,
    morningProtocolDone: true,
    preSleepRoutineDone: false,
    notes: 'Пізня п’ятниця (старт о 02:00 — 3 повні цикли до 06:30)',
  },
  {
    id: 'sat',
    dayShort: 'Сб',
    dayFull: 'Субота',
    nightCycles: 3,
    middayCrp: true,
    eveningCrp: false,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
    notes: 'Тактичний денний CRP у полудень (13:00) компенсує п’ятницю',
  },
  {
    id: 'sun',
    dayShort: 'Нд',
    dayFull: 'Неділя',
    nightCycles: 3,
    middayCrp: true,
    eveningCrp: false,
    morningProtocolDone: true,
    preSleepRoutineDone: true,
    notes: 'Синхронізація перед новим тижнем — баланс 35/35 досягнуто',
  },
];

export function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Reverse Engineering of the Evening (Зворотний інжиніринг вашого вечора - Стор. 5)
 * Given a fixed wake time (e.g. 06:30), calculates exact 90-minute cycle start windows.
 */
export function calculateCycleWindows(wakeTime: string, currentMinutes?: number): CycleOption[] {
  const wakeMins = parseTimeToMinutes(wakeTime);
  const options: CycleOption[] = [6, 5, 4, 3, 2, 1].map((cycles) => {
    const durationMins = cycles * 90;
    const bedMins = wakeMins - durationMins;
    const windDownMins = bedMins - 90;

    let label = '';
    let statusText = '';
    if (cycles === 6) {
      label = 'Супер-відновлення';
      statusText = 'Компенсація дефіциту після високих навантажень';
    } else if (cycles === 5) {
      label = 'Ідеальний старт чемпіона';
      statusText = 'Оптимальна добова норма (7.5 годин · 5 циклів)';
    } else if (cycles === 4) {
      label = 'Тактичний резерв';
      statusText = 'Заснули пізно? Наступне вікно без розриву фази';
    } else if (cycles === 3) {
      label = 'Пізній вечір / Виїзд';
      statusText = 'Мінімум для збереження когнітивної форми + CRP вдень';
    } else if (cycles === 2) {
      label = 'Екстрена синхронізація';
      statusText = 'Лише 2 повні цикли до фіксованого підйому';
    } else {
      label = 'Одиночний цикл';
      statusText = 'Фінальне 90-хвилинне вікно перед світанком';
    }

    return {
      cycles,
      hours: (cycles * 90) / 60,
      bedTime: formatMinutesToTime(bedMins),
      windDownStart: formatMinutesToTime(windDownMins),
      label,
      statusText,
      isOptimal: cycles === 5,
    };
  });

  if (currentMinutes !== undefined) {
    // Highlight the next upcoming cycle entry point
    let bestDiff = Infinity;
    let bestCycles = 5;
    for (const opt of options) {
      const bMins = parseTimeToMinutes(opt.bedTime);
      let diff = bMins - currentMinutes;
      if (diff < -15) diff += 1440;
      if (diff >= -15 && diff < bestDiff) {
        bestDiff = diff;
        bestCycles = opt.cycles;
      }
    }
    return options.map((o) => ({
      ...o,
      isRecommendedFallback: o.cycles === bestCycles,
    }));
  }

  return options;
}

export function buildDefaultReminders(wakeTime: string, targetCycles: number = 5): ReminderRule[] {
  const wakeMins = parseTimeToMinutes(wakeTime);
  const bedMins = wakeMins - targetCycles * 90;
  const windDownMins = bedMins - 90;

  return [
    {
      id: 'wake_protocol',
      title: 'Протокол запуску: Світанок та перші 90 хвилин',
      timeWindow: `${formatMinutesToTime(wakeMins)} – ${formatMinutesToTime(wakeMins + 90)}`,
      triggerTime: formatMinutesToTime(wakeMins),
      category: 'wake',
      description: 'Симулятор світанку · Вода та перекус · Легкі вправи · Детокс від смартфонів (захист від кортизолового шоку).',
      moduleRef: 'Модуль 4 · Критичне вікно',
      enabled: true,
    },
    {
      id: 'crp_midday',
      title: 'Денне вікно CRP: Полудневий спад енергії',
      timeWindow: '12:00 – 14:00',
      triggerTime: '13:00',
      category: 'crp_midday',
      description: 'Другий природний період для сну. 30 хвилин безперервної ізоляції (1/3 циклу) для розвантаження нейронів.',
      moduleRef: 'Модуль 2 · Біоробочий ритм',
      enabled: true,
    },
    {
      id: 'crp_evening',
      title: 'Мікро-відновлення CRP: Ранній вечір',
      timeWindow: '17:00 – 19:00',
      triggerTime: '17:30',
      category: 'crp_evening',
      description: 'Вікно для мікро-відновлення після робочого піку. Тихе місце, аудіо-ізоляція, зупинка обробки інформації.',
      moduleRef: 'Модуль 2 · Формула CRP',
      enabled: true,
    },
    {
      id: 'pre_sleep_winddown',
      title: 'Вечірня декомпресія (90 хв до старту сну)',
      timeWindow: `${formatMinutesToTime(windDownMins)} – ${formatMinutesToTime(bedMins)}`,
      triggerTime: formatMinutesToTime(windDownMins),
      category: 'winddown',
      description: 'Перехід від яскравого світла до теплого бурштинового, охолодження спальні, підготовка носового дихання.',
      moduleRef: 'Модуль 1 та 3 · Підготовка',
      enabled: true,
    },
    {
      id: 'sleep_entry',
      title: `Точка входу в сон (${targetCycles} циклів · ${(targetCycles * 1.5).toFixed(1)} год)`,
      timeWindow: formatMinutesToTime(bedMins),
      triggerTime: formatMinutesToTime(bedMins),
      category: 'sleep_start',
      description: 'Поза ембріона на недомінантній стороні, дихання носом, вирівнювання хребта без масивних подушок.',
      moduleRef: 'Модуль 1 · Зворотний інжиніринг',
      enabled: true,
    },
  ];
}

// Web Audio API Synthesizer for CRP Isolation Sound & Dawn Simulator Chime
class BiometricAudioEngine {
  private ctx: AudioContext | null = null;
  private noiseNode: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private oscNode: OscillatorNode | null = null;
  public isPlaying: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public startCrpSoundscape(mode: 'pink_noise' | 'alpha_drone' = 'pink_noise') {
    this.stop();
    this.initContext();
    if (!this.ctx) return;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 1.5);
    gain.connect(this.ctx.destination);
    this.gainNode = gain;

    if (mode === 'pink_noise') {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      // Warm low-pass filter for neural unloading
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, this.ctx.currentTime);

      whiteNoise.connect(filter);
      filter.connect(gain);
      whiteNoise.start(0);
      this.noiseNode = whiteNoise;
    } else {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(174, this.ctx.currentTime); // Solfeggio low calming tone
      osc.connect(gain);
      osc.start();
      this.oscNode = osc;
    }

    this.isPlaying = true;
  }

  public playDawnHarmonicChime() {
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // C4, E4, G4, C5 soft dawn chord
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.35);

      g.gain.setValueAtTime(0.001, now + idx * 0.35);
      g.gain.exponentialRampToValueAtTime(0.12, now + idx * 0.35 + 0.4);
      g.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.35 + 3.2);

      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + idx * 0.35);
      osc.stop(now + idx * 0.35 + 3.3);
    });
  }

  public stop() {
    if (this.noiseNode) {
      try {
        (this.noiseNode as AudioBufferSourceNode).stop();
      } catch {
        // ignore
      }
      this.noiseNode.disconnect();
      this.noiseNode = null;
    }
    if (this.oscNode) {
      try {
        this.oscNode.stop();
      } catch {
        // ignore
      }
      this.oscNode.disconnect();
      this.oscNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.isPlaying = false;
  }
}

export const biometricAudio = new BiometricAudioEngine();
