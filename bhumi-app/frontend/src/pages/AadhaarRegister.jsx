import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const BG = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?fm=jpg&q=75&w=2000&auto=format&fit=crop';

export default function AadhaarRegister() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = number, 2 = code, 3 = success
  const [number, setNumber] = useState('');
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendCode(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{12}$/.test(number)) {
      setError(t('aadhaar.errors.invalidNumber'));
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/aadhaar/send', { userId: user.id, aadhaarNumber: number });
      setDevOtp(data.devOtp || null);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || t('aadhaar.errors.sendFailed'));
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError(t('aadhaar.errors.invalidCode'));
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/aadhaar/verify', { userId: user.id, code });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || t('aadhaar.errors.verifyFailed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-12 relative animate-[fadeIn_0.4s_ease-out]"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(43,40,32,0.92) 0%, rgba(43,40,32,0.75) 45%, rgba(43,40,32,0.4) 100%), url(${BG})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <button
        onClick={() => navigate('/app/home')}
        className="absolute top-6 left-6 text-sm text-paper/80 hover:text-paper"
      >
        ← {t('aadhaar.back')}
      </button>

      <div className="bg-paper rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="font-display text-2xl text-ink mb-2">{t('aadhaar.title')}</h1>
        <p className="text-sm text-ink-soft mb-6 leading-relaxed">{t('aadhaar.subtitle')}</p>

        {step === 1 && (
          <form onSubmit={sendCode} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">{t('aadhaar.numberLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={number}
                onChange={(e) => setNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                placeholder={t('aadhaar.numberPlaceholder')}
                className="input tracking-widest text-center"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60">
              {loading ? t('aadhaar.sending') : t('aadhaar.sendCode')}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verifyCode} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">{t('aadhaar.codeLabel')}</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                className="input tracking-[0.4em] text-center text-lg"
              />
              {devOtp && (
                <p className="text-xs text-ink-soft mt-2">
                  Demo mode — your code is <span className="font-medium text-ink">{devOtp}</span>
                </p>
              )}
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60">
              {loading ? t('aadhaar.verifying') : t('aadhaar.verify')}
            </button>
          </form>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-sage-1/50 text-moss flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h2 className="font-display text-xl text-ink mb-2">{t('aadhaar.successTitle')}</h2>
            <p className="text-sm text-ink-soft mb-6">{t('aadhaar.successDesc')}</p>
            <button onClick={() => navigate('/app/dashboard')} className="w-full btn-primary">
              {t('aadhaar.continueBtn')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
