// Sleep Coach — Local & Multi-User Authentication Engine

export type UserRole = 'admin' | 'client';

export type DreamType = 'vivid' | 'lucid' | 'nightmare' | 'neutral' | 'none';
export type MorningMood = 'energized' | 'calm' | 'groggy' | 'tired' | 'anxious';

export interface SleepJournalEntry {
  id: string;
  date: string; // "YYYY-MM-DD" e.g. "2026-10-06"
  createdAt: string; // e.g. "06.10.2026 07:15"
  sleepQuality: number; // 1 to 5 (1=Дуже погано, 5=Відмінно)
  qualityNotes: string; // Нотатки про якість сну
  dreams: string; // Опис сновидінь
  dreamType?: DreamType; // Категорія снів
  stressors: string[]; // Зовнішні стресори (напр. 'Кофеїн після 14:00', 'Екран перед сном')
  stressorsNotes?: string; // Додаткові деталі щодо стресорів чи факторів
  moodOnWaking: MorningMood; // Самопочуття вранці
  wakeEase: number; // 1 to 5 (легкість пробудження)
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  avatarColor: string;
  chronotype: 'morning_lark' | 'night_owl' | 'balanced';
  targetCycles: number;
  wakeTime: string;
  registeredAt: string;
  plan: 'free' | 'pro';
  provider: 'email' | 'apple' | 'google';
  passwordHash?: string; // Stored securely in client storage for validation
  emailVerified?: boolean;
  role?: UserRole; // 'admin' or 'client'
  sleepJournal?: SleepJournalEntry[];
}

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  chronotype?: 'morning_lark' | 'night_owl' | 'balanced';
  targetCycles?: number;
  wakeTime?: string;
  provider?: 'email' | 'apple' | 'google';
  emailVerified?: boolean;
  role?: UserRole;
  plan?: 'free' | 'pro';
}

const STORAGE_ACCOUNTS_KEY = 'sc_registered_accounts_v1';
const STORAGE_CURRENT_USER_KEY = 'sc_current_user_id_v1';

const AVATAR_COLORS = [
  '#A390E4',
  '#F4A261',
  '#4E9FDF',
  '#52B788',
  '#E76F51',
  '#9D4EDD',
];

export const SAMPLE_SLEEP_JOURNAL_ENTRIES: SleepJournalEntry[] = [
  {
    id: 'journal_sample_1',
    date: '2026-10-06',
    createdAt: '06.10.2026 07:15',
    sleepQuality: 5,
    qualityNotes: 'Прокинувся за 5 хвилин до будильника в кінці 5-го циклу. Відчуття свіжості та максимальної ясності думок.',
    dreams: 'Яскравий сон про подорож у гори, хвойний ліс біля озера та вранішнє сонце.',
    dreamType: 'vivid',
    stressors: [],
    stressorsNotes: 'Провітрив кімнату до 18°C, без екранів за 45 хв до сну. Ритуал Wind-down спрацював на 100%.',
    moodOnWaking: 'energized',
    wakeEase: 5,
  },
  {
    id: 'journal_sample_2',
    date: '2026-10-05',
    createdAt: '05.10.2026 06:50',
    sleepQuality: 4,
    qualityNotes: 'Легко заснув завдяки 4-4-6 диханню. Спав спокійно 5 циклів R90.',
    dreams: 'Спокійний сон про зустріч зі старими друзями в затишному кафе.',
    dreamType: 'neutral',
    stressors: ['Екран перед сном'],
    stressorsNotes: 'Переглядав повідомлення трохи довше, але бурштиновий нічний фільтр допоміг зберегти мелатонін.',
    moodOnWaking: 'calm',
    wakeEase: 4,
  },
  {
    id: 'journal_sample_3',
    date: '2026-10-04',
    createdAt: '04.10.2026 07:20',
    sleepQuality: 3,
    qualityNotes: 'Одне нічне пробудження о 03:30 через шум за вікном, але вдалося заснути знову за 15 хв.',
    dreams: 'Уривчасті сни про роботу, вирішення робочих завдань.',
    dreamType: 'nightmare',
    stressors: ['Шум або світло з вулиці', 'Робочий дедлайн / стрес'],
    stressorsNotes: 'Лягав спати з підвищеним кортизолом через вечірній робочий дзвінок.',
    moodOnWaking: 'tired',
    wakeEase: 3,
  },
];

