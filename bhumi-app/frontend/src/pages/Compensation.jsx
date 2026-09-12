import React, { useEffect, useState } from 'react';
import api from '../api/client';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Compensation() {
  const [records, setRecords] = useState([]);
  const [calc, setCalc] = useState({ base_rate: 1500000, area_acres: 2, location_factor: 1.2, connectivity_bonus: 100000 });
  const [breakdown, setBreakdown] = useState(null);

  function load() {
    api.get('/compensation').then((r) => setRecords(r.data));
  }
  useEffect(load, []);

  async function runCalculator(e) {
    e.preventDefault();
    const res = await api.post('/compensation/calculate', calc);
    setBreakdown(res.data);
  }

  async function recordPayment(id, amount) {
    if (!amount) return;
    await api.patch(`/compensation/${id}/pay`, { amount: Number(amount) });
    load();
  }

  return (
    <FeatureLayer id="compensation" title="Compensation" subtitle="A transparent, explainable breakdown of what every farmer is owed.">
      <form onSubmit={runCalculator} className="card grid md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="text-xs text-gray-600">Base rate (₹/acre)</label>
          <input className="input" type="number" value={calc.base_rate} onChange={(e) => setCalc({ ...calc, base_rate: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Area (acres)</label>
          <input className="input" type="number" step="0.1" value={calc.area_acres} onChange={(e) => setCalc({ ...calc, area_acres: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Location factor</label>
          <input className="input" type="number" step="0.1" value={calc.location_factor} onChange={(e) => setCalc({ ...calc, location_factor: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-600">Connectivity bonus (₹)</label>
          <input className="input" type="number" value={calc.connectivity_bonus} onChange={(e) => setCalc({ ...calc, connectivity_bonus: e.target.value })} />
        </div>
        <button className="btn-primary md:col-span-4">Calculate Breakdown</button>
      </form>

      {breakdown && (
        <div className="card bg-brand-50">
          <h3 className="font-semibold mb-2">Breakdown (this is what a farmer sees — full transparency)</h3>
          <ul className="text-sm space-y-1">
            {breakdown.explanation.map((line, i) => <li key={i}>• {line}</li>)}
          </ul>
          <div className="text-lg font-bold text-brand-700 mt-2">Total: ₹{breakdown.total.toLocaleString('en-IN')}</div>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">All Compensation Records</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Parcel</th>
              <th>Owner</th>
              <th>Assessed</th>
              <th>Paid</th>
              <th>Status</th>
              <th>Record Payment</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <PaymentRow key={r.id} r={r} onPay={recordPayment} />
            ))}
          </tbody>
        </table>
      </div>
    </FeatureLayer>
  );
}

function PaymentRow({ r, onPay }) {
  const [amount, setAmount] = useState('');
  return (
    <tr className="border-b last:border-0">
      <td className="py-2 font-medium">{r.parcel_code}</td>
      <td>{r.owner_name}</td>
      <td>₹{r.amount_assessed.toLocaleString('en-IN')}</td>
      <td>₹{r.amount_paid.toLocaleString('en-IN')}</td>
      <td className="capitalize">{r.status}</td>
      <td>
        <div className="flex gap-1">
          <input className="input w-24 py-1" placeholder="Amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <button className="btn-secondary" onClick={() => { onPay(r.id, amount); setAmount(''); }}>Pay</button>
        </div>
      </td>
    </tr>
  );
}
