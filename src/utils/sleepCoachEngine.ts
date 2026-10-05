// Sleep Coach — MVVM Domain & Media3/Audio Fade-in Engine

export type MelodyCategory = 'nature' | 'soft_tones' | 'ambient' | 'storage' | 'streaming';
export type FadeCurveType = 'linear' | 'exponential' | 'sigmoid';

export interface MelodyTrack {
  id: string;
  title: string;
  subtitle: string;
  category: MelodyCategory;
  categoryLabel: string;
  durationLabel: string;
  recommendedFor: 'sleep' | 'wake' | 'both';
  synthType: 'rain' | 'ocean' | 'birds' | 'chord_432' | 'crystal_dawn' | 'drone_174' | 'pink_noise' | 'custom_file';
  customObjectUrl?: string;
}

export interface SmartHomeDevice {
  id: string;
  name: string;
  room: string;
  type: 'light' | 'thermostat' | 'blinds' | 'speaker';
  connected: boolean;
  bedtimeState: string;
  morningState: string;
  lastTested?: string;
}

export interface WearableDevice {
  id: string;
  name: string;
  brand: string;
  sourceType: 'Wear OS' | 'Garmin' | 'Fitbit' | 'Xiaomi';
  connected: boolean;
  lastSync: string;
  metricsProvided: string[];
  batteryPct: number;
  testSample: {
    restingHr: number;
    hrvMs: number;
    spo2Pct: number;
    deepSleepMins: number;
  };
}

export interface SleepStageSegment {
  timeLabel: string;
  stage: 'awake' | 'rem' | 'light' | 'deep';
  durationMins: number;
}

export const BUILTIN_MELODIES: MelodyTrack[] = [
  {
    id: 'nature_rain',
    title: 'Нічний дощ у карпатському лісі',
    subtitle: 'Природа · Рівномірний акустичний купол',
    category: 'nature',
    categoryLabel: 'Природа',
    durationLabel: 'Безперервно',
    recommendedFor: 'sleep',
    synthType: 'rain',
  },
  {
    id: 'nature_ocean',
    title: 'Повільний океанський прибій',
    subtitle: 'Природа · Ритм 6 хвиль на хвилину (дихальний темп)',
    category: 'nature',
    categoryLabel: 'Природа',
    durationLabel: 'Безперервно',
    recommendedFor: 'sleep',
    synthType: 'ocean',
  },
  {
    id: 'nature_birds',
    title: 'Світанковий гай та гірський струмок',
    subtitle: 'Природа · М’яка стимуляція кортизолового підйому',
    category: 'nature',
    categoryLabel: 'Природа',
    durationLabel: '20 хв fade-in',
    recommendedFor: 'wake',
    synthType: 'birds',
  },
  {
    id: 'tone_432',
    title: 'Теплий гармонійний акорд 432 Гц',
    subtitle: 'М’які тони · Акустичне фортепіано та обертони',
    category: 'soft_tones',
    categoryLabel: 'М’які тони',
    durationLabel: '20 хв fade-in',
    recommendedFor: 'wake',
    synthType: 'chord_432',
  },
  {
    id: 'tone_crystal',
    title: 'Тибетські чаші бурштинового світанку',
    subtitle: 'М’які тони · Плавний вихід із фази REM',
    category: 'soft_tones',
    categoryLabel: 'М’які тони',
    durationLabel: '15–30 хв',
    recommendedFor: 'wake',
    synthType: 'crystal_dawn',
  },
  {
    id: 'ambient_indigo',
    title: 'Глибокий індиго-дрон 174 Гц',
    subtitle: 'Ambient · Зниження бета-активності кори мозку',
    category: 'ambient',
    categoryLabel: 'Ambient',
    durationLabel: '45 хв fade-out',
    recommendedFor: 'sleep',
    synthType: 'drone_174',
  },
  {
    id: 'ambient_pink',
    title: 'Біометричний рожевий шум (CRP & R90)',
    subtitle: 'Ambient · Маскування зовнішніх звуків спальні',
    category: 'ambient',
    categoryLabel: 'Ambient',
    durationLabel: 'Безперервно',
    recommendedFor: 'both',
    synthType: 'pink_noise',
  },
  {
    id: 'stream_spotify_sleep',
    title: 'Spotify · Deep Sleep & Night Rain',
    subtitle: 'Плейлист Spotify Connect · Авто-зупинка через 45 хв',
    category: 'streaming',
    categoryLabel: 'Spotify / YT Music',
    durationLabel: 'Плейлист',
    recommendedFor: 'sleep',
    synthType: 'drone_174',
  },
  {
    id: 'stream_ytm_morning',
    title: 'YouTube Music · Acoustic Sunrise Routine',
    subtitle: 'YouTube Music · Синхронізовано з fade-in кривою',
    category: 'streaming',
    categoryLabel: 'Spotify / YT Music',
    durationLabel: 'Плейлист',
    recommendedFor: 'wake',
    synthType: 'chord_432',
  },
];

