import React, { useEffect, useState } from 'react';
import api from '../api/client';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Satellite() {
  const [parcels, setParcels] = useState([]);
  const [parcelId, setParcelId] = useState('');
  const [before, setBefore] = useState(null);
  const [after, setAfter] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/parcels').then((r) => setParcels(r.data)); }, []);

  async function compare(e) {
    e.preventDefault();
    if (!parcelId || !before || !after) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append('before', before);
    fd.append('after', after);
    try {
      const res = await api.post(`/satellite/${parcelId}/compare`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <FeatureLayer id="satellite" title="Satellite Check" subtitle="Upload before/after images to detect encroachment without a site visit.">
      <p className="text-sm text-gray-500">
        (Demo uses pixel-difference analysis as a lightweight proxy for real satellite change-detection.)
      </p>

      <form onSubmit={compare} className="card grid md:grid-cols-2 gap-4">
        <select className="input md:col-span-2" value={parcelId} onChange={(e) => setParcelId(e.target.value)} required>
          <option value="">Select parcel</option>
          {parcels.map((p) => <option key={p.id} value={p.id}>{p.parcel_code} — {p.owner_name}</option>)}
        </select>
        <div>
          <label className="text-xs text-gray-600">Before image</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setBefore(e.target.files[0])} required />
        </div>
        <div>
          <label className="text-xs text-gray-600">After image</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setAfter(e.target.files[0])} required />
        </div>
        <button className="btn-primary md:col-span-2" disabled={loading}>{loading ? 'Analyzing…' : 'Compare Images'}</button>
      </form>

      {result && (
        <div className="card bg-brand-50">
          <h3 className="font-semibold mb-1">Analysis Result</h3>
          <p className="text-2xl font-bold text-brand-700">{result.changed_area_pct}% area changed</p>
          <p className="text-sm mt-1">{result.verdict}</p>
          <p className="text-xs text-gray-400 mt-2">{result.note}</p>
        </div>
      )}
    </FeatureLayer>
  );
}
