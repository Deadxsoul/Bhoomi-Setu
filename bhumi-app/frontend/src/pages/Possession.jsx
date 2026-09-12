import React, { useEffect, useState } from 'react';
import api from '../api/client';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Possession() {
  const [rows, setRows] = useState([]);
  const [parcels, setParcels] = useState([]);

  function load() {
    api.get('/possession').then((r) => setRows(r.data));
    api.get('/parcels').then((r) => setParcels(r.data));
  }
  useEffect(load, []);

  async function markHandedOver(parcelId) {
    const date = new Date().toISOString().slice(0, 10);
    await api.patch(`/possession/${parcelId}`, { handed_over: true, handover_date: date });
    load();
  }

  const trackedIds = new Set(rows.map((r) => r.parcel_id));
  const untracked = parcels.filter((p) => !trackedIds.has(p.id));

  return (
    <FeatureLayer id="possession" title="Possession" subtitle="Track which parcels have physically been handed over.">
      <div className="card">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Parcel</th>
              <th>Owner</th>
              <th>Handed Over?</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0">
                <td className="py-2 font-medium">{r.parcel_code}</td>
                <td>{r.owner_name}</td>
                <td>{r.handed_over ? <span className="badge-green">Yes</span> : <span className="badge-yellow">Pending</span>}</td>
                <td>{r.handover_date || '—'}</td>
                <td>
                  {!r.handed_over && (
                    <button className="btn-primary" onClick={() => markHandedOver(r.parcel_id)}>Mark Handed Over</button>
                  )}
                </td>
              </tr>
            ))}
            {untracked.map((p) => (
              <tr key={`u-${p.id}`} className="border-b last:border-0">
                <td className="py-2 font-medium">{p.parcel_code}</td>
                <td>{p.owner_name}</td>
                <td><span className="badge-yellow">Pending</span></td>
                <td>—</td>
                <td><button className="btn-primary" onClick={() => markHandedOver(p.id)}>Mark Handed Over</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeatureLayer>
  );
}
