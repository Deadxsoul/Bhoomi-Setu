import React, { useEffect, useState } from 'react';
import api from '../api/client';
import VoiceInput from '../components/VoiceInput.jsx';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Rehabilitation() {
  const [families, setFamilies] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [form, setForm] = useState({ parcel_id: '', family_name: '', family_size: '', monthly_income: '', agriculture_dependency: '0.5' });

  function load() {
    api.get('/rehabilitation').then((r) => setFamilies(r.data));
    api.get('/parcels').then((r) => setParcels(r.data));
  }
  useEffect(load, []);

  async function addFamily(e) {
    e.preventDefault();
    await api.post('/rehabilitation', form);
    setForm({ parcel_id: '', family_name: '', family_size: '', monthly_income: '', agriculture_dependency: '0.5' });
    load();
  }

  async function resettle(id) {
    await api.patch(`/rehabilitation/${id}/resettle`);
    load();
  }

  return (
    <FeatureLayer id="rehabilitation" title="Rehabilitation & Resettlement" subtitle="Priority-ranked by need — larger families, lower income, higher agriculture dependency go first.">
      <form onSubmit={addFamily} className="card grid md:grid-cols-5 gap-3 items-end">
        <select className="input" value={form.parcel_id} onChange={(e) => setForm({ ...form, parcel_id: e.target.value })} required>
          <option value="">Select parcel</option>
          {parcels.map((p) => <option key={p.id} value={p.id}>{p.parcel_code}</option>)}
        </select>
        <div className="flex gap-1">
          <input className="input" placeholder="Family name" value={form.family_name} onChange={(e) => setForm({ ...form, family_name: e.target.value })} required />
          <VoiceInput onResult={(text) => setForm({ ...form, family_name: text })} />
        </div>
        <input className="input" type="number" placeholder="Family size" value={form.family_size} onChange={(e) => setForm({ ...form, family_size: e.target.value })} />
        <input className="input" type="number" placeholder="Monthly income (₹)" value={form.monthly_income} onChange={(e) => setForm({ ...form, monthly_income: e.target.value })} />
        <input className="input" type="number" step="0.1" min="0" max="1" placeholder="Agri dependency (0-1)" value={form.agriculture_dependency} onChange={(e) => setForm({ ...form, agriculture_dependency: e.target.value })} />
        <button className="btn-primary md:col-span-5">Register Family</button>
      </form>

      <div className="card">
        <h2 className="font-semibold mb-3">Priority List (highest need first)</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Family</th>
              <th>Parcel</th>
              <th>Size</th>
              <th>Income</th>
              <th>Priority Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {families.map((f) => (
              <tr key={f.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{f.family_name}</td>
                <td>{f.parcel_code}</td>
                <td>{f.family_size}</td>
                <td>₹{f.monthly_income.toLocaleString('en-IN')}</td>
                <td>
                  <span className={`badge-${f.priority_score >= 60 ? 'red' : f.priority_score >= 30 ? 'yellow' : 'green'}`}>
                    {f.priority_score}
                  </span>
                </td>
                <td>{f.resettled ? <span className="badge-green">Resettled</span> : <span className="badge-yellow">Pending</span>}</td>
                <td>{!f.resettled && <button className="btn-secondary" onClick={() => resettle(f.id)}>Mark Resettled</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeatureLayer>
  );
}