export const INITIAL_SMARTHOME_DEVICES: SmartHomeDevice[] = [
  {
    id: 'hue_bedroom',
    name: 'Світло спальні (Philips Hue)',
    room: 'Спальня',
    type: 'light',
    connected: true,
    bedtimeState: 'Бурштиновий 2000K · Яскравість 8% → Вимк.',
    morningState: 'Світанок 0% → 100% (2700K–4500K за 20 хв)',
  },
  {
    id: 'nest_thermostat',
    name: 'Термостат Google Nest',
    room: 'Спальня',
    type: 'thermostat',
    connected: true,
    bedtimeState: 'Охолодження до 18.0°C (оптимум для NREM)',
    morningState: 'Підігрів до 21.0°C за 15 хв до пробудження',
  },
  {
    id: 'aqara_blinds',
    name: 'Моторизовані штори Blackout',
    room: 'Спальня',
    type: 'blinds',
    connected: true,
    bedtimeState: 'Закриття на 100% (повна ізоляція світла)',
    morningState: 'Плавне відкриття синхронно з мелодією',
  },
  {
    id: 'nest_audio',
    name: 'Акустика Google Nest Audio',
    room: 'Приліжкова зона',
    type: 'speaker',
    connected: false,
    bedtimeState: 'Відтворення шуму дощу (таймер 30 хв)',
    morningState: 'Стерео-будильник з Media3 fade-in',
  },
];

export const INITIAL_WEARABLES: WearableDevice[] = [
  {
    id: 'pixel_watch',
    name: 'Google Pixel Watch 3 (Wear OS)',
    brand: 'Wear OS · Health Connect',
    sourceType: 'Wear OS',
    connected: true,
    lastSync: 'Сьогодні, 06:34',
    metricsProvided: ['Фази сну (REM/Глибокий)', 'ЧСС у спокої', 'HRV', 'Температура шкіри'],
    batteryPct: 84,
    testSample: { restingHr: 53, hrvMs: 71, spo2Pct: 98, deepSleepMins: 104 },
  },
  {
    id: 'garmin_forerunner',
    name: 'Garmin Venu / Forerunner',
    brand: 'Garmin Connect → Health Connect',
    sourceType: 'Garmin',
    connected: false,
    lastSync: 'Вчора, 21:15',
    metricsProvided: ['Body Battery', 'Стрес та HRV', 'Дихання уві сні'],
    batteryPct: 92,
    testSample: { restingHr: 50, hrvMs: 78, spo2Pct: 97, deepSleepMins: 112 },
  },
  {
    id: 'fitbit_charge',
    name: 'Fitbit Charge 6',
    brand: 'Fitbit · Health Connect',
    sourceType: 'Fitbit',
    connected: false,
    lastSync: 'Не синхронізовано',
    metricsProvided: ['Sleep Profile', 'SpO2', 'Мікро-пробудження'],
    batteryPct: 68,
    testSample: { restingHr: 56, hrvMs: 64, spo2Pct: 98, deepSleepMins: 96 },
  },
  {
    id: 'xiaomi_band',
    name: 'Xiaomi Smart Band 9 Pro',
    brand: 'Mi Fitness → Health Connect',
    sourceType: 'Xiaomi',
    connected: false,
    lastSync: 'Не синхронізовано',
    metricsProvided: ['Тривалість фаз', 'Пульс', 'Розумний вібро-будильник'],
    batteryPct: 76,
    testSample: { restingHr: 58, hrvMs: 59, spo2Pct: 97, deepSleepMins: 92 },
  },
];

