import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

export default function PoliceQueue() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);

  function load() {
    client.get('/transactions/queue').then((r) => setQueue(r.data)).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  if (user?.role !== 'police') {
    return (
      <div className="max-w-xl mx-auto p-6">
        <p className="text-sm text-ink-soft">This queue is only visible to a verifying police officer account.</p>
      </div>
    );
  }

  async function decide(id, decision) {
    setBusyId(id);
    try {
      await client.patch(`/transactions/${id}/decision`, { decision, notes: notes[id] || '' });
      load();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-display font-semibold text-ink mb-1">Verification queue</h1>
      <p className="text-sm text-ink-soft mb-6">
        Sale transactions waiting on an offline document/identity check before they can be marked sold.
      </p>

      {loading ? (
        <p className="text-sm text-ink-soft">Loading…</p>
      ) : queue.length === 0 ? (
        <p className="text-sm text-ink-soft">Nothing pending right now.</p>
      ) : (
        <div className="space-y-4">
          {queue.map((t) => (
            <div key={t.id} className="bg-paper border border-stone rounded-2xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <button onClick={() => navigate(`/app/land-market/${t.id}`)} className="font-medium text-ink hover:underline">
                    {t.land_id}
                  </button>
                  <div className="text-xs text-ink-soft mt-0.5">
                    {t.seller_name} → {t.buyer_name} · submitted {new Date(t.submitted_at).toLocaleDateString('en-IN')}
                  </div>
                </div>
                {t.agreed_price && (
                  <span className="text-sm text-ink-soft">₹{Number(t.agreed_price).toLocaleString('en-IN')}</span>
                )}
              </div>

              <textarea
                placeholder="Verification notes (optional)"
                value={notes[t.id] || ''}
                onChange={(e) => setNotes((n) => ({ ...n, [t.id]: e.target.value }))}
                className="input text-sm mb-3"
                rows={2}
              />

              <div className="flex gap-2">
                <button
                  disabled={busyId === t.id}
                  onClick={() => decide(t.id, 'approve')}
                  className="btn-primary disabled:opacity-60"
                >
                  Approve — mark sold
                </button>
                <button
                  disabled={busyId === t.id}
                  onClick={() => decide(t.id, 'reject')}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-stone text-red-700 hover:bg-cream disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
