import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocFromServer,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { UserAccount, getInitials, UserRole, SleepJournalEntry } from './authEngine';

// Firebase configuration loaded from project setup
export const firebaseConfig = {
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
  measurementId: firebaseConfigData.measurementId,
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase Auth
export const auth = getAuth(app);

// Initialize Firestore with configured databaseId and long-polling transport for iframe stability
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfigData.firestoreDatabaseId || undefined
);

// Validate Connection to Firestore on boot as required
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (
        error.name === 'AbortError' ||
        error.message?.includes('aborted') ||
        error.message?.includes('signal is aborted')
      ) {
        return true;
      }
      if (error.message.includes('the client is offline')) {
        console.warn('Firebase connection check: client is offline or network restricted.');
        return false;
      }
    }
    // Expected to not find the doc or permission denied on test/connection, but connection reached server
    return true;
  }
}

// Run connection verification safely after initial render
if (typeof window !== 'undefined') {
  setTimeout(() => {
    testConnection().catch(() => {});
  }, 200);
}

export interface FirebaseRegisterResult {
  success: boolean;
  user?: UserAccount;
  firebaseUser?: FirebaseUser;
  error?: string;
  verificationEmailSent?: boolean;
}

export interface FirebaseLoginResult {
  success: boolean;
  user?: UserAccount;
  firebaseUser?: FirebaseUser;
  error?: string;
}

/**
 * Register a user via Firebase Email Authentication, send verification email,
 * and create corresponding Firestore and local user profile.
 */