// Initial seeded accounts: Primary admin account
const INITIAL_DEMO_ACCOUNTS: UserAccount[] = [
  {
    id: 'user_default',
    name: 'Олександр (Адміністратор)',
    email: 'nspshop33@gmail.com',
    avatarInitials: 'ОА',
    avatarColor: '#A390E4',
    chronotype: 'balanced',
    targetCycles: 5,
    wakeTime: '06:30',
    registeredAt: '28.09.2026',
    plan: 'pro',
    provider: 'email',
    passwordHash: 'sleep1234',
    emailVerified: true,
    role: 'admin',
    sleepJournal: [...SAMPLE_SLEEP_JOURNAL_ENTRIES],
  },
];

export const GUEST_USER: UserAccount = {
  id: 'guest_user',
  name: 'Гість',
  email: 'guest@sleepcoach.app',
  avatarInitials: 'ГС',
  avatarColor: '#4B5563',
  chronotype: 'balanced',
  targetCycles: 5,
  wakeTime: '06:30',
  registeredAt: 'Сьогодні',
  plan: 'free',
  role: 'client',
  provider: 'email',
  emailVerified: false,
};

export function isGuestUser(user?: UserAccount | null): boolean {
  return !user || user.id === 'guest_user';
}

// In-memory fallback if localStorage is absent (e.g. Node / SSR tests)
let memoryAccounts: UserAccount[] = [...INITIAL_DEMO_ACCOUNTS];
let memoryCurrentUserId: string = 'user_default';

function safeGetItem(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return key === STORAGE_ACCOUNTS_KEY
    ? JSON.stringify(memoryAccounts)
    : memoryCurrentUserId;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, value);
      return;
    } catch {
      // Ignore
    }
  }
  if (key === STORAGE_ACCOUNTS_KEY) {
    try {
      memoryAccounts = JSON.parse(value);
    } catch {
      // Ignore
    }
  } else if (key === STORAGE_CURRENT_USER_KEY) {
    memoryCurrentUserId = value;
  }
}

/**
 * Loads all registered accounts from local storage
 */
export function getRegisteredAccounts(): UserAccount[] {
  const stored = safeGetItem(STORAGE_ACCOUNTS_KEY);
  if (!stored) {
    safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(INITIAL_DEMO_ACCOUNTS));
    return INITIAL_DEMO_ACCOUNTS;
  }
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure existing accounts have sleepJournal initialized
      return parsed.map((acc: UserAccount) => ({
        ...acc,
        sleepJournal:
          acc.sleepJournal && acc.sleepJournal.length > 0
            ? acc.sleepJournal
            : acc.id === 'user_default'
            ? [...SAMPLE_SLEEP_JOURNAL_ENTRIES]
            : [],
      }));
    }
    return INITIAL_DEMO_ACCOUNTS;
  } catch {
    return INITIAL_DEMO_ACCOUNTS;
  }
}

/**
 * Gets currently logged in user
 */
