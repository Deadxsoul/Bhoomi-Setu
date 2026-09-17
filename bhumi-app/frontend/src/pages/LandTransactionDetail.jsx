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

export default function LandTransactionDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [deal, setDeal] = useState(null);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [acting, setActing] = useState(false);

  function load() {
    client.get(`/land-transactions/${id}`).then(({ data }) => setDeal(data)).catch(() => setError('Could not load this sale'));
  }
  useEffect(load, [id]);

  async function verify(decision) {
    setActing(true);
    try {
      await client.patch(`/land-transactions/${id}/verify`, { decision, notes });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not record the decision');
    } finally {
      setActing(false);
    }
  }

  if (error) {
    return (
      <FeatureLayer id="landTransactions" title="Buy / Sell Land">
        <div className="card text-center py-10 text-red-600">{error}</div>
      </FeatureLayer>
    );
  }
  if (!deal) {
    return (
      <FeatureLayer id="landTransactions" title="Buy / Sell Land">
        <div className="card text-center py-10 text-ink-soft">Loading…</div>
      </FeatureLayer>
    );
  }

  const isPolice = user?.role === 'police';
  const canDecide = isPolice && deal.status === 'police_verification';

  return (
    <FeatureLayer id="landTransactions" title={`Land Sale — ${deal.land_id}`} subtitle="Track this sale from submission to police-verified approval.">
      <button className="text-sm text-brand-600 underline" onClick={() => navigate(-1)}>← Back</button>

      <StatusStepper
        status={deal.status}
        submittedAt={deal.submitted_at}
        approxDays={deal.approx_verification_days}
        verifiedAt={deal.verified_at}
      />

      {deal.status === 'rejected' && deal.verification_notes && (
        <div className="card bg-red-50 border-red-200">
          <p className="text-sm font-medium text-red-700">Reason for rejection</p>
          <p className="text-sm text-red-700 mt-1">{deal.verification_notes}</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold mb-3">Land details</h2>
          <dl className="text-sm space-y-1">
            <Row label="Survey number" value={deal.survey_number} />
            <Row label="Village" value={deal.village} />
            <Row label="District" value={deal.district} />
            <Row label="State" value={deal.state} />
            <Row label="Area" value={deal.area_acres ? `${deal.area_acres} acres` : null} />
            <Row label="Agreed price" value={deal.agreed_price ? `₹${Number(deal.agreed_price).toLocaleString('en-IN')}` : null} />
          </dl>
        </div>

        <div className="card">
          <h2 className="font-semibold mb-3">Parties</h2>
          <div className="mb-3">
            <p className="text-xs text-ink-soft uppercase">Seller</p>
            <p className="text-sm font-medium">{deal.seller_name}</p>
            <p className="text-xs text-ink-soft">{deal.seller_contact || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-ink-soft uppercase">Buyer</p>
            <p className="text-sm font-medium">{deal.buyer_name}</p>
            <p className="text-xs text-ink-soft">{deal.buyer_contact || '—'}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-3">Documents</h2>
        {deal.documents.length === 0 ? (
          <p className="text-sm text-ink-soft">No documents on file.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2">Document</th>
                <th>Uploaded</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deal.documents.map((d) => (
                <tr key={d.id} className="border-b last:border-0">
                  <td className="py-2">{DOC_LABELS[d.doc_type] || d.doc_type}</td>
                  <td>{new Date(d.uploaded_at).toLocaleString('en-IN')}</td>
                  <td><a className="text-brand-600 text-xs underline" href={`/api/land-transactions/documents/${d.id}/download`}>Download</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {canDecide && (
        <div className="card border-clay/40 bg-clay/5">
          <h2 className="font-semibold mb-2">Police verification decision</h2>
          <textarea
            className="input mb-3"
            rows={3}
            placeholder="Notes (visible to the applicant, e.g. reason for rejection)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex gap-3">
            <button className="btn-primary" disabled={acting} onClick={() => verify('approve')}>Approve — Mark Sold</button>
            <button className="bg-red-600 text-paper px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium" disabled={acting} onClick={() => verify('reject')}>
              Reject
            </button>
          </div>
        </div>
      )}
    </FeatureLayer>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between border-b border-stone/60 py-1 last:border-0">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="font-medium">{value || '—'}</dd>
    </div>
  );
}
