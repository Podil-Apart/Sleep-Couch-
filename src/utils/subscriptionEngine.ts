// Sleep Coach — Subscription Engine (Free vs Pro Tier)

export type PlanTier = 'free' | 'pro';

export interface PlanFeature {
  title: string;
  description: string;
  category: 'base' | 'gadgets' | 'smarthome' | 'ai';
  free: boolean;
  pro: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  {
    title: 'Розрахунок 90-хвилинних циклів R90',
    description: 'Оптимальний час засинання та підйому за методологією Ніка Літтлгейлса',
    category: 'base',
    free: true,
    pro: true,
  },
  {
    title: 'Розумний будильник із вікном пробудження',
    description: 'Плавне наростання звуку (sigmoid/exponential) та захист від сонного паралічу',
    category: 'base',
    free: true,
    pro: true,
  },
  {
    title: 'Бібліотека звуків та мелодій сну',
    description: 'Вбудовані аудіотреки природи, частота 432 Гц, рожевий шум та SAF файли',
    category: 'base',
    free: true,
    pro: true,
  },
  {
    title: 'Вечірній ритуал Wind-Down',
    description: 'Дихальний таймер та підготовка до сну за 30-60 хвилин до відбою',
    category: 'base',
    free: true,
    pro: true,
  },
  {
    title: 'Базова статистика та оцінка сну',
    description: 'Журнал тижневих циклів, відсоток виконання плану та Sleep Score',
    category: 'base',
    free: true,
    pro: true,
  },
  {
    title: 'Синхронізація носимих гаджетів (Wearables)',
    description: 'Apple Watch (Ultra/Series), Garmin Fenix, Oura Ring Gen 3, Whoop 4.0, Galaxy Watch',
    category: 'gadgets',
    free: false,
    pro: true,
  },
  {
    title: 'Біометричні дані в реальному часі',
    description: 'Синхронізація пульсу спокою, HRV (варіабельність серцевого ритму), SpO2 через Apple HealthKit та Health Connect',
    category: 'gadgets',
    free: false,
    pro: true,
  },
  {
    title: 'Розумний дім Google Home & Matter',
    description: 'Автоматичне приглушення освітлення спальні, контроль термостата та розумних штор',
    category: 'smarthome',
    free: false,
    pro: true,
  },
  {
    title: 'Apple HomeKit та Швидкі команди Siri',
    description: 'Сцени «Good Night» та «Good Morning», запуск голосом на iPhone, Apple Watch та HomePod',
    category: 'smarthome',
    free: false,
    pro: true,
  },
  {
    title: 'Автоматичні сценарії «Відбій» та «Ранок»',
    description: 'Синхронізація IoT-пристроїв із кривою будильника: світло наростає за 20 хв до підйому',
    category: 'smarthome',
    free: false,
    pro: true,
  },
  {
    title: 'Персоналізований Gemini AI Sleep Coach',
    description: 'Глибокий аналіз щотижневої матриці циклів сну та біометрії трекерами',
    category: 'ai',
    free: false,
    pro: true,
  },
];

const STORAGE_PLAN_KEY = 'sc_subscription_tier';

export function getStoredPlanTier(): PlanTier {
  if (typeof window === 'undefined') return 'pro';
  try {
    const saved = localStorage.getItem(STORAGE_PLAN_KEY);
    if (saved === 'free' || saved === 'pro') {
      return saved;
    }
  } catch (e) {
    console.error('Failed reading plan tier from localStorage', e);
  }
  return 'pro'; // Default to pro for existing users, can toggle freely
}

export function saveStoredPlanTier(plan: PlanTier): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PLAN_KEY, plan);
  } catch (e) {
    console.error('Failed saving plan tier to localStorage', e);
  }
}
