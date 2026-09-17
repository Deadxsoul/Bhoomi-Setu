import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client.js';

const STEPS = ['submitted', 'police_verification', 'sold'];
const STEP_LABEL = {
  submitted: 'Documents & form submitted',
  police_verification: 'Police verification',
  sold: 'Sold',
};

function stepIndex(status) {
  if (status === 'sold') return 2;
  if (status === 'police_verification') return 1;
  return 0; // rejected still shown as "stopped after submission"
}

export default function TransactionStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get(`/transactions/${id}`)
      .then((r) => setData(r.data))
      .catch((err) => setError(err.response?.data?.error || 'Could not load this transaction'));
  }, [id]);

  if (error) {
    return <div className="max-w-2xl mx-auto p-6"><p className="text-sm text-red-600">{error}</p></div>;
  }
  if (!data) {
    return <div className="max-w-2xl mx-auto p-6 text-ink-soft text-sm">Loading…</div>;
  }

  const { transaction: t, documents, viewerRole } = data;
  const current = stepIndex(t.status);
  const isRejected = t.status === 'rejected';

  const roleMessage =
    viewerRole === 'seller'
      ? 'Tracking the sale of your land.'
      : viewerRole === 'buyer'
      ? "Tracking your purchase — you'll be notified once the police confirm everything checks out."
      : 'Reviewing this transaction as a verifying officer.';

  return (
    <div className="max-w-2xl mx-auto p-6">
      <button onClick={() => navigate('/app/land-market')} className="text-sm text-ink-soft hover:text-ink mb-4">
        ← Back to Buy & Sell
      </button>

      <h1 className="text-2xl font-display font-semibold text-ink mb-1">{t.land_id}</h1>
      <p className="text-sm text-ink-soft mb-1">{roleMessage}</p>
      <p className="text-xs text-ink-soft mb-6">
        {t.seller_name} (seller) → {t.buyer_name} (buyer)
        {t.agreed_price ? ` · ₹${Number(t.agreed_price).toLocaleString('en-IN')}` : ''}
      </p>

      {/* Stepper */}
      <div className="bg-paper border border-stone rounded-2xl p-6 mb-6">
        {isRejected ? (
          <div className="flex items-center gap-3 text-red-700">
            <span className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">✕</span>
            <div>
              <div className="font-medium text-sm">Verification rejected</div>
              {t.verification_notes && <div className="text-xs text-ink-soft mt-0.5">{t.verification_notes}</div>}
            </div>
          </div>
        ) : (
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      i < current ? 'bg-sage-3 text-paper' :
                      i === current ? 'bg-clay text-paper' :
                      'bg-stone text-ink-soft'
                    }`}
                  >
                    {i < current ? '✓' : i + 1}
                  </div>
                  <span className="text-xs text-ink-soft text-center max-w-[6rem]">{STEP_LABEL[s]}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 ${i < current ? 'bg-sage-3' : 'bg-stone'}`} />
                )}
              </div>
            ))}
          </div>
        )}

        {t.status === 'police_verification' && (
          <p className="text-xs text-ink-soft text-center mt-4">
            This is checked offline by a police officer — usually takes around {t.approx_verification_days} days.
          </p>
        )}
      </div>

      {/* Documents */}
      <div className="bg-paper border border-stone rounded-2xl p-6">
        <h2 className="font-display font-semibold text-ink mb-3">Documents submitted</h2>
        {documents.length === 0 ? (
          <p className="text-sm text-ink-soft">None uploaded yet.</p>
        ) : (
          <ul className="text-sm text-ink space-y-1.5">
            {documents.map((d) => (
              <li key={d.id} className="flex justify-between">
                <span>{d.filename}</span>
                <span className="text-xs text-ink-soft">{d.doc_type.replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
