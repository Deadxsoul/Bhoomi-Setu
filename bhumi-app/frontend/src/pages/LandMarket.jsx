import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client.js';

const STATUS_LABEL = {
  police_verification: 'Police verification',
  sold: 'Sold',
  rejected: 'Rejected',
};
const STATUS_COLOR = {
  police_verification: 'bg-amber-100 text-amber-800',
  sold: 'bg-sage-1/60 text-moss',
  rejected: 'bg-red-100 text-red-700',
};

export default function LandMarket() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/transactions/mine').then((r) => setTransactions(r.data)).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-display font-semibold text-ink mb-1">Buy & Sell Land</h1>
      <p className="text-sm text-ink-soft mb-6">
        Start a new sale, or check the status of one already submitted for police verification.
      </p>

      <div className="grid sm:grid-cols-2 gap-4 mb-10">
        <button
          onClick={() => navigate('/app/land-market/new?as=seller')}
          className="text-left bg-paper border border-stone rounded-2xl p-5 hover:border-sage-3 hover:shadow-sm transition"
        >
          <div className="font-display text-lg text-ink mb-1">I'm selling land</div>
          <div className="text-sm text-ink-soft">Start a new sale and enter the buyer's details</div>
        </button>
        <button
          onClick={() => navigate('/app/land-market/new?as=buyer')}
          className="text-left bg-paper border border-stone rounded-2xl p-5 hover:border-sage-3 hover:shadow-sm transition"
        >
          <div className="font-display text-lg text-ink mb-1">I'm buying land</div>
          <div className="text-sm text-ink-soft">Start a new purchase and enter the seller's details</div>
        </button>
      </div>

      <h2 className="text-lg font-display font-semibold text-ink mb-3">Your transactions</h2>
      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : transactions.length === 0 ? (
        <p className="text-sm text-ink-soft">Nothing yet — start one above.</p>
      ) : (
        <div className="space-y-2">
          {transactions.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/app/land-market/${t.id}`)}
              className="w-full flex items-center justify-between bg-paper border border-stone rounded-xl px-4 py-3 text-left hover:border-sage-3"
            >
              <div>
                <div className="font-medium text-ink text-sm">{t.land_id}</div>
                <div className="text-xs text-ink-soft">{t.seller_name} → {t.buyer_name}</div>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[t.status]}`}>
                {STATUS_LABEL[t.status]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
