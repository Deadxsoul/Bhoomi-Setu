import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const BG = 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?fm=jpg&q=75&w=2000&auto=format&fit=crop';

const STATES = ['Rajasthan', 'Gujarat', 'Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana'];

const emptyForm = {
  fullName: '', dateOfBirth: '', fatherName: '', landId: '',
  surveyNumber: '', landAreaAcres: '', village: '', district: '', state: '',
  aadhaarNumber: '',
};

export default function AadhaarRegister() {
  const { user, login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1); // 1 = registration form, 2 = OTP, 3 = success
  const [form, setForm] = useState(emptyForm);
  const [code, setCode] = useState('');
  const [devOtp, setDevOtp] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function submitForm(e) {
    e.preventDefault();
    setError('');

    if (!form.fullName.trim()) return setError('Enter the name as it appears on the Aadhaar card');
    if (!form.dateOfBirth) return setError('Enter your date of birth');
    if (!form.landId.trim()) return setError('Enter the land / parcel ID');
    if (!/^\d{12}$/.test(form.aadhaarNumber)) return setError('Enter a valid 12-digit Aadhaar number');

    setLoading(true);
    try {
      const { data } = await client.post('/auth/aadhaar/send', {
        userId: user.id,
        aadhaarNumber: form.aadhaarNumber,
        fullName: form.fullName,
        dateOfBirth: form.dateOfBirth,
        landId: form.landId,
        fatherName: form.fatherName,
        village: form.village,
        district: form.district,
        state: form.state,
        surveyNumber: form.surveyNumber,
        landAreaAcres: form.landAreaAcres ? Number(form.landAreaAcres) : null,
      });
      setDevOtp(data.devOtp || null);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not start verification, try again');
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode(e) {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data } = await client.post('/auth/aadhaar/verify', { userId: user.id, code });
      // Refresh the locally-stored user so their new name/land details show up immediately.
      login(localStorage.getItem('bhumi_token'), data.user);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Incorrect or expired code');
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
        ← Back
      </button>

      {/* Step 1 gets a wider card since it's a full form; steps 2 & 3 stay compact */}
      <div className={`bg-paper rounded-2xl shadow-2xl p-8 w-full ${step === 1 ? 'max-w-2xl' : 'max-w-sm'}`}>
        {step === 1 && (
          <>
            <p className="text-xs text-ink-soft mb-1">Step 1 of 2</p>
            <h1 className="font-display text-2xl text-ink mb-2">Register your land</h1>
            <p className="text-sm text-ink-soft mb-6 leading-relaxed">
              Fill this in exactly as it appears on your documents — we'll verify it against the
              Aadhaar-linked mobile number before it's saved.
            </p>

            <form onSubmit={submitForm} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink mb-1.5">Full name (as per Aadhaar) *</label>
                  <input className="input" value={form.fullName} onChange={set('fullName')} placeholder="e.g. Ramesh Kumar" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Date of birth *</label>
                  <input type="date" className="input" value={form.dateOfBirth} onChange={set('dateOfBirth')} />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Father's / husband's name</label>
                  <input className="input" value={form.fatherName} onChange={set('fatherName')} placeholder="Optional" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Land / parcel ID *</label>
                  <input className="input" value={form.landId} onChange={set('landId')} placeholder="e.g. RJ-JPR-0001" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Survey / plot number</label>
                  <input className="input" value={form.surveyNumber} onChange={set('surveyNumber')} placeholder="Optional" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Land area (acres)</label>
                  <input type="number" step="0.01" min="0" className="input" value={form.landAreaAcres} onChange={set('landAreaAcres')} placeholder="e.g. 2.5" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Village</label>
                  <input className="input" value={form.village} onChange={set('village')} placeholder="Optional" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">District</label>
                  <input className="input" value={form.district} onChange={set('district')} placeholder="e.g. Jaipur" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">State</label>
                  <select className="input" value={form.state} onChange={set('state')}>
                    <option value="">Select state</option>
                    {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Aadhaar number *</label>
                  <input
                    className="input tracking-widest"
                    inputMode="numeric"
                    value={form.aadhaarNumber}
                    onChange={(e) => setForm((f) => ({ ...f, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
                    placeholder="12-digit number"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={loading} className="w-full btn-primary disabled:opacity-60">
                {loading ? 'Sending code…' : 'Continue — send verification code'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-xs text-ink-soft mb-1">Step 2 of 2</p>
            <h1 className="font-display text-2xl text-ink mb-2">Verify it's you</h1>
            <p className="text-sm text-ink-soft mb-6 leading-relaxed">
              A code was sent to the mobile number registered against this Aadhaar.
              <br />
              <span className="text-xs">(Demo verification — not connected to UIDAI.)</span>
            </p>
            <form onSubmit={verifyCode} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">6-digit code</label>
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
                {loading ? 'Verifying…' : 'Verify & complete registration'}
              </button>
              <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-ink-soft hover:text-ink">
                ← Edit details
              </button>
            </form>
          </>
        )}

        {step === 3 && (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full bg-sage-1/50 text-moss flex items-center justify-center mx-auto mb-4 text-2xl">✓</div>
            <h2 className="font-display text-xl text-ink mb-2">Registration complete</h2>
            <p className="text-sm text-ink-soft mb-6">
              {form.landId} is now linked to your verified profile.
            </p>
            <button onClick={() => navigate('/app/dashboard')} className="w-full btn-primary">
              Go to dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