export async function registerWithFirebase(options: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  plan?: 'free' | 'pro';
}): Promise<FirebaseRegisterResult> {
  const { name, email, password, role = 'client', plan = 'free' } = options;

  try {
    // 1. Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = userCredential.user;

    // 2. Set display name in Firebase Auth
    try {
      await updateProfile(fbUser, {
        displayName: name.trim(),
      });
    } catch {
      // Non-blocking
    }

    // 3. Send email verification to the registered email address
    let verificationEmailSent = false;
    try {
      await sendEmailVerification(fbUser);
      verificationEmailSent = true;
    } catch (verErr: unknown) {
      console.warn('Could not send verification email automatically:', verErr);
    }

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(
      now.getMonth() + 1
    ).padStart(2, '0')}.${now.getFullYear()}`;

    // 4. Create UserAccount record
    const userAccount: UserAccount = {
      id: fbUser.uid,
      name: name.trim(),
      email: fbUser.email || email.trim(),
      avatarInitials: getInitials(name),
      avatarColor: '#4E9FDF',
      chronotype: 'balanced',
      targetCycles: plan === 'pro' ? 5 : 4,
      wakeTime: '06:30',
      registeredAt: dateFormatted,
      plan,
      role: email.toLowerCase() === 'nspshop33@gmail.com' ? 'admin' : role,
      provider: 'email',
      emailVerified: fbUser.emailVerified,
      sleepJournal: [],
    };

    // 5. Save user profile to Firestore
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      await setDoc(userDocRef, {
        id: fbUser.uid,
        name: userAccount.name,
        email: userAccount.email,
        avatarInitials: userAccount.avatarInitials,
        avatarColor: userAccount.avatarColor,
        chronotype: userAccount.chronotype,
        targetCycles: userAccount.targetCycles,
        wakeTime: userAccount.wakeTime,
        registeredAt: userAccount.registeredAt,
        plan: userAccount.plan,
        role: userAccount.role,
        provider: 'email',
        emailVerified: fbUser.emailVerified,
      });
    } catch (firestoreErr: unknown) {
      console.warn('Could not persist user to Firestore immediately:', firestoreErr);
    }

    return {
      success: true,
      user: userAccount,
      firebaseUser: fbUser,
      verificationEmailSent,
    };
  } catch (error: unknown) {
    let errorMessage = 'Помилка реєстрації через сервіс Firebase.';
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/email-already-in-use') {
        errorMessage = `Акаунт з адресою ${email} вже зареєстровано в системі. Спробуйте увійти.`;
      } else if (code === 'auth/weak-password') {
        errorMessage = 'Пароль занадто простий. Введіть щонайменше 6 символів.';
      } else if (code === 'auth/invalid-email') {
        errorMessage = 'Некоректний формат email адреси.';
      } else if (code === 'auth/operation-not-allowed') {
        errorMessage = 'Авторизацію через Email/Password ще не активовано в консолі Firebase. Увімкніть Email/Password у Firebase Authentication.';
      } else if (code === 'auth/network-request-failed') {
        errorMessage = 'Помилка мережі при з’єднанні з сервером авторизації.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Sign in existing user via Firebase Email Authentication and retrieve profile
 */
export async function loginWithFirebase(
  email: string,
  password: string
): Promise<FirebaseLoginResult> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
    const fbUser = userCredential.user;

    // Fetch user profile from Firestore if available
    let userAccount: UserAccount | null = null;
    try {
      const userDocRef = doc(db, 'users', fbUser.uid);
      const docSnap = await getDoc(userDocRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        userAccount = {
          id: fbUser.uid,
          name: data.name || fbUser.displayName || 'Користувач',
          email: fbUser.email || email.trim(),
          avatarInitials: data.avatarInitials || getInitials(data.name || fbUser.displayName || 'SC'),
          avatarColor: data.avatarColor || '#4E9FDF',
          chronotype: data.chronotype || 'balanced',
          targetCycles: data.targetCycles || 5,
          wakeTime: data.wakeTime || '06:30',
          registeredAt: data.registeredAt || 'Сьогодні',
          plan: data.plan || 'free',
          role: fbUser.email?.toLowerCase() === 'nspshop33@gmail.com' ? 'admin' : data.role || 'client',
          provider: 'email',
          emailVerified: fbUser.emailVerified,
          sleepJournal: [],
        };
      }
    } catch {
      // Fallback below
    }

    if (!userAccount) {
      const displayName = fbUser.displayName || email.split('@')[0] || 'Користувач';
      userAccount = {
        id: fbUser.uid,
        name: displayName,
        email: fbUser.email || email.trim(),
        avatarInitials: getInitials(displayName),
        avatarColor: '#4E9FDF',
        chronotype: 'balanced',
        targetCycles: 5,
        wakeTime: '06:30',
        registeredAt: 'Сьогодні',
        plan: 'free',
        role: email.toLowerCase() === 'nspshop33@gmail.com' ? 'admin' : 'client',
        provider: 'email',
        emailVerified: fbUser.emailVerified,
        sleepJournal: [],
      };
    }

    return {
      success: true,
      user: userAccount,
      firebaseUser: fbUser,
    };
  } catch (error: unknown) {
    let errorMessage = 'Помилка входу через сервіс авторизації.';
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
        errorMessage = 'Невірний email або пароль.';
      } else if (code === 'auth/invalid-email') {
        errorMessage = 'Некоректний формат email адреси.';
      } else if (code === 'auth/too-many-requests') {
        errorMessage = 'Забагато спроб входу. Зачекайте кілька хвилин або скиньте пароль.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Resend email verification link to current authenticated user
 */
export async function resendVerificationEmail(): Promise<{ success: boolean; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'Користувач не авторизований у Firebase.' };
    }
    await sendEmailVerification(user);
    return { success: true };
  } catch (error: unknown) {
    let msg = 'Не вдалося надіслати лист повторно.';
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/too-many-requests') {
        msg = 'Лист уже нещодавно було надіслано. Зачекайте хвилину перед повторною спробою.';
      }
    }
    return { success: false, error: msg };
  }
}

/**
 * Send password reset email
 */
export async function resetPasswordViaEmail(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    await sendPasswordResetEmail(auth, email.trim());
    return { success: true };
  } catch (error: unknown) {
    let msg = 'Не вдалося надіслати лист відновлення паролю.';
    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/user-not-found') {
        msg = 'Користувача з такою електронною поштою не знайдено.';
      }
    }
    return { success: false, error: msg };
  }
}

/**
 * Sign out from Firebase Auth
 */
// Google and Apple Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

/**
 * Persist or update user document in Firestore
 */
export async function syncUserToFirestore(user: UserAccount): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', user.id);
    await setDoc(
      userDocRef,
      {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarInitials: user.avatarInitials,
        avatarColor: user.avatarColor,
        chronotype: user.chronotype,
        targetCycles: user.targetCycles,
        wakeTime: user.wakeTime,
        registeredAt: user.registeredAt,
        plan: user.plan,
        role: user.role || 'client',
        provider: user.provider,
        emailVerified: user.emailVerified ?? true,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

/**
 * Attempt real Google sign-in via Firebase Auth popup
 */
export async function signInWithGoogleFirebase(): Promise<{
  success: boolean;
  user?: UserAccount;
  firebaseUser?: FirebaseUser;
  error?: string;
  isPopupBlocked?: boolean;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(
      now.getMonth() + 1
    ).padStart(2, '0')}.${now.getFullYear()}`;

    const displayName = fbUser.displayName || fbUser.email?.split('@')[0] || 'Google Користувач';
    const email = fbUser.email || 'user@gmail.com';

    const userAccount: UserAccount = {
      id: fbUser.uid,
      name: displayName,
      email,
      avatarInitials: getInitials(displayName),
      avatarColor: '#4285F4',
      chronotype: 'balanced',
      targetCycles: 5,
      wakeTime: '06:30',
      registeredAt: dateFormatted,
      plan: 'free',
      role: email.toLowerCase() === 'nspshop33@gmail.com' ? 'admin' : 'client',
      provider: 'google',
      emailVerified: true,
      sleepJournal: [],
    };

    await syncUserToFirestore(userAccount);

    return {
      success: true,
      user: userAccount,
      firebaseUser: fbUser,
    };
  } catch (error: unknown) {
    let errorMessage = 'Помилка авторизації через Google.';
    let isPopupBlocked = false;

    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/popup-blocked') {
        errorMessage = 'Спливаюче вікно Google було заблоковано браузером. Використайте пряме вікно перевірки.';
        isPopupBlocked = true;
      } else if (code === 'auth/popup-closed-by-user') {
        errorMessage = 'Вікно авторизації Google закрито користувачем.';
      } else if (code === 'auth/cancelled-popup-request') {
        errorMessage = 'Попередній запит Google скасовано.';
      } else if (code === 'auth/operation-not-allowed') {
        errorMessage = 'Провайдер Google ще не увімкнено в консолі Firebase. Доступна перевірка Google акаунта.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      isPopupBlocked,
    };
  }
}

