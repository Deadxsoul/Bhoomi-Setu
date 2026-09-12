import React, { useEffect, useState } from 'react';
import api from '../api/client';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Documents() {
  const [docs, setDocs] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [parcelId, setParcelId] = useState('');
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState(null);

  function load() {
    api.get('/documents').then((r) => setDocs(r.data));
    api.get('/parcels').then((r) => setParcels(r.data));
  }
  useEffect(load, []);

  async function upload(e) {
    e.preventDefault();
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    if (parcelId) fd.append('parcel_id', parcelId);
    const res = await api.post('/documents/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    setMessage(res.data);
    setFile(null);
    load();
  }

  return (
    <FeatureLayer id="documents" title="Documents" subtitle="Every upload is hashed — identical files are flagged as duplicates automatically.">
      <form onSubmit={upload} className="card grid md:grid-cols-3 gap-3 items-end">
        <select className="input" value={parcelId} onChange={(e) => setParcelId(e.target.value)}>
          <option value="">No specific parcel</option>
          {parcels.map((p) => <option key={p.id} value={p.id}>{p.parcel_code}</option>)}
        </select>
        <input className="input" type="file" onChange={(e) => setFile(e.target.files[0])} required />
        <button className="btn-primary">Upload & Check</button>
      </form>

      {message && (
        <div className={`card ${message.is_duplicate ? 'bg-red-50' : 'bg-green-50'}`}>
          <p className="text-sm font-medium">{message.message}</p>
          <p className="text-xs text-gray-500">Version: {message.version}</p>
        </div>
      )}

      <div className="card">
        <h2 className="font-semibold mb-3">All Documents</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-2">Filename</th>
              <th>Version</th>
              <th>Duplicate?</th>
              <th>Uploaded</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {docs.map((d) => (
              <tr key={d.id} className="border-b last:border-0">
                <td className="py-2">{d.filename}</td>
                <td>v{d.version}</td>
                <td>{d.is_duplicate ? <span className="badge-red">Duplicate</span> : <span className="badge-green">Unique</span>}</td>
                <td>{new Date(d.uploaded_at).toLocaleString('en-IN')}</td>
                <td><a className="text-brand-600 text-xs underline" href={`/api/documents/${d.id}/download`}>Download</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </FeatureLayer>
  );
}
