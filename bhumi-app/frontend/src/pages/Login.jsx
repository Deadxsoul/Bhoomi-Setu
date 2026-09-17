import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const FIELD_PHOTO = 'https://images.unsplash.com/photo-1720156457517-c5ae8b9915f0?fm=jpg&q=70&w=2000&auto=format&fit=crop';

const ROLES = ['central', 'state', 'district', 'agency', 'farmer', 'police'];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, i18n } = useTranslation();

  const [step, setStep] = useState(1); // 1 = phone, 2 = otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function changeLang(code) {
    i18n.changeLanguage(code);
  }

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError(t('errors.invalidPhone'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/otp/send', { phone });
      setDevOtp(data.devOtp || null);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || t('errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError(t('errors.invalidOtp'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/otp/verify', { phone, code: otp });
      login(data.token, data.user);
      navigate('/app/home');
    } catch (err) {
      setError(err.response?.data?.error || t('errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function demoRoleLogin(role) {
    setError('');
    try {
      const { data } = await client.post('/auth/demo-login', { role });
      login(data.token, data.user);
      navigate('/app/home');
    } catch (err) {
      setError(err.response?.data?.error || t('errors.demoNotSeeded'));
    }
  }

  async function continueAsGuest() {
    const { data } = await client.post('/auth/guest');
    login(data.token, { guest: true });
    navigate('/app/home');
  }

  async function googleLogin() {
    setError('');
    try {
      const { data } = await client.post('/auth/google');
      login(data.token, data.user);
      navigate('/app/home');
    } catch (err) {
      setError(err.response?.data?.error || t('errors.sendFailed'));
    }
  }

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-6 py-10 relative"
      style={{
        backgroundImage: `linear-gradient(115deg, rgba(59,70,48,0.90) 0%, rgba(59,70,48,0.62) 38%, rgba(43,40,32,0.20) 68%), url(${FIELD_PHOTO})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundBlendMode: 'multiply',
        filter: 'saturate(0.9)',
      }}
    >
      {/* Guest mode — tucked in the corner, not a prominent button */}
      <button
        onClick={continueAsGuest}
        className="absolute top-5 right-6 text-sm text-paper/90 hover:text-paper underline decoration-paper/40 underline-offset-4"
      >
        {t('continueAsGuest')}
      </button>

      <div className="w-full max-w-5xl grid md:grid-cols-2 gap-10 items-center">
        {/* Left: headline over the photo */}
        <div className="text-paper pr-2">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-8 h-8 rounded-lg bg-paper/15 border border-paper/30 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                <path d="M3 21L12 3L21 21" stroke="#FBF9F3" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="M8 21V13H16V21" stroke="#FBF9F3" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-display text-lg">{t('appName')}</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-4 max-w-[11ch]">
            {t('tagline')}
          </h1>
          <p className="text-paper/85 max-w-[36ch] leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        {/* Right: sign-in card */}
        <div className="bg-paper rounded-2xl shadow-xl p-8 w-full max-w-sm justify-self-end">
          <div className="flex justify-end gap-1 mb-6 text-sm">
            <button
              onClick={() => changeLang('en')}
              className={`px-2 py-1 rounded ${i18n.language === 'en' ? 'bg-stone font-medium text-ink' : 'text-ink-soft'}`}
            >
              English
            </button>
            <button
              onClick={() => changeLang('hi')}
              className={`px-2 py-1 rounded ${i18n.language === 'hi' ? 'bg-stone font-medium text-ink' : 'text-ink-soft'}`}
            >
              हिंदी
            </button>
          </div>

          <p className="text-xs text-ink-soft mb-1">{t('stepOf', { step })}</p>
          <h2 className="font-display text-2xl text-ink mb-2">
            {step === 1 ? t('signInTitle') : t('enterCodeTitle')}
          </h2>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            {step === 1 ? t('signInSubtitle') : t('codeSentTo', { phone })}
          </p>

          {step === 1 ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">{t('mobileNumberLabel')}</label>
                <div className="flex border border-stone rounded-lg overflow-hidden bg-cream">
                  <span className="px-3 py-3 text-sm text-ink-soft bg-stone">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder={t('phonePlaceholder')}
                    className="flex-1 bg-transparent px-3 py-3 text-[15px] outline-none"
                  />
                </div>
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-clay hover:bg-clay-dark text-paper font-medium disabled:opacity-60"
              >
                {loading ? t('sending') : t('sendCode')}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">{t('codeLabel')}</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="••••••"
                  className="w-full text-center tracking-[0.4em] border border-stone rounded-lg bg-cream px-3 py-3 text-lg outline-none focus:border-sage-3"
                />
                {devOtp && (
                  <p className="text-xs text-ink-soft mt-2">
                    {t('demoModeCode')} <span className="font-medium text-ink">{devOtp}</span>
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-clay hover:bg-clay-dark text-paper font-medium disabled:opacity-60"
              >
                {loading ? t('verifying') : t('verifyAndSignIn')}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-ink-soft hover:text-ink"
              >
                {t('useDifferentNumber')}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-6 text-xs text-ink-soft">
            <div className="flex-1 h-px bg-stone" />
            {t('or')}
            <div className="flex-1 h-px bg-stone" />
          </div>

          <button
            type="button"
            onClick={googleLogin}
            title={t('googleTitle')}
            className="w-full py-3 rounded-lg border border-stone flex items-center justify-center gap-2 text-sm font-medium text-ink hover:bg-cream"
          >
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.8-.4-4.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.1 3 9.3 7.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 36 26.9 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.2 41.5 16 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C39.8 36.6 44 31.1 44 24c0-1.4-.1-2.8-.4-4.5z"/></svg>
            {t('continueWithGoogle')}
          </button>

          <div className="mt-6 pt-5 border-t border-stone">
            <p className="text-xs text-ink-soft mb-2">{t('demoAccountsLabel')}</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((role) => (
                <button
                  key={role}
                  onClick={() => demoRoleLogin(role)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-stone text-ink-soft hover:border-sage-3 hover:text-ink"
                >
                  {t(`roles.${role}`)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
