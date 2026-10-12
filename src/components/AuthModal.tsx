import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Apple,
  Smartphone,
  ShieldCheck,
  UserPlus,
  LogIn,
  LogOut,
  ArrowRight,
  Trash2,
  Send,
  Inbox,
  RotateCcw,
  Clock,
  Check,
  ChevronLeft,
  Crown,
  Fingerprint,
  ScanFace,
  Shield,
  ShieldAlert,
  Settings,
  PlusCircle,
} from 'lucide-react';
import {
  UserAccount,
  UserRole,
  registerAccount,
  loginAccount,
  getRegisteredAccounts,
  switchAccount,
  deleteAccount,
  isValidEmail,
  createAdminTestAccount,
  isAdminAccount,
  logoutAccount,
  isGuestUser,
  upsertAccount,
} from '../utils/authEngine';
import {
  VerificationEmailResult,
  sendVerificationEmail,
  verifyConfirmationCode,
  getLastSentEmail,
} from '../utils/emailVerificationService';
import {
  registerWithFirebase,
  loginWithFirebase,
  resendVerificationEmail,
} from '../utils/firebase';
import { GoogleAuthVerificationModal } from './GoogleAuthVerificationModal';
import { AppleAuthVerificationModal } from './AppleAuthVerificationModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount;
  onUserChanged: (user: UserAccount) => void;
  platformMode?: 'android' | 'ios';
  onLogout?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUserChanged,
  platformMode = 'ios',
  onLogout,
}) => {
  const [tab, setTab] = useState<'register' | 'login' | 'admin'>('register');

  // Form State for Client Registration
  const [regStep, setRegStep] = useState<'form' | 'confirm_email'>('form');
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regChronotype, setRegChronotype] = useState<'morning_lark' | 'night_owl' | 'balanced'>('balanced');
  const [showPassword, setShowPassword] = useState(false);

  // Email verification state
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [lastSentEmail, setLastSentEmail] = useState<VerificationEmailResult | null>(null);
  const [showEmailViewer, setShowEmailViewer] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Google & Apple Verification Modal State
  const [showGoogleVerifyModal, setShowGoogleVerifyModal] = useState(false);
  const [showAppleVerifyModal, setShowAppleVerifyModal] = useState(false);

  // Form State for Client Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Biometric TouchID / FaceID state (mock)
  const [biometricScanning, setBiometricScanning] = useState(false);
  const [biometricSuccess, setBiometricSuccess] = useState(false);

  // Admin Section State
  const [adminUnlocked, setAdminUnlocked] = useState(() => isAdminAccount(currentUser));
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [customTestName, setCustomTestName] = useState('');
  const [customTestEmail, setCustomTestEmail] = useState('');
  const [customTestPlan, setCustomTestPlan] = useState<'free' | 'pro'>('pro');
  const [customTestRole, setCustomTestRole] = useState<UserRole>('client');
  const [showCustomTestForm, setShowCustomTestForm] = useState(false);

  // Status messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Accounts list
  const [accounts, setAccounts] = useState<UserAccount[]>(() => getRegisteredAccounts());

  useEffect(() => {
    setAdminUnlocked(isAdminAccount(currentUser));
  }, [currentUser]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!isOpen) return null;

  const refreshAccounts = () => {
    setAccounts(getRegisteredAccounts());
  };

  // Step 1: Client registration submit -> Send verification email via Firebase Auth service
  const handleInitiateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!regName || regName.trim().length < 2) {
      setErrorMessage("Будь ласка, вкажіть ваше ім'я (мінімум 2 символи).");
      return;
    }

    if (!regEmail || !isValidEmail(regEmail)) {
      setErrorMessage('Введіть коректну адресу електронної пошти (наприклад: name@domain.com).');
      return;
    }

    if (!regPassword || regPassword.length < 6) {
      setErrorMessage('Пароль має містити щонайменше 6 символів.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Введені паролі не збігаються.');
      return;
    }

    setIsSendingEmail(true);

    try {
      // 1. Register with Firebase Auth service & trigger verification email
      const fbResult = await registerWithFirebase({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: regEmail.toLowerCase() === 'nspshop33@gmail.com' ? 'admin' : 'client',
        plan: 'free',
      });

      if (!fbResult.success) {
        setIsSendingEmail(false);
        setErrorMessage(fbResult.error || 'Помилка реєстрації через сервіс Firebase Auth.');
        return;
      }

      if (fbResult.user) {
        upsertAccount(fbResult.user);
        onUserChanged(fbResult.user);
        refreshAccounts();
      }

      // Generate local verification code preview for instant applet verification convenience
      const emailResult = await sendVerificationEmail(regEmail, regName);
      setLastSentEmail(emailResult);

      setIsSendingEmail(false);
      setRegStep('confirm_email');
      setResendCooldown(60);
      setSuccessMessage(
        `Обліковий запис створено через Firebase Auth! На вашу пошту ${regEmail.trim()} надіслано лист для авторизації.`
      );
    } catch (err: unknown) {
      setIsSendingEmail(false);
      const msg = err instanceof Error ? err.message : 'Помилка з’єднання із сервісом авторизації.';
      setErrorMessage(msg);
    }
  };

  // Step 2: Confirm code and finalize registration
  const handleConfirmCodeAndRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const check = verifyConfirmationCode(regEmail, verificationCode);
    if (!check.success) {
      setErrorMessage(check.error || 'Невірний код безпеки.');
      return;
    }

    const all = getRegisteredAccounts();
    const existing = all.find((a) => a.email.toLowerCase() === regEmail.trim().toLowerCase());
    if (existing) {
      const updated = { ...existing, emailVerified: true };
      upsertAccount(updated);
      onUserChanged(updated);
      refreshAccounts();
      setSuccessMessage(`Вітаємо, ${updated.name}! Акаунт успішно підтверджено та активовано.`);
      setTimeout(() => {
        onClose();
      }, 1200);
      return;
    }

    const res = registerAccount({
      name: regName,
      email: regEmail,
      password: regPassword,
      confirmPassword: regConfirmPassword,
      chronotype: regChronotype,
      provider: 'email',
      emailVerified: true,
      role: 'client',
      plan: 'free',
    });

    if (!res.success) {
      setErrorMessage(res.error || 'Помилка реєстрації');
      return;
    }

    if (res.user) {
      setSuccessMessage(`Вітаємо, ${res.user.name}! Акаунт клієнта успішно створено.`);
      refreshAccounts();
      onUserChanged(res.user);

      // Reset form
      setRegStep('form');
      setRegName('');
      setRegEmail('');
      setRegPassword('');
      setRegConfirmPassword('');
      setVerificationCode('');

      setTimeout(() => {
        onClose();
      }, 1300);
    }
  };

  const handleResendEmail = async () => {
    if (resendCooldown > 0) return;
    setIsSendingEmail(true);
    setErrorMessage(null);
    try {
      // Trigger Firebase verification resend
      await resendVerificationEmail();
      const emailResult = await sendVerificationEmail(regEmail, regName);
      setLastSentEmail(emailResult);
      setIsSendingEmail(false);
      setResendCooldown(45);
      setSuccessMessage('Новий лист авторизації успішно надіслано на вашу пошту!');
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch {
      setIsSendingEmail(false);
      setErrorMessage('Помилка повторної відправки листа авторизації.');
    }
  };

  // Client standard login (Firebase Auth with local fallback)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // 1. Attempt login with Firebase Authentication service
    try {
      const fbLoginRes = await loginWithFirebase(loginEmail, loginPassword);
      if (fbLoginRes.success && fbLoginRes.user) {
        upsertAccount(fbLoginRes.user);
        refreshAccounts();
        onUserChanged(fbLoginRes.user);
        setSuccessMessage(`Вітаємо, ${fbLoginRes.user.name}! Авторизація через Firebase виконана.`);
        setTimeout(() => {
          onClose();
        }, 1100);
        return;
      }
    } catch (fbErr) {
      console.warn('Firebase login attempt:', fbErr);
    }

    // 2. Fallback to local accounts (e.g. demo/admin accounts)
    const res = loginAccount(loginEmail, loginPassword);
    if (!res.success) {
      setErrorMessage(res.error || 'Невірний email або пароль.');
      return;
    }

    if (res.user) {
      setSuccessMessage(`Вітаємо, ${res.user.name}! Вхід виконано.`);
      onUserChanged(res.user);
      setTimeout(() => {
        onClose();
      }, 1100);
    }
  };

  // Client biometric TouchID / FaceID login mock
  const handleBiometricLogin = () => {
    setErrorMessage(null);
    setBiometricScanning(true);
    setBiometricSuccess(false);

    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try { navigator.vibrate([30, 40, 30]); } catch {}
    }

    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricSuccess(true);

      const all = getRegisteredAccounts();
      const targetUser = all.find((a) => a.id === currentUser.id) || all[0];
      if (targetUser) {
        setSuccessMessage(`Біометрична автентифікація успішна (${platformMode === 'ios' ? 'Face ID' : 'Touch ID'}). Вітаємо, ${targetUser.name}!`);
        onUserChanged(targetUser);
        setTimeout(() => onClose(), 1000);
      }
    }, 1100);
  };

  const handleOpenGoogleVerify = () => {
    setErrorMessage(null);
    setShowGoogleVerifyModal(true);
  };

  const handleOpenAppleVerify = () => {
    setErrorMessage(null);
    setShowAppleVerifyModal(true);
  };

  const handleSocialAuthSuccess = (verifiedUser: UserAccount) => {
    refreshAccounts();
    onUserChanged(verifiedUser);
    const providerName = verifiedUser.provider === 'google' ? 'Google' : 'Apple ID';
    setSuccessMessage(`Вітаємо, ${verifiedUser.name}! Авторизацію та перевірку через ${providerName} успішно підтверджено.`);
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleSwitchToAccount = (userId: string) => {
    const user = switchAccount(userId);
    if (user) {
      onUserChanged(user);
      setSuccessMessage(`Перемкнуто на профіль: ${user.name}`);
      setTimeout(() => onClose(), 700);
    }
  };

  const handleDelete = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const remaining = deleteAccount(userId);
    refreshAccounts();
    onUserChanged(remaining);
  };

  const handleLogoutInModal = () => {
    const guest = logoutAccount();
    onUserChanged(guest);
    if (onLogout) {
      onLogout();
    }
    setSuccessMessage('Ви успішно вийшли з акаунту. Активовано гостьовий профіль (Free).');
    setErrorMessage(null);
    refreshAccounts();
  };

  // Admin: Unlock admin panel
  const handleUnlockAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin' || adminPasswordInput === 'sleep1234' || adminPasswordInput === 'admin123') {
      setAdminUnlocked(true);
      setSuccessMessage('Доступ до панелі адміністратора надано!');
      setErrorMessage(null);
    } else {
      setErrorMessage('Невірний пароль адміністратора. (Підказка для тестування: admin або sleep1234)');
    }
  };

  // Admin: Create test account with specified tier
  const handleAdminCreateTestUser = (plan: 'free' | 'pro', role: UserRole = 'client') => {
    const created = createAdminTestAccount({ plan, role });
    refreshAccounts();
    setSuccessMessage(`Створено тестовий акаунт: ${created.name} (${created.email}) · Тариф ${plan.toUpperCase()}`);
  };

  // Admin: Create custom test user
  const handleAdminCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTestName || !customTestEmail) {
      setErrorMessage('Вкажіть імʼя та пошту для тестового акаунта.');
      return;
    }
    const created = createAdminTestAccount({
      name: customTestName.trim(),
      email: customTestEmail.trim(),
      plan: customTestPlan,
      role: customTestRole,
    });
    refreshAccounts();
    setCustomTestName('');
    setCustomTestEmail('');
    setShowCustomTestForm(false);
    setSuccessMessage(`Створено тестовий акаунт: ${created.name} (${created.email})`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-[#161B2E] border border-[#262D47] p-6 sm:p-7 text-[#E4E6F0] shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#262D47] gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white text-sm shrink-0"
              style={{ backgroundColor: currentUser.avatarColor || '#A390E4' }}
            >
              {currentUser.avatarInitials || 'SC'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold truncate">
                  {tab === 'register'
                    ? regStep === 'confirm_email'
                      ? 'Підтвердження пошти'
                      : 'Реєстрація клієнта'
                    : tab === 'login'
                    ? 'Вхід до кабінету'
                    : 'Панель адміністратора'}
                </h2>
                {tab === 'admin' && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#F4A261]/20 border border-[#F4A261]/50 text-[#F4A261] shrink-0">
                    ADMIN
                  </span>
                )}
              </div>
              <p className="text-xs text-[#9FA4BC] truncate">
                Поточний профіль:{' '}
                <span className="text-[#E4E6F0] font-semibold">{currentUser.name}</span>
                {currentUser.role === 'admin' && ' (Адмін)'}
                {isGuestUser(currentUser) && ' (Гість)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isGuestUser(currentUser) && (
              <button
                type="button"
                onClick={handleLogoutInModal}
                className="min-h-[38px] px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Вийти з поточного акаунту"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Вийти</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-[#0F1220] flex items-center justify-center text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
              aria-label="Закрити"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher: Client Registration / Client Login / Admin Panel */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-[#0F1220] border border-[#262D47]">
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setRegStep('form');
              setErrorMessage(null);
            }}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'register'
                ? 'bg-[#A390E4] text-[#0F1220] shadow'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="truncate">Реєстрація</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('login');
              setErrorMessage(null);
            }}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'login'
                ? 'bg-[#A390E4] text-[#0F1220] shadow'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="truncate">Вхід</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('admin');
              refreshAccounts();
              setErrorMessage(null);
            }}
            className={`min-h-[40px] px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              tab === 'admin'
                ? 'bg-[#F4A261] text-[#0F1220] shadow'
                : 'text-[#9FA4BC] hover:text-[#E4E6F0]'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="truncate">Адмін-панель</span>
          </button>
        </div>

        {/* Alerts & Messages */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-600/50 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 text-emerald-200 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: CLIENT REGISTRATION FLOW */}
        {tab === 'register' && (
          <>
            {regStep === 'form' && (
              <form onSubmit={handleInitiateRegister} className="space-y-4">
                {/* Firebase Email Authorization Service Status */}
                <div className="p-3 rounded-2xl bg-[#0F1220] border border-emerald-500/30 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <span className="text-[#E4E6F0] font-semibold">Сервіс авторизації: </span>
                      <span className="text-emerald-300 font-medium">Firebase Cloud Auth (Email)</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                    Підключено
                  </span>
                </div>

                <div className="text-xs text-[#9FA4BC]">
                  Створіть свій особистий акаунт клієнта Sleep Coach для розрахунку 90-хвилинних циклів сну R90:
                </div>

                {/* Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9FA4BC]">Імʼя та прізвище</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Оксана Шевченко"
                      className="w-full min-h-[44px] px-3.5 pl-10 rounded-xl bg-[#0F1220] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#A390E4]"
                    />
                    <User className="w-4 h-4 text-[#9FA4BC] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#9FA4BC]">Електронна пошта</label>
                    <span className="text-[11px] text-[#A390E4] font-medium">Буде надіслано лист із кодом</span>
                  </div>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="client@example.com"
                      className="w-full min-h-[44px] px-3.5 pl-10 rounded-xl bg-[#0F1220] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#A390E4]"
                    />
                    <Mail className="w-4 h-4 text-[#9FA4BC] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                {/* Password Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#9FA4BC]">Пароль (мін. 6)</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full min-h-[44px] px-3.5 pl-10 pr-9 rounded-xl bg-[#0F1220] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#A390E4]"
                      />
                      <Lock className="w-4 h-4 text-[#9FA4BC] absolute left-3.5 top-3.5" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3.5 text-[#9FA4BC] hover:text-[#E4E6F0]"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#9FA4BC]">Підтвердження пароля</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full min-h-[44px] px-3.5 pl-10 rounded-xl bg-[#0F1220] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#A390E4]"
                      />
                      <Lock className="w-4 h-4 text-[#9FA4BC] absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                </div>

                {/* Chronotype Picker */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9FA4BC]">Ваш хронотип для розрахунку R90</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'morning_lark', label: 'Жайворонок', desc: '06:00' },
                      { id: 'balanced', label: 'Збалансований', desc: '06:30' },
                      { id: 'night_owl', label: 'Сова', desc: '07:30' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setRegChronotype(item.id as any)}
                        className={`min-h-[48px] p-2 rounded-xl text-center border transition-colors cursor-pointer ${
                          regChronotype === item.id
                            ? 'bg-[#A390E4]/20 border-[#A390E4] text-[#E4E6F0]'
                            : 'bg-[#0F1220] border-[#262D47] text-[#9FA4BC]'
                        }`}
                      >
                        <div className="text-xs font-bold">{item.label}</div>
                        <div className="text-[11px] text-[#A390E4] font-mono mt-0.5">{item.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit button with email notice */}
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="w-full min-h-[48px] rounded-2xl bg-[#A390E4] text-[#0F1220] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#b2a2ea] transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSendingEmail ? (
                    <>
                      <Send className="w-4 h-4 animate-pulse text-[#0F1220]" />
                      <span>Реєстрація у Firebase та відправка листа...</span>
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>Зареєструватися через Firebase Auth (Email)</span>
                    </>
                  )}
                </button>

                {/* Fast Provider sign-up with Verification */}
                <div className="pt-2">
                  <div className="relative flex items-center justify-center text-xs text-[#9FA4BC] before:content-[''] before:absolute before:left-0 before:right-0 before:h-[1px] before:bg-[#262D47]">
                    <span className="relative px-3 bg-[#161B2E]">Або авторизація з перевіркою</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 mt-3">
                    <button
                      type="button"
                      onClick={handleOpenAppleVerify}
                      className="min-h-[46px] px-3 rounded-xl bg-black hover:bg-neutral-900 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                      title="Авторизація та 2FA перевірка через Apple ID"
                    >
                      <Apple className="w-4 h-4 fill-white" />
                      <div className="text-left">
                        <div className="font-bold leading-tight">Apple ID</div>
                        <div className="text-[10px] text-white/70 font-normal">2FA перевірка</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenGoogleVerify}
                      className="min-h-[46px] px-3 rounded-xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] hover:border-[#4285F4]/60 text-xs font-semibold text-[#E4E6F0] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                      title="Авторизація та перевірка через Google OAuth"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <div className="text-left">
                        <div className="font-bold leading-tight">Google</div>
                        <div className="text-[10px] text-blue-400 font-normal">Перевірка OAuth</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer Switcher */}
                <div className="text-center pt-1 text-xs text-[#9FA4BC]">
                  Вже маєте акаунт?{' '}
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="text-[#A390E4] font-bold hover:underline cursor-pointer"
                  >
                    Увійти в кабінет
                  </button>
                </div>
              </form>
            )}

            {/* Step B: Email confirmation code screen */}
            {regStep === 'confirm_email' && (
              <form onSubmit={handleConfirmCodeAndRegister} className="space-y-4 animate-in fade-in duration-300">
                <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#A390E4]/40 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-[#A390E4]/20 border border-[#A390E4]/50 text-[#A390E4] flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6 animate-bounce" />
                  </div>
                  <h3 className="text-base font-bold text-[#E4E6F0]">
                    Лист із підтвердженням надіслано!
                  </h3>
                  <p className="text-xs text-[#9FA4BC] max-w-sm mx-auto leading-relaxed">
                    Ми згенерували та відправили 6-значний код на адресу{' '}
                    <strong className="text-[#E4E6F0]">{regEmail}</strong>. Код діє 15 хвилин.
                  </p>
                </div>

                {/* Code input box */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-semibold text-[#9FA4BC]">6-значний код підтвердження</label>
                    {lastSentEmail && (
                      <button
                        type="button"
                        onClick={() => setVerificationCode(lastSentEmail.code)}
                        className="text-[#A390E4] hover:underline font-mono text-[11px] font-semibold cursor-pointer"
                      >
                        Вставити код ({lastSentEmail.code})
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    autoFocus
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full min-h-[50px] text-center font-mono text-2xl tracking-[0.35em] font-bold rounded-2xl bg-[#0F1220] border border-[#262D47] text-[#E4E6F0] focus:outline-none focus:border-[#A390E4]"
                  />
                </div>

                {/* Actions: Verify & Resend */}
                <button
                  type="submit"
                  className="w-full min-h-[48px] rounded-2xl bg-[#A390E4] text-[#0F1220] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#b2a2ea] transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Підтвердити та активувати акаунт</span>
                </button>

                {/* Email Viewer / Inbox Simulator Trigger */}
                <div className="p-3.5 rounded-2xl bg-[#161B2E] border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-[#F4A261] shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-[#E4E6F0]">Сервіс-заглушка пошти</div>
                      <div className="text-[11px] text-[#9FA4BC]">
                        {lastSentEmail ? `Лист отримано о ${lastSentEmail.sentAt}` : 'Перегляд надісланого листа'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEmailViewer(true)}
                    className="min-h-[36px] px-3 rounded-xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] text-xs font-semibold text-[#A390E4] cursor-pointer"
                  >
                    Переглянути лист
                  </button>
                </div>

                {/* Resend & Back controls */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setRegStep('form');
                      setErrorMessage(null);
                    }}
                    className="text-[#9FA4BC] hover:text-[#E4E6F0] flex items-center gap-1 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Змінити дані / назад</span>
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isSendingEmail}
                    onClick={handleResendEmail}
                    className="text-[#A390E4] hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>
                      {resendCooldown > 0
                        ? `Надіслати знову (${resendCooldown}с)`
                        : 'Надіслати код повторно'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* TAB 2: CLIENT LOGIN FORM (WITH BIOMETRIC TOUCHID/FACEID) */}
        {tab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Firebase Auth Service Status */}
            <div className="p-2.5 rounded-xl bg-[#0F1220] border border-emerald-500/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[#E4E6F0] font-semibold">Сервіс авторизації:</span>
                <span className="text-emerald-300 font-medium">Firebase Cloud Auth</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono">
                Хмарна безпека
              </span>
            </div>

            {!isGuestUser(currentUser) && (
              <div className="p-3.5 rounded-2xl bg-[#0F1220] border border-[#262D47] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#E4E6F0] flex items-center gap-1.5 flex-wrap">
                    <span>Поточна сесія:</span>
                    <span className="text-[#A390E4] font-semibold">{currentUser.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#A390E4]/15 text-[#A390E4]">
                      {currentUser.plan === 'pro' ? 'PRO 👑' : 'FREE'}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#9FA4BC] truncate">{currentUser.email}</div>
                </div>
                <button
                  type="button"
                  onClick={handleLogoutInModal}
                  className="min-h-[34px] px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                  title="Вийти з поточного акаунту"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Вийти</span>
                </button>
              </div>
            )}

            <div className="text-xs text-[#9FA4BC]">
              Увійдіть до свого особистого кабінету клієнта:
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9FA4BC]">Електронна пошта</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full min-h-[44px] px-3.5 pl-10 rounded-xl bg-[#0F1220] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#A390E4]"
                />
                <Mail className="w-4 h-4 text-[#9FA4BC] absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#9FA4BC]">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full min-h-[44px] px-3.5 pl-10 pr-9 rounded-xl bg-[#0F1220] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#A390E4]"
                />
                <Lock className="w-4 h-4 text-[#9FA4BC] absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-[#9FA4BC] hover:text-[#E4E6F0]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] rounded-2xl bg-[#A390E4] text-[#0F1220] font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#b2a2ea] transition-colors cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Увійти в акаунт клієнта</span>
            </button>

            {/* Biometric Touch ID / Face ID Login Mock */}
            <div className="pt-2">
              <div className="relative flex items-center justify-center text-xs text-[#9FA4BC] before:content-[''] before:absolute before:left-0 before:right-0 before:h-[1px] before:bg-[#262D47]">
                <span className="relative px-3 bg-[#161B2E]">Безпечний біометричний вхід</span>
              </div>

              <div className="mt-3">
                <button
                  type="button"
                  disabled={biometricScanning}
                  onClick={handleBiometricLogin}
                  className={`w-full min-h-[48px] rounded-2xl border transition-all flex items-center justify-center gap-2.5 cursor-pointer font-bold text-xs sm:text-sm ${
                    biometricScanning
                      ? 'bg-[#1E253D] border-[#A390E4] text-[#A390E4] animate-pulse'
                      : biometricSuccess
                      ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                      : 'bg-[#0F1220] hover:bg-[#1E253D] border-[#262D47] text-[#E4E6F0]'
                  }`}
                >
                  {platformMode === 'ios' ? (
                    <ScanFace className="w-5 h-5 text-[#A390E4]" />
                  ) : (
                    <Fingerprint className="w-5 h-5 text-[#F4A261]" />
                  )}
                  <span>
                    {biometricScanning
                      ? platformMode === 'ios'
                        ? 'Сканування Face ID / Touch ID...'
                        : 'Сканування відбитка пальця...'
                      : platformMode === 'ios'
                      ? 'Увійти за допомогою Face ID / Touch ID'
                      : 'Біометричний вхід (Fingerprint)'}
                  </span>
                </button>
              </div>
            </div>

            {/* Provider sign-in with Verification */}
            <div className="pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenAppleVerify}
                  className="min-h-[44px] px-3 rounded-xl bg-black hover:bg-neutral-900 border border-white/20 text-xs font-semibold text-white flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                  title="Увійти з перевіркою Apple ID"
                >
                  <Apple className="w-4 h-4 fill-white" />
                  <div className="text-left">
                    <div className="font-bold leading-tight">Apple ID</div>
                    <div className="text-[10px] text-white/70 font-normal">2FA перевірка</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleOpenGoogleVerify}
                  className="min-h-[44px] px-3 rounded-xl bg-[#0F1220] hover:bg-[#1E253D] border border-[#262D47] hover:border-[#4285F4]/60 text-xs font-semibold text-[#E4E6F0] flex items-center justify-center gap-2.5 transition-all cursor-pointer shadow-sm group"
                  title="Увійти з перевіркою через Google"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <div className="text-left">
                    <div className="font-bold leading-tight">Google</div>
                    <div className="text-[10px] text-blue-400 font-normal">Перевірка OAuth</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Footer switcher & Admin Link */}
            <div className="pt-3 border-t border-[#262D47] flex items-center justify-between text-xs text-[#9FA4BC]">
              <div>
                Ще немає акаунта?{' '}
                <button
                  type="button"
                  onClick={() => setTab('register')}
                  className="text-[#A390E4] font-bold hover:underline cursor-pointer"
                >
                  Зареєструватися
                </button>
              </div>

              <button
                type="button"
                onClick={() => setTab('admin')}
                className="text-[#F4A261] hover:underline flex items-center gap-1 cursor-pointer"
                title="Панель адміністратора для створення тест-акаунтів"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Вхід для адміна</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: ADMIN PANEL (CREATION OF TEST ACCOUNTS RESERVED FOR ADMIN) */}
        {tab === 'admin' && (
          <div className="space-y-5">
            {!adminUnlocked ? (
              /* Admin Password Gate */
              <form onSubmit={handleUnlockAdmin} className="p-5 rounded-2xl bg-[#0F1220] border border-[#F4A261]/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F4A261]/20 border border-[#F4A261]/50 flex items-center justify-center text-[#F4A261]">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#E4E6F0]">Авторизація адміністратора</h3>
                    <p className="text-xs text-[#9FA4BC]">
                      Створення тестових акаунтів доступне лише для адміністратора. Введіть пароль:
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#9FA4BC]">Пароль адміністратора</label>
                  <div className="relative">
                    <input
                      type="password"
                      autoFocus
                      required
                      value={adminPasswordInput}
                      onChange={(e) => setAdminPasswordInput(e.target.value)}
                      placeholder="Введіть пароль (admin або sleep1234)"
                      className="w-full min-h-[44px] px-3.5 pl-10 rounded-xl bg-[#161B2E] border border-[#262D47] text-sm text-[#E4E6F0] placeholder-[#9FA4BC]/50 focus:outline-none focus:border-[#F4A261]"
                    />
                    <Lock className="w-4 h-4 text-[#F4A261] absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 min-h-[44px] rounded-xl bg-[#F4A261] hover:bg-[#ffaf73] text-[#0F1220] font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>Підтвердити права адміна</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTab('login')}
                    className="min-h-[44px] px-4 rounded-xl bg-[#161B2E] text-xs font-semibold text-[#9FA4BC] hover:text-[#E4E6F0] cursor-pointer"
                  >
                    Назад
                  </button>
                </div>
              </form>
            ) : (
              /* Admin Unlocked Management Area */
              <div className="space-y-5">
                {/* Admin Status Banner */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#20182E] to-[#161B2E] border border-[#F4A261]/40 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Crown className="w-5 h-5 text-[#F4A261]" />
                    <div>
                      <div className="text-xs font-bold text-[#E4E6F0]">Панель адміністратора активна</div>
                      <div className="text-[11px] text-[#9FA4BC]">
                        Створення тестових акаунтів та керування базою користувачів
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAdminUnlocked(false);
                      setAdminPasswordInput('');
                    }}
                    className="text-xs text-[#9FA4BC] hover:text-[#E4E6F0] underline cursor-pointer"
                  >
                    Вийти з адмінки
                  </button>
                </div>

                {/* Section A: Creation of Test Accounts (ADMIN ONLY) */}
                <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#262D47] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#F4A261]">
                      <Sparkles className="w-4 h-4" />
                      <span>ГЕНЕРАТОР ТЕСТОВИХ АКАУНТІВ (ДЛЯ АДМІНА)</span>
                    </div>
                    <span className="text-[10px] text-[#9FA4BC] font-mono">Швидке тестування</span>
                  </div>

                  <p className="text-xs text-[#9FA4BC]">
                    Створення тестових профілів у 1 клік для перевірки логіки R90, тарифів Free/Pro та гаджетів:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAdminCreateTestUser('free', 'client')}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#161B2E] hover:bg-[#1E253D] border border-[#262D47] hover:border-[#A390E4] text-xs font-bold text-[#E4E6F0] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-[#A390E4]" />
                        <span>+ Тестовий клієнт (Free)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#A390E4]/20 text-[#A390E4]">0 ₴</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdminCreateTestUser('pro', 'client')}
                      className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#161B2E] hover:bg-[#1E253D] border border-[#262D47] hover:border-[#F4A261] text-xs font-bold text-[#E4E6F0] flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-[#F4A261]" />
                        <span>+ Тестовий клієнт (Pro)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F4A261]/20 text-[#F4A261]">PRO</span>
                    </button>
                  </div>

                  {/* Toggle Custom Test Generator */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowCustomTestForm(!showCustomTestForm)}
                      className="text-xs text-[#A390E4] hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>{showCustomTestForm ? 'Сховати форму кастомного акаунта' : 'Створити кастомний тестовий акаунт (налаштувати)'}</span>
                    </button>
                  </div>

                  {showCustomTestForm && (
                    <form onSubmit={handleAdminCreateCustom} className="p-3.5 rounded-xl bg-[#161B2E] border border-white/10 space-y-3 pt-3 animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <input
                          type="text"
                          required
                          value={customTestName}
                          onChange={(e) => setCustomTestName(e.target.value)}
                          placeholder="Ім'я тестового клієнта"
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#0F1220] border border-[#262D47] text-xs text-[#E4E6F0] focus:outline-none focus:border-[#F4A261]"
                        />
                        <input
                          type="email"
                          required
                          value={customTestEmail}
                          onChange={(e) => setCustomTestEmail(e.target.value)}
                          placeholder="test.email@example.com"
                          className="w-full min-h-[38px] px-3 rounded-lg bg-[#0F1220] border border-[#262D47] text-xs text-[#E4E6F0] focus:outline-none focus:border-[#F4A261]"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[#9FA4BC]">Тариф:</span>
                          <button
                            type="button"
                            onClick={() => setCustomTestPlan('free')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              customTestPlan === 'free' ? 'bg-[#A390E4] text-[#0F1220]' : 'bg-[#0F1220] text-[#9FA4BC]'
                            }`}
                          >
                            Free
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomTestPlan('pro')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              customTestPlan === 'pro' ? 'bg-[#F4A261] text-[#0F1220]' : 'bg-[#0F1220] text-[#9FA4BC]'
                            }`}
                          >
                            Pro
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[#9FA4BC]">Роль:</span>
                          <button
                            type="button"
                            onClick={() => setCustomTestRole('client')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              customTestRole === 'client' ? 'bg-[#A390E4] text-[#0F1220]' : 'bg-[#0F1220] text-[#9FA4BC]'
                            }`}
                          >
                            Клієнт
                          </button>
                          <button
                            type="button"
                            onClick={() => setCustomTestRole('admin')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                              customTestRole === 'admin' ? 'bg-[#F4A261] text-[#0F1220]' : 'bg-[#0F1220] text-[#9FA4BC]'
                            }`}
                          >
                            Адмін
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full min-h-[40px] rounded-xl bg-[#F4A261] hover:bg-[#ffaf73] text-[#0F1220] text-xs font-bold transition-colors cursor-pointer"
                      >
                        Створити та додати в базу
                      </button>
                    </form>
                  )}
                </div>

                {/* Section B: All Accounts Management (Switch & Delete) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#9FA4BC]">
                    <span>Усі акаунти в базі ({accounts.length}):</span>
                    <span>Натисніть для входу/тестування</span>
                  </div>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {accounts.map((acc) => {
                      const isActive = acc.id === currentUser.id;
                      return (
                        <div
                          key={acc.id}
                          onClick={() => handleSwitchToAccount(acc.id)}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                            isActive
                              ? 'bg-[#A390E4]/15 border-[#A390E4]'
                              : 'bg-[#0F1220] border-[#262D47] hover:border-white/20'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shrink-0"
                              style={{ backgroundColor: acc.avatarColor }}
                            >
                              {acc.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[#E4E6F0] truncate">{acc.name}</span>
                                {acc.role === 'admin' ? (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#F4A261]/20 text-[#F4A261] border border-[#F4A261]/40">
                                    АДМІН
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-white/10 text-[#9FA4BC]">
                                    КЛІЄНТ
                                  </span>
                                )}
                                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                  acc.plan === 'pro'
                                    ? 'bg-[#F4A261]/15 text-[#F4A261]'
                                    : 'bg-[#A390E4]/15 text-[#A390E4]'
                                }`}>
                                  {acc.plan === 'pro' ? 'PRO' : 'FREE'}
                                </span>
                                {isActive && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-[#A390E4] text-[#0F1220]">
                                    АКТИВНИЙ
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#9FA4BC] truncate">{acc.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {isActive && !isGuestUser(currentUser) && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleLogoutInModal();
                                }}
                                className="min-h-[32px] px-2 py-1 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                                title="Вийти з цього акаунту"
                              >
                                <LogOut className="w-3 h-3" />
                                <span>Вийти</span>
                              </button>
                            )}

                            {accounts.length > 1 && !isActive && (
                              <button
                                type="button"
                                onClick={(e) => handleDelete(acc.id, e)}
                                className="min-h-[32px] min-w-[32px] rounded-lg bg-[#1E253D] hover:bg-rose-950/60 hover:text-rose-400 flex items-center justify-center text-[#9FA4BC] transition-colors"
                                title="Видалити акаунт"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <ArrowRight className="w-4 h-4 text-[#A390E4]" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section C: Mock Inbox direct access for admin testing */}
                <div className="p-3.5 rounded-2xl bg-[#0F1220] border border-white/10 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4 text-[#A390E4]" />
                    <span className="text-xs text-[#9FA4BC]">Симулятор тестової поштової скриньки:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmailViewer(true)}
                    className="min-h-[36px] px-3.5 rounded-xl bg-[#1E253D] hover:bg-[#283152] text-xs font-semibold text-[#A390E4] cursor-pointer"
                  >
                    Відкрити Inbox
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* POPUP SIMULATOR: LIVE EMAIL VIEWER (MOCK INBOX) */}
      {showEmailViewer && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setShowEmailViewer(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-[#141829] border border-[#A390E4]/50 shadow-2xl p-6 text-[#E4E6F0] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mail client toolbar */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#A390E4]" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider text-[#A390E4]">
                  Симулятор поштової скриньки (Mock Inbox)
                </span>
              </div>
              <button
                onClick={() => setShowEmailViewer(false)}
                className="w-7 h-7 rounded-lg bg-[#0F1220] flex items-center justify-center text-[#9FA4BC] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {lastSentEmail ? (
              <>
                {/* Email Metadata Header */}
                <div className="space-y-1 text-xs text-[#9FA4BC] bg-[#0F1220] p-3 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-[#E4E6F0] font-semibold">Від:</span> {lastSentEmail.emailPreview.from}
                  </div>
                  <div>
                    <span className="text-[#E4E6F0] font-semibold">Кому:</span> {lastSentEmail.emailPreview.to}
                  </div>
                  <div>
                    <span className="text-[#E4E6F0] font-semibold">Час:</span> {lastSentEmail.sentAt}
                  </div>
                  <div className="text-sm font-bold text-[#E4E6F0] pt-1">
                    {lastSentEmail.emailPreview.subject}
                  </div>
                </div>

                {/* Email Body Content */}
                <div className="p-4 rounded-2xl bg-[#0F1220] border border-[#A390E4]/30 space-y-3 text-center">
                  <div className="w-10 h-10 rounded-xl bg-[#A390E4]/20 text-[#A390E4] flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#E4E6F0]">
                    Вітаємо у системі Sleep Coach R90!
                  </h4>
                  <p className="text-xs text-[#9FA4BC] leading-relaxed">
                    Привіт, {lastSentEmail.userName}. Для завершення реєстрації та активації облікового запису введіть цей код безпеки:
                  </p>

                  {/* Big High-Contrast Code Box */}
                  <div className="p-3.5 rounded-xl bg-[#161B2E] border-2 border-dashed border-[#A390E4] font-mono text-3xl font-extrabold tracking-[0.25em] text-[#F4A261] select-all">
                    {lastSentEmail.code}
                  </div>

                  <p className="text-[11px] text-[#9FA4BC]">
                    Код безпеки дійсний протягом 15 хвилин.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setVerificationCode(lastSentEmail.code);
                    setShowEmailViewer(false);
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-[#A390E4] text-[#0F1220] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#b2a2ea] transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Вставити код ({lastSentEmail.code}) у форму</span>
                </button>
              </>
            ) : (
              <div className="p-6 text-center text-xs text-[#9FA4BC] bg-[#0F1220] rounded-2xl border border-white/5 space-y-2">
                <Inbox className="w-8 h-8 text-[#9FA4BC] mx-auto opacity-50" />
                <div>Ще не надіслано жодного листа з кодом підтвердження.</div>
                <div className="text-[11px]">Заповніть форму реєстрації клієнта, щоб відправити перший лист.</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Google OAuth 2.0 Verification Modal */}
      <GoogleAuthVerificationModal
        isOpen={showGoogleVerifyModal}
        onClose={() => setShowGoogleVerifyModal(false)}
        onSuccess={handleSocialAuthSuccess}
        initialEmail={currentUser.email || 'nspshop33@gmail.com'}
        initialName={currentUser.name !== 'Гість' ? currentUser.name : 'Олександр'}
      />

      {/* Interactive Apple ID 2FA Verification Modal */}
      <AppleAuthVerificationModal
        isOpen={showAppleVerifyModal}
        onClose={() => setShowAppleVerifyModal(false)}
        onSuccess={handleSocialAuthSuccess}
        initialName={currentUser.name !== 'Гість' ? currentUser.name : 'Користувач Apple'}
        platformMode={platformMode}
      />
    </div>
  );
};
