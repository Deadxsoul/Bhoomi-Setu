import React, { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import FeatureLayer from '../components/FeatureLayer.jsx';

const STAGE_LABELS = {
  submitted: 'Submitted',
  district_review: 'District Review',
  state_review: 'State Review',
  central_review: 'Central Review',
  approved: 'Approved',
  rejected: 'Rejected',
};

export default function Projects() {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [proposalsByProject, setProposalsByProject] = useState({});
  const [form, setForm] = useState({ name: '', type: 'highway', state: '', district: '', implementing_agency: '' });

  async function load() {
    const res = await api.get('/projects');
    setProjects(res.data);
    for (const p of res.data) {
      const pr = await api.get(`/proposals/${p.id}`);
      setProposalsByProject((prev) => ({ ...prev, [p.id]: pr.data }));
    }
  }

  useEffect(() => { load(); }, []);

  async function submitProject(e) {
    e.preventDefault();
    await api.post('/projects', form);
    setForm({ name: '', type: 'highway', state: '', district: '', implementing_agency: '' });
    load();
  }

  async function advance(proposalId, reject = false) {
    await api.patch(`/proposals/${proposalId}/advance`, { reject });
    load();
  }

  const canSubmit = ['central', 'state', 'agency'].includes(user.role);
  const canReview = ['district', 'state', 'central'].includes(user.role);

  return (
    <FeatureLayer id="projects" title="Proposals" subtitle="Submission and approval workflow, from district to central review.">
      {canSubmit && (
        <form onSubmit={submitProject} className="card space-y-3">
          <h2 className="font-semibold">Submit New Project Proposal</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input className="input" placeholder="Project name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="highway">Highway</option>
              <option value="railway">Railway</option>
              <option value="irrigation">Irrigation</option>
              <option value="industrial">Industrial Corridor</option>
              <option value="urban">Urban Development</option>
            </select>
            <input className="input" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
            <input className="input" placeholder="District" value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} required />
            <input className="input" placeholder="Implementing agency" value={form.implementing_agency} onChange={(e) => setForm({ ...form, implementing_agency: e.target.value })} />
          </div>
          <button className="btn-primary">Submit Proposal</button>
        </form>
      )}

      <div className="space-y-4">
        {projects.map((p) => {
          const proposals = proposalsByProject[p.id] || [];
          const latest = proposals[proposals.length - 1];
          return (
            <div key={p.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.type} · {p.state}/{p.district} · {p.implementing_agency || '—'}</p>
                </div>
                <span className="badge-green capitalize">{p.status}</span>
              </div>

              <div className="mt-3 flex items-center gap-2 flex-wrap text-xs">
                {Object.keys(STAGE_LABELS).filter(s => s !== 'rejected').map((stage, i) => {
                  const reached = latest && Object.keys(STAGE_LABELS).indexOf(latest.stage) >= i;
                  return (
                    <span key={stage} className={`px-2 py-1 rounded-full ${reached ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                      {STAGE_LABELS[stage]}
                    </span>
                  );
                })}
              </div>

              {latest?.remarks && <p className="text-xs text-gray-500 mt-2">Remarks: {latest.remarks}</p>}

              {canReview && latest && !['approved', 'rejected'].includes(latest.stage) && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => advance(latest.id)} className="btn-primary">Advance to Next Stage</button>
                  <button onClick={() => advance(latest.id, true)} className="btn-secondary text-red-600">Reject</button>
                </div>
              )}
            </div>
          );
        })}
        {projects.length === 0 && <p className="text-gray-500">No projects yet.</p>}
      </div>
    </FeatureLayer>
  );
}
