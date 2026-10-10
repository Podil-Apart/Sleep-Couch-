// Sleep Coach — Email Verification Mock/Stub Service

export interface VerificationEmailResult {
  success: boolean;
  messageId: string;
  email: string;
  userName: string;
  code: string;
  sentAt: string;
  expiresAt: string;
  emailPreview: {
    from: string;
    to: string;
    subject: string;
    previewText: string;
    headerTitle: string;
    formattedTime: string;
  };
}

interface StoredVerification {
  code: string;
  email: string;
  userName: string;
  sentAtTimestamp: number;
  expiresAtTimestamp: number;
  attempts: number;
  result: VerificationEmailResult;
}

const STORAGE_PREFIX = 'sc_pending_verification_';
const LAST_SENT_KEY = 'sc_last_sent_verification_email';

// In-memory fallback if localStorage is absent
const memoryVerifications = new Map<string, StoredVerification>();
let memoryLastSent: VerificationEmailResult | null = null;

function safeGet(key: string): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return null;
}

function safeSet(key: string, val: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(key, val);
    } catch {
      // Ignore
    }
  }
}

/**
 * Generates a realistic 6-digit verification code
 */
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Simulates sending a confirmation email to the user with realistic latency
 */
export async function sendVerificationEmail(
  email: string,
  userName: string
): Promise<VerificationEmailResult> {
  // Simulate network latency (600ms - 900ms)
  await new Promise((resolve) => setTimeout(resolve, 650));

  const code = generateVerificationCode();
  const now = new Date();
  const expires = new Date(now.getTime() + 15 * 60 * 1000); // 15 mins expiry

  const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  const messageId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@sleepcoach.app`;

  const result: VerificationEmailResult = {
    success: true,
    messageId,
    email: email.trim().toLowerCase(),
    userName: userName.trim(),
    code,
    sentAt: formattedTime,
    expiresAt: '15 хвилин',
    emailPreview: {
      from: 'Sleep Coach Security <auth@sleepcoach.app>',
      to: `${userName} <${email}>`,
      subject: `Код підтвердження реєстрації: ${code} — Sleep Coach R90`,
      previewText: `Ваш код для активації акаунта Sleep Coach: ${code}. Діє протягом 15 хвилин.`,
      headerTitle: 'Підтвердження вашого акаунта Sleep Coach',
      formattedTime,
    },
  };

  const storedData: StoredVerification = {
    code,
    email: email.trim().toLowerCase(),
    userName: userName.trim(),
    sentAtTimestamp: now.getTime(),
    expiresAtTimestamp: expires.getTime(),
    attempts: 0,
    result,
  };

  safeSet(`${STORAGE_PREFIX}${email.trim().toLowerCase()}`, JSON.stringify(storedData));
  safeSet(LAST_SENT_KEY, JSON.stringify(result));

  memoryVerifications.set(email.trim().toLowerCase(), storedData);
  memoryLastSent = result;

  console.log(`[Email Mock Service] Confirmation email sent to ${email}. Code: ${code}`);

  return result;
}

/**
 * Validates the entered confirmation code
 */
export function verifyConfirmationCode(
  email: string,
  enteredCode: string
): { success: boolean; error?: string } {
  const normEmail = email.trim().toLowerCase();
  const raw = safeGet(`${STORAGE_PREFIX}${normEmail}`);
  let stored: StoredVerification | undefined;

  if (raw) {
    try {
      stored = JSON.parse(raw);
    } catch {
      // Ignore
    }
  }

  if (!stored) {
    stored = memoryVerifications.get(normEmail);
  }

  if (!stored) {
    return {
      success: false,
      error: 'Не знайдено активного запиту на підтвердження. Натисніть «Надіслати повторно».',
    };
  }

  // Check expiration
  if (Date.now() > stored.expiresAtTimestamp) {
    return {
      success: false,
      error: 'Термін дії коду підтвердження (15 хв) закінчився. Будь ласка, надішліть новий код.',
    };
  }

  // Check code match (whitespace-insensitive)
  const cleanEntered = enteredCode.replace(/\s+/g, '');
  if (cleanEntered !== stored.code) {
    stored.attempts += 1;
    safeSet(`${STORAGE_PREFIX}${normEmail}`, JSON.stringify(stored));
    return {
      success: false,
      error: `Невірний код підтвердження. Перевірте код або перегляньте надісланий лист. (Спроба ${stored.attempts})`,
    };
  }

  // Successfully verified! Clear pending
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(`${STORAGE_PREFIX}${normEmail}`);
    } catch {
      // Ignore
    }
  }
  memoryVerifications.delete(normEmail);

  return { success: true };
}

/**
 * Gets the last sent confirmation email (useful for in-app demo email preview modal)
 */
export function getLastSentEmail(email?: string): VerificationEmailResult | null {
  if (email) {
    const raw = safeGet(`${STORAGE_PREFIX}${email.trim().toLowerCase()}`);
    if (raw) {
      try {
        const stored: StoredVerification = JSON.parse(raw);
        return stored.result;
      } catch {
        // Ignore
      }
    }
    const mem = memoryVerifications.get(email.trim().toLowerCase());
    if (mem) return mem.result;
  }

  const rawLast = safeGet(LAST_SENT_KEY);
  if (rawLast) {
    try {
      return JSON.parse(rawLast);
    } catch {
      // Ignore
    }
  }
  return memoryLastSent;
}
