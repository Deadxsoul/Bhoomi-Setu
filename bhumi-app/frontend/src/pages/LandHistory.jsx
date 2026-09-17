import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FeatureLayer from '../components/FeatureLayer.jsx';
import StatusStepper from '../components/StatusStepper.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import client from '../api/client.js';

const DOC_LABELS = {
  title_deed: 'Original Sale Deed / Title Deed',
  encumbrance_certificate: 'Encumbrance Certificate (EC)',
  property_tax_receipt: 'Latest Property Tax Receipt',
  seller_id_proof: "Seller's Aadhaar / ID Proof",
  buyer_id_proof: "Buyer's Aadhaar & PAN Card",
  sale_agreement: 'Agreement to Sell',
};

const DEAL_BADGE = {
  police_verification: <span className="badge-yellow">Police Verification</span>,
  sold: <span className="badge-green">Sold</span>,
  rejected: <span className="badge-red">Rejected</span>,
};

// Icon + section-title shown for each kind of government-side milestone —
// keeps the timeline readable without repeating the raw event_type.
const GOV_EVENT_ICON = {
  proposal_stage: '📋',
  parcel_status: '📍',
  compensation_assessed: '🧮',
  compensation_paid: '💰',
  compensation_partial_payment: '💵',
  possession_handover: '🏛️',
  rehabilitation_registered: '🏠',
  rehabilitation_resettled: '✅',
};

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function formatMoney(n) {
  if (n == null) return null;
  return `₹${Number(n).toLocaleString('en-IN')}`;
}

