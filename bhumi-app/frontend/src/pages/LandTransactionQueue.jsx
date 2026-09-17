import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureLayer from '../components/FeatureLayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

export default function LandTransactionQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get('/land-transactions/queue')
      .then(({ data }) => setRows(data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load the queue'))
      .finally(() => setLoading(false));
  }, []);

  if (user?.role !== 'police') {
    return (
      <FeatureLayer id="landTransactions" title="Verification Queue">
        <div className="card text-center py-10 text-ink-soft">Only the verifying police officer account can open this queue.</div>
      </FeatureLayer>
    );
  }

  return (
    <FeatureLayer id="landTransactions" title="Verification Queue" subtitle="Land sales waiting for offline police verification, oldest first.">
      <div className="card">
        {loading ? (
          <p className="text-sm text-ink-soft">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-ink-soft">Nothing pending — the queue is clear.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Land ID</th>
                <th>Seller</th>
                <th>Buyer</th>
                <th>Price</th>
                <th>Submitted</th>
                <th>ETA</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 cursor-pointer hover:bg-cream" onClick={() => navigate(`/app/land-transactions/${r.id}`)}>
                  <td className="py-2 font-medium">{r.land_id}</td>
                  <td>{r.seller_name}</td>
                  <td>{r.buyer_name}</td>
                  <td>₹{Number(r.agreed_price).toLocaleString('en-IN')}</td>
                  <td>{new Date(r.submitted_at).toLocaleDateString('en-IN')}</td>
                  <td>{r.approx_verification_days} days</td>
                  <td><span className="text-brand-600 text-xs underline">Review</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </FeatureLayer>
  );
}
