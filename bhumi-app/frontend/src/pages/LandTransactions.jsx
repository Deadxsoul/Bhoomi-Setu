import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FeatureLayer from '../components/FeatureLayer.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const STATUS_BADGE = {
  police_verification: <span className="badge-yellow">Police Verification</span>,
  sold: <span className="badge-green">Sold</span>,
  rejected: <span className="badge-red">Rejected</span>,
};

export default function LandTransactions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const isGuest = !!user?.guest;
  const isPolice = user?.role === 'police';

  useEffect(() => {
    if (isGuest) { setLoading(false); return; }
    client.get('/land-transactions/mine').then(({ data }) => setDeals(data)).finally(() => setLoading(false));
  }, [isGuest]);

  return (
    <FeatureLayer
      id="landTransactions"
      title="Buy / Sell Land"
      subtitle="Submit a land sale as the seller or the buyer — it's verified offline by a police officer before it's marked sold."
    >
      {isGuest ? (
        <div className="card text-center py-10">
          <p className="text-ink-soft mb-4">Sign in to submit or track a land sale.</p>
          <button className="btn-primary" onClick={() => navigate('/login')}>Sign in</button>
        </div>
      ) : (
        <>
          {isPolice && (
            <div className="card bg-gradient-to-br from-moss to-sage-3 text-paper border-none flex items-center justify-between flex-wrap gap-3">
              <div>
                <h2 className="font-display text-xl mb-1">Verification queue</h2>
                <p className="text-paper/85 text-sm">Review land sales waiting for police approval.</p>
              </div>
              <button
                className="bg-paper text-moss px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-white"
                onClick={() => navigate('/app/land-transactions/queue')}
              >
                Open queue
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card flex flex-col justify-between">
              <div>
                <h2 className="font-display text-xl text-ink mb-2">I'm selling land</h2>
                <p className="text-ink-soft text-sm mb-6">
                  Fill in the buyer's details, upload your title deed and other ownership documents, and send it for verification.
                </p>
              </div>
              <button className="btn-primary self-start" onClick={() => navigate('/app/land-transactions/new/seller')}>
                Start as Seller
              </button>
            </div>
            <div className="card flex flex-col justify-between">
              <div>
                <h2 className="font-display text-xl text-ink mb-2">I'm buying land</h2>
                <p className="text-ink-soft text-sm mb-6">
                  Fill in the seller's details and your own ID proof, then track it through to approval.
                </p>
              </div>
              <button className="btn-primary self-start" onClick={() => navigate('/app/land-transactions/new/buyer')}>
                Start as Buyer
              </button>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">My submitted sales</h2>
              <button
                className="text-brand-600 text-xs underline"
                onClick={() => navigate('/app/land-transactions/history')}
              >
                🕓 View full history by land ID
              </button>
            </div>
            {loading ? (
              <p className="text-sm text-ink-soft">Loading…</p>
            ) : deals.length === 0 ? (
              <p className="text-sm text-ink-soft">You haven't submitted or been named in a land sale yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-2">Land ID</th>
                    <th>Your role</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {deals.map((d) => (
                    <tr key={d.id} className="border-b last:border-0 cursor-pointer hover:bg-cream" onClick={() => navigate(`/app/land-transactions/${d.id}`)}>
                      <td className="py-2 font-medium">{d.land_id}</td>
                      <td className="capitalize">{d.initiated_as}</td>
                      <td>₹{Number(d.agreed_price).toLocaleString('en-IN')}</td>
                      <td>{STATUS_BADGE[d.status]}</td>
                      <td>{new Date(d.submitted_at).toLocaleDateString('en-IN')}</td>
                      <td><span className="text-brand-600 text-xs underline">View</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </FeatureLayer>
  );
}
