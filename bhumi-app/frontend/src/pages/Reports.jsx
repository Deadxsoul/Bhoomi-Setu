import React from 'react';
import FeatureLayer from '../components/FeatureLayer.jsx';

export default function Reports() {
  function download(type) {
    const token = localStorage.getItem('bhumi_token');
    // Direct link download with token as query isn't ideal for prod;
    // for demo simplicity we fetch with auth header and trigger a blob download.
    fetch(`/api/reports/${type}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = type === 'pdf' ? 'mis_report.pdf' : 'mis_report.xlsx';
        a.click();
        window.URL.revokeObjectURL(url);
      });
  }

  return (
    <FeatureLayer id="reports" title="Reports" subtitle="Downloadable summaries for officers — projects, parcels, and compensation.">
      <div className="card flex gap-4">
        <button className="btn-primary" onClick={() => download('pdf')}>⬇️ Download PDF Report</button>
        <button className="btn-secondary" onClick={() => download('excel')}>⬇️ Download Excel Report</button>
      </div>
    </FeatureLayer>
  );
}