// iOS Apple HomeKit Devices & Scenes
export const INITIAL_IOS_SMARTHOME_DEVICES: SmartHomeDevice[] = [
  {
    id: 'apple_homepod',
    name: 'Apple HomePod mini (AirPlay 2)',
    room: 'Приліжкова зона',
    type: 'speaker',
    connected: true,
    bedtimeState: 'Акустичний купол дощу (Siri Shortcut "Wind-Down")',
    morningState: 'Стерео-світанок 432 Гц через AirPlay 2 з поступовим наростанням',
  },
  {
    id: 'nanoleaf_matter',
    name: 'Nanoleaf Essentials (Apple Home / Thread)',
    room: 'Спальня',
    type: 'light',
    connected: true,
    bedtimeState: 'Apple Adaptive Lighting: Бурштиновий 1800K (яскравість 6%)',
    morningState: 'Симуляція світанку 0% → 100% (2400K–4500K)',
  },
  {
    id: 'ecobee_thermostat',
    name: 'Ecobee SmartThermostat (HomeKit)',
    room: 'Спальня',
    type: 'thermostat',
    connected: true,
    bedtimeState: 'Охолодження спальні до 18.0°C для глибоких фаз NREM',
    morningState: 'Комфортний підігрів до 21.0°C за 15 хв до будильника',
  },
  {
    id: 'eve_blinds',
    name: 'Eve MotionBlinds (Apple HomeKit / Matter)',
    room: 'Спальня',
    type: 'blinds',
    connected: false,
    bedtimeState: 'Повне закриття 100% за командою "Hey Siri, Good Night"',
    morningState: 'Синхронне відкриття штор під час кривої пробудження',
  },
];

// iOS Apple Health / HealthKit Wearables
export const INITIAL_IOS_WEARABLES: WearableDevice[] = [
  {
    id: 'apple_watch_ultra',
    name: 'Apple Watch Ultra 2 (watchOS 11)',
    brand: 'Apple HealthKit · Native',
    sourceType: 'Wear OS',
    connected: true,
    lastSync: 'Сьогодні, 06:31',
    metricsProvided: ['Фази сну (Core / Deep / REM / Awake)', 'ЧСС у спокої', 'HRV (SDNN)', 'Температура запʼястя'],
    batteryPct: 88,
    testSample: { restingHr: 51, hrvMs: 76, spo2Pct: 99, deepSleepMins: 110 },
  },
  {
    id: 'apple_watch_s10',
    name: 'Apple Watch Series 10',
    brand: 'Apple HealthKit · Native',
    sourceType: 'Wear OS',
    connected: false,
    lastSync: 'Вчора, 22:45',
    metricsProvided: ['Sleep Analysis', 'HRV', 'Дихання уві сні', 'Виявлення апное'],
    batteryPct: 94,
    testSample: { restingHr: 54, hrvMs: 72, spo2Pct: 98, deepSleepMins: 102 },
  },
  {
    id: 'oura_ring_ios',
    name: 'Oura Ring Gen 4 (HealthKit Sync)',
    brand: 'Oura Cloud → Apple Health',
    sourceType: 'Garmin',
    connected: false,
    lastSync: 'Не синхронізовано',
    metricsProvided: ['Readiness Score', 'Sleep Balance', 'Денні мікропаузи Rest'],
    batteryPct: 80,
    testSample: { restingHr: 49, hrvMs: 82, spo2Pct: 98, deepSleepMins: 118 },
  },
  {
    id: 'whoop_ios',
    name: 'WHOOP 4.0 / 5.0 (HealthKit)',
    brand: 'WHOOP Strap → Apple Health',
    sourceType: 'Fitbit',
    connected: false,
    lastSync: 'Не синхронізовано',
    metricsProvided: ['Sleep Need %', 'Recovery Score', 'HRV Baseline'],
    batteryPct: 65,
    testSample: { restingHr: 52, hrvMs: 74, spo2Pct: 98, deepSleepMins: 106 },
  },
];