export default function LandHistory() {
  const { landId: routeLandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [query, setQuery] = useState(routeLandId || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [section, setSection] = useState('government'); // 'transaction' | 'government'
  const [expanded, setExpanded] = useState(null); // id of the expanded card/event

  useEffect(() => {
    if (!routeLandId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError('');
    setExpanded(null);
    client
      .get(`/land-history/${encodeURIComponent(routeLandId)}`)
      .then(({ data }) => setData(data))
      .catch((err) => {
        setData(null);
        setError(err.response?.data?.error || 'Could not load history for this land ID');
      })
      .finally(() => setLoading(false));
  }, [routeLandId]);

  function search(e) {
    e?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/app/land-transactions/history/${encodeURIComponent(trimmed)}`);
  }

  const myLandId = user?.land_id;

  return (
    <FeatureLayer
      id="landHistory"
      title="Land History Tracker"
      subtitle="Look up any land ID to see its complete buy/sell history and its government acquisition timeline — like tracking an order, but for land."
    >
      <form onSubmit={search} className="card flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex-1">
          <label className="text-xs font-medium text-ink-soft uppercase">Land / Parcel ID</label>
          <input
            className="input mt-1"
            placeholder="e.g. RJ-JPR-0001"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button className="btn-primary" type="submit">Track</button>
        {myLandId && myLandId !== routeLandId && (
          <button
            type="button"
            className="btn-secondary whitespace-nowrap"
            onClick={() => { setQuery(myLandId); navigate(`/app/land-transactions/history/${encodeURIComponent(myLandId)}`); }}
          >
            Use my land ID ({myLandId})
          </button>
        )}
      </form>

      {loading && <p className="text-sm text-ink-soft">Loading history…</p>}
      {error && <div className="card border-red-200 bg-red-50 text-red-700 text-sm">{error}</div>}

      {!routeLandId && !loading && !error && (
        <div className="card text-center py-10 text-ink-soft text-sm">
          Enter a land ID above to see everything that's happened to it.
        </div>
      )}

      {data && (
        <>
          {data.parcel && (
            <div className="card">
              <h2 className="font-semibold mb-3">Land record — {data.landId}</h2>
              <dl className="grid sm:grid-cols-2 gap-x-6 text-sm">
                <Row label="Owner on record" value={data.parcel.owner_name} />
                <Row label="Area" value={data.parcel.area_acres ? `${data.parcel.area_acres} acres` : null} />
                <Row label="Linked project" value={data.parcel.project_name} />
                <Row label="Implementing agency" value={data.parcel.implementing_agency} />
                <Row label="Current status" value={data.parcel.status} capitalize />
              </dl>
            </div>
          )}

          {/* ---------- Section switcher ---------- */}
          <div className="flex gap-2">
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                section === 'transaction' ? 'bg-moss text-paper' : 'bg-stone/50 text-ink hover:bg-stone/70'
              }`}
              onClick={() => { setSection('transaction'); setExpanded(null); }}
            >
              🌾 Buy &amp; Sell History ({data.transactionHistory.length})
            </button>
            <button
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                section === 'government' ? 'bg-moss text-paper' : 'bg-stone/50 text-ink hover:bg-stone/70'
              }`}
              onClick={() => { setSection('government'); setExpanded(null); }}
            >
              🏛️ Government Land Purchase History ({data.governmentHistory.length})
            </button>
          </div>

          {section === 'transaction' ? (
            <TransactionHistorySection
              deals={data.transactionHistory}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          ) : (
            <GovernmentHistorySection
              events={data.governmentHistory}
              expanded={expanded}
              setExpanded={setExpanded}
            />
          )}
        </>
      )}
    </FeatureLayer>
  );
}

function Row({ label, value, capitalize }) {
  return (
    <div className="flex justify-between border-b border-stone/60 py-1 last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`font-medium ${capitalize ? 'capitalize' : ''}`}>{value || '—'}</dd>
    </div>
  );
}

// ---------------- Buy & Sell History ----------------
// Every private deal ever submitted for this land ID, newest first, each one
// a clickable card that expands into the full status stepper + parties +
// documents — the same detail a single deal shows on its own page.
function TransactionHistorySection({ deals, expanded, setExpanded }) {
  if (deals.length === 0) {
    return <div className="card text-center py-8 text-sm text-ink-soft">No private buy/sell deals recorded for this land ID.</div>;
  }
  return (
    <div className="space-y-3">
      {deals.map((d) => {
        const isOpen = expanded === `t-${d.id}`;
        return (
          <div key={d.id} className="card !p-0 overflow-hidden">
            <button
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-cream transition"
              onClick={() => setExpanded(isOpen ? null : `t-${d.id}`)}
            >
              <div>
                <p className="font-medium text-sm">
                  {d.seller_name} → {d.buyer_name}
                </p>
                <p className="text-xs text-ink-soft mt-0.5">
                  Submitted {formatDate(d.submitted_at)} · {formatMoney(d.agreed_price)}
                </p>
              </div>
              <div className="flex items-center gap-3">
                {DEAL_BADGE[d.status]}
                <span className="text-ink-soft text-xs">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-5 pb-5 space-y-4 border-t border-stone/60 pt-4">
                <StatusStepper
                  status={d.status}
                  submittedAt={d.submitted_at}
                  approxDays={d.approx_verification_days}
                  verifiedAt={d.verified_at}
                />

                {d.status === 'rejected' && d.verification_notes && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-medium text-red-700">Reason for rejection</p>
                    <p className="text-sm text-red-700 mt-1">{d.verification_notes}</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-ink-soft uppercase mb-1">Seller</p>
                    <p className="font-medium">{d.seller_name}</p>
                    <p className="text-xs text-ink-soft">{d.seller_contact || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-soft uppercase mb-1">Buyer</p>
                    <p className="font-medium">{d.buyer_name}</p>
                    <p className="text-xs text-ink-soft">{d.buyer_contact || '—'}</p>
                  </div>
                </div>

                <dl className="text-sm space-y-1">
                  <Row label="Survey number" value={d.survey_number} />
                  <Row label="Village" value={d.village} />
                  <Row label="District / State" value={[d.district, d.state].filter(Boolean).join(', ')} />
                  <Row label="Area" value={d.area_acres ? `${d.area_acres} acres` : null} />
                  <Row label="Agreed price" value={formatMoney(d.agreed_price)} />
                </dl>

                <div>
                  <p className="text-xs text-ink-soft uppercase mb-2">Documents</p>
                  {d.documents.length === 0 ? (
                    <p className="text-sm text-ink-soft">No documents on file.</p>
                  ) : (
                    <ul className="text-sm space-y-1">
                      {d.documents.map((doc) => (
                        <li key={doc.id} className="flex justify-between border-b border-stone/60 py-1 last:border-0">
                          <span>{DOC_LABELS[doc.doc_type] || doc.doc_type}</span>
                          <a className="text-brand-600 text-xs underline" href={`/api/land-transactions/documents/${doc.id}/download`}>
                            Download
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------- Government Land Purchase History ----------------
// A real order-tracking-style tracker: a "current status" banner up top
// (like "Out for delivery"), then a connected vertical timeline below it —
// filled/checked circles joined by a solid line for everything that's
// happened so far, oldest first, the most recent step highlighted as
// "current." Click any step to expand its amount/notes.
function GovernmentHistorySection({ events, expanded, setExpanded }) {
  if (events.length === 0) {
    return <div className="card text-center py-8 text-sm text-ink-soft">No government acquisition activity recorded for this land ID yet.</div>;
  }

  const latest = events[events.length - 1];
  const latestRejected = latest.status === 'rejected';

  return (
    <div className="space-y-4">
      {/* ---------- Current status banner ---------- */}
      <div className={`card flex items-center gap-4 ${latestRejected ? 'border-red-300 bg-red-50' : 'border-moss/30 bg-gradient-to-br from-sage-1/30 to-paper'}`}>
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0 ${latestRejected ? 'bg-red-600 text-white' : 'bg-moss text-paper'}`}>
          {GOV_EVENT_ICON[latest.event_type] || '•'}
        </div>
        <div>
          <p className="text-xs text-ink-soft uppercase tracking-wide">Current status</p>
          <p className={`font-display text-lg ${latestRejected ? 'text-red-700' : 'text-ink'}`}>{latest.title}</p>
          <p className="text-xs text-ink-soft mt-0.5">as of {formatDate(latest.event_date)}</p>
        </div>
      </div>

      {/* ---------- The tracker ---------- */}
      <div className="card">
        <ol className="relative pl-2">
          {events.map((ev, i) => {
            const isOpen = expanded === `g-${ev.id}`;
            const isCurrent = i === events.length - 1;
            const rejected = ev.status === 'rejected';
            const isLast = i === events.length - 1;
            return (
              <li key={ev.id} className="relative pl-10 pb-8 last:pb-0">
                {/* connecting line */}
                {!isLast && (
                  <span className={`absolute left-[19px] top-9 bottom-0 w-0.5 ${rejected ? 'bg-red-300' : 'bg-moss'}`} />
                )}

                {/* node */}
                <span
                  className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center text-base font-semibold border-4 border-paper shadow-sm ${
                    rejected
                      ? 'bg-red-600 text-white'
                      : isCurrent
                      ? 'bg-clay text-paper animate-pulse'
                      : 'bg-moss text-paper'
                  }`}
                >
                  {rejected ? '✕' : GOV_EVENT_ICON[ev.event_type] || '✓'}
                </span>

                <button
                  className="w-full text-left"
                  onClick={() => setExpanded(isOpen ? null : `g-${ev.id}`)}
                >
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${rejected ? 'text-red-700' : 'text-ink'}`}>{ev.title}</p>
                      {isCurrent && !rejected && (
                        <span className="text-[10px] uppercase tracking-wide bg-clay/20 text-clay-dark px-2 py-0.5 rounded-full font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <span className="text-ink-soft text-xs">{isOpen ? '▲' : '▼'}</span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1 font-medium">📅 {formatDate(ev.event_date)}</p>
                </button>

                {isOpen && (ev.description || ev.amount != null) && (
                  <div className="mt-2 bg-cream rounded-lg p-3 text-sm space-y-1">
                    {ev.amount != null && <p className="font-medium">{formatMoney(ev.amount)}</p>}
                    {ev.description && <p className="text-ink-soft">{ev.description}</p>}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
