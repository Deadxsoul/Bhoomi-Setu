import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api/client';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// Palette pulled from tailwind.config.js — kept as hex here since Recharts
// needs literal color values, not class names.
const CHART_COLORS = ['#B97A4E', '#3B4630', '#8CA073', '#8F5B37', '#B7C29B'];

const FEATURES = [
  { to: 'projects', label: 'Proposals', blurb: 'Submit & review project proposals' },
  { to: 'map', label: 'GIS Map', blurb: 'Parcel-level map with litigation risk' },
  { to: 'compensation', label: 'Compensation', blurb: 'Explainable compensation calculator' },
  { to: 'possession', label: 'Possession', blurb: 'Track possession status by parcel' },
  { to: 'rehabilitation', label: 'R&R', blurb: 'Rehabilitation & resettlement scoring' },
  { to: 'documents', label: 'Documents', blurb: 'Document management & duplicate check' },
  { to: 'satellite', label: 'Satellite Check', blurb: 'Encroachment detection' },
  { to: 'ranking', label: 'State Ranking', blurb: 'Gamified state-wise performance' },
  { to: 'chatbot', label: 'Farmer Chatbot', blurb: 'Guided help for farmers' },
  { to: 'reports', label: 'Reports', blurb: 'MIS reports — PDF & Excel' },
];

// Fade-and-rise reveal, replayed each time a section scrolls into view.
const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

function Section({ children, className = '' }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      variants={reveal}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FeatureGrid() {
  return (
    <Section>
      <h2 className="text-lg font-display font-semibold text-ink mb-3">Explore</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.to}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.4, delay: i * 0.04, ease: 'easeOut' }}
            variants={reveal}
          >
            <Link
              to={`/app/${f.to}`}
              className="block bg-paper border border-stone rounded-xl p-4 shadow-[0_1px_0_#DAD3C1,0_8px_20px_-12px_rgba(59,70,48,0.35)] hover:-translate-y-1 hover:shadow-[0_1px_0_#DAD3C1,0_16px_28px_-14px_rgba(59,70,48,0.45)] transition-all duration-200"
            >
              <div className="font-medium text-ink text-sm mb-1">{f.label}</div>
              <div className="text-xs text-ink-soft leading-snug">{f.blurb}</div>
            </Link>
          </motion.div>
        ))}
      </div>
    </Section>
  );
}

function KpiCard({ label, value, accent, index }) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: 'easeOut' }}
      variants={reveal}
      className="relative bg-paper rounded-2xl p-5 text-center border border-stone
                 shadow-[0_1px_0_#DAD3C1,0_10px_24px_-14px_rgba(59,70,48,0.4)]
                 hover:-translate-y-1.5 hover:shadow-[0_1px_0_#DAD3C1,0_20px_32px_-16px_rgba(59,70,48,0.5)]
                 transition-all duration-200"
    >
      <span className="absolute top-0 left-5 right-5 h-1 rounded-full" style={{ background: accent }} />
      <div className="text-3xl font-display font-semibold text-ink mt-1">{value}</div>
      <div className="text-xs text-ink-soft mt-1.5">{label}</div>
    </motion.div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [stateWise, setStateWise] = useState([]);
  const [projectProgress, setProjectProgress] = useState([]);

  useEffect(() => {
    api.get('/dashboard/summary').then((r) => setSummary(r.data));
    api.get('/dashboard/state-wise').then((r) => setStateWise(r.data));
    api.get('/dashboard/project-progress').then((r) => setProjectProgress(r.data));
  }, []);

  if (!summary) return <div className="p-6 text-ink-soft">Loading dashboard…</div>;

  const kpis = [
    { label: 'Total Projects', value: summary.totalProjects, accent: CHART_COLORS[0] },
    { label: 'Land Parcels', value: summary.totalParcels, accent: CHART_COLORS[1] },
    { label: 'Possession Rate', value: `${summary.possessionRate}%`, accent: CHART_COLORS[2] },
    { label: 'Compensation Disbursed', value: `${summary.compensationDisbursementRate}%`, accent: CHART_COLORS[3] },
    { label: 'Families Resettled', value: `${summary.familiesResettled}/${summary.familiesTotal}`, accent: CHART_COLORS[4] },
  ];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <Section>
        <h1 className="text-2xl font-display font-semibold text-ink">National Dashboard</h1>
      </Section>

      <FeatureGrid />

      <Section>
        <h2 className="text-lg font-display font-semibold text-ink mb-3">Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {kpis.map((k, i) => (
            <KpiCard key={k.label} {...k} index={i} />
          ))}
        </div>
      </Section>

      <Section>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-paper rounded-2xl p-5 border border-stone shadow-[0_1px_0_#DAD3C1,0_10px_24px_-14px_rgba(59,70,48,0.35)]">
            <h2 className="font-display font-semibold text-ink mb-3">State-wise Compensation (Assessed vs Paid)</h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stateWise}>
                <XAxis dataKey="state" fontSize={12} stroke="#645D4C" />
                <YAxis fontSize={12} stroke="#645D4C" />
                <Tooltip formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`} />
                <Legend />
                <Bar dataKey="total_compensation" name="Assessed" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="paid_compensation" name="Paid" fill={CHART_COLORS[2]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-paper rounded-2xl p-5 border border-stone shadow-[0_1px_0_#DAD3C1,0_10px_24px_-14px_rgba(59,70,48,0.35)]">
            <h2 className="font-display font-semibold text-ink mb-3">Parcels Possessed by State</h2>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={stateWise} dataKey="possessed_count" nameKey="state" outerRadius={100} label>
                  {stateWise.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      <Section>
        <div className="bg-paper rounded-2xl p-5 border border-stone shadow-[0_1px_0_#DAD3C1,0_10px_24px_-14px_rgba(59,70,48,0.35)]">
          <h2 className="font-display font-semibold text-ink mb-3">Project-wise Progress</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-soft border-b border-stone">
                <th className="py-2 font-medium">Project</th>
                <th className="font-medium">State/District</th>
                <th className="font-medium">Status</th>
                <th className="font-medium">Parcels</th>
                <th className="font-medium">Possessed</th>
                <th className="font-medium">Compensated</th>
              </tr>
            </thead>
            <tbody>
              {projectProgress.map((p) => (
                <tr key={p.id} className="border-b border-stone/70 last:border-0">
                  <td className="py-2.5 font-medium text-ink">{p.name}</td>
                  <td className="text-ink-soft">{p.state}/{p.district}</td>
                  <td className="capitalize text-ink-soft">{p.status}</td>
                  <td className="text-ink-soft">{p.total_parcels}</td>
                  <td className="text-ink-soft">{p.possessed}</td>
                  <td className="text-ink-soft">{p.compensated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
