import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FeatureLayer from '../components/FeatureLayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const STATES = ['Rajasthan', 'Gujarat', 'Maharashtra', 'Uttar Pradesh', 'Madhya Pradesh', 'Punjab', 'Haryana'];

export default function LandTransactionForm() {
  const { role } = useParams(); // 'seller' | 'buyer'
  const { user } = useAuth();
  const navigate = useNavigate();
  const isSeller = role === 'seller';

  const [docsSpec, setDocsSpec] = useState(null);
  const [files, setFiles] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    land_id: user?.land_id || '',
    survey_number: user?.survey_number || '',
    village: user?.village || '',
    district: user?.district || '',
    state: user?.state || '',
    area_acres: user?.land_area_acres || '',
    agreed_price: '',
    seller_name: isSeller ? (user?.name || '') : '',
    seller_aadhaar: isSeller ? (user?.aadhaar_number || '') : '',
    seller_contact: isSeller ? (user?.phone || '') : '',
    buyer_name: !isSeller ? (user?.name || '') : '',
    buyer_aadhaar: !isSeller ? (user?.aadhaar_number || '') : '',
    buyer_contact: !isSeller ? (user?.phone || '') : '',
  });

  useEffect(() => {
    client.get(`/land-transactions/required-docs?role=${role}`).then(({ data }) => setDocsSpec(data));
  }, [role]);

  if (!['seller', 'buyer'].includes(role)) {
    return (
      <FeatureLayer id="landTransactions" title="Buy / Sell Land">
        <div className="card text-center py-10">
          <p className="text-ink-soft mb-4">Choose whether you're the seller or the buyer first.</p>
          <button className="btn-primary" onClick={() => navigate('/app/land-transactions')}>Back</button>
        </div>
      </FeatureLayer>
    );
  }

  function set(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }
  function setFile(key) {
    return (e) => setFiles((f) => ({ ...f, [key]: e.target.files[0] }));
  }

  async function submit(e) {
    e.preventDefault();
    setError('');

    const required = docsSpec?.required || [];
    const missing = required.filter((d) => !files[d.key]);
    if (missing.length) {
      setError(`Please upload: ${missing.map((d) => d.label).join(', ')}`);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('initiated_as', role);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ''));
      Object.entries(files).forEach(([k, file]) => file && fd.append(k, file));

      const { data } = await client.post('/land-transactions', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/app/land-transactions/${data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit — check the form and try again');
    } finally {
      setSubmitting(false);
    }
  }

  const allDocs = [...(docsSpec?.required || []), ...(docsSpec?.optional || [])];

  return (
    <FeatureLayer
      id="landTransactions"
      title={isSeller ? 'Sell Land — Seller Form' : 'Buy Land — Buyer Form'}
      subtitle={
        isSeller
          ? "Fill in your details as the seller, the buyer you're selling to, and upload your ownership documents."
          : "Fill in your details as the buyer, the seller you're buying from, and upload your ID proof."
      }
    >
      <form onSubmit={submit} className="space-y-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Land details</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-soft">Land / Parcel ID *</label>
              <input className="input" value={form.land_id} onChange={set('land_id')} required />
            </div>
            <div>
              <label className="text-xs text-ink-soft">Survey number</label>
              <input className="input" value={form.survey_number} onChange={set('survey_number')} />
            </div>
            <div>
              <label className="text-xs text-ink-soft">Area (acres)</label>
              <input className="input" type="number" step="0.01" value={form.area_acres} onChange={set('area_acres')} />
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
              <label className="text-xs text-ink-soft">Agreed sale price (₹) *</label>
              <input className="input" type="number" value={form.agreed_price} onChange={set('agreed_price')} required />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Seller details {isSeller && <span className="text-xs text-ink-soft font-normal">(you)</span>}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-soft">Full name *</label>
              <input className="input" value={form.seller_name} onChange={set('seller_name')} required disabled={isSeller} />
            </div>
            <div>
              <label className="text-xs text-ink-soft">Aadhaar number</label>
              <input className="input" value={form.seller_aadhaar} onChange={set('seller_aadhaar')} maxLength={12} disabled={isSeller && !!user?.aadhaar_number} />
            </div>
            <div>
              <label className="text-xs text-ink-soft">Mobile number</label>
              <input className="input" value={form.seller_contact} onChange={set('seller_contact')} disabled={isSeller} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Buyer details {!isSeller && <span className="text-xs text-ink-soft font-normal">(you)</span>}</h2>
          <div className="grid md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-ink-soft">Full name *</label>
              <input className="input" value={form.buyer_name} onChange={set('buyer_name')} required disabled={!isSeller} />
            </div>
            <div>
              <label className="text-xs text-ink-soft">Aadhaar number</label>
              <input className="input" value={form.buyer_aadhaar} onChange={set('buyer_aadhaar')} maxLength={12} disabled={!isSeller && !!user?.aadhaar_number} />
            </div>
            <div>
              <label className="text-xs text-ink-soft">Mobile number</label>
              <input className="input" value={form.buyer_contact} onChange={set('buyer_contact')} disabled={!isSeller} />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-1">Required documents</h2>
          <p className="text-xs text-ink-soft mb-3">Scanned copies or clear photos are fine (PDF, JPG, PNG — up to 20MB each).</p>
          <div className="grid md:grid-cols-2 gap-3">
            {allDocs.map((d) => {
              const isRequired = docsSpec.required.some((r) => r.key === d.key);
              return (
                <div key={d.key}>
                  <label className="text-xs text-ink-soft">
                    {d.label} {isRequired ? <span className="text-red-600">*</span> : <span className="text-ink-soft">(optional)</span>}
                  </label>
                  <input className="input" type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={setFile(d.key)} />
                  {files[d.key] && <p className="text-xs text-moss mt-1">✓ {files[d.key].name}</p>}
                </div>
              );
            })}
            {!docsSpec && <p className="text-sm text-ink-soft">Loading document checklist…</p>}
          </div>
        </div>

        <div className="card bg-clay/10 border-clay/30">
          <p className="text-sm text-ink">
            📋 Once submitted, this sale is sent for <strong>offline police verification</strong> — typically <strong>5–8 working days</strong>.
            It only shows as <strong>Sold</strong> after the verifying officer approves it.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button className="btn-primary" disabled={submitting || !docsSpec}>{submitting ? 'Submitting…' : 'Submit for verification'}</button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/app/land-transactions')}>Cancel</button>
        </div>
      </form>
    </FeatureLayer>
  );
}