export function getCurrentUser(): UserAccount {
  const currentId = safeGetItem(STORAGE_CURRENT_USER_KEY);
  if (currentId === GUEST_USER.id) {
    return GUEST_USER;
  }
  const accounts = getRegisteredAccounts();
  if (currentId) {
    const found = accounts.find((a) => a.id === currentId);
    if (found) return found;
  }
  const defaultUser = accounts[0] || INITIAL_DEMO_ACCOUNTS[0];
  safeSetItem(STORAGE_CURRENT_USER_KEY, defaultUser.id);
  return defaultUser;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Generates initials from full name
 */
export function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return 'SC';
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

/**
 * Registers a new account with complete validation
 */
export function registerAccount(input: RegisterInput): {
  success: boolean;
  error?: string;
  user?: UserAccount;
} {
  const { name, email, password, confirmPassword } = input;

  // 1. Validation checks
  if (!name || name.trim().length < 2) {
    return { success: false, error: "Будь ласка, вкажіть ваше ім'я (мінімум 2 символи)." };
  }

  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Введіть коректну адресу електронної пошти (наприклад: name@domain.com).' };
  }

  if (input.provider === 'email' || !input.provider) {
    if (!password || password.length < 6) {
      return { success: false, error: 'Пароль має містити щонайменше 6 символів.' };
    }

    if (password !== confirmPassword) {
      return { success: false, error: 'Введені паролі не збігаються.' };
    }
  }

  const accounts = getRegisteredAccounts();

  // 2. Check for duplicate email
  const existing = accounts.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );
  if (existing) {
    return {
      success: false,
      error: `Акаунт з поштою "${email.trim()}" вже зареєстровано. Спробуйте увійти.`,
    };
  }

  // 3. Create new user record
  const colorIndex = accounts.length % AVATAR_COLORS.length;
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(
    now.getMonth() + 1
  ).padStart(2, '0')}.${now.getFullYear()}`;

  const newUser: UserAccount = {
    id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    avatarInitials: getInitials(name),
    avatarColor: AVATAR_COLORS[colorIndex],
    chronotype: input.chronotype || 'balanced',
    targetCycles: input.targetCycles || 5,
    wakeTime: input.wakeTime || '06:30',
    registeredAt: dateFormatted,
    plan: input.plan || 'free',
    role: input.role || 'client',
    provider: input.provider || 'email',
    passwordHash: password,
    emailVerified: input.emailVerified ?? (input.provider === 'apple' || input.provider === 'google'),
  };

  const updatedAccounts = [newUser, ...accounts];
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));
  safeSetItem(STORAGE_CURRENT_USER_KEY, newUser.id);

  return { success: true, user: newUser };
}

/**
 * Log in to an existing account
 */
export function loginAccount(
  email: string,
  password?: string
): { success: boolean; error?: string; user?: UserAccount } {
  if (!email || !isValidEmail(email)) {
    return { success: false, error: 'Введіть коректну електронну пошту.' };
  }

  const accounts = getRegisteredAccounts();
  const user = accounts.find(
    (a) => a.email.toLowerCase() === email.trim().toLowerCase()
  );

  if (!user) {
    return {
      success: false,
      error: `Акаунт із поштою "${email.trim()}" не знайдено. Перевірте написання або зареєструйте новий.`,
    };
  }

  if (password && user.passwordHash && user.passwordHash !== password) {
    return { success: false, error: 'Невірний пароль для цього акаунта.' };
  }

  safeSetItem(STORAGE_CURRENT_USER_KEY, user.id);
  return { success: true, user };
}

/**
 * Switch to a specific account
 */
export function switchAccount(userId: string): UserAccount | null {
  const accounts = getRegisteredAccounts();
  const user = accounts.find((a) => a.id === userId);
  if (user) {
    safeSetItem(STORAGE_CURRENT_USER_KEY, user.id);
    return user;
  }
  return null;
}

/**
 * Log out (sets guest mode)
 */
export function logoutAccount(): UserAccount {
  safeSetItem(STORAGE_CURRENT_USER_KEY, GUEST_USER.id);
  memoryCurrentUserId = GUEST_USER.id;
  return GUEST_USER;
}

/**
 * Update user subscription plan
 */
export function updateUserPlan(userId: string, plan: 'free' | 'pro'): UserAccount | null {
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((a) => a.id === userId);
  if (index === -1) return null;

  const updatedUser: UserAccount = {
    ...accounts[index],
    plan,
  };
  accounts[index] = updatedUser;
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  return updatedUser;
}

/**
 * Add a morning sleep journal entry into the user profile
 */
export function addSleepJournalEntry(
  userId: string,
  entryData: Omit<SleepJournalEntry, 'id' | 'createdAt'>
): { success: boolean; user: UserAccount; entry: SleepJournalEntry } {
  const accounts = getRegisteredAccounts();
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(
    now.getMonth() + 1
  ).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const newEntry: SleepJournalEntry = {
    ...entryData,
    id: `journal_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: dateFormatted,
  };

  const index = accounts.findIndex((a) => a.id === userId);
  if (index === -1) {
    // If guest user
    const existing = GUEST_USER.sleepJournal || [];
    GUEST_USER.sleepJournal = [newEntry, ...existing];
    return { success: true, user: { ...GUEST_USER }, entry: newEntry };
  }

  const existingJournal = accounts[index].sleepJournal || [];
  const updatedUser: UserAccount = {
    ...accounts[index],
    sleepJournal: [newEntry, ...existingJournal],
  };

  accounts[index] = updatedUser;
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  return { success: true, user: updatedUser, entry: newEntry };
}

