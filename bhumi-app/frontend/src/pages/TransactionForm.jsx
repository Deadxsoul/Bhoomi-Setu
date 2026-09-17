import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const STATES = ['Rajasthan', 'Gujarat', 'Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana'];

export default function TransactionForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initiatedAs = params.get('as') === 'buyer' ? 'buyer' : 'seller';

  const [docTypes, setDocTypes] = useState([]);
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    landId: user?.land_id || '',
    surveyNumber: user?.survey_number || '',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || '',
    areaAcres: user?.land_area_acres || '',
    agreedPrice: '',
    sellerName: initiatedAs === 'seller' ? user?.name || '' : '',
    sellerAadhaar: initiatedAs === 'seller' ? user?.aadhaar_number || '' : '',
    sellerContact: initiatedAs === 'seller' ? user?.phone || '' : '',
    buyerName: initiatedAs === 'buyer' ? user?.name || '' : '',
    buyerAadhaar: initiatedAs === 'buyer' ? user?.aadhaar_number || '' : '',
    buyerContact: initiatedAs === 'buyer' ? user?.phone || '' : '',
  });

  useEffect(() => {
    client.get('/transactions/doc-types').then((r) => setDocTypes(r.data));
  }, []);

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  function setFile(docKey) {
    return (e) => setFiles((f) => ({ ...f, [docKey]: e.target.files[0] || null }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    if (!form.landId.trim()) return setError('Enter the land / parcel ID');
    if (!form.sellerName.trim()) return setError("Enter the seller's name");
    if (!form.buyerName.trim()) return setError("Enter the buyer's name");

    setSubmitting(true);
    try {
      const { data } = await client.post('/transactions', { ...form, initiatedAs });
      const txId = data.id;

      for (const dt of docTypes) {
        const file = files[dt.key];
        if (!file) continue;
        const fd = new FormData();
        fd.append('docType', dt.key);
        fd.append('file', file);
        await client.post(`/transactions/${txId}/documents`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      navigate(`/app/land-market/${txId}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit — try again');
    } finally {
      setSubmitting(false);
    }
  }

  const youAre = initiatedAs === 'seller' ? 'Seller' : 'Buyer';
  const otherParty = initiatedAs === 'seller' ? 'Buyer' : 'Seller';
  const yourPrefix = initiatedAs;
  const otherPrefix = initiatedAs === 'seller' ? 'buyer' : 'seller';

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => navigate('/app/land-market')} className="text-sm text-ink-soft hover:text-ink mb-4">
        ← Back
      </button>
      <h1 className="text-2xl font-display font-semibold text-ink mb-1">
        Sell / buy land — you're the {youAre.toLowerCase()}
      </h1>
      <p className="text-sm text-ink-soft mb-6">
        Fill this in exactly as it appears on your documents. It's sent to a police officer for
        offline verification before the sale is marked complete.
      </p>

      <form onSubmit={submit} className="space-y-6">
        <div className="bg-paper border border-stone rounded-2xl p-6">
          <h2 className="font-display font-semibold text-ink mb-4">Land details</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Land / parcel ID *</label>
              <input className="input" value={form.landId} onChange={set('landId')} placeholder="e.g. RJ-JPR-0001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Survey / plot number</label>
              <input className="input" value={form.surveyNumber} onChange={set('surveyNumber')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Land area (acres)</label>
              <input type="number" step="0.01" min="0" className="input" value={form.areaAcres} onChange={set('areaAcres')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Agreed sale price (₹)</label>
              <input type="number" min="0" className="input" value={form.agreedPrice} onChange={set('agreedPrice')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Village</label>
              <input className="input" value={form.village} onChange={set('village')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">District</label>
              <input className="input" value={form.district} onChange={set('district')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">State</label>
              <select className="input" value={form.state} onChange={set('state')}>
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-paper border border-stone rounded-2xl p-6">
          <h2 className="font-display font-semibold text-ink mb-1">{otherParty} details</h2>
          <p className="text-xs text-ink-soft mb-4">The {otherParty.toLowerCase()} doesn't need an account — enter their details as given to you.</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-ink mb-1.5">Full name *</label>
              <input className="input" value={form[`${otherPrefix}Name`]} onChange={set(`${otherPrefix}Name`)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Aadhaar number</label>
              <input
                className="input tracking-widest"
                inputMode="numeric"
                value={form[`${otherPrefix}Aadhaar`]}
                onChange={(e) => setForm((f) => ({ ...f, [`${otherPrefix}Aadhaar`]: e.target.value.replace(/\D/g, '').slice(0, 12) }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Contact number</label>
              <input className="input" value={form[`${otherPrefix}Contact`]} onChange={set(`${otherPrefix}Contact`)} />
            </div>
          </div>
        </div>

        <div className="bg-paper border border-stone rounded-2xl p-6">
          <h2 className="font-display font-semibold text-ink mb-1">Required documents</h2>
          <p className="text-xs text-ink-soft mb-4">Upload what you have now — the police officer will check the rest offline.</p>
          <div className="space-y-3">
            {docTypes.map((dt) => (
              <div key={dt.key} className="flex items-center justify-between gap-4 border border-stone rounded-lg px-4 py-3">
                <div className="text-sm text-ink">{dt.label}</div>
                <input type="file" onChange={setFile(dt.key)} className="text-xs" />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={submitting} className="btn-primary disabled:opacity-60">
          {submitting ? 'Submitting…' : 'Submit for police verification'}
        </button>
      </form>
    </div>
  );
}