/**
 * Attempt real Apple sign-in via Firebase Auth popup
 */
export async function signInWithAppleFirebase(): Promise<{
  success: boolean;
  user?: UserAccount;
  firebaseUser?: FirebaseUser;
  error?: string;
  isPopupBlocked?: boolean;
}> {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const fbUser = result.user;

    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(
      now.getMonth() + 1
    ).padStart(2, '0')}.${now.getFullYear()}`;

    const displayName = fbUser.displayName || 'Користувач Apple';
    const email = fbUser.email || 'client@icloud.com';

    const userAccount: UserAccount = {
      id: fbUser.uid,
      name: displayName,
      email,
      avatarInitials: getInitials(displayName),
      avatarColor: '#1F2937',
      chronotype: 'balanced',
      targetCycles: 5,
      wakeTime: '06:30',
      registeredAt: dateFormatted,
      plan: 'free',
      role: 'client',
      provider: 'apple',
      emailVerified: true,
      sleepJournal: [],
    };

    await syncUserToFirestore(userAccount);

    return {
      success: true,
      user: userAccount,
      firebaseUser: fbUser,
    };
  } catch (error: unknown) {
    let errorMessage = 'Помилка авторизації через Apple ID.';
    let isPopupBlocked = false;

    if (error && typeof error === 'object' && 'code' in error) {
      const code = (error as { code: string }).code;
      if (code === 'auth/popup-blocked') {
        errorMessage = 'Спливаюче вікно Apple заблоковано. Відкрито інтерфейс перевірки Apple ID.';
        isPopupBlocked = true;
      } else if (code === 'auth/operation-not-allowed') {
        errorMessage = 'Провайдер Apple ID потребує конфігурації в Apple Developer Console.';
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
      isPopupBlocked,
    };
  }
}

export async function logoutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Error signing out from Firebase:', err);
  }
}

/**
 * Sync sleep journal entry to Firestore
 */
export async function saveJournalEntryToFirestore(
  userId: string,
  entry: SleepJournalEntry
): Promise<void> {
  try {
    const entryDocRef = doc(db, 'users', userId, 'sleepJournal', entry.id);
    await setDoc(entryDocRef, {
      ...entry,
      userId,
    });
  } catch (err) {
    console.warn('Could not save journal entry to Firestore:', err);
  }
}