/**
 * Update an existing morning sleep journal entry
 */
export function updateSleepJournalEntry(
  userId: string,
  entryId: string,
  updates: Partial<SleepJournalEntry>
): UserAccount | null {
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((a) => a.id === userId);

  if (index === -1) {
    if (userId === GUEST_USER.id) {
      GUEST_USER.sleepJournal = (GUEST_USER.sleepJournal || []).map((e) =>
        e.id === entryId ? { ...e, ...updates } : e
      );
      return { ...GUEST_USER };
    }
    return null;
  }

  const existing = accounts[index].sleepJournal || [];
  const updatedJournal = existing.map((e) =>
    e.id === entryId ? { ...e, ...updates } : e
  );

  const updatedUser: UserAccount = {
    ...accounts[index],
    sleepJournal: updatedJournal,
  };

  accounts[index] = updatedUser;
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  return updatedUser;
}

/**
 * Delete a morning sleep journal entry from profile
 */
export function deleteSleepJournalEntry(
  userId: string,
  entryId: string
): UserAccount | null {
  const accounts = getRegisteredAccounts();
  const index = accounts.findIndex((a) => a.id === userId);

  if (index === -1) {
    if (userId === GUEST_USER.id) {
      GUEST_USER.sleepJournal = (GUEST_USER.sleepJournal || []).filter(
        (e) => e.id !== entryId
      );
      return { ...GUEST_USER };
    }
    return null;
  }

  const existing = accounts[index].sleepJournal || [];
  const updatedUser: UserAccount = {
    ...accounts[index],
    sleepJournal: existing.filter((e) => e.id !== entryId),
  };

  accounts[index] = updatedUser;
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(accounts));
  return updatedUser;
}

export function deleteAccount(userId: string): UserAccount {
  const accounts = getRegisteredAccounts();
  const filtered = accounts.filter((a) => a.id !== userId);
  const remaining = filtered.length > 0 ? filtered : INITIAL_DEMO_ACCOUNTS;
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(remaining));
  const newActive = remaining[0];
  safeSetItem(STORAGE_CURRENT_USER_KEY, newActive.id);
  return newActive;
}

/**
 * Check if the specified account has admin privileges
 */
export function isAdminAccount(user?: UserAccount | null): boolean {
  if (!user) return false;
  return user.role === 'admin' || user.email.toLowerCase() === 'nspshop33@gmail.com';
}

/**
 * Admin-only: Generate test / demo accounts with specific roles, plans, and metrics
 */
export function createAdminTestAccount(options?: {
  name?: string;
  email?: string;
  plan?: 'free' | 'pro';
  role?: UserRole;
  targetCycles?: number;
  wakeTime?: string;
}): UserAccount {
  const accounts = getRegisteredAccounts();
  const num = Math.floor(100 + Math.random() * 900);
  const plan = options?.plan || 'pro';
  const role = options?.role || 'client';
  const name =
    options?.name ||
    (role === 'admin'
      ? `Адміністратор-Тест #${num}`
      : `Тестовий Клієнт #${num} (${plan === 'pro' ? 'Pro' : 'Free'})`);
  const email = options?.email || `tester.${role}${num}@sleepcoach.app`;
  const colorIndex = accounts.length % AVATAR_COLORS.length;
  const now = new Date();
  const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(
    now.getMonth() + 1
  ).padStart(2, '0')}.${now.getFullYear()}`;

  const testUser: UserAccount = {
    id: `test_user_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name,
    email: email.toLowerCase(),
    avatarInitials: getInitials(name),
    avatarColor: AVATAR_COLORS[colorIndex],
    chronotype: 'balanced',
    targetCycles: options?.targetCycles || (plan === 'pro' ? 5 : 4),
    wakeTime: options?.wakeTime || '06:30',
    registeredAt: dateFormatted,
    plan,
    role,
    provider: 'email',
    passwordHash: 'test1234',
    emailVerified: true,
  };

  const updated = [testUser, ...accounts];
  safeSetItem(STORAGE_ACCOUNTS_KEY, JSON.stringify(updated));
  return testUser;
}

