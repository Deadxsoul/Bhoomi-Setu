import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const FIELD_PHOTO = 'https://images.unsplash.com/photo-1720156457517-c5ae8b9915f0?fm=jpg&q=70&w=2000&auto=format&fit=crop';

const ROLES = [
  { key: 'central', label: 'Central Ministry' },
  { key: 'state', label: 'State Officer' },
  { key: 'district', label: 'District Officer' },
  { key: 'agency', label: 'Project Agency' },
  { key: 'farmer', label: 'Farmer' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [lang, setLang] = useState('en');
  const [step, setStep] = useState(1); // 1 = phone, 2 = otp
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendOtp(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}$/.test(phone)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/otp/send', { phone });
      setDevOtp(data.devOtp || null);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not send code, try again');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/otp/verify', { phone, code: otp });
      login(data.token, data.user);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect or expired code');
    } finally {
      setLoading(false);
    }
  }

  async function demoRoleLogin(role) {
    setError('');
    try {
      const { data } = await client.post('/auth/demo-login', { role });
      login(data.token, data.user);
      navigate('/app/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'That demo account is not seeded yet');
    }
  }

  async function continueAsGuest() {
    const { data } = await client.post('/auth/guest');
    login(data.token, { guest: true });
    navigate('/app/dashboard');
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
        Continue as guest
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
            <span className="font-display text-lg">Bhūmi</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl leading-tight mb-4 max-w-[11ch]">
            Every acre, accounted for.
          </h1>
          <p className="text-paper/85 max-w-[36ch] leading-relaxed">
            Track your land's journey — from notice to compensation to possession —
            in one place, in your language.
          </p>
        </div>

        {/* Right: sign-in card */}
        <div className="bg-paper rounded-2xl shadow-xl p-8 w-full max-w-sm justify-self-end">
          <div className="flex justify-end gap-1 mb-6 text-sm">
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-1 rounded ${lang === 'en' ? 'bg-stone font-medium text-ink' : 'text-ink-soft'}`}
            >
              English
            </button>
            <button
              onClick={() => setLang('hi')}
              className={`px-2 py-1 rounded ${lang === 'hi' ? 'bg-stone font-medium text-ink' : 'text-ink-soft'}`}
            >
              हिंदी
            </button>
          </div>

          <p className="text-xs text-ink-soft mb-1">Step {step} of 2</p>
          <h2 className="font-display text-2xl text-ink mb-2">
            {step === 1 ? 'Sign in with your phone' : 'Enter the code'}
          </h2>
          <p className="text-sm text-ink-soft mb-6 leading-relaxed">
            {step === 1
              ? "We'll send a one-time code to verify it's you. No password to remember."
              : `Sent to +91 ${phone}. It expires in 5 minutes.`}
          </p>

          {step === 1 ? (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">Mobile number</label>
                <div className="flex border border-stone rounded-lg overflow-hidden bg-cream">
                  <span className="px-3 py-3 text-sm text-ink-soft bg-stone">+91</span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
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
                {loading ? 'Sending…' : 'Send code'}
              </button>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">6-digit code</label>
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
                    Demo mode — your code is <span className="font-medium text-ink">{devOtp}</span>
                  </p>
                )}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-clay hover:bg-clay-dark text-paper font-medium disabled:opacity-60"
              >
                {loading ? 'Verifying…' : 'Verify & sign in'}
              </button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-ink-soft hover:text-ink"
              >
                Use a different number
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 my-6 text-xs text-ink-soft">
            <div className="flex-1 h-px bg-stone" />
            or
            <div className="flex-1 h-px bg-stone" />
          </div>

          <button
            type="button"
            title="Google sign-in needs a Client ID configured in the backend .env"
            className="w-full py-3 rounded-lg border border-stone flex items-center justify-center gap-2 text-sm font-medium text-ink hover:bg-cream"
          >
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.8-.4-4.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.5 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34.6 5.1 29.6 3 24 3 16.1 3 9.3 7.4 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 36 26.9 37 24 37c-5.3 0-9.7-3.1-11.3-7.5l-6.5 5C9.2 41.5 16 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C39.8 36.6 44 31.1 44 24c0-1.4-.1-2.8-.4-4.5z"/></svg>
            Continue with Google
          </button>

          <div className="mt-6 pt-5 border-t border-stone">
            <p className="text-xs text-ink-soft mb-2">Demo accounts — one click per role</p>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => demoRoleLogin(r.key)}
                  className="text-xs px-2.5 py-1.5 rounded-full border border-stone text-ink-soft hover:border-sage-3 hover:text-ink"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