// Detailed Nightly Hypnogram (7h 12m = 432 mins across 5 cycles from 23:06 to 06:18)
export const LAST_NIGHT_HYPNOGRAM: SleepStageSegment[] = [
  { timeLabel: '23:05', stage: 'awake', durationMins: 12 },
  { timeLabel: '23:20', stage: 'light', durationMins: 32 },
  { timeLabel: '23:52', stage: 'deep', durationMins: 38 },
  { timeLabel: '00:30', stage: 'rem', durationMins: 18 },
  { timeLabel: '00:48', stage: 'light', durationMins: 36 },
  { timeLabel: '01:24', stage: 'deep', durationMins: 34 },
  { timeLabel: '01:58', stage: 'rem', durationMins: 24 },
  { timeLabel: '02:22', stage: 'light', durationMins: 42 },
  { timeLabel: '03:04', stage: 'deep', durationMins: 22 },
  { timeLabel: '03:26', stage: 'rem', durationMins: 28 },
  { timeLabel: '03:54', stage: 'awake', durationMins: 6 },
  { timeLabel: '04:00', stage: 'light', durationMins: 44 },
  { timeLabel: '04:44', stage: 'deep', durationMins: 12 },
  { timeLabel: '04:56', stage: 'rem', durationMins: 32 },
  { timeLabel: '05:28', stage: 'light', durationMins: 30 },
  { timeLabel: '05:58', stage: 'rem', durationMins: 22 },
];

export interface TrendPoint {
  label: string;
  sleepHours: number;
  deepMins: number;
  remMins: number;
  lightMins: number;
  score: number;
  cycles: number;
}

export const WEEKLY_TREND_DATA: TrendPoint[] = [
  { label: 'Пн', sleepHours: 7.5, deepMins: 108, remMins: 102, lightMins: 240, score: 91, cycles: 5 },
  { label: 'Вт', sleepHours: 7.3, deepMins: 102, remMins: 98, lightMins: 238, score: 89, cycles: 5 },
  { label: 'Ср', sleepHours: 7.6, deepMins: 112, remMins: 106, lightMins: 238, score: 93, cycles: 5 },
  { label: 'Чт', sleepHours: 7.1, deepMins: 96, remMins: 94, lightMins: 236, score: 86, cycles: 5 },
  { label: 'Пт', sleepHours: 5.8, deepMins: 78, remMins: 72, lightMins: 198, score: 74, cycles: 4 },
  { label: 'Сб', sleepHours: 7.8, deepMins: 114, remMins: 110, lightMins: 244, score: 90, cycles: 5 },
  { label: 'Нд', sleepHours: 7.2, deepMins: 106, remMins: 100, lightMins: 226, score: 88, cycles: 5 },
];

export const MONTHLY_TREND_DATA: TrendPoint[] = [
  { label: 'Тиж 1', sleepHours: 6.9, deepMins: 94, remMins: 90, lightMins: 230, score: 82, cycles: 31 },
  { label: 'Тиж 2', sleepHours: 7.1, deepMins: 99, remMins: 95, lightMins: 232, score: 85, cycles: 33 },
  { label: 'Тиж 3', sleepHours: 7.3, deepMins: 104, remMins: 99, lightMins: 235, score: 88, cycles: 34 },
  { label: 'Тиж 4', sleepHours: 7.5, deepMins: 109, remMins: 104, lightMins: 237, score: 91, cycles: 35 },
];

// Media3-inspired Web Audio Synthesizer with Fade-in Curves & Custom Audio File Support
class SleepCoachMediaEngine {
  private ctx: AudioContext | null = null;
  private activeSource: AudioNode | null = null;
  private gainNode: GainNode | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  public currentlyPlayingId: string | null = null;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public stop() {
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.currentTime = 0;
      this.htmlAudio = null;
    }
    if (this.activeSource) {
      try {
        (this.activeSource as AudioScheduledSourceNode).stop?.();
      } catch {
        // ignore
      }
      this.activeSource.disconnect();
      this.activeSource = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    this.currentlyPlayingId = null;
  }

