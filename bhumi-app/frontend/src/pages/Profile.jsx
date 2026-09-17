import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureLayer from '../components/FeatureLayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const STATES = ['Rajasthan', 'Gujarat', 'Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana'];

export default function Profile() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const isGuest = !!user?.guest;

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const { data } = await client.patch('/auth/me', form);
      const token = localStorage.getItem('bhumi_token');
      login(token, data.user);
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not save your changes, try again');
    } finally {
      setSaving(false);
    }
  }

  if (isGuest) {
    return (
      <FeatureLayer id="profile" title="Profile" subtitle="Guests don't have a saved profile.">
        <div className="card text-center py-10">
          <p className="text-ink-soft mb-4">Sign in with your phone number or Aadhaar to create a profile you can edit and come back to.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      </FeatureLayer>
    );
  }

  return (
    <FeatureLayer id="profile" title="Profile" subtitle="View and update the information linked to your account.">
      <form onSubmit={save} className="card grid md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-ink-soft">Full name</label>
          <input className="input" value={form.name} onChange={set('name')} required />
        </div>
        <div>
          <label className="text-xs text-ink-soft">Mobile number</label>
          <input className="input bg-stone/40" value={user?.phone || '—'} disabled />
        </div>
        <div>
          <label className="text-xs text-ink-soft">Email</label>
          <input className="input" type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" />
        </div>
        <div>
          <label className="text-xs text-ink-soft">Aadhaar status</label>
          <input
            className="input bg-stone/40"
            value={user?.aadhaar_verified ? 'Verified ✅' : 'Not verified'}
            disabled
          />
        </div>
        <div>
          <label className="text-xs text-ink-soft">Village</label>
          <input className="input" value={form.village} onChange={set('village')} />
        </div>
        <div>
          <label className="text-xs text-ink-soft">District</label>
          <input className="input" value={form.district} onChange={set('district')} />
        </div>
        <div>
          <label className="text-xs text-ink-soft">State</label>
          <select className="input" value={form.state} onChange={set('state')}>
            <option value="">Select state</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-ink-soft">Role</label>
          <input className="input bg-stone/40" value={user?.role || '—'} disabled />
        </div>

        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          <button className="btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
          {saved && <span className="text-sm text-moss font-medium">Saved ✓</span>}
          {error && <span className="text-sm text-red-600">{error}</span>}
        </div>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-2">Land on record</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div><p className="text-ink-soft text-xs">Land / Parcel ID</p><p className="font-medium">{user?.land_id || '—'}</p></div>
          <div><p className="text-ink-soft text-xs">Survey number</p><p className="font-medium">{user?.survey_number || '—'}</p></div>
          <div><p className="text-ink-soft text-xs">Area (acres)</p><p className="font-medium">{user?.land_area_acres || '—'}</p></div>
        </div>
        {!user?.aadhaar_verified && (
          <button className="btn-secondary mt-4" onClick={() => navigate('/app/aadhaar')}>Register / verify land with Aadhaar</button>
        )}
      </div>
    </FeatureLayer>
  );
}