  public playTrack(track: MelodyTrack, fadeCurve: FadeCurveType = 'sigmoid') {
    if (this.currentlyPlayingId === track.id) {
      this.stop();
      return false;
    }

    this.stop();
    this.currentlyPlayingId = track.id;

    // If user uploaded a custom file from storage (SAF)
    if (track.synthType === 'custom_file' && track.customObjectUrl) {
      const audio = new Audio(track.customObjectUrl);
      audio.loop = true;
      audio.volume = 0.1;
      audio.play().catch(() => {});
      // Smooth fade-in
      let vol = 0.1;
      const fadeInterval = setInterval(() => {
        if (!this.htmlAudio || this.htmlAudio !== audio) {
          clearInterval(fadeInterval);
          return;
        }
        vol = Math.min(0.85, vol + 0.12);
        audio.volume = vol;
        if (vol >= 0.85) clearInterval(fadeInterval);
      }, 300);
      this.htmlAudio = audio;
      return true;
    }

    this.ensureContext();
    if (!this.ctx) return false;

    const now = this.ctx.currentTime;
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.005, now);

    // Apply requested Media3 fade-in curve over 2.5 seconds preview
    if (fadeCurve === 'linear') {
      gain.gain.linearRampToValueAtTime(0.18, now + 2.5);
    } else if (fadeCurve === 'exponential') {
      gain.gain.exponentialRampToValueAtTime(0.18, now + 2.5);
    } else {
      // Sigmoid-like multi-step ramp
      gain.gain.linearRampToValueAtTime(0.03, now + 0.8);
      gain.gain.linearRampToValueAtTime(0.14, now + 1.7);
      gain.gain.linearRampToValueAtTime(0.18, now + 2.5);
    }

    gain.connect(this.ctx.destination);
    this.gainNode = gain;

    if (
      track.synthType === 'rain' ||
      track.synthType === 'ocean' ||
      track.synthType === 'pink_noise'
    ) {
      const bufferSize = 2 * this.ctx.sampleRate;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0,
        b1 = 0,
        b2 = 0,
        b3 = 0,
        b4 = 0,
        b5 = 0,
        b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        const waveMod =
          track.synthType === 'ocean' ? 0.55 + 0.45 * Math.sin((i / this.ctx.sampleRate) * 1.2) : 1;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045 * waveMod;
        b6 = white * 0.115926;
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      noise.loop = true;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(
        track.synthType === 'rain' ? 820 : track.synthType === 'ocean' ? 440 : 600,
        now
      );

      noise.connect(filter);
      filter.connect(gain);
      noise.start(now);
      this.activeSource = noise;
    } else if (track.synthType === 'drone_174') {
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(174, now);
      osc.connect(gain);
      osc.start(now);
      this.activeSource = osc;
    } else {
      // Harmonic chords for chord_432, crystal_dawn, birds
      const baseFreq =
        track.synthType === 'chord_432'
          ? 216
          : track.synthType === 'crystal_dawn'
          ? 288
          : 340;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.connect(gain);
      osc.start(now);
      this.activeSource = osc;

      // Secondary harmonic chime notes
      [1.25, 1.5, 2.0].forEach((mult, idx) => {
        if (!this.ctx) return;
        const subOsc = this.ctx.createOscillator();
        const subGain = this.ctx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(baseFreq * mult, now + idx * 0.45);
        subGain.gain.setValueAtTime(0.001, now + idx * 0.45);
        subGain.gain.exponentialRampToValueAtTime(0.08, now + idx * 0.45 + 0.5);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.45 + 3.5);
        subOsc.connect(subGain);
        subGain.connect(this.ctx.destination);
        subOsc.start(now + idx * 0.45);
        subOsc.stop(now + idx * 0.45 + 3.6);
      });
    }

    return true;
  }
}

export const sleepCoachMedia = new SleepCoachMediaEngine();
